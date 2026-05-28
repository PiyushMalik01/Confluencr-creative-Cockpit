export type Category =
  | 'fashion'
  | 'beauty'
  | 'wellness'
  | 'sportswear'
  | 'home'
  | 'food'
  | 'tech'
  | 'other';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'fashion', label: 'Fashion / apparel' },
  { value: 'beauty', label: 'Beauty / cosmetics' },
  { value: 'wellness', label: 'Wellness / personal care' },
  { value: 'sportswear', label: 'Sportswear / outdoor' },
  { value: 'home', label: 'Home / lifestyle' },
  { value: 'food', label: 'Food / beverage' },
  { value: 'tech', label: 'Tech / electronics' },
  { value: 'other', label: 'Other' },
];

export const AUDIENCE_CHIPS: Record<Category, string[]> = {
  fashion: [
    'Tier 1 Gen Z streetwear',
    'Tier 2 college-age meme-fluent',
    'Premium 35+ minimalist',
    'Mass-market value seeker',
    'Workwear / office-casual urban',
  ],
  beauty: [
    'Urban millennial first-time skincare',
    'Premium 35+ luxe beauty',
    'Gen Z TikTok-curious',
    'Tier 2 value-tier mass beauty',
    'Clean-beauty conscious 28-40',
  ],
  wellness: [
    'Urban moms wellness-curious',
    'Gen Z first-time supplement buyer',
    'Premium 30+ biohacker',
    'Mass-market value health',
  ],
  sportswear: [
    'Value-tier outdoor enthusiast',
    'Premium 25-40 endurance athlete',
    'College-age casual fitness',
    'Trail / adventure first-timer',
  ],
  home: [
    'Urban renter 24-32',
    'New home buyer 28-40 design-conscious',
    'Premium 40+ tasteful collector',
    'Tier 2 family home builder',
  ],
  food: [
    'Gen Z snacking-fluent',
    'Urban millennial health-curious',
    'Premium 30+ artisanal palate',
    'Mass-market everyday-pantry shopper',
  ],
  tech: [
    'Pro creator 25-40',
    'Gen Z hobbyist enthusiast',
    'Premium 35+ taste-led upgrade',
    'Mass-market first-time adopter',
  ],
  other: [
    'Tier 1 urban millennial',
    'Gen Z value-seeker',
    'Premium 35+ design-led',
    'Mass-market everyday',
  ],
};

export const SMP_STARTERS = [
  'the only X that ___',
  'the most X for the price',
  'wear the show, own the joke',
  'the everyday X that finally ___',
  'X that fits your life, not the other way around',
];

export const VOICE_OPPOSITE_CHIPS: { x: string; y: string }[] = [
  { x: 'confident', y: 'hypey' },
  { x: 'playful', y: 'slapstick' },
  { x: 'expert', y: 'clinical' },
  { x: 'warm', y: 'saccharine' },
  { x: 'rebellious', y: 'edgy' },
  { x: 'minimalist', y: 'cold' },
  { x: 'optimistic', y: 'naive' },
];

export const INSIGHT_PATTERNS = [
  'they want X but get Y',
  'they care about X more than Y',
  'they keep trying X and giving up because Y',
  'they would love X if only Y were easier',
];

export const DO_NOT_INCLUDE_DEFAULTS: Record<Category, string[]> = {
  fashion: ['clean studio white-bg', 'mannequin shot', 'plastic mockup'],
  beauty: ['clinical lab setting', 'before-after split-screen cliche'],
  wellness: ['before-after pill bottle cliche', 'doctor-in-lab-coat trope'],
  sportswear: ['stock-athlete cliche', 'sweaty gym overlay'],
  home: ['IKEA-style flat-lay cliche', 'stock-photo couple'],
  food: ['steam overlay', 'food-on-marble cliche'],
  tech: ['glossy product on white', 'studio reflection'],
  other: [],
};

export const SURFACES = [
  { value: '1:1' as const, label: 'Amazon hero / Meta square (1:1)' },
  { value: '4:5' as const, label: 'Meta / Instagram feed (4:5)' },
  { value: '9:16' as const, label: 'Reels / Story (9:16)' },
  { value: '16:9' as const, label: 'Website hero / YouTube (16:9)' },
];

export const COMMON_MANDATORIES = [
  'Logo bottom-right',
  'Logo top-left',
  'A+ content panel safe zones',
  'Legal claim footer ("dermatologically tested" etc.)',
  'No competitor brand visible',
  'Price callout in corner',
];
