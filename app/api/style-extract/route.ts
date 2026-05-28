import { NextRequest } from 'next/server';
import { createSseResponse } from '@/lib/sse/stream';
import { makeEvent } from '@/lib/schemas/activity-event';
import { fetchUrlMeta } from '@/lib/scraping/url-meta';
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
      const nameRefs = brief.references.inputs.filter((r) => r.kind === 'name').map((r) => r.value);

      writer.send(makeEvent(requestId, { kind: 'info', message: `Fetching ${urlRefs.length} URL(s)…`, icon: 'fetch' }));

      const metas = await Promise.all(urlRefs.map((r) => fetchUrlMeta(r.value)));
      for (const m of metas) {
        if (m.ok) writer.send(makeEvent(requestId, { kind: 'ok', message: `Loaded ${new URL(m.finalUrl ?? m.url).hostname}` }));
        else writer.send(makeEvent(requestId, { kind: 'warn', message: `Could not load ${m.url} (${m.error})` }));
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

      const competitorImages = metas.map((m) => ({
        url: m.ogImage ?? m.finalUrl ?? m.url,
        source: m.finalUrl ?? m.url,
        pinned: true,
        classification: m.ok ? 'hero' : undefined,
        confidence: m.ok ? 0.7 : 0,
      }));

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
