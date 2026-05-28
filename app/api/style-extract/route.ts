import { NextRequest } from 'next/server';
import { createSseResponse } from '@/lib/sse/stream';
import { makeEvent } from '@/lib/schemas/activity-event';
import { fetchUrlMeta, searchImagesByQuery } from '@/lib/scraping/url-meta';
import {
  STYLE_EXTRACTOR_INSTRUCTIONS,
  buildStyleExtractorPrompt,
  type ParsedStyleReport,
} from '@/lib/ai/style-extractor';
import { extractJson } from '@/lib/ai/prompt-utils';
import { parseTextRunRequest, providerLabel, runText } from '@/lib/ai/text-runner';
import { newProjectId } from '@/lib/utils/uuidv7';
import { briefs, bumpEditEpoch, projects, styleReports } from '@/lib/db/collections';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const projectId: string = body.projectId;

  const { response, writer } = createSseResponse();
  const requestId = newProjectId();

  (async () => {
    try {
      writer.send(makeEvent(requestId, { kind: 'start', step: 'style-extract', estDurationS: 30 }));

      const brief = await (await briefs()).findOne({ projectId });
      if (!brief) {
        writer.send(makeEvent(requestId, { kind: 'error', message: 'brief not found' }));
        writer.done();
        return;
      }

      const urlRefs = brief.references.inputs.filter((r) => r.kind === 'url');
      const uploadRefs = brief.references.inputs.filter((r) => r.kind === 'upload');
      const nameRefs = brief.references.inputs.filter((r) => r.kind === 'name').map((r) => r.value);

      writer.send(makeEvent(requestId, {
        kind: 'info',
        message: `Fetching ${urlRefs.length} URL(s)${nameRefs.length > 0 ? ` + ${nameRefs.length} brand search(es)` : ''}`,
        icon: 'fetch',
      }));

      const metas = await Promise.all(urlRefs.map((r) => fetchUrlMeta(r.value)));
      for (const m of metas) {
        if (m.ok) {
          const host = (() => { try { return new URL(m.finalUrl ?? m.url).hostname; } catch { return m.url; } })();
          writer.send(makeEvent(requestId, { kind: 'ok', message: `Loaded ${host} (${m.candidateImages.length} image candidate${m.candidateImages.length === 1 ? '' : 's'})` }));
        } else {
          writer.send(makeEvent(requestId, { kind: 'warn', message: `Could not load ${m.url} (${m.error})` }));
        }
      }

      // Collect product / category hint for search fallbacks.
      const productHint = [brief.product.name, brief.product.category].filter(Boolean).join(' ');

      // Brand-name fallback: when the user supplied competitor brand names
      // OR no URLs at all OR every URL failed, search for "<brand> product".
      const searchSeeds = new Set<string>();
      if (urlRefs.length === 0 || metas.every((m) => !m.ok || m.candidateImages.length === 0)) {
        if (brief.product.name) searchSeeds.add(`${brief.product.name} product photo`);
        for (const n of nameRefs) searchSeeds.add(`${n} ${productHint || 'product'}`);
      } else {
        // top-up: also issue a name-driven search to enrich the reference set
        for (const n of nameRefs) searchSeeds.add(`${n} ${productHint || 'product'}`);
      }

      const searchedImages: { url: string; source: string }[] = [];
      for (const query of searchSeeds) {
        writer.send(makeEvent(requestId, { kind: 'info', message: `Searching DuckDuckGo images: ${query}`, icon: 'fetch' }));
        const urls = await searchImagesByQuery(query, 5);
        if (urls.length > 0) {
          writer.send(makeEvent(requestId, { kind: 'ok', message: `Found ${urls.length} from image search "${query}"` }));
          for (const u of urls) searchedImages.push({ url: u, source: 'duckduckgo-image-search' });
        } else {
          writer.send(makeEvent(requestId, { kind: 'warn', message: `No image-search results for "${query}"` }));
        }
      }

      if (uploadRefs.length > 0) {
        writer.send(makeEvent(requestId, { kind: 'ok', message: `Including ${uploadRefs.length} uploaded reference image${uploadRefs.length === 1 ? '' : 's'}` }));
      }

      const prompt = buildStyleExtractorPrompt({ brief, metas, brandNameRefs: nameRefs });
      const runReq = parseTextRunRequest(body as Record<string, unknown>, STYLE_EXTRACTOR_INSTRUCTIONS, prompt);
      if (!runReq) {
        writer.send(
          makeEvent(requestId, {
            kind: 'error',
            message: 'No provider connected. Connect ChatGPT or add a BYO API key (top-right Settings).',
            nextAction: 'connect',
          })
        );
        writer.done();
        return;
      }

      writer.send(makeEvent(requestId, { kind: 'thinking', modelName: providerLabel(runReq), elapsedS: 0 }));

      const t0 = Date.now();
      const raw = await runText(runReq);
      const elapsedS = Math.round((Date.now() - t0) / 1000);
      writer.send(makeEvent(requestId, { kind: 'info', message: `Model returned in ${elapsedS}s`, icon: 'model' }));

      let parsed: ParsedStyleReport;
      try {
        parsed = extractJson<ParsedStyleReport>(raw);
      } catch (e) {
        writer.send(
          makeEvent(requestId, {
            kind: 'error',
            message: `Couldn't parse model JSON: ${e instanceof Error ? e.message : 'unknown'}`,
          })
        );
        writer.done();
        return;
      }

      const project = await (await projects()).findOne({ _id: projectId });
      const editEpoch = project?.editEpoch ?? 0;

      const competitorImages = [
        ...metas.flatMap((m) => {
          if (!m.ok) return [];
          // Prefer 2-3 best candidate images per URL when available.
          const picks = m.candidateImages.slice(0, 3);
          if (picks.length === 0 && m.ogImage) picks.push(m.ogImage);
          return picks.map((url) => ({
            url,
            source: m.finalUrl ?? m.url,
            pinned: true,
            classification: 'hero',
            confidence: 0.7,
          }));
        }),
        ...searchedImages.map((s) => ({
          url: s.url,
          source: s.source,
          pinned: true,
          classification: 'hero',
          confidence: 0.6,
        })),
        ...uploadRefs.map((u) => ({
          url: u.value,
          source: 'user-upload',
          pinned: true,
          classification: 'hero',
          confidence: 0.95,
        })),
      ];

      const doc = {
        _id: newProjectId(),
        projectId,
        derivedFrom: {
          editEpochAtGeneration: editEpoch,
          modelUsed: providerLabel(runReq),
          provider: runReq.kind === 'chatgpt' ? ('chatgpt' as const) : (runReq.provider as 'openai' | 'anthropic' | 'google'),
          generatedAt: new Date(),
          manualEdits: [] as string[],
        },
        competitorImages,
        palette: parsed.palette,
        lighting: parsed.lighting,
        composition: parsed.composition,
        props: parsed.props,
        copyPatterns: parsed.copyPatterns,
        audienceSignal: parsed.audienceSignal,
        negativePatterns: parsed.negativePatterns,
        evidence: parsed.evidence,
      };

      await (await styleReports()).replaceOne({ projectId }, doc, { upsert: true });
      await bumpEditEpoch(projectId);

      writer.send(makeEvent(requestId, { kind: 'data', data: doc }));
      writer.send(
        makeEvent(requestId, {
          kind: 'done',
          summary: `${parsed.palette.length} palette entries, ${parsed.evidence.length} evidence claims`,
        })
      );
    } catch (e) {
      writer.send(
        makeEvent(requestId, { kind: 'error', message: e instanceof Error ? e.message : 'unknown error' })
      );
    } finally {
      writer.done();
    }
  })();

  return response;
}

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) return new Response(JSON.stringify({ error: 'projectId required' }), { status: 400 });
  const doc = await (await styleReports()).findOne({ projectId });
  return new Response(JSON.stringify(doc ?? null), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { projectId, addImageUrls, replaceImages } = body as {
    projectId?: string;
    addImageUrls?: string[];
    replaceImages?: { url: string; source: string; pinned: boolean }[];
  };
  if (!projectId) return new Response(JSON.stringify({ error: 'projectId required' }), { status: 400 });

  const col = await styleReports();
  const existing = await col.findOne({ projectId });
  if (!existing) return new Response(JSON.stringify({ error: 'no style report yet' }), { status: 404 });

  const baseLen = existing.competitorImages?.length ?? 0;
  let next = existing.competitorImages ?? [];

  if (Array.isArray(replaceImages)) {
    next = replaceImages.map((r) => ({
      ...r,
      classification: 'hero',
      confidence: 0.7,
    }));
  } else if (Array.isArray(addImageUrls) && addImageUrls.length > 0) {
    const added = addImageUrls
      .filter((u) => typeof u === 'string' && u.trim().length > 4)
      .map((url) => ({
        url: url.trim(),
        source: (() => {
          try { return new URL(url.trim()).hostname; } catch { return 'manual'; }
        })(),
        pinned: true,
        classification: 'hero',
        confidence: 0.7,
      }));
    next = [...next, ...added];
  }

  await col.updateOne({ projectId }, { $set: { competitorImages: next } });
  return new Response(JSON.stringify({ ok: true, addedFromBase: next.length - baseLen, total: next.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
