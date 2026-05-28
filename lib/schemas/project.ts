import { z } from 'zod';

export const ProjectSchema = z.object({
  _id: z.string(),
  createdAt: z.coerce.date(),
  lastTouchedAt: z.coerce.date(),
  editEpoch: z.number().int().nonnegative().default(0),
  step: z.number().int().min(1).max(6).default(1),
  theme: z.enum(['light', 'dark']).default('dark'),
  testBrand: z.enum(['bewakoof', 'decathlon', 'mamaearth', 'custom']).optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
