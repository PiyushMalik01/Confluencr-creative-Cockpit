# Confluencr Creative Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working Next.js 16 web app that takes a brand brief and produces three strategically distinct, on-brand image concept briefs plus a tool-specific prompt deck, all at zero marginal cost using ChatGPT auth (or BYO API key).

**Architecture:** Single Next.js 16 App Router app on Vercel with MongoDB Atlas. shadcn/ui + framer-motion (slackflow expansion pattern). Streaming SSE for long AI calls. ChatGPT device-code auth (gpt-5.4 via Codex endpoint, Orbiter pattern) as the default zero-cost path; BYO Anthropic/Google/OpenAI keys as alternatives. All tokens stored client-side in encrypted localStorage. No user accounts. Project URL `/p/{uuidv7}` is identity + access token.

**Tech Stack:** Next.js 16 App Router · React 19 · Tailwind v4 · shadcn/ui · framer-motion · MongoDB Atlas (driver v6) · zod · uuidv7 · cheerio · sharp · @react-pdf/renderer · Playwright (for scrape fallback). For AI: Vercel AI SDK v6 + custom Codex client.

**Spec:** `docs/superpowers/specs/2026-05-28-confluencr-creative-cockpit-design.md`

---

## File structure (locked before tasks)

```
F:\confluencr\
├── app\
│   ├── layout.tsx                     # root, theme provider, ambient bg
│   ├── page.tsx                       # landing → new project button
│   ├── p\[id]\
│   │   ├── page.tsx                   # the 6-step wizard
│   │   └── loading.tsx
│   ├── api\
│   │   ├── projects\route.ts          # POST create new project
│   │   ├── projects\[id]\route.ts     # GET/PATCH project
│   │   ├── briefs\[id]\route.ts       # PATCH brief
│   │   ├── scrape\route.ts            # POST URLs → image candidates (SSE)
│   │   ├── style-extract\route.ts     # POST images → StyleReport (SSE)
│   │   ├── angles\route.ts            # POST → 5 angle proposals (SSE)
│   │   ├── concept-briefs\route.ts    # POST → 3 ConceptBriefs (SSE multiplexed)
│   │   ├── prompt-deck\route.ts       # POST → final deck
│   │   ├── image-gen\route.ts         # POST → generated image (per concept × surface)
│   │   ├── pdf\[id]\route.ts          # GET PDF export
│   │   ├── codex\proxy\route.ts       # forward Codex calls (SSE)
│   │   └── auth\openai\
│   │       ├── device-code\route.ts   # initiate device flow
│   │       ├── poll\route.ts          # poll for authorization
│   │       └── refresh\route.ts       # refresh access token
│   ├── globals.css                    # theme tokens, ambient bg keyframes
│   └── icon.tsx
├── components\
│   ├── ui\                            # shadcn primitives
│   ├── wizard\
│   │   ├── wizard-shell.tsx           # outer card stack
│   │   ├── step-card.tsx              # expanding card (slackflow pattern)
│   │   ├── step-1-brief.tsx
│   │   ├── step-2-style-report.tsx
│   │   ├── step-3-angles.tsx
│   │   ├── step-4-concepts.tsx
│   │   ├── step-5-image-gen.tsx
│   │   └── step-6-prompt-deck.tsx
│   ├── brief\
│   │   ├── product-section.tsx
│   │   ├── audience-section.tsx
│   │   ├── strategy-section.tsx
│   │   ├── brand-section.tsx
│   │   ├── references-section.tsx
│   │   └── surfaces-section.tsx
│   ├── chips\preset-chips.tsx         # chip palette + free text override
│   ├── color\palette-editor.tsx       # hex picker + usage ratio sliders
│   ├── activity-ticker\activity-ticker.tsx # live SSE log
│   ├── provider-picker\
│   │   ├── provider-modal.tsx
│   │   ├── chatgpt-connect.tsx        # device-code flow UI
│   │   └── byo-key-input.tsx
│   ├── theme-toggle.tsx
│   └── ambient-bg.tsx                 # dot grid + glow orbs
├── lib\
│   ├── db\
│   │   ├── client.ts                  # MongoDB connection (singleton)
│   │   └── collections.ts             # typed collection accessors
│   ├── schemas\
│   │   ├── project.ts                 # zod schemas for all data types
│   │   ├── brief.ts
│   │   ├── style-report.ts
│   │   ├── angle.ts
│   │   ├── concept-brief.ts
│   │   └── activity-event.ts
│   ├── ai\
│   │   ├── openai-oauth.ts            # ported from Orbiter
│   │   ├── codex-client.ts            # ported from Orbiter
│   │   ├── provider-router.ts         # routes job → model
│   │   ├── style-extractor.ts         # vision LLM
│   │   ├── angle-proposer.ts          # text LLM
│   │   ├── concept-generator.ts       # text LLM
│   │   └── quality-gates.ts
│   ├── scraping\
│   │   ├── url-fetcher.ts             # 5-strategy chain
│   │   ├── image-validator.ts         # size/aspect/pHash/dedupe
│   │   ├── brand-search.ts            # SerpAPI / DDG fallback
│   │   └── playwright-fallback.ts
│   ├── storage\
│   │   └── encrypted-local.ts         # SubtleCrypto AES-GCM
│   ├── sse\
│   │   └── stream-helper.ts           # SSE response wrapper
│   └── utils\
│       ├── uuidv7.ts
│       ├── cn.ts                      # className combiner
│       └── color.ts                   # hex parsing, CIE2000 ΔE
├── public\
├── docs\superpowers\
│   ├── specs\2026-05-28-confluencr-creative-cockpit-design.md
│   └── plans\2026-05-28-confluencr-creative-cockpit.md  ← this file
├── .env.local                         # MONGODB_URI etc.
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── components.json                    # shadcn config
└── next.config.ts
```

---

## Phase 0 — Foundation

### Task 1: Bootstrap Next.js 16 project + Tailwind v4 + shadcn

**Files:**
- Create: `F:\confluencr\package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `components.json`, `.env.example`, `.env.local`, `.gitignore`

- [ ] **Step 1: Run `npx create-next-app@latest` in F:\confluencr**

```bash
cd F:\confluencr
npx create-next-app@latest . --typescript --tailwind --app --turbopack --src-dir=false --import-alias='@/*' --yes
```

If `confluencr` directory has `approach-doc` subdir and `APPROACH.pdf` already, the CLI will refuse. Workaround: scaffold in temp dir then move files in.

```bash
cd "$env:TEMP"
npx create-next-app@latest confluencr-scaffold --typescript --tailwind --app --turbopack --src-dir=false --import-alias='@/*' --yes
Move-Item -Path "$env:TEMP\confluencr-scaffold\*" -Destination "F:\confluencr\" -Force
Move-Item -Path "$env:TEMP\confluencr-scaffold\.*" -Destination "F:\confluencr\" -Force -ErrorAction SilentlyContinue
```

- [ ] **Step 2: Install runtime deps**

```bash
cd F:\confluencr
npm i mongodb uuidv7 zod cheerio sharp framer-motion lucide-react next-themes @react-pdf/renderer ai @ai-sdk/anthropic @ai-sdk/google @ai-sdk/openai
npm i -D @types/node
```

- [ ] **Step 3: Init shadcn**

```bash
npx shadcn@latest init --base-color slate --yes
npx shadcn@latest add button card input textarea label badge separator tooltip dialog dropdown-menu tabs accordion checkbox slider scroll-area popover
```

- [ ] **Step 4: Replace globals.css with theme tokens + ambient bg**

```css
@import "tailwindcss";

@theme {
  --color-bg: 0 0% 100%;
  --color-text: 0 0% 7%;
  --color-text-muted: 0 0% 40%;
  --color-rule: 0 0% 0% / 0.08;
  --color-accent: 217 91% 56%;
}

@layer base {
  :root.dark {
    --color-bg: 0 0% 6%;
    --color-text: 0 0% 96%;
    --color-text-muted: 0 0% 64%;
    --color-rule: 0 0% 100% / 0.08;
    --color-accent: 217 91% 60%;
  }
  body { font-family: 'Inter', system-ui, sans-serif; background: hsl(var(--color-bg)); color: hsl(var(--color-text)); }
}
```

- [ ] **Step 5: Create root layout with theme provider**

`app/layout.tsx`:

```tsx
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { AmbientBg } from '@/components/ambient-bg';

export const metadata = {
  title: 'Confluencr Creative Cockpit',
  description: 'Brand brief to three on-brand image concepts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AmbientBg />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 6: Build AmbientBg component (dot grid + glow orbs from slackflow)**

`components/ambient-bg.tsx`:

```tsx
'use client';
import { motion } from 'framer-motion';

export function AmbientBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
           style={{
             backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
             backgroundSize: '32px 32px',
           }} />
      <motion.div className="absolute w-[600px] h-[600px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.10), transparent 70%)', top: '-10%', left: '20%' }}
                  animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
      <motion.div className="absolute w-[500px] h-[500px] rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)', bottom: '10%', right: '10%' }}
                  animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
                  transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} />
    </div>
  );
}
```

- [ ] **Step 7: Theme toggle**

`components/theme-toggle.tsx`:

```tsx
'use client';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
```

- [ ] **Step 8: Landing page**

`app/page.tsx`:

```tsx
'use client';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">Confluencr Creative Cockpit</h1>
        <p className="text-lg text-muted-foreground">Brand brief in. Three on-brand image concepts out. Free with your ChatGPT subscription.</p>
        <Button size="lg" onClick={async () => {
          const r = await fetch('/api/projects', { method: 'POST' });
          const { id } = await r.json();
          router.push(`/p/${id}`);
        }}>Start a new brief</Button>
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Commit foundation**

```bash
git init
git add -A
git commit -m "feat: scaffold Next.js 16 + Tailwind + shadcn + theme + ambient bg"
```

---

## Phase 1 — Data Layer

### Task 2: MongoDB connection + project collection + UUIDv7

**Files:**
- Create: `lib/db/client.ts`, `lib/db/collections.ts`, `lib/utils/uuidv7.ts`, `lib/schemas/project.ts`, `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`

- [ ] **Step 1: Add MongoDB URI to .env**

`.env.local`:
```
MONGODB_URI=mongodb+srv://...     # user creates Atlas M0 cluster, pastes URI
MONGODB_DB=confluencr
```

`.env.example`:
```
MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=confluencr
```

- [ ] **Step 2: Mongo client singleton**

`lib/db/client.ts`:

```ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI not set');

declare global { var _mongo: { client: MongoClient; db: Db } | undefined; }

export async function getDb(): Promise<Db> {
  if (globalThis._mongo) return globalThis._mongo.db;
  const client = new MongoClient(uri!);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'confluencr');
  globalThis._mongo = { client, db };
  return db;
}
```

- [ ] **Step 3: UUIDv7 helper**

`lib/utils/uuidv7.ts`:
```ts
import { uuidv7 } from 'uuidv7';
export function newProjectId(): string { return uuidv7(); }
```

- [ ] **Step 4: Project schema (zod)**

`lib/schemas/project.ts`:

```ts
import { z } from 'zod';

export const ProjectSchema = z.object({
  _id: z.string(),
  createdAt: z.coerce.date(),
  lastTouchedAt: z.coerce.date(),
  editEpoch: z.number().int().nonnegative(),
  step: z.number().int().min(1).max(6),
  theme: z.enum(['light', 'dark']).default('dark'),
  testBrand: z.enum(['bewakoof', 'decathlon', 'mamaearth', 'custom']).optional(),
});
export type Project = z.infer<typeof ProjectSchema>;
```

- [ ] **Step 5: Collection accessor**

`lib/db/collections.ts`:

```ts
import { getDb } from './client';
import type { Project } from '@/lib/schemas/project';

export async function projects() { return (await getDb()).collection<Project>('projects'); }
export async function briefs() { return (await getDb()).collection('briefs'); }
export async function styleReports() { return (await getDb()).collection('styleReports'); }
export async function angleProposals() { return (await getDb()).collection('angleProposals'); }
export async function conceptBriefs() { return (await getDb()).collection('conceptBriefs'); }
export async function promptDecks() { return (await getDb()).collection('promptDecks'); }
export async function generatedImages() { return (await getDb()).collection('generatedImages'); }
```

- [ ] **Step 6: POST /api/projects (create)**

`app/api/projects/route.ts`:

```ts
import { NextResponse } from 'next/server';
import { projects } from '@/lib/db/collections';
import { newProjectId } from '@/lib/utils/uuidv7';

export async function POST() {
  const id = newProjectId();
  const now = new Date();
  await (await projects()).insertOne({
    _id: id, createdAt: now, lastTouchedAt: now, editEpoch: 0, step: 1, theme: 'dark',
  });
  return NextResponse.json({ id });
}
```

- [ ] **Step 7: GET /api/projects/[id]**

`app/api/projects/[id]/route.ts`:

```ts
import { NextResponse, NextRequest } from 'next/server';
import { projects } from '@/lib/db/collections';

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const p = await (await projects()).findOne({ _id: id });
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(p);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  await (await projects()).updateOne(
    { _id: id },
    { $set: { ...body, lastTouchedAt: new Date() } }
  );
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 8: Wizard route stub**

`app/p/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { projects } from '@/lib/db/collections';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await (await projects()).findOne({ _id: id });
  if (!p) notFound();
  return <pre className="p-8 text-xs">{JSON.stringify(p, null, 2)}</pre>;
}
```

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: mongodb client + projects collection + new project flow"
```

### Task 3: Zod schemas for derived collections

**Files:**
- Create: `lib/schemas/brief.ts`, `style-report.ts`, `angle.ts`, `concept-brief.ts`, `activity-event.ts`

- [ ] **Step 1: Each file exports zod schema matching the design spec §4 (data model)**

Use the spec as source of truth. Example for `brief.ts`:

```ts
import { z } from 'zod';

export const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const BriefSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  product: z.object({
    name: z.string().min(1),
    oneLiner: z.string(),
    photos: z.array(z.object({
      kind: z.enum(['upload', 'url', 'text']),
      url: z.string().optional(),
      fidelityTier: z.enum(['high', 'medium', 'low']),
    })),
    priceTier: z.string().optional(),
    category: z.string().optional(),
  }),
  audience: z.object({ description: z.string(), signalPreset: z.string().optional(), insight: z.string() }),
  strategy: z.object({ smp: z.string(), rtbs: z.array(z.string()).min(1) }),
  brand: z.object({
    palette: z.array(z.object({ hex: Hex, role: z.string(), ratio: z.number().min(0).max(1) })),
    typography: z.string().optional(),
    voiceOpposites: z.array(z.object({ x: z.string(), y: z.string() })),
    logo: z.string().optional(),
  }),
  references: z.object({
    competitorMode: z.enum(['url', 'upload', 'name']),
    inputs: z.array(z.string()),
    doNotInclude: z.array(z.string()).default([]),
    moodImages: z.array(z.string()).default([]),
  }),
  surfaces: z.object({
    aspectRatios: z.array(z.enum(['1:1', '4:5', '9:16', '16:9'])).min(1),
    mandatories: z.array(z.string()).default([]),
  }),
  updatedAt: z.coerce.date(),
});
export type Brief = z.infer<typeof BriefSchema>;
```

Repeat for all collections per spec §4. Commit when all schemas in place.

### Task 4: Encrypted localStorage helper

**Files:**
- Create: `lib/storage/encrypted-local.ts`

- [ ] **Step 1: SubtleCrypto AES-GCM wrapper**

```ts
'use client';

const KEY_NAME = 'confluencr.deviceKey';

async function getKey(): Promise<CryptoKey> {
  let raw = localStorage.getItem(KEY_NAME);
  if (!raw) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    raw = btoa(String.fromCharCode(...bytes));
    localStorage.setItem(KEY_NAME, raw);
  }
  const keyBytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptToStorage(key: string, value: object): Promise<void> {
  const k = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(value));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, data);
  const payload = btoa(String.fromCharCode(...new Uint8Array(iv), ...new Uint8Array(cipher)));
  localStorage.setItem(key, payload);
}

export async function decryptFromStorage<T>(key: string): Promise<T | null> {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    const bytes = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const cipher = bytes.slice(12);
    const k = await getKey();
    const data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, k, cipher);
    return JSON.parse(new TextDecoder().decode(data)) as T;
  } catch { return null; }
}

export function clearStorage(key: string): void { localStorage.removeItem(key); }
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: zod schemas + encrypted localStorage helper"
```

---

## Phase 2 — Auth & Provider Routing

### Task 5: ChatGPT OAuth device-code flow (Orbiter port)

**Files:**
- Create: `lib/ai/openai-oauth.ts`, `app/api/auth/openai/device-code/route.ts`, `app/api/auth/openai/poll/route.ts`, `app/api/auth/openai/refresh/route.ts`

- [ ] **Step 1: Port Orbiter's `openai-oauth.ts` verbatim**

Copy from `F:\Orbiter\src\modules\ai\openai-oauth.ts`. Replace import for OPENAI_CONSTANTS with inline constants:

```ts
export const OPENAI_CONSTANTS = {
  CLIENT_ID: 'app_EMoamEEZ73f0CkXaXp7hrann',
  DEVICE_CODE_ENDPOINT: 'https://auth.openai.com/api/accounts/deviceauth/usercode',
  POLL_ENDPOINT: 'https://auth.openai.com/api/accounts/deviceauth/poll',
  TOKEN_EXCHANGE_ENDPOINT: 'https://auth.openai.com/oauth/token',
  CODEX_API_ENDPOINT: 'https://chatgpt.com/backend-api/codex/responses',
  VERIFICATION_URL: 'https://auth.openai.com/codex/device',
  DEVICE_CODE_EXPIRY_S: 900,
};
```

- [ ] **Step 2: Device code route**

```ts
import { requestDeviceCode } from '@/lib/ai/openai-oauth';
import { NextResponse } from 'next/server';
export async function POST() {
  try { return NextResponse.json(await requestDeviceCode()); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
```

- [ ] **Step 3: Poll route**

```ts
import { pollDeviceAuthorization, exchangeCodeForTokens, parseIdToken } from '@/lib/ai/openai-oauth';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { deviceAuthId, userCode } = await req.json();
  try {
    const auth = await pollDeviceAuthorization(deviceAuthId, userCode);
    if (!auth) return NextResponse.json({ authorized: false });
    const tokens = await exchangeCodeForTokens(auth.authorizationCode, auth.codeVerifier ?? '');
    const claims = tokens.idToken ? parseIdToken(tokens.idToken) : {};
    return NextResponse.json({ authorized: true, ...tokens, ...claims });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
```

- [ ] **Step 4: Refresh route**

```ts
import { refreshAccessToken } from '@/lib/ai/openai-oauth';
import { NextResponse, NextRequest } from 'next/server';
export async function POST(req: NextRequest) {
  const { refreshToken } = await req.json();
  try { return NextResponse.json(await refreshAccessToken(refreshToken)); }
  catch (e: any) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: ChatGPT device-code auth flow (Orbiter port)"
```

### Task 6: Codex proxy route + streaming client

**Files:**
- Create: `lib/ai/codex-client.ts`, `app/api/codex/proxy/route.ts`

- [ ] **Step 1: Port Orbiter's `codex-client.ts`** verbatim. Adapt to return ReadableStream instead of awaited string when streaming.

- [ ] **Step 2: Proxy route streams SSE back to client**

```ts
import { NextRequest } from 'next/server';
import { OPENAI_CONSTANTS } from '@/lib/ai/openai-oauth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { accessToken, accountId, instructions, input, model } = await req.json();
  const upstream = await fetch(OPENAI_CONSTANTS.CODEX_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `Bearer ${accessToken}`,
      'chatgpt-account-id': accountId,
    },
    body: JSON.stringify({
      model: model ?? 'gpt-5.4',
      instructions,
      input: [{ role: 'user', content: input }],
      store: false,
      stream: true,
    }),
  });
  if (!upstream.ok || !upstream.body) {
    return new Response(JSON.stringify({ error: await upstream.text() }), { status: upstream.status });
  }
  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Codex API proxy route with SSE streaming"
```

### Task 7: Provider router + BYO key input

**Files:**
- Create: `lib/ai/provider-router.ts`, `components/provider-picker/provider-modal.tsx`, `chatgpt-connect.tsx`, `byo-key-input.tsx`

- [ ] **Step 1: Provider router (single entry, routes any text/vision job)**

```ts
import { decryptFromStorage } from '@/lib/storage/encrypted-local';

export type AIJob = { kind: 'text' | 'vision'; instructions: string; input: string | { text: string; images: string[] } };
export type AIProvider = 'chatgpt' | 'anthropic' | 'google' | 'openai';

export async function runJob(job: AIJob): Promise<ReadableStream<Uint8Array>> {
  const chatgpt = await decryptFromStorage<{ accessToken: string; accountId: string; refreshToken: string }>('confluencr.chatgpt');
  if (chatgpt) {
    const r = await fetch('/api/codex/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: chatgpt.accessToken,
        accountId: chatgpt.accountId,
        instructions: job.instructions,
        input: typeof job.input === 'string' ? job.input : job.input.text,
        model: 'gpt-5.4',
      }),
    });
    if (r.ok && r.body) return r.body;
    if (r.status === 401) { /* refresh + retry */ }
  }
  // BYO key fallback paths via /api/ai/* routes (placeholder for now)
  throw new Error('No provider connected');
}
```

- [ ] **Step 2: ChatGPT connect button + device-code flow UI**

`components/provider-picker/chatgpt-connect.tsx` implements: click → POST device-code → open verification URL in new tab → poll every 5s → on success, encryptToStorage and update state.

- [ ] **Step 3: BYO key input**

Simple labeled inputs for OpenAI / Anthropic / Google / fal / Ideogram keys. Save encrypted to localStorage.

- [ ] **Step 4: Provider modal**

Three-radio panel matching spec §3.C mockup.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: provider router + ChatGPT connect UI + BYO key input"
```

---

## Phase 3 — Brief (Step 1)

### Task 8: Wizard shell + step card primitive

**Files:**
- Create: `components/wizard/wizard-shell.tsx`, `step-card.tsx`

- [ ] **Step 1: StepCard with slackflow expand/collapse pattern (chevron rotation, height/opacity transition via AnimatePresence)**

Use framer-motion `AnimatePresence` and `motion.div` with `initial={{ height: 0, opacity: 0 }}` / `animate={{ height: 'auto', opacity: 1 }}`. Chevron rotates 180deg with `rotate: expanded ? 180 : 0`.

- [ ] **Step 2: WizardShell stacks 6 StepCards. State management via URL search params or context.**

### Task 9: Brief form (6 sections with chips)

**Files:**
- Create: `components/wizard/step-1-brief.tsx`, `components/brief/*.tsx`, `components/chips/preset-chips.tsx`, `components/color/palette-editor.tsx`, `app/api/briefs/[id]/route.ts`

- [ ] **Step 1: PresetChips component**

Chip palette + free-text input. Selecting a chip fills the text input. User can edit. Save on blur.

- [ ] **Step 2: Static chip library**

`lib/chip-library.ts` exports a category → chip-set mapping for fallback when no AI provider connected:

```ts
export const CHIPS = {
  audience: {
    fashion: ['Tier 1 Gen Z streetwear', 'Tier 2 college-age meme-fluent', 'Premium 35+ minimalist', 'Mass-market value seeker'],
    beauty: ['Urban millennial first-time skincare', 'Premium 35+ luxe beauty', 'Gen Z TikTok-curious', 'Mass-market value seeker'],
    // ... etc per category
  },
  voiceOpposites: ['confident not hypey', 'playful not slapstick', 'expert not clinical', 'warm not saccharine', ...],
  // smp starters, customer insight patterns, etc
};
```

- [ ] **Step 3: Each brief section as its own component**

Per design spec §2 Step 1. Use shadcn Accordion for sub-sections.

- [ ] **Step 4: Save on every field change, debounced 500ms**

PATCH `/api/briefs/[id]` upserts the brief doc + bumps `project.editEpoch`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Step 1 brief form with 6 sections + preset chips"
```

---

## Phase 4 — Scraping & Style Extraction (Step 2)

### Task 10: URL → image fetcher (5-strategy chain)

**Files:**
- Create: `lib/scraping/url-fetcher.ts`, `lib/scraping/playwright-fallback.ts`

- [ ] **Step 1: Strategy chain function**

```ts
export async function extractImagesFromUrl(url: string): Promise<{ images: string[]; strategy: string }> {
  const html = await fetchHtml(url);
  // try og:image
  // try JSON-LD Product.image
  // try twitter:image
  // try <img> scan with scoring
  // fall back to Playwright screenshot
}
```

Use `cheerio` for HTML parsing. Timeouts 8s per URL via AbortController.

- [ ] **Step 2: Playwright fallback (lazy load)**

Only spin up Playwright if first 4 strategies fail. Use `playwright-core` + `@sparticuz/chromium` for Vercel.

### Task 11: Image validators + vision classifier

**Files:**
- Create: `lib/scraping/image-validator.ts`

- [ ] **Step 1: Size/aspect validation via sharp**
- [ ] **Step 2: pHash dedupe (use `sharp` to downscale to 8x8 grayscale, compute hash)**
- [ ] **Step 3: Batched vision classifier — single LLM call with all candidates**

Returns `[{idx, classification: 'hero'|'banner'|'logo'|'noise', confidence}]`.

### Task 12: Style extraction

**Files:**
- Create: `lib/ai/style-extractor.ts`, `app/api/style-extract/route.ts`

- [ ] **Step 1: Build vision prompt** per spec §3.4

System prompt requires StyleReport JSON with `evidence` array. User prompt includes brief essentials + image URLs.

- [ ] **Step 2: Route streams activity events + final JSON**

### Task 13: Step 2 UI

**Files:**
- Create: `components/wizard/step-2-style-report.tsx`, `components/activity-ticker/activity-ticker.tsx`

- [ ] **Step 1: Activity ticker component**

Reads SSE events; renders log with checkmarks/warnings/spinners.

- [ ] **Step 2: Step 2 UI: 6-up grid (left) + style report card (right)**

Each token editable. Pin/unpin via small chip on each competitor image.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: Step 2 scraping pipeline + style extraction + activity ticker"
```

---

## Phase 5 — Angles (Step 3)

### Task 14: Angle proposal + UI

**Files:**
- Create: `lib/ai/angle-proposer.ts`, `app/api/angles/route.ts`, `components/wizard/step-3-angles.tsx`

- [ ] **Step 1: Prompt + JSON schema per spec §3.5**

System prompt: "You are proposing 5 strategic angles for a product imagery brief. Each angle must come from the controlled vocabulary [Aspirational, Rational, Emotional, Problem-Solution, Social-Proof, Transformation, Scarcity, Value]. Tie each rationale to a specific competitor whitespace claim from the style report. Return JSON array."

- [ ] **Step 2: Horizontal scroll-snap card row**

Cards show: angle name, rationale, palette swatches, sample headline, typography. Selection state. Trifecta-spread enforcement (warning if all 3 same family).

- [ ] **Step 3: Show-all-8 toggle**

- [ ] **Step 4: Custom angle modal (hand-author)**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: Step 3 angle picker with trifecta enforcement"
```

---

## Phase 6 — Concept Briefs (Step 4)

### Task 15: Concept brief generation + UI

**Files:**
- Create: `lib/ai/concept-generator.ts`, `lib/ai/quality-gates.ts`, `lib/utils/color.ts`, `app/api/concept-briefs/route.ts`, `components/wizard/step-4-concepts.tsx`

- [ ] **Step 1: 3 parallel generation calls**

Per spec §3.6. Use Promise.allSettled. Multiplex SSE with `requestId` per concept.

- [ ] **Step 2: Quality gates**

CIE2000 ΔE for palette match. Mandatories presence check. Do-not-include scan. Shot recipe → angle family compatibility table.

- [ ] **Step 3: Mood board layout per concept**

3 expandable cards. Each section inline-editable. Per-section regenerate buttons. Free-text "make it more X" nudge that re-runs with extra constraint.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Step 4 concept brief generation + mood board UI + quality gates"
```

---

## Phase 7 — Image Gen + Prompt Deck

### Task 16: Image generation (optional)

**Files:**
- Create: `app/api/image-gen/route.ts`, `components/wizard/step-5-image-gen.tsx`

- [ ] **Step 1: Per-tool image gen routing**

If fal key: POST to fal.ai Flux Kontext. If Gemini: Nano Banana. If Ideogram: v3. If OpenAI: gpt-5-image.

- [ ] **Step 2: Cost estimate UI before generation**

Shows `(concepts × surfaces × per-call cost)`.

- [ ] **Step 3: Stream thumbnails in via SSE**

### Task 17: Prompt deck + PDF export

**Files:**
- Create: `app/api/prompt-deck/route.ts`, `app/api/pdf/[id]/route.ts`, `components/wizard/step-6-prompt-deck.tsx`, `lib/pdf/approach-renderer.tsx`

- [ ] **Step 1: Assemble prompt deck**

For each concept × surface, pick the recommended tool's prompt variant. Wrap with heading + description.

- [ ] **Step 2: Vertical scroll list UI with copy buttons**

Per spec §2 Step 6. Default shows one tool per card; expandable to all 5 variants.

- [ ] **Step 3: PDF export via @react-pdf/renderer**

Cover + brief + style report + 3 concept briefs + prompt deck. Per spec §7.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: Steps 5-6 image gen + prompt deck + PDF export"
```

---

## Phase 8 — Cascade Staleness + Error Envelopes

### Task 18: editEpoch wiring + stale chips

**Files:**
- Modify: brief-save + style-report-save + angle-edit handlers to bump `project.editEpoch`
- Modify: each step UI to read `derivedFrom.editEpochAtGeneration` vs `project.editEpoch` and render chip

- [ ] **Step 1: Bump epoch on relevant writes**
- [ ] **Step 2: Stale chip component (amber/red + Re-run button)**
- [ ] **Step 3: Commit**

### Task 19: Error envelope component

**Files:**
- Create: `components/ui/error-envelope.tsx`

Plain English what failed + one-sentence likely cause + next action button. Used by every API call wrapper.

```bash
git add -A && git commit -m "feat: cascade staleness chips + error envelope component"
```

---

## Phase 9 — Test Runs

### Task 20: Bewakoof Friends tee test run

- [ ] **Step 1: Connect ChatGPT** in the live app
- [ ] **Step 2: Fill brief**: Bewakoof Friends Pivot Oversized Tee. Audience: Tier 1 Gen Z streetwear. SMP: "wear the show, own the joke". RTBs: officially licensed Friends merch / oversized fit drop / 240gsm cotton.
- [ ] **Step 3: Brand**: palette #FFCC00, #0A0A0A, #FFFFFF (60/30/10). Voice: "punny not slapstick", "rebellious not edgy". Logo upload.
- [ ] **Step 4: References**: paste snitch.in product URL + beyoung.in URL + upload souledstore image
- [ ] **Step 5: Surfaces**: 1:1 + 4:5
- [ ] **Step 6: Run step 2 → 3 → 4. Edit 1 token in style report → verify stale chip on downstream docs**
- [ ] **Step 7: Skip Step 5 (prompt-only). Export PDF.**
- [ ] **Step 8: Capture**: screen recording, screenshots per step, the exported PDF. Save to `F:\confluencr\test-runs\bewakoof\`

### Task 21: Decathlon Quechua test run

Same flow with Decathlon India MH100 trekking shoe. Prove generalization. Save to `F:\confluencr\test-runs\decathlon\`.

### Task 22: Failure case smoke tests

- [ ] Disconnect ChatGPT mid-flow, reconnect
- [ ] Submit a bad URL, verify graceful fallback to upload prompt
- [ ] Edit brand palette after Step 4, verify all concept briefs flag stale

---

## Phase 10 — Final polish + deploy

### Task 23: README + screenshots

Document how to run the app locally and how to deploy to Vercel.

### Task 24: Vercel deploy

```bash
npm i -g vercel
vercel login
vercel link
vercel env add MONGODB_URI
vercel env add MONGODB_DB
vercel --prod
```

---

## Spec coverage check (self-review)

- [x] §1 architecture: Phase 0 + 1 + 2
- [x] §2 wizard flow: Phases 3-7
- [x] §3 AI pipeline: Phases 2-6
- [x] §3.2-3.3 ChatGPT auth: Phase 2
- [x] §4 data model: Phase 1 + cascade in Phase 8
- [x] §5 scraping: Phase 4
- [x] §6 activity ticker: Phase 4
- [x] §7 PDF export: Phase 7
- [x] §8 error handling: Phase 8 + 9
- [x] §9 testing: Phase 9

All sections of the spec are covered by at least one task. Plan is ready.
