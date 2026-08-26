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
/** Flat ochre steps, low to high. A continuous hillshade made the tray look
 *  like a photograph of a desert; quantising the relief into a handful of
 *  tones with a line at every step makes it a survey of one instead, which
 *  is the register the rest of the board is drawn in. */
const BANDS: readonly (readonly [number, number, number])[] = [
  [52, 42, 31], [67, 55, 39], [81, 68, 46], [96, 81, 54], [110, 94, 62], [125, 107, 70],
  [140, 120, 77], [154, 133, 85], [169, 146, 93], [183, 159, 100], [198, 172, 108],
];
/** Slabs of sand between one contour and the next. */
const PER_BAND = 1.15;
/** Where a smooth, unblown tray sits in that palette — high enough that a
 *  hollow scoured out of it still has somewhere darker to go. */
const FLOOR = 3;
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
  const blur = useRef<{ a: Float32Array; b: Float32Array } | null>(null);
  const level = useRef<Uint8Array | null>(null);
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const small = (relief.current ??= (() => {
      const made = document.createElement('canvas');
      made.width = W;
      made.height = H;
      return made;
    })());
    const sctx = small.getContext('2d');
    if (!sctx) return;

    // A contour drawn round every single grain is speckle, not a map, so the
    // field is smoothed first — separably, two cheap passes. The detail comes
    // back from the contour spacing rather than from the noise: many closely
    // ruled steps read as relief where a raw heightfield reads as dither.
    const soft = (blur.current ??= { a: new Float32Array(GX * GY), b: new Float32Array(GX * GY) });
    for (let y = 0; y < GY; y += 1) {
      for (let x = 0; x < GX; x += 1) {
        soft.a[y * GX + x] = (field[at(x - 2, y)] + 2 * field[at(x - 1, y)] + 3 * field[at(x, y)]
          + 2 * field[at(x + 1, y)] + field[at(x + 2, y)]) / 9;
      }
    }
    for (let y = 0; y < GY; y += 1) {
      for (let x = 0; x < GX; x += 1) {
        soft.b[y * GX + x] = (soft.a[at(x, y - 2)] + 2 * soft.a[at(x, y - 1)] + 3 * soft.a[at(x, y)]
          + 2 * soft.a[at(x, y + 1)] + soft.a[at(x, y + 2)]) / 9;
      }
    }

    const step = (level.current ??= new Uint8Array(W * H));
    const top = BANDS.length - 1;
    for (let py = 0; py < H; py += 1) {
      const fy = (py / H) * GY - 0.5;
      const y0 = Math.floor(fy);
      const ty = fy - y0;
      for (let px = 0; px < W; px += 1) {
        const fx = (px / W) * GX - 0.5;
        const x0 = Math.floor(fx);
        const tx = fx - x0;
        const h = (soft.b[at(x0, y0)] * (1 - tx) + soft.b[at(x0 + 1, y0)] * tx) * (1 - ty)
          + (soft.b[at(x0, y0 + 1)] * (1 - tx) + soft.b[at(x0 + 1, y0 + 1)] * tx) * ty;
        step[py * W + px] = clamp(Math.round((h - 3.5) / PER_BAND) + FLOOR, 0, top);
      }
    }

    const image = sctx.createImageData(W, H);
    const data = image.data;
    for (let py = 0; py < H; py += 1) {
      for (let px = 0; px < W; px += 1) {
        const i = py * W + px;
        const band = step[i];
        const tone = BANDS[band];
        // A contour is simply where the step changes: no line on flat sand,
        // and lines that crowd together exactly where the slope is steep.
        // Every third one is an index contour, drawn heavier, the way a survey
        // sheet does it — it gives the relief a hierarchy to read at a glance.
        const edge = (px + 1 < W && step[i + 1] !== band) || (py + 1 < H && step[i + W] !== band);
        const ink = edge ? (band % 3 === 0 ? 0.4 : 0.66) : 1;
        const o = i * 4;
        data[o] = tone[0] * ink;
        data[o + 1] = tone[1] * ink;
        data[o + 2] = tone[2] * ink;
        data[o + 3] = 255;
      }
    }
    sctx.putImageData(image, 0, 0);
    // Nearest neighbour, so the contours stay drawn rather than smudged.
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, W * dpr, H * dpr);
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
