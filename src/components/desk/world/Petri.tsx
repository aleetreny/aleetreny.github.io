// A petri dish running Gray–Scott reaction-diffusion.
//
// This is the real system, not a loop of a recording:
//
//   ∂u/∂t = Du∇²u − uv² + F(1−u)
//   ∂v/∂t = Dv∇²v + uv² − (F+k)v
//
// on a 96×96 grid, five steps a frame, with a nine-point Laplacian. Move the
// two dials a little and the same equations give spots, stripes, mazes and the
// mitosis-like blobs; drawing in it adds v, which is what starts anything at
// all happening.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

const N = 96;
const DU = 0.16;
const DV = 0.08;

type Field = { u: Float32Array; v: Float32Array; u2: Float32Array; v2: Float32Array };

function blank(): Field {
  const size = N * N;
  const u = new Float32Array(size).fill(1);
  const v = new Float32Array(size);
  return { u, v, u2: new Float32Array(size), v2: new Float32Array(size) };
}

/** A few drops of the second reagent, so the dish is never quite still. */
function seed(field: Field) {
  for (let i = 0; i < 5; i += 1) {
    const cx = 20 + Math.floor(Math.random() * (N - 40));
    const cy = 20 + Math.floor(Math.random() * (N - 40));
    for (let y = -5; y <= 5; y += 1) {
      for (let x = -5; x <= 5; x += 1) {
        if (x * x + y * y > 25) continue;
        const index = (cy + y) * N + (cx + x);
        field.v[index] = 0.5;
        field.u[index] = 0.25;
      }
    }
  }
}

export function Petri() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const field = useRef<Field>(blank());
  const image = useRef<ImageData | null>(null);
  const [feed, setFeed] = useState(0.037);
  const [kill, setKill] = useState(0.06);
  const [dials, setDials] = useState(false);
  const onScreen = useOnScreen(hostRef);

  useEffect(() => { seed(field.current); }, []);

  const reset = useCallback(() => {
    field.current = blank();
    seed(field.current);
  }, []);

  /** Drawing into the dish: a soft brush of v, which is a drop of reagent. */
  const paintAt = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const gx = Math.floor(((event.clientX - box.left) / box.width) * N);
    const gy = Math.floor(((event.clientY - box.top) / box.height) * N);
    const f = field.current;
    for (let y = -4; y <= 4; y += 1) {
      for (let x = -4; x <= 4; x += 1) {
        const d2 = x * x + y * y;
        if (d2 > 16) continue;
        const px = gx + x;
        const py = gy + y;
        if (px < 1 || py < 1 || px >= N - 1 || py >= N - 1) continue;
        const index = py * N + px;
        const strength = 1 - d2 / 16;
        f.v[index] = Math.min(1, f.v[index] + 0.55 * strength);
        f.u[index] = Math.max(0, f.u[index] - 0.35 * strength);
      }
    }
  }, []);

  useFrame(() => {
    const f = field.current;
    const { u, v, u2, v2 } = f;
    for (let pass = 0; pass < 5; pass += 1) {
      for (let y = 1; y < N - 1; y += 1) {
        const row = y * N;
        for (let x = 1; x < N - 1; x += 1) {
          const i = row + x;
          // Nine-point Laplacian: the five-point one leaves square artefacts
          // that a grid this small cannot hide.
          const lu = (
            (u[i - 1] + u[i + 1] + u[i - N] + u[i + N]) * 0.2
            + (u[i - N - 1] + u[i - N + 1] + u[i + N - 1] + u[i + N + 1]) * 0.05
            - u[i]
          );
          const lv = (
            (v[i - 1] + v[i + 1] + v[i - N] + v[i + N]) * 0.2
            + (v[i - N - 1] + v[i - N + 1] + v[i + N - 1] + v[i + N + 1]) * 0.05
            - v[i]
          );
          const uvv = u[i] * v[i] * v[i];
          u2[i] = Math.min(1, Math.max(0, u[i] + (DU * lu - uvv + feed * (1 - u[i]))));
          v2[i] = Math.min(1, Math.max(0, v[i] + (DV * lv + uvv - (feed + kill) * v[i])));
        }
      }
      u.set(u2);
      v.set(v2);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (canvas.width !== N) { canvas.width = N; canvas.height = N; }
    if (!image.current) image.current = ctx.createImageData(N, N);
    const data = image.current.data;
    for (let i = 0; i < N * N; i += 1) {
      const c = Math.min(1, v[i] * 3.4);
      const p = i * 4;
      // Agar under, colony over: warm ground, cool growth.
      data[p] = 232 - c * 170;
      data[p + 1] = 224 - c * 92;
      data[p + 2] = 196 - c * 24;
      data[p + 3] = 255;
    }
    ctx.putImageData(image.current, 0, 0);
  }, onScreen && !reduced);

  return (
    <ObjectShell id="petri" label={t('world.petri.label')} hint={t('world.petri.hint')}>
      <div className="petri" ref={hostRef}>
        <span className="petri__lid" aria-hidden="true" />
        <div className="petri__dish">
          <canvas
            ref={canvasRef}
            width={N}
            height={N}
            data-nodrag
            style={{ width: 130, height: 130 }}
            onPointerDown={(event) => { event.stopPropagation(); paintAt(event); }}
            onPointerMove={(event) => { if (event.buttons === 1) paintAt(event); }}
            onDoubleClick={(event) => { event.stopPropagation(); reset(); }}
          />
          <span className="petri__gloss" aria-hidden="true" />
        </div>
        <button className="petri__dials" type="button" data-nodrag onClick={() => setDials((v) => !v)} aria-label={t('world.petri.dials')}>◔</button>
        {dials ? (
          <div className="petri__panel" data-nodrag>
            <label>F<input type="range" min={0.01} max={0.08} step={0.001} value={feed} onChange={(e) => setFeed(Number(e.target.value))} /><b>{feed.toFixed(3)}</b></label>
            <label>k<input type="range" min={0.045} max={0.07} step={0.001} value={kill} onChange={(e) => setKill(Number(e.target.value))} /><b>{kill.toFixed(3)}</b></label>
            <button type="button" onClick={reset}>{t('world.petri.reset')}</button>
          </div>
        ) : null}
      </div>
    </ObjectShell>
  );
}
