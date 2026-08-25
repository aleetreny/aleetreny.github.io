import { describe, expect, it } from 'vitest';
import { grad, loss, type Landscape } from './descent';

const KINDS: Landscape[] = ['bowl', 'ridges'];

describe('the loss surfaces', () => {
  it('hands back the real gradient, not a plausible one', () => {
    // The whole object is a demonstration of following ∇f. If the vector the
    // marble follows is not the gradient of the surface it is drawn on, the
    // tray is a lie with a nice shadow on it.
    const h = 1e-5;
    for (const kind of KINDS) {
      for (const u of [-0.83, -0.2, 0, 0.37, 0.91]) {
        for (const v of [-0.7, -0.11, 0.24, 0.88]) {
          const [gu, gv] = grad(u, v, kind);
          const du = (loss(u + h, v, kind) - loss(u - h, v, kind)) / (2 * h);
          const dv = (loss(u, v + h, kind) - loss(u, v - h, kind)) / (2 * h);
          expect(gu, `∂u at ${u},${v} on ${kind}`).toBeCloseTo(du, 4);
          expect(gv, `∂v at ${u},${v} on ${kind}`).toBeCloseTo(dv, 4);
        }
      }
    }
  });

  it('puts the bowl’s one minimum at the middle', () => {
    expect(loss(0, 0, 'bowl')).toBe(0);
    for (const [u, v] of [[0.3, 0], [0, 0.3], [-0.4, 0.2], [0.9, -0.9]] as const) {
      expect(loss(u, v, 'bowl')).toBeGreaterThan(0);
    }
    const [gu, gv] = grad(0, 0, 'bowl');
    expect(gu).toBe(0);
    expect(gv).toBe(0);
  });

  it('gives the ridged one somewhere else to end up', () => {
    // A landscape worth switching to is one where the answer depends on where
    // you dropped the marble: it needs more than one flat spot.
    const flats: Array<[number, number]> = [];
    for (let u = -0.98; u <= 0.98; u += 0.02) {
      for (let v = -0.98; v <= 0.98; v += 0.02) {
        const [gu, gv] = grad(u, v, 'ridges');
        if (Math.hypot(gu, gv) < 0.02) flats.push([u, v]);
      }
    }
    // Cluster them, so one basin is not counted a dozen times.
    const basins: Array<[number, number]> = [];
    for (const point of flats) {
      if (basins.every((b) => Math.hypot(b[0] - point[0], b[1] - point[1]) > 0.25)) basins.push(point);
    }
    expect(basins.length).toBeGreaterThan(1);
  });

  it('slopes back toward the middle from every edge', () => {
    // Whatever else it does, the tray has to be a tray: nothing may run
    // downhill off the side of it.
    for (const kind of KINDS) {
      for (const t of [-0.9, -0.4, 0.4, 0.9]) {
        expect(grad(0.99, t, kind)[0], `right edge on ${kind}`).toBeGreaterThan(0);
        expect(grad(-0.99, t, kind)[0], `left edge on ${kind}`).toBeLessThan(0);
        expect(grad(t, 0.99, kind)[1], `bottom edge on ${kind}`).toBeGreaterThan(0);
        expect(grad(t, -0.99, kind)[1], `top edge on ${kind}`).toBeLessThan(0);
      }
    }
  });
});
