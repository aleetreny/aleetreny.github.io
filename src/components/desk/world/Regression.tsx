// A scatterplot you can ruin.
//
// Drag a point far enough away and watch the least-squares line go with it.
// That is the demonstration: OLS minimises squared residuals, so one point at
// twenty units of error outvotes fifty points at one. Flip the switch and the
// same data is fitted by Theil–Sen instead, which takes the median slope over
// every pair and therefore does not care what you did to that one point.

import { useCallback, useMemo, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { mulberry32 } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 176;
const H = 118;

type Point = { id: number; x: number; y: number };

function startingPoints(): Point[] {
  const rand = mulberry32(424242);
  return Array.from({ length: 16 }, (_, i) => {
    const x = 10 + (i / 15) * (W - 26) + (rand() - 0.5) * 8;
    const y = H - 18 - ((x - 10) / (W - 26)) * (H - 42) + (rand() - 0.5) * 22;
    return { id: i, x, y: Math.max(8, Math.min(H - 10, y)) };
  });
}

/** Ordinary least squares. */
function ols(points: Point[]): { m: number; b: number } | null {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0; let sy = 0; let sxx = 0; let sxy = 0;
  for (const p of points) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; }
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-9) return null;
  const m = (n * sxy - sx * sy) / denom;
  return { m, b: (sy - m * sx) / n };
}

/** Theil–Sen: the median of the pairwise slopes, and the median intercept
 *  under it. Half the data can be nonsense before it moves. */
function theilSen(points: Point[]): { m: number; b: number } | null {
  const n = points.length;
  if (n < 2) return null;
  const slopes: number[] = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const dx = points[j].x - points[i].x;
      if (Math.abs(dx) < 1e-6) continue;
      slopes.push((points[j].y - points[i].y) / dx);
    }
  }
  if (slopes.length === 0) return null;
  const median = (list: number[]) => {
    const sorted = [...list].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const m = median(slopes);
  return { m, b: median(points.map((p) => p.y - m * p.x)) };
}

export function Regression() {
  const t = useUiText();
  const [points, setPoints] = useState<Point[]>(startingPoints);
  const [robust, setRobust] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const nextId = useRef(100);

  const fit = useMemo(() => (robust ? theilSen(points) : ols(points)), [points, robust]);
  const other = useMemo(() => (robust ? ols(points) : theilSen(points)), [points, robust]);

  const local = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const box = svg.getBoundingClientRect();
    return { x: ((clientX - box.left) / box.width) * W, y: ((clientY - box.top) / box.height) * H };
  }, []);

  const grab = useCallback((id: number) => (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const move = (ev: PointerEvent) => {
      const at = local(ev.clientX, ev.clientY);
      if (!at) return;
      setPoints((current) => current.map((p) => (p.id === id ? { ...p, x: at.x, y: at.y } : p)));
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      // Dragged clean off the paper: the point is gone.
      const at = local(ev.clientX, ev.clientY);
      if (at && (at.x < -14 || at.x > W + 14 || at.y < -14 || at.y > H + 14)) {
        setPoints((current) => current.filter((p) => p.id !== id));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [local]);

  const add = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    event.stopPropagation();
    if ((event.target as Element).tagName === 'circle') return;
    const at = local(event.clientX, event.clientY);
    if (!at) return;
    setPoints((current) => [...current, { id: (nextId.current += 1), x: at.x, y: at.y }]);
  }, [local]);

  const line = (f: { m: number; b: number } | null) => {
    if (!f) return null;
    // Clipped to the paper rather than drawn to infinity.
    return { x1: 4, y1: f.m * 4 + f.b, x2: W - 4, y2: f.m * (W - 4) + f.b };
  };
  const main = line(fit);
  const ghost = line(other);

  return (
    <ObjectShell id="regression" label={t('world.fit.label')} hint={t('world.fit.hint')}>
      <div className="fit mat-paper">
        <span className="fit__tape" aria-hidden="true" />
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          data-nodrag
          onPointerDown={add}
          onDoubleClick={(event) => { event.stopPropagation(); setPoints(startingPoints()); }}
        >
          <g className="fit__grid" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => <line key={`v${i}`} x1={8 + i * 26} y1="6" x2={8 + i * 26} y2={H - 6} />)}
            {Array.from({ length: 5 }, (_, i) => <line key={`h${i}`} x1="6" y1={8 + i * 25} x2={W - 6} y2={8 + i * 25} />)}
          </g>
          {/* residuals: the thing OLS is actually minimising */}
          {main ? points.map((p) => (
            <line key={`r${p.id}`} className="fit__res" x1={p.x} y1={p.y} x2={p.x} y2={main.y1 + ((main.y2 - main.y1) * (p.x - main.x1)) / (main.x2 - main.x1)} />
          )) : null}
          {ghost ? <line className="fit__ghost" x1={ghost.x1} y1={ghost.y1} x2={ghost.x2} y2={ghost.y2} /> : null}
          {main ? <line className="fit__line" x1={main.x1} y1={main.y1} x2={main.x2} y2={main.y2} /> : null}
          {points.map((p) => (
            <circle key={p.id} className="fit__pt" cx={p.x} cy={p.y} r="3.4" onPointerDown={grab(p.id)} />
          ))}
        </svg>
        <div className="fit__bar" data-nodrag>
          <button type="button" className={robust ? '' : 'is-on'} onClick={() => setRobust(false)}>OLS</button>
          <button type="button" className={robust ? 'is-on' : ''} onClick={() => setRobust(true)}>Robust</button>
          <span className="fit__slope">{fit ? `β ${(-fit.m).toFixed(2)}` : '—'}</span>
        </div>
      </div>
    </ObjectShell>
  );
}
