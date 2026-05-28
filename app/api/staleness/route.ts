import { NextRequest, NextResponse } from 'next/server';
import {
  angleProposals,
  conceptBriefs,
  projects,
  promptDecks,
  styleReports,
} from '@/lib/db/collections';

export const runtime = 'nodejs';

export type StalenessMap = {
  editEpoch: number;
  styleReport: { exists: boolean; stale: boolean };
  angles: { exists: boolean; stale: boolean };
  concepts: { exists: boolean; stale: boolean };
  deck: { exists: boolean; stale: boolean };
};

export async function GET(req: NextRequest) {
  const projectId = new URL(req.url).searchParams.get('projectId');
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const p = await (await projects()).findOne({ _id: projectId });
  const epoch = p?.editEpoch ?? 0;

  const sr = await (await styleReports()).findOne({ projectId });
  const ang = await (await angleProposals()).findOne({ projectId });
  const cb = await (await conceptBriefs())
    .find({ projectId })
    .sort({ position: 1 })
    .toArray();
  const deck = await (await promptDecks()).findOne({ projectId });

  const minConceptEpoch = cb.length
    ? Math.min(...cb.map((c) => c.derivedFrom.editEpochAtGeneration))
    : null;

  const map: StalenessMap = {
    editEpoch: epoch,
    styleReport: {
      exists: !!sr,
      stale: !!sr && sr.derivedFrom.editEpochAtGeneration < epoch,
    },
    angles: {
      exists: !!ang,
      stale: !!ang && ang.derivedFrom.editEpochAtGeneration < epoch,
    },
    concepts: {
      exists: cb.length > 0,
      stale: minConceptEpoch !== null && minConceptEpoch < epoch,
    },
    deck: {
      exists: !!deck,
      stale: !!deck && deck.derivedFrom.editEpochAtGeneration < epoch,
    },
  };
  return NextResponse.json(map);
}
