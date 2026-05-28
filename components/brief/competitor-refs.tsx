'use client';

import { Link2, Tag, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CompetitorRef } from '@/lib/schemas/brief';

const MODES = [
  { id: 'url' as const, label: 'URL paste', icon: Link2 },
  { id: 'name' as const, label: 'Brand name', icon: Tag },
  { id: 'upload' as const, label: 'Upload image', icon: Upload },
];

export function CompetitorRefs({
  mode,
  inputs,
  onChange,
}: {
  mode: 'url' | 'upload' | 'name';
  inputs: CompetitorRef[];
  onChange: (next: { mode: 'url' | 'upload' | 'name'; inputs: CompetitorRef[] }) => void;
}) {
  function setMode(next: 'url' | 'upload' | 'name') {
    onChange({ mode: next, inputs });
  }
  function add(value: string, kind: 'url' | 'upload' | 'name' = mode) {
    if (!value.trim()) return;
    onChange({ mode, inputs: [...inputs, { kind, value: value.trim() }] });
  }
  function remove(i: number) {
    onChange({ mode, inputs: inputs.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-md border border-[color:var(--color-border)] p-0.5">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs transition-colors',
                mode === m.id
                  ? 'bg-[color:var(--color-muted)] text-[color:var(--color-foreground)]'
                  : 'text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]'
              )}
            >
              <Icon className="size-3" /> {m.label}
            </button>
          );
        })}
      </div>

      {mode === 'url' && <UrlAdder onAdd={(v) => add(v, 'url')} />}
      {mode === 'name' && <NameAdder onAdd={(v) => add(v, 'name')} />}
      {mode === 'upload' && (
        <div className="text-xs text-[color:var(--color-muted-foreground)] border border-dashed border-[color:var(--color-border)] rounded-md p-3">
          Image upload will arrive in the next iteration. Use URL paste with a direct image link for now.
        </div>
      )}

      {inputs.length > 0 && (
        <ul className="space-y-1">
          {inputs.map((ref, i) => (
            <li
              key={`${ref.kind}-${ref.value}-${i}`}
              className="flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40 px-2.5 py-1.5 text-xs"
            >
              <span className="rounded bg-[color:var(--color-muted)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                {ref.kind}
              </span>
              <span className="flex-1 truncate font-mono">{ref.value}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-[color:var(--color-muted-foreground)] hover:text-rose-500 transition-colors"
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function UrlAdder({ onAdd }: { onAdd: (v: string) => void }) {
  let val = '';
  return (
    <div className="flex gap-2">
      <input
        defaultValue=""
        onChange={(e) => (val = e.target.value)}
        placeholder="https://snitch.in/products/…"
        className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2.5 py-1.5 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onAdd((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          const input = (e.currentTarget.previousSibling as HTMLInputElement);
          onAdd(input.value);
          input.value = '';
        }}
        className="rounded-md border border-[color:var(--color-border)] px-3 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
      >
        Add
      </button>
    </div>
  );
}

function NameAdder({ onAdd }: { onAdd: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <input
        defaultValue=""
        placeholder="e.g. Snitch, Souled Store, Beyoung"
        className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2.5 py-1.5 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            onAdd((e.target as HTMLInputElement).value);
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
      <button
        type="button"
        onClick={(e) => {
          const input = (e.currentTarget.previousSibling as HTMLInputElement);
          onAdd(input.value);
          input.value = '';
        }}
        className="rounded-md border border-[color:var(--color-border)] px-3 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
      >
        Add
      </button>
    </div>
  );
}
