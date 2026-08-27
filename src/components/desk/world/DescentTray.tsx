// A live optimiser walking across a loss landscape.
//
// Every landscape is procedural and deliberately odd: several local wells,
// at least one hill, directional ripples and a bounded perimeter.
// The mathematics and the visual clock are separate. Eta changes the optimiser
// step; the clock keeps each step on screen long enough to follow it.
//
// Dragging turns the landscape. A tap is resolved against the frontmost mesh
// triangle under the pointer, so the probe lands on the surface that was
// actually touched even when a ridge folds over another part of the plot.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import {
  barycentric,
  createLandscape,
  descend,
  landscapeStart,
  loss,
  OPTIMIZER_DOMAIN,
  type Landscape,
} from '../../../lib/world/descent';
import { clamp } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 212;
const H = 164;
/** Coarse enough to read as a model, dense enough for precise triangle hits. */
const N = 25;
/** The learning step is discrete; this visual interval makes it observable. */
const STEP_MS = 220;
const RISE = 1.05;
const XW = 1.15;
const PAD = 8;
const HOME = { yaw: Math.PI / 4, tilt: 0.52 };
const VEIL = 0.4;
const DEFAULT_RATE = 0.012;

type Cam = { yaw: number; tilt: number };
type Span = { lo: number; hi: number };

type View = {
  key: string;
  cos: number;
  sin: number;
  tilt: number;
  k: number;
  ox: number;
  oy: number;
  x: Float32Array;
  y: Float32Array;
  depth: Float32Array;
  order: Uint16Array;
  sheet: HTMLCanvasElement | null;
};

function randomSeed(): number {
  return ((Date.now() >>> 0) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0 || 1;
}

function extent(landscape: Landscape): Span {
  const values: number[] = [];
  for (let j = 0; j < N; j += 1) {
    for (let i = 0; i < N; i += 1) {
      values.push(loss((i / (N - 1)) * 2 - 1, (j / (N - 1)) * 2 - 1, landscape));
    }
  }
  // A handful of perimeter spikes used to consume almost the whole vertical
  // range and flatten the odd interior. Percentiles keep the walls, but let
  // wells, rings and twists occupy most of the visible height.
  values.sort((a, b) => a - b);
  const lo = values[Math.floor(values.length * 0.03)];
  const hi = values[Math.floor(values.length * 0.96)];
  return { lo, hi: hi > lo ? hi : lo + 1 };
}

const height = (value: number, span: Span) => clamp((value - span.lo) / (span.hi - span.lo || 1), 0, 1);

function band(t: number, hue: number): string {
  const level = clamp(t, 0, 1);
  const h = hue - level * 118;
  const saturation = 34 + level * 28;
  const light = 23 + level * 40;
  return `hsl(${h.toFixed(1)} ${saturation.toFixed(1)}% ${light.toFixed(1)}%)`;
}

const QUADS = (N - 1) * (N - 1);

function build(
  landscape: Landscape,
  cam: Cam,
  span: Span,
  key: string,
  sheet: HTMLCanvasElement | null,
): View {
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
      const z = height(loss(u, v, landscape), span);
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

  const k = Math.min((W - PAD * 2) / (maxX - minX || 1), (H - PAD * 2) / (maxY - minY || 1));
  const ox = (W - (maxX - minX) * k) / 2 - minX * k;
  const oy = (H - (maxY - minY) * k) / 2 - minY * k;
  for (let at = 0; at < count; at += 1) {
    x[at] = x[at] * k + ox;
    y[at] = y[at] * k + oy;
  }

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
  const context = canvas.getContext('2d');
  if (context) {
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const ground = context.createLinearGradient(0, 0, 0, H);
    ground.addColorStop(0, '#171e24');
    ground.addColorStop(1, '#0d1216');
    context.fillStyle = ground;
    context.fillRect(0, 0, W, H);
    context.lineJoin = 'round';
    context.lineWidth = 0.46;
    for (const q of order) {
      const i = q % (N - 1);
      const j = (q - i) / (N - 1);
      const a = j * N + i;
      const b = a + 1;
      const c = a + N + 1;
      const d = a + N;
      context.beginPath();
      context.moveTo(x[a], y[a]);
      context.lineTo(x[b], y[b]);
      context.lineTo(x[c], y[c]);
      context.lineTo(x[d], y[d]);
      context.closePath();
      context.fillStyle = band((tone[a] + tone[b] + tone[c] + tone[d]) / 4, landscape.hue);
      context.fill();
      context.strokeStyle = 'rgba(12,18,22,.46)';
      context.stroke();
    }
  }

  return { key, cos, sin, tilt: cam.tilt, k, ox, oy, x, y, depth: quadDepth, order, sheet: canvas };
}

type Probe = {
  fromU: number;
  fromV: number;
  u: number;
  v: number;
  vu: number;
  vv: number;
  t: number;
  path: number[];
  still: number;
  steps: number;
};

function dropped(u: number, v: number): Probe {
  const safeU = clamp(u, -OPTIMIZER_DOMAIN, OPTIMIZER_DOMAIN);
  const safeV = clamp(v, -OPTIMIZER_DOMAIN, OPTIMIZER_DOMAIN);
  return {
    fromU: safeU,
    fromV: safeV,
    u: safeU,
    v: safeV,
    vu: 0,
    vv: 0,
    t: 0,
    path: [safeU, safeV],
    still: 0,
    steps: 0,
  };
}

export function DescentTray() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const view = useRef<View | null>(null);
  const spans = useRef(new Map<number, Span>());
  const cam = useRef<Cam>({ ...HOME });
  const [landscape, setLandscape] = useState(() => createLandscape(randomSeed()));
  const first = landscapeStart(landscape);
  const probe = useRef<Probe>(dropped(first.u, first.v));
  const nextSeed = useRef(landscape.seed);
  const [rate, setRate] = useState(DEFAULT_RATE);
  const [heavy, setHeavy] = useState(false);
  const [running, setRunning] = useState(true);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 92);

  const span = useCallback((which: Landscape) => {
    const cached = spans.current.get(which.seed);
    if (cached) return cached;
    const made = extent(which);
    spans.current.set(which.seed, made);
    return made;
  }, []);

  const camera = useCallback((which: Landscape) => {
    const currentCam = cam.current;
    const key = `${which.seed}|${currentCam.yaw.toFixed(3)}|${currentCam.tilt.toFixed(3)}`;
    const held = view.current;
    if (held?.key === key) return held;
    const made = build(which, currentCam, span(which), key, held?.sheet ?? null);
    view.current = made;
    return made;
  }, [span]);

  const onMesh = useCallback((u: number, v: number, which: Landscape, currentView: View) => {
    const currentSpan = span(which);
    const z = height(loss(u, v, which), currentSpan);
    const a = u * currentView.cos - v * currentView.sin;
    const b = u * currentView.sin + v * currentView.cos;
    return {
      x: a * XW * currentView.k + currentView.ox,
      y: (b * currentView.tilt - z * RISE) * currentView.k + currentView.oy,
      d: b,
    };
  }, [span]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, W, H);
    const currentView = camera(landscape);
    if (currentView.sheet) context.drawImage(currentView.sheet, 0, 0, W, H);

    const current = probe.current;
    if (current.path.length >= 4) {
      context.lineWidth = 1.1;
      context.lineJoin = 'round';
      context.strokeStyle = 'rgba(255,238,194,.82)';
      context.beginPath();
      for (let i = 0; i < current.path.length; i += 2) {
        const at = onMesh(current.path[i], current.path[i + 1], landscape, currentView);
        if (i === 0) context.moveTo(at.x, at.y);
        else context.lineTo(at.x, at.y);
      }
      context.stroke();
      context.fillStyle = 'rgba(255,238,194,.56)';
      for (let i = 0; i < current.path.length; i += 4) {
        const at = onMesh(current.path[i], current.path[i + 1], landscape, currentView);
        context.beginPath();
        context.arc(at.x, at.y, 0.9, 0, Math.PI * 2);
        context.fill();
      }
    }

    const progress = clamp(current.t / STEP_MS, 0, 1);
    const ease = progress * progress * (3 - 2 * progress);
    const at = onMesh(
      current.fromU + (current.u - current.fromU) * ease,
      current.fromV + (current.v - current.fromV) * ease,
      landscape,
      currentView,
    );

    // A small diamond probe marks a coordinate more honestly than a marble:
    // it is legible, but its footprint never spills over the surface boundary.
    context.save();
    context.translate(at.x, at.y);
    context.rotate(Math.PI / 4);
    context.shadowColor = 'rgba(255,224,143,.8)';
    context.shadowBlur = 4;
    context.fillStyle = '#fff6d9';
    context.fillRect(-1.9, -1.9, 3.8, 3.8);
    context.shadowBlur = 0;
    context.strokeStyle = 'rgba(20,24,26,.82)';
    context.lineWidth = 0.65;
    context.strokeRect(-1.9, -1.9, 3.8, 3.8);
    context.restore();

    // Repaint only folds that are actually in front of the probe. They become
    // translucent, keeping both the topology and the optimiser visible.
    const reach = 7;
    context.save();
    context.globalAlpha = VEIL;
    context.lineWidth = 0.46;
    for (const q of currentView.order) {
      if (currentView.depth[q] <= at.d) continue;
      const i = q % (N - 1);
      const j = (q - i) / (N - 1);
      const a0 = j * N + i;
      const b0 = a0 + 1;
      const c0 = a0 + N + 1;
      const d0 = a0 + N;
      const lox = Math.min(currentView.x[a0], currentView.x[b0], currentView.x[c0], currentView.x[d0]);
      const hix = Math.max(currentView.x[a0], currentView.x[b0], currentView.x[c0], currentView.x[d0]);
      if (hix < at.x - reach || lox > at.x + reach) continue;
      const loy = Math.min(currentView.y[a0], currentView.y[b0], currentView.y[c0], currentView.y[d0]);
      const hiy = Math.max(currentView.y[a0], currentView.y[b0], currentView.y[c0], currentView.y[d0]);
      if (hiy < at.y - reach || loy > at.y + reach) continue;
      context.beginPath();
      context.moveTo(currentView.x[a0], currentView.y[a0]);
      context.lineTo(currentView.x[b0], currentView.y[b0]);
      context.lineTo(currentView.x[c0], currentView.y[c0]);
      context.lineTo(currentView.x[d0], currentView.y[d0]);
      context.closePath();
      context.save();
      context.clip();
      if (currentView.sheet) context.drawImage(currentView.sheet, 0, 0, W, H);
      context.restore();
    }
    context.restore();

    context.font = '6px ui-monospace, monospace';
    context.fillStyle = running ? 'rgba(255,239,198,.72)' : 'rgba(220,230,232,.44)';
    const status = running ? t('world.descent.learning') : t('world.descent.settled');
    context.fillText(`${status.toUpperCase()} · ${String(current.steps).padStart(2, '0')}`, 7, 11);
  }, [camera, landscape, onMesh, running, t]);

  useEffect(() => { paint(); }, [paint]);

  useFrame((dt) => {
    const current = probe.current;
    current.t += dt;
    if (current.t >= STEP_MS) {
      current.t %= STEP_MS;
      current.fromU = current.u;
      current.fromV = current.v;
      // A gentle schedule keeps narrow procedural wells from ping-ponging
      // forever while leaving the first, most informative part of the run at
      // exactly the rate selected on the dial.
      const annealedRate = rate / Math.sqrt(1 + current.steps / 90);
      const next = descend(current, landscape, annealedRate, heavy ? 0.58 : 0);
      current.u = next.u;
      current.v = next.v;
      current.vu = next.vu;
      current.vv = next.vv;
      current.path.push(current.u, current.v);
      current.steps += 1;
      if (current.path.length > 260) current.path.splice(0, current.path.length - 260);
      current.still = Math.hypot(current.vu, current.vv) < 8e-5 ? current.still + 1 : 0;
      if (current.still > 12) setRunning(false);
    }
    paint();
  }, running && onScreen && detailed && !reduced);

  /** Pick the foremost mesh triangle under a canvas coordinate. Iterating the
   *  painter order backwards resolves self-overlap the same way it is drawn. */
  const pick = useCallback((px: number, py: number) => {
    const currentView = view.current;
    if (!currentView) return null;
    const point = { x: px, y: py };
    const model = (index: number) => ({
      u: ((index % N) / (N - 1)) * 2 - 1,
      v: (Math.floor(index / N) / (N - 1)) * 2 - 1,
    });
    for (let orderIndex = currentView.order.length - 1; orderIndex >= 0; orderIndex -= 1) {
      const q = currentView.order[orderIndex];
      const i = q % (N - 1);
      const j = (q - i) / (N - 1);
      const a = j * N + i;
      const b = a + 1;
      const c = a + N + 1;
      const d = a + N;
      for (const [p0, p1, p2] of [[a, b, c], [a, c, d]] as const) {
        const weights = barycentric(
          point,
          { x: currentView.x[p0], y: currentView.y[p0] },
          { x: currentView.x[p1], y: currentView.y[p1] },
          { x: currentView.x[p2], y: currentView.y[p2] },
        );
        if (!weights) continue;
        const m0 = model(p0);
        const m1 = model(p1);
        const m2 = model(p2);
        return {
          u: clamp(weights[0] * m0.u + weights[1] * m1.u + weights[2] * m2.u, -OPTIMIZER_DOMAIN, OPTIMIZER_DOMAIN),
          v: clamp(weights[0] * m0.v + weights[1] * m1.v + weights[2] * m2.v, -OPTIMIZER_DOMAIN, OPTIMIZER_DOMAIN),
        };
      }
    }
    return null;
  }, []);

  /** A five-screen-pixel threshold distinguishes a deliberate orbit from a
   *  tap at every board zoom level. The previous world-space threshold made
   *  tiny hand movement look like a drag when the board was zoomed out. */
  const grab = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const element = event.currentTarget;
    const pointerId = event.pointerId;
    const startX = event.clientX;
    const startY = event.clientY;
    const from = { ...cam.current };
    let turning = false;
    element.setPointerCapture?.(pointerId);

    const cleanup = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      element.releasePointerCapture?.(pointerId);
    };
    const move = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return;
      const screenDx = moveEvent.clientX - startX;
      const screenDy = moveEvent.clientY - startY;
      if (!turning && Math.hypot(screenDx, screenDy) < 5) return;
      turning = true;
      const box = element.getBoundingClientRect();
      const zoom = box.width / W || 1;
      cam.current = {
        yaw: from.yaw - (screenDx / zoom) * 0.016,
        tilt: clamp(from.tilt + (screenDy / zoom) * 0.009, 0.18, 0.9),
      };
      paint();
    };
    const up = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== pointerId) return;
      cleanup();
      if (turning) return;
      const box = element.getBoundingClientRect();
      const spot = pick(
        ((upEvent.clientX - box.left) / box.width) * W,
        ((upEvent.clientY - box.top) / box.height) * H,
      );
      if (!spot) return;
      probe.current = dropped(spot.u, spot.v);
      setRunning(true);
      paint();
    };
    const cancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId === pointerId) cleanup();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
  }, [paint, pick]);

  const reset = useCallback(() => {
    cam.current = { ...HOME };
    const start = landscapeStart(landscape);
    probe.current = dropped(start.u, start.v);
    setRunning(true);
    paint();
  }, [landscape, paint]);

  const randomize = useCallback(() => {
    nextSeed.current = (Math.imul(nextSeed.current, 1664525) + 1013904223) >>> 0 || 1;
    const next = createLandscape(nextSeed.current);
    const start = landscapeStart(next);
    spans.current.clear();
    view.current = null;
    cam.current = { ...HOME };
    probe.current = dropped(start.u, start.v);
    setLandscape(next);
    setRunning(true);
  }, []);

  return (
    <ObjectShell id="descent" label={t('world.descent.label')} hint={t('world.descent.hint')}>
      <div className="tray" ref={hostRef}>
        <span className="tray__rim mat-metal" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          data-nodrag
          style={{ width: W, height: H }}
          onPointerDown={grab}
          aria-label={t('world.descent.canvas')}
        />
        <div className="tray__bar" data-nodrag>
          <label className="tray__dial" title={t('world.descent.rate')}>
            <span>η</span>
            <input
              type="range"
              min={0.003}
              max={0.04}
              step={0.001}
              value={rate}
              onChange={(event) => { setRate(Number(event.target.value)); setRunning(true); }}
              aria-label={t('world.descent.rate')}
            />
            <output>{rate.toFixed(3)}</output>
          </label>
          <button
            type="button"
            className={heavy ? 'is-on' : ''}
            onClick={() => { setHeavy((value) => !value); setRunning(true); }}
            title={t('world.descent.momentum')}
          >β</button>
          <button type="button" onClick={randomize} title={t('world.descent.land')}>✣</button>
          <button type="button" onClick={reset} title={t('world.descent.reset')}>↺</button>
        </div>
      </div>
    </ObjectShell>
  );
}
