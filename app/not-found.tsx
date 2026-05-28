import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">Project not found</h1>
        <p className="text-sm text-[color:var(--color-muted-foreground)]">
          That share link points to nothing. Start a new brief instead.
        </p>
        <Link
          href="/"
          className="inline-block rounded-full bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] px-5 py-2 text-sm"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
