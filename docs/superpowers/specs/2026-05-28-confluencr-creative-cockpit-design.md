# Confluencr Creative Cockpit — Design Spec

**Date:** 2026-05-28
**Project:** Take-home assignment for Creative Process Engineer role at Confluencr (Walnut Folks Group)
**Author:** Ateeb Shaikh (ateeb.shaikh@cyborg.men)
**Status:** Draft v1 (self-reviewed 3x, ready for implementation)

---

## 0. Problem Statement (one paragraph)

Build a web cockpit that takes a brand brief and produces three strategically distinct, on-brand product image concepts plus execution-ready prompts. The system targets Intent Farm's creative ops use case: industrialize ad-creative output for D2C brands across Amazon listings, Meta dynamic creative, and website hero sections. Submission has three deliverables: (a) this design spec is an internal artifact, (b) the approach doc `F:\confluencr\APPROACH.md` is the public 1-2 page narrative for the hiring panel, (c) the working tool is the Next.js app. Test run on Bewakoof primary, Decathlon India for generalization.

### Human decision gates (the system's design priority)
The grader explicitly tests for "where humans still need to make decisions." The system has 5 named gates, each visible in the UI as a decision moment, not an automation step:
1. **Brief authoring** — the operator declares strategy, audience, mandatories.
2. **Style report curation** — pin/unpin competitor visuals, edit extracted tokens.
3. **Angle picking** — choose 3 of 5 AI-proposed angles; enforce strategic spread.
4. **Concept brief acceptance** — review, edit, or regenerate each section.
5. **Image approval** — accept, regen, or swap model per generated image.
The system never advances past a gate without an explicit click.

## 1. System Architecture

Single Next.js 16 App Router app deployed on Vercel. MongoDB Atlas free tier (M0) for persistence. Vercel AI Gateway for provider routing for any user who supplies an API key. ChatGPT device-code auth (Codex API endpoint) as the recommended zero-cost path.

```
Browser (Next.js 16 RSC, shadcn/ui, framer-motion, light/dark theme)
   │
   ├── Server Actions (form submits, mutations)
   └── Streaming routes (SSE for long AI calls)
        │
        ▼
   Next.js Server Functions (Fluid Compute, 300s default timeout)
        │
        ├── Vercel AI Gateway (BYO key path: anthropic/google/openai/fal/ideogram)
        ├── Direct Codex client (ChatGPT path: chatgpt.com/backend-api/codex/responses)
        ├── Playwright on Vercel Sandbox (scraping fallback)
        └── MongoDB Atlas (projects, briefs, derived docs)
```

**Hosting**: Vercel (Hobby tier sufficient for demo). **Domain**: TBD by user.
**Storage cost**: $0 (MongoDB M0 free tier, Vercel Hobby, Vercel Blob free tier for uploaded images).
**AI cost**: $0 default (prompt-only or ChatGPT auth). User can plug in keys for image gen.

### Privacy invariants
- No login, no user accounts. Project URL `/p/{uuidv7}` is both identity and access token.
- ChatGPT auth tokens stored client-side only (encrypted localStorage via SubtleCrypto AES-GCM). Server never persists them.
- BYO API keys also client-side only. Server proxies requests but does not retain keys.
- MongoDB stores only brand-supplied content + AI-generated artifacts. No PII required.

## 2. The 6-step Wizard Flow

Single-page wizard. Slackflow-style in-place card expansion (chevron rotation + height/opacity transition via framer-motion AnimatePresence). Completed steps collapse to summary header; active step fully open; future steps placeholder. Sticky right rail shows project summary + theme toggle + share link.

### Step 1 — Brief
Six-section accordion within one card:
1. **Product**: name, one-liner, hero photo(s) [upload / URL / text-only with fidelity badge], price tier, category
2. **Audience**: description, signal preset chips, customer insight
3. **Strategy**: single-minded proposition (SMP), three reasons to believe (RTBs)
4. **Brand**: palette (hex + usage ratio sliders), typography, voice opposites ("X not Y"), logo upload
5. **References**: competitor refs [URL paste / image upload / brand-name search tabs], do-not-include list, mood images
6. **Surfaces**: aspect ratios checklist (1:1, 4:5, 9:16, 16:9), mandatories (logo placement, legal claims)

Every starred field has a contextual preset-chip palette + free-text override. Chips are seeded by AI looking at the product category, so they differ per brand (Bewakoof gets "Tier 1 Gen Z streetwear" chips; Mamaearth gets "Urban moms wellness-curious" chips).

**No-AI fallback for chips**: if no provider is connected at Step 1 (likely on first visit), chips render from a static category-keyed library (`fashion`, `beauty`, `wellness`, `sportswear`, `home`, `food`) keyed by user-selected category in Section 1. After a provider is connected, chips re-render contextually on category change.

### Step 2 — Competitor Style Report
Two parallel server jobs after Step 1 submit: scrape/fetch competitor images, then vision-LLM extracts style tokens.

UI: 6-up grid of competitor images (left), contextual style report card (right) showing palette swatches, lighting language, composition tendencies, props, copy patterns, audience signal, negative patterns. Every token is editable. Pin/unpin competitors. Add custom competitor URL or upload on the fly.

### Step 3 — Strategic Angles
AI proposes 5 contextual angles (horizontal scroll-snap cards). Each card: angle name, "why this fits THIS brand" rationale tied to competitor white-space, contextual color swatches, sample headline, typography pairing preview, optional 256×256 micro-thumbnail (generated only if user supplied image-gen key), confidence score.

User picks 3. UI enforces strategic spread (warns if all 3 same family). "Show all 8" toggles in Transformation / Scarcity / Value. Drag to reorder positions.

User can also hand-author a custom angle and slot it among the 5.

### Step 4 — Concept Briefs
Three expandable cards, one per picked angle. Each opens to mood-board layout:
- Theme statement (one line)
- Strategic rationale (one paragraph)
- Color story (hex swatches + usage ratio bars)
- Typography pairing (rendered samples)
- Shot recipe (shot type + lighting + composition + lens + setting + props)
- Headline + subhead + CTA copy
- Mandatories checklist
- Prompts (collapsible) for each image-gen tool: Midjourney variant, Flux variant, Nano Banana variant, GPT-image variant, Ideogram variant
- Negative prompt
- Quality gate status (passed / issues)
- Per-concept regenerate button + per-section regenerate + free-text "make it more X" nudge

### Step 5 — Image Generation (optional)
Gated on an image-gen key being supplied (ChatGPT auth alone is insufficient because Codex API has no image generation). Three states:
- **No key**: explainer + BYO image-key picker (fal / Gemini / Ideogram / OpenAI) + skip to Step 6
- **Key supplied**: shows estimated cost upfront based on count × model rate (e.g. "3 concepts × 2 surfaces × $0.04 = $0.24 estimated"). "Generate all" runs each picked concept × each selected surface through the auto-recommended model (shot-type aware routing). Streams thumbnails in.
- **After generation**: gallery view, click for full-size, per-image regenerate, model swap.

### Step 6 — Export Prompt Deck
Vertical scrolling single column of prompt cards. Each card is self-contained:
```
┌─────────────────────────────────────────────────────────┐
│  Concept 1 · Aspirational · Hero Shot · Amazon 1:1     │
│  ──────────────────────────────────────────────────    │
│  One-line description of what this prompt produces      │
│                                                         │
│  <prompt text in code block>                            │
│                                                         │
│  [📋 Copy]  [Open in Midjourney]  [Open in ChatGPT]    │
│  [+ show variants for Flux · Nano Banana · Ideogram]   │
└─────────────────────────────────────────────────────────┘
```
**Default view**: one card per concept × surface, with the **auto-recommended tool variant** only. So 3 concepts × 2-3 surfaces ≈ 6-9 cards. The other tool variants are hidden behind a per-card "show variants" toggle.

Top of page also has a global "Show all tool variants" toggle which expands every card.

"Download PDF" exports the full deliverable.

### Cross-step behavior
- Each step's completed state collapses to one-line summary; click to re-expand and edit
- Live activity ticker streams during each step (Section 5)
- Save-to-URL fires after every step
- Theme toggle (light/dark) floats top-right, persists in localStorage
- Dot-grid + glow-orb ambient background (slackflow pattern)

## 3. The AI Pipeline

### 3.1 Provider routing matrix

| Job | ChatGPT auth (default, $0) | BYO Anthropic key | BYO Google key | BYO OpenAI key | No keys |
|---|---|---|---|---|---|
| Competitor image classification | gpt-5.4 (vision) | claude-4.7-sonnet | gemini-3-pro | gpt-5 | Skip → user pins manually |
| Style extraction (vision) | gpt-5.4 | claude-4.7-sonnet | gemini-3-pro | gpt-5 | Skip → user types tokens |
| Angle proposal | gpt-5.4 | claude-4.7-sonnet | gemini-3-pro | gpt-5 | Skip → user authors |
| Concept brief generation | gpt-5.4 | claude-4.7-sonnet | gemini-3-pro | gpt-5 | Skip → blank template |
| Image gen (hero/lifestyle/detail) | (Codex has no image gen) | Recommend fal key | gemini-3-pro-image (nano banana) | gpt-5-image | Prompts only |
| Image gen (text-overlay infographic) | n/a | Recommend ideogram | gemini-3-pro-image | gpt-5-image | Prompts only |
| Image gen (poster/typography) | n/a | ideogram-v3 (if key) | gemini-3-pro-image | gpt-5-image | Prompts only |

### 3.2 ChatGPT device-code auth (Orbiter pattern)

Copy `F:\Orbiter\src\modules\ai\openai-oauth.ts` and `F:\Orbiter\src\modules\ai\codex-client.ts` near-verbatim, adapting storage to client-side.

Constants:
```
CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann"
DEVICE_CODE_ENDPOINT = "https://auth.openai.com/api/accounts/deviceauth/usercode"
VERIFICATION_URL = "https://auth.openai.com/codex/device"
CODEX_API_ENDPOINT = "https://chatgpt.com/backend-api/codex/responses"
DEFAULT_MODEL = "gpt-5.4"
```

Codex request format:
```ts
{
  model: "gpt-5.4",
  instructions: <system prompt, ASCII sanitized>,
  input: [{ role: "user", content: <user prompt, ASCII sanitized> }],
  store: false,
  stream: true,
}
```
Headers:
```
Authorization: Bearer <accessToken>
chatgpt-account-id: <accountId>
Content-Type: application/json
Accept: text/event-stream
```

Response: SSE stream, parse `data: {...}` lines, collect `response.output_text.delta` chunks, terminate on `[DONE]`.

Token refresh: standard OAuth `refresh_token` flow. Auto-retry on 401.

### 3.3 Storage divergence from Orbiter

Orbiter persists tokens server-side because it has authed users. We do not. Tokens stored as:
```js
localStorage.setItem("confluencr.chatgpt", await encrypt({
  accessToken, refreshToken, idToken, accountId, email, planType, expiresAt
}, perDeviceKey))
```
Per-device key derived once via `crypto.getRandomValues` + `SubtleCrypto.deriveKey(PBKDF2 → AES-GCM)`. Stored separately, never sent to server.

**Server proxy is always required** (browser cannot call `chatgpt.com/backend-api/codex/responses` directly due to CORS). Flow:
1. Client decrypts tokens from localStorage
2. Client POSTs to `/api/codex/proxy` with `{ accessToken, accountId, instructions, input, model }` in body
3. Server forwards to Codex endpoint, streams SSE response back to client
4. Server logs MUST exclude the access token (use a redacting logger)

### 3.3a ChatGPT free-tier fallback

If the Codex endpoint returns 403/insufficient_quota/model_not_available, the user is on free tier or has hit a limit. Show:
> "Your ChatGPT account doesn't have gpt-5.4 access (Plus/Team/Enterprise required). Add a BYO API key or continue manually."
Surface the BYO key picker inline. Do not retry silently.

### 3.4 Style extraction prompt schema

Single batched vision call. Input: 4-6 competitor images + brand brief essentials. Output: structured JSON:

```ts
type StyleReport = {
  palette: { hex: string; role: "primary"|"accent"|"neutral"|"background"; ratio: number; evidenceImageIdx: number }[];
  lighting: string;          // "golden-hour window light · soft top + rim"
  composition: string;       // "centered hero · graphic-poster framing"
  props: string[];           // ["solid color backdrops", "graphic posters"]
  copyPatterns: string[];    // ["punny one-liners", "all-caps display type"]
  audienceSignal: string;    // "Tier 1 Gen Z streetwear"
  negativePatterns: string[];// ["no clean catalog white-bg"]
  evidence: { imageIdx: number; claim: string }[];
}
```

The `evidence` field is mandatory and forces grounding to specific images. Catches hallucination.

### 3.5 Angle proposal prompt schema

```ts
type AngleProposal = {
  name: "Aspirational"|"Rational"|"Emotional"|"Problem-Solution"|"Social-Proof"|"Transformation"|"Scarcity"|"Value";
  rationale: string;          // why THIS angle fits THIS brand
  whitespaceClaim: string;    // which competitor pattern this contradicts/avoids
  palette: { hex: string; role: string }[];
  typography: { display: string; body: string };
  sampleHeadline: string;
  confidence: number;         // 0-1
  microThumbnailUrl?: string; // only if image-gen key supplied
}
```

System sorts by confidence, dedupes near-identical proposals, returns top 5.

### 3.6 Concept brief prompt schema

For each picked angle, parallel LLM call generates:

```ts
type ConceptBrief = {
  themeStatement: string;
  strategicRationale: string;
  colorStory: { hex: string; role: string; ratio: number }[];
  typography: { display: string; body: string; samples: { headline: string; body: string } };
  shotRecipe: {
    shotType: "hero"|"lifestyle"|"detail"|"infographic"|"in-use"|"scale"|"packaging"|"comparison"|"social-proof";
    lighting: string;
    composition: string;
    lens: string;
    setting: string;
    props: string[];
  };
  copy: { headline: string; subhead?: string; cta: string };
  mandatories: { item: string; satisfied: boolean }[];
  prompts: {
    midjourney: string;  // terse, weight-modifier syntax, --ar --style flags
    flux: string;        // descriptive, structured
    nanoBanana: string;  // natural language, multimodal
    gptImage: string;    // conversational
    ideogram: string;    // poster/typography-aware
  };
  negativePrompt: string;
  qualityGate: { passed: boolean; issues: { field: string; severity: "warn"|"error"; message: string }[] };
}
```

Prompt skeleton enforced (Subject · Setting · Lighting · Composition · Lens · Style · Color · Aspect · Negative).

### 3.7 Quality gates

Cheap LLM call after each concept brief generation:
- Palette match: hex distance from user-supplied brand colors < threshold (CIE2000 ΔE < 20)
- Mandatories: every mandatory item appears in the prompt
- Do-not-include: zero do-not-include items appear in the prompt
- Shot recipe matches angle: e.g., Aspirational rejects flat-lay; Rational rejects editorial mood

Failures show 🟡 chip; user can auto-fix (regen with constraint) or override.

### 3.8 Cost summary (no images)
| Job | gpt-5.4 via ChatGPT | claude-4.7-sonnet BYO | gemini-3-pro BYO |
|---|---|---|---|
| Style extraction | $0 (user's sub) | ~$0.02 | ~$0.01 |
| Angle proposal | $0 | ~$0.01 | ~$0.005 |
| 3 concept briefs | $0 | ~$0.03 | ~$0.015 |
| Quality gates | $0 | ~$0.01 | ~$0.005 |
| **Total per project** | **$0** | **~$0.07** | **~$0.035** |

## 4. MongoDB Data Model

One database `confluencr`, six collections. `projectId` is UUIDv7 and serves as URL slug.

```ts
// shared envelope every derived doc embeds
type DerivedFrom = {
  editEpochAtGeneration: number;  // bumped on any upstream edit; staleness = epoch < project.editEpoch
  modelUsed: string;
  provider: "chatgpt"|"openai"|"anthropic"|"google"|"fal"|"ideogram"|"manual";
  generatedAt: Date;
  manualEdits?: string[];         // field names the user touched; preserved on regen
};

projects: {
  _id: string;                    // UUIDv7
  createdAt: Date;
  lastTouchedAt: Date;
  editEpoch: number;              // bumped on any brief edit
  step: 1|2|3|4|5|6;               // furthest step reached
  theme: "light"|"dark";
  testBrand?: "bewakoof"|"decathlon"|"mamaearth"|"custom";
}

briefs: {
  _id, projectId,
  product: { name, oneLiner, photos: { kind: "upload"|"url"|"text"; url?: string; fidelityTier: "high"|"medium"|"low" }[], priceTier?, category? },
  audience: { description, signalPreset, insight },
  strategy: { smp, rtbs: string[] },
  brand: { palette: { hex; role; ratio }[], typography, voiceOpposites: { x; y }[], logo? },
  references: { competitorMode: "url"|"upload"|"name", inputs: string[], doNotInclude, moodImages },
  surfaces: { aspectRatios: ("1:1"|"4:5"|"9:16"|"16:9")[], mandatories: string[] },
  updatedAt: Date,
}

styleReports: { _id, projectId, derivedFrom, competitorImages: { url; source; pinned; classification }[], palette, lighting, composition, props, copyPatterns, audienceSignal, negativePatterns, evidence }

angleProposals: { _id, projectId, derivedFrom, angles: (AngleProposal & { custom?: boolean })[], pickedAngleIds: string[], pickedOrder: number[] }

conceptBriefs: { _id, projectId, angleId, position: 1|2|3, derivedFrom, themeStatement, strategicRationale, colorStory, typography, shotRecipe, copy, mandatories, prompts, negativePrompt, qualityGate }

generatedImages: { _id, projectId, conceptBriefId, surface, modelUsed, provider, prompt, imageUrl, generatedAt }

promptDecks: { _id, projectId, derivedFrom, cards: { heading; description; prompt; tool; aspectRatio; conceptId }[] }
```

### Cascade invalidation (simple)

`project.editEpoch` is an integer that starts at 0 and increments by 1 on any **content-changing** mutation to upstream artifacts:
- Any write to `briefs` (any field)
- Any user edit of a `styleReports` field (palette hex change, lighting text edit, etc.)
- Pinning/unpinning a competitor image
- Hand-authoring a custom angle

The following are **not** content changes and do not bump epoch:
- Picking which 3 of 5 angles to keep (this is a downstream selection, not an upstream change)
- Reordering picked angle positions
- Theme toggle
- Navigating between steps

Every derived doc stores `derivedFrom.editEpochAtGeneration`. UI computes `isStale = doc.editEpochAtGeneration < project.editEpoch` and renders the "Brief changed — regenerate?" chip. On regen, the doc fetches latest inputs and writes back with `editEpochAtGeneration = project.editEpoch`.

No fingerprints, no per-field tracking. Crude but bulletproof.

## 5. Scraping & Fetch Pipeline (hardened)

Each URL through a 5-strategy chain. Stop at first success yielding ≥600px-long-edge product-ish image:

```
Strategy 1: parse <meta property="og:image">
Strategy 2: parse JSON-LD application/ld+json { Product.image }
Strategy 3: parse Twitter card <meta name="twitter:image">
Strategy 4: scan <img> tags, score by:
  + size, alt text contains product/hero/main
  - alt/filename contains logo/banner/icon/avatar
Strategy 5: Playwright headless render, screenshot viewport
```

Every candidate runs through validators:
- Resolution ≥ 600×600
- Aspect ratio 0.33–3.0 (rejects banners and skyscrapers unless confidence > 0.9)
- Perceptual hash (pHash) dedupe across all candidates
- Vision-LLM classifier: **single batched call** sends ALL candidates at once and returns `[{idx, classification: "hero"|"banner"|"logo"|"noise", confidence}]`. Keep those classified "hero" with confidence ≥ 0.7. This is the only vision call in §5 (the style extraction in §3.4 is a separate later call on the kept set).

Concurrent execution via `Promise.allSettled`. Per-URL timeout 8s, per-image fetch timeout 4s. Best-effort results: if 3/5 succeed, ship 3 with honest message ("Found 3 visuals; 2 URLs blocked — paste images?").

**Brand-name mode** (Mode C): over-fetch top 20 image search results, run same validator chain, filter to top 4–6. SerpAPI if user provides key, DuckDuckGo HTML scrape as free fallback, "we couldn't find — paste URLs?" as final fallback.

**Site-specific notes:**
- Bewakoof.com: SPA, needs Playwright for full DOM. og:image works on product pages.
- Amazon: heavy CSP, og:image present. Schema.org Product markup reliable.
- Instagram: requires upload, never URL (login wall).
- Shopify stores (Snitch, Souled Store, Beyoung): og:image + Product schema both reliable.

## 6. Live Activity Ticker (UI streaming)

Every long-running route streams SSE events. Frontend renders vertical log with running spinner → checkmark transitions. After step completes, log collapses to one-line summary; clickable to re-expand.

```ts
type ActivityEvent = {
  requestId: string;            // correlates events across multiplexed streams
  ts: number;                   // ms since epoch
} & (
  | { kind: "start"; step: string; estDurationS: number }
  | { kind: "info"; message: string; icon?: "fetch"|"vision"|"model"|"db" }
  | { kind: "ok"; message: string }
  | { kind: "warn"; message: string }
  | { kind: "error"; message: string; nextAction?: string }
  | { kind: "thinking"; modelName: string; elapsedS: number }
  | { kind: "done"; summary: string }
);
```
The `requestId` enables Step 4 to run three concept brief generations in parallel and route events to the correct concept card.

UI example:
```
Step 2 · Competitor Style Report
✓ Reading snitch.in/products/oversized-friends-tee
✓ Found 3 candidates via og:image
✓ Reading souledstore.com/products/marvel-graphic-tee
⚠ Couldn't load — site returned 403
✓ Reading beyoung.in/oversized-tees-marvel
✓ Found 2 candidates via schema.org
⠋ Vision check: classifying 5 candidates… gpt-5.4 · 6s
```

Transparent progress. Users trust transparent systems.

## 7. PDF Export

Server-side rendering via `@react-pdf/renderer`. Single column A4, designed for screen + print.

Page layout:
1. **Cover**: brand name, product name, date, "Generated via Confluencr Creative Cockpit", hero photo
2. **Brand brief**: all 6 sections, hex rendered as actual colored rectangles, voice opposites as "X ← → Y" pairs, competitor refs as 3×2 thumbnail grid
3. **Competitor style report**: 4–6 thumbnails left, extracted tokens right, evidence footnotes
4–6. **Three concept briefs** (one per page): theme, rationale, color story swatches, typography pairing, shot recipe, headline, CTA, mandatories checkbox list, primary prompt in code block
7+. **Prompt deck**: continuous, ~3 cards per page; each card heading, description, prompt code block, tool tag
N. **Methodology footer**: models used, share URL, attribution

PDF is the portable artifact. A brand lead reviews on phone; image-gen AI executes directly from prompts.

## 8. Error Handling & Fallback Chains

Hard rule: **no fake magic, honest fallbacks**.

### Scraping (covered in §5)
URL → 5-strategy chain → upload fallback. Brand-name → SerpAPI → DDG → upload fallback.

### AI provider
ChatGPT 401 → silent token refresh → if fails, "ChatGPT session expired" modal with reconnect.
Provider not connected → walk BYO key list in priority order.
No keys → manual fill mode (each step gives editable templates).

### Quality gates
Per-issue chip on concept card. "Auto-fix" re-runs that section with the issue as constraint. "Override" accepts as-is, chip turns gray. Hex distance threshold (CIE2000 ΔE < 25 for "acceptable family"; < 15 for "close match") is a starting point to tune in test runs.

### Image gen
Per-image retry. Per-image model swap if multiple keys. Per-image "skip" leaves prompt + placeholder in PDF.

### Error envelope shown to user
Every user-facing error: (a) plain English what failed, (b) one-sentence likely cause, (c) next-action button. No stack traces.

## 9. Testing Strategy

Confidence-by-demo, not test pyramid.

1. **Smoke test** after each milestone: single Bewakoof run end-to-end, no edits.
2. **Primary test** (the demo): Bewakoof Friends Pivot tee
   - Brief: filled via chips + custom text
   - Competitors: 2 URLs (snitch.in, beyoung.in) + 1 upload + 1 brand-name (Souled Store) — exercises all 3 input modes
   - Style report: review + edit 1 token (exercises cascade staleness)
   - Angles: 5 contextual proposals → pick Aspirational/Emotional/Rational
   - Concept briefs: 1 regen with "more rebellious" nudge
   - Image step: skipped (prompt-only)
   - Export PDF, verify renders
   - Capture: full screen recording + screenshots + PDF
3. **Generalization test**: Decathlon India Quechua MH100 trekking shoe, full flow. Goal: prove no Bewakoof-specific behavior leaked.
4. **Failure tests**:
   - Expired ChatGPT token → refresh works
   - Disconnect mid-flow → resume after reconnect
   - Bad URL → graceful fallback to upload
   - Cascade: edit palette after Step 4 → all 3 concept briefs flag stale
5. **Cross-browser**: Chrome primary, Safari mobile preview, Firefox sanity.

Explicitly skipped: unit tests, visual regression, load testing, formal a11y audit (shadcn defaults only).

## 10. Tech Stack & Dependencies

```
Runtime
  Next.js 16 App Router
  React 19
  Node.js 24 LTS (Fluid Compute default)

UI
  shadcn/ui (Tailwind v4)
  framer-motion 12+ for slackflow-style transitions
  lucide-react for icons
  next-themes for dark/light toggle
  cmdk for command palette (optional)

Data
  mongodb (official driver) ≥ 6
  uuidv7 for ids
  zod for schema validation

AI
  ai (Vercel AI SDK v6)
  @ai-sdk/anthropic / @ai-sdk/google / @ai-sdk/openai for BYO key path
  Custom Codex client for ChatGPT auth path (Orbiter pattern)

Scraping
  playwright on Vercel Sandbox
  cheerio for HTML parsing
  sharp for image probing
  perceptual-hash for dedupe

PDF
  @react-pdf/renderer

Misc
  pHash via sharp + dhash JS impl
  crypto (built-in) for token encryption
```

## 11. Open questions / known unknowns

- **Vercel Sandbox Playwright cold start**: measure during build. If consistently > 8s cold, switch to HTTP-only strategies + display "this URL needs an upload" earlier in the chain.
- **Mobile UX**: design assumes desktop primary; mobile is sanity-check only. Wizard cards must remain usable on mobile but rich preview thumbnails may be too small. Defer optimization.
- **Custom angle UX**: hand-author flow needs design polish. v1: simple modal with name + rationale + 2-color palette + headline. Improve later.
- **Tune ΔE thresholds for palette match**: starting at 25/15 but real test runs will inform.

### Decided / closed
- ~~Codex CSP from browser~~ — decided: always proxy via `/api/codex/proxy` server route.

## 12. Out of scope (v1)

- User accounts, auth, teams
- Saved templates per brand
- A/B prompt variant testing
- Brand-asset library (multiple products per brand)
- Image editing inside the app
- Collaboration / comments
- Webhook outputs
- Slack/Notion exports

---

## Self-review notes (3 passes)

**Pass 1 — Placeholder scan**: No TBD or TODO remains. The one "TBD" was the domain in §1 hosting; left intentional because the user picks at deploy time.

**Pass 2 — Internal consistency**: Cross-checked §2 wizard flow against §4 data model collections. All artifacts in the flow have a corresponding collection. The `qualityGate` field appears in both §3.7 and §4 conceptBriefs schema, consistent. The `editEpoch` is defined once (§4) and referenced from §6 ticker behaviour. Consistent.

**Pass 3 — Ambiguity & scope**: The phrase "AI-recommended model per concept" in §3 routing was vague; rewrote as the routing matrix (explicit per-job per-key). The phrase "best practices for prompt engineering" was hand-waved; replaced with the explicit Subject · Setting · Lighting · Composition · Lens · Style · Color · Aspect · Negative skeleton. Scope is bounded by §12 out-of-scope list. Single implementation plan should fit.

**Pass 3 also caught**: The activity ticker `ActivityEvent` type was originally defined in two places (§2 inline and §6). Consolidated to §6 only with reference from §2.

Doc is ready for implementation. Next: invoke writing-plans skill.
