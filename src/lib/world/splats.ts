// The geometry of thrown paint.
//
// A splat is not a circle with a blur on it. Paint hits a surface with momentum
// and a direction, and what it leaves is a body pulled along that direction,
// a ragged crown of fingers where the surface tension gave out, a scatter of
// satellites thrown clear of the impact, and — because the board is a vertical
// slate — one or two runs heading down.
//
// All of it is generated from a seed, so a splat redraws identically forever
// while no two are alike.

import { mulberry32 } from './rng';

/** The colours in the gun, in the order the arrow keys walk them.
 *  Yellow first: it is the default, and it is the Physarum's colour. */
export const PAINT_COLORS = [
  { id: 'yellow', hex: '#f2c23c' },
  { id: 'rust', hex: '#c05a2a' },
  { id: 'ink', hex: '#1b2430' },
  { id: 'blue', hex: '#4a86c8' },
  { id: 'green', hex: '#5d9e63' },
  { id: 'bone', hex: '#efe7d4' },
  { id: 'magenta', hex: '#b8478b' },
] as const;

export type PaintColor = (typeof PAINT_COLORS)[number]['id'];

export function paintHex(id: string): string {
  return PAINT_COLORS.find((c) => c.id === id)?.hex ?? PAINT_COLORS[0].hex;
}

/** One mark of paint on the board.
 *
 *  `on` is what it landed on. Empty means bare slate, and the splat is painted
 *  under the paper. A card id means it is painted over the paper. An object id
 *  means it lives *inside* that object's element, so moving the object takes
 *  the paint with it. */
export type Splat = {
  id: string;
  /** Board coordinates when loose; local coordinates when `on` names an object. */
  x: number;
  y: number;
  color: string;
  seed: number;
  /** Radius of the main body, in board units. */
  r: number;
  /** Where the paint was travelling, in radians. */
  angle: number;
  on: string;
  layer: 'slate' | 'paper' | 'object';
  at: number;
};

type Blob = { d: string; drops: Array<{ x: number; y: number; r: number }>; drips: string[] };

const round = (n: number) => Math.round(n * 100) / 100;

/** The ragged outline of the main body: a closed curve through a ring of radii
 *  that the seed roughens, stretched along the direction of travel and pulled
 *  into fingers wherever the roughness spikes. */
export function splatBody(seed: number, r: number, angle: number): string {
  const rand = mulberry32(seed);
  const points = 26;
  const stretch = 1.18 + rand() * 0.5;
  const ring: Array<[number, number]> = [];
  // A few lobes rather than uniform noise: real paint bulges, it does not fuzz.
  const lobes = 2 + Math.floor(rand() * 3);
  const lobePhase = rand() * Math.PI * 2;
  const lobeDepth = 0.16 + rand() * 0.2;
  for (let i = 0; i < points; i += 1) {
    const t = (i / points) * Math.PI * 2;
    const lobe = Math.sin(t * lobes + lobePhase) * lobeDepth;
    const jitter = (rand() - 0.5) * 0.22;
    // Fingers: a handful of spikes where the paint kept going.
    const finger = rand() < 0.12 ? 0.35 + rand() * 0.55 : 0;
    const radius = r * (0.78 + lobe + jitter + finger);
    // Along the throw the body is longer; across it, narrower.
    const local = t - angle;
    const scale = Math.hypot(Math.cos(local) * stretch, Math.sin(local));
    ring.push([Math.cos(t) * radius * scale, Math.sin(t) * radius * scale]);
  }
  return closedCurve(ring);
}

/** A closed Catmull-Rom through the ring, emitted as cubic beziers, which is
 *  what turns a jagged polygon into something that reads as liquid. */
function closedCurve(points: Array<[number, number]>): string {
  const n = points.length;
  const at = (i: number) => points[((i % n) + n) % n];
  let d = `M${round(points[0][0])},${round(points[0][1])}`;
  for (let i = 0; i < n; i += 1) {
    const p0 = at(i - 1); const p1 = at(i); const p2 = at(i + 1); const p3 = at(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${round(c1x)},${round(c1y)} ${round(c2x)},${round(c2y)} ${round(p2[0])},${round(p2[1])}`;
  }
  return `${d}Z`;
}

/** Everything a splat is made of, from one seed. */
export function splatShape(seed: number, r: number, angle: number): Blob {
  const rand = mulberry32(seed ^ 0x9e3779b9);
  const drops: Array<{ x: number; y: number; r: number }> = [];
  const count = 5 + Math.floor(rand() * 9);
  for (let i = 0; i < count; i += 1) {
    // Satellites cluster in the throw direction and thin out with distance.
    const spread = (rand() - 0.5) * 1.5;
    const a = angle + spread;
    const dist = r * (1.05 + rand() * rand() * 2.4);
    drops.push({
      x: round(Math.cos(a) * dist),
      y: round(Math.sin(a) * dist),
      r: round(r * (0.05 + rand() * rand() * 0.24)),
    });
  }
  const drips: string[] = [];
  const dripCount = rand() < 0.72 ? 1 + Math.floor(rand() * 2) : 0;
  for (let i = 0; i < dripCount; i += 1) {
    const a = Math.PI / 2 + (rand() - 0.5) * 0.9;
    const sx = round(Math.cos(a) * r * 0.72);
    const sy = round(Math.sin(a) * r * 0.72);
    const len = round(r * (0.7 + rand() * 2.1));
    const w = round(r * (0.07 + rand() * 0.1));
    const bead = round(w * (1.3 + rand() * 0.8));
    // A tapering run with a bead at the end, which is how a drip actually ends.
    drips.push(
      `M${sx - w},${sy}`
      + `C${round(sx - w * 0.7)},${round(sy + len * 0.5)} ${round(sx - bead * 0.9)},${round(sy + len * 0.8)} ${sx},${round(sy + len)}`
      + `C${round(sx + bead * 0.9)},${round(sy + len * 0.8)} ${round(sx + w * 0.7)},${round(sy + len * 0.5)} ${sx + w},${sy}Z`,
    );
  }
  return { d: splatBody(seed, r, angle), drops, drips };
}

/** Make a mark. The radius and angle carry the shot's own randomness so two
 *  clicks in the same place never leave the same mark. */
export function makeSplat(input: {
  x: number; y: number; color: string; on: string; layer: Splat['layer']; angle?: number; scale?: number;
}): Splat {
  const seed = (Math.random() * 0xffffffff) >>> 0;
  const rand = mulberry32(seed);
  return {
    id: `s${seed.toString(36)}${(Date.now() % 100000).toString(36)}`,
    x: Math.round(input.x),
    y: Math.round(input.y),
    color: input.color,
    seed,
    r: Math.round((12 + rand() * 20) * (input.scale ?? 1)),
    angle: input.angle ?? rand() * Math.PI * 2,
    on: input.on,
    layer: input.layer,
    at: Date.now(),
  };
}
