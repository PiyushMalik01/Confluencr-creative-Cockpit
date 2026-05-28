'use client';

import { useCallback, useEffect, useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import { ActivityTicker } from '@/components/activity-ticker';
import { useSseStream } from '@/lib/hooks/use-sse-stream';
import { decryptFromStorage, STORAGE_KEYS } from '@/lib/storage/encrypted-local';
import type { ChatGPTSession } from '@/lib/ai/codex-stream';
import type { StyleReport } from '@/lib/schemas/style-report';

export function Step2StyleReport({
  projectId,
  onContinue,
}: {
  projectId: string;
  onContinue: () => void;
}) {
  const { events, data, busy, start } = useSseStream();
  const [existing, setExisting] = useState<StyleReport | null>(null);
  const [needChatgpt, setNeedChatgpt] = useState(false);

  useEffect(() => {
    fetch(`/api/style-extract?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setExisting(d));
  }, [projectId]);

  const runExtract = useCallback(async () => {
    const session = await decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt);
    if (!session) {
      setNeedChatgpt(true);
      return;
    }
    setNeedChatgpt(false);
    await start('/api/style-extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        accessToken: session.accessToken,
        accountId: session.accountId,
      }),
    });
  }, [projectId, start]);

  useEffect(() => {
    if (data) setExisting(data as StyleReport);
  }, [data]);

  const report = existing;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[color:var(--color-muted-foreground)]">
          AI reads your competitor visuals and extracts the patterns. Pin or edit anything.
        </div>
        <button
          type="button"
          onClick={runExtract}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] disabled:opacity-50 transition-colors"
        >
          {report ? <RotateCcw className="size-3" /> : <Play className="size-3" />}
          {busy ? 'Running…' : report ? 'Re-run' : 'Run extraction'}
        </button>
      </div>

      {needChatgpt && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          Connect ChatGPT first (top-right Settings). Style extraction uses gpt-5.4 via your subscription.
        </div>
      )}

      <ActivityTicker events={events} />

      {report && <StyleReportCard report={report} />}

      {report && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-full bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Continue to Step 3 →
          </button>
        </div>
      )}
    </div>
  );
}

function StyleReportCard({ report }: { report: StyleReport }) {
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
      <div className="space-y-2">
        <div className="text-xs font-medium text-[color:var(--color-muted-foreground)] uppercase tracking-wider">
          Competitor visuals
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
          {report.competitorImages.map((img, i) => (
            <div
              key={i}
              className="aspect-square rounded-md overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-muted)] relative group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="size-full object-cover" loading="lazy" />
              <div className="absolute top-1 left-1 rounded-sm bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5">
                #{i}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-[color:var(--color-muted-foreground)] uppercase tracking-wider">
            Palette
          </div>
          <div className="space-y-1.5">
            {report.palette.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <span
                  className="size-7 rounded-md border border-[color:var(--color-border)] shrink-0"
                  style={{ background: p.hex }}
                />
                <span className="font-mono text-xs">{p.hex}</span>
                <span className="text-xs text-[color:var(--color-muted-foreground)]">{p.role}</span>
                <div className="flex-1 h-1 rounded-full bg-[color:var(--color-muted)] overflow-hidden">
                  <div className="h-full bg-[color:var(--color-foreground)]" style={{ width: `${p.ratio * 100}%` }} />
                </div>
                <span className="text-xs font-mono w-9 text-right text-[color:var(--color-muted-foreground)]">
                  {Math.round(p.ratio * 100)}%
                </span>
                <span className="text-[10px] font-mono text-[color:var(--color-muted-foreground)]">
                  #{p.evidenceImageIdx}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Token label="Lighting" value={report.lighting} />
        <Token label="Composition" value={report.composition} />
        <Token label="Audience signal" value={report.audienceSignal} />
        <TokenList label="Props" values={report.props} />
        <TokenList label="Copy patterns" values={report.copyPatterns} />
        <TokenList label="Negative patterns" values={report.negativePatterns} />

        <div className="space-y-1.5">
          <div className="text-xs font-medium text-[color:var(--color-muted-foreground)] uppercase tracking-wider">
            Evidence
          </div>
          <ul className="text-xs space-y-1">
            {report.evidence.map((e, i) => (
              <li key={i} className="flex gap-2">
                <span className="font-mono text-[10px] text-[color:var(--color-muted-foreground)] shrink-0 mt-0.5">
                  #{e.imageIdx}
                </span>
                <span>{e.claim}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Token({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-medium text-[color:var(--color-muted-foreground)] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function TokenList({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <div className="text-xs font-medium text-[color:var(--color-muted-foreground)] uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v, i) => (
          <span
            key={i}
            className="inline-flex items-center rounded-full border border-[color:var(--color-border)] px-2.5 py-0.5 text-xs"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
