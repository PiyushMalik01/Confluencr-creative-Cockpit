'use client';

import { ArrowRight, KeyRound, SkipForward, Sparkles } from 'lucide-react';

export function Step5ImageGen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1">
            <div className="font-semibold">Image generation is optional</div>
            <div className="text-xs text-[color:var(--color-muted-foreground)] mt-1 leading-relaxed">
              The cockpit's value lands at Step 6 — execution-ready prompts that any image-gen tool can
              run. Generating images inside the cockpit needs a paid API key (Flux Kontext Pro, Nano Banana
              Pro, Ideogram, or GPT-Image). For this run, you can skip directly to the prompt deck and use
              the prompts in your tool of choice.
            </div>
          </div>
        </div>

        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <KeyRound className="size-3.5 mt-0.5 shrink-0" />
          <span>
            BYO image-gen key support arrives in v1.1. For the assignment test runs, the prompts in Step 6
            are the deliverable.
          </span>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onContinue}
          className="rounded-full bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-5 py-2 text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <SkipForward className="size-3.5" />
          Skip to prompt deck
          <ArrowRight className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
