// The things left lying on the board.
//
// A dossier card is content: it is written, translated, seeded and read. An
// object is furniture: it is a thing on a table that happens to do something
// when you touch it. The two never share a code path — the cards keep their
// own drag, their own z-order and their own persistence — but they share a
// slate, a camera and a light source, and that is the whole point.
//
// This module is the catalogue: what exists, how big it is at rest, what it is
// allowed to take part in, and where it starts. Everything here is data, so the
// owner's objects panel can move, resize, rotate, hide or restore any of it
// without a single component knowing.

import siteSettingsFixture from '../../../fixtures/site-settings.json';

/** Every object the board ships with. One instance of each: the id *is* the
 *  kind, which keeps the settings document small and the editor honest. */
export const OBJECT_KINDS = [
  'book', 'scholarship', 'notepad', 'paintgun', 'petri', 'physarum', 'coin',
  'pcalamp', 'hourglass', 'blackhole', 'telescope', 'passport', 'camera',
  'die', 'life', 'lorenz', 'regression', 'garden', 'flower', 'donotpress',
  'calculator', 'randomwalk', 'dilemma', 'curiosity', 'arcade',
  // The instruments: each one a door onto a real phenomenon, and each one a
  // thing you could pick up off a bench rather than a chart in a box.
  'montyhall', 'descent', 'voronoi', 'chloroplast', 'ferrofluid', 'chladni', 'dunes',
] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];

/** What an object is allowed to take part in. Traits rather than types: the
 *  coin, the die and a fresh Polaroid have nothing in common as components and
 *  everything in common as things that fall when the gravity goes off. */
export type ObjectTrait =
  /** Can be picked up and moved with a pointer. */
  | 'draggable'
  /** Has a body in the shared physics: it drifts, it bounces, it can be thrown. */
  | 'physics'
  /** Floats when the gravity goes off. */
  | 'gravity'
  /** Feels the black hole, and can cross its horizon. */
  | 'blackhole'
  /** Paint sticks to it, and travels with it. */
  | 'paintable'
  /** Shows up in a Polaroid and through the telescope. */
  | 'capture'
  /** Runs a simulation heavy enough to be worth loading late and pausing when
   *  it is off screen. */
  | 'heavy';

export type ObjectSpec = {
  /** Footprint at scale 1, in board units. Objects are small on purpose: the
   *  board zooms, and a thing you have to zoom into is a thing you found. */
  w: number;
  h: number;
  traits: readonly ObjectTrait[];
};

// Anything a hand can pick up, a hole can eat. The trait used to belong to the
// six loose things alone, which meant most of the desk could be dragged
// straight through the horizon and come out the other side — the one thing a
// black hole must never allow.
const LOOSE: readonly ObjectTrait[] = ['draggable', 'physics', 'gravity', 'blackhole', 'paintable', 'capture'];
const SITTING: readonly ObjectTrait[] = ['draggable', 'gravity', 'blackhole', 'paintable', 'capture'];
const HEAVY_SITTING: readonly ObjectTrait[] = ['draggable', 'gravity', 'blackhole', 'paintable', 'capture', 'heavy'];
const ANCHORED: readonly ObjectTrait[] = ['draggable', 'blackhole', 'paintable', 'capture'];

export const OBJECT_SPECS: Record<ObjectKind, ObjectSpec> = {
  book: { w: 190, h: 132, traits: SITTING },
  scholarship: { w: 200, h: 140, traits: SITTING },
  notepad: { w: 140, h: 156, traits: SITTING },
  paintgun: { w: 150, h: 96, traits: LOOSE },
  petri: { w: 150, h: 150, traits: HEAVY_SITTING },
  physarum: { w: 160, h: 160, traits: HEAVY_SITTING },
  coin: { w: 92, h: 92, traits: LOOSE },
  pcalamp: { w: 200, h: 212, traits: HEAVY_SITTING },
  hourglass: { w: 104, h: 152, traits: [...LOOSE, 'heavy'] },
  // The one thing on the board that is not furniture: it pulls, so it stays.
  blackhole: { w: 200, h: 200, traits: ['capture', 'heavy'] },
  telescope: { w: 150, h: 180, traits: SITTING },
  passport: { w: 152, h: 200, traits: SITTING },
  camera: { w: 140, h: 124, traits: LOOSE },
  die: { w: 100, h: 100, traits: LOOSE },
  life: { w: 160, h: 182, traits: HEAVY_SITTING },
  lorenz: { w: 124, h: 124, traits: LOOSE },
  regression: { w: 200, h: 172, traits: SITTING },
  garden: { w: 240, h: 182, traits: ANCHORED },
  flower: { w: 110, h: 160, traits: ANCHORED },
  donotpress: { w: 130, h: 112, traits: SITTING },
  calculator: { w: 120, h: 180, traits: SITTING },
  randomwalk: { w: 190, h: 180, traits: SITTING },
  dilemma: { w: 180, h: 132, traits: SITTING },
  curiosity: { w: 150, h: 210, traits: SITTING },
  arcade: { w: 160, h: 150, traits: HEAVY_SITTING },

  // ---- the instruments ----
  montyhall: { w: 196, h: 158, traits: SITTING },
  descent: { w: 214, h: 180, traits: HEAVY_SITTING },
  voronoi: { w: 186, h: 186, traits: HEAVY_SITTING },
  chloroplast: { w: 172, h: 196, traits: HEAVY_SITTING },
  ferrofluid: { w: 226, h: 178, traits: HEAVY_SITTING },
  chladni: { w: 182, h: 214, traits: HEAVY_SITTING },
  dunes: { w: 244, h: 168, traits: HEAVY_SITTING },
};

export function hasTrait(kind: ObjectKind, trait: ObjectTrait): boolean {
  return OBJECT_SPECS[kind].traits.includes(trait);
}

/** One object as the board stores it. */
export type DeskObject = {
  id: ObjectKind;
  x: number;
  y: number;
  rot: number;
  /** 0.5 – 2. The footprint is authored small; this is the owner's dial. */
  scale: number;
  visible: boolean;
};

/** Where everything starts, when the board has no catalogue of its own.
 *
 *  The authored positions live in `content/source/board-spec.mjs` and reach the
 *  app through the fixture below; this is only the floor under them, so a fork
 *  that empties the settings still gets a desk rather than a heap in the corner.
 *  Laid out in a loose diagonal, which is at least somewhere. */
export const BASE_OBJECTS: DeskObject[] = OBJECT_KINDS.map((id, index) => ({
  id,
  x: 120 + (index % 6) * 300,
  y: 140 + Math.floor(index / 6) * 300,
  rot: ((index * 37) % 9) - 4,
  scale: 1,
  visible: true,
}));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const num = (value: unknown, fallback: number, min: number, max: number) => (
  typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
);

/** A stored catalogue merged over a base.
 *
 *  Same contract as the board's own cards: an object added to the shipped set
 *  after the owner last saved still reaches them, and one they hid stays
 *  hidden. There is no "dismissed" list because nothing is ever thrown away —
 *  an object the owner does not want is simply not visible. */
export function parseObjectsOver(base: DeskObject[], value: unknown): DeskObject[] {
  const stored = new Map<string, Record<string, unknown>>();
  if (Array.isArray(value)) {
    for (const row of value) if (isRecord(row) && typeof row.id === 'string') stored.set(row.id, row);
  }
  return base.map((fallback) => {
    const raw = stored.get(fallback.id);
    if (!raw) return fallback;
    return {
      id: fallback.id,
      x: num(raw.x, fallback.x, -4000, 12000),
      y: num(raw.y, fallback.y, -4000, 12000),
      rot: num(raw.rot, fallback.rot, -180, 180),
      scale: num(raw.scale, fallback.scale, 0.4, 2.4),
      visible: typeof raw.visible === 'boolean' ? raw.visible : fallback.visible,
    };
  });
}

const fixtureObjects = (siteSettingsFixture as Array<{ key: string; value: unknown }>)
  .find((row) => row.key === 'board.objects')?.value;

/** The authored desk: the repository's own arrangement. */
export const DEFAULT_OBJECTS: DeskObject[] = parseObjectsOver(BASE_OBJECTS, fixtureObjects);
export const DEFAULT_OBJECT_LAYOUT = DEFAULT_OBJECTS;

/** What a live board resolves to: what it has stored, over what ships. */
export function parseObjects(value: unknown): DeskObject[] {
  return parseObjectsOver(DEFAULT_OBJECTS, value);
}
