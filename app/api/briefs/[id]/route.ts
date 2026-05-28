import { NextRequest, NextResponse } from 'next/server';
import { briefs, bumpEditEpoch } from '@/lib/db/collections';
import { emptyBrief } from '@/lib/schemas/brief';
import { newProjectId } from '@/lib/utils/uuidv7';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const col = await briefs();
  let b = await col.findOne({ projectId: id });
  if (!b) {
    const briefId = newProjectId();
    const next = emptyBrief(id, briefId);
    await col.insertOne(next);
    b = next;
  }
  return NextResponse.json(b);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const patch = await req.json();
  const col = await briefs();
  await col.updateOne(
    { projectId: id },
    { $set: { ...patch, updatedAt: new Date() } },
    { upsert: false }
  );
  await bumpEditEpoch(id);
  return NextResponse.json({ ok: true });
}
