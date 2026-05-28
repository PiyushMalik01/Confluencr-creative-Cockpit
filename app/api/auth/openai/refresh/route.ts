import { NextRequest, NextResponse } from 'next/server';
import { parseIdToken, refreshAccessToken } from '@/lib/ai/openai-oauth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  if (!refreshToken) return NextResponse.json({ error: 'refreshToken required' }, { status: 400 });
  try {
    const out = await refreshAccessToken(refreshToken);
    const claims = out.idToken ? parseIdToken(out.idToken) : {};
    return NextResponse.json({ ...out, ...claims });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
