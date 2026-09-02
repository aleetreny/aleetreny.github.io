import { describe, expect, it } from 'vitest';
import { gridSize } from './grid';
import { ROOMS, ROOM_BY_ID } from './rooms';
import {
  FRAME, LINKS, PLACEMENTS, PLACEMENT_BY_ID, TILT, WALK, asteroidOutline, centreOf,
  craters, debris, roomAt, type Placement,
} from './section';

/** Tiles of rock between two rooms' nearest faces. Zero when they touch. */
function edgeGap(a: Placement, b: Placement): number {
  const dx = Math.max(0, a.x - (b.x + b.w), b.x - (a.x + a.w));
  const dy = Math.max(0, a.y - (b.y + b.h), b.y - (a.y + a.h));
  return dx && dy ? Math.max(dx, dy) : dx + dy;
}

describe('the composition', () => {
  it('places all sixteen, once each', () => {
    expect(PLACEMENTS).toHaveLength(16);
    expect(new Set(PLACEMENTS.map((p) => p.id)).size).toBe(16);
  });

  it('sizes every room from its own grid, so the map cannot lie about a place', () => {
    for (const room of ROOMS) {
      const { w, h } = gridSize(room.grid);
      const p = PLACEMENT_BY_ID[room.id];
      expect(p.w, room.id).toBe(w);
      expect(p.h, room.id).toBe(h);
    }
  });

  it('keeps everything inside the frame', () => {
    for (const p of PLACEMENTS) {
      expect(p.x, p.id).toBeGreaterThanOrEqual(0);
      expect(p.y, p.id).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w, p.id).toBeLessThanOrEqual(FRAME.w);
      expect(p.y + p.h, p.id).toBeLessThanOrEqual(FRAME.h);
    }
  });

  it('overlaps nothing, so every room can be clicked', () => {
    for (let i = 0; i < PLACEMENTS.length; i += 1) {
      for (let j = i + 1; j < PLACEMENTS.length; j += 1) {
        const a = PLACEMENTS[i]!;
        const b = PLACEMENTS[j]!;
        const apart = a.x + a.w <= b.x || b.x + b.w <= a.x
          || a.y + a.h <= b.y || b.y + b.h <= a.y;
        expect(apart, `${a.id} overlaps ${b.id}`).toBe(true);
      }
    }
  });
});

describe('the ship', () => {
  it('strings the hull bow to stern with the Long Walk between every room', () => {
    // Not a stack. The rooms are the size of the renders they are traced from, and
    // the corridor between them is space you walk down rather than a shared wall.
    const walk = PLACEMENTS
      .filter((p) => p.side === 'hull' && p.id !== 'breach')
      .sort((a, b) => a.y - b.y);
    expect(walk).toHaveLength(7);
    expect(PLACEMENTS.filter((p) => p.side === 'hull')).toHaveLength(8);
    for (let i = 1; i < walk.length; i += 1) {
      expect(walk[i]!.y, walk[i]!.id).toBe(walk[i - 1]!.y + walk[i - 1]!.h + WALK);
    }
  });

  it('hangs the Breach off the walk rather than on it', () => {
    // Two sealed mouths and nothing on the other side: it is the tear in the
    // flank, not a room you pass through on the way aft.
    const breach = PLACEMENT_BY_ID.breach;
    const onWalk = PLACEMENTS.some((p) => p.side === 'hull' && p.id !== 'breach'
      && p.y + p.h + WALK === breach.y);
    expect(onWalk).toBe(false);
    expect(edgeGap(breach, PLACEMENT_BY_ID.cabins)).toBeLessThanOrEqual(2);
  });

  it('drives it in at twenty-two degrees, measured off what was actually placed', () => {
    const hull = PLACEMENTS.filter((p) => p.side === 'hull').sort((a, b) => a.y - b.y);
    const first = hull[0]!;
    const last = hull[hull.length - 1]!;
    const measured = (Math.atan2(last.x - first.x, last.y - first.y) * 180) / Math.PI;
    expect(Math.abs(measured - TILT)).toBeLessThan(1.5);
  });

  it('leaves the bow out in vacuum and buries everything aft of it', () => {
    const bridge = PLACEMENT_BY_ID.bridge;
    const spine = PLACEMENT_BY_ID.spine;
    expect(bridge.y).toBeLessThan(18);
    expect(spine.y).toBeGreaterThan(60);
  });
});

describe('the warren', () => {
  it('cuts it into the rock to one side of the wreck', () => {
    const hullRight = Math.max(...PLACEMENTS.filter((p) => p.side === 'hull').map((p) => p.x + p.w));
    const rock = PLACEMENTS.filter((p) => p.side === 'rock');
    expect(rock).toHaveLength(8);
    expect(Math.max(...rock.map((p) => p.x + p.w))).toBeGreaterThan(hullRight);
  });

  it('packs it: rooms that connect are near enough for a short passage', () => {
    for (const link of LINKS) {
      const a = centreOf(link.a);
      const b = centreOf(link.b);
      const gap = Math.hypot(a.x - b.x, a.y - b.y);
      expect(gap, `${link.a}–${link.b}`).toBeLessThan(56);
    }
  });

  it('packs the warren: no room is more than a short passage from another', () => {
    // The check that used to live here compared room area against the habitat's
    // bounding box. That ratio fell from a third to a quarter when the rooms were
    // re-cut to the size of the renders they are traced from — the rooms shrank
    // and the corridors between them did not — so it stopped measuring what it was
    // named for. This measures it directly: a warren is chambers within a few
    // metres of each other, and floating boxes in a void are not.
    for (const a of PLACEMENTS) {
      const nearest = Math.min(...PLACEMENTS.filter((b) => b !== a).map((b) => edgeGap(a, b)));
      expect(nearest, a.id).toBeLessThanOrEqual(6);
    }
  });

  it('keeps no room bigger than the renders they are traced from', () => {
    // The whole point of the re-cut: a room is five to nine tiles, and the three
    // that are larger are larger because their emptiness is their content.
    const big = PLACEMENTS.filter((p) => Math.max(p.w, p.h) > 9).map((p) => p.id).sort();
    expect(big).toEqual(['common', 'greatwall', 'hollow', 'spine']);
    for (const p of PLACEMENTS) expect(Math.max(p.w, p.h), p.id).toBeLessThanOrEqual(12);
  });
});

describe('hit testing', () => {
  it('finds the room under a tile inside it', () => {
    const p = PLACEMENT_BY_ID.common;
    expect(roomAt(p.x + 2, p.y + 2)).toBe('common');
    expect(roomAt(p.x + p.w - 1, p.y + p.h - 1)).toBe('common');
  });

  it('finds nothing in solid rock', () => {
    expect(roomAt(0, 0)).toBeNull();
    expect(roomAt(FRAME.w - 1, FRAME.h - 1)).toBeNull();
  });

  it('agrees with every placement across its whole footprint', () => {
    for (const p of PLACEMENTS) {
      for (let y = p.y; y < p.y + p.h; y += 3) {
        for (let x = p.x; x < p.x + p.w; x += 3) {
          expect(roomAt(x, y), `${p.id} at ${x},${y}`).toBe(p.id);
        }
      }
    }
  });
});

describe('the rock', () => {
  const outline = asteroidOutline();

  it('is a closed lumpy ring, not an ellipse', () => {
    expect(outline.length).toBeGreaterThan(100);
    const radii = outline.map((v) => Math.hypot(v.x - 104, v.y - 58));
    const spread = Math.max(...radii) - Math.min(...radii);
    expect(spread).toBeGreaterThan(8);
  });

  it('is deterministic, so it is the same rock every visit', () => {
    expect(asteroidOutline()).toEqual(outline);
    expect(craters()).toEqual(craters());
    expect(debris()).toEqual(debris());
  });

  it('contains the whole warren, so nothing is dug outside the asteroid', () => {
    const inside = (px: number, py: number) => {
      let hit = false;
      for (let i = 0, j = outline.length - 1; i < outline.length; j = i, i += 1) {
        const a = outline[i]!;
        const b = outline[j]!;
        if ((a.y > py) !== (b.y > py)
          && px < ((b.x - a.x) * (py - a.y)) / (b.y - a.y) + a.x) hit = !hit;
      }
      return hit;
    };
    for (const p of PLACEMENTS.filter((q) => q.side === 'rock')) {
      for (const [cx, cy] of [[p.x, p.y], [p.x + p.w, p.y], [p.x, p.y + p.h], [p.x + p.w, p.y + p.h]]) {
        expect(inside(cx!, cy!), `${p.id} corner ${cx},${cy}`).toBe(true);
      }
    }
  });

  it('scatters craters and rubble without putting either inside a room', () => {
    expect(craters().length).toBeGreaterThan(15);
    expect(debris().length).toBeGreaterThan(20);
    for (const c of craters()) {
      expect(roomAt(Math.round(c.x), Math.round(c.y)), `crater ${c.x},${c.y}`).toBeNull();
    }
  });
});

describe('the galleries', () => {
  it('draws each connection exactly once', () => {
    const total = ROOMS.reduce((n, r) => n + r.connects.length, 0);
    expect(LINKS).toHaveLength(total / 2);
  });

  it('links only rooms that say they are linked', () => {
    for (const l of LINKS) {
      expect(ROOM_BY_ID[l.a].connects).toContain(l.b);
      expect(ROOM_BY_ID[l.b].connects).toContain(l.a);
    }
  });
});
