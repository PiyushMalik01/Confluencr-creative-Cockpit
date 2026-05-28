import type { Brief } from '@/lib/schemas/brief';
import type { StyleReport } from '@/lib/schemas/style-report';
import type { UrlMeta } from '@/lib/scraping/url-meta';

export type StyleExtractorInput = {
  brief: Brief;
  metas: UrlMeta[];
  brandNameRefs: string[];
};

export const STYLE_EXTRACTOR_INSTRUCTIONS = `You are a senior creative strategist who reads competitor product pages and extracts the
visual style patterns that an art director would brief a designer with.

Output a single JSON object that matches this TypeScript type EXACTLY (no commentary, no markdown):

type StyleReport = {
  palette: { hex: "#RRGGBB"; role: "primary"|"accent"|"neutral"|"background"; ratio: number; evidenceImageIdx: number }[];
  lighting: string;
  composition: string;
  props: string[];
  copyPatterns: string[];
  audienceSignal: string;
  negativePatterns: string[];
  evidence: { imageIdx: number; claim: string }[];
};

Rules:
- 3 to 5 palette entries. ratios must sum to 1.0. hex must be 6-digit "#RRGGBB".
- Every palette entry MUST cite an evidenceImageIdx that exists in the input.
- "lighting", "composition", "audienceSignal" are short phrases (max ~12 words each).
- props, copyPatterns, negativePatterns are 3-6 short noun phrases each.
- evidence array must have at least 4 entries, each grounded to a specific image index.
- No image, no claim. If you cannot ground a claim, omit it.

Be concrete, not generic. Operator vocabulary. Indian D2C context if applicable.`;

export function buildStyleExtractorPrompt(input: StyleExtractorInput): string {
  const { brief, metas, brandNameRefs } = input;
  const lines: string[] = [];

  lines.push('# THIS BRAND (the one whose style we are NOT extracting)');
  lines.push(`Name: ${brief.product.name || '(unspecified)'}`);
  if (brief.product.category) lines.push(`Category: ${brief.product.category}`);
  if (brief.audience.description) lines.push(`Audience: ${brief.audience.description}`);
  if (brief.strategy.smp) lines.push(`Single-minded proposition: ${brief.strategy.smp}`);
  const heroPhoto = brief.product.photos[0];
  if (heroPhoto && heroPhoto.url) {
    lines.push(`Our product hero photo: ${heroPhoto.url}`);
    lines.push('When proposing tokens, contrast our actual product against the competitors — what visual moves would differentiate THIS product from those?');
  }
  lines.push('');

  lines.push('# COMPETITOR VISUAL EVIDENCE (analyse these and ground every claim to an image index)');
  let idx = 0;
  for (const meta of metas) {
    if (!meta.ok) {
      lines.push(`Image ${idx}: <FAILED TO FETCH: ${meta.error}>`);
      idx++;
      continue;
    }
    lines.push(`Image ${idx}:`);
    if (meta.siteName) lines.push(`  site: ${meta.siteName}`);
    if (meta.title) lines.push(`  title: ${meta.title}`);
    if (meta.description) lines.push(`  description: ${meta.description}`);
    if (meta.ogImage) lines.push(`  ogImage: ${meta.ogImage}`);
    lines.push(`  url: ${meta.finalUrl ?? meta.url}`);
    lines.push('');
    idx++;
  }

  if (brandNameRefs.length > 0) {
    lines.push('# COMPETITOR BRAND NAMES (use your training knowledge of these brands as additional evidence)');
    for (const name of brandNameRefs) {
      lines.push(`Image ${idx}: brand name "${name}"`);
      idx++;
    }
    lines.push('');
  }

  lines.push('Return ONLY the JSON object. No fences, no prose.');
  return lines.join('\n');
}

export type ParsedStyleReport = Pick<
  StyleReport,
  'palette' | 'lighting' | 'composition' | 'props' | 'copyPatterns' | 'audienceSignal' | 'negativePatterns' | 'evidence'
>;
