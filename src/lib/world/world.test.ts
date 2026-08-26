import { describe, expect, it, vi } from 'vitest';
import {
  BASE_OBJECTS, DEFAULT_OBJECTS, OBJECT_KINDS, OBJECT_SPECS, hasTrait, parseObjects, parseObjectsOver,
} from './kinds';
import { PAINT_COLORS, makeSplat, paintHex, splatBody, splatShape } from './splats';
import { SPECIES, ago, growthOf, speciesOf } from './garden';
import { clampStampPosition, DEFAULT_STAMPS, parseStamps } from './passport';
import { ANSWER, BOOK_LENGTH, STEPS, bookMarks, bookPage } from './book';
import { hashString, mulberry32, remap } from './rng';

describe('the object catalogue', () => {
  it('ships every kind, laid out by the board rather than by the fallback', () => {
    expect(DEFAULT_OBJECTS).toHaveLength(OBJECT_KINDS.length);
    expect(new Set(DEFAULT_OBJECTS.map((o) => o.id)).size).toBe(OBJECT_KINDS.length);
    // The authored positions come from content/source, so they are not the
    // diagonal the fallback would have produced.
    expect(DEFAULT_OBJECTS).not.toEqual(BASE_OBJECTS);
    for (const object of DEFAULT_OBJECTS) expect(object.visible).toBe(true);
  });

  it('keeps everything on the slate', () => {
    // 4120 x 2500, which is what content/source/board-spec.mjs authors.
    for (const object of DEFAULT_OBJECTS) {
      const spec = OBJECT_SPECS[object.id];
      expect(object.x).toBeGreaterThanOrEqual(0);
      expect(object.y).toBeGreaterThanOrEqual(0);
      expect(object.x + spec.w * object.scale).toBeLessThanOrEqual(4120);
      expect(object.y + spec.h * object.scale).toBeLessThanOrEqual(2500);
    }
  });

  it('gives the loose things a body and leaves the fixed ones alone', () => {
    for (const id of ['coin', 'die', 'camera', 'paintgun', 'lorenz', 'hourglass'] as const) {
      expect(hasTrait(id, 'physics')).toBe(true);
      expect(hasTrait(id, 'blackhole')).toBe(true);
    }
    // The hole is the one thing on the desk that is not furniture.
    expect(hasTrait('blackhole', 'draggable')).toBe(false);
    expect(hasTrait('blackhole', 'physics')).toBe(false);
    // The garden and the flower are planted, not loose.
    expect(hasTrait('garden', 'gravity')).toBe(false);
    expect(hasTrait('flower', 'gravity')).toBe(false);
  });

  it('lets the hole eat anything a hand can pick up, and nothing that is bolted down', () => {
    // Two things on this board are fixed: the hole, which pulls, and the mains
    // switch the lights are on — a switch that could be carried into the hole
    // would take the lights with it. Everything else is loose, and everything
    // loose is edible.
    const bolted: readonly string[] = ['blackhole', 'uvswitch'];
    for (const id of OBJECT_KINDS) {
      if (bolted.includes(id)) {
        expect(hasTrait(id, 'draggable'), `${id} bolted`).toBe(false);
        expect(hasTrait(id, 'blackhole'), `${id} edible`).toBe(false);
        continue;
      }
      expect(hasTrait(id, 'draggable'), `${id} draggable`).toBe(true);
      expect(hasTrait(id, 'blackhole'), `${id} edible`).toBe(true);
    }
  });

  it('merges a stored catalogue over the shipped one', () => {
    const stored = parseObjects([
      { id: 'coin', x: 10, y: 20, rot: 5, scale: 1.5, visible: false },
      { id: 'ghost', x: 0, y: 0 },
    ]);
    const coin = stored.find((o) => o.id === 'coin')!;
    expect(coin).toEqual({ id: 'coin', x: 10, y: 20, rot: 5, scale: 1.5, visible: false });
    // Everything the stored document never mentioned still arrives.
    expect(stored).toHaveLength(OBJECT_KINDS.length);
    expect(stored.find((o) => o.id === 'book')).toEqual(DEFAULT_OBJECTS.find((o) => o.id === 'book'));
    expect(stored.some((o) => (o.id as string) === 'ghost')).toBe(false);
  });

  it('clamps nonsense and falls through to the base for a non-document', () => {
    const [coin] = parseObjectsOver(
      [{ id: 'coin', x: 1, y: 2, rot: 3, scale: 1, visible: true }],
      [{ id: 'coin', x: 'no', y: NaN, rot: 900, scale: 99, visible: 'yes' }],
    );
    expect(coin).toEqual({ id: 'coin', x: 1, y: 2, rot: 180, scale: 2.4, visible: true });
    expect(parseObjects(null)).toEqual(DEFAULT_OBJECTS);
    expect(parseObjects('objects')).toEqual(DEFAULT_OBJECTS);
  });
});

describe('thrown paint', () => {
  it('is never the same mark twice, and always a closed curve', () => {
    const a = splatBody(1, 20, 0);
    const b = splatBody(2, 20, 0);
    expect(a).not.toBe(b);
    expect(a.startsWith('M')).toBe(true);
    expect(a.endsWith('Z')).toBe(true);
    // Same seed, same mark, forever.
    expect(splatBody(1, 20, 0)).toBe(a);
  });

  it('throws satellites and hangs drips', () => {
    const shape = splatShape(12345, 24, 0.4);
    expect(shape.drops.length).toBeGreaterThanOrEqual(5);
    for (const drop of shape.drops) expect(drop.r).toBeGreaterThan(0);
    // Drips run downward, which on a vertical slate is the only way they run.
    for (const drip of shape.drips) expect(drip.startsWith('M')).toBe(true);
  });

  it('knows its colours, and falls back to the yellow it is loaded with', () => {
    expect(paintHex('yellow')).toBe(PAINT_COLORS[0].hex);
    expect(paintHex('nonsense')).toBe(PAINT_COLORS[0].hex);
  });

  it('records where a shot landed and on what', () => {
    const splat = makeSplat({ x: 12.4, y: 88.6, color: 'rust', on: 'passport', layer: 'object' });
    expect(splat).toMatchObject({ x: 12, y: 89, color: 'rust', on: 'passport', layer: 'object' });
    expect(splat.r).toBeGreaterThan(0);
  });
});

describe('the garden', () => {
  it('grows on the clock, not on the tab', () => {
    const sunflower = speciesOf('sunflower');
    const planted = new Date('2026-01-01T00:00:00Z').toISOString();
    const day = 24 * 3600_000;
    const at = (d: number) => new Date(Date.parse(planted) + d * day).getTime();
    // Watered as it goes, so nothing is held back by drought.
    const water = (d: number) => new Date(at(d)).toISOString();

    expect(growthOf(sunflower, planted, water(0), at(0.1)).up).toBe(false);
    expect(growthOf(sunflower, planted, water(1), at(1)).up).toBe(true);
    const early = growthOf(sunflower, planted, water(2), at(2)).stage;
    const later = growthOf(sunflower, planted, water(6), at(6)).stage;
    expect(later).toBeGreaterThan(early);
    expect(growthOf(sunflower, planted, water(30), at(30)).ripe).toBe(true);
  });

  it('slows a thirsty plant without ever killing it', () => {
    const basil = speciesOf('basil');
    const planted = new Date('2026-01-01T00:00:00Z').toISOString();
    const now = Date.parse(planted) + 8 * 24 * 3600_000;
    const kept = growthOf(basil, planted, new Date(now).toISOString(), now);
    const forgotten = growthOf(basil, planted, planted, now);
    expect(forgotten.stage).toBeLessThan(kept.stage);
    expect(forgotten.stage).toBeGreaterThan(0);
    expect(forgotten.moisture).toBe(0);
    expect(kept.moisture).toBeGreaterThan(0.9);
  });

  it('keeps the species in the order a gardener would expect', () => {
    // A lettuce is up and done before a sunflower has decided anything.
    expect(speciesOf('lettuce').grow).toBeLessThan(speciesOf('sunflower').grow);
    expect(SPECIES.every((s) => s.germ < s.grow)).toBe(true);
    expect(speciesOf('nothing-like-this').id).toBe(SPECIES[0].id);
  });

  it('says how long ago in the fewest words that are still true', () => {
    const now = Date.parse('2026-06-01T12:00:00Z');
    expect(ago(new Date(now - 5 * 60_000).toISOString(), now)).toBe('5m');
    expect(ago(new Date(now - 5 * 3600_000).toISOString(), now)).toBe('5h');
    expect(ago(new Date(now - 5 * 24 * 3600_000).toISOString(), now)).toBe('5d');
  });
});

describe('the passport', () => {
  it('ships a stamp for every country, on numbered leaves', () => {
    expect(DEFAULT_STAMPS.length).toBeGreaterThan(15);
    for (const stamp of DEFAULT_STAMPS) {
      expect(stamp.code).toMatch(/^[A-Z]{2,3}$/);
      expect(stamp.page).toBeGreaterThanOrEqual(1);
      expect(stamp.x).toBeGreaterThan(0);
      expect(stamp.y).toBeGreaterThan(0);
      // No generated travel copy, ever. The words are their owner's to write.
      expect(stamp.note).toBe('');
    }
    // Never a grid: four to a leaf, all at different angles.
    expect(new Set(DEFAULT_STAMPS.map((s) => s.rot)).size).toBeGreaterThan(10);
  });

  it('reads a stored document and returns exactly what it holds', () => {
    expect(parseStamps(null)).toEqual([]);
    expect(parseStamps([])).toEqual([]);
    const [stamp] = parseStamps([{ code: 'jp', place: 'Japan', page: 3, x: 500, rot: 900, ink: 'gold' }]);
    expect(stamp.code).toBe('JP');
    expect(stamp.x).toBe(88);
    expect(stamp.rot).toBe(180);
    expect(stamp.ink).toBe('violet');
  });

  it('accepts the expanded ink palette and keeps rotated stamps inside a leaf', () => {
    const [stamp] = parseStamps([{ code: 'jp', place: 'Japan', ink: 'sapphire' }]);
    expect(stamp.ink).toBe('sapphire');

    const position = clampStampPosition('rect', 45, 100, 100, 180, 220);
    expect(position.x).toBeLessThan(100);
    expect(position.y).toBeLessThan(100);
    expect(clampStampPosition('round', 0, -20, -20, 180, 220)).toEqual({ x: 0, y: 0 });
  });
});

describe('the borrowed copy', () => {
  it('is as long as the print edition, and knows where the answer is', () => {
    expect(BOOK_LENGTH).toBe(227);
    expect(bookMarks()).toContain(ANSWER);
    for (const n of bookMarks()) expect(n).toBeGreaterThanOrEqual(1);
    for (const n of bookMarks()) expect(n).toBeLessThanOrEqual(BOOK_LENGTH);
    expect(bookMarks()).toEqual([...bookMarks()].sort((a, b) => a - b));
  });

  it('has no page until its file has landed, and never one off the end', () => {
    // Nothing has been fetched in this process, so every leaf is still coming.
    expect(bookPage(1)).toBeNull();
    expect(bookPage(0)).toBeNull();
    expect(bookPage(BOOK_LENGTH + 1)).toBeNull();
  });

  it('offers type sizes largest first', () => {
    expect(STEPS[0]).toBeGreaterThan(STEPS[STEPS.length - 1]);
    for (let i = 1; i < STEPS.length; i += 1) expect(STEPS[i]).toBeLessThan(STEPS[i - 1]);
  });
});

describe('deterministic randomness', () => {
  it('gives the same sequence for the same seed', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const first = [a(), a(), a()];
    expect(first).toEqual([b(), b(), b()]);
    for (const value of first) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
    expect(mulberry32(8)()).not.toBe(first[0]);
  });

  it('hashes a string to a stable 32-bit seed', () => {
    expect(hashString('paraguay')).toBe(hashString('paraguay'));
    expect(hashString('paraguay')).not.toBe(hashString('norway'));
    expect(hashString('')).toBeGreaterThanOrEqual(0);
  });

  it('remaps and clamps at both ends', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(-4, 0, 10, 0, 100)).toBe(0);
    expect(remap(40, 0, 10, 0, 100)).toBe(100);
    expect(remap(3, 2, 2, 7, 9)).toBe(7);
  });
});

describe('the shared frame loop', () => {
  it('starts on the first subscriber and stops on the last', async () => {
    let handle = 0;
    const pending: FrameRequestCallback[] = [];
    const raf = vi.fn((cb: FrameRequestCallback) => { pending.push(cb); return ++handle; });
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { addFrame } = await import('./frame');

    // Nothing is scheduled until something asks.
    expect(raf).not.toHaveBeenCalled();

    const seen: string[] = [];
    const stopA = addFrame(() => seen.push('a'));
    const stopB = addFrame(() => seen.push('b'));
    // Two subscribers, one loop.
    expect(raf).toHaveBeenCalledTimes(1);

    pending.shift()?.(16.7);
    expect(seen).toEqual(['a', 'b']);
    // The loop re-arms itself while anything is still subscribed.
    expect(raf).toHaveBeenCalledTimes(2);

    stopA();
    pending.shift()?.(33.4);
    expect(seen).toEqual(['a', 'b', 'b']);

    stopB();
    // The last one to let go cancels the frame in flight, and nothing re-arms.
    expect(cancel).toHaveBeenCalled();
    const scheduled = raf.mock.calls.length;
    pending.shift()?.(50);
    expect(raf.mock.calls.length).toBe(scheduled);

    vi.unstubAllGlobals();
  });

  it('drops a callback that throws rather than taking the board down with it', async () => {
    const pending: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => { pending.push(cb); return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { addFrame } = await import('./frame');

    let good = 0;
    addFrame(() => { throw new Error('a toy went wrong'); });
    const stop = addFrame(() => { good += 1; });
    pending.shift()?.(16.7);
    // The one that threw is gone; the one beside it is untouched.
    expect(good).toBe(1);
    pending.shift()?.(33.4);
    expect(good).toBe(2);
    expect(spy).toHaveBeenCalledOnce();

    stop();
    spy.mockRestore();
    vi.unstubAllGlobals();
  });
});
