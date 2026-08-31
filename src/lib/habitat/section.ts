// Where the rooms sit when you look at the whole thing at once.
//
// The cutaway is the silhouette, and the silhouette is the identity: a hull driven
// into rock at an angle, with hand-dug galleries running level off it. Everything
// on the hull axis is inherited and finite; everything to the right of it was made
// by hand and is still being made.
//
// Positions are authored. Sizes are not — a room's box is its own grid, halved, so
// the drawing cannot lie about the shape of a place. A room that is long and low in
// the grid is long and low here.

import { gridSize } from './grid';
import { ROOMS, ROOM_BY_ID, type RoomId } from './rooms';

/** Section space. Arbitrary units; the view scales them to fit. */
export const SECTION = { w: 190, h: 120 } as const;

/** The ship's long axis, from the bow near the surface to the reactor deep in the
 *  rock. Everything in the hull is strung along it. */
export const HULL_AXIS = {
  from: { x: 26, y: 12 },
  to: { x: 64, y: 106 },
} as const;

/** Degrees off vertical, derived from the axis rather than asserted beside it. */
export function hullTilt(): number {
  const dx = HULL_AXIS.to.x - HULL_AXIS.from.x;
  const dy = HULL_AXIS.to.y - HULL_AXIS.from.y;
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/** Centres in section space. Hull rooms are spaced along the axis; rock rooms are
 *  placed by hand, level, spreading right and down as the galleries do. */
const CENTRE: Record<RoomId, { x: number; y: number }> = {
  bridge: { x: 26.0, y: 12.0 },
  dock: { x: 31.4, y: 25.4 },
  cabins: { x: 36.9, y: 38.9 },
  breach: { x: 42.3, y: 52.3 },
  hold: { x: 47.7, y: 65.7 },
  infirmary: { x: 53.1, y: 79.1 },
  berths: { x: 58.6, y: 92.6 },
  spine: { x: 64.0, y: 106.0 },

  greatwall: { x: 70, y: 30 },
  common: { x: 103, y: 33 },
  hydroponics: { x: 141, y: 29 },
  diggings: { x: 104, y: 54 },
  workshops: { x: 80, y: 74 },
  well: { x: 113, y: 91 },
  face: { x: 141, y: 71 },
  hollow: { x: 167, y: 94 },
};

export type Placement = {
  id: RoomId;
  /** Top-left corner in section space. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Degrees. The hull leans; the rock does not. */
  tilt: number;
};

/** A room's box: its own grid at half scale, so the cutaway is to scale with the
 *  interiors rather than decorative. */
export function placementOf(id: RoomId): Placement {
  const room = ROOM_BY_ID[id];
  const { w, h } = gridSize(room.grid);
  const bw = w / 2;
  const bh = h / 2;
  const c = CENTRE[id];
  return { id, x: c.x - bw / 2, y: c.y - bh / 2, w: bw, h: bh, tilt: room.tilt };
}

export const PLACEMENTS: readonly Placement[] = ROOMS.map((r) => placementOf(r.id));

export type Link = { a: RoomId; b: RoomId };

/** Every connection, once, so the galleries can be drawn between the rooms. */
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

export function centreOf(id: RoomId): { x: number; y: number } {
  return CENTRE[id];
}
