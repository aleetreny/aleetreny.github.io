// The two surfaces the marble is dropped onto, and their gradients.
//
// Kept out of the component because they are the thing being demonstrated:
// gradient descent follows ∇f, so if ∇f is not really the gradient of f then
// the tray is a lie with a nice shadow on it. The test beside this file checks
// both against a finite difference, and checks that the minima are where the
// picture says they are.
//
// Both surfaces are written over the square −1…1 in each direction, so the
// numbers read as maths and the pixels are the tray's problem.

export type Landscape = 'bowl' | 'ridges';

/** Four wells of different depths in a shallow bowl. The bowl is what keeps
 *  everything on the tray; the wells are what make it matter where the marble
 *  was dropped. */
const WELLS: Array<{ u: number; v: number; a: number }> = [
  { u: -0.46, v: -0.42, a: 0.62 },
  { u: 0.52, v: -0.36, a: 0.44 },
  { u: -0.36, v: 0.52, a: 0.5 },
  { u: 0.56, v: 0.5, a: 0.36 },
];
const SIGMA2 = 0.34 * 0.34;

/** The surface. Both are smooth, both have a floor, and only one of them has
 *  just the one. */
export function loss(u: number, v: number, kind: Landscape): number {
  if (kind === 'bowl') return 0.9 * u * u + 1.35 * v * v + 0.28 * u * v;
  let f = 0.35 * (u * u + v * v) + 0.62;
  for (const well of WELLS) {
    const du = u - well.u;
    const dv = v - well.v;
    f -= well.a * Math.exp(-(du * du + dv * dv) / (2 * SIGMA2));
  }
  return f;
}

/** Its gradient, by hand: cheaper and steadier than a finite difference, and
 *  the whole object is about this vector. */
export function grad(u: number, v: number, kind: Landscape): [number, number] {
  if (kind === 'bowl') return [1.8 * u + 0.28 * v, 2.7 * v + 0.28 * u];
  let gu = 0.7 * u;
  let gv = 0.7 * v;
  for (const well of WELLS) {
    const du = u - well.u;
    const dv = v - well.v;
    const bump = (well.a * Math.exp(-(du * du + dv * dv) / (2 * SIGMA2))) / SIGMA2;
    gu += bump * du;
    gv += bump * dv;
  }
  return [gu, gv];
}
