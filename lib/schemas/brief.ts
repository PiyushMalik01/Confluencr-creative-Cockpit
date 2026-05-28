import { z } from 'zod';
import { Hex, PaletteEntry, AspectRatio } from './common';

export const PhotoInput = z.object({
  kind: z.enum(['upload', 'url', 'text']),
  url: z.string().optional(),
  fidelityTier: z.enum(['high', 'medium', 'low']),
});
export type PhotoInput = z.infer<typeof PhotoInput>;

export const VoiceOpposite = z.object({
  x: z.string(),
  y: z.string(),
});
export type VoiceOpposite = z.infer<typeof VoiceOpposite>;

export const CompetitorRef = z.object({
  kind: z.enum(['url', 'upload', 'name']),
  value: z.string(),
});
export type CompetitorRef = z.infer<typeof CompetitorRef>;

export const BriefSchema = z.object({
  _id: z.string(),
  projectId: z.string(),

  product: z.object({
    name: z.string().default(''),
    oneLiner: z.string().default(''),
    photos: z.array(PhotoInput).default([]),
    priceTier: z.string().optional(),
    category: z.string().optional(),
  }),

  audience: z.object({
    description: z.string().default(''),
    signalPreset: z.string().optional(),
    insight: z.string().default(''),
  }),

  strategy: z.object({
    smp: z.string().default(''),
    rtbs: z.array(z.string()).default([]),
  }),

  brand: z.object({
    palette: z.array(PaletteEntry).default([]),
    typography: z.string().optional(),
    voiceOpposites: z.array(VoiceOpposite).default([]),
    logo: z.string().optional(),
  }),

  references: z.object({
    competitorMode: z.enum(['url', 'upload', 'name']).default('url'),
    inputs: z.array(CompetitorRef).default([]),
    doNotInclude: z.array(z.string()).default([]),
    moodImages: z.array(z.string()).default([]),
  }),

  surfaces: z.object({
    aspectRatios: z.array(AspectRatio).default(['1:1']),
    mandatories: z.array(z.string()).default([]),
  }),

  updatedAt: z.coerce.date(),
});

export type Brief = z.infer<typeof BriefSchema>;

export function emptyBrief(projectId: string, briefId: string): Brief {
  return {
    _id: briefId,
    projectId,
    product: { name: '', oneLiner: '', photos: [] },
    audience: { description: '', insight: '' },
    strategy: { smp: '', rtbs: [] },
    brand: { palette: [], voiceOpposites: [] },
    references: { competitorMode: 'url', inputs: [], doNotInclude: [], moodImages: [] },
    surfaces: { aspectRatios: ['1:1'], mandatories: [] },
    updatedAt: new Date(),
  };
}
