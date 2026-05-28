import { z } from 'zod';
import { PaletteEntry, DerivedFromSchema } from './common';

export const CompetitorImage = z.object({
  url: z.string(),
  source: z.string(),
  pinned: z.boolean().default(true),
  classification: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});
export type CompetitorImage = z.infer<typeof CompetitorImage>;

export const Evidence = z.object({
  imageIdx: z.number().int().nonnegative(),
  claim: z.string(),
});
export type Evidence = z.infer<typeof Evidence>;

export const StyleReportSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  derivedFrom: DerivedFromSchema,
  competitorImages: z.array(CompetitorImage),
  palette: z.array(PaletteEntry.extend({ evidenceImageIdx: z.number().int().nonnegative() })),
  lighting: z.string(),
  composition: z.string(),
  props: z.array(z.string()),
  copyPatterns: z.array(z.string()),
  audienceSignal: z.string(),
  negativePatterns: z.array(z.string()),
  evidence: z.array(Evidence),
});

export type StyleReport = z.infer<typeof StyleReportSchema>;
