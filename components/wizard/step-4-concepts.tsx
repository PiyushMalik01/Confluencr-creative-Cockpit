'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ChevronDown, Copy, Play, RotateCcw } from 'lucide-react';
import { ActivityTicker } from '@/components/activity-ticker';
import { useSseStream } from '@/lib/hooks/use-sse-stream';
import { useSession } from '@/lib/session-context';
import type { ConceptBrief } from '@/lib/schemas/concept-brief';
import { cn } from '@/lib/utils';

export function Step4Concepts({ projectId, onContinue }: { projectId: string; onContinue: () => void }) {
  const { events, busy, start } = useSseStream();
  const { session } = useSession();
  const [docs, setDocs] = useState<ConceptBrief[]>([]);
  const needChatgpt = !session;

  useEffect(() => {
    fetch(`/api/concept-briefs?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d) ? d : []));
  }, [projectId]);

  // Refresh from server when SSE indicates new data
  useEffect(() => {
    if (!events.length) return;
    const done = events.find((e) => e.kind === 'done' && e.requestId === 'orchestrator');
    if (!done) return;
    fetch(`/api/concept-briefs?projectId=${projectId}`)
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d) ? d : []));
  }, [events, projectId]);

  const run = useCallback(async () => {
    if (!session) return;
    await start('/api/concept-briefs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        accessToken: session.accessToken,
        accountId: session.accountId,
      }),
    });
  }, [projectId, session, start]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-[color:var(--color-muted-foreground)]">
          Three execution-ready concept briefs, one per picked angle. Generated in parallel.
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 px-3 py-1.5 text-xs hover:bg-[color:var(--color-muted)] disabled:opacity-50 transition-colors"
        >
          {docs.length > 0 ? <RotateCcw className="size-3" /> : <Play className="size-3" />}
          {busy ? 'Generating…' : docs.length > 0 ? 'Re-generate' : 'Generate concept briefs'}
        </button>
      </div>

      {needChatgpt && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
          Connect ChatGPT first (top-right Settings).
        </div>
      )}

      <ActivityTicker events={events} />

      {docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc) => (
            <ConceptCard key={doc._id} concept={doc} />
          ))}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onContinue}
              className="rounded-full bg-[color:var(--color-foreground)] text-[color:var(--color-background)] px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Continue to Step 5 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptCard({ concept }: { concept: ConceptBrief }) {
  const [open, setOpen] = useState(true);
  const issuesCount = concept.qualityGate.issues.length;

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3.5 text-left"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-[color:var(--color-foreground)] text-[color:var(--color-background)] text-xs font-semibold shrink-0">
          {concept.position}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate">{concept.themeStatement}</div>
          <div className="text-xs text-[color:var(--color-muted-foreground)] truncate">
            {concept.shotRecipe.shotType} · {concept.copy.headline}
          </div>
        </div>
        {issuesCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px]">
            <AlertCircle className="size-3" /> {issuesCount} QA note{issuesCount !== 1 ? 's' : ''}
          </span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="size-4 text-[color:var(--color-muted-foreground)]" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-4 border-t border-[color:var(--color-border)]/50">
              <Section label="Strategic rationale">
                <p className="text-xs leading-relaxed">{concept.strategicRationale}</p>
              </Section>

              <Section label="Color story">
                <div className="space-y-1">
                  {concept.colorStory.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span
                        className="size-5 rounded border border-[color:var(--color-border)]"
                        style={{ background: c.hex }}
                      />
                      <span className="font-mono">{c.hex}</span>
                      <span className="text-[color:var(--color-muted-foreground)]">{c.role}</span>
                      <div className="flex-1 h-1 rounded-full bg-[color:var(--color-muted)] overflow-hidden">
                        <div className="h-full bg-[color:var(--color-foreground)]" style={{ width: `${c.ratio * 100}%` }} />
                      </div>
                      <span className="font-mono w-9 text-right">{Math.round(c.ratio * 100)}%</span>
                    </div>
                  ))}
                </div>
              </Section>

              <Section label="Typography">
                <div className="text-xs space-y-1">
                  <div>
                    <span className="text-[color:var(--color-muted-foreground)]">Display:</span> {concept.typography.display}
                  </div>
                  <div>
                    <span className="text-[color:var(--color-muted-foreground)]">Body:</span> {concept.typography.body}
                  </div>
                </div>
              </Section>

              <Section label="Shot recipe">
                <dl className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
                  <Pair k="shotType" v={concept.shotRecipe.shotType} />
                  <Pair k="lighting" v={concept.shotRecipe.lighting} />
                  <Pair k="composition" v={concept.shotRecipe.composition} />
                  <Pair k="lens" v={concept.shotRecipe.lens} />
                  <Pair k="setting" v={concept.shotRecipe.setting} />
                  {concept.shotRecipe.props.length > 0 && (
                    <Pair k="props" v={concept.shotRecipe.props.join(', ')} />
                  )}
                </dl>
              </Section>

              <Section label="Copy">
                <div className="text-xs space-y-1">
                  <div className="font-mono uppercase tracking-wider">{concept.copy.headline}</div>
                  {concept.copy.subhead && <div>{concept.copy.subhead}</div>}
                  <div className="text-[color:var(--color-muted-foreground)]">CTA: {concept.copy.cta}</div>
                </div>
              </Section>

              {concept.mandatories.length > 0 && (
                <Section label="Mandatories">
                  <ul className="text-xs space-y-1">
                    {concept.mandatories.map((m, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span
                          className={cn(
                            'mt-0.5 size-3 rounded-sm shrink-0 flex items-center justify-center',
                            m.satisfied
                              ? 'bg-emerald-500/20 text-emerald-600'
                              : 'bg-rose-500/15 text-rose-600'
                          )}
                        >
                          {m.satisfied ? '✓' : '✗'}
                        </span>
                        <span>{m.item}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {issuesCount > 0 && (
                <Section label="Quality gate">
                  <ul className="text-xs space-y-1">
                    {concept.qualityGate.issues.map((iss, i) => (
                      <li
                        key={i}
                        className={cn(
                          'flex items-start gap-2',
                          iss.severity === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        )}
                      >
                        <AlertCircle className="mt-0.5 size-3 shrink-0" />
                        <span>
                          <span className="font-mono text-[10px]">{iss.field}:</span> {iss.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {concept.craft && <CraftDepthBlock craft={concept.craft} />}

              <Section label="Prompts">
                <PromptList prompts={concept.prompts} negative={concept.negativePrompt} />
              </Section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CraftDepthBlock({ craft }: { craft: NonNullable<ConceptBrief['craft']> }) {
  return (
    <div className="space-y-3 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-muted)]/40 p-3.5">
      <div className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--color-muted-foreground)] flex items-center gap-2">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Craft depth · the thinking behind the prompts
      </div>

      <Section label="Why this stack">
        <p className="text-xs leading-relaxed italic text-[color:var(--color-foreground)]">{craft.thinking}</p>
      </Section>

      <Section label="Optical (lens spec)">
        <dl className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
          <Pair k="sensor" v={craft.lensSpec.sensor} />
          <Pair k="focal" v={craft.lensSpec.focalLength} />
          <Pair k="aperture" v={craft.lensSpec.aperture} />
          {craft.lensSpec.shutter && <Pair k="shutter" v={craft.lensSpec.shutter} />}
          {craft.lensSpec.iso && <Pair k="iso" v={craft.lensSpec.iso} />}
          <Pair k="dof" v={craft.lensSpec.depthOfField} />
        </dl>
      </Section>

      <Section label="Photometric (lighting diagram)">
        <dl className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
          <Pair k="key" v={`${craft.lighting.key.modifier} · ${craft.lighting.key.angleDeg} · ${craft.lighting.key.temperatureK}K${craft.lighting.key.intensityStops ? ` · ${craft.lighting.key.intensityStops}` : ''}`} />
          {craft.lighting.fill && (
            <Pair k="fill" v={`${craft.lighting.fill.modifier} · ${craft.lighting.fill.ratio}`} />
          )}
          {craft.lighting.rim && (
            <Pair k="rim" v={`${craft.lighting.rim.modifier} · ${craft.lighting.rim.angleDeg} · ${craft.lighting.rim.temperatureK}K`} />
          )}
          {craft.lighting.ambient && <Pair k="ambient" v={craft.lighting.ambient} />}
          <Pair k="shadow density" v={craft.lighting.shadowDensity.toFixed(2)} />
        </dl>
        {craft.lighting.notes && (
          <p className="text-xs mt-1.5 text-[color:var(--color-muted-foreground)]">{craft.lighting.notes}</p>
        )}
      </Section>

      <Section label="Material rendering">
        <dl className="text-xs space-y-1">
          <Pair k="subject" v={craft.material.subjectMaterial} />
          {craft.material.subsurfaceCue && <Pair k="subsurface" v={craft.material.subsurfaceCue} />}
          <Pair k="specular" v={craft.material.specularIntensity} />
          {craft.material.microfacetRoughness && <Pair k="roughness" v={craft.material.microfacetRoughness} />}
          {craft.material.brdfNotes && <Pair k="brdf" v={craft.material.brdfNotes} />}
          {craft.material.postSheen && <Pair k="sheen" v={craft.material.postSheen} />}
        </dl>
      </Section>

      <Section label="Post processing">
        <dl className="text-xs space-y-1">
          <Pair k="grain" v={craft.post.grainISO} />
          <Pair k="shadows" v={craft.post.gradeShadows} />
          <Pair k="highlights" v={craft.post.gradeHighlights} />
          <Pair k="curve" v={craft.post.contrastCurve} />
          {craft.post.vignette && <Pair k="vignette" v={craft.post.vignette} />}
          {craft.post.lutStyle && <Pair k="lut" v={craft.post.lutStyle} />}
        </dl>
      </Section>

      <Section label="References (technique citations)">
        <div className="text-xs space-y-1">
          {craft.references.photographers.length > 0 && (
            <Pair k="technique" v={craft.references.photographers.join(' · ')} />
          )}
          {craft.references.publications.length > 0 && (
            <Pair k="publication" v={craft.references.publications.join(' · ')} />
          )}
          {craft.references.brandCampaigns.length > 0 && (
            <Pair k="brand" v={craft.references.brandCampaigns.join(' · ')} />
          )}
          {craft.references.cinematicTouchstones.length > 0 && (
            <Pair k="cinema" v={craft.references.cinematicTouchstones.join(' · ')} />
          )}
          {craft.references.notes && (
            <p className="text-[color:var(--color-muted-foreground)] mt-1">{craft.references.notes}</p>
          )}
        </div>
      </Section>

      <Section label="Audience signal in pixels">
        <dl className="text-xs space-y-1">
          <Pair k="props" v={craft.audiencePixels.propLanguage} />
          <Pair k="framing" v={craft.audiencePixels.framingLanguage} />
          <Pair k="grade" v={craft.audiencePixels.gradeLanguage} />
          {craft.audiencePixels.grainLanguage && <Pair k="grain" v={craft.audiencePixels.grainLanguage} />}
        </dl>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-[color:var(--color-muted-foreground)] uppercase tracking-wider mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Pair({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <span className="text-[color:var(--color-muted-foreground)] font-mono text-[10px] mr-1">{k}:</span>
      <span>{v}</span>
    </div>
  );
}

function PromptList({
  prompts,
  negative,
}: {
  prompts: ConceptBrief['prompts'];
  negative: string;
}) {
  const entries: { label: string; key: keyof ConceptBrief['prompts']; text: string }[] = [
    { label: 'Midjourney', key: 'midjourney', text: prompts.midjourney },
    { label: 'Flux Kontext', key: 'flux', text: prompts.flux },
    { label: 'Nano Banana Pro', key: 'nanoBanana', text: prompts.nanoBanana },
    { label: 'GPT-Image', key: 'gptImage', text: prompts.gptImage },
    { label: 'Ideogram', key: 'ideogram', text: prompts.ideogram },
  ];
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <PromptBlock key={e.key} label={e.label} text={e.text} />
      ))}
      <PromptBlock label="Negative prompt" text={negative} muted />
    </div>
  );
}

function PromptBlock({ label, text, muted }: { label: string; text: string; muted?: boolean }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div
      className={cn(
        'rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-muted)] overflow-hidden',
        muted && 'opacity-90'
      )}
    >
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-[color:var(--color-border)]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[color:var(--color-muted-foreground)]">
          {label}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1 text-[10px] text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)] transition-colors"
        >
          <Copy className="size-3" />
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <pre className="px-2.5 py-1.5 text-xs whitespace-pre-wrap font-mono leading-relaxed">{text}</pre>
    </div>
  );
}
