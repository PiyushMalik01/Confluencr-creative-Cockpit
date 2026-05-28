'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, Brain, CheckCircle2, ChevronDown, ChevronUp, Database, Eye, Globe, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { ActivityEvent } from '@/lib/schemas/activity-event';
import { cn } from '@/lib/utils';

const ICONS = {
  fetch: Globe,
  vision: Eye,
  model: Brain,
  db: Database,
} as const;

export function ActivityTicker({
  events,
  collapsedAfterDone = true,
}: {
  events: ActivityEvent[];
  collapsedAfterDone?: boolean;
}) {
  const [forceOpen, setForceOpen] = useState(false);
  const done = events.find((e) => e.kind === 'done');
  const isCollapsed = collapsedAfterDone && done && !forceOpen;

  if (events.length === 0) return null;

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setForceOpen(true)}
        className="w-full flex items-center justify-between rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40 px-3 py-2 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
      >
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="size-3.5 text-emerald-500" />
          <span>{'summary' in done! ? (done as { summary: string }).summary : 'Done'}</span>
        </span>
        <ChevronDown className="size-3.5 text-[color:var(--color-muted-foreground)]" />
      </button>
    );
  }

  return (
    <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40 overflow-hidden">
      {done && (
        <button
          type="button"
          onClick={() => setForceOpen(false)}
          className="w-full flex items-center justify-between px-3 py-1.5 text-xs border-b border-[color:var(--color-border)] hover:bg-[color:var(--color-muted)] transition-colors"
        >
          <span>Activity log</span>
          <ChevronUp className="size-3.5 text-[color:var(--color-muted-foreground)]" />
        </button>
      )}
      <div className="px-3 py-2 space-y-1 max-h-80 overflow-y-auto scrollbar-thin">
        <AnimatePresence initial={false}>
          {events.map((e, i) => (
            <motion.div
              key={`${e.requestId}-${i}-${e.ts}`}
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-xs"
            >
              <EventGlyph event={e} />
              <EventText event={e} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EventGlyph({ event }: { event: ActivityEvent }) {
  if (event.kind === 'thinking')
    return <Loader2 className="size-3 animate-spin text-[color:var(--color-muted-foreground)]" />;
  if (event.kind === 'ok') return <CheckCircle2 className="size-3 text-emerald-500" />;
  if (event.kind === 'warn') return <AlertCircle className="size-3 text-amber-500" />;
  if (event.kind === 'error') return <AlertCircle className="size-3 text-rose-500" />;
  if (event.kind === 'info' && event.icon) {
    const I = ICONS[event.icon];
    return <I className="size-3 text-[color:var(--color-muted-foreground)]" />;
  }
  return <span className="size-3 inline-block" />;
}

function EventText({ event }: { event: ActivityEvent }) {
  let text = '';
  let className = 'text-[color:var(--color-foreground)]';
  switch (event.kind) {
    case 'start':
      text = `Starting ${event.step}…`;
      break;
    case 'info':
      text = event.message;
      className = 'text-[color:var(--color-muted-foreground)]';
      break;
    case 'ok':
      text = event.message;
      break;
    case 'warn':
      text = event.message;
      className = 'text-amber-600 dark:text-amber-400';
      break;
    case 'error':
      text = event.message;
      className = 'text-rose-600 dark:text-rose-400';
      break;
    case 'thinking':
      text = `${event.modelName} · ${event.elapsedS}s`;
      className = 'text-[color:var(--color-muted-foreground)] font-mono';
      break;
    case 'done':
      text = event.summary;
      className = 'text-emerald-600 dark:text-emerald-400';
      break;
    case 'data':
      return null;
  }
  return <span className={cn('truncate', className)}>{text}</span>;
}
