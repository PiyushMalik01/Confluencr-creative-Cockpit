'use client';

import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { decryptFromStorage, STORAGE_KEYS } from '@/lib/storage/encrypted-local';
import type { ChatGPTSession } from '@/lib/ai/codex-stream';
import { ChatGPTConnect } from './chatgpt-connect';

export function ProviderButton() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt).then((s) => setConnected(!!s));
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 backdrop-blur px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
      >
        <Settings2 className="size-3.5" />
        <span>{connected ? 'ChatGPT connected' : 'Connect provider'}</span>
        {connected && <span className="size-1.5 rounded-full bg-emerald-500" />}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">AI Providers</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] text-xs"
              >
                Close
              </button>
            </div>
            <ChatGPTConnect onConnected={() => setConnected(true)} />
            <div className="text-xs text-[color:var(--color-muted-foreground)] leading-relaxed">
              Bring-your-own-key for Anthropic, Google, fal.ai, Ideogram coming next. For now ChatGPT auth is
              the recommended free path.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
