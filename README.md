# Confluencr Creative Cockpit

A web cockpit that turns a brand brief into three on-brand product image concept briefs plus an execution-ready prompt deck.

Submission for the Confluencr / Walnut Folks **Creative Process Engineer** assignment. The strategic bet is that the marginal cost per brief is zero rupees by default, because the recommended path authenticates against the user's own ChatGPT subscription.

## Live deployment

The cockpit is live at **https://confluencr-creative-cockpit.vercel.app**

Open the link, click `Start a new brief`, connect ChatGPT through the Settings button (top-right of the project page), and walk through the six steps. A pre-populated Bewakoof Friends Pivot oversized tee project is available at `/p/019e6fe6-a221-77e4-8dd4-8ba36a02d388` so the test-run state is visible without running every step yourself.

## Submission packet — what to read in what order

| # | Artefact | Path |
|---|---|---|
| 1 | **Approach document** (Deliverable 1) | [`APPROACH.pdf`](APPROACH.pdf) |
| 2 | **Working tool** (Deliverable 2) | Live at [https://confluencr-creative-cockpit.vercel.app](https://confluencr-creative-cockpit.vercel.app) · source in [`app/`](app/), [`components/`](components/), [`lib/`](lib/) |
| 3 | **Test run output** with screenshots from the deployed app, brand brief filled in, 3 concept briefs, prompt deck, commentary (Deliverable 3) | [`TEST-RUN.pdf`](TEST-RUN.pdf) |
| 4 | **Walkthrough video** recorded against the deployed link | [`walkthrough.mp4`](walkthrough.mp4) |
| 5 | System-generated PDF that the app exports at Step 6 for a Bewakoof brief | [`test-run-doc/system-generated.pdf`](test-run-doc/system-generated.pdf) |

## Source of every artefact

| Path | What it is |
|---|---|
| `Creative Process Engineer - Assignment.pdf` | The original brief from Confluencr. |
| `approach-doc/` | Source for `APPROACH.pdf` (HTML + Playwright PDF renderer). |
| `test-run-doc/` | Source for `TEST-RUN.pdf` + walkthrough recorder + system PDF output. |
| `scripts/seed-bewakoof.mjs` | Seed script that inserts a complete Bewakoof project into MongoDB. Run with `node scripts/seed-bewakoof.mjs`. |
| `docs/superpowers/specs/2026-05-28-confluencr-creative-cockpit-design.md` | Full design spec. |
| `docs/superpowers/plans/2026-05-28-confluencr-creative-cockpit.md` | Implementation plan. |

## Architecture at a glance

```
Browser (Next.js 16 RSC, framer-motion, shadcn-style UI, dark/light theme)
      │
      ├── Server actions / streaming SSE routes
      ▼
Next.js Server Functions (Fluid Compute, Node.js 24)
      │
      ├── ChatGPT device-code auth → Codex API @ chatgpt.com/backend-api/codex/responses (gpt-5.4)
      ├── Cheerio scraper (og:image / JSON-LD / Twitter card / img scan)
      ├── @react-pdf/renderer for the test-run PDF export
      └── MongoDB Atlas (projects · briefs · styleReports · angleProposals · conceptBriefs · promptDecks)
```

The auth flow is ported from the Orbiter project pattern (`lib/ai/openai-oauth.ts`). Tokens are stored client-side only, encrypted in `localStorage` via SubtleCrypto AES-GCM. The server proxies Codex requests but never persists tokens.

## The six wizard steps

1. **Brief** — six-section accordion (Product / Audience / Strategy / Brand / References / Surfaces) with preset chip palettes that adapt per category. Autosaves on change.
2. **Competitor Style Report** — scrapes pasted URLs for meta + image candidates, then runs gpt-5.4 to extract a structured `StyleReport` with palette, lighting, composition, props, copy patterns, audience signal, negative patterns, and image-grounded evidence.
3. **Strategic Angles** — gpt-5.4 proposes 5 contextual angles using a controlled vocabulary. Picker enforces strategic spread across the Rational / Emotional / Aspirational / Social trifecta.
4. **Concept Briefs** — three parallel gpt-5.4 calls, one per picked angle. Each produces a full mood board (theme, palette, typography, shot recipe, copy, mandatories, 5 tool-specific prompts, negative prompt). Quality gates check palette overlap, mandatories presence, and do-not-include scrubbing.
5. **Image Generation** — optional. Skipped by default in v1 (prompt-only path).
6. **Prompt Deck Export** — assembles one card per concept × surface using the recommended tool per shot type. Vertical scroll with copy buttons, "open in tool" deep links, and a `Download PDF` that produces a single bundled test-run PDF (cover + brief + style report + 3 concept briefs + prompt deck).

## Run locally

### Prerequisites

- Node.js 20 or newer
- A MongoDB Atlas free-tier (M0) cluster, or a local MongoDB instance
- A ChatGPT Plus, Team, or Enterprise subscription (for the recommended zero-cost path)

### Setup

```bash
git clone <this repo>
cd confluencr
npm install
cp .env.example .env.local
# Edit .env.local with your MONGODB_URI
npm run dev
```

Open `http://localhost:3000`, click "Start a new brief", connect ChatGPT from the settings button (top-right of `/p/[id]`), and start filling the brief.

### Environment variables

| Variable | Required | What it does |
|---|---|---|
| `MONGODB_URI` | yes | Mongo Atlas / local connection string |
| `MONGODB_DB` | no | Database name, defaults to `confluencr` |

There are no other server keys. The user supplies their own ChatGPT session (or, later, a BYO API key) via the in-app picker.

## The PDF approach doc

`APPROACH.pdf` is generated from `approach-doc/index.html` via Playwright. To rebuild after editing:

```bash
cd approach-doc
npm install   # one-time
npm run build
```

Output lands at `F:\confluencr\APPROACH.pdf` (or `./APPROACH.pdf` cross-platform).

## What "done" looks like for the assignment

The submission ships:

1. `APPROACH.pdf` — 2-page, Notion / Linear style, zero em-dashes, hits all four required questions from the brief.
2. The working Next.js app you can run with the steps above.
3. Test run output — fill a Bewakoof Friends Pivot oversized tee brief (or Mamaearth / Decathlon / your own brand) end-to-end and download the test-run PDF from Step 6.

## What's deliberately out of scope (v1)

- User accounts, teams, multi-tenant. Project URL `/p/<uuidv7>` is identity + access token.
- In-app image generation (handled by external tools using the exported prompts).
- Playwright fallback for SPA-only sites (cheerio + meta-tag scraping covers the common D2C surfaces).
- Brand-asset library across multiple products per brand.

## Why this submission is shaped the way it is

- **Trifecta enforcement on the angle picker** is the test the assignment grades. Three concepts that look different are not three concepts that ARE different.
- **ChatGPT device-code auth (`gpt-5.4`)** keeps the marginal cost at zero rupees, which is the only honest answer for an operator team running this at SKU scale.
- **`editEpoch` cascade invalidation** is one integer per project. Crude, bulletproof, no fingerprinting.
- **Evidence-array grounding on the StyleReport schema** stops AI from inventing competitor patterns. No image, no claim.
- **Voice opposites and do-not-include** are the two brief fields that kill the bland-corporate default tone AI lands on.

— Piyush Malik · piyushmalik987@gmail.com · May 2026
