export const OPENAI_CONSTANTS = {
  CLIENT_ID: 'app_EMoamEEZ73f0CkXaXp7hrann',
  DEVICE_CODE_ENDPOINT: 'https://auth.openai.com/api/accounts/deviceauth/usercode',
  POLL_ENDPOINT: 'https://auth.openai.com/api/accounts/deviceauth/poll',
  TOKEN_EXCHANGE_ENDPOINT: 'https://auth.openai.com/oauth/token',
  CODEX_API_ENDPOINT: 'https://chatgpt.com/backend-api/codex/responses',
  VERIFICATION_URL: 'https://auth.openai.com/codex/device',
  DEVICE_CODE_EXPIRY_S: 900,
} as const;

export function parseIdToken(idToken: string): {
  email?: string;
  accountId?: string;
  planType?: string;
} {
  const parts = idToken.split('.');
  if (parts.length !== 3) return {};
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const authClaims = payload['https://api.openai.com/auth'] ?? {};
    return {
      email: payload.email,
      accountId: authClaims.chatgpt_account_id ?? payload.chatgpt_account_id,
      planType: authClaims.chatgpt_plan_type ?? payload.chatgpt_plan_type,
    };
  } catch {
    return {};
  }
}

export async function requestDeviceCode(): Promise<{
  deviceAuthId: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
}> {
  const res = await fetch(OPENAI_CONSTANTS.DEVICE_CODE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: OPENAI_CONSTANTS.CLIENT_ID }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Device code request failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  return {
    deviceAuthId: data.device_code ?? data.device_auth_id,
    userCode: data.user_code,
    verificationUrl: data.verification_uri ?? data.verification_url ?? OPENAI_CONSTANTS.VERIFICATION_URL,
    expiresIn: data.expires_in ?? OPENAI_CONSTANTS.DEVICE_CODE_EXPIRY_S,
    interval: data.interval ?? 5,
  };
}

export async function pollDeviceAuthorization(
  deviceAuthId: string,
  userCode: string
): Promise<{ authorizationCode: string; codeVerifier?: string } | null> {
  const res = await fetch(OPENAI_CONSTANTS.POLL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_auth_id: deviceAuthId, user_code: userCode }),
  });
  if (res.status === 403 || res.status === 404) return null;
  if (res.status === 410) throw new Error('Device code expired');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Poll failed (${res.status}): ${body}`);
  }
  const data = await res.json();
  if (data.error === 'authorization_pending' || data.error === 'slow_down') return null;
  if (data.error) throw new Error(`Device authorization failed: ${data.error}`);
  return {
    authorizationCode: data.authorization_code ?? data.code,
    codeVerifier: data.code_verifier,
  };
}

export async function exchangeCodeForTokens(
  authorizationCode: string,
  codeVerifier: string
): Promise<{ accessToken: string; refreshToken: string; idToken?: string; expiresIn: number }> {
  const body = new URLSearchParams({
    client_id: OPENAI_CONSTANTS.CLIENT_ID,
    grant_type: 'authorization_code',
    code: authorizationCode,
    redirect_uri: 'https://auth.openai.com/deviceauth/callback',
    code_verifier: codeVerifier,
  });
  const res = await fetch(OPENAI_CONSTANTS.TOKEN_EXCHANGE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token,
    expiresIn: data.expires_in ?? 3600,
  };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string; idToken?: string; expiresIn: number }> {
  const res = await fetch(OPENAI_CONSTANTS.TOKEN_EXCHANGE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: OPENAI_CONSTANTS.CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? refreshToken,
    idToken: data.id_token,
    expiresIn: data.expires_in ?? 3600,
  };
}
