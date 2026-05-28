import { z } from 'zod';

export const BYOProvider = z.enum(['openai', 'anthropic', 'google', 'fal', 'ideogram']);
export type BYOProvider = z.infer<typeof BYOProvider>;

export const BYOKeys = z.object({
  openai: z.string().optional(),
  anthropic: z.string().optional(),
  google: z.string().optional(),
  fal: z.string().optional(),
  ideogram: z.string().optional(),
});
export type BYOKeys = z.infer<typeof BYOKeys>;

export const PROVIDER_META: Record<BYOProvider, {
  label: string;
  model: string;
  placeholder: string;
  capability: 'text' | 'image';
  helpUrl: string;
  description: string;
}> = {
  openai: {
    label: 'OpenAI',
    model: 'gpt-5 / gpt-5-image',
    placeholder: 'sk-...',
    capability: 'text',
    helpUrl: 'https://platform.openai.com/api-keys',
    description: 'Direct API access. Used for text + image. Best for users without ChatGPT auth.',
  },
  anthropic: {
    label: 'Anthropic',
    model: 'claude-4.7-sonnet',
    placeholder: 'sk-ant-...',
    capability: 'text',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Best for taste + structured reasoning on concept briefs.',
  },
  google: {
    label: 'Google Gemini',
    model: 'gemini-3-pro / nano-banana-pro',
    placeholder: 'AI...',
    capability: 'text',
    helpUrl: 'https://aistudio.google.com/apikey',
    description: 'Best for vision + multilingual on-image text.',
  },
  fal: {
    label: 'fal.ai',
    model: 'flux-kontext-pro',
    placeholder: 'fal-...',
    capability: 'image',
    helpUrl: 'https://fal.ai/dashboard/keys',
    description: 'Image gen — best for "real product photo in → AI scene out" at 95%+ fidelity.',
  },
  ideogram: {
    label: 'Ideogram',
    model: 'ideogram-v3',
    placeholder: 'ID-...',
    capability: 'image',
    helpUrl: 'https://ideogram.ai/manage-api',
    description: 'Image gen — best for posters and typography-heavy infographics.',
  },
};
