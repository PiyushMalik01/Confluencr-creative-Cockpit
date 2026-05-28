# From brand brief to three on-brand image concepts, in one wizard

A 6-step single-page wizard. Brief in, three on-brand concept briefs out, prompt-deck PDF on the way. The one strategic bet: marginal cost per brief is zero rupees by default, because the recommended path authenticates against the user's own ChatGPT subscription (Codex device-code auth, gpt-5.4) and BYO keys are only required if the brand wants renders. The quieter bet: the three concepts are anchored to a Rational / Emotional / Aspirational trifecta. Three concepts that look different are not three concepts that ARE different, and most ad-creative pipelines fail this test.

## The six steps and who does what

**Step 1, Brief.** Human-only. Six-section accordion: Product, Audience, Strategy (single-minded proposition + three RTBs), Brand (palette with usage ratios, voice opposites as "X not Y"), References (URL paste, upload, or brand-name search), and Surfaces (1:1 for Amazon hero, 4:5 for Meta feed, 9:16 for Reels, 16:9 for hero banners). Every starred field has AI-seeded preset chips that change per category, so a Bewakoof Friends Pivot oversized tee sees "Tier 1 Gen Z streetwear" presets and a Quechua MH100 trekking shoe sees "value-tier outdoor enthusiast" presets. Chips constrain, free-text overrides.

**Step 2, Competitor Style Report.** AI heavy, human curates. Two parallel jobs: a 5-strategy scrape chain (og:image, JSON-LD, Twitter card, scored img scan, Playwright fallback) then a vision call returning a structured `StyleReport`. Palette with hex + role + ratio, lighting language, composition, props, copy patterns, audience signal, negative patterns. Every claim cites an `evidenceImageIdx`. The human pins, edits any token, adds refs.

**Step 3, Strategic Angles.** AI proposes 5 angles as horizontal scroll-snap cards, each with a "why this fits THIS brand" rationale tied to a specific competitor whitespace claim. The trifecta picker enforces strategic spread, so picking three Aspirational cards triggers a warning. Human picks three, reorders, or hand-authors a custom angle.

**Step 4, Concept Briefs.** AI generates three `ConceptBrief` documents in parallel, one per angle. Each declares the same six spec fields: theme statement, color story with ratios, typography pairing, shot recipe (shotType, lighting, composition, lens, setting, props), headline + subhead + CTA, mandatories checklist. Five tool-specific prompts per brief (Midjourney, Flux, Nano Banana, GPT-image, Ideogram), each written in that tool's native idiom. Human nudges with "make it more rebellious" or per-section regen.

**Step 5, Image Generation.** Optional. Skipped if no image-gen key. With a fal or Ideogram key, shot-type-aware routing picks Flux Kontext Pro for hero and lifestyle, Ideogram v3 for poster/typography, and streams thumbnails into a gallery.

**Step 6, Prompt Deck Export.** PDF of 15-25 prompt cards (3 concepts × 2-3 surfaces × 2-3 tool variants). Every card is self-contained: heading, one-line description, prompt in a code block, tool tag. A brand lead reviews on phone; a designer or an image-gen AI executes from it directly.

## The 1-page brand brief

Six sections, fits one A4 page, every field load-bearing.

- **Product**: name, one-liner, hero photo (upload, URL, or text-only with a fidelity badge so the model knows it is working blind), price tier, category.
- **Audience**: description, signal preset, one customer insight in the brand's own words.
- **Strategy**: single-minded proposition, three reasons to believe.
- **Brand**: palette as hex with usage-ratio sliders (60/30/10 by default), typography, voice opposites as "X not Y" pairs (e.g. "playful, not slapstick"), logo.
- **References**: 3-6 competitor URLs OR uploads OR brand names, plus a do-not-include list, plus optional mood images.
- **Surfaces**: aspect ratios checklist and mandatories (logo placement, legal claims, A+ content panel safe zones).

Two fields most briefs skip do disproportionate work here: voice opposites and do-not-include. Voice opposites kill the bland-corporate default tone AI lands on without contrastive framing. The do-not-include list strips off-strategy clichés before they reach the prompt. For Bewakoof, that means "clean studio white-bg" goes on the list, because Souled Store owns that frame and the angle is to avoid it.

## What "done" means

Each step has a binary gate, not a vibe.

**Brief**: six sections submitted, palette has a primary hex, at least one competitor ref resolves to a real image. **Style Report**: 3+ palette swatches with hex + role + ratio, and every extracted token carries an `evidenceImageIdx` pointing to a fetched image. No floating claims. **Angles**: 5 proposals returned, each with controlled-vocabulary name, rationale, whitespace claim, confidence score; user has picked 3 spanning at least two trifecta families. **Concept Briefs**: all six spec fields populated, quality gate passes (palette ΔE < 20 against brand hex, every mandatory present in the prompt, zero do-not-include items present, shot recipe matches angle family). **Image Generation**: every requested surface yields either a rendered image or a logged failure with a reason. **Export**: PDF renders cover, brief, style report, three concept briefs, and prompt deck with no missing assets.

## What can go wrong, and how it is caught

A handful of failure modes are worth budget. Most are the ones a generic "Zapier + ChatGPT" workflow eats silently.

*Off-brand colour drift in renders.* Flux returns a navy hero when the brand is mustard. Caught by a CIE2000 ΔE gate that samples dominant colours from the render and compares to the brief palette. Fails to a yellow chip; auto-fix re-runs the prompt with `--no` constraints on the offending hues.

*Scrape blocked by CSP or a login wall.* Bewakoof's SPA needs Playwright; Instagram is a login wall full stop. Caught by the 5-strategy chain degrading to "we couldn't load 2 of 5 URLs, paste images?" instead of fabricating tokens. The ticker shows the failure live so the user never wonders.

*Three visually different but strategically identical angles.* The classic: three Aspirational concepts in different palettes. The angle picker refuses to advance until at least two trifecta families are picked. A "Show all 8" toggle exists for users who insist, but they have to insist.

*Brief edits after concept briefs exist.* User flips the palette in Step 1 after seeing Step 4. Caught by an integer `editEpoch` that bumps on every upstream write. Each derived doc stores `editEpochAtGeneration` and shows a stale chip when the integers diverge. One-line check, no fingerprinting.

*Hallucinated competitor patterns.* AI loves inventing "competitors use heavy grain" when nothing in the fetched set does. Caught by the `evidence` array in the StyleReport schema. No image, no claim.

One subscription, no designer in the loop, a brand ships an Amazon A+ panel set or a Meta dynamic-creative batch on the same Tuesday the brief lands.
