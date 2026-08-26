// The night shift.
//
// Under the blacklight the board turns out to be staffed. This module is the
// crew's rulebook — where they are, what they are doing and what they will do
// next — with no rendering in it at all, so the whole of their behaviour can be
// reasoned about and tested without a browser.
//
// The rules are deliberately shallow. Nobody plans; everybody has a job, a
// place to be and a clock, and the traffic that emerges from thirty of those
// running at once is what reads as a crew rather than as thirty sprites. The
// one thing they all obey is the board: every station is a real object's real
// position, so when the visitor moves something the work follows it.

import { mulberry32 } from './rng';

/** What a worker does when it gets where it is going. Each job has its own
 *  tool, its own stance and its own idea of how long a job takes. */
export const JOBS = ['welder', 'sparks', 'porter', 'sweeper', 'surveyor', 'oiler', 'painter', 'inspector'] as const;
export type Job = (typeof JOBS)[number];

export type Mood =
  /** On the way somewhere. */
  | 'walk'
  /** At a station, working. */
  | 'work'
  /** Stopped, because somebody else stopped. */
  | 'talk'
  /** In the visitor's hand. */
  | 'held'
  /** Just been put down, and getting up. */
  | 'tumble';

/** Somewhere worth working: an object's footprint, in board units. */
export type Station = { id: string; x: number; y: number; w: number; h: number };

export type Worker = {
  id: number;
  job: Job;
  /** Board units. This is the point the feet stand on. */
  x: number;
  y: number;
  tx: number;
  ty: number;
  face: 1 | -1;
  mood: Mood;
  /** Milliseconds left in the current mood. */
  clock: number;
  /** Index of the station being worked, or -1 while crossing open board. */
  at: number;
  /** Gait phase, in radians, so the bob and the legs agree. */
  step: number;
  /** Carrying something. Porters mostly, but anyone can be handed a crate. */
  load: boolean;
  /** Spin left over from being dropped. */
  spin: number;
  /** Who they stopped to talk to, so a conversation has two ends. */
  with: number;
};

/** Board units per millisecond. A shade under fifty a second: busy, not manic. */
const SPEED = 0.048;
const CARRY_SPEED = 0.036;
/** How close counts as arrived. */
export const REACH = 3;
/** How near two walkers have to pass before they might stop and talk. */
export const CHAT = 26;

const WORK_MS: Record<Job, [number, number]> = {
  welder: [2600, 5200],
  sparks: [3000, 6000],
  porter: [1200, 2200],
  sweeper: [1800, 3400],
  surveyor: [3400, 6400],
  oiler: [2000, 3800],
  painter: [2800, 5600],
  inspector: [2200, 4200],
};

/** Where on a station a given job stands. Everyone works the perimeter — a
 *  worker standing in the middle of a card looks like a sprite that has fallen
 *  through the floor. */
function post(station: Station, job: Job, r: () => number): { x: number; y: number } {
  const pad = 6;
  const side = job === 'surveyor' ? 3 : Math.floor(r() * 4);
  const along = 0.18 + r() * 0.64;
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
  for (let i = 0; i < count; i += 1) {
    const job = JOBS[i % JOBS.length];
    const at = Math.floor(r() * stations.length);
    const spot = post(stations[at], job, r);
    crew.push({
      id: i,
      job,
      x: spot.x,
      y: spot.y,
      tx: spot.x,
      ty: spot.y,
      face: r() < 0.5 ? -1 : 1,
      mood: 'work',
      clock: 400 + r() * 4000,
      at,
      step: r() * Math.PI * 2,
      load: job === 'porter' && r() < 0.5,
      spin: 0,
      with: -1,
    });
  }
  return crew;
}

/** Send a worker off to a new job. Nearby stations are likelier than distant
 *  ones — a crew that teleports its attention across the whole board every few
 *  seconds reads as noise, not as work. */
export function reassign(worker: Worker, stations: Station[], r: () => number): void {
  if (stations.length === 0) return;
  let pick = Math.floor(r() * stations.length);
  // Three candidates, nearest wins — cheap, and enough to bias the traffic.
  for (let n = 0; n < 2; n += 1) {
    const other = Math.floor(r() * stations.length);
    const near = (i: number) => Math.hypot(stations[i].x - worker.x, stations[i].y - worker.y);
    if (near(other) < near(pick)) pick = other;
  }
  const spot = post(stations[pick], worker.job, r);
  worker.at = pick;
  worker.tx = spot.x;
  worker.ty = spot.y;
  worker.mood = 'walk';
  worker.clock = 0;
  worker.with = -1;
  // A porter picks its load up at one station and puts it down at the next.
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
      // Back on its feet, and straight to whatever is nearest.
      reassign(worker, stations, r);
    }
    return;
  }

  if (worker.mood === 'work' || worker.mood === 'talk') {
    worker.step += dt * 0.004;
    if (worker.clock <= 0) {
      if (worker.mood === 'talk') {
        worker.with = -1;
        worker.mood = 'walk';
      } else {
        reassign(worker, stations, r);
      }
    }
    return;
  }

  // Walking.
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

/** Two workers who pass close enough, both between jobs, stop for a moment.
 *  This is the only rule in the module that involves more than one of them, and
 *  it is most of what makes the board look inhabited. */
export function mingle(crew: Worker[], r: () => number): void {
  for (let i = 0; i < crew.length; i += 1) {
    const a = crew[i];
    if (a.mood !== 'walk') continue;
    for (let j = i + 1; j < crew.length; j += 1) {
      const b = crew[j];
      if (b.mood !== 'walk') continue;
      if (Math.abs(a.x - b.x) > CHAT || Math.abs(a.y - b.y) > CHAT) continue;
      if (Math.hypot(a.x - b.x, a.y - b.y) > CHAT) continue;
      if (r() > 0.012) continue;
      const span = 1400 + r() * 2200;
      a.mood = 'talk'; a.clock = span; a.with = b.id; a.face = a.x < b.x ? 1 : -1;
      b.mood = 'talk'; b.clock = span; b.with = a.id; b.face = b.x < a.x ? 1 : -1;
      break;
    }
  }
}

/** Put a worker down. It lands, rolls, gets up and finds the nearest job —
 *  which is the whole of "they readjust naturally". */
export function drop(worker: Worker, stations: Station[], r: () => number): void {
  worker.mood = 'tumble';
  worker.clock = 520 + r() * 260;
  worker.spin = (r() < 0.5 ? -1 : 1) * (180 + r() * 220);
  worker.load = false;
  worker.with = -1;
}

/** Keep everyone on the slate. */
export function corral(worker: Worker, width: number, height: number): void {
  const edge = 10;
  worker.x = Math.max(edge, Math.min(width - edge, worker.x));
  worker.y = Math.max(edge, Math.min(height - edge, worker.y));
}
