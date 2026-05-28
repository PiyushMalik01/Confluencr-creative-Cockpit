'use client';

import { decryptFromStorage, encryptToStorage, STORAGE_KEYS } from '@/lib/storage/encrypted-local';

export type ChatGPTSession = {
  accessToken: string;
  refreshToken: string;
  accountId: string;
  email?: string;
  planType?: string;
  expiresAt: number;
};

export type CodexRequest = {
  instructions: string;
  input: string;
  model?: string;
  onDelta?: (chunk: string) => void;
  signal?: AbortSignal;
};

async function ensureFreshSession(): Promise<ChatGPTSession | null> {
  const s = await decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt);
  if (!s) return null;
  if (s.expiresAt - Date.now() > 60_000) return s;
  const r = await fetch('/api/auth/openai/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: s.refreshToken }),
  });
  if (!r.ok) return null;
  const data = await r.json();
  const next: ChatGPTSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    accountId: data.accountId ?? s.accountId,
    email: data.email ?? s.email,
    planType: data.planType ?? s.planType,
    expiresAt: Date.now() + (data.expiresIn ?? 3600) * 1000,
  };
  await encryptToStorage(STORAGE_KEYS.chatgpt, next);
  return next;
}

function parseSseLine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;
  const data = line.slice(6).trim();
  if (data === '[DONE]') return null;
  try {
    const parsed = JSON.parse(data);
    if (parsed.type === 'response.output_text.delta' && parsed.delta) return parsed.delta as string;
  } catch {
    /* ignore */
  }
  return null;
}

export async function streamCodex(req: CodexRequest): Promise<string> {
  const session = await ensureFreshSession();
  if (!session) throw new Error('No ChatGPT session. Connect ChatGPT first.');

  const r = await fetch('/api/codex/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessToken: session.accessToken,
      accountId: session.accountId,
      instructions: req.instructions,
      input: req.input,
      model: req.model ?? 'gpt-5.4',
    }),
    signal: req.signal,
  });

  if (!r.ok || !r.body) {
    let detail: string;
    try {
      detail = (await r.json()).error ?? `HTTP ${r.status}`;
    } catch {
      detail = `HTTP ${r.status}`;
    }
    throw new Error(detail);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const delta = parseSseLine(line);
      if (delta) {
        result += delta;
        req.onDelta?.(delta);
      }
    }
  }
  return result;
}
