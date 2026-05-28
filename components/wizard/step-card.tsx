'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepCardProps = {
  stepNumber: number;
  title: string;
  subtitle?: string;
  isActive: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  onActivate: () => void;
  children?: React.ReactNode;
  rightSlot?: React.ReactNode;
  staleChip?: React.ReactNode;
};

export function StepCard({
  stepNumber,
  title,
  subtitle,
  isActive,
  isCompleted,
  isLocked,
  onActivate,
  children,
  rightSlot,
  staleChip,
}: StepCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border bg-[color:var(--color-card)]/70 backdrop-blur transition-colors',
        isActive
          ? 'border-[color:var(--color-border)] shadow-[0_1px_0_rgba(0,0,0,0.04)]'
          : 'border-[color:var(--color-border)]/60',
        isLocked && 'opacity-60'
      )}
    >
      <button
        type="button"
        onClick={() => !isLocked && onActivate()}
        disabled={isLocked}
        className="w-full flex items-center gap-4 p-4 text-left group"
      >
        <span
          className={cn(
            'flex size-8 items-center justify-center rounded-full text-xs font-semibold shrink-0 transition-colors',
            isCompleted
              ? 'bg-[color:var(--color-foreground)] text-[color:var(--color-background)]'
              : isActive
                ? 'bg-[color:var(--color-foreground)] text-[color:var(--color-background)]'
                : 'bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)]'
          )}
        >
          {isCompleted ? <Check className="size-4" /> : isLocked ? <Lock className="size-3.5" /> : stepNumber}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold tracking-tight">{title}</h3>
            {staleChip}
          </div>
          {subtitle && (
            <p className="text-xs text-[color:var(--color-muted-foreground)] mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {rightSlot}

        <motion.div animate={{ rotate: isActive ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-4 text-[color:var(--color-muted-foreground)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1 border-t border-[color:var(--color-border)]/50">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
