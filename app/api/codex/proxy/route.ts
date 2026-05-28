import { NextRequest } from 'next/server';
import { OPENAI_CONSTANTS } from '@/lib/ai/openai-oauth';

export const runtime = 'nodejs';
export const maxDuration = 300;

function sanitizeToAscii(text: string): string {
  return text.replace(/[^\x20-\x7E\n\r\t]/g, '').replace(/\{\{.*?\}\}/g, '');
}

export async function POST(req: NextRequest) {
  let body: {
    accessToken?: string;
    accountId?: string;
    instructions?: string;
    input?: string;
    model?: string;
  };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { accessToken, accountId, instructions, input, model } = body;
  if (!accessToken || !accountId || !instructions || !input) {
    return new Response(
      JSON.stringify({ error: 'accessToken, accountId, instructions, input all required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const upstream = await fetch(OPENAI_CONSTANTS.CODEX_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      Authorization: `Bearer ${accessToken}`,
      'chatgpt-account-id': accountId,
    },
    body: JSON.stringify({
      model: model ?? 'gpt-5.4',
      instructions: sanitizeToAscii(instructions),
      input: [{ role: 'user', content: sanitizeToAscii(input) }],
      store: false,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text();
    return new Response(JSON.stringify({ error: text.slice(0, 500), status: upstream.status }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
