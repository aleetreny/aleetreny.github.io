// Procedural loss landscapes and the small optimiser that walks over them.
//
// A useful gradient-descent figure should not always be the same polite bowl.
// These landscapes deliberately mix wells, bumps, waves and a bounded edge,
// but remain analytic: the marker follows the real gradient of the exact
// surface being drawn. The optimiser is kept here too so its speed and its
// boundary guarantees can be tested without a canvas.

import { clamp, mulberry32 } from './rng';

export const OPTIMIZER_DOMAIN = 0.94;
export const GRADIENT_CAP = 1.28;
export const STEP_CAP = 0.082;

export type Gaussian = {
  u: number;
  v: number;
  amplitude: number;
  sigma: number;
};

export type Wave = {
  u: number;
  v: number;
  amplitude: number;
  frequency: number;
  phase: number;
};

export type Ring = {
  u: number;
  v: number;
  amplitude: number;
  radius: number;
  sigma: number;
};

export type Landscape = {
  seed: number;
  angle: number;
  axisU: number;
  axisV: number;
  cross: number;
  twist: number;
  wall: number;
  tiltU: number;
  tiltV: number;
  hue: number;
  gaussians: Gaussian[];
  waves: Wave[];
  rings: Ring[];
};

export type OptimizerState = {
  u: number;
  v: number;
  vu: number;
  vv: number;
};

export type ScreenPoint = { x: number; y: number };

const range = (random: () => number, lo: number, hi: number) => lo + random() * (hi - lo);

/** The same seed gives the same strange landscape, useful for both replay and
 *  tests. Four guaranteed wells and at least one bump prevent a tame bowl. */
export function createLandscape(seed: number): Landscape {
  const stableSeed = seed >>> 0 || 1;
  const random = mulberry32(stableSeed);
  const gaussianPhase = range(random, 0, Math.PI * 2);
  const gaussians: Gaussian[] = Array.from({ length: 8 }, (_unused, index) => {
    const angle = gaussianPhase + (index / 8) * Math.PI * 2 + range(random, -0.24, 0.24);
    const radius = range(random, 0.24, 0.64);
    const well = index % 2 === 0;
    return {
      u: Math.cos(angle) * radius,
      v: Math.sin(angle) * radius,
      amplitude: (well ? -1 : 1) * range(random, well ? 0.56 : 0.38, well ? 0.96 : 0.78),
      sigma: range(random, 0.1, 0.2),
    };
  });

  const waves: Wave[] = Array.from({ length: 4 }, () => {
    const angle = range(random, 0, Math.PI * 2);
    return {
      u: Math.cos(angle),
      v: Math.sin(angle),
      amplitude: range(random, 0.06, 0.125) * (random() < 0.5 ? -1 : 1),
      frequency: range(random, 3.1, 6.1),
      phase: range(random, 0, Math.PI * 2),
    };
  });
  const rings: Ring[] = Array.from({ length: 2 }, (_unused, index) => ({
    u: range(random, -0.22, 0.22),
    v: range(random, -0.22, 0.22),
    amplitude: (index === 0 ? -1 : 1) * range(random, 0.32, 0.58),
    radius: range(random, 0.26, 0.5),
    sigma: range(random, 0.065, 0.12),
  }));

  return {
    seed: stableSeed,
    angle: range(random, 0, Math.PI),
    axisU: range(random, 0.012, 0.045),
    axisV: range(random, 0.018, 0.055),
    cross: range(random, -0.12, 0.12),
    twist: range(random, 0.14, 0.28) * (random() < 0.5 ? -1 : 1),
    wall: range(random, 0.025, 0.07),
    tiltU: range(random, -0.065, 0.065),
    tiltV: range(random, -0.065, 0.065),
    hue: range(random, 184, 292),
    gaussians,
    waves,
    rings,
  };
}

/** A repeatable starting point on the shoulder of a landscape, far enough
 *  from the centre that the first run has a path worth watching. */
export function landscapeStart(landscape: Landscape): { u: number; v: number } {
  const random = mulberry32(landscape.seed ^ 0x9e3779b9);
  const angle = range(random, 0, Math.PI * 2);
  const radius = range(random, 0.7, 0.88);
  return { u: Math.cos(angle) * radius, v: Math.sin(angle) * radius };
}

/** The exact surface. The high even-power wall keeps its interesting interior
 *  while turning up sharply only near the perimeter. */
export function loss(u: number, v: number, landscape: Landscape): number {
  const cos = Math.cos(landscape.angle);
  const sin = Math.sin(landscape.angle);
  const x = u * cos + v * sin;
  const y = -u * sin + v * cos;
  let value = landscape.axisU * x * x
    + landscape.axisV * y * y
    + landscape.cross * x * y
    + landscape.twist * (x ** 3 - 3 * x * y * y)
    + landscape.wall * (u ** 12 + v ** 12)
    + landscape.tiltU * u
    + landscape.tiltV * v;

  for (const gaussian of landscape.gaussians) {
    const du = u - gaussian.u;
    const dv = v - gaussian.v;
    value += gaussian.amplitude * Math.exp(-(du * du + dv * dv) / (2 * gaussian.sigma ** 2));
  }
  for (const wave of landscape.waves) {
    const phase = wave.frequency * (wave.u * u + wave.v * v) + wave.phase;
    value += wave.amplitude * Math.sin(phase);
  }
  for (const ring of landscape.rings) {
    const du = u - ring.u;
    const dv = v - ring.v;
    const distance = Math.hypot(du, dv);
    const offset = distance - ring.radius;
    value += ring.amplitude * Math.exp(-(offset * offset) / (2 * ring.sigma ** 2));
  }
  return value;
}

/** Analytic gradient of {@link loss}. */
export function grad(u: number, v: number, landscape: Landscape): [number, number] {
  const cos = Math.cos(landscape.angle);
  const sin = Math.sin(landscape.angle);
  const x = u * cos + v * sin;
  const y = -u * sin + v * cos;
  const dx = 2 * landscape.axisU * x + landscape.cross * y
    + 3 * landscape.twist * (x * x - y * y);
  const dy = 2 * landscape.axisV * y + landscape.cross * x
    - 6 * landscape.twist * x * y;
  let gu = dx * cos - dy * sin + 12 * landscape.wall * u ** 11 + landscape.tiltU;
  let gv = dx * sin + dy * cos + 12 * landscape.wall * v ** 11 + landscape.tiltV;

  for (const gaussian of landscape.gaussians) {
    const du = u - gaussian.u;
    const dv = v - gaussian.v;
    const sigma2 = gaussian.sigma ** 2;
    const bump = gaussian.amplitude * Math.exp(-(du * du + dv * dv) / (2 * sigma2));
    gu -= (bump * du) / sigma2;
    gv -= (bump * dv) / sigma2;
  }
  for (const wave of landscape.waves) {
    const phase = wave.frequency * (wave.u * u + wave.v * v) + wave.phase;
    const slope = wave.amplitude * wave.frequency * Math.cos(phase);
    gu += slope * wave.u;
    gv += slope * wave.v;
  }
  for (const ring of landscape.rings) {
    const du = u - ring.u;
    const dv = v - ring.v;
    const distance = Math.hypot(du, dv);
    if (distance < 1e-8) continue;
    const offset = distance - ring.radius;
    const value = ring.amplitude * Math.exp(-(offset * offset) / (2 * ring.sigma ** 2));
    const radial = -(value * offset) / (ring.sigma ** 2 * distance);
    gu += radial * du;
    gv += radial * dv;
  }
  return [gu, gv];
}

/** One stable, bounded optimiser step. Clipping the gradient changes only the
 *  visual stride, not its direction; clipping the final position means the
 *  marker can never protrude beyond the drawn sheet. */
export function descend(
  state: OptimizerState,
  landscape: Landscape,
  rate: number,
  momentum: number,
): OptimizerState {
  const [rawU, rawV] = grad(state.u, state.v, landscape);
  const magnitude = Math.hypot(rawU, rawV);
  const gradientScale = magnitude > GRADIENT_CAP ? GRADIENT_CAP / magnitude : 1;
  let vu = momentum * state.vu - rate * rawU * gradientScale;
  let vv = momentum * state.vv - rate * rawV * gradientScale;
  const speed = Math.hypot(vu, vv);
  if (speed > STEP_CAP) {
    const scale = STEP_CAP / speed;
    vu *= scale;
    vv *= scale;
  }

  const rawNextU = state.u + vu;
  const rawNextV = state.v + vv;
  const u = clamp(rawNextU, -OPTIMIZER_DOMAIN, OPTIMIZER_DOMAIN);
  const v = clamp(rawNextV, -OPTIMIZER_DOMAIN, OPTIMIZER_DOMAIN);
  if (u !== rawNextU) vu = 0;
  if (v !== rawNextV) vv = 0;
  return { u, v, vu, vv };
}

/** Barycentric hit test used to map a tap to the visible triangle under it.
 *  Unlike reversing the 3-D projection, it remains exact when the surface
 *  folds over itself. */
export function barycentric(
  point: ScreenPoint,
  a: ScreenPoint,
  b: ScreenPoint,
  c: ScreenPoint,
): [number, number, number] | null {
  const denominator = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
  if (Math.abs(denominator) < 1e-8) return null;
  const wa = ((b.y - c.y) * (point.x - c.x) + (c.x - b.x) * (point.y - c.y)) / denominator;
  const wb = ((c.y - a.y) * (point.x - c.x) + (a.x - c.x) * (point.y - c.y)) / denominator;
  const wc = 1 - wa - wb;
  const tolerance = -1e-5;
  return wa >= tolerance && wb >= tolerance && wc >= tolerance ? [wa, wb, wc] : null;
}
