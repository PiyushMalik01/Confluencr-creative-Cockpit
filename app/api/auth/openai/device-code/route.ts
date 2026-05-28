import { NextResponse } from 'next/server';
import { requestDeviceCode } from '@/lib/ai/openai-oauth';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const data = await requestDeviceCode();
    return NextResponse.json(data);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
