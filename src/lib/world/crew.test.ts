// The night shift, checked without a browser.
//
// Everything the crew does is arithmetic on a handful of numbers, which is the
// point of keeping it out of the component: a worker that walks through the
// edge of the board, or a conversation with only one end to it, is a bug that
// can be caught here rather than by staring at thirty-eight glowing dots.

import { describe, expect, it } from 'vitest';
import {
  CHAT, JOBS, REACH, corral, drop, driveCars, hire, mingle, reassign, stepWorker, traffic,
  type Station, type Worker,
} from './crew';
import { mulberry32 } from './rng';

const posts: Station[] = [
  { id: 'a', x: 100, y: 100, w: 200, h: 150, where: 'site', damage: 0.1 },
  { id: 'b', x: 900, y: 400, w: 180, h: 180, where: 'site', damage: 0.8 },
  { id: 'c', x: 1600, y: 900, w: 240, h: 160, where: 'site', damage: 0 },
];
const world = { x: 0, y: 0, w: 4120, h: 2500 };
const roll = () => mulberry32(9);

describe('hiring', () => {
  it('gives everyone a trade and a place to be, the same way twice', () => {
    const many = JOBS.length * 2;
    const one = hire(many, posts);
    const two = hire(many, posts);
    expect(one).toHaveLength(many);
    expect(one).toEqual(two);
    for (const worker of one) expect(JOBS).toContain(worker.job);
    // Every trade turns up for a shift big enough to hold one of each.
    expect(new Set(one.map((w) => w.job)).size).toBe(JOBS.length);
  });

  it("keeps the town's people out of the site and the site's out of the town", () => {
    const mixed: Station[] = [
      ...posts,
      { id: 't1', x: -900, y: -900, w: 120, h: 20, where: 'town', damage: 0.2 },
      { id: 't2', x: 5200, y: 3100, w: 120, h: 20, where: 'town', damage: 0.2 },
    ];
    const crew = hire(60, mixed);
    expect(crew.some((w) => w.where === 'town')).toBe(true);
    expect(crew.some((w) => w.where === 'site')).toBe(true);
    const r = roll();
    for (const worker of crew) {
      const before = worker.where;
      reassign(worker, mixed, r);
      expect(worker.where).toBe(before);
      expect(mixed[worker.at].where).toBe(before);
    }
  });

  it('sends more people to whatever is worst broken', () => {
    const r = roll();
    let worst = 0;
    for (let i = 0; i < 200; i += 1) {
      const worker = hire(1, posts)[0];
      worker.x = 0; worker.y = 0;
      reassign(worker, posts, r);
      if (posts[worker.at].id === 'b') worst += 1;
    }
    // 'b' is the far one and the broken one; damage has to beat distance.
    expect(worst).toBeGreaterThan(80);
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
    clock: 0, at: 0, step: 0, load: false, spin: 0, with: -1,
    where: 'site', seed: 0.5, ...over,
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
      where: 'site', seed: 0.5,
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
    const stand = (id: number, x: number, mood: Worker['mood']): Worker => ({
      id, job: 'oiler', x, y: 0, tx: 0, ty: 0, face: 1, mood, clock: mood === 'work' ? 90 : 0,
      at: 0, step: 0, load: false, spin: 0, with: -1, where: 'site', seed: 0.5,
    });
    // One too far to reach, and one already head-down in a job.
    const far = [stand(0, 0, 'walk'), stand(1, CHAT * 4, 'walk'), stand(2, 1, 'work')];
    mingle(far, () => 0);
    expect(far.map((w) => w.mood)).toEqual(['walk', 'walk', 'work']);
  });

  it('keeps everyone on the slate however hard they are thrown', () => {
    const worker: Worker = {
      id: 0, job: 'sweeper', x: -900, y: 90_000, tx: 0, ty: 0, face: 1, mood: 'walk',
      clock: 0, at: 0, step: 0, load: false, spin: 0, with: -1, where: 'site', seed: 0.5,
    };
    corral(worker, world);
    expect(worker.x).toBeGreaterThanOrEqual(world.x);
    expect(worker.x).toBeLessThanOrEqual(world.x + world.w);
    expect(worker.y).toBeGreaterThanOrEqual(world.y);
    expect(worker.y).toBeLessThanOrEqual(world.y + world.h);
  });

  it('gathers a third person into a conversation rather than pairing off again', () => {
    const stand = (id: number, x: number, mood: Worker['mood']): Worker => ({
      id, job: 'oiler', x, y: 0, tx: 9999, ty: 0, face: 1, mood, clock: mood === 'walk' ? 0 : 900,
      at: 0, step: 0, load: false, spin: 0, with: -1, where: 'site', seed: 0.5,
    });
    const crew = [stand(0, 0, 'talk'), stand(1, 4, 'talk'), stand(2, 8, 'walk')];
    mingle(crew, () => 0);
    expect(crew[2].mood).toBe('huddle');
  });

  it('drives the traffic round its lane and never off the end of it', () => {
    const cars = traffic(20, 4);
    expect(cars).toHaveLength(20);
    for (const car of cars) expect(car.lane).toBeLessThan(4);
    driveCars(cars, 100_000);
    for (const car of cars) {
      expect(car.t).toBeGreaterThanOrEqual(0);
      expect(car.t).toBeLessThanOrEqual(1);
    }
  });

  it('survives the board being emptied under its feet', () => {
    const worker = hire(1, posts)[0];
    worker.mood = 'work';
    worker.clock = -1;
    expect(() => stepWorker(worker, 16, [], roll())).not.toThrow();
  });
});
