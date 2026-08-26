// The night shift, checked without a browser.
//
// Everything the crew does is arithmetic on a handful of numbers, which is the
// point of keeping it out of the component: a worker that walks through the
// edge of the board, or a conversation with only one end to it, is a bug that
// can be caught here rather than by staring at thirty-eight glowing dots.

import { describe, expect, it } from 'vitest';
import {
  CHAT, JOBS, REACH, corral, drop, hire, mingle, reassign, stepWorker,
  type Station, type Worker,
} from './crew';
import { mulberry32 } from './rng';

const posts: Station[] = [
  { id: 'a', x: 100, y: 100, w: 200, h: 150 },
  { id: 'b', x: 900, y: 400, w: 180, h: 180 },
  { id: 'c', x: 1600, y: 900, w: 240, h: 160 },
];
const roll = () => mulberry32(9);

describe('hiring', () => {
  it('gives everyone a trade and a place to be, the same way twice', () => {
    const one = hire(12, posts);
    const two = hire(12, posts);
    expect(one).toHaveLength(12);
    expect(one).toEqual(two);
    for (const worker of one) expect(JOBS).toContain(worker.job);
    expect(new Set(one.map((w) => w.job)).size).toBe(JOBS.length);
  });

  it('starts nobody on top of the thing they are working on', () => {
    for (const worker of hire(24, posts)) {
      const inside = posts.some((p) => (
        worker.x > p.x + 2 && worker.x < p.x + p.w - 2 && worker.y > p.y + 2 && worker.y < p.y + p.h - 2
      ));
      expect(inside).toBe(false);
    }
  });

  it('is an empty shift when there is nothing on the board to maintain', () => {
    expect(hire(10, [])).toEqual([]);
  });
});

describe("a worker's day", () => {
  const walker = (over: Partial<Worker> = {}): Worker => ({
    id: 0, job: 'welder', x: 0, y: 0, tx: 300, ty: 0, face: 1, mood: 'walk',
    clock: 0, at: 0, step: 0, load: false, spin: 0, with: -1, ...over,
  });

  it('walks towards where it is going, and turns to face it', () => {
    const worker = walker({ x: 300, tx: 0, face: 1 });
    stepWorker(worker, 100, posts, roll());
    expect(worker.x).toBeLessThan(300);
    expect(worker.face).toBe(-1);
    expect(worker.y).toBe(0);
  });

  it('starts work when it arrives, and not before', () => {
    const worker = walker({ x: 0, tx: 400 });
    stepWorker(worker, 100, posts, roll());
    expect(worker.mood).toBe('walk');
    worker.x = worker.tx - REACH / 2;
    stepWorker(worker, 16, posts, roll());
    expect(worker.mood).toBe('work');
    expect(worker.clock).toBeGreaterThan(0);
  });

  it('never overshoots its own target', () => {
    const worker = walker({ x: 0, tx: 4, ty: 0 });
    stepWorker(worker, 10_000, posts, roll());
    expect(worker.x).toBeLessThanOrEqual(4);
  });

  it('takes a new job when the clock runs out', () => {
    const worker = walker({ mood: 'work', clock: 40, at: 0 });
    stepWorker(worker, 100, posts, roll());
    expect(worker.mood).toBe('walk');
    expect(worker.clock).toBe(0);
  });

  it('carries something to the next station and leaves it there', () => {
    const worker = walker({ job: 'porter', load: false });
    const r = roll();
    reassign(worker, posts, r);
    expect(worker.load).toBe(true);
    reassign(worker, posts, r);
    expect(worker.load).toBe(false);
  });

  it('stands still while it is being held', () => {
    const worker = walker({ mood: 'held', x: 55, y: 66 });
    stepWorker(worker, 500, posts, roll());
    expect([worker.x, worker.y]).toEqual([55, 66]);
  });

  it('gets up after being put down, and goes back to work', () => {
    const worker = walker({ mood: 'work', load: true });
    drop(worker, posts, roll());
    expect(worker.mood).toBe('tumble');
    expect(worker.load).toBe(false);
    expect(Math.abs(worker.spin)).toBeGreaterThan(100);
    stepWorker(worker, 2000, posts, roll());
    expect(worker.mood).toBe('walk');
    expect(worker.spin).toBe(0);
  });
});

describe('the two-ended rules', () => {
  it('stops both halves of a conversation, or neither', () => {
    const near = (id: number, x: number): Worker => ({
      id, job: 'oiler', x, y: 0, tx: 9999, ty: 0, face: 1, mood: 'walk',
      clock: 0, at: 0, step: 0, load: false, spin: 0, with: -1,
    });
    const crew = [near(0, 0), near(1, CHAT / 3)];
    // Certain to fire: the roll is compared against a small probability.
    mingle(crew, () => 0);
    expect(crew[0].mood).toBe('talk');
    expect(crew[1].mood).toBe('talk');
    expect(crew[0].with).toBe(1);
    expect(crew[1].with).toBe(0);
    expect(crew[0].clock).toBe(crew[1].clock);
    // And they look at each other.
    expect(crew[0].face).toBe(1);
    expect(crew[1].face).toBe(-1);
  });

  it('leaves people alone who are too far apart, or already busy', () => {
    const far: Worker[] = [
      { id: 0, job: 'oiler', x: 0, y: 0, tx: 0, ty: 0, face: 1, mood: 'walk', clock: 0, at: 0, step: 0, load: false, spin: 0, with: -1 },
      { id: 1, job: 'oiler', x: CHAT * 3, y: 0, tx: 0, ty: 0, face: 1, mood: 'walk', clock: 0, at: 0, step: 0, load: false, spin: 0, with: -1 },
      { id: 2, job: 'oiler', x: 1, y: 0, tx: 0, ty: 0, face: 1, mood: 'work', clock: 90, at: 0, step: 0, load: false, spin: 0, with: -1 },
    ];
    mingle(far, () => 0);
    expect(far.map((w) => w.mood)).toEqual(['walk', 'walk', 'work']);
  });

  it('keeps everyone on the slate however hard they are thrown', () => {
    const worker: Worker = { id: 0, job: 'sweeper', x: -900, y: 90_000, tx: 0, ty: 0, face: 1, mood: 'walk', clock: 0, at: 0, step: 0, load: false, spin: 0, with: -1 };
    corral(worker, 4120, 2500);
    expect(worker.x).toBeGreaterThanOrEqual(0);
    expect(worker.x).toBeLessThanOrEqual(4120);
    expect(worker.y).toBeGreaterThanOrEqual(0);
    expect(worker.y).toBeLessThanOrEqual(2500);
  });

  it('survives the board being emptied under its feet', () => {
    const worker = hire(1, posts)[0];
    worker.mood = 'work';
    worker.clock = -1;
    expect(() => stepWorker(worker, 16, [], roll())).not.toThrow();
  });
});
