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

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';

export async function fetchUrlMeta(url: string, timeoutMs = 8000): Promise<UrlMeta> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*;q=0.8' },
      redirect: 'follow',
      signal: ac.signal,
    });
    if (!res.ok) {
      return {
        url,
        ok: false,
        jsonLdImages: [],
        candidateImages: [],
        error: `HTTP ${res.status}`,
      };
    }
    const finalUrl = res.url;
    const html = await res.text();
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
        for (const item of arr) {
          collectJsonLdImages(item, jsonLdImages);
        }
      } catch {
        /* ignore malformed */
      }
    });

    const candidateImages = new Set<string>();
    if (ogImage) candidateImages.add(normalizeUrl(ogImage, finalUrl));
    for (const img of jsonLdImages) candidateImages.add(normalizeUrl(img, finalUrl));
    $('img').each((_, el) => {
      const src = $(el).attr('src') ?? $(el).attr('data-src') ?? '';
      if (!src) return;
      if (/logo|icon|sprite|banner-ad|sponsor|avatar/i.test(src)) return;
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
  } catch (e) {
    return {
      url,
      ok: false,
      jsonLdImages: [],
      candidateImages: [],
      error: e instanceof Error ? e.message : 'fetch failed',
    };
  } finally {
    clearTimeout(timer);
  }
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
