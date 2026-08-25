// A game, in a thing that looks like it should have a game in it.
//
// No card that says "play". A small orrery sitting on the desk, and if you push
// the start on it you are flying a probe through a field of drifting masses:
// the probe falls toward every one of them, you steer with the pointer or the
// arrows, and you collect the samples that keep the fuel going. Thirty seconds
// is a good run.
//
// It is a gravity game because everything else on this end of the desk is —
// which is the difference between a minigame made for a board and a clone of
// something else dropped onto one.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { readLocal, writeLocal } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const W = 148;
const H = 118;
const BEST_KEY = 'board.arcade.best';

type Mass = { x: number; y: number; r: number; vx: number; vy: number };
type Sample = { x: number; y: number; a: number };

type Game = {
  ship: { x: number; y: number; vx: number; vy: number; a: number };
  masses: Mass[];
  samples: Sample[];
  fuel: number;
  score: number;
  trail: Array<[number, number]>;
};

function fresh(): Game {
  const masses: Mass[] = [];
  for (let i = 0; i < 3; i += 1) {
    masses.push({
      x: 24 + Math.random() * (W - 48),
      y: 24 + Math.random() * (H - 48),
      r: 5 + Math.random() * 4,
      vx: (Math.random() - 0.5) * 0.06,
      vy: (Math.random() - 0.5) * 0.06,
    });
  }
  const samples: Sample[] = [];
  for (let i = 0; i < 4; i += 1) {
    samples.push({ x: 12 + Math.random() * (W - 24), y: 12 + Math.random() * (H - 24), a: Math.random() * 6 });
  }
  return {
    ship: { x: W / 2, y: H - 18, vx: 0.4, vy: -0.2, a: 0 },
    masses,
    samples,
    fuel: 1,
    score: 0,
    trail: [],
  };
}

export function Arcade() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const game = useRef<Game | null>(null);
  const aim = useRef<{ x: number; y: number } | null>(null);
  const keys = useRef(new Set<string>());
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => readLocal<number>(BEST_KEY, 0));
  const [over, setOver] = useState(false);
  const onScreen = useOnScreen(hostRef);

  const start = useCallback(() => {
    game.current = fresh();
    setScore(0);
    setOver(false);
    setPlaying(true);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const down = (event: KeyboardEvent) => {
      if (!event.key.startsWith('Arrow')) return;
      event.preventDefault();
      keys.current.add(event.key);
    };
    const up = (event: KeyboardEvent) => keys.current.delete(event.key);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [playing]);

  useFrame((dt) => {
    const g = (game.current ??= fresh());
    const step = Math.min(2.2, dt / 16.7);

    // Thrust: toward the pointer, or with the arrows. Both, if you like.
    let tx = 0;
    let ty = 0;
    if (aim.current) {
      const dx = aim.current.x - g.ship.x;
      const dy = aim.current.y - g.ship.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 4) { tx += dx / d; ty += dy / d; }
    }
    if (keys.current.has('ArrowLeft')) tx -= 1;
    if (keys.current.has('ArrowRight')) tx += 1;
    if (keys.current.has('ArrowUp')) ty -= 1;
    if (keys.current.has('ArrowDown')) ty += 1;
    const thrusting = (tx !== 0 || ty !== 0) && g.fuel > 0;
    if (thrusting) {
      const d = Math.hypot(tx, ty) || 1;
      g.ship.vx += (tx / d) * 0.055 * step;
      g.ship.vy += (ty / d) * 0.055 * step;
      g.ship.a = Math.atan2(ty, tx);
      g.fuel = Math.max(0, g.fuel - 0.0022 * step);
    }

    // The masses pull. That is the game.
    for (const mass of g.masses) {
      mass.x += mass.vx * step;
      mass.y += mass.vy * step;
      if (mass.x < 16 || mass.x > W - 16) mass.vx *= -1;
      if (mass.y < 16 || mass.y > H - 16) mass.vy *= -1;
      const dx = mass.x - g.ship.x;
      const dy = mass.y - g.ship.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2);
      const pull = (mass.r * 5.4) / (d2 + 60);
      g.ship.vx += (dx / d) * pull * step;
      g.ship.vy += (dy / d) * pull * step;
      if (d < mass.r + 2.4) {
        setPlaying(false);
        setOver(true);
        setBest((current) => {
          const next = Math.max(current, g.score);
          writeLocal(BEST_KEY, next);
          return next;
        });
        return;
      }
    }

    g.ship.vx *= Math.pow(0.997, step);
    g.ship.vy *= Math.pow(0.997, step);
    g.ship.x += g.ship.vx * step;
    g.ship.y += g.ship.vy * step;
    // The walls are walls, not an ending.
    if (g.ship.x < 3) { g.ship.x = 3; g.ship.vx = Math.abs(g.ship.vx) * 0.6; }
    if (g.ship.x > W - 3) { g.ship.x = W - 3; g.ship.vx = -Math.abs(g.ship.vx) * 0.6; }
    if (g.ship.y < 3) { g.ship.y = 3; g.ship.vy = Math.abs(g.ship.vy) * 0.6; }
    if (g.ship.y > H - 3) { g.ship.y = H - 3; g.ship.vy = -Math.abs(g.ship.vy) * 0.6; }

    g.trail.push([g.ship.x, g.ship.y]);
    if (g.trail.length > 46) g.trail.shift();

    for (let i = g.samples.length - 1; i >= 0; i -= 1) {
      const sample = g.samples[i];
      sample.a += 0.05 * step;
      if (Math.hypot(sample.x - g.ship.x, sample.y - g.ship.y) < 6.5) {
        g.samples.splice(i, 1);
        g.score += 1;
        g.fuel = Math.min(1, g.fuel + 0.26);
        setScore(g.score);
        g.samples.push({ x: 10 + Math.random() * (W - 20), y: 10 + Math.random() * (H - 20), a: 0 });
      }
    }

    if (g.fuel <= 0 && Math.hypot(g.ship.vx, g.ship.vy) < 0.05) {
      setPlaying(false);
      setOver(true);
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,.28)';
    for (let i = 0; i < 26; i += 1) {
      const h = Math.imul(i * 2654435761, 40503);
      ctx.fillRect(((h >>> 9) % W), ((h >>> 17) % H), 1, 1);
    }

    for (const mass of g.masses) {
      const halo = ctx.createRadialGradient(mass.x, mass.y, 0, mass.x, mass.y, mass.r * 4);
      halo.addColorStop(0, 'rgba(120,170,220,.4)');
      halo.addColorStop(1, 'rgba(120,170,220,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(mass.x, mass.y, mass.r * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2b3d52';
      ctx.beginPath(); ctx.arc(mass.x, mass.y, mass.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(150,190,230,.5)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    for (const sample of g.samples) {
      ctx.save();
      ctx.translate(sample.x, sample.y);
      ctx.rotate(sample.a);
      ctx.fillStyle = '#f0c94c';
      ctx.fillRect(-2.2, -2.2, 4.4, 4.4);
      ctx.restore();
    }

    ctx.strokeStyle = 'rgba(232,196,110,.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    g.trail.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.stroke();

    ctx.save();
    ctx.translate(g.ship.x, g.ship.y);
    ctx.rotate(Math.atan2(g.ship.vy, g.ship.vx));
    ctx.fillStyle = '#f4efe2';
    ctx.beginPath();
    ctx.moveTo(4.6, 0); ctx.lineTo(-3.2, 2.8); ctx.lineTo(-1.6, 0); ctx.lineTo(-3.2, -2.8);
    ctx.closePath();
    ctx.fill();
    if (thrusting) {
      ctx.fillStyle = 'rgba(240,170,80,.85)';
      ctx.beginPath();
      ctx.moveTo(-1.8, 1.5); ctx.lineTo(-6 - Math.random() * 3, 0); ctx.lineTo(-1.8, -1.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(240,201,76,.85)';
    ctx.fillRect(4, H - 5, (W - 8) * g.fuel, 2);
  }, playing && onScreen && !reduced);

  const track = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    aim.current = {
      x: ((event.clientX - box.left) / box.width) * W,
      y: ((event.clientY - box.top) / box.height) * H,
    };
  }, []);

  return (
    <ObjectShell id="arcade" label={t('world.game.label')} hint={playing ? undefined : t('world.game.hint')}>
      <div className="game mat-dark" ref={hostRef}>
        <canvas
          ref={canvasRef}
          data-nodrag
          style={{ width: W, height: H }}
          onPointerDown={(event) => { event.stopPropagation(); track(event); if (!playing) start(); }}
          onPointerMove={track}
          onPointerLeave={() => { aim.current = null; }}
        />
        {!playing ? (
          <button className="game__start" type="button" data-nodrag onClick={start}>
            {over ? <><b>{score}</b><span>{t('world.game.again')}</span></> : <span>{t('world.game.start')}</span>}
          </button>
        ) : null}
        <div className="game__hud" data-nodrag>
          <span>{score}</span>
          <span className="game__best">★ {best}</span>
        </div>
      </div>
    </ObjectShell>
  );
}
