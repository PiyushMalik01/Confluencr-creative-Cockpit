'use client';

import { AlertTriangle } from 'lucide-react';

export function StaleChip({ label = 'Brief changed' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
      <AlertTriangle className="size-2.5" />
      {label}
    </span>
  );
}
