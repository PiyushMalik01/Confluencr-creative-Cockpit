'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Settings2, X } from 'lucide-react';
import { useSession } from '@/lib/session-context';
import { ChatGPTConnect } from './chatgpt-connect';
import { BYOKeyInputs } from './byo-key-input';

export function ProviderButton() {
  const { session, keys, ready, hasAnyProvider } = useSession();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const byoCount = Object.keys(keys).length;
  const buttonLabel = !ready
    ? 'Loading…'
    : session
      ? byoCount > 0
        ? `ChatGPT + ${byoCount} BYO`
        : 'ChatGPT connected'
      : byoCount > 0
        ? `${byoCount} BYO key${byoCount === 1 ? '' : 's'}`
        : 'Connect provider';

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [open]);

  const modal = open ? (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      {/* Centered panel container */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-md rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl max-h-[85vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[color:var(--color-border)] shrink-0">
            <h3 className="text-sm font-semibold tracking-tight">AI Providers</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="size-7 inline-flex items-center justify-center rounded-md text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="px-5 py-4 space-y-5 overflow-y-auto scrollbar-thin">
            <ChatGPTConnect />
            <div className="h-px bg-[color:var(--color-border)]" />
            <BYOKeyInputs />
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 backdrop-blur px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
      >
        <Settings2 className="size-3.5" />
        <span>{buttonLabel}</span>
        {hasAnyProvider && <span className="size-1.5 rounded-full bg-emerald-500" />}
      </button>

      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
