import * as cheerio from 'cheerio';

export type UrlMeta = {
  url: string;
  ok: boolean;
  finalUrl?: string;
  title?: string;
  description?: string;
  siteName?: string;
  ogImage?: string;
  jsonLdImages: string[];
  candidateImages: string[];
  error?: string;
};

// Rotating User-Agent pool — major sites block obvious scrapers.
// Each entry pairs a UA with a matching Accept-Language and Sec-CH-UA hints.
const UA_POOL: Array<{ ua: string; accept: string; lang: string }> = [
  {
    ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    lang: 'en-IN,en-GB;q=0.9,en;q=0.8',
  },
  {
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    lang: 'en-IN,en;q=0.9',
  },
  {
    ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    lang: 'en-IN,en;q=0.9',
  },
];

async function fetchHtmlWithRetry(url: string, timeoutMs: number): Promise<{ html: string; finalUrl: string } | { error: string }> {
  for (let i = 0; i < UA_POOL.length; i++) {
    const ua = UA_POOL[i];
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const referer = (() => {
        try { return new URL(url).origin + '/'; } catch { return 'https://www.google.com/'; }
      })();
      const res = await fetch(url, {
        headers: {
          'User-Agent': ua.ua,
          Accept: ua.accept,
          'Accept-Language': ua.lang,
          Referer: referer,
          'Cache-Control': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'cross-site',
          'Upgrade-Insecure-Requests': '1',
        },
        redirect: 'follow',
        signal: ac.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const html = await res.text();
        if (html && html.length > 200) return { html, finalUrl: res.url };
      } else if (res.status === 429 || res.status === 503) {
        // throttled — try next UA after a short backoff
        await new Promise((r) => setTimeout(r, 600));
        continue;
      } else if (res.status >= 400 && res.status < 500) {
        // 4xx — try next UA
        continue;
      }
    } catch (e) {
      clearTimeout(timer);
      if (i === UA_POOL.length - 1) {
        return { error: e instanceof Error ? e.message : 'fetch failed' };
      }
    }
  }
  return { error: 'all user-agents rejected (likely bot protection)' };
}

export async function fetchUrlMeta(url: string, timeoutMs = 8000): Promise<UrlMeta> {
  const result = await fetchHtmlWithRetry(url, timeoutMs);
  if ('error' in result) {
    return { url, ok: false, jsonLdImages: [], candidateImages: [], error: result.error };
  }
  const { html, finalUrl } = result;
  const $ = cheerio.load(html);

  const ogImage = $('meta[property="og:image"]').attr('content') ?? undefined;
  const title =
    $('meta[property="og:title"]').attr('content') ??
    $('title').first().text().trim() ??
    undefined;
  const description =
    $('meta[property="og:description"]').attr('content') ??
    $('meta[name="description"]').attr('content') ??
    undefined;
  const siteName = $('meta[property="og:site_name"]').attr('content') ?? undefined;

  const jsonLdImages: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text();
    try {
      const data = JSON.parse(text);
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) collectJsonLdImages(item, jsonLdImages);
    } catch {
      /* ignore malformed */
    }
  });

  const twitterImage = $('meta[name="twitter:image"]').attr('content') ?? undefined;

  const candidateImages = new Set<string>();
  if (ogImage) candidateImages.add(normalizeUrl(ogImage, finalUrl));
  if (twitterImage) candidateImages.add(normalizeUrl(twitterImage, finalUrl));
  for (const img of jsonLdImages) candidateImages.add(normalizeUrl(img, finalUrl));
  $('img').each((_, el) => {
    const src = $(el).attr('src') ?? $(el).attr('data-src') ?? $(el).attr('data-original') ?? '';
    if (!src) return;
    if (/logo|icon|sprite|banner-ad|sponsor|avatar|favicon|loader|spinner/i.test(src)) return;
    const w = Number($(el).attr('width') ?? 0);
    const h = Number($(el).attr('height') ?? 0);
    if ((w && w < 200) || (h && h < 200)) return;
    candidateImages.add(normalizeUrl(src, finalUrl));
  });

  return {
    url,
    ok: true,
    finalUrl,
    title,
    description,
    siteName,
    ogImage: ogImage ? normalizeUrl(ogImage, finalUrl) : undefined,
    jsonLdImages,
    candidateImages: Array.from(candidateImages).slice(0, 8),
  };
}

function collectJsonLdImages(node: unknown, out: string[]) {
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;
  const img = obj.image;
  if (typeof img === 'string') out.push(img);
  if (Array.isArray(img)) {
    for (const i of img) {
      if (typeof i === 'string') out.push(i);
      else if (i && typeof i === 'object' && 'url' in i && typeof (i as { url: unknown }).url === 'string') {
        out.push((i as { url: string }).url);
      }
    }
  }
  if (obj['@graph'] && Array.isArray(obj['@graph'])) {
    for (const sub of obj['@graph'] as unknown[]) collectJsonLdImages(sub, out);
  }
}

function normalizeUrl(maybeRelative: string, base: string): string {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return maybeRelative;
  }
}

/**
 * Fallback when direct site scraping is blocked: hit DuckDuckGo's image
 * search HTML endpoint, which does not require a key and returns image URLs
 * inline in JS. Best-effort; if the layout shifts the parser can return
 * an empty array and the caller falls back to user-supplied URLs.
 */
export async function searchImagesByQuery(query: string, max = 6): Promise<string[]> {
  const q = encodeURIComponent(query);
  const ua = UA_POOL[0].ua;
  // Step 1: get the vqd token from the HTML
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 8000);
  try {
    const res = await fetch(`https://duckduckgo.com/?q=${q}&iar=images&iax=images&ia=images`, {
      headers: { 'User-Agent': ua, Accept: 'text/html,*/*' },
      signal: ac.signal,
    });
    const html = await res.text();
    const vqdMatch = html.match(/vqd=['"]?([\w-]+)['"]?/);
    if (!vqdMatch) return [];
    const vqd = vqdMatch[1];

    const jsonRes = await fetch(
      `https://duckduckgo.com/i.js?l=in-en&o=json&q=${q}&vqd=${vqd}&f=,,,,,&p=1`,
      {
        headers: {
          'User-Agent': ua,
          Accept: 'application/json',
          Referer: 'https://duckduckgo.com/',
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: ac.signal,
      }
    );
    if (!jsonRes.ok) return [];
    const data = await jsonRes.json();
    const results: Array<{ image?: string }> = Array.isArray(data?.results) ? data.results : [];
    return results
      .map((r) => r.image)
      .filter((u): u is string => typeof u === 'string' && /^https?:\/\//.test(u))
      .slice(0, max);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
