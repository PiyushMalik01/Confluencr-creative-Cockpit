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
    photos: [{ kind: 'url', url: 'https://picsum.photos/seed/bewakoof-friends-pivot/600/600', fidelityTier: 'medium' }],
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
    { url: 'https://picsum.photos/seed/snitch-streetwear-1/600/600', source: 'snitch.in', pinned: true, classification: 'hero', confidence: 0.86 },
    { url: 'https://picsum.photos/seed/souledstore-friends-1/600/600', source: 'thesouledstore.com', pinned: true, classification: 'hero', confidence: 0.92 },
    { url: 'https://picsum.photos/seed/beyoung-streetwear-1/600/600', source: 'beyoung.in', pinned: true, classification: 'hero', confidence: 0.74 },
    { url: 'https://picsum.photos/seed/snitch-streetwear-2/600/600', source: 'snitch.in', pinned: true, classification: 'hero', confidence: 0.81 },
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

function fluxPrompt(subject, setting, lighting, composition, colour, aspect, mandatories, dni) {
  return `${subject}. ${setting}. ${lighting}. ${composition}. ${colour}. ${aspect} aspect ratio. Mandatory: ${mandatories}. Negative: ${dni}`;
}

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
      { hex: '#FFFFFF', role: 'accent', ratio: 0.1 },
    ],
    typography: {
      display: 'Bebas Neue',
      body: 'Inter',
      samples: { headline: 'OWN YOUR CRAZY', body: 'Friends Pivot Tee · Drop 014' },
    },
    shotRecipe: {
      shotType: 'hero',
      lighting: 'hard top key + black rim, deep shadow, no fill — gig poster contrast',
      composition: 'centred tee at 70% height, top-third bold headline, sticker artefacts at bottom-third',
      lens: '50mm prime, slight wide framing for poster feel',
      setting: 'inky black backdrop with a slight matte texture, Bombay-poster sticker overlays',
      props: ['paste-up sticker scraps', 'subtle paper tear edges'],
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
        'product photo of yellow Friends Pivot oversized t-shirt centred on an inky black poster backdrop, hard top key light + black rim, deep shadow no fill, sticker paste-up edges bottom third, big Bebas Neue headline "OWN YOUR CRAZY" top third, Bewakoof logo bottom-right, --ar 1:1 --style raw --no white background, mannequin, plastic mockup, corporate stock model',
      flux: fluxPrompt(
        'Bewakoof yellow Friends Pivot oversized cotton t-shirt centred on backdrop',
        'inky black matte-textured poster backdrop with paste-up sticker scraps bottom-third',
        'hard top key light + black rim, deep shadow, no fill, gig poster contrast',
        'centred tee at 70% frame height, headline reserve top-third, brand logo lockup bottom-right',
        'colour palette anchored at #FFCC00 (60%) and #0A0A0A (30%), accent #FFFFFF (10%)',
        '1:1',
        'Bewakoof logo bottom-right + A+ safe zones respected',
        'no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model'
      ),
      nanoBanana:
        'A bold gig-poster style product shot: a yellow Bewakoof Friends Pivot oversized tee centred on an inky black backdrop, hard top key + black rim lighting, paste-up sticker artefacts at the bottom. Render the headline "OWN YOUR CRAZY" in a Bebas Neue style at the top-third. Place the Bewakoof logo at the bottom-right. Aspect 1:1. Avoid clean studio white backgrounds and mannequin shots.',
      gptImage:
        'Photograph this exact yellow Bewakoof Friends Pivot oversized t-shirt as if it were a gig poster. Use an inky black backdrop, hard top key light with a black rim, and paste-up sticker artefacts at the bottom. Add the headline "OWN YOUR CRAZY" in tall display type in the top third, the Bewakoof logo at the bottom-right, and keep the framing 1:1 for an Amazon hero. Avoid catalog whites, mannequins, plastic mockups, and stock models.',
      ideogram:
        'Poster-style hero. Subject: yellow Friends Pivot oversized tee centred. Setting: matte inky black backdrop, paste-up sticker scraps. Lighting: hard top key + black rim, deep shadow. Composition: 70% tee height, top-third Bebas Neue headline OWN YOUR CRAZY, Bewakoof logo bottom-right. Colour: #FFCC00 60 / #0A0A0A 30 / #FFFFFF 10. Aspect 1:1. Negatives: clean studio white-bg, mannequin shot, plastic mockup, corporate stock model.',
    },
    negativePrompt:
      'clean studio white-bg, mannequin shot, plastic mockup, corporate stock model, environmental outdoor lifestyle, soft pastel palette',
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
      { hex: '#3D2F1F', role: 'neutral', ratio: 0.2 },
    ],
    typography: {
      display: 'Bebas Neue',
      body: 'Inter',
      samples: { headline: 'PIVOT. PIVOT! PIVOT!!', body: 'For the rewatch, the in-jokes, and the Sunday couches.' },
    },
    shotRecipe: {
      shotType: 'lifestyle',
      lighting: 'late golden-hour window light, soft directional, warm CT shift',
      composition: 'tee draped on a wooden chair frame in left-third, coffee mug + remote in foreground',
      lens: '35mm wide, shallow depth of field at the foreground objects',
      setting: 'beige plaster wall with a soft TV-glow rim from off-frame right',
      props: ['rattan side table', 'half-drunk coffee mug', 'tv remote', 'soft blanket on chair'],
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
        'lifestyle photo of a yellow Friends Pivot oversized t-shirt draped on a wooden chair, beige plaster wall, late golden-hour window light, half-drunk coffee mug and tv remote on a rattan side table foreground, shallow depth of field, warm CT shift, Bebas Neue headline "PIVOT. PIVOT! PIVOT!!" upper area, Bewakoof logo bottom-right, --ar 4:5 --style raw --no white-bg, mannequin, plastic mockup, corporate stock model',
      flux: fluxPrompt(
        'Bewakoof yellow Friends Pivot oversized tee draped on a wooden chair, soft rattan side table foreground',
        'beige plaster wall living room corner, half-drunk coffee mug and tv remote on side table, soft TV glow from off-frame right',
        'late golden-hour window light, soft directional, warm CT shift, gentle rim',
        'tee in left-third, foreground objects bottom-right, 4:5 vertical reserve for headline top',
        '#F4E1B4 background (55%) with #FFCC00 tee accent (25%) and #3D2F1F warm neutrals (20%)',
        '4:5',
        'Bewakoof logo bottom-right + A+ safe zones respected',
        'no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model'
      ),
      nanoBanana:
        'A warm, late-afternoon lifestyle shot of a yellow Bewakoof Friends Pivot oversized tee draped on a wooden chair in a beige-walled living room. A half-drunk coffee mug and a TV remote sit on a rattan side table in the foreground. Warm window light, shallow depth of field. Add a Bebas Neue headline "PIVOT. PIVOT! PIVOT!!" in the upper-left. Aspect 4:5. Avoid catalog whites and mannequin shots.',
      gptImage:
        'Render a lifestyle photograph of the Bewakoof Friends Pivot oversized tee draped on a wooden chair in a beige-walled rewatch corner. Warm late afternoon light, a coffee mug and remote in the foreground, soft TV-glow from off-frame. Add the headline "PIVOT. PIVOT! PIVOT!!" in tall display type in the top area, Bewakoof logo bottom-right, 4:5 aspect for Meta feed. Avoid white catalog backdrops and mannequin shots.',
      ideogram:
        'Lifestyle. Subject: tee on chair, mug + remote foreground. Setting: beige plaster wall, golden-hour window light, TV-glow rim. Composition: tee in left-third, headline reserve top-third, brand logo bottom-right. Colour: #F4E1B4 55 / #FFCC00 25 / #3D2F1F 20. Type: Bebas Neue headline "PIVOT. PIVOT! PIVOT!!" + Inter body. Aspect 4:5. Negatives: clean studio white-bg, mannequin shot, plastic mockup, corporate stock model.',
    },
    negativePrompt:
      'clean studio white-bg, mannequin shot, plastic mockup, corporate stock model, harsh studio lighting, cold colour temperature, busy clutter',
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
      { hex: '#0A0A0A', role: 'background', ratio: 0.6 },
      { hex: '#FFCC00', role: 'primary', ratio: 0.3 },
      { hex: '#FFFFFF', role: 'accent', ratio: 0.1 },
    ],
    typography: {
      display: 'Inter',
      body: 'Inter',
      samples: { headline: 'OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600.', body: '240gsm cotton · Drop fit · Machine wash safe' },
    },
    shotRecipe: {
      shotType: 'infographic',
      lighting: 'even softbox, flat reveal, no shadow drama — spec-shoot lighting',
      composition: 'tee centred at 55%, four yellow icon-callout chips arranged top-left, top-right, bottom-left, bottom-right',
      lens: '85mm product macro, slight compression',
      setting: 'pure #0A0A0A backdrop, no texture, marketplace-safe',
      props: ['four icon-callout chips: licence badge, fabric weight, drop fit, wash icon'],
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
        'infographic product photo, yellow Friends Pivot oversized t-shirt centred on pure black backdrop, four yellow icon callouts at the corners (licence badge, 240gsm, drop fit, wash icon), even softbox flat lighting, headline "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." top, Bewakoof logo bottom-right, --ar 1:1 --style raw --no white-bg, mannequin, plastic mockup, corporate stock model',
      flux: fluxPrompt(
        'Bewakoof yellow Friends Pivot oversized tee centred at 55% frame on pure #0A0A0A backdrop',
        'four yellow icon-callout chips at the corners — licence badge, 240gsm cotton, drop fit, machine wash safe',
        'even softbox flat reveal, no shadow drama, spec-shoot lighting',
        'tee centred, callouts top-left + top-right + bottom-left + bottom-right, headline reserve top-third',
        '#0A0A0A background (60%) with #FFCC00 callouts (30%) and #FFFFFF body text (10%)',
        '1:1',
        'Bewakoof logo bottom-right + A+ safe zones respected, icons sized for Amazon A+ panel',
        'no clean studio white-bg, no mannequin, no plastic mockup, no corporate stock model, no lifestyle context'
      ),
      nanoBanana:
        'Render an Amazon A+ infographic: a yellow Bewakoof Friends Pivot oversized tee centred on a pure black backdrop. Place four yellow icon-callout chips at the four corners — licence badge, 240gsm cotton, drop fit, machine wash safe. Headline "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." in clean Inter at the top. Aspect 1:1, marketplace-safe.',
      gptImage:
        'Make an Amazon A+ infographic for the Bewakoof Friends Pivot oversized tee. Center the tee on a pure black backdrop, add four yellow icon-callout chips at the corners — licence badge, 240gsm cotton, drop fit, machine wash safe. Set the headline "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." at the top in clean Inter. Add the Bewakoof logo bottom-right. 1:1 aspect.',
      ideogram:
        'Infographic. Subject: tee centred. Setting: pure #0A0A0A backdrop. Lighting: even softbox flat reveal. Composition: tee at 55%, four corner callouts. Type: Inter headline "OFFICIALLY LICENSED. OVERSIZED. UNDER ₹600." top + four short icon-callout chips. Colour: #0A0A0A 60 / #FFCC00 30 / #FFFFFF 10. Aspect 1:1. Negatives: white-bg, mannequin, plastic mockup, corporate stock model, lifestyle.',
    },
    negativePrompt:
      'clean studio white-bg, mannequin shot, plastic mockup, corporate stock model, lifestyle environment, soft pastel palette, busy background pattern',
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
