'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStorage,
  decryptFromStorage,
  encryptToStorage,
  STORAGE_KEYS,
} from '@/lib/storage/encrypted-local';
import type { ChatGPTSession } from '@/lib/ai/codex-stream';
import type { BYOKeys, BYOProvider } from '@/lib/schemas/byo-keys';

export type ProviderCredentials =
  | { kind: 'chatgpt'; accessToken: string; accountId: string }
  | { kind: 'byo'; provider: BYOProvider; apiKey: string };

type Ctx = {
  session: ChatGPTSession | null;
  keys: BYOKeys;
  ready: boolean;
  setSession: (s: ChatGPTSession | null) => Promise<void>;
  setKey: (provider: BYOProvider, value: string | null) => Promise<void>;
  /** Resolve the best available text-capable credential. ChatGPT wins; otherwise first available BYO text key. */
  preferredTextProvider: () => ProviderCredentials | null;
  /** Resolve the first available image-capable credential. */
  preferredImageProvider: () => ProviderCredentials | null;
  /** Any text or image credential present. */
  hasAnyProvider: boolean;
};

const SessionCtx = createContext<Ctx | null>(null);

const TEXT_ORDER: BYOProvider[] = ['openai', 'anthropic', 'google'];
const IMAGE_ORDER: BYOProvider[] = ['fal', 'ideogram', 'openai', 'google'];

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<ChatGPTSession | null>(null);
  const [keys, setKeysState] = useState<BYOKeys>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt),
      decryptFromStorage<BYOKeys>(STORAGE_KEYS.byoKeys),
    ])
      .then(([s, k]) => {
        if (cancelled) return;
        setSessionState(s);
        setKeysState(k ?? {});
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEYS.chatgpt) {
        decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt).then((s) => setSessionState(s));
      }
      if (e.key === STORAGE_KEYS.byoKeys) {
        decryptFromStorage<BYOKeys>(STORAGE_KEYS.byoKeys).then((k) => setKeysState(k ?? {}));
      }
    }
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setSession = useCallback(async (s: ChatGPTSession | null) => {
    if (s) {
      await encryptToStorage(STORAGE_KEYS.chatgpt, s);
    } else {
      clearStorage(STORAGE_KEYS.chatgpt);
    }
    setSessionState(s);
  }, []);

  const setKey = useCallback(async (provider: BYOProvider, value: string | null) => {
    const next: BYOKeys = { ...keys };
    if (value && value.trim()) {
      next[provider] = value.trim();
    } else {
      delete next[provider];
    }
    setKeysState(next);
    if (Object.keys(next).length === 0) {
      clearStorage(STORAGE_KEYS.byoKeys);
    } else {
      await encryptToStorage(STORAGE_KEYS.byoKeys, next);
    }
  }, [keys]);

  const preferredTextProvider = useCallback((): ProviderCredentials | null => {
    if (session) return { kind: 'chatgpt', accessToken: session.accessToken, accountId: session.accountId };
    for (const p of TEXT_ORDER) {
      const k = keys[p];
      if (k) return { kind: 'byo', provider: p, apiKey: k };
    }
    return null;
  }, [session, keys]);

  const preferredImageProvider = useCallback((): ProviderCredentials | null => {
    for (const p of IMAGE_ORDER) {
      const k = keys[p];
      if (k) return { kind: 'byo', provider: p, apiKey: k };
    }
    return null;
  }, [keys]);

  const hasAnyProvider = !!session || Object.keys(keys).length > 0;

  const value = useMemo(
    () => ({ session, keys, ready, setSession, setKey, preferredTextProvider, preferredImageProvider, hasAnyProvider }),
    [session, keys, ready, setSession, setKey, preferredTextProvider, preferredImageProvider, hasAnyProvider]
  );
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): Ctx {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
