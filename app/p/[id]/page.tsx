import { notFound } from 'next/navigation';
import { briefs, projects } from '@/lib/db/collections';
import { ThemeToggle } from '@/components/theme-toggle';
import { ProjectShell } from '@/components/wizard/project-shell';
import { ProviderButton } from '@/components/provider/provider-button';
import { ProjectSwitcher } from '@/components/project/project-switcher';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await (await projects()).findOne({ _id: id });
  if (!p) notFound();
  const brief = await (await briefs()).findOne({ projectId: id });
  const productName = brief?.product?.name?.trim() ?? '';

  return (
    <main className="min-h-screen pb-32">
      <header className="sticky top-0 z-30 backdrop-blur glass border-b border-[color:var(--color-border)]">
        <div className="mx-auto max-w-5xl px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-sm font-semibold tracking-tight shrink-0">Confluencr</div>
            <span className="text-[color:var(--color-border)]">/</span>
            <ProjectSwitcher currentId={id} currentName={productName} />
          </div>
          <div className="flex items-center gap-2 shrink-0">
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
