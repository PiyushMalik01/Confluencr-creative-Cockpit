'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Loader2, Sparkles, Unplug } from 'lucide-react';
import {
  encryptToStorage,
  decryptFromStorage,
  clearStorage,
  STORAGE_KEYS,
} from '@/lib/storage/encrypted-local';
import type { ChatGPTSession } from '@/lib/ai/codex-stream';

type DeviceCode = {
  deviceAuthId: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
};

export function ChatGPTConnect({ onConnected }: { onConnected?: (s: ChatGPTSession) => void }) {
  const [session, setSession] = useState<ChatGPTSession | null>(null);
  const [deviceCode, setDeviceCode] = useState<DeviceCode | null>(null);
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    decryptFromStorage<ChatGPTSession>(STORAGE_KEYS.chatgpt).then((s) => {
      if (s) setSession(s);
    });
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function startConnect() {
    setError(null);
    try {
      const r = await fetch('/api/auth/openai/device-code', { method: 'POST' });
      if (!r.ok) throw new Error((await r.json()).error ?? 'request failed');
      const data: DeviceCode = await r.json();
      setDeviceCode(data);
      setPolling(true);
      window.open(data.verificationUrl, '_blank', 'noopener,noreferrer');

      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch('/api/auth/openai/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceAuthId: data.deviceAuthId, userCode: data.userCode }),
          });
          const pd = await pr.json();
          if (pd.authorized) {
            const next: ChatGPTSession = {
              accessToken: pd.accessToken,
              refreshToken: pd.refreshToken,
              accountId: pd.accountId,
              email: pd.email,
              planType: pd.planType,
              expiresAt: Date.now() + (pd.expiresIn ?? 3600) * 1000,
            };
            await encryptToStorage(STORAGE_KEYS.chatgpt, next);
            setSession(next);
            setDeviceCode(null);
            setPolling(false);
            if (pollRef.current) clearInterval(pollRef.current);
            onConnected?.(next);
          } else if (pd.error) {
            throw new Error(pd.error);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'poll failed');
          setPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to start');
    }
  }

  function disconnect() {
    clearStorage(STORAGE_KEYS.chatgpt);
    setSession(null);
  }

  function cancel() {
    if (pollRef.current) clearInterval(pollRef.current);
    setPolling(false);
    setDeviceCode(null);
  }

  function copyCode() {
    if (!deviceCode) return;
    navigator.clipboard.writeText(deviceCode.userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (session) {
    return (
      <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
            <Check className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium">Connected to ChatGPT</div>
            <div className="text-xs text-[color:var(--color-muted-foreground)] truncate">
              {session.email ?? 'account'}
              {session.planType && <> · {session.planType}</>}
            </div>
          </div>
          <button
            type="button"
            onClick={disconnect}
            className="text-xs inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 hover:bg-[color:var(--color-muted)] transition-colors"
          >
            <Unplug className="size-3" /> Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/70 p-4 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 shrink-0">
          <Sparkles className="size-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Connect ChatGPT — zero marginal cost</div>
          <div className="text-xs text-[color:var(--color-muted-foreground)] mt-1 leading-relaxed">
            Uses gpt-5.4 via your Plus/Team/Enterprise subscription. No API key, no separate billing. Your
            token stays in your browser.
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {deviceCode ? (
          <motion.div
            key="code"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="space-y-3"
          >
            <div className="text-xs text-[color:var(--color-muted-foreground)]">
              Step 1: a new tab opened at <code className="font-mono">auth.openai.com/codex/device</code>.
            </div>
            <div className="text-xs text-[color:var(--color-muted-foreground)]">
              Step 2: enter this code there.
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="w-full flex items-center justify-between rounded-lg bg-[color:var(--color-muted)] px-4 py-3 hover:opacity-90 transition-opacity"
            >
              <code className="font-mono text-base tracking-[0.3em]">{deviceCode.userCode}</code>
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </button>
            {polling && (
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-[color:var(--color-muted-foreground)]">
                  <Loader2 className="size-3 animate-spin" /> Waiting for authorization…
                </span>
                <button
                  type="button"
                  onClick={cancel}
                  className="text-[color:var(--color-muted-foreground)] hover:text-[color:var(--color-foreground)]"
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button
              type="button"
              onClick={startConnect}
              className="w-full rounded-lg bg-[color:var(--color-foreground)] text-[color:var(--color-background)] py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Connect ChatGPT — 30 seconds
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <div className="text-xs text-rose-500">{error}</div>}
    </div>
  );
}
