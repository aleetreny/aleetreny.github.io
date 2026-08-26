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
//
// The plot turns. Drag it and the camera orbits the surface, which is the only
// way to watch a marble fall into a basin that happens to be facing away from
// you; tap it and the marble is dropped where you tapped. And when a fold of
// the mesh comes between the marble and your eye, that fold goes translucent
// rather than swallowing it, so a run behind a ridge is still a run you can
// follow.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { grad, loss, type Landscape } from '../../../lib/world/descent';
import { clamp } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 212;
const H = 164;
/** Mesh resolution. Coarse on purpose — a wireframe you can count the lines of
 *  reads as a diagram; a fine one reads as a photograph of a hill. */
const N = 21;
/** One gradient step per this many milliseconds. */
const STEP_MS = 125;
/** How tall the surface stands, in the same units the sheet is wide. Loss
 *  surfaces are always drawn with the vertical exaggerated; this is that. */
const RISE = 1.05;
/** The sheet is stretched a little across the screen, which is what makes a
 *  dimetric plot sit in a landscape frame instead of a square one. */
const XW = 1.15;
const PAD = 8;
/** Three quarters onto the right shoulder, tipped down: the angle every one of
 *  these figures is drawn from, and the one the plot returns to. */
const HOME = { yaw: Math.PI / 4, tilt: 0.52 };
/** How translucent a fold of mesh goes when it stands in front of the marble. */
const VEIL = 0.42;

type Cam = { yaw: number; tilt: number };
type Span = { lo: number; hi: number };

/** Everything the camera fixes: where each vertex of the mesh lands, how deep
 *  it is, what order the quads have to be painted in, and the sheet itself
 *  already drawn. Rebuilt only when the camera or the landscape moves. */
type View = {
  key: string;
  cos: number; sin: number; tilt: number;
  k: number; ox: number; oy: number;
  x: Float32Array; y: Float32Array;
  depth: Float32Array;
  order: Uint16Array;
  sheet: HTMLCanvasElement | null;
};

/** The surface's own range, so the colours and the height both scale to it. */
function extent(kind: Landscape): Span {
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
  return `rgb(${Math.round(38 + c * 200)},${Math.round(74 + c * 122)},${Math.round(96 - c * 30)})`;
}

const QUADS = (N - 1) * (N - 1);

function build(kind: Landscape, cam: Cam, span: Span, key: string, sheet: HTMLCanvasElement | null): View {
  const cos = Math.cos(cam.yaw);
  const sin = Math.sin(cam.yaw);
  const count = N * N;
  const x = new Float32Array(count);
  const y = new Float32Array(count);
  const depth = new Float32Array(count);
  const tone = new Float32Array(count);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (let j = 0; j < N; j += 1) {
    const v = (j / (N - 1)) * 2 - 1;
    for (let i = 0; i < N; i += 1) {
      const u = (i / (N - 1)) * 2 - 1;
      const z = (loss(u, v, kind) - span.lo) / (span.hi - span.lo || 1);
      // Turn the sheet under the camera, then flatten it: x across, the depth
      // axis foreshortened by the tilt, and the loss standing up out of it.
      const a = u * cos - v * sin;
      const b = u * sin + v * cos;
      const px = a * XW;
      const py = b * cam.tilt - z * RISE;
      const at = j * N + i;
      x[at] = px;
      y[at] = py;
      depth[at] = b;
      tone[at] = z;
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }

  // Fit whatever the camera is showing to the glass, so no angle clips a
  // corner off and none of them leaves the sheet swimming in the middle.
  const k = Math.min((W - PAD * 2) / (maxX - minX || 1), (H - PAD * 2) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * k) / 2 - minX * k;
  const oy = (H - (maxY - minY) * k) / 2 - minY * k;
  for (let at = 0; at < count; at += 1) {
    x[at] = x[at] * k + ox;
    y[at] = y[at] * k + oy;
  }

  // Painter's algorithm. With the sheet fixed the far corner was simply the
  // one with the smallest i + j; once it turns, the quads have to be sorted.
  const quadDepth = new Float32Array(QUADS);
  for (let j = 0; j < N - 1; j += 1) {
    for (let i = 0; i < N - 1; i += 1) {
      quadDepth[j * (N - 1) + i] = (depth[j * N + i] + depth[j * N + i + 1]
        + depth[(j + 1) * N + i + 1] + depth[(j + 1) * N + i]) / 4;
    }
  }
  const order = Uint16Array.from(
    Array.from({ length: QUADS }, (_unused, q) => q).sort((p, q) => quadDepth[p] - quadDepth[q]),
  );

  const canvas = sheet ?? document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // The plot has its own ground: a mesh floating on brushed metal reads as a
    // mistake, and every picture like this one has ever been drawn on a panel.
    const ground = ctx.createLinearGradient(0, 0, 0, H);
    ground.addColorStop(0, '#171e24');
    ground.addColorStop(1, '#0d1216');
    ctx.fillStyle = ground;
    ctx.fillRect(0, 0, W, H);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.5;
    for (const q of order) {
      const i = q % (N - 1);
      const j = (q - i) / (N - 1);
      const a = j * N + i;
      const b = a + 1;
      const c = a + N + 1;
      const d = a + N;
      ctx.beginPath();
      ctx.moveTo(x[a], y[a]);
      ctx.lineTo(x[b], y[b]);
      ctx.lineTo(x[c], y[c]);
      ctx.lineTo(x[d], y[d]);
      ctx.closePath();
      ctx.fillStyle = band((tone[a] + tone[b] + tone[c] + tone[d]) / 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(12,18,22,.42)';
      ctx.stroke();
    }
  }

  return { key, cos, sin, tilt: cam.tilt, k, ox, oy, x, y, depth: quadDepth, order, sheet: canvas };
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
  const view = useRef<View | null>(null);
  const spans = useRef<Partial<Record<Landscape, Span>>>({});
  const cam = useRef<Cam>({ ...HOME });
  const ball = useRef<Ball>(dropped(-0.74, 0.62));
  const [kind, setKind] = useState<Landscape>('bowl');
  const [rate, setRate] = useState(0.16);
  const [heavy, setHeavy] = useState(false);
  const [running, setRunning] = useState(true);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 92);

  const span = useCallback((which: Landscape) => (spans.current[which] ??= extent(which)), []);

  /** The camera's current take on the landscape, rebuilt only when one of
   *  them has actually moved. */
  const camera = useCallback((which: Landscape) => {
    const c = cam.current;
    const key = `${which}|${c.yaw.toFixed(3)}|${c.tilt.toFixed(3)}`;
    const held = view.current;
    if (held?.key === key) return held;
    const made = build(which, c, span(which), key, held?.sheet ?? null);
    view.current = made;
    return made;
  }, [span]);

  /** Where a point on the surface lands on the glass, and how near the eye. */
  const onMesh = useCallback((u: number, v: number, which: Landscape, v0: View) => {
    const s = span(which);
    const z = (loss(u, v, which) - s.lo) / (s.hi - s.lo || 1);
    const a = u * v0.cos - v * v0.sin;
    const b = u * v0.sin + v * v0.cos;
    return {
      x: a * XW * v0.k + v0.ox,
      y: (b * v0.tilt - z * RISE) * v0.k + v0.oy,
      d: b,
    };
  }, [span]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const v0 = camera(kind);
    if (v0.sheet) ctx.drawImage(v0.sheet, 0, 0, W, H);

    const b = ball.current;
    // The trajectory: one segment per step, so the zig-zag of too large a step
    // is drawn rather than smoothed away.
    if (b.path.length >= 4) {
      ctx.lineWidth = 1.2;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(255,236,190,.85)';
      ctx.beginPath();
      for (let i = 0; i < b.path.length; i += 2) {
        const at = onMesh(b.path[i], b.path[i + 1], kind, v0);
        if (i === 0) ctx.moveTo(at.x, at.y); else ctx.lineTo(at.x, at.y);
      }
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,236,190,.7)';
      for (let i = 0; i < b.path.length; i += 2) {
        const at = onMesh(b.path[i], b.path[i + 1], kind, v0);
        ctx.beginPath();
        ctx.arc(at.x, at.y, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // The marble, sliding between the step it left and the step it is going to.
    const k = clamp(b.t / STEP_MS, 0, 1);
    const ease = k * k * (3 - 2 * k);
    const at = onMesh(
      b.fromU + (b.u - b.fromU) * ease,
      b.fromV + (b.v - b.fromV) * ease,
      kind,
      v0,
    );
    if (at.x < -14 || at.x > W + 14 || at.y < -14 || at.y > H + 14) return;
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

    // Anything standing between the marble and the eye is laid back over it,
    // but thinly: the fold is still there, and the marble is still visible
    // through it. Only the folds that actually cover it are repainted, so this
    // is a handful of quads and not the front half of the mesh.
    const reach = 11;
    ctx.save();
    ctx.globalAlpha = VEIL;
    ctx.lineWidth = 0.5;
    for (const q of v0.order) {
      if (v0.depth[q] <= at.d) continue;
      const i = q % (N - 1);
      const j = (q - i) / (N - 1);
      const a0 = j * N + i;
      const b0 = a0 + 1;
      const c0 = a0 + N + 1;
      const d0 = a0 + N;
      const lox = Math.min(v0.x[a0], v0.x[b0], v0.x[c0], v0.x[d0]);
      const hix = Math.max(v0.x[a0], v0.x[b0], v0.x[c0], v0.x[d0]);
      if (hix < at.x - reach || lox > at.x + reach) continue;
      const loy = Math.min(v0.y[a0], v0.y[b0], v0.y[c0], v0.y[d0]);
      const hiy = Math.max(v0.y[a0], v0.y[b0], v0.y[c0], v0.y[d0]);
      if (hiy < at.y - reach || loy > at.y + reach) continue;
      ctx.beginPath();
      ctx.moveTo(v0.x[a0], v0.y[a0]);
      ctx.lineTo(v0.x[b0], v0.y[b0]);
      ctx.lineTo(v0.x[c0], v0.y[c0]);
      ctx.lineTo(v0.x[d0], v0.y[d0]);
      ctx.closePath();
      ctx.save();
      ctx.clip();
      if (v0.sheet) ctx.drawImage(v0.sheet, 0, 0, W, H);
      ctx.restore();
    }
    ctx.restore();
  }, [camera, kind, onMesh]);

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

  /** Undo the projection: solve for the ground point under the cursor, then
   *  correct it two or three times for the height of the surface there, so
   *  the marble lands where the mesh is and not where the floor is. */
  const under = useCallback((px: number, py: number) => {
    const v0 = view.current;
    if (!v0) return null;
    const s = span(kind);
    const a = ((px - v0.ox) / v0.k) / XW;
    const flat = (py - v0.oy) / v0.k;
    let u = 0;
    let v = 0;
    let z = 0;
    for (let pass = 0; pass < 4; pass += 1) {
      const b = (flat + z * RISE) / v0.tilt;
      u = clamp(a * v0.cos + b * v0.sin, -1, 1);
      v = clamp(-a * v0.sin + b * v0.cos, -1, 1);
      z = (loss(u, v, kind) - s.lo) / (s.hi - s.lo || 1);
    }
    return { u, v };
  }, [kind, span]);

  /** Drag turns the plot; a tap without a drag drops the marble. */
  const grab = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    const box = event.currentTarget.getBoundingClientRect();
    const zoom = box.width / W || 1;
    const startX = event.clientX;
    const startY = event.clientY;
    const from = { ...cam.current };
    let turning = false;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - startX) / zoom;
      const dy = (ev.clientY - startY) / zoom;
      if (!turning && Math.hypot(dx, dy) < 3.5) return;
      turning = true;
      cam.current = {
        yaw: from.yaw - dx * 0.016,
        // Not all the way flat and not straight down: past either the mesh
        // stops being a picture of a surface.
        tilt: clamp(from.tilt + dy * 0.009, 0.18, 0.9),
      };
      paint();
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (turning) return;
      const spot = under(
        ((ev.clientX - box.left) / box.width) * W,
        ((ev.clientY - box.top) / box.height) * H,
      );
      if (!spot) return;
      ball.current = dropped(spot.u, spot.v);
      setRunning(true);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [paint, under]);

  const reset = useCallback(() => {
    cam.current = { ...HOME };
    ball.current = dropped(-0.74, 0.62);
    setRunning(true);
  }, []);

  return (
    <ObjectShell id="descent" label={t('world.descent.label')} hint={t('world.descent.hint')}>
      <div className="tray" ref={hostRef}>
        <span className="tray__rim mat-metal" aria-hidden="true" />
        <canvas ref={canvasRef} data-nodrag style={{ width: W, height: H }} onPointerDown={grab} />
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
