import { z } from 'zod';

const Common = z.object({
  requestId: z.string(),
  ts: z.number(),
});

export const ActivityEventSchema = z.union([
  Common.merge(z.object({ kind: z.literal('start'), step: z.string(), estDurationS: z.number() })),
  Common.merge(z.object({ kind: z.literal('info'), message: z.string(), icon: z.enum(['fetch', 'vision', 'model', 'db']).optional() })),
  Common.merge(z.object({ kind: z.literal('ok'), message: z.string() })),
  Common.merge(z.object({ kind: z.literal('warn'), message: z.string() })),
  Common.merge(z.object({ kind: z.literal('error'), message: z.string(), nextAction: z.string().optional() })),
  Common.merge(z.object({ kind: z.literal('thinking'), modelName: z.string(), elapsedS: z.number() })),
  Common.merge(z.object({ kind: z.literal('done'), summary: z.string() })),
  Common.merge(z.object({ kind: z.literal('data'), data: z.unknown() })),
]);

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;

export type ActivityEventBody =
  | { kind: 'start'; step: string; estDurationS: number }
  | { kind: 'info'; message: string; icon?: 'fetch' | 'vision' | 'model' | 'db' }
  | { kind: 'ok'; message: string }
  | { kind: 'warn'; message: string }
  | { kind: 'error'; message: string; nextAction?: string }
  | { kind: 'thinking'; modelName: string; elapsedS: number }
  | { kind: 'done'; summary: string }
  | { kind: 'data'; data: unknown };

export function makeEvent(requestId: string, body: ActivityEventBody): ActivityEvent {
  return { requestId, ts: Date.now(), ...body } as ActivityEvent;
}
