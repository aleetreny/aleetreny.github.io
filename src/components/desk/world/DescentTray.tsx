// A marble on a loss surface, drawn the way a loss surface is drawn.
//
// Not a relief map: the mesh, in the axonometric projection every textbook
// picture of gradient descent uses, with the surface coloured by height and
// the path of the run laid on top of it. What the marble does is the real
// thing —
//
//     v ← β v − η ∇f(p),      p ← p + v
//
// — one step at a time, on a clock slow enough to watch. That is the point of
// the dial: with η small the steps are tiny and it takes an age to arrive;
// in the middle it walks straight down; turn it up and each step overshoots
// the floor of the valley, so the path zig-zags across it, and past a point it
// leaves the mesh altogether. Discrete steps are what make any of that legible
// — sixty a second is an animation, eight a second is an algorithm.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { grad, loss, type Landscape } from '../../../lib/world/descent';
import { clamp } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 190;
const H = 132;
/** The axonometric camera: x to the right, y into the page, z up. */
const CX = W / 2;
/** Placed so the sheet fills the glass: the drawing runs from the back corner
 *  at its highest to the floor of the valley, which is 2·SY + SZ tall. */
const CY = 114;
const SX = 41;
const SY = 22;
const SZ = 58;
/** Mesh resolution. Coarse on purpose — a wireframe you can count the lines of
 *  reads as a diagram; a fine one reads as a photograph of a hill. */
const N = 21;
/** One gradient step per this many milliseconds. */
const STEP_MS = 125;

type Vec3 = { x: number; y: number };

function project(u: number, v: number, z: number): Vec3 {
  return { x: CX + (u - v) * SX, y: CY + (u + v) * SY - z * SZ };
}

/** The surface's own range, so the colours and the height both scale to it. */
function extent(kind: Landscape): { lo: number; hi: number } {
  let lo = Infinity;
  let hi = -Infinity;
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      const f = loss((i / (N - 1)) * 2 - 1, (j / (N - 1)) * 2 - 1, kind);
      if (f < lo) lo = f;
      if (f > hi) hi = f;
    }
  }
  return { lo, hi: hi > lo ? hi : lo + 1 };
}

/** Cool in the valleys, warm on the tops — the one convention every one of
 *  these pictures has ever used. */
function band(t: number): string {
  const c = clamp(t, 0, 1);
  const r = Math.round(38 + c * 200);
  const g = Math.round(74 + c * 122);
  const b = Math.round(96 - c * 30);
  return `rgb(${r},${g},${b})`;
}

/** The mesh, drawn once per landscape and blitted from then on. */
function mesh(kind: Landscape): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // The plot has its own ground: a mesh floating on brushed metal reads as a
  // mistake, and every picture like this one has ever been drawn on a panel.
  const ground = ctx.createLinearGradient(0, 0, 0, H);
  ground.addColorStop(0, '#171e24');
  ground.addColorStop(1, '#0d1216');
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, W, H);
  const { lo, hi } = extent(kind);
  const at = (i: number, j: number) => {
    const u = (i / (N - 1)) * 2 - 1;
    const v = (j / (N - 1)) * 2 - 1;
    const z = (loss(u, v, kind) - lo) / (hi - lo);
    return { ...project(u, v, z), z };
  };
  // Painter's algorithm: the far corner of the mesh is the one with the
  // smallest i + j, so walking outward from it draws back to front.
  ctx.lineJoin = 'round';
  for (let step = 0; step < (N - 1) * 2; step += 1) {
    for (let j = 0; j < N - 1; j += 1) {
      const i = step - j;
      if (i < 0 || i >= N - 1) continue;
      const a = at(i, j);
      const b = at(i + 1, j);
      const c = at(i + 1, j + 1);
      const d = at(i, j + 1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.lineTo(d.x, d.y);
      ctx.closePath();
      ctx.fillStyle = band((a.z + b.z + c.z + d.z) / 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(12,18,22,.42)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }
  return canvas;
}

type Ball = {
  /** Where the last step landed, and where the next one will. */
  fromU: number; fromV: number; u: number; v: number;
  vu: number; vv: number;
  /** Milliseconds into the current step. */
  t: number;
  path: number[];
  still: number;
};

function dropped(u: number, v: number): Ball {
  return { fromU: u, fromV: v, u, v, vu: 0, vv: 0, t: 0, path: [], still: 0 };
}

export function DescentTray() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maps = useRef<Partial<Record<Landscape, HTMLCanvasElement | null>>>({});
  const spans = useRef<Partial<Record<Landscape, { lo: number; hi: number }>>>({});
  const ball = useRef<Ball>(dropped(-0.74, 0.62));
  const [kind, setKind] = useState<Landscape>('bowl');
  const [rate, setRate] = useState(0.16);
  const [heavy, setHeavy] = useState(false);
  const [running, setRunning] = useState(true);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 92);

  const surface = useCallback((which: Landscape) => {
    if (maps.current[which] === undefined) {
      maps.current[which] = mesh(which);
      spans.current[which] = extent(which);
    }
    return maps.current[which];
  }, []);

  /** Where a point on the surface lands on the glass. */
  const onMesh = useCallback((u: number, v: number, which: Landscape) => {
    const span = spans.current[which] ?? { lo: 0, hi: 1 };
    const z = (loss(u, v, which) - span.lo) / (span.hi - span.lo || 1);
    return project(u, v, z);
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const map = surface(kind);
    if (map) ctx.drawImage(map, 0, 0, W, H);

    const b = ball.current;
    // The trajectory: one segment per step, so the zig-zag of too large a step
    // is drawn rather than smoothed away.
    if (b.path.length >= 4) {
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,236,190,.85)';
      ctx.beginPath();
      for (let i = 0; i < b.path.length; i += 2) {
        const at = onMesh(b.path[i], b.path[i + 1], kind);
        if (i === 0) ctx.moveTo(at.x, at.y); else ctx.lineTo(at.x, at.y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,236,190,.7)';
      for (let i = 0; i < b.path.length; i += 2) {
        const at = onMesh(b.path[i], b.path[i + 1], kind);
        ctx.beginPath();
        ctx.arc(at.x, at.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // The marble, sliding between the step it left and the step it is going to.
    const k = clamp(b.t / STEP_MS, 0, 1);
    const ease = k * k * (3 - 2 * k);
    const u = b.fromU + (b.u - b.fromU) * ease;
    const v = b.fromV + (b.v - b.fromV) * ease;
    const at = onMesh(u, v, kind);
    if (at.x > -14 && at.x < W + 14 && at.y > -14 && at.y < H + 14) {
      const bead = ctx.createRadialGradient(at.x - 1.6, at.y - 2, 0.5, at.x, at.y, 5.2);
      bead.addColorStop(0, '#ffffff');
      bead.addColorStop(0.34, '#e6eef4');
      bead.addColorStop(0.78, '#8e9aa4');
      bead.addColorStop(1, '#414a52');
      ctx.fillStyle = bead;
      ctx.beginPath();
      ctx.arc(at.x, at.y, 4.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(10,14,18,.5)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }, [kind, onMesh, surface]);

  useEffect(() => { paint(); }, [paint]);

  useFrame((dt) => {
    const b = ball.current;
    b.t += dt;
    if (b.t >= STEP_MS) {
      b.t = 0;
      b.fromU = b.u;
      b.fromV = b.v;
      const [gu, gv] = grad(b.u, b.v, kind);
      const beta = heavy ? 0.72 : 0;
      b.vu = beta * b.vu - rate * gu;
      b.vv = beta * b.vv - rate * gv;
      b.u += b.vu;
      b.v += b.vv;
      b.path.push(b.u, b.v);
      if (b.path.length > 260) b.path.splice(0, b.path.length - 260);
      // Off the mesh is a real outcome of too large a step, not a fault: it is
      // left there until the next drop rather than snapped back.
      const gone = Math.abs(b.u) > 2.2 || Math.abs(b.v) > 2.2;
      b.still = Math.hypot(b.vu, b.vv) < 6e-4 ? b.still + 1 : 0;
      if (gone || b.still > 6) setRunning(false);
    }
    paint();
  }, running && onScreen && detailed && !reduced);

  const drop = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    const box = event.currentTarget.getBoundingClientRect();
    const px = ((event.clientX - box.left) / box.width) * W;
    const py = ((event.clientY - box.top) / box.height) * H;
    // Undo the projection at ground level: two equations, two unknowns.
    const u = clamp((px - CX) / (2 * SX) + (py - CY) / (2 * SY), -1, 1);
    const v = clamp((py - CY) / (2 * SY) - (px - CX) / (2 * SX), -1, 1);
    ball.current = dropped(u, v);
    setRunning(true);
  }, []);

  const reset = useCallback(() => {
    ball.current = dropped(-0.74, 0.62);
    setRunning(true);
  }, []);

  return (
    <ObjectShell id="descent" label={t('world.descent.label')} hint={t('world.descent.hint')}>
      <div className="tray" ref={hostRef}>
        <span className="tray__rim mat-metal" aria-hidden="true" />
        <canvas ref={canvasRef} data-nodrag style={{ width: W, height: H }} onPointerDown={drop} />
        <div className="tray__bar" data-nodrag>
          <label className="tray__dial" title={t('world.descent.rate')}>
            <span>η</span>
            <input
              type="range"
              min={0.02}
              max={0.62}
              step={0.01}
              value={rate}
              onChange={(event) => { setRate(Number(event.target.value)); setRunning(true); }}
              aria-label={t('world.descent.rate')}
            />
          </label>
          <button
            type="button"
            className={heavy ? 'is-on' : ''}
            onClick={() => { setHeavy((v) => !v); setRunning(true); }}
            title={t('world.descent.momentum')}
          >β</button>
          <button
            type="button"
            onClick={() => { setKind((current: Landscape) => (current === 'bowl' ? 'ridges' : 'bowl')); reset(); }}
            title={t('world.descent.land')}
          >{kind === 'bowl' ? '◡' : '⩗'}</button>
          <button type="button" onClick={reset} title={t('world.descent.reset')}>↺</button>
        </div>
      </div>
    </ObjectShell>
  );
}
