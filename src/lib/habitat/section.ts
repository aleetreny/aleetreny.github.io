// Where everything sits when you look at the whole rock at once.
//
// This is the composition of the hero image, and it is laid out in *tiles* — the
// same tiles the room grids are drawn on — so the map and the room interiors are
// the same world at two magnifications rather than two drawings that have to be
// kept in agreement.
//
// Rooms are packed, not scattered. A cutaway of somewhere people live looks like
// a doll's house: chambers sharing walls and floors, with short passages cut
// between them and solid rock in the gaps. Floating boxes joined by hairlines is
// a diagram, and a diagram is what this deliberately stopped being.
//
// The ship goes in bow-first at twenty-two degrees. Its nose is still out in
// vacuum; everything aft of the dock is buried.

import { gridSize } from './grid';
import { mulberry32 } from '../world/rng';
import { ROOMS, ROOM_BY_ID, type RoomId } from './rooms';

/** The frame, in tiles. Everything is composed inside this. */
// Big enough that the rock has edges and the vacuum around it is visible. A
// meteorite you cannot see the outside of is just a background.
export const FRAME = { w: 200, h: 116 } as const;

/** Degrees off vertical. The whole hull is strung along this. */
export const TILT = 22;

const TAN_TILT = Math.tan((TILT * Math.PI) / 180);

/** Top-left corner of the bow, in tiles. */
const BOW = { x: 24, y: 12 } as const;

/** The hull, bow first. Each room hangs directly off the bottom of the one before
 *  it and steps sideways by the tilt, so the eight of them read as one vessel
 *  driven into rock rather than as eight rooms that happen to be near each other. */
const HULL_ORDER: readonly RoomId[] = [
  'bridge', 'dock', 'cabins', 'breach', 'hold', 'infirmary', 'berths', 'spine',
];

/** The warren, cut by hand. Placed by eye so that rooms which connect are close
 *  enough for the passage between them to be a few tiles of corridor. */
const ROCK_AT: Record<string, { x: number; y: number }> = {
  // High on the hull, off the dock and the cabins.
  greatwall: { x: 62, y: 25 },
  // The hub. Everything in the warren is one room from it.
  common: { x: 88, y: 22 },
  hydroponics: { x: 120, y: 28 },
  diggings: { x: 88, y: 34 },
  // Low, between the reactor and the workshops, which is who it serves.
  well: { x: 86, y: 56 },
  workshops: { x: 66, y: 44 },
  // The two that run away from everything, into rock nobody has surveyed.
  face: { x: 122, y: 42 },
  hollow: { x: 120, y: 52 },
};

export type Placement = {
  id: RoomId;
  /** Top-left corner, in tiles. */
  x: number;
  y: number;
  /** The room's own grid, so the map cannot disagree with the interior. */
  w: number;
  h: number;
  side: 'hull' | 'rock';
};

function buildPlacements(): Placement[] {
  const out: Placement[] = [];
  let stacked = 0;
  for (const id of HULL_ORDER) {
    const { w, h } = gridSize(ROOM_BY_ID[id].grid);
    out.push({
      id,
      x: BOW.x + Math.round(TAN_TILT * stacked),
      y: BOW.y + stacked,
      w,
      h,
      side: 'hull',
    });
    stacked += h;
  }
  for (const [id, at] of Object.entries(ROCK_AT)) {
    const { w, h } = gridSize(ROOM_BY_ID[id as RoomId].grid);
    out.push({ id: id as RoomId, x: at.x, y: at.y, w, h, side: 'rock' });
  }
  return out;
}

export const PLACEMENTS: readonly Placement[] = buildPlacements();

export const PLACEMENT_BY_ID: Record<RoomId, Placement> = Object.fromEntries(
  PLACEMENTS.map((p) => [p.id, p]),
) as Record<RoomId, Placement>;

export function centreOf(id: RoomId): { x: number; y: number } {
  const p = PLACEMENT_BY_ID[id];
  return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
}

/** Which room, if any, covers this tile. The whole of hit-testing. */
export function roomAt(x: number, y: number): RoomId | null {
  for (const p of PLACEMENTS) {
    if (x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) return p.id;
  }
  return null;
}

export type Link = { a: RoomId; b: RoomId };

/** Every connection, once. Drawn as a cut passage rather than a line. */
export const LINKS: readonly Link[] = (() => {
  const seen = new Set<string>();
  const out: Link[] = [];
  for (const room of ROOMS) {
    for (const other of room.connects) {
      const key = room.id < other ? `${room.id}|${other}` : `${other}|${room.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ a: room.id, b: other });
    }
  }
  return out;
})();

// ── the rock itself ─────────────────────────────────────────────────────────

export type Vec = { x: number; y: number };

/** The asteroid's outline, as a closed ring of points in tile space.
 *
 *  A lumpy blob rather than an ellipse: radius wanders with two octaves of noise
 *  so the silhouette has both broad lobes and a bitten edge, which is what stops
 *  it reading as a drawn oval. Deterministic, so the rock is the same rock every
 *  time anybody looks at it. */
export function asteroidOutline(points = 132): Vec[] {
  const rand = mulberry32(20260901);
  const phase = Array.from({ length: 9 }, () => rand() * Math.PI * 2);
  // Set down and to the right, so the frame's upper-left stays vacuum and the
  // bow has somewhere to stick out into.
  const centre = { x: 104, y: 58 };
  const out: Vec[] = [];
  for (let i = 0; i < points; i += 1) {
    const a = (i / points) * Math.PI * 2;
    // Broad lobes and a bitten edge. An asteroid that reads as an ellipse reads
    // as a drawing of one; the amplitude here is most of what stops that.
    const lobe = Math.sin(a * 2 + phase[0]!) * 0.09
      + Math.sin(a * 3 + phase[1]!) * 0.06
      + Math.sin(a * 5 + phase[2]!) * 0.035;
    const bite = Math.sin(a * 9 + phase[3]!) * 0.02
      + Math.sin(a * 14 + phase[4]!) * 0.012
      + Math.sin(a * 23 + phase[5]!) * 0.007;
    // Wider than tall, because the warren spreads sideways and the ship goes deep.
    // The rock runs off the frame on three sides: this is a piece of something
    // big, not a pebble floating in the middle of the picture.
    const rx = 96 * (1 + lobe + bite);
    const ry = 54 * (1 + lobe + bite);
    out.push({ x: centre.x + Math.cos(a) * rx, y: centre.y + Math.sin(a) * ry });
  }
  return out;
}

/** Where the bow broke the surface, so the wreck can be drawn entering the rock
 *  rather than sitting on it. Everything above this line along the hull axis is
 *  out in vacuum. */
export const SURFACE_ALONG_HULL = 12;

export type Crater = { x: number; y: number; r: number; deep: number };

/** Craters on the sunlit face. Placed outside the warren so the cutaway never
 *  has to argue with the surface. */
export function craters(): Crater[] {
  const rand = mulberry32(4211);
  const out: Crater[] = [];
  // Drawn until there are enough that clear the warren, rather than drawn once
  // and hoped over: a crater in somebody's kitchen is not a surface feature.
  for (let tries = 0; tries < 400 && out.length < 30; tries += 1) {
    const a = rand() * Math.PI * 2;
    const d = 0.58 + rand() * 0.4;
    const r = 1.6 + rand() * 5.4;
    const x = 104 + Math.cos(a) * 96 * d;
    const y = 58 + Math.sin(a) * 54 * d;
    if (clearOfRooms(x, y, r + 1.5)) out.push({ x, y, r, deep: rand() });
  }
  return out;
}

/** Whether a disc touches any room's footprint. */
function clearOfRooms(x: number, y: number, r: number): boolean {
  for (const p of PLACEMENTS) {
    const nx = Math.max(p.x, Math.min(x, p.x + p.w));
    const ny = Math.max(p.y, Math.min(y, p.y + p.h));
    if ((nx - x) ** 2 + (ny - y) ** 2 < r * r) return false;
  }
  return true;
}

export type Debris = { x: number; y: number; r: number; spin: number };

/** Rubble still hanging around the impact, a hundred days later. */
export function debris(): Debris[] {
  const rand = mulberry32(90210);
  const out: Debris[] = [];
  for (let i = 0; i < 38; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = 1.04 + rand() * 0.42;
    out.push({
      x: 104 + Math.cos(a) * 104 * d,
      y: 58 + Math.sin(a) * 62 * d,
      r: 0.5 + rand() * 2.4,
      spin: rand() * Math.PI,
    });
  }
  return out;
}

/** Masts, dishes and radiator fins on the part of the wreck still in vacuum.
 *  All of it bent: nothing on this ship has been straight since the impact. */
export const RIGGING = [
  { kind: 'mast', x: 29, y: 12, len: 11, lean: -13 },
  { kind: 'mast', x: 37, y: 12, len: 8, lean: 8 },
  { kind: 'dish', x: 43, y: 13, len: 5, lean: 26 },
  { kind: 'fin', x: 25, y: 16, len: 13, lean: -68 },
  { kind: 'fin', x: 46, y: 18, len: 15, lean: 64 },
  { kind: 'lamp', x: 33, y: 11, len: 2, lean: 0 },
  { kind: 'lamp', x: 42, y: 18, len: 2, lean: 0 },
] as const;

export type Facet = { pts: Vec[]; tone: number };

/** Big angular planes across the rock face.
 *
 *  Speckle alone gives sandpaper. What makes stone read as stone at a distance is
 *  that it is broken into faces, each catching the light slightly differently. */
export function facets(): Facet[] {
  const rand = mulberry32(778291);
  const out: Facet[] = [];
  for (let i = 0; i < 22; i += 1) {
    const a = rand() * Math.PI * 2;
    const d = rand() * 0.86;
    const cx = 104 + Math.cos(a) * 96 * d;
    const cy = 58 + Math.sin(a) * 54 * d;
    const n = 3 + Math.floor(rand() * 3);
    const r = 8 + rand() * 22;
    const spin = rand() * Math.PI;
    const pts: Vec[] = [];
    for (let k = 0; k < n; k += 1) {
      const t = spin + (k / n) * Math.PI * 2;
      const rr = r * (0.55 + rand() * 0.7);
      pts.push({ x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr * 0.72 });
    }
    out.push({ pts, tone: rand() });
  }
  return out;
}
