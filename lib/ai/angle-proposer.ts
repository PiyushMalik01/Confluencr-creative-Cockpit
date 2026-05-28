import type { Brief } from '@/lib/schemas/brief';
import type { StyleReport } from '@/lib/schemas/style-report';
import type { AngleProposal } from '@/lib/schemas/angle';

export const ANGLE_PROPOSER_INSTRUCTIONS = `You propose strategic angles for product imagery.

You will receive a brand brief and a competitor StyleReport. Propose exactly 5 angles for this product,
ranked by white-space (i.e. how DIFFERENT they are from what competitors are doing).

Use ONLY this controlled vocabulary for angle names:
- Aspirational (trifecta: Aspirational)
- Rational (trifecta: Rational)
- Emotional (trifecta: Emotional)
- Problem-Solution (trifecta: Rational)
- Social-Proof (trifecta: Social)
- Transformation (trifecta: Emotional)
- Scarcity (trifecta: Aspirational)
- Value (trifecta: Rational)

The user will pick 3 of your 5 proposals. Ensure your 5 span at least 3 different trifecta families
(Rational / Emotional / Aspirational / Social) so the user has meaningful choices.

Output a single JSON object EXACTLY matching this TypeScript type. No markdown, no commentary.

type Output = {
  proposed: {
    name: "Aspirational"|"Rational"|"Emotional"|"Problem-Solution"|"Social-Proof"|"Transformation"|"Scarcity"|"Value";
    rationale: string;        // why this angle fits THIS brand (1-2 sentences)
    whitespaceClaim: string;  // which competitor pattern this contradicts or avoids
    palette: { hex: "#RRGGBB"; role: "primary"|"accent"|"neutral"|"background" }[]; // 2-4 entries
    typography: { display: string; body: string };
    sampleHeadline: string;   // 2-5 words, all caps OK if brand-appropriate
    confidence: number;       // 0..1 (your self-rated fit)
  }[];
};

Rules:
- Exactly 5 entries.
- No two entries with the SAME name.
- Each rationale must reference at least one specific competitor token from the StyleReport.
- Palette must be on-brand (use brief.brand.palette) UNLESS the angle is explicitly Aspirational/Premium
  where a higher-contrast or moodier variant is justified by the rationale.
- typography.display and typography.body are font family names or named pairings ("Bebas Neue", "Inter").
- sampleHeadline must be punchy and ON BRAND (use the brief's voiceOpposites).

Be specific. Operator vocabulary. Indian D2C context when applicable.`;

export function buildAnglePrompt(brief: Brief, style: StyleReport | null): string {
  const lines: string[] = [];
  lines.push('# BRAND BRIEF');
  lines.push(`Name: ${brief.product.name}`);
  if (brief.product.category) lines.push(`Category: ${brief.product.category}`);
  if (brief.audience.description) lines.push(`Audience: ${brief.audience.description}`);
  if (brief.audience.insight) lines.push(`Insight: ${brief.audience.insight}`);
  if (brief.strategy.smp) lines.push(`Single-minded proposition: ${brief.strategy.smp}`);
  if (brief.strategy.rtbs.length > 0) lines.push(`RTBs: ${brief.strategy.rtbs.join(' | ')}`);
  if (brief.brand.palette.length > 0) {
    lines.push(
      `Brand palette: ${brief.brand.palette
        .map((p) => `${p.hex} (${p.role}, ${Math.round(p.ratio * 100)}%)`)
        .join(', ')}`
    );
  }
  if (brief.brand.voiceOpposites.length > 0) {
    lines.push(`Brand voice: ${brief.brand.voiceOpposites.map((v) => `${v.x} NOT ${v.y}`).join(' | ')}`);
  }
  if (brief.references.doNotInclude.length > 0) {
    lines.push(`Do-not-include: ${brief.references.doNotInclude.join('; ')}`);
  }
  lines.push('');

  if (style) {
    lines.push('# COMPETITOR STYLE REPORT (this is what competitors are doing)');
    lines.push(
      `Palette: ${style.palette.map((p) => `${p.hex} ${p.role} ${Math.round(p.ratio * 100)}%`).join(', ')}`
    );
    lines.push(`Lighting: ${style.lighting}`);
    lines.push(`Composition: ${style.composition}`);
    lines.push(`Props: ${style.props.join(', ')}`);
    lines.push(`Copy patterns: ${style.copyPatterns.join(', ')}`);
    lines.push(`Audience signal: ${style.audienceSignal}`);
    lines.push(`Negative patterns (avoid these): ${style.negativePatterns.join(', ')}`);
    lines.push('');
  } else {
    lines.push('# No competitor style report available. Propose angles based on the brief alone.');
    lines.push('');
  }

  lines.push('Return ONLY the JSON object with the "proposed" array of 5 entries.');
  return lines.join('\n');
}

export type AngleProposerOutput = {
  proposed: Omit<AngleProposal, 'id' | 'custom' | 'microThumbnailUrl'>[];
};
