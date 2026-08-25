// A glass plate with seeds in it, and the two pictures that live in every set
// of points.
//
// Drop a handful of seeds on a plate and ask, of every point on the glass,
// which seed is nearest: the answer partitions the plate into cells, and the
// cells look like crystal because that is very nearly how crystal grains form
// — each grain nucleates somewhere and grows until it meets another. Ask
// instead which seeds are *neighbours*, and you get the dual picture: the
// Delaunay triangulation, the strut work under the mosaic.
//
// They are the same object seen twice, so the lever does not switch between two
// drawings — it dissolves one into the other, and the facets retreat to their
// seeds as the struts draw themselves in between them.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { delaunayEdges, voronoiCells, type Point } from '../../../lib/world/geometry';
import { clamp, mulberry32 } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 158;
const H = 158;
const PLATE = { x: 0, y: 0, w: W, h: H };
const MIN_SEEDS = 3;
const MAX_SEEDS = 16;
/** How close a click has to land to count as taking hold of a seed. */
const GRAB = 9;

function startingSeeds(count: number): Point[] {
  // Poisson-ish rather than uniform: evenly spread seeds make handsome cells,
  // and three seeds in a huddle make one enormous one and two slivers.
  const rand = mulberry32(90210);
  const made: Point[] = [];
  let guard = 0;
  while (made.length < count && guard < 900) {
    guard += 1;
    const p = { x: 14 + rand() * (W - 28), y: 14 + rand() * (H - 28) };
    if (made.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > 26)) made.push(p);
  }
  return made;
}

export function VoronoiPlate() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [seeds, setSeeds] = useState<Point[]>(() => startingSeeds(9));
  const [wire, setWire] = useState(false);
  const mix = useRef(0);
  const [morphing, setMorphing] = useState(false);
  const onScreen = useOnScreen(hostRef);

  const cells = useMemo(() => voronoiCells(seeds, PLATE), [seeds]);
  const edges = useMemo(() => delaunayEdges(cells), [cells]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const m = mix.current;

    // ---- the crystal ----
    if (m < 0.995) {
      const shrink = 1 - m * 0.86;
      for (const cell of cells) {
        if (cell.polygon.length < 3) continue;
        const seed = seeds[cell.seed];
        const hue = 188 + ((cell.seed * 47) % 96);
        ctx.beginPath();
        cell.polygon.forEach((p, i) => {
          const x = seed.x + (p.x - seed.x) * shrink;
          const y = seed.y + (p.y - seed.y) * shrink;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.closePath();
        // Glass: a cool wash, a brighter shoulder toward the light, and a rim.
        const glass = ctx.createLinearGradient(seed.x - 30, seed.y - 30, seed.x + 26, seed.y + 30);
        glass.addColorStop(0, `hsla(${hue}, 48%, 74%, ${(0.4 * (1 - m)).toFixed(3)})`);
        glass.addColorStop(0.55, `hsla(${hue - 14}, 42%, 52%, ${(0.3 * (1 - m)).toFixed(3)})`);
        glass.addColorStop(1, `hsla(${hue + 18}, 36%, 32%, ${(0.34 * (1 - m)).toFixed(3)})`);
        ctx.fillStyle = glass;
        ctx.fill();
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = `hsla(${hue + 10}, 70%, 84%, ${(0.5 * (1 - m)).toFixed(3)})`;
        ctx.stroke();
      }
    }

    // ---- the struts ----
    if (m > 0.005) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(232,196,110,${(0.72 * m).toFixed(3)})`;
      ctx.beginPath();
      for (const [a, b] of edges) {
        ctx.moveTo(seeds[a].x, seeds[a].y);
        ctx.lineTo(seeds[b].x, seeds[b].y);
      }
      ctx.stroke();
    }

    // ---- the seeds themselves, always ----
    for (const seed of seeds) {
      ctx.beginPath();
      ctx.arc(seed.x, seed.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(248,242,226,.95)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(seed.x, seed.y, 4.6, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(232,196,110,.5)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }
  }, [cells, edges, seeds]);

  useEffect(() => { paint(); }, [paint]);

  useFrame((dt) => {
    const want = wire ? 1 : 0;
    const k = Math.min(1, dt / 260);
    mix.current += (want - mix.current) * k;
    if (Math.abs(want - mix.current) < 0.004) { mix.current = want; setMorphing(false); }
    paint();
  }, morphing && onScreen && !reduced);

  const local = useCallback((event: React.PointerEvent) => {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box) return null;
    return { x: ((event.clientX - box.left) / box.width) * W, y: ((event.clientY - box.top) / box.height) * H };
  }, []);

  const onDown = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    const at = local(event);
    if (!at) return;
    let nearest = -1;
    let best = GRAB;
    seeds.forEach((seed, i) => {
      const d = Math.hypot(seed.x - at.x, seed.y - at.y);
      if (d < best) { best = d; nearest = i; }
    });

    // Alt on a seed lifts it out; anywhere empty drops a new one in.
    if (nearest >= 0 && (event.altKey || event.shiftKey)) {
      if (seeds.length > MIN_SEEDS) setSeeds((current) => current.filter((_, i) => i !== nearest));
      return;
    }
    if (nearest < 0) {
      if (seeds.length < MAX_SEEDS) setSeeds((current) => [...current, at]);
      return;
    }

    const move = (ev: PointerEvent) => {
      const box = canvasRef.current?.getBoundingClientRect();
      if (!box) return;
      const x = clamp(((ev.clientX - box.left) / box.width) * W, 4, W - 4);
      const y = clamp(((ev.clientY - box.top) / box.height) * H, 4, H - 4);
      setSeeds((current) => current.map((seed, i) => (i === nearest ? { x, y } : seed)));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [local, seeds]);

  return (
    <ObjectShell id="voronoi" label={t('world.crystal.label')} hint={t('world.crystal.hint')}>
      <div className={`crystal${wire ? ' crystal--wire' : ''}`} ref={hostRef}>
        <span className="crystal__bezel mat-metal" aria-hidden="true" />
        <span className="crystal__glass" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          data-nodrag
          style={{ width: W, height: H }}
          onPointerDown={onDown}
          onDoubleClick={(event) => event.stopPropagation()}
        />
        <button
          className="crystal__lever"
          type="button"
          data-nodrag
          onClick={() => {
            setWire((v) => !v);
            // The dissolve is started by the hand that asked for it.
            if (reduced) { mix.current = wire ? 0 : 1; paint(); } else setMorphing(true);
          }}
          aria-label={t('world.crystal.toggle')}
          title={t('world.crystal.toggle')}
        >
          <span className="crystal__stem" />
          <span className="crystal__knob" />
        </button>
        <span className="crystal__plate" aria-hidden="true">{wire ? 'DELAUNAY' : 'VORONOI'}</span>
      </div>
    </ObjectShell>
  );
}
