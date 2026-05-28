import { NextRequest } from 'next/server';
import { createSseResponse } from '@/lib/sse/stream';
import { makeEvent } from '@/lib/schemas/activity-event';
import { extractJson } from '@/lib/ai/prompt-utils';
import { parseTextRunRequest, providerLabel, runText } from '@/lib/ai/text-runner';
import { newProjectId } from '@/lib/utils/uuidv7';
import { fetchUrlMeta } from '@/lib/scraping/url-meta';
import { briefs, bumpEditEpoch } from '@/lib/db/collections';

export const runtime = 'nodejs';
export const maxDuration = 300;

const INSTRUCTIONS = `You are filling a brand brief from a seed input (either a URL, a brand+product name, or both).

Use both the scraped page metadata (if provided) AND your training knowledge of the brand to populate every field you can. Do not invent unknown specifics — for fields you cannot infer with reasonable confidence, return an empty string or an empty array.

Output a JSON object EXACTLY matching:

type Output = {
  product: {
    name: string;
    oneLiner: string;
    category: "fashion"|"beauty"|"wellness"|"sportswear"|"home"|"food"|"tech"|"other";
    priceTier?: "value"|"mid"|"premium"|"luxury";
  };
  audience: {
    description: string;       // 1-2 sentences
    signalPreset?: string;     // e.g. "Tier 1 Gen Z streetwear"
    insight: string;           // 1 sentence customer insight
  };
  strategy: {
    smp: string;               // single-minded proposition
    rtbs: string[];            // 1-3 reasons to believe
  };
  brand: {
    palette: { hex: "#RRGGBB"; role: "primary"|"accent"|"neutral"|"background"; ratio: number }[];  // 2-4 entries, ratios sum to 1.0
    typography?: string;
    voiceOpposites: { x: string; y: string }[];   // 1-3 opposites
  };
  references: {
    inputs: { kind: "name"|"url"; value: string }[];  // 3-5 competitor brand names or product URLs that are obvious peers
    doNotInclude: string[];                            // 3-5 specific cliches to avoid for this brand
  };
  surfaces: {
    aspectRatios: ("1:1"|"4:5"|"9:16"|"16:9")[];    // default ["1:1","4:5"]
    mandatories: string[];                            // logo placement etc; can be empty
  };
};

Be specific. Indian D2C context if applicable. Use real brand palette hex codes if you know them.

Return ONLY the JSON object. No markdown, no commentary.`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const projectId: string = body.projectId;
  const seed: string = (body.seed ?? '').trim();

  const { response, writer } = createSseResponse();
  const requestId = newProjectId();

  (async () => {
    try {
      writer.send(makeEvent(requestId, { kind: 'start', step: 'brief-autofill', estDurationS: 20 }));
      if (!seed) {
        writer.send(makeEvent(requestId, { kind: 'error', message: 'seed required' }));
        return;
      }
      // Pre-build a stub so parseTextRunRequest knows the shape it needs to fill.
      const runReqStub = parseTextRunRequest(body as Record<string, unknown>, INSTRUCTIONS, '');
      if (!runReqStub) {
        writer.send(makeEvent(requestId, {
          kind: 'error',
          message: 'No provider connected. Connect ChatGPT or add a BYO API key (top-right Settings).',
          nextAction: 'connect',
        }));
        return;
      }

      // Detect URL vs name
      const isUrl = /^https?:\/\//i.test(seed);
      let scraped = '';
      if (isUrl) {
        writer.send(makeEvent(requestId, { kind: 'info', message: `Fetching ${new URL(seed).hostname}`, icon: 'fetch' }));
        const meta = await fetchUrlMeta(seed);
        if (meta.ok) {
          writer.send(makeEvent(requestId, { kind: 'ok', message: `Loaded ${meta.siteName ?? new URL(seed).hostname}` }));
          scraped = [
            `URL: ${meta.finalUrl ?? meta.url}`,
            meta.siteName && `Site: ${meta.siteName}`,
            meta.title && `Title: ${meta.title}`,
            meta.description && `Description: ${meta.description}`,
            meta.ogImage && `OG image: ${meta.ogImage}`,
          ].filter(Boolean).join('\n');
        } else {
          writer.send(makeEvent(requestId, { kind: 'warn', message: `Scrape failed (${meta.error}); using brand-name knowledge only` }));
        }
      }

      const userInput = isUrl
        ? `# SEED URL\n${seed}\n\n# SCRAPED METADATA\n${scraped || '(scrape failed; rely on brand knowledge)'}\n\nFill the brief.`
        : `# SEED PRODUCT / BRAND NAME\n${seed}\n\nUse your training knowledge of this brand to fill the brief.`;

      const runReq = parseTextRunRequest(body as Record<string, unknown>, INSTRUCTIONS, userInput)!;
      writer.send(makeEvent(requestId, { kind: 'thinking', modelName: providerLabel(runReq), elapsedS: 0 }));

      const t0 = Date.now();
      const raw = await runText(runReq);
      const elapsedS = Math.round((Date.now() - t0) / 1000);
      writer.send(makeEvent(requestId, { kind: 'info', message: `Model returned in ${elapsedS}s`, icon: 'model' }));

      let parsed: unknown;
      try {
        parsed = extractJson(raw);
      } catch (e) {
        writer.send(makeEvent(requestId, {
          kind: 'error',
          message: `Couldn't parse model JSON: ${e instanceof Error ? e.message : 'unknown'}`,
        }));
        return;
      }

      // Merge into existing brief (preserve any user-set fields by not destroying)
      const col = await briefs();
      const existing = await col.findOne({ projectId });
      const filled = parsed as Record<string, Record<string, unknown>>;
      const merged: Record<string, unknown> = {
        product: { ...(existing?.product ?? {}), ...(filled.product ?? {}) },
        audience: { ...(existing?.audience ?? {}), ...(filled.audience ?? {}) },
        strategy: { ...(existing?.strategy ?? {}), ...(filled.strategy ?? {}) },
        brand: { ...(existing?.brand ?? {}), ...(filled.brand ?? {}) },
        references: {
          ...(existing?.references ?? {}),
          ...(filled.references ?? {}),
          competitorMode: 'name',
        },
        surfaces: { ...(existing?.surfaces ?? {}), ...(filled.surfaces ?? {}) },
        updatedAt: new Date(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await col.updateOne({ projectId }, { $set: merged } as any);
      await bumpEditEpoch(projectId);

      writer.send(makeEvent(requestId, { kind: 'data', data: merged }));
      writer.send(makeEvent(requestId, { kind: 'done', summary: 'Brief auto-filled. Review and edit anything.' }));
    } catch (e) {
      writer.send(makeEvent(requestId, { kind: 'error', message: e instanceof Error ? e.message : 'unknown' }));
    } finally {
      writer.done();
    }
  })();

  return response;
}
