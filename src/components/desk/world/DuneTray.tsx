// A tray of sand that remembers which way the wind was blowing.
//
// This is Werner's dune model, which is almost embarrassingly simple for what
// it produces. Pick a cell with sand in it; lift one slab; carry it downwind in
// hops; at each landing, drop it with one probability if there is already sand
// there and a smaller one if there is not; then let anything too steep
// avalanche. That is the whole rule set, and out of it come ripples, then
// dunes, then dunes with slip faces on the lee side.
//
// The two feedbacks are the point. Sand sticks to sand, so a chance pile grows
// into a ridge; and a ridge casts a wind shadow behind it where nothing is
// lifted and everything settles, so the ridge builds its own lee. Turn the fan
// and the old relief does not vanish — it is eaten from the windward side and
// re-laid downwind, which is why a desert always looks like the last several
// winds rather than the current one.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { clamp, mulberry32 } from '../../../lib/world/rng';
import { readSession, writeSession } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const W = 232;
const H = 132;
const GX = 84;
const GY = 48;
const KEY = 'board.dunes';
/** Slabs moved per frame. Enough for the relief to change while you watch,
 *  few enough that a dozen frames is still a dozen frames. */
const MOVES = 420;
const HOP = 4;
/** Angle of repose, in slabs per cell. */
const REPOSE = 2;

type Stone = { gx: number; gy: number };

function flat(): Uint8Array {
  const rand = mulberry32(1971);
  const field = new Uint8Array(GX * GY);
  for (let i = 0; i < field.length; i += 1) field[i] = 3 + (rand() < 0.5 ? 0 : 1);
  return field;
}

function load(): Uint8Array | null {
  const raw = readSession<string>(KEY, '');
  if (!raw || raw.length !== GX * GY * 2) return null;
  const field = new Uint8Array(GX * GY);
  for (let i = 0; i < field.length; i += 1) field[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16) || 0;
  return field;
}

function save(field: Uint8Array) {
  let out = '';
  for (let i = 0; i < field.length; i += 1) out += field[i].toString(16).padStart(2, '0');
  writeSession(KEY, out);
}

export function DuneTray() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const relief = useRef<HTMLCanvasElement | null>(null);
  const sand = useRef<Uint8Array | null>(null);
  const fan = useRef({ x: 18, y: 22 });
  const stone = useRef<Stone>({ gx: 52, gy: 24 });
  const fanRef = useRef<HTMLButtonElement | null>(null);
  const stoneRef = useRef<HTMLButtonElement | null>(null);
  const [blowing, setBlowing] = useState(true);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 104);

  const at = useCallback((gx: number, gy: number) => ((gy + GY) % GY) * GX + ((gx + GX) % GX), []);

  /** Where the wind is coming from, given where the fan is standing. */
  const wind = useCallback(() => {
    const fx = (fan.current.x / W) * GX;
    const fy = (fan.current.y / H) * GY;
    return Math.atan2(GY / 2 - fy, GX / 2 - fx);
  }, []);

  const placeTools = useCallback(() => {
    const f = fanRef.current;
    if (f) {
      f.style.transform = `translate(${fan.current.x - 15}px, ${fan.current.y - 15}px)`;
      // The draught in front of it is written here rather than read in a
      // render: the fan is dragged imperatively and never re-renders.
      f.style.setProperty('--wind', `${((wind() * 180) / Math.PI).toFixed(1)}deg`);
    }
    const s = stoneRef.current;
    if (s) {
      s.style.transform = `translate(${(stone.current.gx / GX) * W - 7}px, ${(stone.current.gy / GY) * H - 5}px)`;
    }
  }, [wind]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const field = sand.current;
    if (!canvas || !ctx || !field) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const small = (relief.current ??= (() => {
      const made = document.createElement('canvas');
      made.width = GX;
      made.height = GY;
      return made;
    })());
    const sctx = small.getContext('2d');
    if (!sctx) return;
    const image = sctx.createImageData(GX, GY);
    const data = image.data;
    for (let y = 0; y < GY; y += 1) {
      for (let x = 0; x < GX; x += 1) {
        const i = y * GX + x;
        const h = field[i];
        // Hillshade from a low sun over the left shoulder: the windward slopes
        // catch it and the slip faces fall into shadow, which is what makes a
        // heightfield read as a desert.
        const gx = field[at(x + 1, y)] - field[at(x - 1, y)];
        const gy = field[at(x, y + 1)] - field[at(x, y - 1)];
        const shade = clamp(0.62 - gx * 0.16 - gy * 0.1 + h * 0.018, 0.2, 1.25);
        data[i * 4] = clamp(214 * shade, 0, 255);
        data[i * 4 + 1] = clamp(190 * shade, 0, 255);
        data[i * 4 + 2] = clamp(146 * shade, 0, 255);
        data[i * 4 + 3] = 255;
      }
    }
    sctx.putImageData(image, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, W, H);
  }, [at]);

  useEffect(() => {
    sand.current ??= load() ?? flat();
    placeTools();
    draw();
  }, [draw, placeTools]);

  // The tray keeps its relief for the visit; only the broom clears it.
  useEffect(() => {
    const keep = () => { if (sand.current) save(sand.current); };
    const timer = window.setInterval(keep, 20_000);
    window.addEventListener('pagehide', keep);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pagehide', keep);
      keep();
    };
  }, []);

  useFrame(() => {
    const field = (sand.current ??= flat());
    // The wind blows from the fan across the tray.
    const ang = wind();
    const wx = Math.cos(ang);
    const wy = Math.sin(ang);
    const st = stone.current;

    if (blowing) {
      for (let n = 0; n < MOVES; n += 1) {
        const x = (Math.random() * GX) | 0;
        const y = (Math.random() * GY) | 0;
        const from = y * GX + x;
        if (field[from] <= 0) continue;
        if (onStone(x, y, st)) continue;
        // In the shadow of something taller upwind, nothing is lifted.
        const upx = Math.round(x - wx * 3);
        const upy = Math.round(y - wy * 3);
        if (field[at(upx, upy)] > field[from] + 1) continue;

        field[from] -= 1;
        let cx = x;
        let cy = y;
        for (let hop = 0; hop < 7; hop += 1) {
          cx = Math.round(cx + wx * HOP);
          cy = Math.round(cy + wy * HOP);
          const to = at(cx, cy);
          // Sand catches on sand, and on whatever is standing in the way — a
          // stone traps everything that reaches it and builds its own tail.
          const chance = onStone(cx, cy, st) ? 1 : field[to] > 0 ? 0.62 : 0.38;
          if (Math.random() < chance) {
            field[to] = Math.min(60, field[to] + 1);
            avalanche(field, cx, cy, at);
            break;
          }
        }
      }
    }
    draw();
  }, onScreen && detailed && !reduced);

  /** Drag either of the two things standing on the sand. */
  const dragTool = useCallback((which: 'fan' | 'stone') => (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const host = hostRef.current;
    if (!host) return;
    const box = host.getBoundingClientRect();
    const k = box.width / (host.offsetWidth || 1) || 1;
    const move = (ev: PointerEvent) => {
      const x = clamp((ev.clientX - box.left) / k, 6, W - 6);
      const y = clamp((ev.clientY - box.top) / k, 6, H - 6);
      if (which === 'fan') fan.current = { x, y };
      else stone.current = { gx: clamp(Math.round((x / W) * GX), 2, GX - 3), gy: clamp(Math.round((y / H) * GY), 2, GY - 3) };
      placeTools();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [placeTools]);

  const smooth = useCallback(() => {
    sand.current = flat();
    save(sand.current);
    draw();
  }, [draw]);

  return (
    <ObjectShell id="dunes" label={t('world.dunes.label')} hint={t('world.dunes.hint')}>
      <div className="dunes" ref={hostRef}>
        <span className="dunes__box" aria-hidden="true" />
        <canvas ref={canvasRef} data-nodrag style={{ width: W, height: H }} />
        <button
          className={`dunes__fan${blowing ? ' is-on' : ''}`}
          ref={fanRef}
          type="button"
          data-nodrag
          onPointerDown={dragTool('fan')}
          onDoubleClick={(event) => { event.stopPropagation(); setBlowing((v) => !v); }}
          aria-label={t('world.dunes.fan')}
          title={t('world.dunes.fan')}
        >
          <span className="dunes__blades" aria-hidden="true"><i /><i /><i /></span>
          <span className="dunes__cage" aria-hidden="true" />
        </button>
        <button
          className="dunes__stone"
          ref={stoneRef}
          type="button"
          data-nodrag
          onPointerDown={dragTool('stone')}
          aria-label={t('world.dunes.stone')}
          title={t('world.dunes.stone')}
        />
        <button className="dunes__rake" type="button" data-nodrag onClick={smooth} title={t('world.dunes.rake')}>
          {t('world.dunes.rake')}
        </button>
      </div>
    </ObjectShell>
  );
}

/** The stone is a few cells across, not one: a single-cell obstacle leaves a
 *  wake too narrow to see. */
function onStone(x: number, y: number, st: Stone): boolean {
  const dx = ((x - st.gx + GX * 1.5) % GX) - GX * 0.5;
  const dy = ((y - st.gy + GY * 1.5) % GY) - GY * 0.5;
  return Math.abs(dx) <= 1.5 && Math.abs(dy) <= 1;
}

/** Nothing stands steeper than the angle of repose: the excess slides to the
 *  lowest neighbour, and keeps sliding. */
function avalanche(field: Uint8Array, x: number, y: number, at: (gx: number, gy: number) => number) {
  let cx = x;
  let cy = y;
  for (let pass = 0; pass < 6; pass += 1) {
    const here = at(cx, cy);
    let lowest = -1;
    let low = field[here];
    let stepX = 0;
    let stepY = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const other = at(cx + dx, cy + dy);
      if (field[other] < low) { low = field[other]; lowest = other; stepX = dx; stepY = dy; }
    }
    if (lowest < 0 || field[here] - low <= REPOSE) return;
    field[here] -= 1;
    field[lowest] += 1;
    // Follow the slide: one grain toppling can leave its landing site too
    // steep in turn, which is how a slip face forms rather than a step.
    cx += stepX;
    cy += stepY;
  }
}
