// Conway's Game of Life, on a sheet of graph paper.
//
// B3/S23, on a 26×26 torus, and nothing else. Click a square, drag to draw,
// space to run it. Build a glider and the paper notices.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

const N = 26;
const CELL = 5.6;

/** The four rotations and two reflections of the glider, as bitmask rows. */
const GLIDERS: number[][][] = [
  [[0, 1, 0], [0, 0, 1], [1, 1, 1]],
  [[1, 0, 1], [0, 1, 1], [0, 1, 0]],
  [[1, 1, 1], [1, 0, 0], [0, 1, 0]],
  [[0, 1, 0], [1, 1, 0], [1, 0, 1]],
  [[0, 0, 1], [1, 0, 1], [0, 1, 1]],
  [[1, 1, 0], [0, 1, 1], [1, 0, 0]],
  [[1, 1, 0], [1, 0, 1], [0, 0, 1]],
  [[0, 1, 1], [1, 0, 1], [1, 0, 0]],
];

export function LifeGrid({ onGlider }: { onGlider: () => void }) {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cells = useRef(new Uint8Array(N * N));
  const spare = useRef(new Uint8Array(N * N));
  const clock = useRef(0);
  const found = useRef(false);
  const ticks = useRef(0);
  const [running, setRunning] = useState(false);
  const [gen, setGen] = useState(0);
  const [glider, setGlider] = useState(false);
  const onScreen = useOnScreen(hostRef);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const px = N * CELL;
    if (canvas.width !== px * dpr) { canvas.width = px * dpr; canvas.height = px * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, px, px);
    // Graph paper first, then the ink.
    ctx.strokeStyle = 'rgba(80,110,140,.22)';
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = 0; i <= N; i += 1) {
      ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, px);
      ctx.moveTo(0, i * CELL); ctx.lineTo(px, i * CELL);
    }
    ctx.stroke();
    ctx.fillStyle = '#1e2a33';
    const grid = cells.current;
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        if (!grid[y * N + x]) continue;
        ctx.fillRect(x * CELL + 0.7, y * CELL + 0.7, CELL - 1.4, CELL - 1.4);
      }
    }
  }, []);

  useEffect(draw, [draw]);

  const findGlider = useCallback(() => {
    const grid = cells.current;
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        for (const shape of GLIDERS) {
          let hit = true;
          let live = 0;
          for (let sy = 0; sy < 3 && hit; sy += 1) {
            for (let sx = 0; sx < 3; sx += 1) {
              const cell = grid[((y + sy) % N) * N + ((x + sx) % N)];
              if (cell !== shape[sy][sx]) { hit = false; break; }
              live += cell;
            }
          }
          if (hit && live === 5) return true;
        }
      }
    }
    return false;
  }, []);

  useFrame((dt) => {
    clock.current += dt;
    if (clock.current < 130) return;
    clock.current = 0;
    const a = cells.current;
    const b = spare.current;
    for (let y = 0; y < N; y += 1) {
      const up = ((y - 1 + N) % N) * N;
      const row = y * N;
      const down = ((y + 1) % N) * N;
      for (let x = 0; x < N; x += 1) {
        const l = (x - 1 + N) % N;
        const r = (x + 1) % N;
        const n = a[up + l] + a[up + x] + a[up + r] + a[row + l] + a[row + r] + a[down + l] + a[down + x] + a[down + r];
        // B3/S23. That is the whole rule, and it is the whole point.
        b[row + x] = n === 3 || (n === 2 && a[row + x]) ? 1 : 0;
      }
    }
    cells.current = b;
    spare.current = a;
    draw();
    ticks.current += 1;
    setGen(ticks.current);
    // Checked on a beat rather than every generation: it is a search over the
    // whole board and nobody needs the news within 130ms.
    if (ticks.current % 8 === 0 && !found.current && findGlider()) {
      found.current = true;
      setGlider(true);
      onGlider();
    }
  }, running && onScreen && !reduced);

  const at = useCallback((event: React.PointerEvent<HTMLCanvasElement>, toggle: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - box.left) / box.width) * N);
    const y = Math.floor(((event.clientY - box.top) / box.height) * N);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const index = y * N + x;
    cells.current[index] = toggle ? (cells.current[index] ? 0 : 1) : 1;
    draw();
  }, [draw]);

  const clear = useCallback(() => {
    cells.current = new Uint8Array(N * N);
    spare.current = new Uint8Array(N * N);
    setGen(0);
    setGlider(false);
    setRunning(false);
    found.current = false;
    ticks.current = 0;
    draw();
  }, [draw]);

  return (
    <ObjectShell id="life" label={t('world.life.label')} hint={t('world.life.hint')}>
      <div
        className="life"
        ref={hostRef}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === ' ') { event.preventDefault(); setRunning((v) => !v); }
          if (event.key === 'Backspace') clear();
        }}
      >
        <span className="life__pin" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          data-nodrag
          style={{ width: N * CELL, height: N * CELL }}
          onPointerDown={(event) => { event.stopPropagation(); at(event, true); }}
          onPointerMove={(event) => { if (event.buttons === 1) at(event, false); }}
        />
        <div className="life__bar" data-nodrag>
          <button type="button" onClick={() => setRunning((v) => !v)}>{running ? '❚❚' : '▶'}</button>
          <span className="life__gen">{gen}</span>
          <button type="button" onClick={clear}>◻</button>
        </div>
        {glider ? <span className="life__found">↗ glider</span> : null}
      </div>
    </ObjectShell>
  );
}
