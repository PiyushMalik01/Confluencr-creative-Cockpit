import type { Brief } from '@/lib/schemas/brief';
import type { StyleReport } from '@/lib/schemas/style-report';
import type { AngleProposal } from '@/lib/schemas/angle';
import type { ConceptBrief } from '@/lib/schemas/concept-brief';

export const CONCEPT_GENERATOR_INSTRUCTIONS = `You are an art director writing an EXECUTION-READY image concept brief at the craft level of Wallpaper*, Kinfolk, i-D, and Hasselblad commercial product photography. The prompts you produce must be specific enough that a designer or an image-gen model can render world-class output without guessing a single setting.

You receive: a brand brief, the competitor StyleReport, and ONE strategic angle.
Produce a SINGLE concept brief for THIS angle.

Output a JSON object EXACTLY matching this TypeScript type. No markdown, no commentary.

type Output = {
  themeStatement: string;
  strategicRationale: string;
  colorStory: { hex: "#RRGGBB"; role: "primary"|"accent"|"neutral"|"background"; ratio: number }[];
  typography: { display: string; body: string; samples: { headline: string; body: string } };
  shotRecipe: {
    shotType: "hero"|"lifestyle"|"detail"|"infographic"|"in-use"|"scale"|"packaging"|"comparison"|"social-proof";
    lighting: string; composition: string; lens: string; setting: string; props: string[];
  };
  craft: {
    lensSpec: {
      sensor: string;            // "medium format (Phase One IQ4 150MP)", "full-frame Sony A7R V", "APS-C Fujifilm X-T5"
      focalLength: string;       // "35mm prime" / "100mm macro" / "85mm portrait"
      aperture: string;          // "f/2.8 — shallow but plane stays sharp" / "f/8 hyperfocal"
      shutter?: string;          // "1/200s strobe sync"
      iso?: string;              // "ISO 100 base"
      depthOfField: string;      // "shallow at f/2, focus on chest print, foreground props melt at 25cm"
    };
    lighting: {
      key: { modifier: string; angleDeg: string; temperatureK: number; intensityStops?: string };
      fill?: { modifier: string; ratio: string; temperatureK?: number };
      rim?: { modifier: string; angleDeg: string; temperatureK: number };
      ambient?: string;
      shadowDensity: number;     // 0..1
      notes?: string;
    };
    material: {
      subjectMaterial: string;
      subsurfaceCue?: string;
      specularIntensity: string;
      microfacetRoughness?: string;
      brdfNotes?: string;
      postSheen?: string;
    };
    post: {
      grainISO: string;
      gradeShadows: string;
      gradeHighlights: string;
      contrastCurve: string;
      vignette?: string;
      lutStyle?: string;
    };
    references: {
      photographers: string[];     // cite a TECHNIQUE not just a name (e.g. "Petra-Collins-grammar flash, not just 'Petra Collins'")
      publications: string[];      // Kinfolk, i-D, Wallpaper*, Apartamento, Cereal
      brandCampaigns: string[];    // Aimé Leon Dore, Visvim, Patagonia Worn Wear — for technique, not palette
      cinematicTouchstones: string[];
      notes?: string;
    };
    audiencePixels: {
      propLanguage: string;     // what props encode the audience (Gen Z dorm, premium minimal, kirana warmth, etc.)
      framingLanguage: string;  // composition signals (on-axis hero, environmental wide, etc.)
      gradeLanguage: string;    // grade cues (Portra warm shadows, teal-orange premium, neutral marketplace)
      grainLanguage?: string;
    };
    thinking: string;           // 3-5 sentence paragraph: WHY this craft stack works for this angle on this brand
  };
  copy: { headline: string; subhead?: string; cta: string };
  mandatories: { item: string; satisfied: boolean }[];
  prompts: {
    midjourney: string;     // include specific kelvin temperatures, fill ratios, lens spec, post grade. End with --ar X:Y --raw --stylize N --no <negatives>
    flux: string;           // imperative voice "Render a..." + photometric/optical/spatial/material/post blocks
    nanoBanana: string;     // narrative natural language + multi-image conditioning hints + explicit on-image text
    gptImage: string;       // conversational, intent-first then constraints
    ideogram: string;       // typography-first with font + weight + tracking + hex + pixel inset for every text element
  };
  negativePrompt: string;   // include surface-specific negatives ("no specular blowout on tee shoulder", "no warped chest-print typography")
};

CRAFT-DEPTH HARD RULES — these are what separate a generic prompt from a ship-it one:

1. PHOTOMETRIC BLOCK in every prompt: state key kelvin (e.g. 5500K), angle azimuth + elevation in degrees, fill ratio (1:2 / 1:4 / 1:8), rim kelvin + angle, shadow density 0..1. Replace "soft lighting" forever.

2. OPTICAL BLOCK: sensor format (medium-format / full-frame / APS-C), focal mm, aperture, focus point, DOF band, lens artifacts ("mild chromatic aberration on highlight edges").

3. SPATIAL BLOCK: subject_offset_x_pct, subject_offset_y_pct, headroom_pct, headline-safe top-22%, logo-safe bottom-14%, channel-specific safe zones (Amazon main ≥85%, Reels 9:16 central 60% band).

4. MATERIAL BLOCK per surface: roughness (0..1), subsurface depth, fresnel cue, microfacet anisotropy axis for brushed metals / woven textiles.

5. POST BLOCK: grain ISO equivalent, grade shadows + highlights with exact hex, LUT emulation name (Portra 400 / Fuji Pro 400H / neutral commercial / teal-orange premium), vignette %.

6. REFERENCE BLOCK: cite TECHNIQUE not photographer name alone. "Petra-Collins-grammar on-camera flash" not "by Petra Collins". "Hasselblad H6D studio key recipe" not "Hasselblad style".

7. ON-IMAGE TEXT: render EXACTLY in the prompt — font family, weight, tracking, leading, exact hex, exact pt-equivalent, exact inset percentage. Ideogram and Nano Banana Pro reward this. Wrap headlines in quotes.

8. NEGATIVES-PER-SURFACE: don't just "no blur" — "no specular blowout on tee shoulder", "no warped chest-print typography", "no plastic-glossy sheen on cotton".

9. CHANNEL-SPECIFIC ADJUSTMENTS: include the actual aspect (1:1 / 4:5 / 9:16 / 16:9) and per-channel safe zones in the prompt.

10. INDIAN D2C SIGNATURES: if brand is Bewakoof — Petra-Collins flash + Druk Wide headline + magenta gel rim + ISO-800 grain. If Mamaearth — Kinfolk window + ingredient floats + pastel palette + Devanagari/Latin bilingual headline. If Nykaa — clamshell + porcelain tile + medium-format tonal roll-off + Didone serif. If Decathlon — 35mm reportage + motion blur + outdoor context.

11. PROMPT LENGTH GUIDE: Flux ~200-350 words. Nano Banana Pro ~180-280. Ideogram ~150-250 (typography heavy). Midjourney ~120-200 + flags. GPT-Image ~150-250 conversational.

Output ONLY the JSON. No fences, no prose.`;

export function buildConceptPrompt(args: {
  brief: Brief;
  style: StyleReport | null;
  angle: AngleProposal;
}): string {
  const { brief, style, angle } = args;
  const lines: string[] = [];

  lines.push('# BRAND BRIEF');
  lines.push(`Product: ${brief.product.name}`);
  if (brief.product.oneLiner) lines.push(`One-liner: ${brief.product.oneLiner}`);
  if (brief.product.category) lines.push(`Category: ${brief.product.category}`);
  lines.push(`Audience: ${brief.audience.description}`);
  if (brief.audience.insight) lines.push(`Insight: ${brief.audience.insight}`);
  lines.push(`Single-minded proposition: ${brief.strategy.smp}`);
  if (brief.strategy.rtbs.length > 0) lines.push(`RTBs: ${brief.strategy.rtbs.join(' | ')}`);
  lines.push(
    `Brand palette: ${brief.brand.palette
      .map((p) => `${p.hex} (${p.role}, ${Math.round(p.ratio * 100)}%)`)
      .join(', ') || '(none)'}`
  );
  if (brief.brand.typography) lines.push(`Brand typography: ${brief.brand.typography}`);
  if (brief.brand.voiceOpposites.length > 0)
    lines.push(`Voice: ${brief.brand.voiceOpposites.map((v) => `${v.x} NOT ${v.y}`).join(' | ')}`);
  if (brief.references.doNotInclude.length > 0)
    lines.push(`Do-not-include: ${brief.references.doNotInclude.join('; ')}`);
  if (brief.surfaces.mandatories.length > 0) lines.push(`Mandatories: ${brief.surfaces.mandatories.join('; ')}`);
  lines.push(`Primary surface (use this aspect): ${brief.surfaces.aspectRatios[0] ?? '1:1'}`);
  lines.push('');

  if (style) {
    lines.push('# COMPETITOR STYLE REPORT (avoid these patterns; differentiate)');
    lines.push(`Lighting: ${style.lighting}`);
    lines.push(`Composition: ${style.composition}`);
    lines.push(`Props: ${style.props.join(', ')}`);
    lines.push(`Audience signal: ${style.audienceSignal}`);
    lines.push(`Negative patterns: ${style.negativePatterns.join(', ')}`);
    lines.push('');
  }

  lines.push('# THE ANGLE TO EXECUTE');
  lines.push(`Name: ${angle.name}`);
  lines.push(`Rationale: ${angle.rationale}`);
  lines.push(`Whitespace claim: ${angle.whitespaceClaim}`);
  lines.push(`Suggested palette: ${angle.palette.map((p) => `${p.hex} (${p.role})`).join(', ')}`);
  lines.push(`Suggested typography: ${angle.typography.display} + ${angle.typography.body}`);
  lines.push(`Sample headline: "${angle.sampleHeadline}"`);
  lines.push('');
  lines.push('Return ONLY the JSON object for this concept.');
  return lines.join('\n');
}

export type ConceptGeneratorOutput = Omit<
  ConceptBrief,
  '_id' | 'projectId' | 'angleId' | 'position' | 'derivedFrom' | 'qualityGate'
>;

export function runQualityGate({
  brief,
  result,
}: {
  brief: Brief;
  result: ConceptGeneratorOutput;
}): { passed: boolean; issues: { field: string; severity: 'warn' | 'error'; message: string }[] } {
  const issues: { field: string; severity: 'warn' | 'error'; message: string }[] = [];

  const allPrompts = [
    result.prompts.midjourney,
    result.prompts.flux,
    result.prompts.nanoBanana,
    result.prompts.gptImage,
    result.prompts.ideogram,
  ]
    .join(' | ')
    .toLowerCase();

  for (const m of brief.surfaces.mandatories) {
    const tokens = m.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
    const hit = tokens.some((t) => allPrompts.includes(t));
    if (!hit) {
      issues.push({
        field: 'prompts',
        severity: 'warn',
        message: `Mandatory "${m}" not referenced in any prompt variant.`,
      });
    }
  }

  for (const dni of brief.references.doNotInclude) {
    const tokens = dni.toLowerCase().split(/\s+/).filter((t) => t.length >= 3);
    const inNeg = result.negativePrompt.toLowerCase();
    const hit = tokens.some((t) => inNeg.includes(t));
    if (!hit) {
      issues.push({
        field: 'negativePrompt',
        severity: 'warn',
        message: `Do-not-include "${dni}" not present in negative prompt.`,
      });
    }
  }

  const brandHexes = new Set(brief.brand.palette.map((p) => p.hex.toLowerCase()));
  const conceptHexes = new Set(result.colorStory.map((p) => p.hex.toLowerCase()));
  const overlap = [...brandHexes].some((h) => conceptHexes.has(h));
  if (brandHexes.size > 0 && !overlap) {
    issues.push({
      field: 'colorStory',
      severity: 'warn',
      message: 'No brand palette colour appears in the concept color story.',
    });
  }

  return { passed: issues.filter((i) => i.severity === 'error').length === 0, issues };
}
