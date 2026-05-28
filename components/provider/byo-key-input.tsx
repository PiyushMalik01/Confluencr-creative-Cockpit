'use client';

import { useEffect, useState } from 'react';
import { Check, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useSession } from '@/lib/session-context';
import { PROVIDER_META, type BYOProvider } from '@/lib/schemas/byo-keys';
import { cn } from '@/lib/utils';

const PROVIDER_ORDER: BYOProvider[] = ['openai', 'anthropic', 'google', 'fal', 'ideogram'];

export function BYOKeyInputs() {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--color-muted-foreground)] flex items-center gap-2 pb-1">
        <span className="size-1.5 rounded-full bg-blue-500" />
        Bring your own keys
      </div>
      {PROVIDER_ORDER.map((p) => (
        <ProviderRow key={p} provider={p} />
      ))}
      <p className="text-[10px] text-[color:var(--color-muted-foreground)] leading-relaxed pt-1">
        All keys stay encrypted in your browser and never touch our server. The cockpit picks the first available text provider for AI steps and the first available image provider when you reach Step 5.
      </p>
    </div>
  );
}

function ProviderRow({ provider }: { provider: BYOProvider }) {
  const meta = PROVIDER_META[provider];
  const { keys, setKey } = useSession();
  const stored = keys[provider];
  const [draft, setDraft] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft('');
  }, [stored]);

  async function save() {
    if (!draft.trim()) return;
    setSaving(true);
    try {
      await setKey(provider, draft.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      setDraft('');
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    await setKey(provider, null);
  }

  const masked = stored ? `${stored.slice(0, 5)}…${stored.slice(-3)}` : null;

  return (
    <div
      className={cn(
        'rounded-lg border p-2.5 transition-colors',
        stored
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-card)]/40'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{meta.label}</span>
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider',
                meta.capability === 'text'
                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
              )}
            >
              {meta.capability}
            </span>
            <a
              href={meta.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-0.5 text-[10px] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
            >
              get key <ExternalLink className="size-2.5" />
            </a>
          </div>
          <div className="text-[10px] text-[color:var(--color-muted-foreground)] mt-0.5">
            <span className="font-mono">{meta.model}</span>
            <span className="ml-1.5">{meta.description}</span>
          </div>
        </div>
      </div>

      {stored ? (
        <div className="mt-2 flex items-center gap-2">
          <code className="flex-1 rounded-md bg-[color:var(--color-muted)] px-2 py-1.5 text-xs font-mono truncate">
            {showKey ? stored : masked}
          </code>
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="size-7 inline-flex items-center justify-center rounded-md hover:bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]"
            title={showKey ? 'Hide' : 'Reveal'}
          >
            {showKey ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-2.5 py-1 text-[10px] text-[color:var(--color-muted-foreground)] hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500"
          >
            <Trash2 className="size-3" /> remove
          </button>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
            }}
            placeholder={meta.placeholder}
            type="password"
            autoComplete="off"
            className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2.5 py-1.5 text-xs font-mono"
          />
          <button
            type="button"
            onClick={save}
            disabled={!draft.trim() || saving}
            className="rounded-md bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-3 py-1.5 text-xs font-medium disabled:opacity-50"
          >
            {saved ? <Check className="size-3" /> : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
