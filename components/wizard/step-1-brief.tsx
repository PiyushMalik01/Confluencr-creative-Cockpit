'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Brief, CompetitorRef, VoiceOpposite } from '@/lib/schemas/brief';
import type { PaletteEntry, AspectRatio } from '@/lib/schemas/common';
import {
  AUDIENCE_CHIPS,
  CATEGORIES,
  COMMON_MANDATORIES,
  DO_NOT_INCLUDE_DEFAULTS,
  INSIGHT_PATTERNS,
  SMP_STARTERS,
  SURFACES,
  type Category,
} from '@/lib/chip-library';
import { FieldRow, TextInput } from '@/components/brief/field-row';
import { PresetChips } from '@/components/brief/preset-chips';
import { PaletteEditor } from '@/components/brief/palette-editor';
import { VoiceOpposites } from '@/components/brief/voice-opposites';
import { StringList } from '@/components/brief/string-list';
import { CompetitorRefs } from '@/components/brief/competitor-refs';
import { cn } from '@/lib/utils';
import { CheckCircle2, ImageIcon, Save } from 'lucide-react';

type SectionKey = 'product' | 'audience' | 'strategy' | 'brand' | 'references' | 'surfaces';

const SECTIONS: { key: SectionKey; label: string; desc: string }[] = [
  { key: 'product', label: 'Product', desc: 'Name, one-liner, hero photo, category.' },
  { key: 'audience', label: 'Audience', desc: 'Who buys this, and why they care.' },
  { key: 'strategy', label: 'Strategy', desc: 'The one thing the image must say.' },
  { key: 'brand', label: 'Brand', desc: 'Palette, typography, voice.' },
  { key: 'references', label: 'References', desc: 'Competitor visuals + guardrails.' },
  { key: 'surfaces', label: 'Surfaces', desc: 'Where these will live.' },
];

export function Step1Brief({ projectId, onContinue }: { projectId: string; onContinue: () => void }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [open, setOpen] = useState<SectionKey>('product');
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/briefs/${projectId}`)
      .then((r) => r.json())
      .then(setBrief);
  }, [projectId]);

  const persist = useCallback(
    (next: Brief) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaving(true);
      debounceRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/briefs/${projectId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product: next.product,
              audience: next.audience,
              strategy: next.strategy,
              brand: next.brand,
              references: next.references,
              surfaces: next.surfaces,
            }),
          });
          setSavedAt(Date.now());
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [projectId]
  );

  function update<K extends keyof Brief>(key: K, value: Brief[K]) {
    if (!brief) return;
    const next = { ...brief, [key]: value };
    setBrief(next);
    persist(next);
  }

  const completeness = useMemo(() => computeCompleteness(brief), [brief]);

  if (!brief) {
    return (
      <div className="text-xs text-[color:var(--color-muted-foreground)] py-4">Loading brief…</div>
    );
  }

  const cat = (brief.product.category as Category) || 'other';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[color:var(--color-muted-foreground)]">
        <div className="flex items-center gap-3">
          <span>{completeness.filled}/{completeness.required} required fields</span>
          <div className="h-1 w-32 rounded-full bg-[color:var(--color-muted)] overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(completeness.filled / completeness.required) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {saving ? <Save className="size-3 animate-pulse" /> : savedAt ? <CheckCircle2 className="size-3 text-emerald-500" /> : null}
          <span>{saving ? 'Saving…' : savedAt ? 'Saved' : ''}</span>
        </div>
      </div>

      {SECTIONS.map((s) => (
        <SectionAccordion
          key={s.key}
          label={s.label}
          desc={s.desc}
          isOpen={open === s.key}
          onToggle={() => setOpen(open === s.key ? ('' as SectionKey) : s.key)}
        >
          {s.key === 'product' && (
            <ProductSection brief={brief} onChange={(p) => update('product', p)} />
          )}
          {s.key === 'audience' && (
            <AudienceSection
              brief={brief}
              category={cat}
              onChange={(a) => update('audience', a)}
            />
          )}
          {s.key === 'strategy' && (
            <StrategySection brief={brief} onChange={(s2) => update('strategy', s2)} />
          )}
          {s.key === 'brand' && (
            <BrandSection brief={brief} onChange={(b) => update('brand', b)} />
          )}
          {s.key === 'references' && (
            <ReferencesSection brief={brief} category={cat} onChange={(r) => update('references', r)} />
          )}
          {s.key === 'surfaces' && (
            <SurfacesSection brief={brief} onChange={(sf) => update('surfaces', sf)} />
          )}
        </SectionAccordion>
      ))}

      <div className="pt-2 flex justify-end">
        <button
          type="button"
          disabled={completeness.filled < completeness.required}
          onClick={onContinue}
          className="rounded-full bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-5 py-2 text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
        >
          {completeness.filled < completeness.required
            ? `Fill ${completeness.required - completeness.filled} more required to continue`
            : 'Continue to Step 2 →'}
        </button>
      </div>
    </div>
  );
}

function computeCompleteness(b: Brief | null) {
  const required = 6;
  if (!b) return { filled: 0, required };
  let f = 0;
  if (b.product.name.trim()) f++;
  if (b.audience.description.trim()) f++;
  if (b.strategy.smp.trim()) f++;
  if (b.brand.palette.some((p) => p.hex && p.role === 'primary')) f++;
  if (b.references.inputs.length > 0) f++;
  if (b.surfaces.aspectRatios.length > 0) f++;
  return { filled: f, required };
}

function SectionAccordion({
  label,
  desc,
  isOpen,
  onToggle,
  children,
}: {
  label: string;
  desc: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)]/40">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-[color:var(--color-muted-foreground)]">{desc}</div>
        </div>
        <span className={cn('text-xs transition-transform', isOpen && 'rotate-180')}>▾</span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-4 border-t border-[color:var(--color-border)]/60">
          {children}
        </div>
      )}
    </div>
  );
}

// === SECTION COMPONENTS ===

function ProductSection({ brief, onChange }: { brief: Brief; onChange: (p: Brief['product']) => void }) {
  const p = brief.product;
  const heroPhoto = p.photos[0];

  function setHero(kind: 'url' | 'text', value: string) {
    const fidelityTier = kind === 'text' ? 'low' : 'medium';
    onChange({ ...p, photos: [{ kind, url: kind === 'url' ? value : undefined, fidelityTier }] });
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <FieldRow label="Product name" required>
        <TextInput
          value={p.name}
          onChange={(v) => onChange({ ...p, name: v })}
          placeholder="e.g. Bewakoof Friends Pivot Oversized Tee"
        />
      </FieldRow>
      <FieldRow label="Category">
        <select
          value={p.category || ''}
          onChange={(e) => onChange({ ...p, category: e.target.value })}
          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2 text-sm"
        >
          <option value="">Pick a category…</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </FieldRow>
      <FieldRow label="One-liner" className="sm:col-span-2">
        <TextInput
          value={p.oneLiner}
          onChange={(v) => onChange({ ...p, oneLiner: v })}
          placeholder="The single sentence you'd put under the product name."
        />
      </FieldRow>

      <FieldRow
        label="Hero photo"
        className="sm:col-span-2"
        hint={
          heroPhoto?.kind === 'url'
            ? 'High fidelity — fetched from URL'
            : heroPhoto?.kind === 'text'
              ? 'Lower fidelity — AI will invent a product representation'
              : 'Paste a public URL OR continue without photo'
        }
      >
        <div className="space-y-2">
          <div className="flex gap-2">
            <TextInput
              value={heroPhoto?.kind === 'url' ? heroPhoto.url || '' : ''}
              onChange={(v) => setHero('url', v)}
              placeholder="https://… (direct image URL)"
            />
            <button
              type="button"
              onClick={() => setHero('text', '')}
              className={cn(
                'rounded-md border px-3 text-xs whitespace-nowrap transition-colors',
                heroPhoto?.kind === 'text'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'border-[color:var(--color-border)] text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-muted)]'
              )}
            >
              <ImageIcon className="size-3 inline mr-1" />
              Text-only
            </button>
          </div>
          {heroPhoto?.kind === 'url' && heroPhoto.url && (
            <div className="rounded-md border border-[color:var(--color-border)] overflow-hidden max-w-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={heroPhoto.url} alt="hero" className="w-full h-32 object-contain bg-[color:var(--color-muted)]" />
            </div>
          )}
        </div>
      </FieldRow>

      <FieldRow label="Price tier">
        <select
          value={p.priceTier || ''}
          onChange={(e) => onChange({ ...p, priceTier: e.target.value })}
          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-input)] px-3 py-2 text-sm"
        >
          <option value="">Optional…</option>
          <option value="value">Value / mass</option>
          <option value="mid">Mid-market</option>
          <option value="premium">Premium</option>
          <option value="luxury">Luxury</option>
        </select>
      </FieldRow>
    </div>
  );
}

function AudienceSection({
  brief,
  category,
  onChange,
}: {
  brief: Brief;
  category: Category;
  onChange: (a: Brief['audience']) => void;
}) {
  const a = brief.audience;
  return (
    <div className="space-y-4">
      <FieldRow label="Target audience (one sentence)" required>
        <TextInput
          value={a.description}
          onChange={(v) => onChange({ ...a, description: v })}
          placeholder="e.g. Tier 1 Gen Z streetwear shoppers buying for self-expression."
          multiline
          rows={2}
        />
      </FieldRow>

      <FieldRow label="Audience signal preset" hint="Pick a starting point, or type your own above.">
        <PresetChips
          chips={AUDIENCE_CHIPS[category]}
          value={a.signalPreset || ''}
          onPick={(v) => onChange({ ...a, signalPreset: v, description: a.description || v })}
        />
      </FieldRow>

      <FieldRow label="Customer insight (the 'why they care' line)">
        <TextInput
          value={a.insight}
          onChange={(v) => onChange({ ...a, insight: v })}
          placeholder={INSIGHT_PATTERNS[0]}
          multiline
        />
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {INSIGHT_PATTERNS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange({ ...a, insight: p })}
              className="text-[10px] rounded-full border border-[color:var(--color-border)] px-2 py-0.5 hover:bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)] transition-colors"
            >
              + {p}
            </button>
          ))}
        </div>
      </FieldRow>
    </div>
  );
}

function StrategySection({ brief, onChange }: { brief: Brief; onChange: (s: Brief['strategy']) => void }) {
  const s = brief.strategy;
  return (
    <div className="space-y-4">
      <FieldRow label="Single-minded proposition" hint="The one thing the image must communicate." required>
        <TextInput
          value={s.smp}
          onChange={(v) => onChange({ ...s, smp: v })}
          placeholder="e.g. wear the show, own the joke"
          multiline
        />
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {SMP_STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => onChange({ ...s, smp: starter })}
              className="text-[10px] rounded-full border border-[color:var(--color-border)] px-2 py-0.5 hover:bg-[color:var(--color-muted)] text-[color:var(--color-muted-foreground)] transition-colors"
            >
              + {starter}
            </button>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Reasons to believe (RTBs)" hint="At least 1. Aim for 3.">
        <StringList
          value={s.rtbs}
          onChange={(rtbs) => onChange({ ...s, rtbs })}
          placeholder="e.g. officially licensed Friends merch"
        />
      </FieldRow>
    </div>
  );
}

function BrandSection({ brief, onChange }: { brief: Brief; onChange: (b: Brief['brand']) => void }) {
  const b = brief.brand;
  return (
    <div className="space-y-4">
      <FieldRow label="Palette" hint="Add 2–4 brand colours. Mark one primary." required>
        <PaletteEditor value={b.palette} onChange={(palette) => onChange({ ...b, palette })} />
      </FieldRow>

      <FieldRow label="Typography" hint="Brand fonts (display + body) or a vibe.">
        <TextInput
          value={b.typography || ''}
          onChange={(v) => onChange({ ...b, typography: v })}
          placeholder="e.g. Bebas Neue (display) + Inter (body)"
        />
      </FieldRow>

      <FieldRow label="Voice — opposites" hint="What we are, vs what we are NOT.">
        <VoiceOpposites
          value={b.voiceOpposites}
          onChange={(voiceOpposites) => onChange({ ...b, voiceOpposites })}
        />
      </FieldRow>
    </div>
  );
}

function ReferencesSection({
  brief,
  category,
  onChange,
}: {
  brief: Brief;
  category: Category;
  onChange: (r: Brief['references']) => void;
}) {
  const r = brief.references;
  return (
    <div className="space-y-4">
      <FieldRow label="Competitor references" hint="3–6 visuals work best. URL, brand name, or upload." required>
        <CompetitorRefs
          mode={r.competitorMode}
          inputs={r.inputs}
          onChange={({ mode, inputs }) => onChange({ ...r, competitorMode: mode, inputs })}
        />
      </FieldRow>

      <FieldRow label="Do-not-include list" hint="Cliches and off-strategy frames to avoid.">
        <StringList
          value={r.doNotInclude}
          onChange={(doNotInclude) => onChange({ ...r, doNotInclude })}
          placeholder="e.g. clean studio white-bg"
          presets={DO_NOT_INCLUDE_DEFAULTS[category]}
        />
      </FieldRow>
    </div>
  );
}

function SurfacesSection({ brief, onChange }: { brief: Brief; onChange: (s: Brief['surfaces']) => void }) {
  const s = brief.surfaces;
  function toggle(ar: AspectRatio) {
    const next = s.aspectRatios.includes(ar)
      ? s.aspectRatios.filter((x) => x !== ar)
      : [...s.aspectRatios, ar];
    onChange({ ...s, aspectRatios: next });
  }
  return (
    <div className="space-y-4">
      <FieldRow label="Aspect ratios" required>
        <div className="grid sm:grid-cols-2 gap-2">
          {SURFACES.map((sf) => {
            const checked = s.aspectRatios.includes(sf.value);
            return (
              <button
                key={sf.value}
                type="button"
                onClick={() => toggle(sf.value)}
                className={cn(
                  'flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors',
                  checked
                    ? 'border-[color:var(--color-foreground)] bg-[color:var(--color-muted)]'
                    : 'border-[color:var(--color-border)] hover:bg-[color:var(--color-muted)]'
                )}
              >
                <span
                  className={cn(
                    'size-4 rounded-sm border flex items-center justify-center',
                    checked
                      ? 'bg-[color:var(--color-foreground)] border-[color:var(--color-foreground)] text-[color:var(--color-background)]'
                      : 'border-[color:var(--color-border)]'
                  )}
                >
                  {checked && '✓'}
                </span>
                {sf.label}
              </button>
            );
          })}
        </div>
      </FieldRow>

      <FieldRow label="Mandatories" hint="Logo placements, legal claims, safe-zones.">
        <StringList
          value={s.mandatories}
          onChange={(mandatories) => onChange({ ...s, mandatories })}
          placeholder="e.g. Logo bottom-right"
          presets={COMMON_MANDATORIES}
        />
      </FieldRow>
    </div>
  );
}
