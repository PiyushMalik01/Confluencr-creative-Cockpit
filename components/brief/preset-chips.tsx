'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PresetChips({
  chips,
  value,
  onPick,
}: {
  chips: string[];
  value: string;
  onPick: (next: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const active = value === chip;
        return (
          <button
            key={chip}
            type="button"
            onClick={() => onPick(active ? '' : chip)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
              active
                ? 'bg-[color:var(--color-foreground)] text-[color:var(--color-background)] border-[color:var(--color-foreground)]'
                : 'border-[color:var(--color-border)] hover:bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]'
            )}
          >
            {active && <Check className="size-3" />}
            {chip}
          </button>
        );
      })}
    </div>
  );
}
