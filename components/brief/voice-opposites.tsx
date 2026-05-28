'use client';

import { Plus, X } from 'lucide-react';
import type { VoiceOpposite } from '@/lib/schemas/brief';
import { VOICE_OPPOSITE_CHIPS } from '@/lib/chip-library';

export function VoiceOpposites({
  value,
  onChange,
}: {
  value: VoiceOpposite[];
  onChange: (next: VoiceOpposite[]) => void;
}) {
  function pickPreset(preset: { x: string; y: string }) {
    if (value.some((v) => v.x === preset.x && v.y === preset.y)) return;
    onChange([...value, preset]);
  }
  function update(idx: number, patch: Partial<VoiceOpposite>) {
    onChange(value.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    onChange([...value, { x: '', y: '' }]);
  }

  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        {value.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={v.x}
              onChange={(e) => update(i, { x: e.target.value })}
              placeholder="X (the side we want)"
              className="flex-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-2.5 py-1.5 text-sm"
            />
            <span className="text-xs text-[color:var(--color-muted-foreground)] shrink-0">not</span>
            <input
              value={v.y}
              onChange={(e) => update(i, { y: e.target.value })}
              placeholder="Y (the side we avoid)"
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
        <button
          type="button"
          onClick={add}
          className="text-xs inline-flex items-center gap-1.5 rounded-md border border-dashed border-[color:var(--color-border)] px-2.5 py-1.5 hover:bg-[color:var(--color-muted)] transition-colors"
        >
          <Plus className="size-3" /> Add opposite
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {VOICE_OPPOSITE_CHIPS.map((c) => (
          <button
            key={`${c.x}-${c.y}`}
            type="button"
            onClick={() => pickPreset(c)}
            className="text-[10px] rounded-full border border-[color:var(--color-border)] px-2 py-0.5 hover:bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)] transition-colors"
          >
            {c.x} not {c.y}
          </button>
        ))}
      </div>
    </div>
  );
}
