import { z } from 'zod';
import { AspectRatio, DerivedFromSchema } from './common';

export const Tool = z.enum(['midjourney', 'flux', 'nano-banana', 'gpt-image', 'ideogram']);
export type Tool = z.infer<typeof Tool>;

export const PromptCard = z.object({
  heading: z.string(),
  description: z.string(),
  prompt: z.string(),
  tool: Tool,
  aspectRatio: AspectRatio,
  conceptId: z.string(),
});
export type PromptCard = z.infer<typeof PromptCard>;

export const PromptDeckSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  derivedFrom: DerivedFromSchema,
  cards: z.array(PromptCard),
});
export type PromptDeck = z.infer<typeof PromptDeckSchema>;

export const GeneratedImageSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  conceptBriefId: z.string(),
  surface: AspectRatio,
  modelUsed: z.string(),
  provider: z.string(),
  prompt: z.string(),
  imageUrl: z.string(),
  generatedAt: z.coerce.date(),
});
export type GeneratedImage = z.infer<typeof GeneratedImageSchema>;
