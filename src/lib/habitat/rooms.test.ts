import { describe, expect, it } from 'vitest';
import { TERRAIN, gridSize, isTerrain, placedObjects } from './grid';
import { ROOMS, ROOM_BY_ID, doorsOf, neighbours, roomObjects, type RoomId } from './rooms';

const DOORS = new Set(['+', 'X']);
const BOUNDARY = new Set(['#', '|', '+', 'X']);

describe('the habitat is the shape the spec says it is', () => {
  it('has sixteen rooms, eight in the hull and eight in the rock', () => {
    expect(ROOMS).toHaveLength(16);
    expect(ROOMS.filter((r) => r.side === 'hull')).toHaveLength(8);
    expect(ROOMS.filter((r) => r.side === 'rock')).toHaveLength(8);
  });

  it('tilts the hull and leaves the rock level', () => {
    for (const room of ROOMS) {
      expect(room.tilt).toBe(room.side === 'hull' ? 22 : 0);
    }
  });

  it('gives every room a unique id', () => {
    expect(new Set(ROOMS.map((r) => r.id)).size).toBe(16);
  });

  it('carries between sixty and eighty significant objects in total', () => {
    const total = ROOMS.reduce((n, r) => n + Object.keys(r.legend).length, 0);
    expect(total).toBeGreaterThanOrEqual(60);
    expect(total).toBeLessThanOrEqual(80);
  });

  it('describes every room for whoever is looking at it', () => {
    for (const room of ROOMS) expect(room.description.length).toBeGreaterThan(80);
  });
});

describe.each(ROOMS.map((r) => [r.id, r] as const))('%s', (_id, room) => {
  it('is rectangular', () => {
    const { w } = gridSize(room.grid);
    for (const row of room.grid) expect(row).toHaveLength(w);
  });

  it('has a closed boundary, so nobody walks off the edge', () => {
    const { w, h } = gridSize(room.grid);
    for (let x = 0; x < w; x += 1) {
      expect(BOUNDARY.has(room.grid[0]![x]!)).toBe(true);
      expect(BOUNDARY.has(room.grid[h - 1]![x]!)).toBe(true);
    }
    for (const row of room.grid) {
      expect(BOUNDARY.has(row[0]!)).toBe(true);
      expect(BOUNDARY.has(row[w - 1]!)).toBe(true);
    }
  });

  it('uses no character that is not terrain or in its own legend', () => {
    for (const row of room.grid) {
      for (const ch of row) {
        expect(isTerrain(ch) || ch in room.legend).toBe(true);
      }
    }
  });

  it('places every object its legend declares', () => {
    const placed = new Set(placedObjects(room.grid, room.legend).map((p) => p.glyph));
    for (const glyph of Object.keys(room.legend)) expect(placed.has(glyph)).toBe(true);
  });

  it('has at least as many doors as connections', () => {
    const doors = [...room.grid.join('')].filter((c) => DOORS.has(c)).length;
    expect(doors).toBeGreaterThanOrEqual(room.connects.length);
    expect(doors).toBeGreaterThan(0);
  });

  it('connects only to rooms that exist, and is connected to in return', () => {
    for (const other of room.connects) {
      expect(ROOM_BY_ID[other]).toBeDefined();
      expect(ROOM_BY_ID[other].connects).toContain(room.id);
    }
  });

  it('never connects to itself', () => {
    expect(room.connects).not.toContain(room.id);
  });
});

describe('the habitat is one place', () => {
  it('can be walked from the Bridge to every other room', () => {
    const seen = new Set<RoomId>(['bridge']);
    const work: RoomId[] = ['bridge'];
    while (work.length) {
      const id = work.shift()!;
      for (const next of neighbours(id)) {
        if (!seen.has(next)) {
          seen.add(next);
          work.push(next);
        }
      }
    }
    expect(seen.size).toBe(16);
  });
});

describe('accessors', () => {
  it('finds the fabricator in the Workshops', () => {
    const names = roomObjects('workshops').map((o) => o.name);
    expect(names).toContain('the fabricator');
  });

  it('finds a door on the Great Wall', () => {
    expect(doorsOf(ROOM_BY_ID.greatwall).length).toBeGreaterThan(0);
  });

  it('leaves the Hollow empty, because that is the entry', () => {
    expect(roomObjects('hollow')).toHaveLength(0);
  });

  it('agrees with the terrain table about what a door is', () => {
    expect(TERRAIN['+'].walkable).toBe(true);
  });
});
