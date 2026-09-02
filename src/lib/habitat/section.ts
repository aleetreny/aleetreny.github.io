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

/** The frame, in tiles. Everything is composed inside this.
 *
 *  It shrank by more than half when the rooms did. A room is now the size of the
 *  render it is traced from — five to nine tiles — so the whole habitat fits in a
 *  frame a quarter the area of the one the ladder-stacked version needed, and the
 *  rock still runs off three sides. */
export const FRAME = { w: 78, h: 80 } as const;

/** Degrees off vertical. The whole hull is strung along this. */
export const TILT = 22;

const TAN_TILT = Math.tan((TILT * Math.PI) / 180);

/** Top-left corner of the bow, in tiles. Out in vacuum: everything from the Dock
 *  down is under rock. */
const BOW = { x: 7, y: 2 } as const;

/** Tiles of clear deck between one hull room and the next.
 *
 *  This is the Long Walk, and it is why the hull is a chain of rooms rather than
 *  a stack of them: the corridor is a place with its own width, not a line drawn
 *  between two boxes. */
export const WALK = 2;

/** The hull, bow to stern along the Long Walk. Each room hangs off the axis at
 *  the tilt, so the eight of them read as one vessel driven into rock. The Breach
 *  is not on the walk — it is the tear in the flank, and it hangs off it. */
const HULL_WALK: readonly RoomId[] = [
  'bridge', 'dock', 'cabins', 'hold', 'infirmary', 'berths', 'spine',
];

/** The tear, west of the walk between the Cabins and the Hold. Two sealed mouths,
 *  no light, and nothing on the other side of it. */
const BREACH_AT = { x: 6, y: 28 } as const;

/** The warren, cut by hand. Placed so that rooms which connect are a short
 *  passage apart and the Common is crossed by everybody.
 *
 *  No room is entered head-on and no two chambers share a wall angle: that is the
 *  irregularity rule from the plan, and at this size it is carried by where the
 *  mouths land rather than by rotating the boxes. */
const ROCK_AT: Record<string, { x: number; y: number }> = {
  // High on the flank, off the Dock and the Cabins, at the top of the Throat.
  greatwall: { x: 26, y: 20 },
  // The hub. Everything in the warren is one room from it.
  common: { x: 40, y: 20 },
  // A destination and not a route: it hangs off the Common by one corridor.
  hydroponics: { x: 44, y: 12 },
  // Behind the Common, so going home means crossing the room everybody is in.
  diggings: { x: 40, y: 31 },
  // At the junction of power, hull scrap and customers.
  workshops: { x: 28, y: 30 },
  // The lowest room, because water goes downhill, and on the way to nothing.
  well: { x: 40, y: 41 },
  // The frontier, and the two that run into rock nobody has surveyed.
  face: { x: 56, y: 32 },
  hollow: { x: 60, y: 44 },
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
  let y = BOW.y;
  for (const id of HULL_WALK) {
    const { w, h } = gridSize(ROOM_BY_ID[id].grid);
    out.push({ id, x: BOW.x + Math.round(TAN_TILT * (y - BOW.y)), y, w, h, side: 'hull' });
    y += h + WALK;
  }
  const breach = gridSize(ROOM_BY_ID.breach.grid);
  out.push({ id: 'breach', ...BREACH_AT, w: breach.w, h: breach.h, side: 'hull' });
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

/** The rock's nominal centre and radii, in tiles. Exported because the map draws
 *  its light against the same body the outline is generated from: two copies of
 *  these numbers is two rocks that drift apart. */
export const ROCK_BODY = { x: 44, y: 45, rx: 56, ry: 47 } as const;

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
  const centre = { x: ROCK_BODY.x, y: ROCK_BODY.y };
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
    const rx = ROCK_BODY.rx * (1 + lobe + bite);
    const ry = ROCK_BODY.ry * (1 + lobe + bite);
    out.push({ x: centre.x + Math.cos(a) * rx, y: centre.y + Math.sin(a) * ry });
  }
  return out;
}

/** Where the bow broke the surface, so the wreck can be drawn entering the rock
 *  rather than sitting on it. Everything above this line along the hull axis is
 *  out in vacuum. */
export const SURFACE_ALONG_HULL = 10;

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
    const x = ROCK_BODY.x + Math.cos(a) * ROCK_BODY.rx * d;
    const y = ROCK_BODY.y + Math.sin(a) * ROCK_BODY.ry * d;
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
      x: ROCK_BODY.x + Math.cos(a) * (ROCK_BODY.rx + 6) * d,
      y: ROCK_BODY.y + Math.sin(a) * (ROCK_BODY.ry + 6) * d,
      r: 0.5 + rand() * 2.4,
      spin: rand() * Math.PI,
    });
  }
  return out;
}

/** Masts, dishes and radiator fins on the part of the wreck still in vacuum.
 *  All of it bent: nothing on this ship has been straight since the impact. */
export const RIGGING = [
  { kind: 'mast', x: 8, y: 1, len: 8, lean: -13 },
  { kind: 'mast', x: 13, y: 1, len: 6, lean: 9 },
  { kind: 'dish', x: 16, y: 3, len: 4, lean: 26 },
  { kind: 'fin', x: 5, y: 5, len: 9, lean: -68 },
  { kind: 'fin', x: 17, y: 7, len: 10, lean: 64 },
  { kind: 'lamp', x: 11, y: 1, len: 2, lean: 0 },
  { kind: 'lamp', x: 16, y: 8, len: 2, lean: 0 },
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
    const cx = ROCK_BODY.x + Math.cos(a) * ROCK_BODY.rx * d;
    const cy = ROCK_BODY.y + Math.sin(a) * ROCK_BODY.ry * d;
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
