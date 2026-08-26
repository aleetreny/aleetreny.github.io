// A slide under a lens, and cells that can see you coming.
//
// Chloroplasts are not fixed in a plant cell. In weak light they spread across
// the face of the cell to catch as much of it as they can — the accumulation
// response — and in strong light they run for the side walls and stand edge-on
// to the beam, because a chloroplast that absorbs more than it can use
// destroys its own photosystem. Both moves are real, both are ordered by the
// same blue-light receptors, and both take minutes in a leaf and seconds here.
//
// So the pointer is a torch. Held low it draws them; turned up it scatters
// them to the walls, and they come back when it moves away. Nothing about the
// motion is billiard-ball: they are carried on cytoplasmic streaming, so they
// slide in slow arcs, crowd without touching, and keep drifting after the
// light has gone.
//
// What you are looking at is what Elodea actually looks like at ×400: not one
// specimen in the middle of an empty circle, but a brick wall of long cells
// that runs off every edge of the coverslip, each one streaming on its own.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { AMBIENT, light, watchLight } from '../../../lib/world/light';
import { clamp, mulberry32 } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 156;
const H = 150;
/** One cell of leaf: long, blunt-ended, about twice as wide as it is tall. */
const CW = 96;
const CH = 50;
const PER_CELL = 9;
/** How close to its own wall a chloroplast can get. */
const MARGIN = 8;
/** Above this the response flips from gathering to fleeing. Real leaves switch
 *  somewhere around the light a bright window gives; this is that number. */
const AVOID = 0.5;

type Cell = { x: number; y: number; cx: number; cy: number };
type Plastid = { home: number; x: number; y: number; vx: number; vy: number; a: number; seed: number };

/** Elodea is laid like brickwork, so alternate rows are offset by half a cell.
 *  The lattice deliberately overruns the coverslip on every side: a leaf does
 *  not stop at the edge of the field of view, and pretending it does is what
 *  makes a micrograph look like a cut-out. */
function lattice(): Cell[] {
  const made: Cell[] = [];
  for (let row = 0; row < 4; row += 1) {
    const y = row * CH - 12;
    const shift = row % 2 === 0 ? -30 : -78;
    for (let col = 0; col < 3; col += 1) {
      const x = col * CW + shift;
      if (x >= W || x + CW <= 0) continue;
      made.push({ x, y, cx: x + CW / 2, cy: y + CH / 2 });
    }
  }
  return made;
}

const CELLS = lattice();

function seedLeaf(): Plastid[] {
  const rand = mulberry32(31415);
  const made: Plastid[] = [];
  for (let c = 0; c < CELLS.length; c += 1) {
    const cell = CELLS[c];
    for (let i = 0; i < PER_CELL; i += 1) {
      made.push({
        home: c,
        x: cell.x + MARGIN + rand() * (CW - MARGIN * 2),
        y: cell.y + MARGIN + rand() * (CH - MARGIN * 2),
        vx: 0, vy: 0,
        a: rand() * Math.PI,
        seed: rand(),
      });
    }
  }
  return made;
}

/** One chloroplast, stamped once and then rubber-stamped ninety times a frame.
 *  Building the gradient per organelle per frame was the whole cost of this
 *  object; a sprite makes it a blit. */
const SPW = 14;
const SPH = 9;
function stamp(dpr: number): HTMLCanvasElement {
  const made = document.createElement('canvas');
  made.width = SPW * dpr;
  made.height = SPH * dpr;
  const ctx = made.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.translate(SPW / 2, SPH / 2);
  ctx.fillStyle = '#4c8a36';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.2, 3.7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(26,56,20,.65)';
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Grana: the stacks that do the actual absorbing.
  ctx.fillStyle = 'rgba(22,58,18,.5)';
  ctx.fillRect(-3.2, -1.1, 2.1, 2.2);
  ctx.fillRect(0.7, -1.5, 2.3, 2.5);
  ctx.fillStyle = 'rgba(224,242,202,.55)';
  ctx.beginPath();
  ctx.ellipse(-1.9, -1.7, 2.3, 1, -0.4, 0, Math.PI * 2);
  ctx.fill();
  return made;
}

export function ChloroplastSlide() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const leaf = useRef<Plastid[] | null>(null);
  const sprite = useRef<{ at: number; canvas: HTMLCanvasElement } | null>(null);
  const beam = useRef({ x: -999, y: -999, on: 0 });
  const [lamp, setLamp] = useState(0.62);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 88);

  useEffect(watchLight, []);

  const draw = useCallback((list: Plastid[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The gaps between the cells: middle lamella, and darker than either.
    ctx.fillStyle = '#b9c9a2';
    ctx.fillRect(0, 0, W, H);

    for (const cell of CELLS) {
      ctx.beginPath();
      ctx.roundRect(cell.x + 1.6, cell.y + 1.6, CW - 3.2, CH - 3.2, 7);
      ctx.fillStyle = '#dde8ca';
      ctx.fill();
      // The vacuole is most of the cell, and the reason everything lives at
      // the edges even when nothing is shining on it.
      ctx.beginPath();
      ctx.ellipse(cell.cx, cell.cy, CW / 2 - 13, CH / 2 - 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(176,200,152,.42)';
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(cell.x + 1.6, cell.y + 1.6, CW - 3.2, CH - 3.2, 7);
      ctx.strokeStyle = 'rgba(74,102,54,.72)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // The torch, as the slide sees it.
    const b = beam.current;
    if (b.on > 0.01) {
      const glow = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 48);
      const heat = clamp(lamp, 0, 1);
      glow.addColorStop(0, `rgba(255,${Math.round(248 - heat * 40)},${Math.round(196 - heat * 96)},${(0.52 * b.on).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    const mark = (sprite.current ??= { at: dpr, canvas: stamp(dpr) });
    if (mark.at !== dpr) { mark.at = dpr; mark.canvas = stamp(dpr); }
    for (const p of list) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.drawImage(mark.canvas, -SPW / 2, -SPH / 2, SPW, SPH);
      ctx.restore();
    }
  }, [lamp]);

  useEffect(() => { draw(leaf.current ??= seedLeaf()); }, [draw]);

  useFrame((dt, now) => {
    const list = (leaf.current ??= seedLeaf());
    const step = Math.min(2.2, dt / 16.7);

    // Where the torch is, in the slide's own coordinates.
    const box = fieldRef.current?.getBoundingClientRect();
    const room = light();
    const b = beam.current;
    if (box && room.at > 0) {
      const x = ((room.x - box.left) / box.width) * W;
      const y = ((room.y - box.top) / box.height) * H;
      const inside = x > -40 && y > -40 && x < W + 40 && y < H + 40;
      b.x = x;
      b.y = y;
      b.on += ((inside ? 1 : 0) - b.on) * Math.min(1, dt / 220);
    } else {
      b.on += (0 - b.on) * Math.min(1, dt / 220);
    }
    // The dial only counts while the beam is actually on this slide; the rest
    // of the board keeps the room's ordinary light.
    const heat = AMBIENT + (clamp(lamp, 0, 1) - AMBIENT) * b.on;

    for (const p of list) {
      const cell = CELLS[p.home];
      let dx = p.x - b.x;
      let dy = p.y - b.y;
      let d = Math.hypot(dx, dy);
      // Dead centre under the beam the push has no direction to point in, and
      // one unlucky chloroplast sits there while the rest run. Give it one.
      if (d < 4) {
        const away = p.seed * Math.PI * 2;
        dx = Math.cos(away) * 4;
        dy = Math.sin(away) * 4;
        d = 4;
      }
      // Irradiance falls off the way a torch does, and is only felt at all
      // while the beam is on the slide.
      const lit = b.on * heat * Math.exp(-(d * d) / (2 * 34 * 34));

      // Below the threshold they gather; above it they run. The force changes
      // sign, which is the entire phenomenon.
      const pull = lit < AVOID ? lit * 0.05 : -(lit - AVOID) * 0.42;
      p.vx += (-dx / d) * pull * step;
      p.vy += (-dy / d) * pull * step;

      // Cytoplasmic streaming: a slow circulation round the vacuole of its own
      // cell that never stops, and the reason none of this looks like billiards.
      const rx = p.x - cell.cx;
      const ry = (p.y - cell.cy) * (CW / CH);
      const rr = Math.hypot(rx, ry) || 1;
      p.vx += (-ry / rr) * 0.02 * step;
      p.vy += (rx / rr) * 0.02 * step * (CH / CW);
      p.vx += Math.sin(now / 900 + p.seed * 31) * 0.006 * step;
      p.vy += Math.cos(now / 1100 + p.seed * 17) * 0.006 * step;

      // Fleeing means standing against the wall, so the harder the light the
      // more they are driven outward until the wall stops them.
      if (lit > AVOID) {
        const drive = (lit - AVOID) * 0.34 * step;
        p.vx += (rx / rr) * drive;
        p.vy += (ry / rr) * drive * (CH / CW);
      }

      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx * step;
      p.y += p.vy * step;

      // The wall. Nothing leaves its own cell.
      const lo = cell.x + MARGIN;
      const hi = cell.x + CW - MARGIN;
      const top = cell.y + MARGIN;
      const bot = cell.y + CH - MARGIN;
      if (p.x < lo) { p.x = lo; p.vx *= -0.35; }
      if (p.x > hi) { p.x = hi; p.vx *= -0.35; }
      if (p.y < top) { p.y = top; p.vy *= -0.35; }
      if (p.y > bot) { p.y = bot; p.vy *= -0.35; }

      // They lie along the way they are travelling, and turn slowly.
      const heading = Math.atan2(p.vy, p.vx);
      let turn = heading - p.a;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      const moving = Math.min(1, Math.hypot(p.vx, p.vy) * 12);
      p.a += turn * 0.06 * moving * step;
    }

    // Elbow room: they crowd, they do not merge. Only ever with their own
    // neighbours, which keeps this linear in the number of cells.
    for (let c = 0; c < CELLS.length; c += 1) {
      const base = c * PER_CELL;
      for (let i = 0; i < PER_CELL; i += 1) {
        const a = list[base + i];
        for (let j = i + 1; j < PER_CELL; j += 1) {
          const other = list[base + j];
          const dx = other.x - a.x;
          const dy = other.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 121 || d2 < 1e-4) continue;
          const d = Math.sqrt(d2);
          const push = (11 - d) * 0.035 * step;
          a.vx -= (dx / d) * push; a.vy -= (dy / d) * push;
          other.vx += (dx / d) * push; other.vy += (dy / d) * push;
        }
      }
    }

    draw(list);
  }, onScreen && detailed && !reduced);

  return (
    <ObjectShell id="chloroplast" label={t('world.cell.label')} hint={t('world.cell.hint')}>
      <div className="slide" ref={hostRef}>
        <span className="slide__glass" aria-hidden="true" />
        <div className="slide__field" ref={fieldRef} data-nodrag>
          <canvas ref={canvasRef} style={{ width: W, height: H }} />
          <span className="slide__ring" aria-hidden="true" />
        </div>
        <span className="slide__frost" aria-hidden="true">
          <em>Elodea sp.</em>
          <label className="slide__dial" data-nodrag title={t('world.cell.lamp')}>
            <input
              type="range"
              min={0.06}
              max={1}
              step={0.02}
              value={lamp}
              onChange={(event) => setLamp(Number(event.target.value))}
              aria-label={t('world.cell.lamp')}
            />
            <i className="slide__lux" style={{ opacity: 0.35 + lamp * 0.65 }} />
          </label>
        </span>
      </div>
    </ObjectShell>
  );
}
