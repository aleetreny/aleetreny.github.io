// A marble on a loss surface.
//
// The tray is a real function drawn as a relief map — shaded by its own
// gradient, banded by its own contours — and the marble does not roll down it
// under gravity. It takes gradient-descent steps:
//
//     v ← β v − η ∇f(p),      p ← p + v
//
// which is why the learning-rate dial behaves the way it does rather than the
// way a ball would. Turn η down and the marble creeps; leave it in the middle
// and it drops cleanly into the basin; turn it up and it overshoots the valley
// floor, crosses it, overshoots the other way, and rings. Past a point it
// leaves the tray altogether, which is the honest answer.
//
// Two landscapes: a tilted bowl with one answer, and a ridged one with several,
// where where you drop the marble decides which minimum it finds.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { grad, loss, type Landscape } from '../../../lib/world/descent';
import { clamp } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 184;
const H = 128;
/** Board coordinates run −1…1 in both directions, so the maths reads like
 *  maths and the pixels are somebody else's problem. */
const toUnit = (px: number, py: number) => ({ u: (px / W) * 2 - 1, v: (py / H) * 2 - 1 });
const toPx = (u: number, v: number) => ({ x: ((u + 1) / 2) * W, y: ((v + 1) / 2) * H });

/** The relief, drawn once per landscape and blitted from then on. */
function relief(kind: Landscape): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const image = ctx.createImageData(W, H);
  const data = image.data;
  let lo = Infinity;
  let hi = -Infinity;
  const field = new Float32Array(W * H);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const { u, v } = toUnit(x + 0.5, y + 0.5);
      const f = loss(u, v, kind);
      field[y * W + x] = f;
      if (f < lo) lo = f;
      if (f > hi) hi = f;
    }
  }
  const span = hi - lo || 1;
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = y * W + x;
      const h = (field[i] - lo) / span;
      // Hillshade: a light over the top-left shoulder, so the tray reads as a
      // moulded surface rather than a heat map.
      const gx = field[i + (x < W - 1 ? 1 : 0)] - field[i - (x > 0 ? 1 : 0)];
      const gy = field[i + (y < H - 1 ? W : 0)] - field[i - (y > 0 ? W : 0)];
      const shade = clamp(0.74 - (gx * 15 + gy * 10.5), 0.36, 1.3);
      // Contour bands, thin and dark, every twelfth of the range.
      const band = Math.abs(((h * 12) % 1) - 0.5) > 0.44 ? 0.72 : 1;
      // Plaster rather than pitch: a moulded desk model, lighter on the ridges
      // and warm in the hollows, so the marble has somewhere legible to fall.
      const base = 0.34 + h * 0.5;
      const r = clamp(base * shade * band * 232, 0, 255);
      const g = clamp((base * 0.93 + 0.04) * shade * band * 226, 0, 255);
      const b = clamp((base * 0.72 + 0.06) * shade * band * 208, 0, 255);
      const p = i * 4;
      data[p] = r; data[p + 1] = g; data[p + 2] = b; data[p + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

type Ball = { u: number; v: number; vu: number; vv: number; trail: number[]; still: number };

function dropped(u: number, v: number): Ball {
  return { u, v, vu: 0, vv: 0, trail: [], still: 0 };
}

export function DescentTray() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maps = useRef<Partial<Record<Landscape, HTMLCanvasElement | null>>>({});
  const ball = useRef<Ball>(dropped(-0.72, 0.66));
  const [kind, setKind] = useState<Landscape>('bowl');
  const [rate, setRate] = useState(0.26);
  const [heavy, setHeavy] = useState(false);
  const [running, setRunning] = useState(true);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 92);

  const surface = useCallback((which: Landscape) => {
    const cached = maps.current[which];
    if (cached !== undefined) return cached;
    const made = relief(which);
    maps.current[which] = made;
    return made;
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const map = surface(kind);
    if (map) ctx.drawImage(map, 0, 0, W, H); else ctx.clearRect(0, 0, W, H);

    const b = ball.current;
    // The path it took, fading behind it.
    if (b.trail.length > 3) {
      ctx.lineWidth = 1.1;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(232,196,110,.62)';
      ctx.beginPath();
      for (let i = 0; i < b.trail.length; i += 2) {
        if (i === 0) ctx.moveTo(b.trail[0], b.trail[1]);
        else ctx.lineTo(b.trail[i], b.trail[i + 1]);
      }
      ctx.stroke();
    }

    const at = toPx(b.u, b.v);
    if (at.x > -12 && at.x < W + 12 && at.y > -12 && at.y < H + 12) {
      ctx.fillStyle = 'rgba(0,0,0,.42)';
      ctx.beginPath();
      ctx.ellipse(at.x + 1.6, at.y + 3.2, 5.4, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      const bead = ctx.createRadialGradient(at.x - 1.8, at.y - 2.2, 0.6, at.x, at.y, 5.6);
      bead.addColorStop(0, '#ffffff');
      bead.addColorStop(0.3, '#dfe7ec');
      bead.addColorStop(0.75, '#8e9aa4');
      bead.addColorStop(1, '#4a545c');
      ctx.fillStyle = bead;
      ctx.beginPath();
      ctx.arc(at.x, at.y, 5.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [kind, surface]);

  useEffect(() => { paint(); }, [paint]);

  useFrame(() => {
    const b = ball.current;
    const [gu, gv] = grad(b.u, b.v, kind);
    const beta = heavy ? 0.84 : 0;
    b.vu = beta * b.vu - rate * gu;
    b.vv = beta * b.vv - rate * gv;
    b.u += b.vu;
    b.v += b.vv;
    const at = toPx(b.u, b.v);
    b.trail.push(at.x, at.y);
    if (b.trail.length > 460) b.trail.splice(0, b.trail.length - 460);
    // Off the tray is a real outcome of too large a step, not a bug: it is
    // parked there until the next drop rather than snapped back.
    const gone = Math.abs(b.u) > 2.4 || Math.abs(b.v) > 2.4;
    const step = Math.hypot(b.vu, b.vv);
    b.still = step < 4e-4 ? b.still + 1 : 0;
    if (gone || b.still > 26) setRunning(false);
    paint();
  }, running && onScreen && detailed && !reduced);

  const drop = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    const box = event.currentTarget.getBoundingClientRect();
    const { u, v } = toUnit(((event.clientX - box.left) / box.width) * W, ((event.clientY - box.top) / box.height) * H);
    ball.current = dropped(clamp(u, -1, 1), clamp(v, -1, 1));
    setRunning(true);
  }, []);

  const reset = useCallback(() => {
    ball.current = dropped(-0.72, 0.66);
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
              max={0.86}
              step={0.02}
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
