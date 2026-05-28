import { NextRequest } from 'next/server';
import { createSseResponse } from '@/lib/sse/stream';
import { makeEvent } from '@/lib/schemas/activity-event';
import {
  ANGLE_PROPOSER_INSTRUCTIONS,
  buildAnglePrompt,
  type AngleProposerOutput,
} from '@/lib/ai/angle-proposer';
import { extractJson } from '@/lib/ai/prompt-utils';
import { parseTextRunRequest, providerLabel, runText } from '@/lib/ai/text-runner';
import { newProjectId } from '@/lib/utils/uuidv7';
import { angleProposals, briefs, projects, styleReports } from '@/lib/db/collections';
import type { AngleProposal } from '@/lib/schemas/angle';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const projectId: string = body.projectId;

  const { response, writer } = createSseResponse();
  const requestId = newProjectId();

  (async () => {
    try {
      writer.send(makeEvent(requestId, { kind: 'start', step: 'angle-proposal', estDurationS: 15 }));

      const brief = await (await briefs()).findOne({ projectId });
      if (!brief) {
        writer.send(makeEvent(requestId, { kind: 'error', message: 'brief not found' }));
        return;
      }
      const styleReport = await (await styleReports()).findOne({ projectId });

      const prompt = buildAnglePrompt(brief, styleReport ?? null);
      const runReq = parseTextRunRequest(body as Record<string, unknown>, ANGLE_PROPOSER_INSTRUCTIONS, prompt);
      if (!runReq) {
        writer.send(
          makeEvent(requestId, {
            kind: 'error',
            message: 'No provider connected. Connect ChatGPT or add a BYO API key.',
            nextAction: 'connect',
          })
        );
        return;
      }

      writer.send(makeEvent(requestId, { kind: 'thinking', modelName: providerLabel(runReq), elapsedS: 0 }));

      const t0 = Date.now();
      const raw = await runText(runReq);
      const elapsedS = Math.round((Date.now() - t0) / 1000);
      writer.send(makeEvent(requestId, { kind: 'info', message: `Model returned in ${elapsedS}s`, icon: 'model' }));

      let parsed: AngleProposerOutput;
      try {
        parsed = extractJson<AngleProposerOutput>(raw);
      } catch (e) {
        writer.send(
          makeEvent(requestId, {
            kind: 'error',
            message: `Couldn't parse model JSON: ${e instanceof Error ? e.message : 'unknown'}`,
          })
        );
        return;
      }

      const project = await (await projects()).findOne({ _id: projectId });
      const editEpoch = project?.editEpoch ?? 0;

      const angles: AngleProposal[] = parsed.proposed.map((a) => ({
        id: newProjectId(),
        name: a.name,
        rationale: a.rationale,
        whitespaceClaim: a.whitespaceClaim,
        palette: a.palette.map((p) => ({ ...p, ratio: 0 })),
        typography: a.typography,
        sampleHeadline: a.sampleHeadline,
        confidence: a.confidence,
        custom: false,
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
        angles,
        pickedAngleIds: [] as string[],
        pickedOrder: [] as number[],
      };
      await (await angleProposals()).replaceOne({ projectId }, doc, { upsert: true });

      writer.send(makeEvent(requestId, { kind: 'data', data: doc }));
      writer.send(makeEvent(requestId, { kind: 'done', summary: `${angles.length} angles proposed` }));
    } catch (e) {
      writer.send(
        makeEvent(requestId, { kind: 'error', message: e instanceof Error ? e.message : 'unknown' })
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
  const doc = await (await angleProposals()).findOne({ projectId });
  return new Response(JSON.stringify(doc ?? null), {
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PATCH(req: NextRequest) {
  const { projectId, pickedAngleIds, pickedOrder, customAngles } = await req.json();
  if (!projectId) return new Response(JSON.stringify({ error: 'projectId required' }), { status: 400 });
  const col = await angleProposals();
  const update: Record<string, unknown> = {};
  if (Array.isArray(pickedAngleIds)) update.pickedAngleIds = pickedAngleIds;
  if (Array.isArray(pickedOrder)) update.pickedOrder = pickedOrder;
  if (Array.isArray(customAngles)) {
    const existing = await col.findOne({ projectId });
    update.angles = [...(existing?.angles ?? []), ...customAngles];
  }
  await col.updateOne({ projectId }, { $set: update });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
