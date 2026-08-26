// The night shift.
//
// Under the blacklight the board turns out to be staffed, and so does the city
// around it. This module is the whole crew's rulebook — where everybody is,
// what they are doing and what they will do next — with no rendering in it at
// all, so their behaviour can be reasoned about and tested without a browser.
//
// The rules are deliberately shallow. Nobody plans; everybody has a trade, a
// place to be and a clock, and the traffic that emerges from two hundred of
// those running at once is what reads as a city rather than as two hundred
// sprites. What they will not do is wander off: every station is a real
// object's, or a real card's, real position, so when the visitor moves
// something the work follows it.

import { mulberry32 } from './rng';

/** What a worker does when it gets where it is going. */
export const JOBS = [
  'welder', 'sparks', 'porter', 'sweeper', 'surveyor', 'oiler', 'painter',
  'inspector', 'mason', 'glazier', 'roofer', 'signaller', 'digger', 'medic',
] as const;
export type Job = (typeof JOBS)[number];

export type Mood =
  /** On the way somewhere. */
  | 'walk'
  /** At a station, working. */
  | 'work'
  /** Stopped, because somebody else stopped. */
  | 'talk'
  /** Standing in a huddle of three or more. */
  | 'huddle'
  /** In the visitor's hand. */
  | 'held'
  /** Just been put down, and getting up. */
  | 'tumble';

/** Somewhere worth working. Objects and cards on the board are `site`; the
 *  city around it is `town`, and its people never cross onto the board. */
export type Station = {
  id: string;
  x: number; y: number; w: number; h: number;
  where: 'site' | 'town';
  /** How broken it is, 0–1. The worst ones draw a crowd. */
  damage: number;
};

export type Worker = {
  id: number;
  job: Job;
  /** Board units. This is the point the feet stand on. */
  x: number; y: number;
  tx: number; ty: number;
  face: 1 | -1;
  mood: Mood;
  /** Milliseconds left in the current mood. */
  clock: number;
  /** Index of the station being worked, or -1 while crossing open ground. */
  at: number;
  /** Gait phase, in radians, so the bob and the legs agree. */
  step: number;
  load: boolean;
  spin: number;
  /** Who they stopped with. -1 when alone. */
  with: number;
  /** Which half of the world they belong to. */
  where: 'site' | 'town';
  /** Small per-worker jitter so a crowd is not a rank. */
  seed: number;
};

/** Something on a road, going somewhere. */
export type Car = {
  lane: number;
  /** How far along its lane, 0–1. */
  t: number;
  speed: number;
  kind: 0 | 1 | 2 | 3;
  tint: number;
};

/** Board units per millisecond. A shade under fifty a second: busy, not manic. */
const SPEED = 0.048;
const CARRY_SPEED = 0.036;
export const REACH = 3;
/** How near two walkers have to pass before they might stop and talk. */
export const CHAT = 26;
/** A station this broken gets a gang rather than one worker. */
export const BAD = 0.62;

const WORK_MS: Record<Job, [number, number]> = {
  welder: [2600, 5200], sparks: [3000, 6000], porter: [1200, 2200],
  sweeper: [1800, 3400], surveyor: [3400, 6400], oiler: [2000, 3800],
  painter: [2800, 5600], inspector: [2200, 4200], mason: [3200, 6200],
  glazier: [2600, 5000], roofer: [3000, 5800], signaller: [1800, 3600],
  digger: [3400, 6600], medic: [1600, 3200],
};

/** Where on a station a given job stands. Everyone works the perimeter — a
 *  worker standing in the middle of a card looks like a sprite that has fallen
 *  through the floor. */
function post(station: Station, job: Job, r: () => number): { x: number; y: number } {
  const pad = 6;
  const side = job === 'surveyor' ? 3 : job === 'roofer' ? 0 : Math.floor(r() * 4);
  const along = 0.14 + r() * 0.72;
  if (side === 0) return { x: station.x + station.w * along, y: station.y - pad };
  if (side === 1) return { x: station.x + station.w + pad, y: station.y + station.h * along };
  if (side === 2) return { x: station.x + station.w * along, y: station.y + station.h + pad };
  return { x: station.x - pad, y: station.y + station.h * along };
}

/** Build a shift. Deterministic for a given seed, so the same board is staffed
 *  the same way twice and a screenshot can be compared with a screenshot. */
export function hire(count: number, stations: Station[], seed = 424242): Worker[] {
  const r = mulberry32(seed);
  const crew: Worker[] = [];
  if (stations.length === 0) return crew;
  const site = stations.filter((s) => s.where === 'site');
  const town = stations.filter((s) => s.where === 'town');
  for (let i = 0; i < count; i += 1) {
    // Two thirds on the board, a third out in the city.
    const onSite = town.length === 0 || i % 3 !== 2;
    const pool = onSite && site.length > 0 ? site : town.length > 0 ? town : stations;
    const job = JOBS[i % JOBS.length];
    const pick = pool[Math.floor(r() * pool.length)];
    const at = stations.indexOf(pick);
    const spot = post(pick, job, r);
    crew.push({
      id: i,
      job,
      x: spot.x, y: spot.y, tx: spot.x, ty: spot.y,
      face: r() < 0.5 ? -1 : 1,
      mood: 'work',
      clock: 400 + r() * 4000,
      at,
      step: r() * Math.PI * 2,
      load: job === 'porter' && r() < 0.5,
      spin: 0,
      with: -1,
      where: pick.where,
      seed: r(),
    });
  }
  return crew;
}

/** Put traffic on the roads. */
export function traffic(count: number, lanes: number, seed = 8080): Car[] {
  const r = mulberry32(seed);
  const cars: Car[] = [];
  if (lanes === 0) return cars;
  for (let i = 0; i < count; i += 1) {
    cars.push({
      lane: Math.floor(r() * lanes),
      t: r(),
      speed: 0.00006 + r() * 0.00011,
      kind: Math.floor(r() * 4) as Car['kind'],
      tint: Math.floor(r() * 5),
    });
  }
  return cars;
}

/** Send a worker off to a new job, in its own half of the world. Nearby
 *  stations are likelier than distant ones, and a badly broken one is likelier
 *  than a sound one — which is what puts a gang round the worst of them. */
export function reassign(worker: Worker, stations: Station[], r: () => number): void {
  if (stations.length === 0) return;
  const want = (i: number) => {
    const s = stations[i];
    if (s.where !== worker.where) return -1e9;
    const far = Math.hypot(s.x - worker.x, s.y - worker.y);
    return s.damage * 2200 - far;
  };
  let pick = Math.floor(r() * stations.length);
  for (let n = 0; n < 3; n += 1) {
    const other = Math.floor(r() * stations.length);
    if (want(other) > want(pick)) pick = other;
  }
  if (stations[pick].where !== worker.where) return;
  const spot = post(stations[pick], worker.job, r);
  worker.at = pick;
  worker.tx = spot.x;
  worker.ty = spot.y;
  worker.mood = 'walk';
  worker.clock = 0;
  worker.with = -1;
  if (worker.job === 'porter') worker.load = !worker.load;
}

/** One tick of one worker's own business, before anybody else is considered. */
export function stepWorker(worker: Worker, dt: number, stations: Station[], r: () => number): void {
  worker.clock -= dt;
  if (worker.mood === 'held') return;

  if (worker.mood === 'tumble') {
    worker.spin *= 0.9;
    if (worker.clock <= 0) {
      worker.spin = 0;
      reassign(worker, stations, r);
    }
    return;
  }

  if (worker.mood === 'work' || worker.mood === 'talk' || worker.mood === 'huddle') {
    worker.step += dt * 0.004;
    if (worker.clock <= 0) {
      if (worker.mood === 'work') { reassign(worker, stations, r); return; }
      worker.with = -1;
      worker.mood = 'walk';
    }
    return;
  }

  const dx = worker.tx - worker.x;
  const dy = worker.ty - worker.y;
  const gap = Math.hypot(dx, dy);
  if (gap <= REACH) {
    worker.mood = 'work';
    const [lo, hi] = WORK_MS[worker.job];
    worker.clock = lo + r() * (hi - lo);
    return;
  }
  const rate = worker.load ? CARRY_SPEED : SPEED;
  const travel = Math.min(gap, rate * dt);
  worker.x += (dx / gap) * travel;
  worker.y += (dy / gap) * travel;
  if (Math.abs(dx) > 1) worker.face = dx < 0 ? -1 : 1;
  // The gait is tied to distance covered, not to time, so a worker carrying
  // something takes the same length of stride at a slower pace.
  worker.step += travel * 0.42;
}

/** Two workers who pass close enough stop for a moment, and a third who walks
 *  into a pair joins them. This is the only rule that involves more than one of
 *  them, and it is most of what makes the place look inhabited.
 *
 *  It runs against a coarse grid rather than every pair: two hundred workers is
 *  twenty thousand pairs a frame, and the grid makes it a few hundred. */
export function mingle(crew: Worker[], r: () => number): void {
  const cell = CHAT;
  const grid = new Map<number, number[]>();
  const key = (x: number, y: number) => ((Math.floor(x / cell) & 0xffff) << 16) | (Math.floor(y / cell) & 0xffff);
  for (let i = 0; i < crew.length; i += 1) {
    const w = crew[i];
    if (w.mood !== 'walk' && w.mood !== 'talk' && w.mood !== 'huddle') continue;
    const k = key(w.x, w.y);
    const bucket = grid.get(k);
    if (bucket) bucket.push(i); else grid.set(k, [i]);
  }
  for (let i = 0; i < crew.length; i += 1) {
    const a = crew[i];
    if (a.mood !== 'walk') continue;
    for (let ox = -1; ox <= 1; ox += 1) {
      for (let oy = -1; oy <= 1; oy += 1) {
        const bucket = grid.get(key(a.x + ox * cell, a.y + oy * cell));
        if (!bucket) continue;
        for (const j of bucket) {
          if (j === i) continue;
          const b = crew[j];
          if (a.mood !== 'walk') break;
          if (b.mood === 'held' || b.mood === 'tumble' || b.mood === 'work') continue;
          if (Math.hypot(a.x - b.x, a.y - b.y) > CHAT) continue;
          // Joining a conversation is easier than starting one.
          const odds = b.mood === 'walk' ? 0.014 : 0.09;
          if (r() > odds) continue;
          const span = 1600 + r() * 2600;
          a.mood = b.mood === 'walk' ? 'talk' : 'huddle';
          a.clock = span;
          a.with = b.id;
          a.face = a.x < b.x ? 1 : -1;
          if (b.mood === 'walk') {
            b.mood = 'talk';
            b.clock = span;
            b.with = a.id;
            b.face = b.x < a.x ? 1 : -1;
          } else {
            b.mood = 'huddle';
            b.clock = Math.max(b.clock, span);
          }
        }
      }
    }
  }
}

/** Move the traffic along. One tick for all of it, so the caller never has to
 *  reach into a car itself. */
export function driveCars(cars: Car[], dt: number): void {
  for (const car of cars) {
    // Wrapped rather than decremented: the shared loop clamps dt to forty-eight
    // milliseconds so one lap is all it could ever be, but a function that is
    // only correct for small steps is a function waiting for a slow frame.
    car.t = (car.t + car.speed * dt) % 1;
  }
}

/** Put a worker down. It lands, rolls, gets up and finds the nearest job. */
export function drop(worker: Worker, _stations: Station[], r: () => number): void {
  worker.mood = 'tumble';
  worker.clock = 520 + r() * 260;
  worker.spin = (r() < 0.5 ? -1 : 1) * (180 + r() * 220);
  worker.load = false;
  worker.with = -1;
}

/** Keep everyone inside the world. */
export function corral(worker: Worker, world: { x: number; y: number; w: number; h: number }): void {
  const edge = 10;
  worker.x = Math.max(world.x + edge, Math.min(world.x + world.w - edge, worker.x));
  worker.y = Math.max(world.y + edge, Math.min(world.y + world.h - edge, worker.y));
}
