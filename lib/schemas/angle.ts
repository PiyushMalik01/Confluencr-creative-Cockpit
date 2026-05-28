import { z } from 'zod';
import { PaletteEntry, AngleName, DerivedFromSchema } from './common';

export const AngleProposal = z.object({
  id: z.string(),
  name: AngleName,
  rationale: z.string(),
  whitespaceClaim: z.string(),
  palette: z.array(PaletteEntry),
  typography: z.object({ display: z.string(), body: z.string() }),
  sampleHeadline: z.string(),
  confidence: z.number().min(0).max(1),
  microThumbnailUrl: z.string().optional(),
  custom: z.boolean().default(false),
});
export type AngleProposal = z.infer<typeof AngleProposal>;

export const AngleProposalDocSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  derivedFrom: DerivedFromSchema,
  angles: z.array(AngleProposal),
  pickedAngleIds: z.array(z.string()).default([]),
  pickedOrder: z.array(z.number().int()).default([]),
});
export type AngleProposalDoc = z.infer<typeof AngleProposalDocSchema>;
