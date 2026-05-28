'use client';

import { useSession } from '@/lib/session-context';

/**
 * Returns the JSON body fields for whichever provider should run a text job,
 * plus a human label and a "ready" boolean.
 *
 *   const { creds, ready, label } = useTextCredentials();
 *   if (!ready) return <ConnectPrompt />;
 *   await start('/api/...', { body: JSON.stringify({ projectId, ...creds }) });
 *
 * The API routes accept the shape `{ accessToken, accountId, model }` for
 * ChatGPT or `{ byoProvider, apiKey, model }` for BYO keys.
 */
export function useTextCredentials() {
  const { preferredTextProvider } = useSession();
  const c = preferredTextProvider();
  if (!c) return { ready: false as const, creds: null, label: null };
  if (c.kind === 'chatgpt') {
    return {
      ready: true as const,
      creds: { accessToken: c.accessToken, accountId: c.accountId },
      label: 'gpt-5.4 · ChatGPT',
    };
  }
  return {
    ready: true as const,
    creds: { byoProvider: c.provider, apiKey: c.apiKey },
    label: c.provider === 'openai' ? 'gpt-5 · OpenAI' : c.provider === 'anthropic' ? 'claude-4.7 · Anthropic' : 'gemini-3-pro · Google',
  };
}
