// A lamp, a cloud of points, and the wall behind them.
//
// Turn the cloud and its shadow changes shape. Most angles flatten it into
// something with no structure left; one angle keeps almost all of it. Press the
// switch and the lamp finds that angle on its own, which is the entire content
// of principal component analysis and takes about four seconds to feel.
//
// The maths is real: the covariance of the projected coordinates, and a power
// iteration on the 3×3 covariance for the switch. No equations are shown.

import { useCallback, useMemo, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { mulberry32 } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 200;
const H = 130;
const COUNT = 220;

type Vec = [number, number, number];

/** A cloud with a real shape to lose: a long axis, a medium one, a thin one. */
function cloud(): Vec[] {
  const rand = mulberry32(20260825);
  const gauss = () => {
    const u = Math.max(1e-9, rand());
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
  };
  // The generating basis: not axis-aligned, so the answer is not "look from
  // the front".
  const e1: Vec = [0.62, 0.55, 0.56];
  const e2: Vec = [-0.72, 0.68, 0.13];
  const e3: Vec = [-0.31, -0.48, 0.82];
  const out: Vec[] = [];
  for (let i = 0; i < COUNT; i += 1) {
    const a = gauss() * 1.0;
    const b = gauss() * 0.42;
    const c = gauss() * 0.13;
    out.push([
      e1[0] * a + e2[0] * b + e3[0] * c,
      e1[1] * a + e2[1] * b + e3[1] * c,
      e1[2] * a + e2[2] * b + e3[2] * c,
    ]);
  }
  return out;
}

function rotate(p: Vec, yaw: number, pitch: number): Vec {
  const cy = Math.cos(yaw); const sy = Math.sin(yaw);
  const cp = Math.cos(pitch); const sp = Math.sin(pitch);
  const x = p[0] * cy - p[2] * sy;
  const z = p[0] * sy + p[2] * cy;
  const y = p[1] * cp - z * sp;
  const z2 = p[1] * sp + z * cp;
  return [x, y, z2];
}

/** The leading eigenvector of the cloud's covariance, by power iteration. */
function leadingAxis(points: Vec[]): Vec {
  const c = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (const p of points) {
    for (let i = 0; i < 3; i += 1) for (let j = 0; j < 3; j += 1) c[i][j] += p[i] * p[j];
  }
  let v: Vec = [1, 0.3, -0.2];
  for (let step = 0; step < 64; step += 1) {
    const n: Vec = [
      c[0][0] * v[0] + c[0][1] * v[1] + c[0][2] * v[2],
      c[1][0] * v[0] + c[1][1] * v[1] + c[1][2] * v[2],
      c[2][0] * v[0] + c[2][1] * v[1] + c[2][2] * v[2],
    ];
    const len = Math.hypot(n[0], n[1], n[2]) || 1;
    v = [n[0] / len, n[1] / len, n[2] / len];
  }
  return v;
}

export function PcaLamp() {
  const t = useUiText();
  const { reduced } = useWorld();
  const points = useMemo(() => cloud(), []);
  const axis = useMemo(() => leadingAxis(points), [points]);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const view = useRef<{ yaw: number; pitch: number; toYaw: number; toPitch: number; seeking: boolean } | null>(null);
  const [spread, setSpread] = useState(0);
  const onScreen = useOnScreen(hostRef);

  const eye = useCallback(() => (view.current ??= { yaw: 0.7, pitch: 0.35, toYaw: 0.7, toPitch: 0.35, seeking: false }), []);

  const findIt = useCallback(() => {
    // Turn until the leading axis lies across the wall rather than into it.
    const [x, y, z] = axis;
    const v = eye();
    v.toYaw = Math.atan2(z, x) + Math.PI / 2;
    v.toPitch = -Math.asin(Math.max(-1, Math.min(1, y))) * 0.9;
    v.seeking = true;
  }, [axis, eye]);

  const drag = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    const v = eye();
    v.seeking = false;
    const start = { x: event.clientX, y: event.clientY, yaw: v.toYaw, pitch: v.toPitch };
    const move = (ev: PointerEvent) => {
      v.toYaw = start.yaw + (ev.clientX - start.x) * 0.012;
      v.toPitch = Math.max(-1.2, Math.min(1.2, start.pitch + (ev.clientY - start.y) * 0.01));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [eye]);

  useFrame((dt) => {
    const v = eye();
    const k = Math.min(1, dt / (v.seeking ? 420 : 130));
    v.yaw += (v.toYaw - v.yaw) * k;
    v.pitch += (v.toPitch - v.pitch) * k;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // The wall: where the shadow falls.
    ctx.fillStyle = 'rgba(238,232,216,.92)';
    ctx.fillRect(8, 64, W - 16, H - 72);
    ctx.strokeStyle = 'rgba(23,21,15,.2)';
    ctx.strokeRect(8.5, 64.5, W - 17, H - 73);

    const projected: Array<[number, number, number]> = [];
    for (const p of points) projected.push(rotate(p, v.yaw, v.pitch));

    // The cloud itself, floating in the beam.
    const cx = W / 2;
    const cy = 40;
    for (const [x, y, z] of projected) {
      const depth = 1 / (1 + z * 0.22);
      ctx.globalAlpha = 0.35 + depth * 0.5;
      ctx.fillStyle = '#e8d9a8';
      ctx.beginPath();
      ctx.arc(cx + x * 30 * depth, cy + y * 22 * depth, 1.1 + depth * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // The shadow: the same points with their depth thrown away. That is the
    // projection, and the variance left in it is what the meter reads.
    let mean = 0;
    for (const [x] of projected) mean += x;
    mean /= projected.length || 1;
    let variance = 0;
    for (const [x] of projected) variance += (x - mean) ** 2;
    variance /= projected.length || 1;

    ctx.fillStyle = 'rgba(30,32,28,.72)';
    for (const [x, , z] of projected) {
      const wobble = z * 0.5;
      ctx.beginPath();
      ctx.ellipse(cx + x * 30, H - 22 + wobble * 0.6, 1.7, 1.1, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // The beam.
    const beam = ctx.createLinearGradient(cx, 8, cx, H - 16);
    beam.addColorStop(0, 'rgba(255,238,190,.42)');
    beam.addColorStop(1, 'rgba(255,238,190,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(cx - 8, 6);
    ctx.lineTo(cx + 8, 6);
    ctx.lineTo(W - 14, H - 16);
    ctx.lineTo(14, H - 16);
    ctx.closePath();
    ctx.fill();

    setSpread(Math.min(1, variance / 0.95));
  }, onScreen && !reduced);

  return (
    <ObjectShell id="pcalamp" label={t('world.pca.label')} hint={t('world.pca.hint')}>
      <div className="pca" ref={hostRef}>
        <span className="pca__arm" aria-hidden="true" />
        <span className="pca__shade mat-metal" aria-hidden="true" />
        <span className="pca__bulb" aria-hidden="true" />
        <canvas ref={canvasRef} data-nodrag style={{ width: W, height: H }} onPointerDown={drag} />
        <div className="pca__ctrl" data-nodrag>
          <button type="button" className="pca__switch" onClick={findIt}>PCA</button>
          <span className="pca__meter" aria-hidden="true"><i style={{ width: `${Math.round(spread * 100)}%` }} /></span>
        </div>
      </div>
    </ObjectShell>
  );
}
