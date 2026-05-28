'use client';

const KEY_NAME = 'confluencr.deviceKey';

async function getKey(): Promise<CryptoKey> {
  let raw = localStorage.getItem(KEY_NAME);
  if (!raw) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    raw = btoa(String.fromCharCode(...bytes));
    localStorage.setItem(KEY_NAME, raw);
  }
  const keyBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptToStorage(key: string, value: object): Promise<void> {
  const k = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, data);
  const combined = new Uint8Array(iv.byteLength + cipher.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipher), iv.byteLength);
  const payload = btoa(String.fromCharCode(...combined));
  localStorage.setItem(key, payload);
}

export async function decryptFromStorage<T = unknown>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    const k = await getKey();
    const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, cipher);
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch {
    return null;
  }
}

export function clearStorage(key: string): void {
  localStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  chatgpt: 'confluencr.chatgpt',
  byoKeys: 'confluencr.byoKeys',
  preferredProvider: 'confluencr.preferredProvider',
} as const;
