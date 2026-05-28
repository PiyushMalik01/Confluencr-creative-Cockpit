import { NextRequest, NextResponse } from 'next/server';
import { angleProposals, briefs, conceptBriefs, projects, promptDecks } from '@/lib/db/collections';
import { assembleDeck } from '@/lib/prompt-deck/assemble';
import { newProjectId } from '@/lib/utils/uuidv7';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });
  const doc = await (await promptDecks()).findOne({ projectId });
  return NextResponse.json(doc ?? null);
}

export async function POST(req: NextRequest) {
  const { projectId, includeAllToolVariants } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const brief = await (await briefs()).findOne({ projectId });
  const concepts = await (await conceptBriefs()).find({ projectId }).sort({ position: 1 }).toArray();
  const angles = await (await angleProposals()).findOne({ projectId });
  const project = await (await projects()).findOne({ _id: projectId });

  if (!brief || concepts.length === 0) {
    return NextResponse.json({ error: 'brief or concepts missing' }, { status: 400 });
  }

  const angleNameByConceptId: Record<string, string> = {};
  for (const c of concepts) {
    const angle = angles?.angles.find((a) => a.id === c.angleId);
    if (angle) angleNameByConceptId[c._id] = angle.name;
  }

  const cards = assembleDeck({
    brief,
    concepts,
    angleNameByConceptId,
    includeAllToolVariants: !!includeAllToolVariants,
  });

  const docNoId = {
    projectId,
    derivedFrom: {
      editEpochAtGeneration: project?.editEpoch ?? 0,
      modelUsed: 'rule-based-assembly',
      provider: 'manual' as const,
      generatedAt: new Date(),
      manualEdits: [] as string[],
    },
    cards,
  };
  const pdCol = await promptDecks();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await pdCol.updateOne({ projectId }, { $set: docNoId as any, $setOnInsert: { _id: newProjectId() } as any }, { upsert: true });
  const doc = await pdCol.findOne({ projectId });

  return NextResponse.json(doc);
}
