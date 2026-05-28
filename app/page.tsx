'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    setBusy(true);
    try {
      const r = await fetch('/api/projects', { method: 'POST' });
      const { id } = await r.json();
      router.push(`/p/${id}`);
    } catch (e) {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-3xl text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 px-3 py-1 text-xs text-[color:var(--color-muted-foreground)] backdrop-blur">
          <Sparkles className="size-3" />
          <span>Powered by your ChatGPT subscription</span>
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-[-0.02em]">
          Three on-brand image concepts.
          <br />
          From one brief.
        </h1>

        <p className="text-lg text-[color:var(--color-muted-foreground)] max-w-2xl mx-auto leading-relaxed">
          Drop in a product brief. The cockpit researches competitor visuals, extracts style patterns, and
          ships a Rational, Emotional, Aspirational concept set with execution-ready prompts.
        </p>

        <div className="pt-4">
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] px-6 py-3 font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {busy ? 'Starting…' : 'Start a new brief'}
            <ArrowRight className="size-4" />
          </button>
        </div>

        <p className="text-xs text-[color:var(--color-muted-foreground)] pt-2">
          Zero cost from brief to prompt deck. Optional image generation via your own API key.
        </p>
      </motion.div>
    </main>
  );
}
