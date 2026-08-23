import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TOUR,
  buildStops,
  easingCss,
  easingFn,
  isNarrow,
  markTourSeen,
  motionSample,
  parseTour,
  resolveCamera,
  revealDirection,
  revealKeyframes,
  revealSequence,
  splitStops,
  tourAlreadySeen,
  type TourItem,
} from './tour';

const items: TourItem[] = [
  { id: 'hero', x: 110, y: 110, w: 620, label: 'Alejandro Treny' },
  { id: 'now', x: 790, y: 130, w: 400, label: 'currently', group: 'now', groupLabel: 'Now' },
  { id: 'work', x: 110, y: 640, w: 620, label: 'Where the numbers had consequences', group: 'work', groupLabel: 'Paid work' },
  { id: 'vol', x: 790, y: 598, w: 400, label: 'Rooms I helped fill up', group: 'vol', groupLabel: 'Unpaid' },
  { id: 'travel', x: 1250, y: 1100, w: 450, label: 'Places that rearranged me', group: 'travel', groupLabel: 'Field log' },
];

/** Deterministic stand-in for Math.random in the shuffling routes. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('tour config parsing', () => {
  it('ships the eight authored stops from the fixture', () => {
    expect(DEFAULT_TOUR.route).toBe('custom');
    expect(DEFAULT_TOUR.stops).toHaveLength(8);
    expect(DEFAULT_TOUR.stops[0]).toEqual({ id: 'stop-1', label: 'the person, first', items: ['hero', 'now'] });
    expect(DEFAULT_TOUR.stops[7].items).toContain('note-3');
  });

  it('keeps the handoff timings as defaults', () => {
    expect(DEFAULT_TOUR.camera.firstDuration).toBe(950);
    expect(DEFAULT_TOUR.camera.duration).toBe(760);
    expect(DEFAULT_TOUR.reveal.duration).toBe(560);
    expect(DEFAULT_TOUR.reveal.stagger).toBe(150);
    expect(DEFAULT_TOUR.intro.hold).toBe(340);
    expect(DEFAULT_TOUR.intro.duration).toBe(640);
    expect(DEFAULT_TOUR.intro.settle).toBe(420);
    expect(DEFAULT_TOUR.intro.studStagger).toBe(55);
  });

  it('frames a stop closer than the handoff did, on both screen sizes', () => {
    // The handoff's 70px inflate and 1.05 ceiling left cards small enough to
    // squint at; these are the numbers that opened them up.
    expect(DEFAULT_TOUR.camera.inflate).toBeLessThan(70);
    expect(DEFAULT_TOUR.camera.maxScale).toBeGreaterThan(1.05);
    expect(DEFAULT_TOUR.camera.padX).toBeLessThanOrEqual(60);
    expect(DEFAULT_TOUR.mobile.inflate).toBeLessThan(DEFAULT_TOUR.camera.inflate);
    expect(DEFAULT_TOUR.mobile.padX).toBeLessThan(DEFAULT_TOUR.camera.padX);
    // Bottom padding still has to clear the tour bar on each.
    expect(DEFAULT_TOUR.camera.padBottom).toBeGreaterThan(120);
    expect(DEFAULT_TOUR.mobile.padBottom).toBeGreaterThan(120);
  });

  it('merges a partial document over the defaults', () => {
    const tour = parseTour({ speed: 1.6, camera: { motion: 'arc' }, bar: { hint: 'go on' } });
    expect(tour.speed).toBe(1.6);
    expect(tour.camera.motion).toBe('arc');
    expect(tour.camera.duration).toBe(DEFAULT_TOUR.camera.duration);
    expect(tour.bar.hint).toBe('go on');
    expect(tour.bar.nextLabel).toBe(DEFAULT_TOUR.bar.nextLabel);
    expect(tour.stops).toEqual(DEFAULT_TOUR.stops);
  });

  it('rejects unknown enums and clamps out-of-range numbers', () => {
    const tour = parseTour({ route: 'nonsense', speed: 99, camera: { easing: 'boing', maxScale: -4 } });
    expect(tour.route).toBe(DEFAULT_TOUR.route);
    expect(tour.speed).toBe(3);
    expect(tour.camera.easing).toBe(DEFAULT_TOUR.camera.easing);
    expect(tour.camera.maxScale).toBe(0.2);
  });

  it('drops malformed stops instead of failing', () => {
    const tour = parseTour({ stops: [{ label: 'ok', items: ['hero', 7] }, 'nope', { items: [] }] });
    expect(tour.stops).toEqual([
      { id: 'stop-1', label: 'ok', items: ['hero'] },
      { id: 'stop-2', label: '', items: [] },
    ]);
  });

  it('falls back to the defaults for a non-document', () => {
    expect(parseTour(null)).toEqual(DEFAULT_TOUR);
    expect(parseTour('tour')).toEqual(DEFAULT_TOUR);
  });
});

describe('route building', () => {
  it('keeps a hand-authored route and drops items that no longer exist', () => {
    const tour = parseTour({
      route: 'custom',
      includeRest: false,
      stops: [
        { id: 'a', label: 'first', items: ['hero', 'ghost'] },
        { id: 'b', label: 'gone', items: ['ghost'] },
      ],
    });
    expect(buildStops(tour, items)).toEqual([{ id: 'a', label: 'first', items: ['hero'] }]);
  });

  it('sweeps unassigned pieces into a trailing stop', () => {
    const tour = parseTour({ route: 'custom', groupSize: 4, stops: [{ id: 'a', label: 'first', items: ['hero'] }] });
    const stops = buildStops(tour, items);
    expect(stops).toHaveLength(2);
    expect(stops[1].id).toBe('rest-1');
    expect(stops[1].items).toEqual(['now', 'work', 'vol', 'travel']);
  });

  it('never leaves the board hidden when the authored route is stale', () => {
    const tour = parseTour({ route: 'custom', stops: [{ id: 'a', label: 'x', items: ['ghost'] }] });
    const stops = buildStops(tour, items);
    expect(stops.flatMap((stop) => stop.items).sort()).toEqual(['hero', 'now', 'travel', 'vol', 'work']);
  });

  it('builds one stop per list, then the loose pieces', () => {
    const tour = parseTour({ route: 'lists', groupSize: 4 });
    const stops = buildStops(tour, items);
    expect(stops.map((stop) => stop.label)).toEqual(['Now', 'Paid work', 'Unpaid', 'Field log', 'Alejandro Treny']);
    expect(stops[0].items).toEqual(['now']);
  });

  it('walks columns left to right, top to bottom inside each', () => {
    const tour = parseTour({ route: 'columns', groupSize: 4 });
    const stops = buildStops(tour, items);
    expect(stops.map((stop) => stop.items)).toEqual([['hero', 'work'], ['now', 'vol'], ['travel']]);
  });

  it('walks rows top to bottom, left to right inside each', () => {
    const tour = parseTour({ route: 'rows', groupSize: 4 });
    expect(buildStops(tour, items).map((stop) => stop.items)).toEqual([['hero', 'now'], ['work', 'vol'], ['travel']]);
  });

  it('chunks a reading order by the configured stop size', () => {
    const tour = parseTour({ route: 'reading', groupSize: 2 });
    const stops = buildStops(tour, items);
    expect(stops).toHaveLength(3);
    expect(stops[0].items).toEqual(['hero', 'now']);
  });

  it('gives every piece its own stop in solo', () => {
    const stops = buildStops(parseTour({ route: 'solo' }), items);
    expect(stops).toHaveLength(items.length);
    expect(stops.every((stop) => stop.items.length === 1)).toBe(true);
  });

  it('covers the whole board for every generated route', () => {
    for (const route of ['lists', 'columns', 'rows', 'reading', 'spiral', 'clock', 'random', 'solo'] as const) {
      const stops = buildStops(parseTour({ route, groupSize: 2 }), items, seeded(7));
      const covered = stops.flatMap((stop) => stop.items).sort();
      expect(covered, route).toEqual(['hero', 'now', 'travel', 'vol', 'work']);
      expect(stops.every((stop) => stop.label.length > 0), route).toBe(true);
    }
  });

  it('returns nothing for an empty board', () => {
    expect(buildStops(DEFAULT_TOUR, [])).toEqual([]);
  });
});

describe('narrow screens', () => {
  it('only adapts at or below the breakpoint, and never when switched off', () => {
    const tour = parseTour({ mobile: { breakpoint: 720 } });
    expect(isNarrow(tour, 390)).toBe(true);
    expect(isNarrow(tour, 720)).toBe(true);
    expect(isNarrow(tour, 721)).toBe(false);
    expect(isNarrow(parseTour({ mobile: { enabled: false } }), 320)).toBe(false);
  });

  it('swaps in the phone framing but keeps the chosen motion', () => {
    const tour = parseTour({ camera: { motion: 'swoop', easing: 'outExpo' } });
    const wide = resolveCamera(tour, false);
    const narrow = resolveCamera(tour, true);
    expect(wide).toBe(tour.camera);
    expect(narrow.motion).toBe('swoop');
    expect(narrow.easing).toBe('outExpo');
    expect(narrow.duration).toBe(tour.camera.duration);
    expect(narrow.padX).toBe(tour.mobile.padX);
    expect(narrow.inflate).toBe(tour.mobile.inflate);
    expect(narrow.padX).toBeLessThan(tour.camera.padX);
  });

  it('walks a long stop a few pieces at a time under the same heading', () => {
    const stops = splitStops(DEFAULT_TOUR.stops, 1);
    // Nothing is dropped and nothing is reordered.
    expect(stops.flatMap((s) => s.items)).toEqual(DEFAULT_TOUR.stops.flatMap((s) => s.items));
    expect(stops.every((s) => s.items.length === 1)).toBe(true);
    // One stop per piece, whatever the authored route currently holds — the
    // count is the board's business, not this test's.
    expect(stops).toHaveLength(DEFAULT_TOUR.stops.flatMap((s) => s.items).length);
    expect(stops[0].label).toBe('the person, first');
    expect(stops[1].label).toBe('the person, first');
    expect(new Set(stops.map((s) => s.id)).size).toBe(stops.length);
  });

  it('leaves short stops and a nonsense cap alone', () => {
    expect(splitStops(DEFAULT_TOUR.stops, 5).slice(0, 4)).toEqual(DEFAULT_TOUR.stops.slice(0, 4));
    expect(splitStops(DEFAULT_TOUR.stops, 0)).toBe(DEFAULT_TOUR.stops);
  });
});

describe('motion maths', () => {
  it('runs the handoff camera curve analytically', () => {
    const ease = easingFn('inOutCubic');
    expect(ease(0)).toBe(0);
    expect(ease(0.5)).toBeCloseTo(0.5, 6);
    expect(ease(1)).toBe(1);
    expect(ease(0.25)).toBeCloseTo(0.0625, 6);
  });

  it('samples a bezier easing between its endpoints', () => {
    const ease = easingFn('outSoft');
    expect(ease(0)).toBeCloseTo(0, 3);
    expect(ease(1)).toBeCloseTo(1, 3);
    expect(ease(0.5)).toBeGreaterThan(0.5);
    expect(easingCss('outSoft')).toBe('cubic-bezier(.17,.85,.2,1)');
  });

  it('lands every motion exactly on the target', () => {
    for (const motion of ['glide', 'arc', 'swoop', 'push', 'pull', 'drift', 'spring', 'cut'] as const) {
      const camera = { ...DEFAULT_TOUR.camera, motion };
      const end = motionSample(camera, 1);
      expect(end.pan, motion).toBeCloseTo(1, 6);
      expect(end.zoom, motion).toBeCloseTo(1, 6);
      expect(end.lift, motion).toBeCloseTo(0, 6);
      expect(end.dip, motion).toBeCloseTo(1, 6);
    }
  });

  it('lifts on the arc and pulls back on the swoop, mid-flight only', () => {
    const arc = motionSample({ ...DEFAULT_TOUR.camera, motion: 'arc' }, 0.5);
    expect(arc.lift).toBeCloseTo(-DEFAULT_TOUR.camera.arc, 6);
    const swoop = motionSample({ ...DEFAULT_TOUR.camera, motion: 'swoop' }, 0.5);
    expect(swoop.dip).toBeCloseTo(1 - DEFAULT_TOUR.camera.swoop, 6);
  });

  it('moves the pan ahead of the zoom on push, and behind it on pull', () => {
    const camera = DEFAULT_TOUR.camera;
    const push = motionSample({ ...camera, motion: 'push' }, 0.4);
    expect(push.pan).toBeGreaterThan(push.zoom);
    const pull = motionSample({ ...camera, motion: 'pull' }, 0.4);
    expect(pull.zoom).toBeGreaterThan(pull.pan);
  });

  it('holds still until the very end on a cut', () => {
    expect(motionSample({ ...DEFAULT_TOUR.camera, motion: 'cut' }, 0.99).pan).toBe(0);
  });
});

describe('item reveals', () => {
  it('finishes every style on the item’s own inline rotation', () => {
    for (const style of ['stick', 'drop', 'rise', 'zoom', 'flip', 'swing', 'slam'] as const) {
      const frames = revealKeyframes({ ...DEFAULT_TOUR.reveal, style }, -1.2, 1);
      expect(frames.at(-1)?.transform, style).toBe('rotate(-1.2deg) scale(1)');
    }
  });

  it('leaves the transform alone for the styles that only fade', () => {
    for (const style of ['fade', 'none'] as const) {
      const frames = revealKeyframes({ ...DEFAULT_TOUR.reveal, style }, 3, -1);
      expect(frames.every((frame) => frame.transform === undefined), style).toBe(true);
    }
  });

  it('drops the blur when it is turned off', () => {
    const frames = revealKeyframes({ ...DEFAULT_TOUR.reveal, blur: 0 }, 0, 1);
    expect(frames[0].filter).toBe('blur(0px)');
  });

  it('throws an item the same way every run', () => {
    expect(revealDirection('hero', 0)).toBe(revealDirection('hero', 0));
    expect(revealDirection('hero', 0)).toBe(-revealDirection('hero', 1));
  });

  it('orders a stop forwards, backwards or shuffled', () => {
    expect(revealSequence(3, 'sequence')).toEqual([0, 1, 2]);
    expect(revealSequence(3, 'reverse')).toEqual([2, 1, 0]);
    expect(revealSequence(3, 'together')).toEqual([0, 1, 2]);
    expect(revealSequence(4, 'random', seeded(3)).sort()).toEqual([0, 1, 2, 3]);
  });
});

describe('replay memory', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  const fakeStorage = () => {
    const jar = new Map<string, string>();
    return {
      getItem: (key: string) => jar.get(key) ?? null,
      setItem: (key: string, value: string) => { jar.set(key, value); },
    } as unknown as Storage;
  };

  it('remembers a session run separately from a permanent one', () => {
    const session = fakeStorage();
    const local = fakeStorage();
    vi.stubGlobal('window', { sessionStorage: session, localStorage: local });

    expect(tourAlreadySeen('session')).toBe(false);
    markTourSeen('session');
    expect(tourAlreadySeen('session')).toBe(true);
    expect(tourAlreadySeen('once')).toBe(false);

    markTourSeen('once');
    expect(tourAlreadySeen('once')).toBe(true);
  });

  it('never remembers when the tour is set to play every visit', () => {
    vi.stubGlobal('window', { sessionStorage: fakeStorage(), localStorage: fakeStorage() });
    markTourSeen('always');
    expect(tourAlreadySeen('always')).toBe(false);
  });

  it('degrades to replaying when the storage jar is blocked', () => {
    vi.stubGlobal('window', {
      get sessionStorage(): Storage { throw new Error('blocked'); },
      get localStorage(): Storage { throw new Error('blocked'); },
    });
    expect(() => markTourSeen('once')).not.toThrow();
    expect(tourAlreadySeen('once')).toBe(false);
  });
});
