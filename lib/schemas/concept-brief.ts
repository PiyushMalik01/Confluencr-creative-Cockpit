import { z } from 'zod';
import { PaletteEntry, ShotType, DerivedFromSchema } from './common';

export const ToolPrompts = z.object({
  midjourney: z.string(),
  flux: z.string(),
  nanoBanana: z.string(),
  gptImage: z.string(),
  ideogram: z.string(),
});
export type ToolPrompts = z.infer<typeof ToolPrompts>;

export const ShotRecipe = z.object({
  shotType: ShotType,
  lighting: z.string(),
  composition: z.string(),
  lens: z.string(),
  setting: z.string(),
  props: z.array(z.string()).default([]),
});

// =============================================================
// CRAFT DEPTH — what separates a pro brief from a generic one.
// Every concept brief carries these so the generated prompts can
// be specific instead of vague ("soft lighting" → "Profoto OCF II
// 2x3 softbox key at 5200K from camera-left, 45° elevation, 2:1
// key-to-fill ratio, rim at 4500K from rear").
// =============================================================

export const LensSpec = z.object({
  sensor: z.string(),                  // "medium format Hasselblad H6D-100c" or "full-frame Sony A7R V"
  focalLength: z.string(),             // "100mm macro" or "85mm portrait"
  aperture: z.string(),                // "f/2.8" or "f/8 for hyperfocal"
  shutter: z.string().optional(),      // "1/200s strobe sync"
  iso: z.string().optional(),          // "ISO 100 clean"
  depthOfField: z.string(),            // "shallow, subject sharp, props melt at 1m"
});
export type LensSpec = z.infer<typeof LensSpec>;

export const LightingDiagram = z.object({
  key: z.object({
    modifier: z.string(),              // "5ft octabox" / "beauty dish 22-inch" / "bare strobe"
    angleDeg: z.string(),              // "camera-left 45°, elevation 60°"
    temperatureK: z.number(),          // 5200
    intensityStops: z.string().optional(), // "+2.7 over ambient"
  }),
  fill: z.object({
    modifier: z.string(),              // "v-flat camera-right" / "silver reflector"
    ratio: z.string(),                 // "2:1 key-to-fill" / "no fill, hard shadows"
    temperatureK: z.number().optional(),
  }).optional(),
  rim: z.object({
    modifier: z.string(),              // "bare strip from rear, gridded"
    angleDeg: z.string(),              // "rear 135°, low"
    temperatureK: z.number(),          // 4500 for cool separation
  }).optional(),
  ambient: z.string().optional(),      // "natural window light spill from camera-right"
  shadowDensity: z.number().min(0).max(1).default(0.6), // 0 = full white shadows, 1 = inky black
  notes: z.string().optional(),
});
export type LightingDiagram = z.infer<typeof LightingDiagram>;

export const MaterialRendering = z.object({
  subjectMaterial: z.string(),         // "240gsm cotton oversized tee, slight nap on the surface"
  subsurfaceCue: z.string().optional(),// "fabric reads as breathable with subtle subsurface scatter at edges"
  specularIntensity: z.string(),       // "low specular, matte cotton" / "high spec on glass perfume bottle"
  microfacetRoughness: z.string().optional(),
  brdfNotes: z.string().optional(),    // "anisotropic brushed-aluminium reflection on the cap"
  postSheen: z.string().optional(),    // "very slight cinema sheen, no plastic glossiness"
});
export type MaterialRendering = z.infer<typeof MaterialRendering>;

export const PostProcessing = z.object({
  grainISO: z.string(),                // "subtle 400-equivalent grain in shadows only"
  gradeShadows: z.string(),            // "shadows pushed cool teal #1F2A3A"
  gradeHighlights: z.string(),         // "highlights warm cream #FFF6E2"
  contrastCurve: z.string(),           // "S-curve, lifted blacks slightly for editorial feel"
  vignette: z.string().optional(),     // "soft vignette at corners, 8% darken"
  lutStyle: z.string().optional(),     // "Kodak Portra 400 emulation, low saturation"
});
export type PostProcessing = z.infer<typeof PostProcessing>;

export const ReferenceCite = z.object({
  photographers: z.array(z.string()).default([]),     // "Tim Walker editorial", "Annie Leibovitz portraiture"
  publications: z.array(z.string()).default([]),      // "Kinfolk", "i-D magazine", "Wallpaper*"
  brandCampaigns: z.array(z.string()).default([]),    // "Aimé Leon Dore lookbooks", "Patagonia Worn Wear"
  cinematicTouchstones: z.array(z.string()).default([]),
  notes: z.string().optional(),
});
export type ReferenceCite = z.infer<typeof ReferenceCite>;

export const AudienceSignalPixels = z.object({
  propLanguage: z.string(),            // "vinyl records + Polaroids = Gen Z analog nostalgia"
  framingLanguage: z.string(),         // "wide environmental + leading lines = aspirational"
  gradeLanguage: z.string(),           // "warm cream highlights = millennial cosy"
  grainLanguage: z.string().optional(),// "halation + film grain = Y2K revival"
});
export type AudienceSignalPixels = z.infer<typeof AudienceSignalPixels>;

export const CraftDepth = z.object({
  lensSpec: LensSpec,
  lighting: LightingDiagram,
  material: MaterialRendering,
  post: PostProcessing,
  references: ReferenceCite,
  audiencePixels: AudienceSignalPixels,
  thinking: z.string(),                // a paragraph explaining WHY this stack works for this angle on this brand
});
export type CraftDepth = z.infer<typeof CraftDepth>;

export const QualityGate = z.object({
  passed: z.boolean(),
  issues: z.array(z.object({
    field: z.string(),
    severity: z.enum(['warn', 'error']),
    message: z.string(),
  })).default([]),
});

export const Mandatory = z.object({
  item: z.string(),
  satisfied: z.boolean(),
});

export const ConceptBriefSchema = z.object({
  _id: z.string(),
  projectId: z.string(),
  angleId: z.string(),
  position: z.number().int().min(1).max(3),
  derivedFrom: DerivedFromSchema,

  themeStatement: z.string(),
  strategicRationale: z.string(),
  colorStory: z.array(PaletteEntry),
  typography: z.object({
    display: z.string(),
    body: z.string(),
    samples: z.object({ headline: z.string(), body: z.string() }),
  }),
  shotRecipe: ShotRecipe,
  // NEW: full craft-depth stack so the prompts can be specific
  craft: CraftDepth.optional(),
  copy: z.object({
    headline: z.string(),
    subhead: z.string().optional(),
    cta: z.string(),
  }),
  mandatories: z.array(Mandatory).default([]),
  prompts: ToolPrompts,
  negativePrompt: z.string(),
  qualityGate: QualityGate,
});

export type ConceptBrief = z.infer<typeof ConceptBriefSchema>;
