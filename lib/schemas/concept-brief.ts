import { z } from 'zod';
import { PaletteEntry, ShotType, DerivedFromSchema } from './common';

export const ToolPrompts = z.object({
  midjourney: z.string(),
  flux: z.string(),
  nanoBanana: z.string(),
  gptImage: z.string(),
  ideogram: z.string(),
});
export type ToolPrompts = z.infer<typeof ToolPrompts>;

export const ShotRecipe = z.object({
  shotType: ShotType,
  lighting: z.string(),
  composition: z.string(),
  lens: z.string(),
  setting: z.string(),
  props: z.array(z.string()).default([]),
});

export const QualityGate = z.object({
  passed: z.boolean(),
  issues: z.array(z.object({
    field: z.string(),
    severity: z.enum(['warn', 'error']),
    message: z.string(),
  })).default([]),
});

export const Mandatory = z.object({
  item: z.string(),
  satisfied: z.boolean(),
});

export const ConceptBriefSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  angleId: z.string(),
  position: z.number().int().min(1).max(3),
  derivedFrom: DerivedFromSchema,

  themeStatement: z.string(),
  strategicRationale: z.string(),
  colorStory: z.array(PaletteEntry),
  typography: z.object({
    display: z.string(),
    body: z.string(),
    samples: z.object({ headline: z.string(), body: z.string() }),
  }),
  shotRecipe: ShotRecipe,
  copy: z.object({
    headline: z.string(),
    subhead: z.string().optional(),
    cta: z.string(),
  }),
  mandatories: z.array(Mandatory).default([]),
  prompts: ToolPrompts,
  negativePrompt: z.string(),
  qualityGate: QualityGate,
});

export type ConceptBrief = z.infer<typeof ConceptBriefSchema>;
