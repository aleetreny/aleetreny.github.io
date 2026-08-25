// A dish of ferrofluid, and a magnet you can pick up.
//
// A magnetic liquid on a flat surface is doing two sums at once. The field
// wants it to pile up along the field lines; gravity and surface tension want
// it flat. Below a critical field strength the flat surface wins everywhere.
// Above it — the Rosensweig instability — the flat surface stops being the
// cheapest answer, and the liquid breaks into a lattice of peaks, close to
// hexagonal, whose height grows with how far past critical the field has gone
// and whose spacing is set by the fluid, not by the magnet.
//
// That is what is modelled here: a hexagonal lattice of sites, each with a
// height that springs toward √(B − B꜀) and lags behind it, so the crown grows
// where the magnet is, follows it when it slides, and slumps when it leaves.
// It is a caricature of the free-energy calculation and an honest picture of
// the result.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { clamp } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const W = 226;
const H = 178;
/** The dish, seen at a shallow angle: round in plan, an oval on the glass. */
const DISH = { x: 86, y: 100, rx: 76, ry: 47 };
/** Lattice pitch. In a real dish this is set by the fluid's density and
 *  surface tension, and it does not change with the magnet. Neither does this. */
const PITCH = 14.5;
/** Below this the surface stays flat, however close the magnet gets. */
const CRITICAL = 0.24;

type Site = { x: number; y: number; h: number; v: number; k: number };

/** A hexagonal packing clipped to the dish. */
function lattice(): Site[] {
  const made: Site[] = [];
  const rowH = PITCH * 0.866;
  for (let row = -6; row <= 6; row += 1) {
    for (let col = -8; col <= 8; col += 1) {
      const x = DISH.x + col * PITCH + (row % 2 ? PITCH / 2 : 0);
      const y = DISH.y + row * rowH * 0.62;
      const nx = (x - DISH.x) / DISH.rx;
      const ny = (y - DISH.y) / DISH.ry;
      const r = Math.hypot(nx, ny);
      if (r > 0.94) continue;
      // The rim holds the fluid down a little, as a meniscus does.
      made.push({ x, y, h: 0, v: 0, k: 1 - Math.pow(r, 3) * 0.45 });
    }
  }
  return made;
}

type Magnet = { x: number; y: number; upright: boolean };

export function Ferrofluid() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sites = useRef<Site[] | null>(null);
  const magnet = useRef<Magnet>({ x: 196, y: 40, upright: true });
  const [upright, setUpright] = useState(true);
  const [held, setHeld] = useState(false);
  const magnetRef = useRef<HTMLButtonElement | null>(null);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 100);

  const placeMagnet = useCallback(() => {
    const el = magnetRef.current;
    if (el) el.style.transform = `translate(${magnet.current.x - 20}px, ${magnet.current.y - 13}px)`;
  }, []);

  const draw = useCallback((list: Site[]) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // The dish: a shallow black bowl with a wet rim.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(DISH.x, DISH.y, DISH.rx + 7, DISH.ry + 6, 0, 0, Math.PI * 2);
    const bowl = ctx.createLinearGradient(0, DISH.y - DISH.ry - 8, 0, DISH.y + DISH.ry + 8);
    bowl.addColorStop(0, '#4c5257');
    bowl.addColorStop(0.4, '#2a2f33');
    bowl.addColorStop(1, '#171a1d');
    ctx.fillStyle = bowl;
    ctx.fill();
    ctx.strokeStyle = 'rgba(226,240,246,.28)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.restore();

    // The pool. Black, and shiny in the way only a liquid is.
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(DISH.x, DISH.y, DISH.rx, DISH.ry, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#07090b';
    ctx.fillRect(0, 0, W, H);
    const sheen = ctx.createRadialGradient(DISH.x - 26, DISH.y - 22, 2, DISH.x - 20, DISH.y - 16, 62);
    sheen.addColorStop(0, 'rgba(180,206,224,.34)');
    sheen.addColorStop(0.5, 'rgba(120,150,172,.09)');
    sheen.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, W, H);

    // The crown, back to front, so the near peaks overlap the far ones.
    const sorted = [...list].filter((s) => s.h > 0.35).sort((a, b) => a.y - b.y);
    for (const s of sorted) {
      const h = s.h;
      const base = clamp(3.4 + h * 0.2, 3.4, 8.2);
      const tipX = s.x + h * 0.1;
      const tipY = s.y - h;
      ctx.beginPath();
      ctx.moveTo(s.x - base, s.y);
      ctx.quadraticCurveTo(s.x - base * 0.62, s.y - h * 0.62, tipX, tipY);
      ctx.quadraticCurveTo(s.x + base * 0.62, s.y - h * 0.62, s.x + base, s.y);
      ctx.ellipse(s.x, s.y, base, base * 0.42, 0, 0, Math.PI);
      ctx.closePath();
      const cone = ctx.createLinearGradient(s.x - base * 1.1, tipY, s.x + base, s.y + 2);
      cone.addColorStop(0, '#7c8b97');
      cone.addColorStop(0.22, '#2b333a');
      cone.addColorStop(0.6, '#0d1114');
      cone.addColorStop(1, '#030507');
      ctx.fillStyle = cone;
      ctx.fill();
      // The specular line down the lit flank, and a bead on the tip. Without
      // them a crown of ferrofluid is a row of grey triangles; with them it is
      // the black mirror everyone recognises.
      ctx.beginPath();
      ctx.moveTo(tipX - 0.5, tipY + 1);
      ctx.quadraticCurveTo(s.x - base * 0.52, s.y - h * 0.52, s.x - base * 0.34, s.y - 1);
      ctx.lineWidth = clamp(h * 0.055, 0.7, 1.9);
      ctx.strokeStyle = `rgba(222,240,250,${clamp(0.24 + h * 0.011, 0.24, 0.66).toFixed(3)})`;
      ctx.stroke();
      if (h > 6) {
        ctx.beginPath();
        ctx.arc(tipX - 0.4, tipY + 1.1, clamp(h * 0.035, 0.5, 1.3), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(236,248,255,.75)';
        ctx.fill();
      }
    }
    ctx.restore();

    // The rim last, so the fluid is inside the dish and not on top of it.
    ctx.beginPath();
    ctx.ellipse(DISH.x, DISH.y, DISH.rx, DISH.ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(150,170,182,.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  useEffect(() => { placeMagnet(); draw(sites.current ??= lattice()); }, [draw, placeMagnet]);

  useFrame((dt) => {
    const list = (sites.current ??= lattice());
    const step = Math.min(2.2, dt / 16.7);
    const m = magnet.current;
    // A pole pointing down concentrates the field into a small, fierce patch;
    // the same magnet laid flat spreads a weaker one over a wider area.
    const power = m.upright ? 1 : 0.62;
    const spread = m.upright ? 34 : 52;

    for (const s of list) {
      const dx = s.x - m.x;
      const dy = (s.y - m.y) * 1.5;
      // A pole standing over the dish is a point source close to the surface;
      // the same magnet laid on its side is further from it and blurred along
      // its length, which is what `spread` stands in for.
      const r2 = dx * dx + dy * dy + spread * spread;
      // Dipole-ish falloff, which is close enough and never divides by zero.
      const field = (power * 26000) / (r2 * Math.sqrt(r2));
      const over = field * s.k - CRITICAL;
      const target = over > 0 ? Math.sqrt(over) * 52 : 0;
      s.v += (target - s.h) * 0.09 * step;
      s.v *= Math.pow(0.86, step);
      s.h += s.v * step;
      if (s.h < 0) { s.h = 0; s.v *= -0.3; }
    }
    draw(list);
  }, onScreen && detailed && !reduced);

  /** A magnet dropped in or beside the dish sends a ring out through the
   *  fluid. It is the one moment the surface is doing something the field did
   *  not ask for. */
  const splash = useCallback(() => {
    const list = sites.current;
    if (!list) return;
    const m = magnet.current;
    for (const s of list) {
      const d = Math.hypot(s.x - m.x, (s.y - m.y) * 1.4);
      if (d > 96) continue;
      s.v += Math.cos(d * 0.16) * (1 - d / 96) * 5.2;
    }
  }, []);

  const grab = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const host = hostRef.current;
    if (!host) return;
    const box = host.getBoundingClientRect();
    const k = box.width / (host.offsetWidth || 1) || 1;
    const from = { ...magnet.current };
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    setHeld(true);
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) / k;
      const dy = (ev.clientY - start.y) / k;
      if (!moved && Math.hypot(dx, dy) > 3) moved = true;
      magnet.current = {
        ...magnet.current,
        x: clamp(from.x + dx, 10, W - 10),
        y: clamp(from.y + dy, 10, H - 10),
      };
      placeMagnet();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      setHeld(false);
      if (!moved) {
        // A tap stands it on its pole, or lays it down again.
        magnet.current = { ...magnet.current, upright: !magnet.current.upright };
        setUpright(magnet.current.upright);
        return;
      }
      const m = magnet.current;
      const near = Math.hypot((m.x - DISH.x) / DISH.rx, (m.y - DISH.y) / DISH.ry) < 1.5;
      if (near) splash();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [placeMagnet, splash]);

  return (
    <ObjectShell id="ferrofluid" label={t('world.ferro.label')} hint={t('world.ferro.hint')}>
      <div className="ferro" ref={hostRef}>
        <canvas ref={canvasRef} data-nodrag style={{ width: W, height: H }} />
        <button
          className={`ferro__magnet${upright ? ' is-up' : ''}${held ? ' is-held' : ''}`}
          ref={magnetRef}
          type="button"
          data-nodrag
          onPointerDown={grab}
          aria-label={t('world.ferro.magnet')}
          title={t('world.ferro.magnet')}
        >
          <span className="ferro__pole ferro__pole--n">N</span>
          <span className="ferro__pole ferro__pole--s">S</span>
        </button>
      </div>
    </ObjectShell>
  );
}
