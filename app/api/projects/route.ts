import { NextResponse } from 'next/server';
import { projects } from '@/lib/db/collections';
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
