import { NextRequest } from 'next/server';
import { createSseResponse } from '@/lib/sse/stream';
import { makeEvent } from '@/lib/schemas/activity-event';
import {
  CONCEPT_GENERATOR_INSTRUCTIONS,
  buildConceptPrompt,
  runQualityGate,
  type ConceptGeneratorOutput,
} from '@/lib/ai/concept-generator';
import { extractJson } from '@/lib/ai/prompt-utils';
import { parseTextRunRequest, providerLabel, runText } from '@/lib/ai/text-runner';
import { newProjectId } from '@/lib/utils/uuidv7';
import { angleProposals, briefs, conceptBriefs, projects, styleReports } from '@/lib/db/collections';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const projectId: string = body.projectId;

  const { response, writer } = createSseResponse();

  (async () => {
    try {
      const brief = await (await briefs()).findOne({ projectId });
      const style = await (await styleReports()).findOne({ projectId });
      const angles = await (await angleProposals()).findOne({ projectId });

      if (!brief || !angles) {
        writer.send(
          makeEvent('orchestrator', { kind: 'error', message: 'brief or angles not found' })
        );
        return;
      }

      const picked = (angles.pickedAngleIds ?? [])
        .map((id) => angles.angles.find((a) => a.id === id))
        .filter(<T>(x: T | undefined): x is T => x !== undefined)
        .slice(0, 3);

      if (picked.length < 3) {
        writer.send(
          makeEvent('orchestrator', { kind: 'error', message: 'Pick 3 angles before generating concepts.' })
        );
        return;
      }

      // Build a stub run-request just to validate provider presence; per-concept
      // requests are built inside the loop with their own input.
      const probe = parseTextRunRequest(body as Record<string, unknown>, CONCEPT_GENERATOR_INSTRUCTIONS, '');
      if (!probe) {
        writer.send(
          makeEvent('orchestrator', {
            kind: 'error',
            message: 'No provider connected. Connect ChatGPT or add a BYO API key.',
            nextAction: 'connect',
          })
        );
        return;
      }

      const project = await (await projects()).findOne({ _id: projectId });
      const editEpoch = project?.editEpoch ?? 0;

      writer.send(
        makeEvent('orchestrator', { kind: 'start', step: 'concept-briefs', estDurationS: 30 })
      );

      // Fire 3 generations in parallel, each with its own requestId
      const tasks = picked.map(async (angle, idx) => {
        const requestId = `concept-${idx + 1}-${angle.id}`;
        try {
          const prompt = buildConceptPrompt({ brief, style: style ?? null, angle });
          const runReq = parseTextRunRequest(body as Record<string, unknown>, CONCEPT_GENERATOR_INSTRUCTIONS, prompt)!;
          writer.send(makeEvent(requestId, { kind: 'thinking', modelName: providerLabel(runReq), elapsedS: 0 }));
          const t0 = Date.now();
          const raw = await runText(runReq);
          const elapsedS = Math.round((Date.now() - t0) / 1000);
          writer.send(
            makeEvent(requestId, {
              kind: 'info',
              message: `Concept ${idx + 1} (${angle.name}) ${elapsedS}s`,
              icon: 'model',
            })
          );

          const parsed = extractJson<ConceptGeneratorOutput>(raw);
          const qg = runQualityGate({ brief, result: parsed });

          const doc = {
            _id: newProjectId(),
            projectId,
            angleId: angle.id,
            position: (idx + 1) as 1 | 2 | 3,
            derivedFrom: {
              editEpochAtGeneration: editEpoch,
              modelUsed: providerLabel(runReq),
              provider: runReq.kind === 'chatgpt' ? ('chatgpt' as const) : (runReq.provider as 'openai' | 'anthropic' | 'google'),
              generatedAt: new Date(),
              manualEdits: [] as string[],
            },
            ...parsed,
            qualityGate: qg,
          };

          await (await conceptBriefs()).replaceOne(
            { projectId, angleId: angle.id },
            doc,
            { upsert: true }
          );

          writer.send(makeEvent(requestId, { kind: 'data', data: doc }));
          writer.send(
            makeEvent(requestId, {
              kind: 'done',
              summary: `${angle.name} ready${qg.issues.length > 0 ? ` (${qg.issues.length} QA notes)` : ''}`,
            })
          );
        } catch (e) {
          writer.send(
            makeEvent(requestId, {
              kind: 'error',
              message: `Concept ${idx + 1} failed: ${e instanceof Error ? e.message : 'unknown'}`,
            })
          );
        }
      });

      await Promise.allSettled(tasks);
      writer.send(makeEvent('orchestrator', { kind: 'done', summary: 'All concepts processed' }));
    } catch (e) {
      writer.send(
        makeEvent('orchestrator', { kind: 'error', message: e instanceof Error ? e.message : 'unknown' })
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
  const docs = await (await conceptBriefs()).find({ projectId }).sort({ position: 1 }).toArray();
  return new Response(JSON.stringify(docs), {
    headers: { 'Content-Type': 'application/json' },
  });
}
