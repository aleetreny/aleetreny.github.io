// The jokes that only the blacklight can read.
//
// Keeping this as data makes the night shift deterministic, reviewable and
// cheap: UvWorld measures the real Polaroids/cards once, then turns these
// recipes into one static SVG. No observer, face detector or animation loop is
// needed to keep twenty-four tiny jokes alive.

export const PHOTO_GAG_KINDS = [
  'cross-moustache', 'wizard', 'alien', 'halo-horns', 'cat', 'pirate',
  'crown', 'ufo', 'pixels', 'party', 'wizard-school', 'vampire',
] as const;
export type PhotoGagKind = (typeof PHOTO_GAG_KINDS)[number];

export type PhotoGag = {
  id: string;
  photo: number;
  kind: PhotoGagKind;
  /** Centre inside the photograph, as a fraction of its visible window. */
  x: number;
  y: number;
  scale: number;
  rotate?: number;
};

/** One deliberate intervention on each of the first twelve photographs. */
export const PHOTO_GAGS: readonly PhotoGag[] = [
  { id: 'cross-eyes-and-moustache', photo: 0, kind: 'cross-moustache', x: 0.51, y: 0.43, scale: 0.86, rotate: -2 },
  { id: 'wizard-hat-and-stars', photo: 1, kind: 'wizard', x: 0.51, y: 0.39, scale: 0.92, rotate: 3 },
  { id: 'certified-humanoid', photo: 2, kind: 'alien', x: 0.52, y: 0.49, scale: 0.68 },
  { id: 'halo-versus-horns', photo: 3, kind: 'halo-horns', x: 0.52, y: 0.40, scale: 0.92 },
  { id: 'cat-whisker-protocol', photo: 4, kind: 'cat', x: 0.72, y: 0.70, scale: 0.64, rotate: 2 },
  { id: 'pirate-with-parrot', photo: 5, kind: 'pirate', x: 0.52, y: 0.71, scale: 0.42, rotate: -2 },
  { id: 'chief-mango-officer', photo: 6, kind: 'crown', x: 0.50, y: 0.39, scale: 0.88 },
  { id: 'ufo-abduction-window', photo: 7, kind: 'ufo', x: 0.50, y: 0.43, scale: 0.96 },
  { id: 'pixel-incognito', photo: 8, kind: 'pixels', x: 0.50, y: 0.43, scale: 0.86, rotate: -1 },
  { id: 'clown-party-emergency', photo: 9, kind: 'party', x: 0.51, y: 0.41, scale: 0.9, rotate: 4 },
  { id: 'budget-wizard-school', photo: 10, kind: 'wizard-school', x: 0.50, y: 0.42, scale: 0.86, rotate: -3 },
  { id: 'vampire-night-intern', photo: 11, kind: 'vampire', x: 0.51, y: 0.43, scale: 0.88 },
];

export type CardGagKind = 'rewrite' | 'stamp' | 'arrow' | 'ring';

export type CardGag = {
  id: string;
  card: string;
  kind: CardGagKind;
  x: number;
  y: number;
  width: number;
  copyKey: string;
  rotate?: number;
};

/** Twelve more marks that argue with the portfolio's own copy. */
export const CARD_GAGS: readonly CardGag[] = [
  { id: 'portfolio-field-manual', card: 'hero', kind: 'rewrite', x: 0.16, y: 0.08, width: 0.30, copyKey: 'world.uv.gag.fieldManual', rotate: -3 },
  { id: 'apparently-normal-subject', card: 'hero', kind: 'arrow', x: 0.68, y: 0.34, width: 0.28, copyKey: 'world.uv.gag.normal', rotate: -5 },
  { id: 'paid-missions', card: 'work', kind: 'rewrite', x: 0.50, y: 0.20, width: 0.52, copyKey: 'world.uv.gag.missions', rotate: 2 },
  { id: 'academic-plot-twist', card: 'edu', kind: 'ring', x: 0.54, y: 0.19, width: 0.40, copyKey: 'world.uv.gag.plotTwist', rotate: -3 },
  { id: 'lab-look-closer', card: 'lab', kind: 'rewrite', x: 0.52, y: 0.17, width: 0.48, copyKey: 'world.uv.gag.lookCloser', rotate: 2 },
  { id: 'works-on-my-machine', card: 'repos', kind: 'stamp', x: 0.68, y: 0.34, width: 0.42, copyKey: 'world.uv.gag.machine', rotate: -7 },
  { id: 'zero-selection-criteria', card: 'hack', kind: 'arrow', x: 0.66, y: 0.21, width: 0.38, copyKey: 'world.uv.gag.criteria', rotate: 3 },
  { id: 'mango-funded-startup', card: 'diary', kind: 'stamp', x: 0.68, y: 0.46, width: 0.44, copyKey: 'world.uv.gag.mangoFunding', rotate: -6 },
  { id: 'quiet-volunteering', card: 'vol', kind: 'ring', x: 0.52, y: 0.28, width: 0.54, copyKey: 'world.uv.gag.linkedin', rotate: 2 },
  { id: 'mango-over-everything', card: 'random', kind: 'stamp', x: 0.66, y: 0.70, width: 0.44, copyKey: 'world.uv.gag.mango', rotate: -5 },
  { id: 'peer-reviewed-ish', card: 'pod', kind: 'rewrite', x: 0.52, y: 0.47, width: 0.48, copyKey: 'world.uv.gag.peerReviewed', rotate: 3 },
  { id: 'coffee-no-slides', card: 'contact', kind: 'arrow', x: 0.67, y: 0.78, width: 0.40, copyKey: 'world.uv.gag.noSlides', rotate: -4 },
];

export const UV_GRAFFITI_COUNT = PHOTO_GAGS.length + CARD_GAGS.length;
