'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { PaletteEntry } from '@/lib/schemas/common';

export function PaletteEditor({
  value,
  onChange,
}: {
  value: PaletteEntry[];
  onChange: (next: PaletteEntry[]) => void;
}) {
  function update(idx: number, patch: Partial<PaletteEntry>) {
    onChange(value.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    const role = value.length === 0 ? 'primary' : value.length === 1 ? 'accent' : 'neutral';
    onChange([...value, { hex: '#000000', role, ratio: 0 }]);
  }

  return (
    <div className="space-y-2">
      {value.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="color"
            value={p.hex}
            onChange={(e) => update(i, { hex: e.target.value })}
            className="size-10 rounded-md border border-[color:var(--color-border)] bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={p.hex}
            onChange={(e) => update(i, { hex: e.target.value })}
            className="w-24 font-mono text-xs rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2 py-1.5"
          />
          <select
            value={p.role}
            onChange={(e) => update(i, { role: e.target.value })}
            className="text-xs rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2 py-1.5"
          >
            <option value="primary">primary</option>
            <option value="accent">accent</option>
            <option value="neutral">neutral</option>
            <option value="background">background</option>
          </select>
          <div className="flex-1 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={p.ratio}
              onChange={(e) => update(i, { ratio: parseFloat(e.target.value) })}
              className="flex-1"
            />
            <span className="text-xs font-mono w-9 text-right text-[color:var(--color-muted-foreground)]">
              {Math.round(p.ratio * 100)}%
            </span>
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-[color:var(--color-muted-foreground)] hover:text-rose-500 transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="text-xs inline-flex items-center gap-1.5 rounded-md border border-dashed border-[color:var(--color-border)] px-2.5 py-1.5 hover:bg-[color:var(--color-muted)] transition-colors"
      >
        <Plus className="size-3" /> Add colour
      </button>
    </div>
  );
}
