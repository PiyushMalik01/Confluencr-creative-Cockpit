'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStorage,
  decryptFromStorage,
  encryptToStorage,
  STORAGE_KEYS,
} from '@/lib/storage/encrypted-local';
import type { ChatGPTSession } from '@/lib/ai/codex-stream';

type Ctx = {
  session: ChatGPTSession | null;
  ready: boolean;
  setSession: (s: ChatGPTSession | null) => Promise<void>;
};

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<ChatGPTSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt)
      .then((s) => {
        if (cancelled) return;
        setSessionState(s);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    // Listen to localStorage changes from other tabs
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEYS.chatgpt) {
        decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt).then((s) => setSessionState(s));
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

  const value = useMemo(() => ({ session, ready, setSession }), [session, ready, setSession]);
  return <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>;
}

export function useSession(): Ctx {
  const ctx = useContext(SessionCtx);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}
