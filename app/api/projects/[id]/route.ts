import { NextRequest, NextResponse } from 'next/server';
import { projects } from '@/lib/db/collections';

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
