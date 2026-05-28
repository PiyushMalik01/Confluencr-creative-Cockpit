'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock3, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProjectSummary = {
  id: string;
  name: string;
  step: number;
  lastTouchedAt: string;
  createdAt: string;
};

const STEP_LABEL = ['', 'Brief', 'Style report', 'Angles', 'Concepts', 'Image gen', 'Prompt deck'];

function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ProjectSwitcher({ currentId, currentName }: { currentId: string; currentName?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ProjectSummary[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<ProjectSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/projects');
      const data: ProjectSummary[] = await r.json();
      setList(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      refresh();
      const t = triggerRef.current;
      if (t) {
        const rect = t.getBoundingClientRect();
        setPos({ top: rect.bottom + 6, left: rect.left, width: Math.max(rect.width, 340) });
      }
    }
  }, [open, refresh]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setConfirmNew(false);
      }
    }
    if (open || confirmNew) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [open, confirmNew]);

  async function startNew() {
    setCreating(true);
    try {
      const r = await fetch('/api/projects', { method: 'POST' });
      const { id } = await r.json();
      setOpen(false);
      setConfirmNew(false);
      router.push(`/p/${id}`);
    } finally {
      setCreating(false);
    }
  }

  async function deleteProject(p: ProjectSummary) {
    setDeleting(true);
    try {
      await fetch(`/api/projects/${p.id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      if (p.id === currentId) {
        // If the user nuked their current brief, fall back to the next one or start fresh
        const r = await fetch('/api/projects');
        const list: ProjectSummary[] = await r.json();
        if (list.length > 0) {
          router.push(`/p/${list[0].id}`);
        } else {
          const nr = await fetch('/api/projects', { method: 'POST' });
          const { id } = await nr.json();
          router.push(`/p/${id}`);
        }
      } else {
        refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const displayName = currentName?.trim() || 'Untitled brief';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="group inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-[color:var(--color-muted)] transition-colors max-w-[280px]"
      >
        <span className="truncate font-medium text-[color:var(--color-foreground)]">{displayName}</span>
        <ChevronDown
          className={cn(
            'size-3.5 text-[color:var(--color-muted-foreground)] transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {mounted && open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            className="fixed z-[91] rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl max-h-[70vh] flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-[color:var(--color-border)] shrink-0">
              <div className="text-[10px] font-medium text-[color:var(--color-muted-foreground)] uppercase tracking-wider">
                Recent briefs
              </div>
              <button
                type="button"
                onClick={() => setConfirmNew(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-2.5 py-1 text-[11px] font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="size-3" />
                New brief
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-thin">
              {loading && !list && (
                <div className="flex items-center justify-center py-6 text-xs text-[color:var(--color-muted-foreground)]">
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                  Loading…
                </div>
              )}
              {list && list.length === 0 && (
                <div className="py-6 text-center text-xs text-[color:var(--color-muted-foreground)]">
                  No briefs yet.
                </div>
              )}
              {list?.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'group w-full flex items-start gap-2.5 hover:bg-[color:var(--color-muted)] transition-colors border-b border-[color:var(--color-border)]/40 last:border-b-0',
                    p.id === currentId && 'bg-[color:var(--color-muted)]/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (p.id !== currentId) router.push(`/p/${p.id}`);
                    }}
                    className="flex-1 min-w-0 flex items-start gap-2.5 text-left px-3 py-2"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-[color:var(--color-muted)] text-[10px] font-semibold text-[color:var(--color-muted-foreground)] shrink-0">
                      {p.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {p.name || 'Untitled brief'}
                      </div>
                      <div className="text-[11px] text-[color:var(--color-muted-foreground)] flex items-center gap-1.5 mt-0.5">
                        <Clock3 className="size-2.5" />
                        <span>{relativeTime(p.lastTouchedAt)}</span>
                        <span>·</span>
                        <span>{STEP_LABEL[p.step] || 'Brief'}</span>
                      </div>
                    </div>
                    {p.id === currentId && (
                      <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted-foreground)] mt-1">
                        now
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(p);
                    }}
                    aria-label="Delete brief"
                    className="opacity-0 group-hover:opacity-100 transition-opacity size-7 inline-flex items-center justify-center mr-1.5 mt-1 text-[color:var(--color-muted-foreground)] hover:text-rose-500 rounded-md hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        </>,
        document.body
      )}

      {mounted && confirmDelete && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmDelete(null)}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl p-5 space-y-4"
            >
              <div>
                <h3 className="text-base font-semibold tracking-tight">Delete this brief?</h3>
                <p className="text-xs text-[color:var(--color-muted-foreground)] mt-1.5 leading-relaxed">
                  <span className="font-medium text-[color:var(--color-foreground)]">
                    {confirmDelete.name || 'Untitled brief'}
                  </span>
                  {' '}and every concept, style report, prompt deck, and generated image attached to it will be removed. This cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteProject(confirmDelete)}
                  disabled={deleting}
                  className="rounded-md bg-rose-500 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                >
                  {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                  Delete brief
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}

      {mounted && confirmNew && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmNew(false)}
        >
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] shadow-2xl p-5 space-y-4"
            >
              <div>
                <h3 className="text-base font-semibold tracking-tight">Start a new brief?</h3>
                <p className="text-xs text-[color:var(--color-muted-foreground)] mt-1.5 leading-relaxed">
                  Your current brief stays saved and is one click away in the dropdown anytime. A new
                  blank brief opens in its place.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmNew(false)}
                  className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={startNew}
                  disabled={creating}
                  className="rounded-md bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-3 py-1.5 text-xs font-medium disabled:opacity-50 hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                >
                  {creating ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
                  Start new
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>,
        document.body
      )}
    </>
  );
}
