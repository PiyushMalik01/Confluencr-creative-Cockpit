import type { ActivityEvent } from '@/lib/schemas/activity-event';

export type SseWriter = {
  send(event: ActivityEvent): void;
  done(): void;
};

export function createSseResponse(): { response: Response; writer: SseWriter } {
  const encoder = new TextEncoder();
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });

  function send(event: ActivityEvent) {
    try {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    } catch {
      /* closed */
    }
  }
  function done() {
    try {
      controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
      controller.close();
    } catch {
      /* already closed */
    }
  }

  return {
    response: new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    }),
    writer: { send, done },
  };
}
