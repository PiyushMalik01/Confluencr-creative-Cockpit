'use client';

import { useCallback, useEffect, useState } from 'react';
import { Copy, Download, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PromptDeck } from '@/lib/schemas/prompt-deck';

const TOOL_LABEL: Record<string, string> = {
  midjourney: 'Midjourney',
  flux: 'Flux Kontext',
  'nano-banana': 'Nano Banana',
  'gpt-image': 'GPT-Image',
  ideogram: 'Ideogram',
};

export function Step6PromptDeck({ projectId }: { projectId: string }) {
  const [deck, setDeck] = useState<PromptDeck | null>(null);
  const [busy, setBusy] = useState(false);
  const [allVariants, setAllVariants] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/prompt-deck?projectId=${projectId}`);
    const d = await r.json();
    setDeck(d);
  }, [projectId]);

  const build = useCallback(
    async (includeAll: boolean) => {
      setBusy(true);
      try {
        const r = await fetch('/api/prompt-deck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, includeAllToolVariants: includeAll }),
        });
        const d = await r.json();
        setDeck(d);
      } finally {
        setBusy(false);
      }
    },
    [projectId]
  );

  useEffect(() => {
    load();
  }, [load]);

  function downloadPdf() {
    window.open(`/api/pdf/${projectId}`, '_blank', 'noopener');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs text-[color:var(--color-muted-foreground)]">
          One prompt per concept × surface. Copy any card into your image-gen tool.
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allVariants}
              onChange={(e) => {
                setAllVariants(e.target.checked);
                build(e.target.checked);
              }}
              className="size-3"
            />
            <span>Show all tool variants</span>
          </label>
          <button
            type="button"
            onClick={() => build(allVariants)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] disabled:opacity-50 transition-colors"
          >
            <RotateCcw className="size-3" />
            {busy ? 'Building…' : deck ? 'Rebuild deck' : 'Build prompt deck'}
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={!deck}
            className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-3 py-1.5 text-xs disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <Download className="size-3" />
            Download PDF
          </button>
        </div>
      </div>

      {deck && deck.cards.length > 0 && (
        <div className="space-y-3">
          {deck.cards.map((card, i) => (
            <DeckCard key={`${card.conceptId}-${card.aspectRatio}-${card.tool}-${i}`} card={card} />
          ))}
        </div>
      )}

      {(!deck || deck.cards.length === 0) && !busy && (
        <div className="rounded-md border border-dashed border-[color:var(--color-border)] px-4 py-8 text-xs text-[color:var(--color-muted-foreground)] text-center">
          Click "Build prompt deck" to assemble cards from your three concept briefs.
        </div>
      )}
    </div>
  );
}

function DeckCard({ card }: { card: PromptDeck['cards'][number] }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(card.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  function openTool() {
    const url =
      card.tool === 'midjourney'
        ? 'https://www.midjourney.com/'
        : card.tool === 'gpt-image'
          ? 'https://chatgpt.com/'
          : card.tool === 'nano-banana'
            ? 'https://aistudio.google.com/'
            : card.tool === 'ideogram'
              ? 'https://ideogram.ai/'
              : 'https://fal.ai/models/fal-ai/flux-pro/kontext';
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 overflow-hidden">
      <div className="px-4 py-3 border-b border-[color:var(--color-border)]/60 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold truncate">{card.heading}</div>
          <div className="text-xs text-[color:var(--color-muted-foreground)] truncate mt-0.5">
            {card.description}
          </div>
        </div>
        <span
          className={cn(
            'text-[10px] font-mono uppercase tracking-wider rounded-full border px-2 py-0.5 shrink-0',
            'bg-[color:var(--color-muted)] border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)]'
          )}
        >
          {TOOL_LABEL[card.tool] ?? card.tool}
        </span>
      </div>
      <pre className="px-4 py-3 text-xs font-mono whitespace-pre-wrap leading-relaxed">{card.prompt}</pre>
      <div className="px-4 py-2 border-t border-[color:var(--color-border)]/60 flex items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
        >
          <Copy className="size-3" />
          {copied ? 'Copied' : 'Copy prompt'}
        </button>
        <button
          type="button"
          onClick={openTool}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-xs text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)] transition-colors"
        >
          Open in {TOOL_LABEL[card.tool] ?? card.tool}
        </button>
      </div>
    </div>
  );
}
