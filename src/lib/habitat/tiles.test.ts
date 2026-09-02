import { describe, expect, it } from 'vitest';
import { ROOMS } from './rooms';
import { PALETTE, SHAPES, personColours, shapeOf, shapedCount } from './tiles';

describe('every object knows what it looks like', () => {
  it('gives a shape to every glyph in every room legend', () => {
    for (const room of ROOMS) {
      for (const glyph of Object.keys(room.legend)) {
        expect(shapeOf(room.id, glyph), `${room.id}:${glyph}`).not.toBeNull();
      }
    }
  });

  it('invents no shape for a glyph the room does not have', () => {
    for (const room of ROOMS) {
      for (const glyph of Object.keys(SHAPES[room.id])) {
        expect(room.legend[glyph], `${room.id}:${glyph}`).toBeDefined();
      }
    }
  });

  it('covers every object in every room, and there are ninety of them', () => {
    // Sixty-five across sixteen rooms became ninety across twenty-seven, when the
    // eleven homes became rooms of their own. The count is asserted so that adding
    // an object without giving it a shape fails here rather than silently.
    const total = ROOMS.reduce((n, r) => n + Object.keys(r.legend).length, 0);
    expect(shapedCount()).toBe(total);
    expect(total).toBe(90);
  });

  it('leaves the Hollow with nothing to draw', () => {
    expect(Object.keys(SHAPES.hollow)).toHaveLength(0);
  });

  it('gives the Great Wall a dressed face and nothing on it', () => {
    expect(shapeOf('greatwall', 'W')).toBe('surface');
    // Nowhere else has one, because nowhere else has a wall worth naming.
    const surfaces = ROOMS.flatMap((r) => Object.entries(SHAPES[r.id])
      .filter(([, shape]) => shape === 'surface')
      .map(([glyph]) => `${r.id}:${glyph}`));
    expect(surfaces).toEqual(['greatwall:W']);
  });

  it('puts a pinned sheet in the Common, unsigned since day eighty-nine', () => {
    expect(shapeOf('common', 'P')).toBe('mark');
  });

  it('tells a taped berth from an untaped one, which is the whole point of that room', () => {
    expect(shapeOf('berths', 'n')).toBe('berth-named');
    expect(shapeOf('berths', 'b')).toBe('berth');
    expect(shapeOf('berths', 'q')).toBe('berth');
  });

  it('gives every one of the eleven homes a bed of its own', () => {
    // A dwelling used to be one glyph inside a single Diggings room. Each of the
    // six diggings and five cabins is now a room you can walk into, so the thing
    // to check is that every one of them actually holds a bed.
    const homes = ['cabin1', 'cabin2', 'cabin3', 'cabin4', 'cabin5',
      'dig1', 'dig2', 'dig3', 'dig4', 'dig5', 'dig6'] as const;
    expect(homes).toHaveLength(11);
    for (const id of homes) {
      expect(Object.values(SHAPES[id]), id).toContain('bunk');
    }
  });
});

describe('the two materials', () => {
  it('keeps the hull cold and the rock warm', () => {
    expect(PALETTE.hull.light).not.toBe(PALETTE.rock.light);
    for (const side of ['hull', 'rock'] as const) {
      for (const value of Object.values(PALETTE[side])) {
        expect(value).toMatch(/^(#[0-9a-f]{6}|rgba\()/i);
      }
    }
  });
});

describe('telling people apart', () => {
  it('gives all twenty-five a different body colour', () => {
    const ids = Array.from({ length: 25 }, (_, i) => String.fromCharCode(65 + i));
    const bodies = ids.map((id) => personColours(id).body);
    expect(new Set(bodies).size).toBe(25);
  });

  it('is stable, so nobody changes colour between visits', () => {
    expect(personColours('J')).toEqual(personColours('J'));
  });
});
