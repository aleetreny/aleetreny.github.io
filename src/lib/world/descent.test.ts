import { describe, expect, it } from 'vitest';
import {
  barycentric,
  createLandscape,
  descend,
  grad,
  landscapeStart,
  loss,
  OPTIMIZER_DOMAIN,
  STEP_CAP,
  type OptimizerState,
} from './descent';

const SEEDS = [7, 90210, 20260827, 0xf00dcafe];

describe('procedural loss landscapes', () => {
  it('replays a seed exactly while keeping every landscape deliberately strange', () => {
    for (const seed of SEEDS) {
      const first = createLandscape(seed);
      expect(createLandscape(seed)).toEqual(first);
      expect(first.gaussians).toHaveLength(8);
      expect(first.waves).toHaveLength(4);
      expect(first.rings).toHaveLength(2);
      expect(first.gaussians.filter((term) => term.amplitude < 0).length).toBeGreaterThanOrEqual(4);
      expect(first.gaussians.some((term) => term.amplitude > 0)).toBe(true);
      expect(Math.abs(first.twist)).toBeGreaterThanOrEqual(0.14);
    }
    expect(createLandscape(SEEDS[0])).not.toEqual(createLandscape(SEEDS[1]));
  });

  it('hands back the real gradient of every generated surface', () => {
    const h = 1e-5;
    for (const seed of SEEDS) {
      const landscape = createLandscape(seed);
      for (const u of [-0.83, -0.2, 0, 0.37, 0.91]) {
        for (const v of [-0.7, -0.11, 0.24, 0.88]) {
          const [gu, gv] = grad(u, v, landscape);
          const du = (loss(u + h, v, landscape) - loss(u - h, v, landscape)) / (2 * h);
          const dv = (loss(u, v + h, landscape) - loss(u, v - h, landscape)) / (2 * h);
          expect(gu, `∂u at ${u},${v} for ${seed}`).toBeCloseTo(du, 4);
          expect(gv, `∂v at ${u},${v} for ${seed}`).toBeCloseTo(dv, 4);
        }
      }
    }
  });

  it('starts on a shoulder and never lets the optimiser leave the visible sheet', () => {
    for (const seed of SEEDS) {
      const landscape = createLandscape(seed);
      const start = landscapeStart(landscape);
      expect(Math.hypot(start.u, start.v)).toBeGreaterThanOrEqual(0.7);
      let state: OptimizerState = { ...start, vu: 0, vv: 0 };
      for (let step = 0; step < 500; step += 1) {
        const next = descend(state, landscape, 0.055, 0.58);
        expect(Math.abs(next.u)).toBeLessThanOrEqual(OPTIMIZER_DOMAIN);
        expect(Math.abs(next.v)).toBeLessThanOrEqual(OPTIMIZER_DOMAIN);
        expect(Math.hypot(next.u - state.u, next.v - state.v)).toBeLessThanOrEqual(STEP_CAP + 1e-9);
        state = next;
      }
    }
  });

  it('keeps the default no-momentum stride slow enough to watch', () => {
    for (const seed of SEEDS) {
      const landscape = createLandscape(seed);
      const start = landscapeStart(landscape);
      const next = descend({ ...start, vu: 0, vv: 0 }, landscape, 0.012, 0);
      expect(Math.hypot(next.u - start.u, next.v - start.v)).toBeLessThanOrEqual(0.016);
    }
  });
});

describe('surface picking', () => {
  const a = { x: 0, y: 0 };
  const b = { x: 10, y: 0 };
  const c = { x: 0, y: 10 };

  it('returns exact triangle weights for a visible point', () => {
    const weights = barycentric({ x: 2, y: 3 }, a, b, c);
    expect(weights).not.toBeNull();
    expect(weights?.[0]).toBeCloseTo(0.5);
    expect(weights?.[1]).toBeCloseTo(0.2);
    expect(weights?.[2]).toBeCloseTo(0.3);
  });

  it('rejects points outside or on a degenerate triangle', () => {
    expect(barycentric({ x: 8, y: 8 }, a, b, c)).toBeNull();
    expect(barycentric({ x: 2, y: 0 }, a, { x: 5, y: 0 }, b)).toBeNull();
  });
});
