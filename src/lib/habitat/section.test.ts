import { describe, expect, it } from 'vitest';
import { gridSize } from './grid';
import { ROOMS, ROOM_BY_ID } from './rooms';
import {
  HULL_AXIS, LINKS, PLACEMENTS, SECTION, centreOf, hullTilt, placementOf,
} from './section';

describe('the silhouette', () => {
  it('drives the hull in at twenty-two degrees off the galleries', () => {
    expect(hullTilt()).toBeGreaterThan(21.5);
    expect(hullTilt()).toBeLessThan(22.5);
  });

  it('runs the hull from near the surface down into the rock', () => {
    expect(HULL_AXIS.from.y).toBeLessThan(HULL_AXIS.to.y);
    expect(HULL_AXIS.from.x).toBeLessThan(HULL_AXIS.to.x);
  });

  it('leans every hull room and leaves every dug one level', () => {
    for (const p of PLACEMENTS) {
      expect(p.tilt).toBe(ROOM_BY_ID[p.id].side === 'hull' ? 22 : 0);
    }
  });

  it('keeps the rock to the right of the hull, where it was dug from', () => {
    const hull = PLACEMENTS.filter((p) => ROOM_BY_ID[p.id].side === 'hull');
    const rock = PLACEMENTS.filter((p) => ROOM_BY_ID[p.id].side === 'rock');
    const deepestHull = Math.max(...hull.map((p) => p.x));
    const shallowestRock = Math.min(...rock.map((p) => p.x));
    expect(shallowestRock).toBeGreaterThan(Math.min(...hull.map((p) => p.x)));
    expect(deepestHull).toBeLessThan(Math.max(...rock.map((p) => p.x)));
  });
});

describe('the boxes', () => {
  it('places all sixteen', () => {
    expect(PLACEMENTS).toHaveLength(16);
    expect(new Set(PLACEMENTS.map((p) => p.id)).size).toBe(16);
  });

  it('sizes a room from its own grid, so the drawing cannot lie about its shape', () => {
    for (const room of ROOMS) {
      const { w, h } = gridSize(room.grid);
      const p = placementOf(room.id);
      expect(p.w).toBeCloseTo(w / 2);
      expect(p.h).toBeCloseTo(h / 2);
      expect(p.w / p.h).toBeCloseTo(w / h);
    }
  });

  it('keeps every room inside the section', () => {
    for (const p of PLACEMENTS) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(SECTION.w);
      expect(p.y + p.h).toBeLessThanOrEqual(SECTION.h);
    }
  });

  it('does not overlap two rooms, so every one can be clicked', () => {
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

  it('centres a box on the point it was given', () => {
    const p = placementOf('common');
    const c = centreOf('common');
    expect(p.x + p.w / 2).toBeCloseTo(c.x);
    expect(p.y + p.h / 2).toBeCloseTo(c.y);
  });
});

describe('the galleries', () => {
  it('draws each connection exactly once', () => {
    const total = ROOMS.reduce((n, r) => n + r.connects.length, 0);
    expect(LINKS).toHaveLength(total / 2);
    const keys = LINKS.map((l) => [l.a, l.b].sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('links only rooms that say they are linked', () => {
    for (const l of LINKS) {
      expect(ROOM_BY_ID[l.a].connects).toContain(l.b);
      expect(ROOM_BY_ID[l.b].connects).toContain(l.a);
    }
  });
});
