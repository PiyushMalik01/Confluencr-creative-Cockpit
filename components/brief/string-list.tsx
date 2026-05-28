'use client';

import { Plus, X } from 'lucide-react';

export function StringList({
  value,
  onChange,
  placeholder,
  presets,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  presets?: string[];
}) {
  function update(idx: number, v: string) {
    onChange(value.map((x, i) => (i === idx ? v : x)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add(seed = '') {
    onChange([...value, seed]);
  }

  return (
    <div className="space-y-1.5">
      {value.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={v}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2.5 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-[color:var(--color-muted-foreground)] hover:text-rose-500 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => add()}
          className="text-xs inline-flex items-center gap-1.5 rounded-md border border-dashed border-[color:var(--color-border)] px-2.5 py-1.5 hover:bg-[color:var(--color-muted)] transition-colors"
        >
          <Plus className="size-3" /> Add
        </button>
        {presets?.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => add(p)}
            className="text-[10px] rounded-full border border-[color:var(--color-border)] px-2 py-0.5 hover:bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)] transition-colors"
          >
            + {p}
          </button>
        ))}
      </div>
    </div>
  );
}
