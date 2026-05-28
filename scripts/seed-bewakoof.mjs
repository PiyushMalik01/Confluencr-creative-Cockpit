import { MongoClient } from 'mongodb';
import { uuidv7 } from 'uuidv7';
import fs from 'node:fs';
import path from 'node:path';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'confluencr';
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const PROJECT_ID = uuidv7();
const BRIEF_ID = uuidv7();
const STYLE_ID = uuidv7();
const ANGLE_DOC_ID = uuidv7();
const DECK_ID = uuidv7();

const ANGLE_IDS = [uuidv7(), uuidv7(), uuidv7(), uuidv7(), uuidv7()];
const CONCEPT_IDS = [uuidv7(), uuidv7(), uuidv7()];

const now = new Date();

console.log('[1/7] Project');
await db.collection('projects').insertOne({
  _id: PROJECT_ID,
  createdAt: now,
  lastTouchedAt: now,
  editEpoch: 1,
  step: 6,
  theme: 'dark',
  testBrand: 'bewakoof',
});

console.log('[2/7] Brief');
await db.collection('briefs').insertOne({
  _id: BRIEF_ID,
  projectId: PROJECT_ID,
  product: {
    name: 'Bewakoof Friends Pivot Oversized Tee',
    oneLiner: 'Officially licensed Friends merch, sized for the streetwear drop, priced for college.',
    photos: [{ kind: 'url', url: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=600&h=600&fit=crop&auto=format', fidelityTier: 'medium' }],
    priceTier: 'value',
    category: 'fashion',
  },
  audience: {
    description: 'Tier 1 + Tier 2 Gen Z streetwear shoppers, 18 to 26, who wear what they watched.',
    signalPreset: 'Tier 1 Gen Z streetwear',
    insight: 'They want to wear the show and own the joke, not be marketed at.',
  },
  strategy: {
    smp: 'Wear the show. Own the joke.',
    rtbs: [
      'Officially licensed Friends IP',
      'Oversized 240gsm cotton drop fit',
      'Under Rs 600, ships in 3 days',
    ],
  },
  brand: {
    palette: [
      { hex: '#FFCC00', role: 'primary', ratio: 0.6 },
      { hex: '#0A0A0A', role: 'accent', ratio: 0.3 },
      { hex: '#FFFFFF', role: 'neutral', ratio: 0.1 },
    ],
    typography: 'Bebas Neue (display) + Inter (body)',
    voiceOpposites: [
      { x: 'punny', y: 'slapstick' },
      { x: 'rebellious', y: 'edgy' },
      { x: 'confident', y: 'hypey' },
    ],
  },
  references: {
    competitorMode: 'name',
    inputs: [
      { kind: 'name', value: 'Snitch' },
      { kind: 'name', value: 'The Souled Store' },
      { kind: 'name', value: 'Beyoung' },
      { kind: 'url', value: 'https://thesouledstore.com/product/friends-pivot-oversized-t-shirt' },
    ],
    doNotInclude: [
      'clean studio white-bg',
      'mannequin shot',
      'plastic mockup',
      'corporate stock model',
    ],
    moodImages: [],
  },
  surfaces: {
    aspectRatios: ['1:1', '4:5', '9:16'],
    mandatories: ['Bewakoof logo bottom-right', 'A+ content panel safe zones'],
  },
  updatedAt: now,
});

console.log('[3/7] Style report');
await db.collection('styleReports').insertOne({
  _id: STYLE_ID,
  projectId: PROJECT_ID,
  derivedFrom: {
    editEpochAtGeneration: 1,
    modelUsed: 'gpt-5.4',
    provider: 'chatgpt',
    generatedAt: now,
    manualEdits: [],
  },
  competitorImages: [
    { url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop&auto=format', source: 'snitch.in', pinned: true, classification: 'hero', confidence: 0.86 },
    { url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=600&fit=crop&auto=format', source: 'thesouledstore.com', pinned: true, classification: 'hero', confidence: 0.92 },
    { url: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&h=600&fit=crop&auto=format', source: 'beyoung.in', pinned: true, classification: 'hero', confidence: 0.74 },
    { url: 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=600&h=600&fit=crop&auto=format', source: 'snitch.in', pinned: true, classification: 'hero', confidence: 0.81 },
  ],
  palette: [
    { hex: '#0A0A0A', role: 'background', ratio: 0.45, evidenceImageIdx: 0 },
    { hex: '#F5F5F5', role: 'neutral', ratio: 0.3, evidenceImageIdx: 1 },
    { hex: '#FFCE3A', role: 'accent', ratio: 0.15, evidenceImageIdx: 3 },
    { hex: '#3E5F8A', role: 'accent', ratio: 0.1, evidenceImageIdx: 2 },
  ],
  lighting: 'flat studio softbox, even key + slight rim, low contrast',
  composition: 'centred subject on solid backdrop, top-third reserved for licensed-property logo lockup',
  props: ['solid colour backdrops', 'graphic posters behind model', 'studio C-stand'],
  copyPatterns: ['punny pop-culture quotes', 'all-caps Bebas-style display type', 'small body sub-text bottom-aligned'],
  audienceSignal: 'Tier 1 Gen Z streetwear, IP-fluent',
  negativePatterns: [
    'clinical white-bg catalog cutout',
    'outdoor/lifestyle environmental shoot',
    'celebrity ambassador framing',
  ],
  evidence: [
    { imageIdx: 0, claim: 'flat studio softbox lighting, low contrast' },
    { imageIdx: 1, claim: 'centred subject composition with top-third logo lockup' },
    { imageIdx: 3, claim: 'punny pop-culture quote as headline overlay' },
    { imageIdx: 2, claim: 'solid colour backdrop, no environmental context' },
    { imageIdx: 0, claim: 'graphic poster behind model as set dressing' },
  ],
});

console.log('[4/7] Angle proposal');
await db.collection('angleProposals').insertOne({
  _id: ANGLE_DOC_ID,
  projectId: PROJECT_ID,
  derivedFrom: {
    editEpochAtGeneration: 1,
    modelUsed: 'gpt-5.4',
    provider: 'chatgpt',
    generatedAt: now,
    manualEdits: [],
  },
  angles: [
    {
      id: ANGLE_IDS[0],
      name: 'Aspirational',
      rationale: 'Souled Store owns the clean studio Friends frame. The whitespace is a rebel-youth poster aesthetic — Bewakoof yellow on inky black, hot stickers, the tee styled like a band tee.',
      whitespaceClaim: 'Competitors all use studio softbox catalog framing. Aspirational treats the tee like a poster you would put on a wall.',
      palette: [
        { hex: '#FFCC00', role: 'primary' },
        { hex: '#0A0A0A', role: 'background' },
        { hex: '#FFFFFF', role: 'accent' },
      ],
      typography: { display: 'Bebas Neue', body: 'Inter' },
      sampleHeadline: 'OWN YOUR CRAZY',
      confidence: 0.88,
      custom: false,
    },
    {
      id: ANGLE_IDS[1],
      name: 'Emotional',
      rationale: 'Friends is a comfort-rewatch brand. An emotional concept frames the tee as the artefact you wear when you finally get the joke. Use a warm, in-bedroom moment.',
      whitespaceClaim: 'Competitors stay neutral catalog. Emotional moves to a real-feel in-room moment.',
      palette: [
        { hex: '#F4E1B4', role: 'background' },
        { hex: '#FFCC00', role: 'accent' },
        { hex: '#3D2F1F', role: 'neutral' },
      ],
      typography: { display: 'Bebas Neue', body: 'Inter' },
      sampleHeadline: 'PIVOT. PIVOT! PIVOT!!',
      confidence: 0.82,
      custom: false,
    },
    {
      id: ANGLE_IDS[2],
      name: 'Rational',
      rationale: 'For Amazon A+, the rational concept calls out the proof points: officially licensed, 240gsm cotton, oversized drop fit. Yellow callouts on black.',
      whitespaceClaim: 'Competitors hide spec callouts. Rational stacks them visibly for marketplace conversion.',
      palette: [
        { hex: '#0A0A0A', role: 'background' },
        { hex: '#FFCC00', role: 'primary' },
        { hex: '#FFFFFF', role: 'accent' },
      ],
      typography: { display: 'Inter', body: 'Inter' },
      sampleHeadline: 'OFFICIALLY LICENSED. OVERSIZED.',
      confidence: 0.79,
      custom: false,
    },
    {
      id: ANGLE_IDS[3],
      name: 'Social-Proof',
      rationale: 'Wear-and-tag UGC frame. The tee modelled by a real customer at a college canteen, framed as a screenshot of an Instagram story with a quote tag.',
      whitespaceClaim: 'Competitors use polished studio shots. Social-proof leans into Bewakoof IRL community posts.',
      palette: [
        { hex: '#F5F5F5', role: 'background' },
        { hex: '#FFCC00', role: 'accent' },
        { hex: '#0A0A0A', role: 'neutral' },
      ],
      typography: { display: 'Inter', body: 'Inter' },
      sampleHeadline: 'WORN BY THE PEOPLE WHO GOT IT FIRST',
      confidence: 0.71,
      custom: false,
    },
    {
      id: ANGLE_IDS[4],
      name: 'Scarcity',
      rationale: 'Frame the tee as a numbered drop. Stamp date, drop number, run size on the image. Reads like a sneaker drop, not a t-shirt SKU.',
      whitespaceClaim: 'Competitors never frame teespeed as a drop. Scarcity borrows the streetwear release language.',
      palette: [
        { hex: '#0A0A0A', role: 'background' },
        { hex: '#FFCC00', role: 'primary' },
        { hex: '#7F7F7F', role: 'neutral' },
      ],
      typography: { display: 'Bebas Neue', body: 'JetBrains Mono' },
      sampleHeadline: 'DROP 014  ·  PIVOT',
      confidence: 0.68,
      custom: false,
    },
  ],
  pickedAngleIds: [ANGLE_IDS[0], ANGLE_IDS[1], ANGLE_IDS[2]],
  pickedOrder: [1, 2, 3],
});

console.log('[5/7] Concept briefs (3)');

// Helpers omitted; we write every concept prompt verbatim using
// the craft-depth research insights (Photometric, Optical, Spatial,
// Material, Brand-voice, Channel, Negatives-per-surface blocks).

const concepts = [
  {
    _id: CONCEPT_IDS[0],
    angleId: ANGLE_IDS[0],
    position: 1,
    themeStatement: 'A Friends tee shot like a band poster, not a catalog.',
    strategicRationale:
      'Souled Store and Snitch both lean catalog-soft. Bewakoof has white-space in poster culture: rebel youth, sticker layout, hot yellow on inky black. This concept treats the tee like a wall artefact you would tear off a Bombay Local pillar, then hangs the licensed Friends IP from it without apologising.',
    colorStory: [
      { hex: '#FFCC00', role: 'primary', ratio: 0.55 },
      { hex: '#0A0A0A', role: 'background', ratio: 0.35 },
      { hex: '#FFFFFF', role: 'accent', ratio: 0.10 },
    ],
    typography: {
      display: 'Druk Wide Bold (heavy condensed sans)',
      body: 'Inter',
      samples: { headline: 'OWN YOUR CRAZY', body: 'Friends Pivot Tee · Drop 014' },
    },
    shotRecipe: {
      shotType: 'hero',
      lighting: 'direct on-camera flash key + magenta-gelled rim camera-right, hard shadows, gig-poster grammar',
      composition: 'tee centred at 70% frame height, top-third reserved for headline, paste-up sticker artefacts in lower-third, 4% logo inset bottom-right',
      lens: 'full-frame 35mm f/2.8, focus on chest print, mild chromatic aberration on highlight edges',
      setting: 'inky black matte poster backdrop with torn-flyer paste-up scraps and tape residue at the base',
      props: ['paste-up sticker scraps', 'torn band-flyer edges', 'magenta gel artefact'],
    },
    craft: {
      lensSpec: {
        sensor: 'full-frame mirrorless (Sony A7R V)',
        focalLength: '35mm prime, slight wide for poster framing',
        aperture: 'f/2.8 — shallow but tee plane stays sharp',
        shutter: '1/200s flash sync',
        iso: 'ISO 100 base + ISO-800 grain emulation in post',
        depthOfField: 'shallow at f/2.8, focus locked on chest print, paste-up scraps melt by 80cm behind',
      },
      lighting: {
        key: {
          modifier: 'direct on-camera bare strobe (Petra-Collins flash grammar)',
          angleDeg: 'on-axis with camera, ~0° azimuth, 0° elevation',
          temperatureK: 5500,
          intensityStops: '+2.7 over ambient',
        },
        fill: { modifier: 'no fill — hard shadows under jaw and sticker edges', ratio: '1:8 effective from ambient only' },
        rim: {
          modifier: 'gridded stripbox with magenta gel (#E94E77 effective)',
          angleDeg: 'camera-right 60° azimuth, 45° elevation',
          temperatureK: 4300,
        },
        ambient: 'minimal, near-zero, lets the strobe dominate',
        shadowDensity: 0.62,
        notes: 'gig-poster contrast: blown highlight on tee shoulder, black-crushed paste-up wall, magenta rim halo around silhouette',
      },
      material: {
        subjectMaterial: '220 GSM cotton tee, oversized boxy fit, visible weft cadence ~0.45mm, slight nap from washed-down dye',
        subsurfaceCue: 'subtle subsurface scatter ~1.1mm at fabric folds, mustard pigment reads warm in shadow',
        specularIntensity: 'low specular, matte cotton — but flash highlight on left shoulder is crisp and unblown',
        microfacetRoughness: 'fabric ~0.65 roughness; printed Friends-Pivot ink slightly raised, microbevel highlight at print edges',
        brdfNotes: 'paste-up paper underneath: matte, light fibre tooth, glue residue catches the rim light',
        postSheen: 'no plastic sheen; if anything, a touch matte-er than reality to read editorial',
      },
      post: {
        grainISO: 'ISO-800 equivalent grain layered in shadows only, kept off the tee flat',
        gradeShadows: 'shadows pushed cool teal-warm hybrid (#1A1410 → #1F2A3A) to bite the magenta',
        gradeHighlights: 'highlights warm cream (#FFF6E2) holding tee mustard saturated',
        contrastCurve: 'S-curve with crushed blacks (lifted 4 IRE for editorial feel), highlights protected from clip',
        vignette: '11% radial darken at corners',
        lutStyle: 'Portra 400 emulation crossed with a magenta split-tone in shadows',
      },
      references: {
        photographers: ['Petra Collins flash grammar', 'Wolfgang Tillmans casual-flash', 'Renell Medrano editorial portraiture'],
        publications: ['i-D magazine', 'PAPER magazine', 'Dazed lookbook spreads'],
        brandCampaigns: ['Aimé Leon Dore lookbooks (composition logic, not palette)', 'Pleasures.com gig-poster drops'],
        cinematicTouchstones: ['Indian indie band poster art from Bombay 90s + Hinglish meme fluency'],
        notes: 'Cite the technique (on-camera flash + magenta gel rim) not the photographer name alone — models over-average toward kitsch on raw name-drops.',
      },
      audiencePixels: {
        propLanguage: 'paste-up posters + tape residue = Tier-1 Gen Z dorm/metro fluency without dating the image',
        framingLanguage: 'on-axis hero with 8% headroom = main-character energy, not catalog passivity',
        gradeLanguage: 'magenta rim + ISO-800 grain = Y2K revival without the cringe',
        grainLanguage: 'visible grain in shadows only signals analog confidence; if grain hits the tee it reads cheap',
      },
      thinking:
        'The whole stack is borrowed from Petra-Collins-grammar flash photography, then locked to the Bewakoof palette (#FFCC00 + #0A0A0A) and propped with paste-up sticker scraps so the image reads as a torn-off Bombay Local poster rather than a catalog packshot. The 35mm + on-camera flash combination is what gives a streetwear image its main-character energy. Souled Store and Snitch both shoot 85mm f/2 continuous studio — explicitly avoiding their grammar is the whitespace play. Magenta gel rim is the single Y2K-revival cue without dating the image, and the ISO-800 grain confined to shadows keeps the tee colour true while still reading analog. Headline goes top-third in Druk Wide Bold (not Bebas — Druk has more contemporary heft for streetwear in 2026).',
    },
    copy: {
      headline: 'OWN YOUR CRAZY',
      subhead: 'Friends Pivot · Oversized · Drop 014',
      cta: 'GRAB THE DROP',
    },
    mandatories: [
      { item: 'Bewakoof logo bottom-right', satisfied: true },
      { item: 'A+ content panel safe zones', satisfied: true },
    ],
    prompts: {
      midjourney:
        'Hero product photo: yellow Bewakoof Friends Pivot oversized cotton t-shirt centred on inky black matte poster backdrop with torn paste-up sticker scraps and tape residue in lower-third. Direct on-camera bare-strobe key 5500K at 0° axis hard shadows. Magenta-gelled gridded stripbox rim camera-right at 60° azimuth, 45° elevation, 4300K reading as ~#E94E77 halo around silhouette. No fill, shadow density 0.62. 35mm full-frame f/2.8, focus on Pivot chest print, mild chromatic aberration on highlight edges, slight ISO-800 grain in shadows only. Cotton fabric 220 GSM visible weft cadence 0.45mm, low specular matte with crisp unblown highlight on left shoulder. Headline "OWN YOUR CRAZY" in Druk Wide Bold at top-third, white #FFFFFF, tracking -20. Bewakoof logo bottom-right at 4% inset, white on black pill. Colour locked #FFCC00 55 / #0A0A0A 35 / #FFFFFF 10. Portra-400 curve with magenta split-tone shadows, 11% radial vignette. Petra-Collins-grammar flash photography. 1:1 Amazon hero crop. --ar 1:1 --raw --stylize 180 --weird 20 --no clean studio white-bg, mannequin, plastic mockup, corporate stock model, glossy plastic sheen, warped chest-print typography',
      flux:
        'Render a 1:1 Amazon hero photograph. Subject: Bewakoof Friends Pivot oversized cotton t-shirt (mustard #FFCC00 body, black "PIVOT!" chest print in heavy condensed sans), 220 GSM weight with visible weft cadence 0.45mm. Setting: inky black #0A0A0A matte poster backdrop with torn paste-up sticker scraps, tape residue, and a hint of band-flyer paper tooth in the lower-third. Photometric: key = direct on-camera bare strobe at 5500K, on-axis, +2.7 stops over ambient, hard shadow density 0.62; rim = gridded stripbox with magenta gel at 4300K, camera-right 60° azimuth and 45° elevation, reading #E94E77 halo; no fill; ambient near-zero. Optical: full-frame 35mm f/2.8, focus on chest print, DOF band ~180mm, mild chromatic aberration on highlight edges. Spatial: tee occupies 70% of frame height, headroom 8%, top 22% reserved for headline-safe zone, bottom 14% reserved for logo lockup. Material: cotton roughness 0.65, low specular matte except for one crisp unblown highlight on left shoulder; print ink slightly raised microbevel; paste-up paper underneath matte with light fibre tooth catching the magenta rim. Post: ISO-800 grain in shadows only, Portra-400 curve with magenta split-tone shadows, highlights warm cream #FFF6E2, 11% radial vignette. On-image text: render exactly "OWN YOUR CRAZY" in Druk Wide Bold equivalent at top-third, white #FFFFFF, tracking -20, 92pt-equivalent. Place Bewakoof logo bottom-right at 4% inset on a black pill. Negatives per surface: no specular blowout on tee shoulder, no plastic sheen on cotton, no warped chest-print typography, no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model.',
      nanoBanana:
        'Photograph the Bewakoof Friends Pivot oversized tee like a torn-off Bombay-Local gig poster, not a catalog packshot. Use direct on-camera bare-strobe lighting at 5500K (Petra-Collins flash grammar) and a magenta-gelled rim from camera-right at 60° azimuth and 45° elevation, 4300K reading as a #E94E77 halo around the silhouette. No fill. The tee is 220 GSM cotton with visible weft cadence, soft subsurface scatter at folds, low specular but a crisp unblown highlight on the left shoulder. Inky black #0A0A0A matte poster backdrop with torn paste-up sticker scraps and tape residue in the lower-third. 35mm f/2.8 on full-frame, focus on the chest print, mild chromatic aberration on highlight edges, ISO-800 grain layered into shadows only. Tee occupies 70% of frame height, headroom 8%. Reserve top 22% of the frame for a headline. Render the headline exactly: "OWN YOUR CRAZY" in Druk Wide Bold equivalent, tracking -20, white #FFFFFF, 92pt equivalent. Render the Bewakoof wordmark bottom-right at 4% inset on a small black pill. Final palette: #FFCC00 (55%), #0A0A0A (35%), #FFFFFF (10%). Apply a Portra-400 curve with magenta split-tone in shadows, 11% radial vignette. Aspect 1:1 for Amazon hero. Avoid clean studio white backgrounds, mannequin shots, plastic mockups, corporate stock models, warped chest-print typography, and any plastic glossy sheen on cotton.',
      gptImage:
        'Take this Bewakoof Friends "Pivot!" oversized cotton tee (mustard #FFCC00 body, black "PIVOT!" chest print) and photograph it as if it were the kind of poster you would tear off a wall in Bandra at 2am — not as a catalog packshot. Key the image with a direct on-camera bare strobe at 5500K so the highlights are crisp and the shadows are hard, then add a magenta-gelled stripbox rim from camera-right at 60° azimuth and 45° elevation to lay a #E94E77 halo around the silhouette. No fill. Shoot on a full-frame 35mm at f/2.8, focusing on the chest print, with a touch of chromatic aberration on highlight edges. Use an inky black matte poster backdrop, layer in torn paste-up sticker scraps and tape residue across the lower third, and reserve the top 22% of the frame for the headline. Render the headline exactly: "OWN YOUR CRAZY" in a heavy condensed sans like Druk Wide Bold, white, tracking -20, large. Place the Bewakoof wordmark at 4% inset bottom-right on a small black pill. Apply a Portra-400 curve with a magenta split-tone in the shadows and ISO-800 grain confined to shadow zones only. 1:1 Amazon hero crop. Do not produce a clean studio white-bg, a mannequin, a plastic mockup, a stock model, warped chest-print typography, or any plastic-glossy sheen on the cotton.',
      ideogram:
        'Poster-style 1:1 hero shot. Subject: Bewakoof Friends Pivot oversized cotton tee, mustard #FFCC00 body, black "PIVOT!" chest print in heavy condensed sans, centred at 70% frame height. Setting: inky black #0A0A0A matte poster backdrop with torn paste-up sticker scraps + tape residue in lower-third. Photometric: direct on-camera bare-strobe key 5500K on-axis +2.7 stops, gridded magenta-gelled stripbox rim camera-right 60° azimuth 45° elevation 4300K reading #E94E77, no fill, shadow density 0.62. Optical: 35mm full-frame f/2.8, focus chest print, mild CA on highlight edges. Spatial: 70% tee height, 8% headroom, top 22% reserved for headline. Material: 220 GSM cotton, weft cadence 0.45mm, low specular matte, crisp unblown highlight left shoulder, print ink slight microbevel. Post: ISO-800 grain shadows only, Portra-400 curve, magenta split-tone shadows, highlights #FFF6E2, 11% vignette. ON-IMAGE TEXT (render exactly, no paraphrase): top-third headline "OWN YOUR CRAZY" in Druk Wide Bold equivalent, weight 900, tracking -20, leading 0.95, colour #FFFFFF, ~92pt equivalent. Bottom-right at 4% inset: Bewakoof wordmark, white, on a small #0A0A0A pill with 6px radius. Final palette locked: #FFCC00 55 / #0A0A0A 35 / #FFFFFF 10. Negatives per surface: no specular blowout on tee shoulder, no plastic sheen on cotton, no warped or misspelt chest print, no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model.',
    },
    negativePrompt:
      'clean studio white-bg, mannequin shot, plastic mockup, corporate stock model, plastic-glossy sheen on cotton, warped or misspelt chest-print typography, environmental outdoor lifestyle, soft pastel palette, specular blowout on tee shoulder, blurry chest print, extra fingers, AI-glossy background bokeh',
    qualityGate: { passed: true, issues: [] },
  },
  {
    _id: CONCEPT_IDS[1],
    angleId: ANGLE_IDS[1],
    position: 2,
    themeStatement: 'The tee in its natural habitat: a Sunday-afternoon rewatch.',
    strategicRationale:
      'Friends is comfort merchandise. An emotional concept frames the tee as the artefact you reach for when you finally get the joke. Warm beige room, late-afternoon window light, the tee draped on a chair next to a half-drunk coffee. Reads like a rewatch ritual, not a catalog page.',
    colorStory: [
      { hex: '#F4E1B4', role: 'background', ratio: 0.55 },
      { hex: '#FFCC00', role: 'accent', ratio: 0.25 },
      { hex: '#3D2F1F', role: 'neutral', ratio: 0.20 },
    ],
    typography: {
      display: 'GT Sectra (editorial serif)',
      body: 'Inter',
      samples: { headline: 'PIVOT. PIVOT! PIVOT!!', body: 'For the rewatch, the in-jokes, and the Sunday couches.' },
    },
    shotRecipe: {
      shotType: 'lifestyle',
      lighting: 'Kinfolk north-window light with a soft TV-glow rim from off-frame right',
      composition: 'tee draped on a wooden chair frame in left-third, coffee mug + remote in foreground, headline-safe upper 22%',
      lens: 'full-frame 35mm at f/2, shallow DOF on the foreground objects so the tee plane stays sharp',
      setting: 'beige plaster wall corner of a Bombay rental, late golden-hour, soft TV-glow rim',
      props: ['rattan side table', 'half-drunk filter coffee mug', 'TV remote with worn rubber', 'soft khadi throw on chair'],
    },
    craft: {
      lensSpec: {
        sensor: 'full-frame mirrorless (Leica SL3 or Sony A7R V)',
        focalLength: '35mm f/1.4 stopped to f/2',
        aperture: 'f/2 — keeps tee plane sharp, melts foreground props at 25cm',
        shutter: '1/125s available-light',
        iso: 'ISO 400 native, no push',
        depthOfField: 'shallow at f/2, focus on tee chest, mug + remote in foreground melt softly',
      },
      lighting: {
        key: {
          modifier: 'Kinfolk-style north-window light, 4ft diffused softbox-equivalent off-frame left',
          angleDeg: 'camera-left 60° azimuth, 35° elevation (mid-afternoon window rake)',
          temperatureK: 4700,
          intensityStops: '+1.5 over ambient',
        },
        fill: { modifier: 'natural bounce from the beige plaster wall opposite', ratio: '1:3 key-to-fill — soft modeling, not flat' },
        rim: {
          modifier: 'cooler soft TV-glow rim from a screen off-frame right',
          angleDeg: 'rear-right 110° azimuth, 25° elevation',
          temperatureK: 3200,
        },
        ambient: 'warm tungsten table lamp 2700K in the deep background, blurred, kept under 1:8',
        shadowDensity: 0.35,
        notes: 'long soft shadows raking left-to-right at 25° — Kinfolk-grade tonal roll-off, no contrast crushing',
      },
      material: {
        subjectMaterial: '220 GSM cotton tee draped (not folded) over a teak chair back, gravity creates 3-4 soft folds',
        subsurfaceCue: 'subsurface scatter in mustard fabric where window light wraps the shoulder, glowing edge',
        specularIntensity: 'low — matte cotton + soft window light = creamy roll-off, zero hot spots',
        microfacetRoughness: 'cotton 0.70 roughness, teak chair 0.55, ceramic mug 0.25 with sharp glaze specular, rattan side table 0.80 woven anisotropy',
        brdfNotes: 'rattan weave catches the rim with anisotropic streaking along the cane axis',
        postSheen: 'no sheen anywhere — must read editorial, not commercial',
      },
      post: {
        grainISO: 'ISO-400 organic grain across the whole frame, very subtle',
        gradeShadows: 'warm shadows pushed to #3a2418 (Kodak Portra 400 emulation)',
        gradeHighlights: 'creamy highlights #FFF6E2, slight halation around the window',
        contrastCurve: 'lifted blacks (+5 IRE), soft shoulder on highlights, no clipping anywhere',
        vignette: '6% gentle radial darken',
        lutStyle: 'Kodak Portra 400 emulation, low saturation, warm shadow / neutral highlight split-tone',
      },
      references: {
        photographers: ['Kinfolk magazine in-situ commerce', 'Eric Kvatek (Visvim lookbooks)', 'Romain Laprade morning-light interiors'],
        publications: ['Kinfolk', 'Apartamento', 'Cereal magazine'],
        brandCampaigns: ['Aimé Leon Dore "rewatch" lookbooks', 'Patagonia Worn Wear in-situ'],
        cinematicTouchstones: ['the opening minutes of any Wes Anderson interior at golden hour'],
        notes: 'Cite the technique (Kinfolk window light + Portra-400 grade + in-situ prop logic). Do not cite "warm cozy lifestyle" — the model averages to Pottery Barn.',
      },
      audiencePixels: {
        propLanguage: 'filter coffee + worn-rubber remote = millennial-cozy Tuesday-night fluency, not a model-staged set',
        framingLanguage: 'foreground props in soft focus + tee in mid-plane = invites the viewer to step into the room',
        gradeLanguage: 'warm Portra shadows + cool TV-glow rim = comfort + nostalgia in the same frame',
        grainLanguage: 'fine all-over grain reads as 35mm film, not digital noise',
      },
      thinking:
        'Friends is comfort merchandise — the worst thing you can do is photograph the tee in a studio. Kinfolk window light is the editorial grammar for in-situ commerce in 2026 (Aimé Leon Dore use the same recipe across their drops). The foreground melt + sharp tee plane is what stops the viewer from scrolling: it forces the eye to the chest print without staging a model. Headline shifts from Druk Wide (used in Concept 1) to GT Sectra because the emotional angle needs an editorial serif — heavy condensed sans on this lighting recipe would feel like a contradiction. Cool TV-glow rim is the single brand-anchored cue that ties it back to Friends-rewatch without putting a TV in the frame.',
    },
    copy: {
      headline: 'PIVOT. PIVOT! PIVOT!!',
      subhead: 'For the rewatch, the in-jokes, and the Sunday couches.',
      cta: 'WEAR THE REWATCH',
    },
    mandatories: [
      { item: 'Bewakoof logo bottom-right', satisfied: true },
      { item: 'A+ content panel safe zones', satisfied: true },
    ],
    prompts: {
      midjourney:
        'Lifestyle in-situ photograph: yellow Bewakoof Friends Pivot oversized cotton tee draped over the back of a teak chair, in a Bombay-rental beige plaster-wall living room corner. Foreground: rattan side table with a half-drunk filter coffee mug (ceramic, glazed) and a TV remote with worn rubber, both melting in shallow focus. Photometric: Kinfolk-style north-window light camera-left 60° azimuth, 35° elevation, 4700K, +1.5 stops over ambient; natural bounce fill from beige wall at 1:3 ratio; cool soft TV-glow rim 3200K from rear-right 110°/25°; warm tungsten table lamp 2700K in deep blurred background at 1:8. Shadow density 0.35, long soft shadows raking 25°. Optical: full-frame 35mm at f/2, focus locked on chest print, foreground props melt at 25cm, mild grain. Material: 220 GSM cotton roughness 0.70 with subsurface glow on the shoulder where window light wraps, teak chair 0.55 roughness, ceramic mug 0.25 with sharp glaze specular, rattan weave anisotropic streak under rim light. Post: Kodak Portra 400 emulation, warm shadows #3a2418, creamy highlights #FFF6E2, lifted blacks +5 IRE, halation around the window, 6% vignette. Headline reserved upper 22%: "PIVOT. PIVOT! PIVOT!!" in GT Sectra editorial serif, weight 600, white #FFFFFF, tracking -10. Bewakoof logo bottom-right 4% inset on a beige #F4E1B4 pill. Palette locked #F4E1B4 55 / #FFCC00 25 / #3D2F1F 20. 4:5 Meta feed crop. --ar 4:5 --raw --stylize 220 --no clean studio white-bg, mannequin, plastic mockup, corporate stock model, harsh studio lighting, cold colour temperature, busy clutter, AI-glossy plastic sheen',
      flux:
        'Render a 4:5 Meta-feed in-situ lifestyle photograph. Subject: Bewakoof Friends Pivot oversized cotton tee in mustard #FFCC00, 220 GSM, draped over a teak chair back with 3-4 natural gravity folds — tee occupies left-third, mid-plane. Setting: beige plaster wall Bombay-rental living-room corner; foreground rattan side table with a half-drunk filter coffee mug (ceramic, glazed) and a worn-rubber TV remote, both in soft focus. Photometric: key = Kinfolk-style north-window light at 4700K, camera-left 60° azimuth, 35° elevation, +1.5 stops over ambient, 4ft diffused softbox-equivalent; fill = natural bounce from beige plaster wall opposite at 1:3 key-to-fill; rim = cool soft TV-glow at 3200K from rear-right 110° azimuth, 25° elevation; ambient = warm tungsten lamp 2700K in deep blurred background at 1:8. Shadow density 0.35; long soft shadows raking 25°. Optical: full-frame 35mm at f/2, focus locked on chest print, foreground props melt at 25cm, mild ISO-400 grain across the frame. Spatial: tee in left-third at 60% frame height, foreground props bottom-right, top 22% reserved for headline-safe zone, bottom 14% reserved for logo lockup. Material: cotton roughness 0.70 with subsurface scatter glow on shoulder where window wraps, teak chair 0.55 roughness, ceramic mug 0.25 roughness with sharp glaze specular highlight, rattan weave anisotropic streak catching rim light along the cane axis. Post: Kodak Portra 400 emulation, warm shadows #3a2418, creamy highlights #FFF6E2, lifted blacks +5 IRE, soft halation around the window, 6% radial vignette. On-image text: render exactly "PIVOT. PIVOT! PIVOT!!" in GT Sectra editorial serif at 92pt equivalent, weight 600, white #FFFFFF, tracking -10, top-third. Bewakoof logo bottom-right at 4% inset on a beige #F4E1B4 pill. Final palette locked: #F4E1B4 55 / #FFCC00 25 / #3D2F1F 20. Negatives per surface: no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model, no harsh studio lighting, no cold colour temperature, no busy clutter, no AI-glossy plastic sheen on cotton, no hot specular on tee shoulder.',
      nanoBanana:
        'Photograph the Bewakoof Friends Pivot oversized tee in-situ — draped over the back of a teak chair in a Bombay-rental beige-walled living room corner at late golden hour. The tee is mustard #FFCC00, 220 GSM cotton, with natural gravity folds. In the foreground (soft focus): a rattan side table with a half-drunk filter coffee mug and a worn-rubber TV remote. Light it like a Kinfolk magazine in-situ spread: a north-window key from camera-left at 4700K, +1.5 stops, with natural bounce fill from the beige plaster wall at 1:3 key-to-fill, and a cool soft TV-glow rim from off-frame right at 3200K. A warm tungsten table lamp 2700K sits in the deep blurred background. Shadow density 0.35, long soft shadows raking 25°. Shoot on full-frame 35mm at f/2 — focus on the chest print, props melt at 25cm. Render the cotton with subsurface scatter glow on the shoulder where the window wraps, the rattan weave with anisotropic streaks under the rim light, the ceramic mug with a sharp glaze specular. Apply a Kodak Portra 400 emulation in post: warm shadows #3a2418, creamy highlights #FFF6E2, lifted blacks, soft halation around the window, 6% vignette, fine ISO-400 grain across the whole frame. Reserve the top 22% of the frame for the headline. Render the headline exactly: "PIVOT. PIVOT! PIVOT!!" in GT Sectra editorial serif at 92pt equivalent, weight 600, white #FFFFFF, tracking -10. Render the Bewakoof wordmark bottom-right at 4% inset on a small beige #F4E1B4 pill. Final palette: #F4E1B4 (55%), #FFCC00 (25%), #3D2F1F (20%). Aspect 4:5 for Meta feed. Avoid clean studio white-bg, mannequin shots, plastic mockups, corporate stock models, harsh studio lighting, cold colour temperature, busy clutter, AI-glossy plastic sheen on cotton, hot specular on the tee shoulder.',
      gptImage:
        'Photograph the Bewakoof Friends Pivot oversized tee like a Kinfolk in-situ magazine spread — not a catalog. The tee is draped (not folded) over the back of a teak chair in a Bombay-rental living room corner with beige plaster walls. In the foreground, soft-focus: a rattan side table holding a half-drunk filter-coffee mug and a TV remote with worn rubber. Light it with a north-window key from camera-left at about 4700K (+1.5 stops), let the beige wall opposite bounce a soft 1:3 fill, and add a cool TV-glow rim from off-frame right at about 3200K. A warm tungsten lamp glows in the deep, blurred background. Shoot full-frame 35mm at f/2: focus on the chest print, let the foreground props melt at 25cm, keep the shadows long and soft (raking ~25°). Cotton fabric should read 220 GSM with a subsurface glow at the shoulder where the window wraps, the rattan weave anisotropic under the rim, and the ceramic mug sharp-specular at the glaze. Grade it Kodak Portra 400: warm shadows #3a2418, creamy highlights #FFF6E2, lifted blacks, gentle halation around the window, fine ISO-400 grain, 6% vignette. Reserve the top 22% of the frame for a headline. Render the headline exactly: "PIVOT. PIVOT! PIVOT!!" in an editorial serif like GT Sectra at large size, white. Place the Bewakoof wordmark bottom-right at 4% inset on a small beige pill. Lock the palette to #F4E1B4 / #FFCC00 / #3D2F1F at 55/25/20. 4:5 Meta-feed aspect. No studio whites, no mannequins, no plastic mockups, no corporate stock models, no harsh studio lighting, no cold colour temperature, no busy clutter, no glossy plastic sheen on the cotton.',
      ideogram:
        'In-situ lifestyle 4:5. Subject: yellow Bewakoof Friends Pivot oversized tee draped on a teak chair, left-third, mid-plane. Setting: beige plaster wall Bombay rental, rattan side table foreground with filter-coffee mug + worn-rubber remote in soft focus. Photometric: key = north-window 4700K camera-left 60° azimuth 35° elevation +1.5 stops; fill = beige-wall bounce 1:3; rim = cool TV-glow 3200K rear-right 110°/25°; ambient = tungsten lamp 2700K background 1:8. Shadow density 0.35, long soft shadows. Optical: 35mm f/2 full-frame, focus chest print, foreground melts 25cm. Spatial: tee left-third 60% height, top 22% headline-safe, bottom 14% logo-safe. Material: cotton 0.70 roughness with subsurface shoulder glow, teak 0.55, ceramic mug 0.25 sharp glaze specular, rattan anisotropic. Post: Kodak Portra 400 emulation, warm shadows #3a2418, creamy highlights #FFF6E2, lifted blacks +5 IRE, halation, 6% vignette, fine ISO-400 grain. ON-IMAGE TEXT (render exactly): top-third headline "PIVOT. PIVOT! PIVOT!!" in GT Sectra editorial serif, weight 600, tracking -10, ~92pt equivalent, colour #FFFFFF. Bottom-right at 4% inset: Bewakoof wordmark in #3D2F1F on a small #F4E1B4 pill. Palette locked: #F4E1B4 55 / #FFCC00 25 / #3D2F1F 20. Negatives per surface: no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model, no harsh studio lighting, no cold CT, no busy clutter, no AI-glossy plastic sheen, no warped or misspelt headline serif, no hot specular blowout on tee shoulder.',
    },
    negativePrompt:
      'clean studio white-bg, mannequin shot, plastic mockup, corporate stock model, harsh studio lighting, cold colour temperature, busy clutter, AI-glossy plastic sheen, hot specular blowout on tee shoulder, warped or misspelt editorial serif headline, extra fingers',
    qualityGate: { passed: true, issues: [] },
  },
  {
    _id: CONCEPT_IDS[2],
    angleId: ANGLE_IDS[2],
    position: 3,
    themeStatement: 'The Amazon A+ panel that converts the licence-aware buyer.',
    strategicRationale:
      'Marketplace buyers do not get rewatch jokes — they get spec tags. This concept stacks the proof points: officially licensed Friends IP, 240gsm cotton, oversized drop fit, machine wash safe. Yellow callouts on black, every claim with an icon. Built for Amazon A+ panel placement.',
    colorStory: [
      { hex: '#0A0A0A', role: 'background', ratio: 0.60 },
      { hex: '#FFCC00', role: 'primary', ratio: 0.30 },
      { hex: '#FFFFFF', role: 'accent', ratio: 0.10 },
    ],
    typography: {
      display: 'Inter Display (variable, weight 800)',
      body: 'Inter (weight 500 for callouts)',
      samples: { headline: 'OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600.', body: '240gsm cotton · Drop fit · Machine wash safe' },
    },
    shotRecipe: {
      shotType: 'infographic',
      lighting: 'medium-format clamshell + symmetric kicker — spec-shoot grammar, no shadow drama',
      composition: 'tee centred at 55% frame height, four icon-callout chips at the four corners, headline-safe upper 22%, CTA-safe lower 14%, Amazon main image rule ≥85% subject area effective',
      lens: 'medium-format 100mm macro at f/8, hyperfocal, every weft thread sharp',
      setting: 'seamless pure #0A0A0A backdrop, no texture, sweep to floor with zero seam visible — Amazon A+ marketplace-safe',
      props: ['licence badge icon-callout chip top-left', '240gsm cotton callout top-right', 'oversized drop-fit callout bottom-left', 'machine-wash-safe callout bottom-right'],
    },
    craft: {
      lensSpec: {
        sensor: 'medium format (Phase One IQ4 150MP or Hasselblad H6D-100c) — Amazon-grade tonal roll-off',
        focalLength: '100mm macro',
        aperture: 'f/8 — hyperfocal, every weft thread sharp',
        shutter: '1/200s strobe sync',
        iso: 'ISO 64 absolute clean',
        depthOfField: 'deep — entire tee plane and callouts in critical focus',
      },
      lighting: {
        key: {
          modifier: 'Hasselblad H6D studio key: 22-inch beauty dish with diffusion sock',
          angleDeg: 'camera-left 30° azimuth, 60° elevation',
          temperatureK: 5500,
          intensityStops: '+0 reference',
        },
        fill: { modifier: 'silver v-flat fill camera-right, calibrated', ratio: '1:1.5 key-to-fill — clamshell-tight, kills shadow drama' },
        rim: {
          modifier: 'symmetric stripbox kickers rear-left + rear-right, gridded',
          angleDeg: 'rear 135° azimuth both sides, 50° elevation, balanced',
          temperatureK: 5500,
        },
        ambient: 'zero — black flagged to prevent any spill on backdrop',
        shadowDensity: 0.15,
        notes: 'spec-shoot lighting: even reveal, no shadow drama, sweep stays absolute #0A0A0A',
      },
      material: {
        subjectMaterial: '240 GSM cotton oversized tee, pressed flat with steamer, no creases, weft visible at f/8',
        subsurfaceCue: 'minimal subsurface — tee reads as a clean spec object, not a styled garment',
        specularIntensity: 'low diffuse, no hot spots, beauty-dish key wraps softly without blowing the mustard',
        microfacetRoughness: 'cotton 0.65 roughness; icon-callout chips: vinyl-printed look 0.40 with crisp edges',
        brdfNotes: 'pure-black backdrop is true matte velvet — absorbs spill, reads #0A0A0A absolute',
        postSheen: 'zero sheen; this is a marketplace spec image, not editorial',
      },
      post: {
        grainISO: 'no grain — marketplace asset must be clean',
        gradeShadows: 'absolute neutral, no warm or cool drift',
        gradeHighlights: 'absolute neutral, highlights protected at -2 IRE from clip',
        contrastCurve: 'linear baseline + slight S-curve, blacks at 0 IRE for Amazon DPI compliance',
        vignette: 'none',
        lutStyle: 'neutral commercial — no LUT character, sRGB Amazon-compliant',
      },
      references: {
        photographers: ['Hasselblad commercial product photography', 'Jens Mortensen still-life precision'],
        publications: ['Wallpaper* product reviews', 'Monocle Shop pages'],
        brandCampaigns: ['Aer Travel Pack spec shoots', 'Uniqlo Amazon A+ panels'],
        cinematicTouchstones: [],
        notes: 'Cite the technique (medium-format clamshell with symmetric kickers on velvet backdrop). The genre is spec-grade Amazon A+, not editorial.',
      },
      audiencePixels: {
        propLanguage: 'icon-callout chips with utility iconography (licence, weight, fit, wash) — marketplace fluent',
        framingLanguage: 'centred, deep DOF, even keys = trust + spec-honest signal for high-intent buyers',
        gradeLanguage: 'neutral, no character grade — marketplace assets that grade hard read suspicious',
        grainLanguage: 'no grain — clean and Amazon DPI compliant',
      },
      thinking:
        'Marketplace buyers are at the bottom of the funnel — they have already decided they want a Friends tee, the question is whether they trust this one. Trust comes from spec-honesty, not aesthetic. Medium-format clamshell + symmetric kickers is the language Hasselblad-tier commercial product photography uses for precisely this reason: no character grade, no editorial bias, just absolute fidelity. The four icon-callout chips at the corners are the actual conversion mechanism — they answer "is this licensed?", "what GSM?", "what fit?", "machine wash?" without making the buyer scroll. The chips are vinyl-printed in feel (0.40 roughness) so they read as overlay graphics, not photographed objects. Headline goes upper-22% in Inter Display variable 800, not display serif — marketplace context demands legibility at thumbnail size, not editorial flair.',
    },
    copy: {
      headline: 'OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600.',
      subhead: '240gsm cotton · Drop fit · Machine wash safe',
      cta: 'ADD TO CART',
    },
    mandatories: [
      { item: 'Bewakoof logo bottom-right', satisfied: true },
      { item: 'A+ content panel safe zones', satisfied: true },
    ],
    prompts: {
      midjourney:
        'Amazon A+ infographic, marketplace spec shoot: yellow Bewakoof Friends Pivot oversized cotton tee, 240 GSM, pressed flat without creases, centred at 55% frame height on absolute pure #0A0A0A matte-velvet seamless backdrop. Photometric: medium-format clamshell — 22-inch beauty dish with diffusion sock camera-left 30°/60° at 5500K, silver v-flat fill camera-right at 1:1.5 ratio, symmetric gridded stripbox kickers rear-left + rear-right at 135° azimuth and 50° elevation, ambient zero, shadow density 0.15. Optical: medium format Phase One IQ4 100mm macro at f/8 hyperfocal, ISO 64, 1/200s strobe sync — every weft thread sharp. Material: cotton 0.65 roughness with subtle subsurface, low diffuse spec no hot spots; icon-callout chips read as 0.40-roughness vinyl-printed overlays. Spatial: top 22% reserved for headline, bottom 14% for logo lockup, four icon-callout chips placed at the four corners — top-left: licence badge ("OFFICIALLY LICENSED"), top-right: fabric weight ("240 GSM COTTON"), bottom-left: fit ("OVERSIZED DROP FIT"), bottom-right: care ("MACHINE WASH SAFE"). Each chip: #FFCC00 fill with #0A0A0A icon glyph + Inter 500 caption, rounded 8px corners. Post: neutral commercial — no LUT character, no grain, no vignette, sRGB Amazon-compliant. On-image text: headline top-third "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." in Inter Display variable weight 800, white #FFFFFF, tracking -15, ~84pt equivalent. Bewakoof wordmark bottom-right 4% inset on a small #FFCC00 pill. Final palette locked: #0A0A0A 60 / #FFCC00 30 / #FFFFFF 10. 1:1 Amazon hero. --ar 1:1 --raw --stylize 80 --no clean studio white-bg, mannequin, plastic mockup, corporate stock model, lifestyle environment, soft pastel palette, busy background pattern, AI-glossy plastic sheen, warped or misspelt callout typography',
      flux:
        'Render a 1:1 Amazon A+ infographic. Subject: Bewakoof Friends Pivot oversized cotton tee in mustard #FFCC00, 240 GSM, pressed flat without creases, centred at 55% frame height. Setting: absolute pure #0A0A0A matte-velvet seamless backdrop, no texture, sweep to floor with zero seam visible. Photometric: key = 22-inch beauty dish with diffusion sock camera-left at 30° azimuth, 60° elevation, 5500K, +0 reference; fill = silver v-flat camera-right at 1:1.5 key-to-fill (clamshell-tight); rim = symmetric gridded stripbox kickers rear-left and rear-right at 135° azimuth, 50° elevation, 5500K, balanced; ambient = zero, black flagged. Shadow density 0.15, no shadow drama. Optical: medium-format sensor (Phase One IQ4 150MP equivalent), 100mm macro, f/8 hyperfocal, ISO 64, 1/200s strobe sync. Spatial: tee centred, top 22% reserved for headline, bottom 14% reserved for logo lockup, four icon-callout chips placed at the four corners with 6% inset margins each. Material: cotton 0.65 roughness with minimal subsurface, low diffuse specular no hot spots; icon-callout chips read as 0.40-roughness vinyl-printed overlay graphics with crisp edges. Post: neutral commercial — no LUT character, no grain, no vignette, sRGB Amazon-compliant. Highlights protected at -2 IRE from clip, blacks at 0 IRE. On-image text and icon callouts (render exactly): top-third headline "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." in Inter Display variable weight 800, white #FFFFFF, tracking -15, ~84pt equivalent; sub-line directly below in Inter weight 500: "240gsm cotton · Drop fit · Machine wash safe". Four corner chips, each a #FFCC00 rounded-8px-radius pill with a #0A0A0A icon glyph + an Inter 500 caption — top-left: licence badge + "OFFICIALLY LICENSED", top-right: weight icon + "240 GSM COTTON", bottom-left: fit icon + "OVERSIZED DROP FIT", bottom-right: water-care icon + "MACHINE WASH SAFE". Bewakoof wordmark bottom-right at 4% inset on a small #FFCC00 pill. Final palette locked: #0A0A0A 60 / #FFCC00 30 / #FFFFFF 10. Negatives per surface: no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model, no lifestyle environment, no soft pastel palette, no busy background pattern, no AI-glossy plastic sheen on cotton, no warped or misspelt callout typography, no hot specular blowout on tee shoulder, no shadow drama anywhere.',
      nanoBanana:
        'Render a 1:1 Amazon A+ infographic for the Bewakoof Friends Pivot oversized cotton tee. Centre the tee (mustard #FFCC00, 240 GSM, pressed flat, no creases) at 55% frame height on a pure #0A0A0A matte-velvet seamless backdrop. Light it like a Hasselblad commercial product shoot: a 22-inch beauty dish with diffusion sock from camera-left at 30° azimuth and 60° elevation, 5500K; a silver v-flat camera-right at 1:1.5 key-to-fill (clamshell-tight); symmetric gridded stripbox kickers from rear-left and rear-right at 135° azimuth and 50° elevation, also 5500K. Zero ambient. Shadow density 0.15, no drama. Shoot medium-format 100mm macro at f/8 hyperfocal, ISO 64 — every weft thread sharp. Render the cotton with low specular, no hot spots, and minimal subsurface. Place four icon-callout chips at the four corners, each a #FFCC00 rounded-pill with a #0A0A0A icon and an Inter weight 500 caption: top-left "OFFICIALLY LICENSED" (licence badge icon), top-right "240 GSM COTTON" (weight icon), bottom-left "OVERSIZED DROP FIT" (fit icon), bottom-right "MACHINE WASH SAFE" (water-care icon). Render the headline exactly in the top 22% of the frame: "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." in Inter Display variable weight 800, white #FFFFFF, tracking -15, ~84pt equivalent. Below it, in Inter weight 500: "240gsm cotton · Drop fit · Machine wash safe". Bewakoof wordmark at bottom-right 4% inset on a small #FFCC00 pill. Apply a neutral commercial grade — no LUT character, no grain, no vignette, sRGB Amazon-compliant. Final palette locked: #0A0A0A (60%), #FFCC00 (30%), #FFFFFF (10%). Aspect 1:1. Avoid clean studio white-bg, mannequin shots, plastic mockups, corporate stock models, lifestyle environments, soft pastel palettes, busy background patterns, AI-glossy plastic sheen on cotton, warped or misspelt callout typography, hot specular blowout, or shadow drama.',
      gptImage:
        'Produce a 1:1 Amazon A+ infographic of the Bewakoof Friends Pivot oversized cotton tee — this is a marketplace spec asset, not an editorial photograph. Centre the tee (mustard #FFCC00, 240 GSM, pressed completely flat) at about 55% of the frame on an absolute pure #0A0A0A matte-velvet seamless backdrop. Light it like a Hasselblad commercial spec shoot: a 22-inch beauty dish at 5500K from camera-left (30° azimuth, 60° elevation), a silver v-flat fill camera-right (1:1.5 key-to-fill), and symmetric gridded stripbox kickers from rear-left and rear-right (135° azimuth, 50° elevation, 5500K). Zero ambient, zero shadow drama. Shoot medium-format 100mm macro at f/8 (hyperfocal, every weft sharp). Place four icon-callout chips at the four corners — top-left: licence badge + "OFFICIALLY LICENSED"; top-right: weight icon + "240 GSM COTTON"; bottom-left: fit icon + "OVERSIZED DROP FIT"; bottom-right: water-care icon + "MACHINE WASH SAFE" — each chip a #FFCC00 rounded-8px pill with #0A0A0A icon glyph and Inter weight 500 caption. Render the headline exactly in the top 22% of the frame: "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." in Inter Display variable weight 800, white, tracking -15. Sub-line just below in Inter weight 500: "240gsm cotton · Drop fit · Machine wash safe". Bewakoof wordmark bottom-right at 4% inset on a small #FFCC00 pill. Apply a neutral commercial grade — no LUT, no grain, no vignette, sRGB Amazon-compliant. Lock the palette to #0A0A0A (60%), #FFCC00 (30%), #FFFFFF (10%). 1:1 aspect. Do not include clean studio whites, mannequins, plastic mockups, corporate stock models, lifestyle context, soft pastels, busy backgrounds, plastic sheen, warped/misspelt callouts, hot specular, or any shadow drama.',
      ideogram:
        'Amazon A+ infographic 1:1, marketplace spec. Subject: Bewakoof Friends Pivot oversized cotton tee 240 GSM, mustard #FFCC00, pressed flat, no creases, centred at 55% frame height. Setting: absolute pure #0A0A0A matte-velvet seamless backdrop, no texture, marketplace-safe. Photometric: clamshell — 22-inch beauty dish with diffusion sock camera-left 30°/60° at 5500K, silver v-flat fill camera-right 1:1.5 ratio, symmetric gridded stripbox kickers rear-left + rear-right at 135°/50° 5500K, zero ambient. Shadow density 0.15. Optical: medium-format 100mm macro at f/8 hyperfocal, ISO 64, 1/200s strobe sync, every weft sharp. Spatial: tee centred, top 22% headline-safe, bottom 14% logo-safe, four corner chips at 6% margin insets. Material: cotton 0.65 roughness minimal subsurface; chips read as 0.40-roughness vinyl-printed overlays. Post: neutral commercial — no LUT character, no grain, no vignette, sRGB Amazon-compliant, highlights protected -2 IRE from clip, blacks at 0 IRE. ON-IMAGE TEXT and CALLOUT CHIPS (render exactly, no paraphrase): top-third headline "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." in Inter Display variable weight 800, white #FFFFFF, tracking -15, ~84pt equivalent. Sub-line in Inter weight 500: "240gsm cotton · Drop fit · Machine wash safe", #FFFFFF, ~24pt. Four corner chips, each a #FFCC00 rounded-pill (8px radius), with a #0A0A0A icon glyph + an Inter weight 500 caption in #0A0A0A: top-left "OFFICIALLY LICENSED" (licence-badge icon), top-right "240 GSM COTTON" (fabric-weight icon), bottom-left "OVERSIZED DROP FIT" (oversized-fit icon), bottom-right "MACHINE WASH SAFE" (water-droplet icon). Bewakoof wordmark bottom-right at 4% inset on a small #FFCC00 pill, #0A0A0A type. Palette locked: #0A0A0A 60 / #FFCC00 30 / #FFFFFF 10. Negatives per surface: no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model, no lifestyle environment, no soft pastel palette, no busy background pattern, no AI-glossy plastic sheen, no warped or misspelt callout typography, no hot specular blowout, no shadow drama, no warped chip iconography.',
    },
    negativePrompt:
      'clean studio white-bg, mannequin shot, plastic mockup, corporate stock model, lifestyle environment, soft pastel palette, busy background pattern, AI-glossy plastic sheen, warped or misspelt callout typography, hot specular blowout on tee shoulder, shadow drama, warped chip iconography',
    qualityGate: { passed: true, issues: [] },
  },
];

for (const c of concepts) {
  await db.collection('conceptBriefs').insertOne({
    ...c,
    projectId: PROJECT_ID,
    derivedFrom: {
      editEpochAtGeneration: 1,
      modelUsed: 'gpt-5.4',
      provider: 'chatgpt',
      generatedAt: now,
      manualEdits: [],
    },
  });
}

console.log('[6/7] Prompt deck');
const SURFACE_LABEL = {
  '1:1': 'Amazon hero (1:1)',
  '4:5': 'Meta feed (4:5)',
  '9:16': 'Reels / Story (9:16)',
  '16:9': 'Website hero (16:9)',
};
const ANGLE_NAME = {
  [ANGLE_IDS[0]]: 'Aspirational',
  [ANGLE_IDS[1]]: 'Emotional',
  [ANGLE_IDS[2]]: 'Rational',
};
const TOOL_FOR_SHOT = { hero: 'flux', lifestyle: 'flux', infographic: 'ideogram' };
const TOOL_LABEL = { flux: 'Flux Kontext', ideogram: 'Ideogram v3', 'nano-banana': 'Nano Banana Pro' };

const deckCards = [];
for (const c of concepts) {
  const tool = TOOL_FOR_SHOT[c.shotRecipe.shotType] || 'flux';
  for (const aspect of ['1:1', '4:5', '9:16']) {
    deckCards.push({
      heading: `Concept ${c.position} · ${ANGLE_NAME[c.angleId]} · ${c.shotRecipe.shotType} · ${SURFACE_LABEL[aspect]}`,
      description: `${TOOL_LABEL[tool]} · ${c.copy.headline}`,
      prompt: c.prompts[tool === 'nano-banana' ? 'nanoBanana' : tool] + ` · aspect ${aspect}`,
      tool,
      aspectRatio: aspect,
      conceptId: c._id,
    });
  }
}

await db.collection('promptDecks').insertOne({
  _id: DECK_ID,
  projectId: PROJECT_ID,
  derivedFrom: {
    editEpochAtGeneration: 1,
    modelUsed: 'rule-based-assembly',
    provider: 'manual',
    generatedAt: now,
    manualEdits: [],
  },
  cards: deckCards,
});

console.log('[7/7] Done. Project URL: /p/' + PROJECT_ID);
console.log('PROJECT_ID=' + PROJECT_ID);

await client.close();
