/**
 * Server-side text-LLM runner. Routes to ChatGPT (Codex) when a ChatGPT
 * access token is supplied, otherwise falls back to OpenAI / Anthropic /
 * Google direct APIs using a BYO key.
 *
 * Returns the model's complete text response so the caller can JSON-parse it.
 */

import { OPENAI_CONSTANTS } from '@/lib/ai/openai-oauth';

export type TextRunInput =
  | { kind: 'chatgpt'; accessToken: string; accountId: string; instructions: string; input: string; model?: string }
  | { kind: 'byo'; provider: 'openai' | 'anthropic' | 'google'; apiKey: string; instructions: string; input: string; model?: string };

function sanitizeToAscii(text: string): string {
  return text.replace(/[^\x20-\x7E\n\r\t]/g, '').replace(/\{\{.*?\}\}/g, '');
}

async function runChatGPT(opts: {
  accessToken: string;
  accountId: string;
  instructions: string;
  input: string;
  model?: string;
}): Promise<string> {
  const res = await fetch(OPENAI_CONSTANTS.CODEX_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${opts.accessToken}`,
      'chatgpt-account-id': opts.accountId,
    },
    body: JSON.stringify({
      model: opts.model ?? 'gpt-5.4',
      instructions: sanitizeToAscii(opts.instructions),
      input: [{ role: 'user', content: sanitizeToAscii(opts.input) }],
      store: false,
      stream: true,
    }),
  });
  if (!res.ok || !res.body) {
    const text = await res.text();
    throw new Error(`ChatGPT Codex failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') break;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'response.output_text.delta' && parsed.delta) out += parsed.delta;
      } catch {
        /* skip */
      }
    }
  }
  return out;
}

async function runOpenAI(opts: { apiKey: string; instructions: string; input: string; model?: string }): Promise<string> {
  const model = opts.model ?? 'gpt-5';
  // Newer reasoning models (gpt-5, o1/o3 family) reject custom temperature
  // and use the default (1.0). Omit temperature unless the caller passed a
  // legacy model name that supports it.
  const supportsTemperature = /^(gpt-4o|gpt-4-turbo|gpt-3\.5)/i.test(model);
  const payload: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: opts.instructions },
      { role: 'user', content: opts.input },
    ],
  };
  if (supportsTemperature) payload.temperature = 0.7;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

async function runAnthropic(opts: { apiKey: string; instructions: string; input: string; model?: string }): Promise<string> {
  const model = opts.model ?? 'claude-4-7-sonnet-20260101';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': opts.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: opts.instructions,
      messages: [{ role: 'user', content: opts.input }],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const block = Array.isArray(data.content) ? data.content.find((c: { type: string }) => c.type === 'text') : null;
  return block?.text ?? '';
}

async function runGoogle(opts: { apiKey: string; instructions: string; input: string; model?: string }): Promise<string> {
  const model = opts.model ?? 'gemini-3-pro';
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${opts.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.instructions }] },
        contents: [{ role: 'user', parts: [{ text: opts.input }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
      }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Gemini failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: { text: string }) => p.text).join('') ?? '';
  return text;
}

export async function runText(input: TextRunInput): Promise<string> {
  if (input.kind === 'chatgpt') {
    return runChatGPT({
      accessToken: input.accessToken,
      accountId: input.accountId,
      instructions: input.instructions,
      input: input.input,
      model: input.model,
    });
  }
  const common = { apiKey: input.apiKey, instructions: input.instructions, input: input.input, model: input.model };
  if (input.provider === 'openai') return runOpenAI(common);
  if (input.provider === 'anthropic') return runAnthropic(common);
  if (input.provider === 'google') return runGoogle(common);
  throw new Error(`Unsupported provider: ${(input as { provider: string }).provider}`);
}

export function providerLabel(input: TextRunInput): string {
  if (input.kind === 'chatgpt') return `gpt-5.4 via ChatGPT`;
  if (input.provider === 'openai') return input.model ?? 'gpt-5';
  if (input.provider === 'anthropic') return input.model ?? 'claude-4.7-sonnet';
  if (input.provider === 'google') return input.model ?? 'gemini-3-pro';
  return 'unknown';
}

/**
 * Pull the right text-runner input out of a parsed API-request body.
 * Body should carry either `{ accessToken, accountId, model }` or
 * `{ byoProvider, apiKey, model }`.
 */
export function parseTextRunRequest(
  body: Record<string, unknown>,
  instructions: string,
  input: string
): TextRunInput | null {
  if (typeof body.accessToken === 'string' && typeof body.accountId === 'string') {
    return {
      kind: 'chatgpt',
      accessToken: body.accessToken,
      accountId: body.accountId,
      instructions,
      input,
      model: typeof body.model === 'string' ? body.model : undefined,
    };
  }
  if (
    typeof body.byoProvider === 'string' &&
    typeof body.apiKey === 'string' &&
    ['openai', 'anthropic', 'google'].includes(body.byoProvider)
  ) {
    return {
      kind: 'byo',
      provider: body.byoProvider as 'openai' | 'anthropic' | 'google',
      apiKey: body.apiKey,
      instructions,
      input,
      model: typeof body.model === 'string' ? body.model : undefined,
    };
  }
  return null;
}
