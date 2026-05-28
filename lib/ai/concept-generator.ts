import type { Brief } from '@/lib/schemas/brief';
import type { StyleReport } from '@/lib/schemas/style-report';
import type { AngleProposal } from '@/lib/schemas/angle';
import type { ConceptBrief } from '@/lib/schemas/concept-brief';

export const CONCEPT_GENERATOR_INSTRUCTIONS = `You are an art director writing an execution-ready image concept brief.

You receive: a brand brief, the competitor StyleReport, and ONE strategic angle.
Produce a SINGLE concept brief for THIS angle that an image-gen AI or a designer can execute without guessing.

Output a JSON object EXACTLY matching this TypeScript type. No markdown, no commentary.

type Output = {
  themeStatement: string;            // 1 line, headline-like
  strategicRationale: string;        // 1 paragraph, why this WORKS for this brand+angle
  colorStory: { hex: "#RRGGBB"; role: "primary"|"accent"|"neutral"|"background"; ratio: number }[];  // 3-4 entries, ratios sum to 1.0
  typography: {
    display: string;                  // font name
    body: string;                     // font name
    samples: { headline: string; body: string };  // sample text in the picked voice
  };
  shotRecipe: {
    shotType: "hero"|"lifestyle"|"detail"|"infographic"|"in-use"|"scale"|"packaging"|"comparison"|"social-proof";
    lighting: string;                 // e.g. "golden-hour window light + soft rim"
    composition: string;              // e.g. "centred subject, top-third negative space for headline"
    lens: string;                     // e.g. "85mm macro" or "wide 35mm"
    setting: string;                  // e.g. "tan corrugated paper backdrop"
    props: string[];                  // 0-4 props
  };
  copy: { headline: string; subhead?: string; cta: string };
  mandatories: { item: string; satisfied: boolean }[];  // echo the brief's mandatories, mark satisfied based on whether the prompts include them
  prompts: {
    midjourney: string;               // terse, weight syntax, --ar --style; product noun first
    flux: string;                     // descriptive structured natural language
    nanoBanana: string;               // natural language conversational, OK with text-on-image needs
    gptImage: string;                 // conversational, clear
    ideogram: string;                 // poster/typography-aware, explicit fonts
  };
  negativePrompt: string;             // single string of comma-separated negatives
};

CRITICAL prompt skeleton (apply to every tool variant):
Subject · Setting · Lighting · Composition · Lens · Style · Color · Aspect · Negative

Hard rules:
- shotRecipe.shotType must match the angle family. Aspirational → hero/lifestyle/detail. Rational/Problem-Solution → infographic/detail/comparison. Emotional → lifestyle/in-use. Social-Proof → social-proof/comparison.
- Every mandatory from the brief MUST appear (paraphrased OK) in the prompts.
- Every do-not-include item from the brief MUST appear in negativePrompt.
- Use the brand palette hex codes EXPLICITLY in the prompts where relevant ("hot yellow #FFCC00 background").
- For aspect ratio in prompts: include the FIRST surface from brief.surfaces.aspectRatios as the explicit aspect.
- Headline must respect the brand voice opposites.
- Be specific, not generic. Operator vocabulary.
- Indian D2C context if applicable.`;

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
