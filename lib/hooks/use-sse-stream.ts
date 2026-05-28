'use client';

import { useCallback, useRef, useState } from 'react';
import type { ActivityEvent } from '@/lib/schemas/activity-event';

export function useSseStream() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setEvents([]);
    setData(null);
  }, []);

  const start = useCallback(async (url: string, init: RequestInit) => {
    reset();
    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const r = await fetch(url, { ...init, signal: ac.signal });
      if (!r.ok || !r.body) {
        let errMsg = `HTTP ${r.status}`;
        try {
          errMsg = (await r.json()).error ?? errMsg;
        } catch { /* ignore */ }
        setEvents((es) => [
          ...es,
          { requestId: 'local', ts: Date.now(), kind: 'error', message: errMsg } as ActivityEvent,
        ]);
        return;
      }
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';
        for (const block of lines) {
          const line = block.trim();
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') continue;
          try {
            const ev = JSON.parse(payload) as ActivityEvent;
            if (ev.kind === 'data') {
              setData(ev.data);
            } else {
              setEvents((es) => [...es, ev]);
            }
          } catch {
            /* skip malformed */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setEvents((es) => [
        ...es,
        {
          requestId: 'local',
          ts: Date.now(),
          kind: 'error',
          message: e instanceof Error ? e.message : 'request failed',
        } as ActivityEvent,
      ]);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [reset]);

  const abort = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { events, data, busy, start, abort, reset };
}
