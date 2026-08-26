// A coffee cup, and what is under it.
//
// Move the cup and there is a drawing on the slate: two trajectories through
// the Lorenz system, started a thousandth of a unit apart. For a while they are
// the same line. Then they are not. Nothing explains this until you ask it to.

import { useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

const W = 210;
const H = 168;
/** The classic parameters. Nothing here is tuned for looks. */
const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;

type Point = { x: number; y: number; z: number };

function step(p: Point, dt: number): Point {
  // Fourth-order Runge-Kutta: at this step size Euler visibly spirals outward,
  // and an attractor that is wrong is not an attractor.
  const f = (s: Point): Point => ({
    x: SIGMA * (s.y - s.x),
    y: s.x * (RHO - s.z) - s.y,
    z: s.x * s.y - BETA * s.z,
  });
  const add = (a: Point, b: Point, k: number): Point => ({ x: a.x + b.x * k, y: a.y + b.y * k, z: a.z + b.z * k });
  const k1 = f(p);
  const k2 = f(add(p, k1, dt / 2));
  const k3 = f(add(p, k2, dt / 2));
  const k4 = f(add(p, k3, dt));
  return {
    x: p.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: p.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: p.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  };
}

export function LorenzCup() {
  const t = useUiText();
  const { reduced, placeRef } = useWorld();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const state = useRef<{ a: Point; b: Point; trail: Array<[number, number, number, number]>; split: number }>({
    a: { x: 1, y: 1, z: 20 },
    b: { x: 1.001, y: 1, z: 20 },
    trail: [],
    split: 0,
  });
  const [covered, setCovered] = useState(true);
  const [told, setTold] = useState(false);
  const onScreen = useOnScreen(hostRef);

  // The drawing is under the cup, so "uncovered" simply means the cup has been
  // moved off it. The mark stays where it was drawn; the cup is what moves.
  const [home, setHome] = useState<{ x: number; y: number } | null>(null);

  // Where the cup started is where the drawing is. Watching for the cup to be
  // moved off it is a poll rather than a subscription because the cup is moved
  // by the world's own drag, which writes the DOM and not React.
  useEffect(() => {
    const look = () => {
      const at = placeRef.current.get('lorenz');
      if (!at) return;
      setHome((current) => {
        const start = current ?? { x: at.x, y: at.y };
        setCovered(Math.hypot(at.x - start.x, at.y - start.y) < 46);
        return start;
      });
    };
    look();
    const timer = window.setInterval(look, 220);
    return () => window.clearInterval(timer);
  }, [placeRef]);

  useFrame(() => {
    const s = state.current;
    for (let i = 0; i < 6; i += 1) {
      s.a = step(s.a, 0.0045);
      s.b = step(s.b, 0.0045);
      // 24 units across the attractor's x range, mapped into the paper.
      s.trail.push([s.a.x, s.a.z, s.b.x, s.b.z]);
    }
    if (s.trail.length > 2600) s.trail.splice(0, s.trail.length - 2600);
    s.split = Math.hypot(s.a.x - s.b.x, s.a.y - s.b.y, s.a.z - s.b.z);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const px = (x: number) => W / 2 + x * 3.1;
    const py = (z: number) => H - 12 - (z - 4) * 2.7;

    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    for (const [which, colour] of [[0, 'rgba(232,196,110,.9)'], [1, 'rgba(122,178,214,.85)']] as const) {
      ctx.strokeStyle = colour;
      ctx.beginPath();
      for (let i = 0; i < s.trail.length; i += 1) {
        const point = s.trail[i];
        const x = px(which === 0 ? point[0] : point[2]);
        const y = py(which === 0 ? point[1] : point[3]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // The two heads, so the moment they part company is visible.
    ctx.fillStyle = '#f2d99a';
    ctx.beginPath(); ctx.arc(px(s.a.x), py(s.a.z), 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9ecbe8';
    ctx.beginPath(); ctx.arc(px(s.b.x), py(s.b.z), 2.1, 0, Math.PI * 2); ctx.fill();
  }, onScreen && !covered && !!home && !reduced);

  return (
    <>
      {/* Drawn on the slate itself, under everything, where the cup was. */}
      <div
        className={`lorenz${covered || !home ? ' lorenz--hidden' : ''}`}
        ref={hostRef}
        style={{ left: (home?.x ?? 0) - (W - 124) / 2, top: (home?.y ?? 0) - (H - 124) / 2 }}
        aria-hidden={covered || !home || undefined}
      >
        <canvas ref={canvasRef} style={{ width: W, height: H }} />
        <button
          className="lorenz__ask"
          type="button"
          data-nodrag
          onClick={() => setTold((v) => !v)}
          aria-label={t('world.lorenz.ask')}
        >?</button>
        {told ? <span className="lorenz__told">{t('world.lorenz.answer')}</span> : null}
      </div>

      <ObjectShell id="lorenz" hint={t('world.cup.hint')} label={t('world.cup.label')}>
        <div className="cup">
          <span className="cup__ring" aria-hidden="true" />
          <span className="cup__body" aria-hidden="true" />
          <span className="cup__handle" aria-hidden="true" />
          <span className="cup__coffee" aria-hidden="true" />
          <span className="cup__steam" aria-hidden="true"><i /><i /><i /></span>
        </div>
      </ObjectShell>
    </>
  );
}
