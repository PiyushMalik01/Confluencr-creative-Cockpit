'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, Copy, ExternalLink, Loader2, Sparkles, Unplug } from 'lucide-react';
import { useSession } from '@/lib/session-context';
import type { ChatGPTSession } from '@/lib/ai/codex-stream';

type DeviceCode = {
  deviceAuthId: string;
  userCode: string;
  verificationUrl: string;
  expiresIn: number;
  interval: number;
};

export function ChatGPTConnect() {
  const { session, setSession } = useSession();
  const [deviceCode, setDeviceCode] = useState<DeviceCode | null>(null);
  const [polling, setPolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  async function startConnect() {
    setError(null);
    try {
      const r = await fetch('/api/auth/openai/device-code', { method: 'POST' });
      const data = await r.json();
      if (!r.ok || data.error) throw new Error(data.error ?? `HTTP ${r.status}`);
      const dc = data as DeviceCode;
      setDeviceCode(dc);
      setPolling(true);
      setSecondsLeft(dc.expiresIn);
      window.open(dc.verificationUrl, '_blank', 'noopener,noreferrer');

      tickRef.current = setInterval(() => {
        setSecondsLeft((s) => Math.max(0, s - 1));
      }, 1000);

      pollRef.current = setInterval(async () => {
        try {
          const pr = await fetch('/api/auth/openai/poll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceAuthId: dc.deviceAuthId, userCode: dc.userCode }),
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
            await setSession(next);
            cancel();
          } else if (pd.error) {
            throw new Error(pd.error);
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'poll failed');
          cancel();
        }
      }, (dc.interval ?? 5) * 1000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'failed to start');
    }
  }

  function cancel() {
    if (pollRef.current) clearInterval(pollRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
    pollRef.current = null;
    tickRef.current = null;
    setPolling(false);
    setDeviceCode(null);
    setSecondsLeft(0);
  }

  async function disconnect() {
    await setSession(null);
  }

  function copyCode() {
    if (!deviceCode) return;
    navigator.clipboard.writeText(deviceCode.userCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (session) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 shrink-0">
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
            className="text-xs inline-flex items-center gap-1.5 rounded-md border border-[color:var(--color-border)] px-2.5 py-1.5 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-500 transition-colors"
          >
            <Unplug className="size-3" /> Disconnect
          </button>
        </div>
        <div className="text-[10px] text-[color:var(--color-muted-foreground)] leading-relaxed pl-12">
          Stays connected across refreshes. Token never leaves your browser.
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
        <div className="flex-1 min-w-0">
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
            <ol className="space-y-1.5 text-xs text-[color:var(--color-muted-foreground)] list-decimal list-inside">
              <li>
                A new tab opened at{' '}
                <code className="font-mono">auth.openai.com/codex/device</code>
                {' · '}
                <a
                  href={deviceCode.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 underline text-[color:var(--color-foreground)]"
                >
                  reopen <ExternalLink className="size-2.5" />
                </a>
              </li>
              <li>Enter this code there and click Authorize.</li>
              <li>Come back here. We poll automatically.</li>
            </ol>

            <button
              type="button"
              onClick={copyCode}
              className="w-full flex items-center justify-between rounded-lg bg-[color:var(--color-muted)] border border-[color:var(--color-border)] px-4 py-3 hover:opacity-90 transition-opacity"
            >
              <code className="font-mono text-base tracking-[0.32em] font-semibold">
                {deviceCode.userCode}
              </code>
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </button>

            {polling && (
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-[color:var(--color-muted-foreground)]">
                  <Loader2 className="size-3 animate-spin" />
                  Waiting for authorization…
                  {secondsLeft > 0 && (
                    <span className="font-mono ml-1">
                      ({Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')})
                    </span>
                  )}
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

      {error && (
        <div className="rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
          <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium">Connection failed</div>
            <div className="text-[11px] mt-0.5 break-words">{error}</div>
          </div>
        </div>
      )}
    </div>
  );
}
