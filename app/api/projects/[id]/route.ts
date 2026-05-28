import { NextRequest, NextResponse } from 'next/server';
import {
  angleProposals,
  briefs,
  conceptBriefs,
  generatedImages,
  projects,
  promptDecks,
  styleReports,
} from '@/lib/db/collections';

export const runtime = 'nodejs';

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = await (await projects()).findOne({ _id: id });
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(p);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const allowed = ['step', 'theme', 'testBrand'] as const;
  const update: Record<string, unknown> = { lastTouchedAt: new Date() };
  for (const k of allowed) {
    if (k in body) update[k] = body[k];
  }
  await (await projects()).updateOne({ _id: id }, { $set: update });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await Promise.allSettled([
    (await briefs()).deleteMany({ projectId: id }),
    (await styleReports()).deleteMany({ projectId: id }),
    (await angleProposals()).deleteMany({ projectId: id }),
    (await conceptBriefs()).deleteMany({ projectId: id }),
    (await promptDecks()).deleteMany({ projectId: id }),
    (await generatedImages()).deleteMany({ projectId: id }),
  ]);
  await (await projects()).deleteOne({ _id: id });
  return NextResponse.json({ ok: true });
}
