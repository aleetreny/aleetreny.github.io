// A Galton board with real beads in it.
//
// Every bead is a body: it falls, it hits a pin, it goes one way or the other,
// and it lands in a slot. Nobody is told what the shape at the bottom is going
// to be. Hold the button down and it arrives on its own.

import { useCallback, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

const W = 148;
const H = 168;
const ROWS = 9;
const TOP = 26;
const GAP = 12.2;
const FLOOR = TOP + ROWS * GAP + 12;
const SLOTS = ROWS + 1;

type Bead = { x: number; y: number; vx: number; vy: number; row: number };

export function Galton() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const beads = useRef<Bead[] | null>(null);
  const bins = useRef<number[] | null>(null);
  const holding = useRef(false);
  const cooldown = useRef(0);
  const [bias, setBias] = useState(0.5);
  const [tilt, setTilt] = useState(0);
  const [total, setTotal] = useState(0);
  const onScreen = useOnScreen(hostRef);

  const drop = useCallback(() => {
    const list = (beads.current ??= []);
    if (list.length > 120) return;
    list.push({ x: W / 2 + (Math.random() - 0.5) * 2, y: 8, vx: 0, vy: 0, row: 0 });
  }, []);

  useFrame((dt) => {
    const step = Math.min(2.2, dt / 16.7);
    const live = (beads.current ??= []);
    const slots = (bins.current ??= new Array<number>(SLOTS).fill(0));
    if (holding.current) {
      cooldown.current -= dt;
      if (cooldown.current <= 0) { drop(); cooldown.current = 55; }
    }

    for (const bead of live) {
      bead.vy += 0.14 * step;
      bead.vx += tilt * 0.02 * step;
      bead.vx *= 0.985;
      bead.x += bead.vx * step;
      bead.y += bead.vy * step;

      // The pins: crossing a row is a Bernoulli trial, which is the whole
      // machine. `bias` is the coin, `tilt` leans the frame.
      const row = Math.floor((bead.y - TOP) / GAP);
      if (row >= 0 && row < ROWS && row >= bead.row) {
        bead.row = row + 1;
        const right = Math.random() < bias + tilt * 0.08;
        bead.vx += right ? 0.62 : -0.62;
        bead.vy *= 0.62;
      }

      if (bead.y > FLOOR) {
        const slot = Math.max(0, Math.min(SLOTS - 1, Math.round((bead.x - W / 2) / (GAP * 0.86) + (SLOTS - 1) / 2)));
        // It settles onto whatever is already in its slot.
        const stack = slots[slot];
        const restY = H - 6 - stack * 2.2;
        if (bead.y >= restY) {
          bead.y = restY;
          bead.vy = 0;
          bead.vx = 0;
          if (bead.row < 900) {
            slots[slot] += 1;
            bead.row = 999;
            setTotal((n) => n + 1);
          }
        }
        bead.x += (W / 2 + (slot - (SLOTS - 1) / 2) * GAP * 0.86 - bead.x) * 0.3;
      }
      if (bead.x < 6) { bead.x = 6; bead.vx = Math.abs(bead.vx) * 0.5; }
      if (bead.x > W - 6) { bead.x = W - 6; bead.vx = -Math.abs(bead.vx) * 0.5; }
    }
    // Slots that have filled up are tidied away, so the machine keeps running.
    if (live.length > 150) beads.current = live.filter((b) => b.row < 900).slice(-140);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(150,160,168,.85)';
    for (let r = 0; r < ROWS; r += 1) {
      const count = r + 1;
      for (let i = 0; i < count; i += 1) {
        const x = W / 2 + (i - (count - 1) / 2) * GAP;
        ctx.beginPath();
        ctx.arc(x, TOP + r * GAP, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.strokeStyle = 'rgba(120,132,140,.4)';
    ctx.lineWidth = 0.6;
    for (let s = 0; s <= SLOTS; s += 1) {
      const x = W / 2 + (s - SLOTS / 2) * GAP * 0.86;
      ctx.beginPath();
      ctx.moveTo(x, FLOOR + 4);
      ctx.lineTo(x, H - 2);
      ctx.stroke();
    }

    for (const bead of (beads.current ?? live)) {
      ctx.fillStyle = bead.row >= 900 ? '#c9a24a' : '#e8c56a';
      ctx.beginPath();
      ctx.arc(bead.x, bead.y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }, onScreen && !reduced);

  const reset = useCallback(() => {
    beads.current = [];
    bins.current = new Array<number>(SLOTS).fill(0);
    setTotal(0);
  }, []);

  return (
    <ObjectShell id="galton" label={t('world.galton.label')} hint={t('world.galton.hint')}>
      <div className="galton mat-glass" ref={hostRef} style={{ ['--tilt' as string]: `${tilt * 3}deg` }}>
        <canvas
          ref={canvasRef}
          data-nodrag
          style={{ width: W, height: H }}
          onPointerDown={(event) => { event.stopPropagation(); holding.current = true; drop(); }}
          onPointerUp={() => { holding.current = false; }}
          onPointerLeave={() => { holding.current = false; }}
          onDoubleClick={(event) => { event.stopPropagation(); reset(); }}
        />
        <div className="galton__bar" data-nodrag>
          <button type="button" onClick={() => setTilt((v) => Math.max(-1, v - 0.5))} aria-label="tilt left">◀</button>
          <button type="button" onClick={() => { setBias(0.5); setTilt(0); reset(); }}>{total}</button>
          <button type="button" onClick={() => setTilt((v) => Math.min(1, v + 0.5))} aria-label="tilt right">▶</button>
        </div>
      </div>
    </ObjectShell>
  );
}
