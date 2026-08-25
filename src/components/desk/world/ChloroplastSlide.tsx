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

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { AMBIENT, light, watchLight } from '../../../lib/world/light';
import { clamp, mulberry32 } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 150;
const H = 150;
const R = 71;
const COUNT = 38;
/** Above this the response flips from gathering to fleeing. Real leaves switch
 *  somewhere around the light a bright window gives; this is that number. */
const AVOID = 0.5;

type Plastid = { x: number; y: number; vx: number; vy: number; a: number; va: number; seed: number };

function seedCell(): Plastid[] {
  const rand = mulberry32(31415);
  const made: Plastid[] = [];
  for (let i = 0; i < COUNT; i += 1) {
    const t = rand() * Math.PI * 2;
    const r = Math.sqrt(rand()) * (R - 16);
    made.push({
      x: W / 2 + Math.cos(t) * r,
      y: H / 2 + Math.sin(t) * r,
      vx: 0, vy: 0,
      a: rand() * Math.PI,
      va: 0,
      seed: rand(),
    });
  }
  return made;
}

export function ChloroplastSlide() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cell = useRef<Plastid[] | null>(null);
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
    ctx.clearRect(0, 0, W, H);

    // The cell: a wall, a wash of cytoplasm, and the vacuole that takes up
    // most of the room and is the reason everything lives at the edges.
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#dfe6d3';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(150,176,128,.34)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 56, H / 2 - 44, 112, 88, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(88,112,66,.55)';
    ctx.lineWidth = 3.2;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(120,150,96,.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(W / 2 + 4, H / 2 + 2, 38, 27, 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // The torch, as the slide sees it.
    const b = beam.current;
    if (b.on > 0.01) {
      const glow = ctx.createRadialGradient(b.x, b.y, 2, b.x, b.y, 46);
      const heat = clamp(lamp, 0, 1);
      glow.addColorStop(0, `rgba(255,${Math.round(248 - heat * 40)},${Math.round(196 - heat * 96)},${(0.5 * b.on).toFixed(3)})`);
      glow.addColorStop(1, 'rgba(255,240,190,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);
    }

    for (const p of list) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      const body = ctx.createLinearGradient(-6, -4, 6, 4);
      body.addColorStop(0, '#7fb35a');
      body.addColorStop(0.5, '#4f8b39');
      body.addColorStop(1, '#2f5f26');
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6.4, 3.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(28,58,22,.55)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      // Grana: the stacks that do the actual absorbing.
      ctx.fillStyle = 'rgba(24,62,20,.5)';
      ctx.fillRect(-3.4, -1.1, 2.2, 2.2);
      ctx.fillRect(0.8, -1.6, 2.4, 2.6);
      ctx.fillStyle = 'rgba(226,244,206,.5)';
      ctx.beginPath();
      ctx.ellipse(-2, -1.8, 2.4, 1.1, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }, [lamp]);

  useEffect(() => { draw(cell.current ??= seedCell()); }, [draw]);

  useFrame((dt, now) => {
    const list = (cell.current ??= seedCell());
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

      // Cytoplasmic streaming: a slow circulation that never stops, and the
      // reason none of this looks like billiards.
      const rx = p.x - W / 2;
      const ry = p.y - H / 2;
      const rr = Math.hypot(rx, ry) || 1;
      p.vx += (-ry / rr) * 0.016 * step;
      p.vy += (rx / rr) * 0.016 * step;
      p.vx += Math.sin(now / 900 + p.seed * 31) * 0.006 * step;
      p.vy += Math.cos(now / 1100 + p.seed * 17) * 0.006 * step;

      // Fleeing means standing against the wall, so the harder the light the
      // more they are held out at the rim rather than merely pushed.
      if (lit > AVOID) {
        const want = R - 12;
        p.vx += (rx / rr) * (want - rr) * -0.0016 * step * (lit - AVOID) * 6;
        p.vy += (ry / rr) * (want - rr) * -0.0016 * step * (lit - AVOID) * 6;
      }

      p.vx *= 0.9;
      p.vy *= 0.9;
      p.x += p.vx * step;
      p.y += p.vy * step;

      // The wall. Nothing leaves the cell.
      const cr = Math.hypot(p.x - W / 2, p.y - H / 2);
      const edge = R - 9;
      if (cr > edge) {
        const k = edge / cr;
        p.x = W / 2 + (p.x - W / 2) * k;
        p.y = H / 2 + (p.y - H / 2) * k;
        p.vx *= 0.5;
        p.vy *= 0.5;
      }

      // They lie along the way they are travelling, and turn slowly.
      const heading = Math.atan2(p.vy, p.vx);
      let turn = heading - p.a;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      const moving = Math.min(1, Math.hypot(p.vx, p.vy) * 12);
      p.a += turn * 0.06 * moving * step;
    }

    // Elbow room: they crowd, they do not merge.
    for (let i = 0; i < list.length; i += 1) {
      const a = list[i];
      for (let j = i + 1; j < list.length; j += 1) {
        const c = list[j];
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const d2 = dx * dx + dy * dy;
        if (d2 > 169 || d2 < 1e-4) continue;
        const d = Math.sqrt(d2);
        const push = (13 - d) * 0.035 * step;
        a.vx -= (dx / d) * push; a.vy -= (dy / d) * push;
        c.vx += (dx / d) * push; c.vy += (dy / d) * push;
      }
    }

    draw(list);
  }, onScreen && detailed && !reduced);

  return (
    <ObjectShell id="chloroplast" label={t('world.cell.label')} hint={t('world.cell.hint')}>
      <div className="slide" ref={hostRef}>
        <span className="slide__glass" aria-hidden="true" />
        <span className="slide__frost" aria-hidden="true">Elodea sp.</span>
        <div className="slide__field" ref={fieldRef} data-nodrag>
          <canvas ref={canvasRef} style={{ width: W, height: H }} />
          <span className="slide__ring" aria-hidden="true" />
        </div>
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
          <span className="slide__lux" style={{ opacity: 0.35 + lamp * 0.65 }} aria-hidden="true" />
        </label>
      </div>
    </ObjectShell>
  );
}
