import { NextResponse } from 'next/server';
import { briefs, projects } from '@/lib/db/collections';
import { newProjectId } from '@/lib/utils/uuidv7';

export const runtime = 'nodejs';

export async function POST() {
  const id = newProjectId();
  const now = new Date();
  try {
    await (await projects()).insertOne({
      _id: id,
      createdAt: now,
      lastTouchedAt: now,
      editEpoch: 0,
      step: 1,
      theme: 'dark',
    });
    return NextResponse.json({ id });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const projectDocs = await (await projects())
      .find({})
      .sort({ lastTouchedAt: -1 })
      .limit(40)
      .toArray();
    const ids = projectDocs.map((p) => p._id);
    const briefDocs = await (await briefs()).find({ projectId: { $in: ids } }).toArray();
    const nameById = new Map(briefDocs.map((b) => [b.projectId, b.product?.name?.trim() || '']));
    const list = projectDocs.map((p) => ({
      id: p._id,
      name: nameById.get(p._id) || '',
      step: p.step ?? 1,
      lastTouchedAt: p.lastTouchedAt,
      createdAt: p.createdAt,
    }));
    return NextResponse.json(list);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
