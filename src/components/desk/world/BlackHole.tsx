// A black hole, drawn properly.
//
// Not a dark circle with a shadow on it. What is on this canvas is a real
// lens: for every pixel, the impact parameter b of the sightline is taken and
// the light is bent by the weak-field deflection
//
//     α ≈ 2 r_s / b
//
// which is used to look up the *background* — the star field and the board's
// own grid — at the place the ray actually came from. That is what produces the
// ring of smeared stars around the shadow, and it is why the grid behind it
// bows instead of merely darkening.
//
// Inside b = 1.5 r_s there is no background left to sample: that is the photon
// sphere, and inside it the shadow. Around it there is a thin, hot disk whose
// approaching side is brighter than its receding one, because it should be.
//
// The DOM around it is bent too, but only the DOM that is close: each nearby
// element is nudged toward the hole and squeezed along the sightline by the
// same deflection, so a card at the edge of the effect is untouched and one
// that gets dragged in visibly gives.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { OBJECT_SPECS } from '../../../lib/world/kinds';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

const SIZE = 200;
/** Schwarzschild radius in canvas pixels. The canvas is drawn at 2× so the
 *  ring stays sharp at board zoom. */
const RS = 15;
const SCALE = 2;

export function BlackHole({ boardSize }: { boardSize: { width: number; height: number } }) {
  const t = useUiText();
  const world = useWorld();
  const { reduced, placeRef, register, swallowed, boardRef } = world;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const disk = useRef<Array<{ r: number; a: number; w: number; hue: number }> | null>(null);
  const image = useRef<ImageData | null>(null);
  const onScreen = useOnScreen(hostRef, '400px');
  const eaten = useMemo(() => swallowed.filter((id) => id !== 'blackhole').length, [swallowed]);
  const gone = swallowed.includes('blackhole');

  // Placed like every other object, but bolted down: it is the one thing on the
  // desk that is not furniture.
  useEffect(() => {
    const el = hostRef.current;
    register('blackhole', el);
    if (!el) return undefined;
    const at = placeRef.current.get('blackhole');
    if (at) {
      el.style.left = `${at.x}px`;
      el.style.top = `${at.y}px`;
      el.style.transform = `rotate(${at.rot}deg) scale(${at.scale})`;
    }
    return () => register('blackhole', null);
  }, [placeRef, register]);

  /** The gas, made once. Keplerian: the inner ring goes round very much faster
   *  than the outer one, which is what gives the disk its shear. */
  const gasOf = useCallback(() => {
    const made: Array<{ r: number; a: number; w: number; hue: number }> = [];
    for (let i = 0; i < 460; i += 1) {
      const r = RS * (2.4 + Math.pow(Math.random(), 0.55) * 5.2);
      made.push({ r, a: Math.random() * Math.PI * 2, w: 0.9 / Math.pow(r / RS, 1.5), hue: Math.random() });
    }
    return made;
  }, []);

  /** Bend the elements that are actually close, and only those.
   *
   *  The transform is written inline rather than through a stylesheet rule,
   *  because every piece on this board already carries an inline
   *  `transform: rotate(Xdeg)` — a rule could never win against it, and the
   *  rotation has to survive the bend or the card would snap straight the
   *  moment the hole noticed it. */
  const bendNeighbours = useCallback(() => {
    const board = boardRef.current;
    const at = placeRef.current.get('blackhole');
    if (!board || !at) return;
    const spec = OBJECT_SPECS.blackhole;
    const cx = at.x + (spec.w * at.scale) / 2;
    const cy = at.y + (spec.h * at.scale) / 2;
    const reach = 340 * at.scale;
    for (const el of board.querySelectorAll<HTMLElement>('[data-card],[data-obj]')) {
      if (el === hostRef.current || el.dataset.obj === 'blackhole') continue;
      if (el.classList.contains('is-dragging') || el.classList.contains('obj--held')) continue;
      const rot = parseFloat(el.dataset.rot ?? '0') || 0;
      const x = (parseFloat(el.style.left || '0') || el.offsetLeft) + el.offsetWidth / 2;
      const y = (parseFloat(el.style.top || '0') || el.offsetTop) + el.offsetHeight / 2;
      const dx = cx - x;
      const dy = cy - y;
      const d = Math.hypot(dx, dy);
      if (d > reach) {
        if (el.dataset.bent) {
          el.style.filter = '';
          el.style.transform = el.dataset.bentRest || `rotate(${rot}deg)`;
          delete el.dataset.bent;
          delete el.dataset.bentRest;
        }
        continue;
      }
      // The same weak-field deflection the canvas uses, expressed as a pull on
      // the element and a squeeze along the sightline.
      const b = Math.max(reach * 0.14, d);
      const alpha = (2 * (RS * 4.2 * at.scale)) / b;
      const pull = Math.min(0.42, alpha) * 46;
      const squeeze = Math.min(0.34, alpha * 0.72);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (!el.dataset.bent) el.dataset.bentRest = el.style.transform || `rotate(${rot}deg)`;
      el.dataset.bent = '1';
      const scaleRest = /scale\(([\d.]+)\)/.exec(el.dataset.bentRest ?? '');
      const own = scaleRest ? ` scale(${scaleRest[1]})` : '';
      el.style.transform = [
        `translate(${((dx / d) * pull).toFixed(2)}px, ${((dy / d) * pull).toFixed(2)}px)`,
        `rotate(${angle.toFixed(1)}deg)`,
        `scaleX(${(1 - squeeze).toFixed(3)})`,
        `rotate(${(-angle).toFixed(1)}deg)`,
        `rotate(${rot}deg)${own}`,
      ].join(' ');
      // Only right up against it does the type itself start to go.
      el.style.filter = d < reach * 0.42
        ? `blur(${((1 - d / (reach * 0.42)) * 1.7).toFixed(2)}px) saturate(${(1 + (1 - d / (reach * 0.42)) * 0.8).toFixed(2)})`
        : '';
    }
  }, [boardRef, placeRef]);

  useFrame((dt, now) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const px = SIZE * SCALE;
    if (canvas.width !== px) { canvas.width = px; canvas.height = px; }
    const mid = px / 2;
    const rs = RS * SCALE;

    // ---- the lensed background, computed per pixel ------------------------
    if (!image.current) image.current = ctx.createImageData(px, px);
    const data = image.current.data;
    const drift = now * 0.00004;
    for (let y = 0; y < px; y += 1) {
      const dy = y - mid;
      for (let x = 0; x < px; x += 1) {
        const dx = x - mid;
        const b = Math.hypot(dx, dy);
        const p = (y * px + x) * 4;
        if (b < rs * 1.5) {
          // Photon sphere and in: nothing gets out this way.
          data[p] = 0; data[p + 1] = 0; data[p + 2] = 0;
          data[p + 3] = b < rs * 1.42 ? 255 : 250;
          continue;
        }
        // Weak-field deflection, softened at the ring so it stays finite.
        const alpha = (2 * rs) / b;
        const k = 1 + alpha * 1.55;
        const sx = dx * k + drift * 900;
        const sy = dy * k;
        const star = starField(sx, sy);
        // Everything close to the ring is smeared and blueshifted.
        const boost = Math.min(1, (rs * 2.2) / b);
        const grid = gridBehind(sx, sy);
        // The field has to end in empty slate rather than on a rim, so the
        // whole picture is faded out over the last third of the canvas.
        const edge = Math.max(0, Math.min(1, (mid - b) / (mid * 0.42)));
        const fade = edge * edge * (3 - 2 * edge);
        const r = Math.min(255, star * 235 + grid * 30 + boost * 34);
        const g = Math.min(255, star * 240 + grid * 40 + boost * 52);
        const bl = Math.min(255, star * 255 + grid * 56 + boost * 104);
        data[p] = r; data[p + 1] = g; data[p + 2] = bl;
        data[p + 3] = Math.min(255, (14 + star * 245 + grid * 62 + boost * 130) * fade);
      }
    }
    ctx.putImageData(image.current, 0, 0);

    // ---- the photon ring --------------------------------------------------
    const ring = ctx.createRadialGradient(mid, mid, rs * 1.42, mid, mid, rs * 1.85);
    ring.addColorStop(0, 'rgba(255,238,205,.95)');
    ring.addColorStop(0.35, 'rgba(255,205,130,.55)');
    ring.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(mid, mid, rs * 1.9, 0, Math.PI * 2);
    ctx.fill();

    // ---- the accretion disk ----------------------------------------------
    const step = Math.min(2.5, dt / 16.7);
    for (const gas of (disk.current ??= gasOf())) {
      gas.a += gas.w * step * 0.06;
      const r = gas.r * SCALE;
      // Seen at a shallow angle: a thin ellipse, not a circle.
      const x = mid + Math.cos(gas.a) * r;
      const y = mid + Math.sin(gas.a) * r * 0.26;
      // Relativistic beaming: the side coming toward the eye is much brighter.
      const toward = Math.cos(gas.a + Math.PI / 2);
      const beam = Math.pow(Math.max(0.06, 0.5 + toward * 0.5), 2.2);
      const heat = 1 - Math.min(1, (gas.r - RS * 2.4) / (RS * 5.2));
      ctx.globalAlpha = 0.16 + beam * 0.84 * (0.42 + heat * 0.58);
      ctx.fillStyle = heat > 0.62
        ? `rgb(255,${Math.round(226 - gas.hue * 30)},${Math.round(190 - gas.hue * 60)})`
        : `rgb(${Math.round(238 - gas.hue * 40)},${Math.round(150 + gas.hue * 40)},${Math.round(70 + gas.hue * 30)})`;
      ctx.fillRect(x - 0.9, y - 0.9, 1.8 + beam * 1.1, 1.8);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    // The shadow again, over the near half of the disk.
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(mid, mid, rs * 1.4, 0, Math.PI * 2);
    ctx.fill();

    bendNeighbours();
  }, onScreen && !reduced && !gone);

  // The board goes back to being flat the moment the hole stops looking.
  useEffect(() => () => {
    const board = boardRef.current;
    if (!board) return;
    for (const el of board.querySelectorAll<HTMLElement>('[data-bent]')) {
      el.style.filter = '';
      el.style.transform = el.dataset.bentRest || el.style.transform;
      delete el.dataset.bent;
      delete el.dataset.bentRest;
    }
  }, [boardRef]);

  if (gone) return null;

  return (
    <div
      ref={hostRef}
      className="obj obj--blackhole"
      data-obj="blackhole"
      data-nodrag
      style={{ width: SIZE, height: SIZE, zIndex: 210 }}
      onDoubleClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <canvas ref={canvasRef} width={SIZE * SCALE} height={SIZE * SCALE} style={{ width: SIZE, height: SIZE }} />
      {eaten > 0 ? (
        <span className="hole__count" aria-hidden="true">{eaten}</span>
      ) : null}
      <span className="obj__hint">{t('world.hole.hint')}</span>
      {boardSize.width > 0 ? null : null}
    </div>
  );
}

/** Deterministic stars, sampled as a continuous field so the lens can smear
 *  them. Cheap enough to run once per pixel per frame at this size. */
function starField(x: number, y: number): number {
  const gx = Math.floor(x / 26);
  const gy = Math.floor(y / 26);
  let h = Math.imul(gx * 374761393 + gy * 668265263, 1274126177);
  h ^= h >>> 13;
  const rx = ((h >>> 8) & 255) / 255;
  const ry = ((h >>> 16) & 255) / 255;
  const mag = ((h >>> 24) & 255) / 255;
  const sx = gx * 26 + rx * 26;
  const sy = gy * 26 + ry * 26;
  const d = Math.hypot(x - sx, y - sy);
  const size = 0.7 + mag * 1.9;
  return d > size * 2.2 ? 0 : Math.max(0, 1 - d / (size * 2.2)) * (0.25 + mag * 0.75);
}

/** The board's own grid, carried behind the lens so the squares visibly bow. */
function gridBehind(x: number, y: number): number {
  const period = 26;
  const fx = Math.abs(((x % period) + period) % period - period / 2);
  const fy = Math.abs(((y % period) + period) % period - period / 2);
  const line = Math.min(fx, fy);
  return line < 0.9 ? 1 - line / 0.9 : 0;
}
