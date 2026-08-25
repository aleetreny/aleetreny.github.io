// A small, forgiving pixel runner. Jump the cacti; that is the whole deal.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { readLocal, writeLocal } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const W = 148;
const H = 118;
const GROUND = 93;
const BEST_KEY = 'board.arcade.best';

type Cactus = { x: number; w: number; h: number };
type Game = { y: number; vy: number; duck: boolean; cacti: Cactus[]; score: number; since: number };

function fresh(): Game {
  return { y: 0, vy: 0, duck: false, cacti: [{ x: W + 36, w: 8, h: 25 }], score: 0, since: 0 };
}

export function Arcade() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const game = useRef<Game>(fresh());
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

  const jump = useCallback(() => {
    const g = game.current;
    if (!playing) { start(); return; }
    if (g.y <= 0.5) g.vy = -6.6;
  }, [playing, start]);

  useEffect(() => {
    if (!playing) return undefined;
    const down = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
      if (event.key === 'ArrowDown') game.current.duck = true;
    };
    const up = (event: KeyboardEvent) => { if (event.key === 'ArrowDown') game.current.duck = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [jump, playing]);

  useFrame((dt) => {
    const g = game.current;
    const step = Math.min(2.1, dt / 16.7);
    if (playing) {
      const speed = 2.25 + Math.min(2.15, g.score / 90);
      g.vy += 0.43 * step;
      g.y = Math.min(0, g.y + g.vy * step);
      if (g.y === 0) g.vy = 0;
      g.since += dt;
      g.cacti = g.cacti
        .map((cactus) => ({ ...cactus, x: cactus.x - speed * step }))
        .filter((cactus) => cactus.x + cactus.w > -3);
      const lastCactus = g.cacti[g.cacti.length - 1];
      if (g.since > 780 + Math.random() * 750 && (!lastCactus || lastCactus.x < W - 38)) {
        g.cacti.push({ x: W + 10, w: Math.random() > .72 ? 15 : 8, h: 18 + Math.round(Math.random() * 10) });
        g.since = 0;
      }
      const dinoH = g.duck && g.y === 0 ? 12 : 20;
      const dinoTop = GROUND - dinoH + g.y;
      const hit = g.cacti.some((cactus) => (
        23 + 13 > cactus.x + 1 && 23 < cactus.x + cactus.w - 1
        && dinoTop + dinoH > GROUND - cactus.h && dinoTop < GROUND
      ));
      if (hit) {
        setPlaying(false);
        setOver(true);
        setBest((current) => {
          const next = Math.max(current, g.score);
          writeLocal(BEST_KEY, next);
          return next;
        });
      } else {
        const nextScore = Math.floor(g.score + dt / 54);
        if (nextScore !== g.score) { g.score = nextScore; setScore(nextScore); }
      }
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) { canvas.width = W * dpr; canvas.height = H * dpr; }
    drawGame(ctx, dpr, g);
  }, onScreen && !reduced);

  return (
    <ObjectShell id="arcade" label={t('world.game.label')} hint={playing ? undefined : t('world.game.hint')}>
      <div className="game mat-dark" ref={hostRef}>
        <canvas ref={canvasRef} data-nodrag style={{ width: W, height: H }} onPointerDown={(event) => { event.stopPropagation(); jump(); }} />
        {!playing ? (
          <button className="game__start" type="button" data-nodrag onClick={start}>
            {over ? <><b>{score}</b><span>{t('world.game.again')}</span></> : <span>{t('world.game.start')}</span>}
          </button>
        ) : null}
        <div className="game__hud" data-nodrag><span>↑ / espacio</span><span className="game__best">★ {best}</span></div>
      </div>
    </ObjectShell>
  );
}

function drawGame(ctx: CanvasRenderingContext2D, dpr: number, game: Game) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#f4f1e7';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#41413c';
  ctx.fillRect(0, GROUND, W, 1);
  for (let x = (game.score * -2) % 18; x < W; x += 18) ctx.fillRect(x, GROUND + 6, 7, 1);
  for (const cactus of game.cacti) drawCactus(ctx, cactus);
  drawDino(ctx, 23, GROUND + game.y, game.duck && game.y === 0);
  ctx.fillStyle = '#575650';
  ctx.font = '7px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(String(game.score).padStart(4, '0'), W - 5, 10);
}

function drawDino(ctx: CanvasRenderingContext2D, x: number, feet: number, duck: boolean) {
  const h = duck ? 12 : 20;
  const y = feet - h;
  ctx.fillStyle = '#41413c';
  ctx.fillRect(x, y + 4, duck ? 16 : 8, h - 6);
  ctx.fillRect(x + (duck ? 12 : 5), y, 8, 8);
  ctx.fillRect(x + (duck ? 18 : 11), y + 4, 5, 4);
  ctx.fillRect(x + 2, feet - 3, 4, 3);
  ctx.fillRect(x + (duck ? 11 : 7), feet - 3, 4, 3);
  ctx.fillStyle = '#f4f1e7';
  ctx.fillRect(x + (duck ? 17 : 9), y + 2, 1, 1);
}

function drawCactus(ctx: CanvasRenderingContext2D, cactus: Cactus) {
  const y = GROUND - cactus.h;
  ctx.fillStyle = '#41413c';
  ctx.fillRect(cactus.x, y, 5, cactus.h);
  if (cactus.w > 8) ctx.fillRect(cactus.x + 7, y + 7, 5, cactus.h - 7);
  ctx.fillRect(cactus.x - 3, y + 9, 3, 4);
  ctx.fillRect(cactus.x + 5, y + 5, 3, 4);
}
