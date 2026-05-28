'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { ActivityTicker } from '@/components/activity-ticker';
import { useSseStream } from '@/lib/hooks/use-sse-stream';
import { useTextCredentials } from '@/lib/hooks/use-credentials';
import type { AngleProposal, AngleProposalDoc } from '@/lib/schemas/angle';
import { TRIFECTA_FAMILY } from '@/lib/schemas/common';
import { cn } from '@/lib/utils';

const TRIFECTA_COLOR: Record<string, string> = {
  Rational: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-500/30',
  Emotional: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
  Aspirational: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
  Social: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
};

export function Step3Angles({ projectId, onContinue }: { projectId: string; onContinue: () => void }) {
  const { events, data, busy, start } = useSseStream();
  const { creds, ready: providerReady } = useTextCredentials();
  const [doc, setDoc] = useState<AngleProposalDoc | null>(null);
  const needChatgpt = !providerReady;

  useEffect(() => {
    fetch(`/api/angles?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setDoc(d));
  }, [projectId]);

  useEffect(() => {
    if (data) setDoc(data as AngleProposalDoc);
  }, [data]);

  const run = useCallback(async () => {
    if (!creds) return;
    await start('/api/angles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, ...creds }),
    });
  }, [projectId, creds, start]);

  const togglePick = useCallback(
    async (angleId: string) => {
      if (!doc) return;
      const current = doc.pickedAngleIds || [];
      let next: string[];
      if (current.includes(angleId)) {
        next = current.filter((id) => id !== angleId);
      } else if (current.length >= 3) {
        next = [...current.slice(1), angleId];
      } else {
        next = [...current, angleId];
      }
      setDoc({ ...doc, pickedAngleIds: next });
      await fetch('/api/angles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, pickedAngleIds: next }),
      });
    },
    [doc, projectId]
  );

  const families = useMemo(() => {
    if (!doc) return new Set<string>();
    const fams = new Set<string>();
    for (const id of doc.pickedAngleIds ?? []) {
      const angle = doc.angles.find((a) => a.id === id);
      if (angle) fams.add(TRIFECTA_FAMILY[angle.name]);
    }
    return fams;
  }, [doc]);

  const picked = doc?.pickedAngleIds ?? [];
  const canContinue = picked.length === 3 && families.size >= 2;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[color:var(--color-muted-foreground)]">
          AI proposes five strategic angles. Pick three that span at least two trifecta families.
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] disabled:opacity-50 transition-colors"
        >
          {doc ? <RotateCcw className="size-3" /> : <Plus className="size-3" />}
          {busy ? 'Proposing…' : doc ? 'Re-propose' : 'Propose angles'}
        </button>
      </div>

      {needChatgpt && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          Connect ChatGPT first (top-right Settings).
        </div>
      )}

      <ActivityTicker events={events} />

      {doc && doc.angles.length > 0 && (
        <>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-[color:var(--color-muted-foreground)]">
              Picked {picked.length}/3 · {families.size} family/ies
            </span>
            {Array.from(families).map((f) => (
              <span key={f} className={cn('rounded-full border px-2 py-0.5', TRIFECTA_COLOR[f])}>
                {f}
              </span>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doc.angles.map((a) => (
              <AngleCard
                key={a.id}
                angle={a}
                picked={picked.includes(a.id)}
                onToggle={() => togglePick(a.id)}
              />
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={!canContinue}
              onClick={onContinue}
              className="rounded-full bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-5 py-2 text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {!canContinue
                ? picked.length < 3
                  ? `Pick ${3 - picked.length} more angle(s)`
                  : 'Need at least 2 trifecta families'
                : 'Continue to Step 4 →'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function AngleCard({
  angle,
  picked,
  onToggle,
}: {
  angle: AngleProposal;
  picked: boolean;
  onToggle: () => void;
}) {
  const family = TRIFECTA_FAMILY[angle.name];
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'text-left rounded-xl border bg-[color:var(--color-card)]/70 p-3.5 space-y-3 transition-all hover:scale-[1.01]',
        picked
          ? 'border-[color:var(--color-foreground)] ring-2 ring-[color:var(--color-foreground)]/10'
          : 'border-[color:var(--color-border)]'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold tracking-tight">{angle.name}</div>
          <div className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] mt-1', TRIFECTA_COLOR[family])}>
            {family}
          </div>
        </div>
        <div
          className={cn(
            'size-6 rounded-full border-2 shrink-0 transition-colors',
            picked
              ? 'bg-[color:var(--color-foreground)] border-[color:var(--color-foreground)]'
              : 'border-[color:var(--color-border)]'
          )}
        >
          {picked && (
            <svg viewBox="0 0 24 24" className="size-full text-[color:var(--color-background)]" fill="none">
              <path d="M6 12l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        {angle.palette.map((p, i) => (
          <div
            key={i}
            className="h-5 flex-1 rounded-sm border border-[color:var(--color-border)]/50"
            style={{ background: p.hex }}
            title={`${p.hex} (${p.role})`}
          />
        ))}
      </div>

      <div className="text-sm font-mono uppercase tracking-wide truncate">{angle.sampleHeadline}</div>
      <div className="text-[10px] text-[color:var(--color-muted-foreground)]">
        {angle.typography.display} · {angle.typography.body}
      </div>

      <div className="text-xs leading-relaxed text-[color:var(--color-muted-foreground)]">
        <strong className="text-[color:var(--color-foreground)]">Why this fits:</strong> {angle.rationale}
      </div>

      <div className="text-xs leading-relaxed text-[color:var(--color-muted-foreground)] border-t border-[color:var(--color-border)]/50 pt-2">
        <strong className="text-[color:var(--color-foreground)]">Whitespace:</strong> {angle.whitespaceClaim}
      </div>

      <div className="flex items-center justify-between text-[10px] text-[color:var(--color-muted-foreground)]">
        <span>confidence</span>
        <div className="flex items-center gap-1.5">
          <div className="h-1 w-16 rounded-full bg-[color:var(--color-muted)] overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${angle.confidence * 100}%` }} />
          </div>
          <span className="font-mono">{(angle.confidence * 100).toFixed(0)}%</span>
        </div>
      </div>
    </button>
  );
}
