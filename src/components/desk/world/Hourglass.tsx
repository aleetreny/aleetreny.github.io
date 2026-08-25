// An hourglass with grains in it, one at a time.
//
// Every grain is its own particle: it falls, it piles up, the pile finds its
// angle of repose. Turn it over and the whole thing starts again. Shake it hard
// enough and, for about four seconds, the second law takes the afternoon off.

import { useCallback, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

const W = 104;
const H = 152;
const GRAINS = 150;
/** The waist, in the glass's own coordinates. */
const NECK_Y = H / 2;
const NECK_HALF = 3.6;

type Grain = { x: number; y: number; vx: number; vy: number; settled: boolean };

/** Half-width of the glass at height `y` — two cones meeting at the waist. */
function bore(y: number): number {
  const k = Math.abs(y - NECK_Y) / NECK_Y;
  return NECK_HALF + k * (W / 2 - 13);
}

/** A fresh charge of sand, packed into the far end of whichever bulb is up. */
function fill(top: boolean): Grain[] {
  const made: Grain[] = [];
  for (let i = 0; i < GRAINS; i += 1) {
    const band = top ? 12 + Math.random() * (NECK_Y - 26) : NECK_Y + 14 + Math.random() * (NECK_Y - 26);
    const half = bore(band) - 3;
    made.push({ x: W / 2 + (Math.random() - 0.5) * half * 1.8, y: band, vx: 0, vy: 0, settled: false });
  }
  return made;
}

export function Hourglass() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grains = useRef<Grain[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [reversing, setReversing] = useState(false);
  const shake = useRef<{ last: number; dir: number; count: number; at: number } | null>(null);
  const onScreen = useOnScreen(hostRef);

  const flip = useCallback(() => {
    setFlipped((v) => {
      const next = !v;
      grains.current = fill(next);
      return next;
    });
  }, []);

  // Sand, and then the joke about sand.
  useFrame((dt) => {
    const list = (grains.current ??= fill(true));
    // Sand that has finished falling is sand: there is nothing left to
    // integrate, and the pile check below is quadratic. Stop.
    if (!reversing && list.every((grain) => grain.settled)) return;
    const step = Math.min(2, dt / 16.7);
    const down = reversing ? (flipped ? 1 : -1) : (flipped ? -1 : 1);
    for (const grain of list) {
      if (grain.settled && !reversing) continue;
      grain.vy += 0.055 * down * step;
      grain.vx *= 0.94;
      grain.x += grain.vx * step;
      grain.y += grain.vy * step;

      const half = bore(grain.y) - 2.2;
      const dx = grain.x - W / 2;
      if (Math.abs(dx) > half) {
        grain.x = W / 2 + Math.sign(dx) * half;
        // The wall of a cone does not stop a grain, it steers it toward the neck.
        grain.vx += -Math.sign(dx) * 0.16 - Math.sign(grain.y - NECK_Y) * 0.02;
        grain.vy *= 0.86;
      }

      const floor = down > 0 ? H - 12 : 12;
      const past = down > 0 ? grain.y > floor : grain.y < floor;
      if (past) { grain.y = floor; grain.vy = 0; grain.settled = !reversing; }
    }

    // Piling up: a grain that lands on another one stops on top of it, which is
    // what gives the heap its slope instead of a flat puddle.
    if (!reversing) {
      for (let i = 0; i < list.length; i += 1) {
        const a = list[i];
        if (a.settled) continue;
        for (let j = 0; j < list.length; j += 1) {
          if (i === j) continue;
          const b = list[j];
          if (!b.settled) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) < 3 && dy * down > -3.2 && dy * down < 0.6) {
            a.y = b.y - 3.1 * down;
            a.vy = 0;
            a.vx += dx * 0.12;
            if (Math.abs(a.vx) < 0.06) a.settled = true;
            break;
          }
        }
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = reversing ? '#e8d8a8' : '#d9c48b';
    for (const grain of list) ctx.fillRect(grain.x - 1.1, grain.y - 1.1, 2.2, 2.2);
  }, onScreen && !reduced);

  /** Shaking it: four direction changes inside a second. Nothing says so. */
  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const now = performance.now();
    const s = (shake.current ??= { last: 0, dir: 0, count: 0, at: 0 });
    const dir = Math.sign(event.movementX);
    if (dir !== 0 && dir !== s.dir) {
      if (now - s.last < 260) s.count += 1; else s.count = 0;
      s.dir = dir;
      s.last = now;
    }
    if (s.count >= 5 && now - s.at > 9000) {
      s.at = now;
      s.count = 0;
      for (const grain of (grains.current ??= fill(flipped))) { grain.settled = false; grain.vy = 0; }
      setReversing(true);
      window.setTimeout(() => {
        setReversing(false);
        for (const grain of (grains.current ?? [])) grain.settled = false;
      }, 4200);
    }
  }, [flipped]);

  return (
    <ObjectShell id="hourglass" onActivate={flip} hint={t('world.glass.hint')} label={t('world.glass.label')}>
      <div className="glass" ref={hostRef} onPointerMove={onPointerMove}>
        <span className="glass__cap glass__cap--t mat-metal" />
        <span className="glass__cap glass__cap--b mat-metal" />
        <span className="glass__post glass__post--l mat-metal" />
        <span className="glass__post glass__post--r mat-metal" />
        <div className="glass__body">
          <svg className="glass__glass" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
            <path
              d={`M14 12 L${W - 14} 12 L${W / 2 + NECK_HALF} ${NECK_Y} L${W - 14} ${H - 12} L14 ${H - 12} L${W / 2 - NECK_HALF} ${NECK_Y} Z`}
              className="glass__wall"
            />
          </svg>
          <canvas ref={canvasRef} style={{ width: W, height: H }} />
        </div>
        {reversing ? <span className="glass__entropy">S ↓ ?</span> : null}
      </div>
    </ObjectShell>
  );
}
