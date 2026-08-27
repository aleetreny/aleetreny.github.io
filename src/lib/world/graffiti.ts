// The jokes that only the blacklight can see.
//
// These are measured against the *visible Polaroid window*, not the source
// image. A portrait cropped into a landscape slot therefore keeps the doodle
// on the face instead of placing it where the face used to be before cropping.
// Group photographs carry several anchors inside one intervention. The whole
// recipe remains deterministic and is rendered once as a static SVG.

export const PHOTO_GAG_KINDS = [
  'cross-moustache', 'wizard', 'alien', 'halo', 'cat', 'cape', 'pirate',
  'ufo', 'pixels', 'party', 'wizard-school', 'vampire', 'halo-horns',
  'snorkel',
] as const;
export type PhotoGagKind = (typeof PHOTO_GAG_KINDS)[number];

export type PhotoAnchor = {
  /** Centre inside the photograph's visible window, as a fraction. */
  x: number;
  y: number;
  /** Relative to the visible window's short side. */
  scale: number;
  rotate?: number;
};

export type PhotoGag = {
  id: string;
  photo: number;
  kind: PhotoGagKind;
  anchors: readonly PhotoAnchor[];
};

/** One calibrated intervention on every shipped Polaroid. */
export const PHOTO_GAGS: readonly PhotoGag[] = [
  {
    id: 'jungle-cross-eyes', photo: 0, kind: 'cross-moustache',
    anchors: [{ x: 0.67, y: 0.51, scale: 0.43, rotate: -1 }],
  },
  {
    id: 'sunset-double-wizard', photo: 1, kind: 'wizard',
    anchors: [
      { x: 0.18, y: 0.38, scale: 0.38, rotate: -5 },
      { x: 0.62, y: 0.47, scale: 0.40, rotate: 4 },
    ],
  },
  {
    id: 'roadside-alien-pact', photo: 2, kind: 'alien',
    anchors: [
      { x: 0.22, y: 0.51, scale: 0.40, rotate: -18 },
      { x: 0.52, y: 0.49, scale: 0.36, rotate: -27 },
    ],
  },
  {
    id: 'snowboard-halo-committee', photo: 3, kind: 'halo',
    anchors: [
      { x: 0.24, y: 0.41, scale: 0.28 },
      { x: 0.65, y: 0.40, scale: 0.27 },
      { x: 0.47, y: 0.76, scale: 0.39 },
    ],
  },
  {
    id: 'arena-cat-protocol', photo: 4, kind: 'cat',
    anchors: [{ x: 0.66, y: 0.82, scale: 0.40, rotate: 2 }],
  },
  {
    id: 'field-superhero', photo: 5, kind: 'cape',
    anchors: [{ x: 0.50, y: 0.73, scale: 0.30, rotate: -4 }],
  },
  {
    id: 'black-sand-pirate', photo: 6, kind: 'pirate',
    anchors: [{ x: 0.55, y: 0.68, scale: 0.35, rotate: -2 }],
  },
  {
    id: 'facetime-abduction', photo: 7, kind: 'ufo',
    anchors: [{ x: 0.50, y: 0.47, scale: 0.55 }],
  },
  {
    id: 'boat-incognito-trio', photo: 8, kind: 'pixels',
    anchors: [
      { x: 0.16, y: 0.52, scale: 0.36, rotate: -2 },
      { x: 0.42, y: 0.52, scale: 0.28 },
      { x: 0.75, y: 0.53, scale: 0.38, rotate: 3 },
    ],
  },
  {
    id: 'yellow-shirt-party-emergency', photo: 9, kind: 'party',
    anchors: [{ x: 0.49, y: 0.35, scale: 0.45, rotate: 2 }],
  },
  {
    id: 'street-wizard-school', photo: 10, kind: 'wizard-school',
    anchors: [{ x: 0.49, y: 0.60, scale: 0.34, rotate: -1 }],
  },
  {
    id: 'mud-vampire', photo: 11, kind: 'vampire',
    anchors: [{ x: 0.48, y: 0.54, scale: 0.34 }],
  },
  {
    id: 'island-halo-versus-horns', photo: 12, kind: 'halo-horns',
    anchors: [{ x: 0.33, y: 0.64, scale: 0.39 }],
  },
  {
    id: 'night-swim-snorkel-team', photo: 13, kind: 'snorkel',
    anchors: [
      { x: 0.36, y: 0.61, scale: 0.27, rotate: -4 },
      { x: 0.52, y: 0.60, scale: 0.25 },
      { x: 0.67, y: 0.61, scale: 0.27, rotate: 4 },
    ],
  },
];

export const CARD_GAG_KINDS = [
  'halo', 'briefcase-wings', 'grad-cap', 'flask-burst', 'bug-parade',
  'crossed-dice', 'mango-rocket', 'angel-wings', 'game-crown',
  'headphones', 'coffee-ring',
] as const;
export type CardGagKind = (typeof CARD_GAG_KINDS)[number];

export type CardGag = {
  id: string;
  card: string;
  kind: CardGagKind;
  x: number;
  y: number;
  width: number;
  rotate?: number;
};

/** Graphic-only marks. They tease the content without adding another sentence. */
export const CARD_GAGS: readonly CardGag[] = [
  { id: 'hero-crooked-halo', card: 'hero', kind: 'halo', x: 0.72, y: 0.18, width: 0.24, rotate: -7 },
  { id: 'work-briefcase-escape', card: 'work', kind: 'briefcase-wings', x: 0.79, y: 0.20, width: 0.22, rotate: 4 },
  { id: 'education-cap-slip', card: 'edu', kind: 'grad-cap', x: 0.76, y: 0.17, width: 0.20, rotate: 8 },
  { id: 'lab-flask-incident', card: 'lab', kind: 'flask-burst', x: 0.83, y: 0.18, width: 0.18, rotate: -4 },
  { id: 'repo-bug-parade', card: 'repos', kind: 'bug-parade', x: 0.76, y: 0.32, width: 0.26, rotate: -5 },
  { id: 'hack-crossed-dice', card: 'hack', kind: 'crossed-dice', x: 0.78, y: 0.20, width: 0.21, rotate: 5 },
  { id: 'frulogy-mango-launch', card: 'diary', kind: 'mango-rocket', x: 0.78, y: 0.40, width: 0.22, rotate: -8 },
  { id: 'volunteer-angel-wings', card: 'vol', kind: 'angel-wings', x: 0.76, y: 0.26, width: 0.24, rotate: 2 },
  { id: 'hobbies-game-crown', card: 'random', kind: 'game-crown', x: 0.75, y: 0.68, width: 0.23, rotate: -6 },
  { id: 'podcast-headphones', card: 'pod', kind: 'headphones', x: 0.78, y: 0.42, width: 0.23, rotate: 3 },
  { id: 'contact-coffee-evidence', card: 'contact', kind: 'coffee-ring', x: 0.77, y: 0.75, width: 0.22, rotate: -5 },
];

export const UV_GRAFFITI_COUNT = PHOTO_GAGS.length + CARD_GAGS.length;
