import { z } from 'zod';

export const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const PaletteEntry = z.object({
  hex: Hex,
  role: z.string(),
  ratio: z.number().min(0).max(1),
});
export type PaletteEntry = z.infer<typeof PaletteEntry>;

export const DerivedFromSchema = z.object({
  editEpochAtGeneration: z.number().int().nonnegative(),
  modelUsed: z.string(),
  provider: z.enum(['chatgpt', 'openai', 'anthropic', 'google', 'fal', 'ideogram', 'manual']),
  generatedAt: z.coerce.date(),
  manualEdits: z.array(z.string()).default([]),
});
export type DerivedFrom = z.infer<typeof DerivedFromSchema>;

export const AspectRatio = z.enum(['1:1', '4:5', '9:16', '16:9']);
export type AspectRatio = z.infer<typeof AspectRatio>;

export const ShotType = z.enum([
  'hero', 'lifestyle', 'detail', 'infographic', 'in-use', 'scale', 'packaging', 'comparison', 'social-proof',
]);
export type ShotType = z.infer<typeof ShotType>;

export const AngleName = z.enum([
  'Aspirational', 'Rational', 'Emotional', 'Problem-Solution', 'Social-Proof', 'Transformation', 'Scarcity', 'Value',
]);
export type AngleName = z.infer<typeof AngleName>;

export const TRIFECTA_FAMILY: Record<AngleName, 'Rational' | 'Emotional' | 'Aspirational' | 'Social'> = {
  Rational: 'Rational',
  'Problem-Solution': 'Rational',
  Value: 'Rational',
  Emotional: 'Emotional',
  Transformation: 'Emotional',
  Aspirational: 'Aspirational',
  Scarcity: 'Aspirational',
  'Social-Proof': 'Social',
};
