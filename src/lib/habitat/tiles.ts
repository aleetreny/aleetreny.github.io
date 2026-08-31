// What the inside of a room looks like.
//
// Sixty-five objects do not need sixty-five sprites. They need fifteen shapes and
// a name: the shape says how much space a thing takes and how it catches light,
// and the legend says what it actually is. A crate and a seed store are the same
// box; one of them is the last eleven varieties anybody will ever grow.
//
// The mapping is authored rather than guessed from the name, because guessing
// would quietly get one wrong and nobody would notice. tiles.test.ts checks that
// every object in every room has been given a shape.
//
// Colour is warm inside and cold in the hull, which is the same distinction the
// cutaway draws in hairlines: what was inherited against what was made by hand.

import { ROOMS, type RoomId, type Side } from './rooms';

export type Shape =
  /** A box. Crates, lockers, stores, somebody's things. */
  | 'crate'
  /** Somewhere to lie down. */
  | 'bunk'
  /** Wall-mounted, lit or dead. Consoles, boards, notices. */
  | 'panel'
  /** A flat surface on legs. Tables, trays, beds, the slab. */
  | 'table'
  /** A vessel. */
  | 'tank'
  /** Apparatus with a vent and a hum. */
  | 'machine'
  /** A vertical frame holding things. */
  | 'rack'
  /** Something alive. */
  | 'plant'
  /** Somewhere to sit. */
  | 'seat'
  /** Something put on a surface: a pinned sheet, tape, a nameplate, a drawing. */
  | 'mark'
  /** A dressed face of rock or plate with nothing on it. */
  | 'surface'
  /** A capsule with somebody asleep in it. */
  | 'berth'
  /** The same, with a strip of tape on the glass and a name somebody invented. */
  | 'berth-named'
  /** An irregular heap. */
  | 'pile'
  /** A light. */
  | 'lamp'
  /** A hole in the hull with the outside on the other side of it. */
  | 'port'
  /** Somebody lives here: a warm point in a cell they dug themselves. */
  | 'home';

/** Every object glyph, per room, and the shape it takes. */
export const SHAPES: Record<RoomId, Record<string, Shape>> = {
  bridge: { w: 'port', p: 'seat', s: 'mark', t: 'panel', u: 'panel', b: 'seat' },
  dock: { 1: 'rack', 2: 'rack', 3: 'rack', r: 'machine', l: 'mark', k: 'crate' },
  cabins: { m: 'bunk', d: 'pile', e: 'crate' },
  breach: { n: 'mark', c: 'crate', p: 'pile', s: 'pile' },
  hold: { o: 'crate', u: 'crate', v: 'panel' },
  infirmary: { b: 'bunk', c: 'seat', k: 'rack', z: 'table' },
  berths: { b: 'berth', n: 'berth-named', t: 'panel', q: 'berth' },
  spine: { c: 'rack', a: 'panel', r: 'machine' },
  greatwall: { W: 'surface', t: 'panel', b: 'seat' },
  common: { k: 'machine', s: 'machine', T: 'table', b: 'seat', P: 'mark' },
  hydroponics: { l: 'lamp', T: 'table', f: 'plant', s: 'crate', c: 'seat' },
  diggings: {
    1: 'home', 2: 'home', 3: 'home', 4: 'home', 5: 'home',
    6: 'home', 7: 'home', 8: 'home', 9: 'home',
  },
  workshops: { t: 'rack', f: 'machine', q: 'panel', h: 'pile' },
  well: { T: 'tank', p: 'machine', f: 'rack' },
  face: { t: 'pile', m: 'mark', y: 'mark' },
  hollow: {},
};

export function shapeOf(room: RoomId, glyph: string): Shape | null {
  return SHAPES[room][glyph] ?? null;
}

export type Palette = {
  /** The rock or plate the room is cut into. */
  solid: string;
  solidEdge: string;
  /** Air, which is not nothing: it is the dark of the room. */
  air: string;
  /** The far wall. In a cutaway there is no empty air where a room is — there is
   *  the surface on the other side of it. */
  back: string;
  backGrain: string;
  /** What is underfoot. */
  floor: string;
  floorEdge: string;
  /** Light in this room, and what it warms. */
  light: string;
  glow: string;
  /** Objects, before their own tint. */
  matter: string;
  matterEdge: string;
};

/** The hull is cold and was inherited. The rock is warm and was made by hand. */
export const PALETTE: Record<Side, Palette> = {
  hull: {
    solid: '#2a3245',
    solidEdge: '#3d4a63',
    air: '#0c1018',
    back: '#243043',
    backGrain: '#33415a',
    floor: '#39435a',
    floorEdge: '#4e5b76',
    light: '#9ad4e6',
    glow: 'rgba(154, 212, 230, 0.10)',
    matter: '#586780',
    matterEdge: '#7b8ba6',
  },
  rock: {
    solid: '#3a2c22',
    solidEdge: '#54402f',
    air: '#12100e',
    back: '#33261d',
    backGrain: '#4a3626',
    floor: '#4a3728',
    floorEdge: '#63492f',
    light: '#ffcf85',
    glow: 'rgba(255, 207, 133, 0.11)',
    matter: '#6d5236',
    matterEdge: '#93704a',
  },
};

/** A resident's own two colours, so twenty-five figures a few pixels tall are
 *  still twenty-five people. Derived from the initial, so they never drift. */
export function personColours(id: string): { body: string; head: string } {
  const i = id.charCodeAt(0) - 65;
  const hue = (i * 137.508) % 360;
  return {
    body: `hsl(${hue.toFixed(0)} 46% 52%)`,
    head: `hsl(${((hue + 18) % 360).toFixed(0)} 34% 74%)`,
  };
}

/** Rooms whose objects should be tinted away from the room's own matter colour,
 *  because the thing is not made of the same stuff as everything else. */
export const ACCENTS: Partial<Record<Shape, string>> = {
  plant: '#7bbf5a',
  lamp: '#ffe9b0',
  berth: '#6fa8c8',
  'berth-named': '#6fa8c8',
  port: '#0a1020',
  home: '#ffb765',
  mark: '#c9d6e4',
};

/** Sanity for the authoring: how many objects have been given a shape. */
export function shapedCount(): number {
  return ROOMS.reduce((n, r) => n + Object.keys(SHAPES[r.id]).length, 0);
}
