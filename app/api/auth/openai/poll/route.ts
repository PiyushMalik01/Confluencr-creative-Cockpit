import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, parseIdToken, pollDeviceAuthorization } from '@/lib/ai/openai-oauth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { deviceAuthId, userCode } = await req.json();
  if (!deviceAuthId || !userCode) {
    return NextResponse.json({ error: 'deviceAuthId + userCode required' }, { status: 400 });
  }
  try {
    const auth = await pollDeviceAuthorization(deviceAuthId, userCode);
    if (!auth) return NextResponse.json({ authorized: false });
    const tokens = await exchangeCodeForTokens(auth.authorizationCode, auth.codeVerifier ?? '');
    const claims = tokens.idToken ? parseIdToken(tokens.idToken) : {};
    return NextResponse.json({
      authorized: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
      email: claims.email,
      accountId: claims.accountId,
      planType: claims.planType,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
