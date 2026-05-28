'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Wand2, Loader2 } from 'lucide-react';
import { useSseStream } from '@/lib/hooks/use-sse-stream';
import { useTextCredentials } from '@/lib/hooks/use-credentials';
import { ActivityTicker } from '@/components/activity-ticker';

export function AutofillBar({
  projectId,
  onFilled,
}: {
  projectId: string;
  onFilled: () => void;
}) {
  const { creds, ready: providerReady, label: providerLabel } = useTextCredentials();
  const { events, busy, start, data } = useSseStream();
  const [seed, setSeed] = useState('');
  const [showTicker, setShowTicker] = useState(false);
  const lastFilledRef = useRef<unknown>(null);

  // Fire onFilled exactly once when the stream produces a new payload.
  // Earlier version called onFilled inside the render function, which
  // could trigger repeatedly. This effect only fires on a fresh result.
  useEffect(() => {
    if (data && data !== lastFilledRef.current) {
      lastFilledRef.current = data;
      onFilled();
    }
  }, [data, onFilled]);

  async function go() {
    if (!seed.trim() || !providerReady || !creds) return;
    setShowTicker(true);
    await start('/api/brief-autofill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        seed: seed.trim(),
        ...creds,
      }),
    });
    // Final fallback: even if SSE didn't deliver a data event for some
    // reason, the API has written to MongoDB by the time the stream ends.
    // Refresh once more to be safe.
    onFilled();
  }

  return (
    <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-500/[0.06] to-blue-500/[0.04] p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-500 shrink-0">
          <Sparkles className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold tracking-tight">Auto-fill from a URL or brand</div>
          <div className="text-xs text-[color:var(--color-muted-foreground)] mt-0.5 leading-relaxed">
            Paste a product URL or type a brand + product name. The cockpit fills every field. You review and tweak. Some sites (Nike, Amazon) block scrapers — the cockpit falls back to gpt-5.4&apos;s training knowledge of the brand in that case.
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !busy) go();
          }}
          placeholder="e.g. https://bewakoof.com/p/friends-pivot-tee  ·  or just  ·  Bewakoof Friends Pivot oversized tee"
          className="flex-1 min-w-0 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-shadow"
        />
        <button
          type="button"
          onClick={go}
          disabled={busy || !seed.trim() || !providerReady}
          className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-4 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Wand2 className="size-3.5" />}
          {busy ? 'Filling…' : 'Auto-fill'}
        </button>
      </div>

      {providerReady ? (
        <div className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--color-muted-foreground)] inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          using {providerLabel}
        </div>
      ) : (
        <div className="text-[11px] text-amber-700 dark:text-amber-300 inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-500" />
          Connect a provider (top-right Settings) to enable auto-fill
        </div>
      )}

      {showTicker && events.length > 0 && (
        <div className="pt-1">
          <ActivityTicker events={events} />
        </div>
      )}
    </div>
  );
}
