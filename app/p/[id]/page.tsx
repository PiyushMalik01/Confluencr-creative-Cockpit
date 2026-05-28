import { notFound } from 'next/navigation';
import { projects } from '@/lib/db/collections';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProjectShell } from '@/components/wizard/project-shell';
import { ProviderButton } from '@/components/provider/provider-button';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await (await projects()).findOne({ _id: id });
  if (!p) notFound();

  return (
    <main className="min-h-screen pb-32">
      <header className="sticky top-0 z-30 backdrop-blur glass border-b border-[color:var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold tracking-tight">Confluencr Cockpit</div>
            <div className="text-xs text-[color:var(--color-muted-foreground)] font-mono">
              /p/{id.slice(0, 8)}…
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ProviderButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pt-8">
        <ProjectShell projectId={id} initialStep={p.step ?? 1} />
      </div>
    </main>
  );
}
