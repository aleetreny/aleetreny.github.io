// Two hundred people, on one canvas.
//
// They used to be a div each with an svg inside and CSS keyframes for the
// limbs, which is a perfectly good way to draw thirty of them and a terrible
// way to draw three hundred: thirty-eight of them cost twenty-four
// milliseconds a frame in layers and transform writes alone.
//
// So they are drawn instead — one canvas, pinned to the window rather than to
// the four-thousand-unit board, with the camera folded into the context
// transform so everything below is written in plain board coordinates. Figures
// of the same trade are accumulated into one Path2D and stroked together, so
// two hundred people cost about thirty draw calls; anybody off screen is never
// touched; and when the board is zoomed out far enough that a person is four
// pixels tall they are drawn as the four pixels rather than as a skeleton.
//
// The canvas takes no pointer events at all — it would swallow the whole board
// if it did. Picking somebody up is a capture-phase listener that only claims
// the event when the pointer actually came down on one of them.

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useWorld } from '../../../lib/world/context';
import { useFrame } from '../../../lib/world/frame';
import { OBJECT_SPECS } from '../../../lib/world/kinds';
import { cityFor } from '../../../lib/world/city';
import { paintCity, paintRain, type View } from '../../../lib/world/paint';
import { hashString, mulberry32 } from '../../../lib/world/rng';
import {
  BAD, JOBS, corral, drop, driveCars, hire, mingle, stepWorker, traffic,
  type Car, type Job, type Station, type Worker,
} from '../../../lib/world/crew';

/** How many of them. The canvas does not care much; this is chosen for how
 *  busy the board should look, not for what it can afford. */
const CREW = 230;
const CARS = 90;
/** Figure height in board units. Small on purpose: you find them. */
const TALL = 27;
/** Below this many screen pixels tall, a figure is a spark instead. */
const SPARK = 7;
/** And below this, a figure has no limbs worth drawing. */
const PLAIN = 15;
/** How many figures are worth drawing in full at once. Past this the crowd is
 *  a crowd: the ones over the budget lose their limbs, and the soft glow pass
 *  behind all of them is dropped. Stroking two thousand round-capped segments
 *  twice is what a busy board actually costs, and nobody can pick one welder
 *  out of a hundred and fifty anyway. */
const BUDGET = 95;

const TRADE: Record<Job, string> = {
  welder: '#7cf9ff', sparks: '#ffe86b', porter: '#a6ff6e', sweeper: '#8b9cff',
  surveyor: '#ff9de0', oiler: '#ffb066', painter: '#6effc4', inspector: '#d3a6ff',
  mason: '#ffd28a', glazier: '#9ef0ff', roofer: '#ff8f8f', signaller: '#c0ff5a',
  digger: '#ffa5d8', medic: '#ff6b6b',
};
const PAINT = ['#7cf9ff', '#ffe86b', '#a6ff6e', '#ff7ce0', '#c9b6ff'];

/** How broken a thing is. Deterministic, so the same card is always the one
 *  with the scaffolding round it. */
export function damageOf(id: string): number {
  return (hashString(id) % 1000) / 1000;
}

export function UvCrew({ boardSize }: { boardSize: { width: number; height: number } }) {
  const world = useWorld();
  const { objects, placeRef, swallowed, reduced, boardRef } = world;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const crew = useRef<Worker[]>([]);
  const cars = useRef<Car[]>([]);
  const stations = useRef<Station[]>([]);
  const dice = useRef(mulberry32(90210));
  const since = useRef(0);
  const held = useRef<Worker | null>(null);
  /** The city, painted into a buffer the size of the window and kept until the
   *  camera moves. Standing still it is one drawImage a frame. */
  const sky = useRef<{ canvas: HTMLCanvasElement; k: number; x: number; y: number; w: number; h: number } | null>(null);

  const city = useMemo(() => cityFor(boardSize.width, boardSize.height), [boardSize.height, boardSize.width]);

  /** Everything worth working on: the objects and the cards where they are now,
   *  and the city's own doorsteps for the people who live out there. */
  const survey = useCallback((): Station[] => {
    const found: Station[] = [];
    for (const object of objects) {
      if (!object.visible || swallowed.includes(object.id)) continue;
      const at = placeRef.current.get(object.id);
      if (!at) continue;
      const spec = OBJECT_SPECS[object.id];
      found.push({
        id: object.id,
        x: at.x, y: at.y,
        w: spec.w * at.scale, h: spec.h * at.scale,
        where: 'site',
        damage: damageOf(object.id),
      });
    }
    // The cards are laid out by the board, not by the world, so their boxes are
    // read off the elements. Offsets are layout, not screen: the camera does
    // not touch them.
    for (const node of document.querySelectorAll<HTMLElement>('.desk__board [data-card]')) {
      const id = node.dataset.card ?? '';
      if (!id || node.offsetWidth < 40) continue;
      found.push({
        id: `card:${id}`,
        x: node.offsetLeft, y: node.offsetTop,
        w: node.offsetWidth, h: node.offsetHeight,
        where: 'site',
        damage: damageOf(id),
      });
    }
    for (const b of city.buildings) {
      found.push({ id: `b${b.x}:${b.y}`, x: b.x, y: b.y - 6, w: b.w, h: 12, where: 'town', damage: 0.2 });
    }
    return found;
  }, [city.buildings, objects, placeRef, swallowed]);

  useEffect(() => {
    stations.current = survey();
    if (crew.current.length === 0) {
      crew.current = hire(CREW, stations.current, 424242);
      cars.current = traffic(CARS, city.lanes.length, 8080);
    }
  }, [city.lanes.length, survey]);

  /** Pick somebody up. The canvas cannot be a pointer target — it covers the
   *  window — so this watches for a press anywhere and only claims it when it
   *  landed on a person. */
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return undefined;
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const rect = board.getBoundingClientRect();
      const k = rect.width / (board.offsetWidth || 1) || 1;
      const bx = (event.clientX - rect.left) / k;
      const by = (event.clientY - rect.top) / k;
      let best: Worker | null = null;
      let near = 18;
      for (const worker of crew.current) {
        const dx = worker.x - bx;
        const dy = worker.y - TALL / 2 - by;
        const gap = Math.hypot(dx, dy);
        if (gap < near) { near = gap; best = worker; }
      }
      if (!best) return;
      // It was one of them: nothing else on the board gets to see this press.
      event.stopPropagation();
      event.preventDefault();
      const worker = best;
      const from = { x: worker.x, y: worker.y };
      const start = { x: event.clientX, y: event.clientY };
      worker.mood = 'held';
      worker.spin = 0;
      held.current = worker;
      const move = (ev: PointerEvent) => {
        worker.x = from.x + (ev.clientX - start.x) / k;
        worker.y = from.y + (ev.clientY - start.y) / k;
        corral(worker, city.bounds);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        held.current = null;
        stations.current = survey();
        drop(worker, stations.current, dice.current);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    };
    window.addEventListener('pointerdown', down, true);
    return () => window.removeEventListener('pointerdown', down, true);
  }, [boardRef, city.bounds, survey]);

  useFrame((dt, now) => {
    const canvas = canvasRef.current;
    const board = boardRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !board || !ctx) return;

    // One read of the camera, before anything is written anywhere.
    const rect = board.getBoundingClientRect();
    const k = rect.width / (board.offsetWidth || 1) || 1;
    // One device pixel per CSS pixel, deliberately. Everything drawn here is a
    // small glowing figure or a soft blob; at two, the clear and the blit alone
    // are four million pixels of work a frame for detail nobody can see.
    const dpr = 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (canvas.width !== Math.round(vw * dpr)) {
      canvas.width = Math.round(vw * dpr);
      canvas.height = Math.round(vh * dpr);
    }

    // ---- the world moves on ---------------------------------------------
    since.current += dt;
    if (since.current > 600) { since.current = 0; stations.current = survey(); }
    const r = dice.current;
    const list = crew.current;
    for (const worker of list) {
      stepWorker(worker, dt, stations.current, r);
      corral(worker, city.bounds);
    }
    mingle(list, r);
    driveCars(cars.current, dt);

    // ---- and is drawn ----------------------------------------------------
    // What is actually on the screen, in board units, with a margin.
    const pad = 40;
    const view: View = {
      x: -rect.left / k - pad,
      y: -rect.top / k - pad,
      r: (-rect.left + vw) / k + pad,
      b: (-rect.top + vh) / k + pad,
    };

    // The city is only repainted when the camera has actually moved. A pan of
    // less than half a pixel is not a move.
    const buffer = sky.current;
    const moved = !buffer
      || buffer.w !== canvas.width || buffer.h !== canvas.height
      || Math.abs(buffer.k - k) > k * 0.002
      || Math.abs(buffer.x - rect.left) > 0.5 || Math.abs(buffer.y - rect.top) > 0.5;
    if (moved) {
      const held = buffer?.canvas ?? document.createElement('canvas');
      if (held.width !== canvas.width) { held.width = canvas.width; held.height = canvas.height; }
      const bc = held.getContext('2d');
      if (bc) {
        bc.setTransform(1, 0, 0, 1, 0, 0);
        bc.clearRect(0, 0, held.width, held.height);
        bc.setTransform(k * dpr, 0, 0, k * dpr, rect.left * dpr, rect.top * dpr);
        bc.lineCap = 'round';
        bc.lineJoin = 'round';
        paintCity(bc, city, view, k);
      }
      sky.current = { canvas: held, k, x: rect.left, y: rect.top, w: canvas.width, h: canvas.height };
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const town = sky.current;
    if (town) {
      // `copy` replaces what is there, which saves clearing the whole canvas
      // first: one full-surface pass a frame rather than two.
      ctx.globalCompositeOperation = 'copy';
      ctx.drawImage(town.canvas, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.setTransform(k * dpr, 0, 0, k * dpr, rect.left * dpr, rect.top * dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const tall = TALL * k;
    if (tall > 2) drawCars(ctx, cars.current, city.lanes, view, k);
    if (tall <= SPARK) drawSparks(ctx, list, view, k);
    else drawCrew(ctx, list, view, tall < PLAIN);
    paintRain(ctx, city, view, now);
  }, !reduced);

  return <canvas className="uvcrew" ref={canvasRef} aria-hidden="true" />;
}

/** Too far away to be people: one dot each, in the colour of the trade, which
 *  at this size is all a crowd is anyway. */
function drawSparks(ctx: CanvasRenderingContext2D, crew: Worker[], view: { x: number; y: number; r: number; b: number }, k: number) {
  const size = Math.max(1.4, 3 / k);
  for (const job of JOBS) {
    let any = false;
    ctx.beginPath();
    for (const worker of crew) {
      if (worker.job !== job) continue;
      if (worker.x < view.x || worker.x > view.r || worker.y < view.y || worker.y > view.b) continue;
      ctx.moveTo(worker.x + size, worker.y - 8);
      ctx.arc(worker.x, worker.y - 8, size, 0, Math.PI * 2);
      any = true;
    }
    if (!any) continue;
    ctx.fillStyle = TRADE[job];
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Close enough to be people. One pass per trade: a wide soft stroke for the
 *  glow, a thin bright one for the figure, and one fill for heads and hats. */
function drawCrew(
  ctx: CanvasRenderingContext2D,
  crew: Worker[],
  view: { x: number; y: number; r: number; b: number },
  plain: boolean,
) {
  // How big the crowd is decides how much of each of them gets drawn.
  let seen = 0;
  for (const worker of crew) {
    if (worker.x < view.x || worker.x > view.r || worker.y < view.y || worker.y > view.b) continue;
    seen += 1;
  }
  const crowd = seen > BUDGET;
  const detail = plain || crowd;

  for (const job of JOBS) {
    const line = new Path2D();
    const solid = new Path2D();
    let any = false;
    for (const worker of crew) {
      if (worker.job !== job) continue;
      if (worker.x < view.x || worker.x > view.r || worker.y < view.y || worker.y > view.b) continue;
      figure(line, solid, worker, detail);
      any = true;
    }
    if (!any) continue;
    const colour = TRADE[job];
    ctx.strokeStyle = colour;
    if (!crowd) {
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 4.2;
      ctx.stroke(line);
      ctx.globalAlpha = 1;
    }
    ctx.lineWidth = crowd ? 2 : 1.7;
    ctx.stroke(line);
    ctx.fillStyle = colour;
    ctx.fill(solid);
  }
  ctx.globalAlpha = 1;
}

/** One person, in board units, added to whichever paths they belong in. */
function figure(line: Path2D, solid: Path2D, w: Worker, plain: boolean) {
  const x = w.x;
  const y = w.y;
  const lean = w.mood === 'tumble' ? (w.spin / 90) * 0.5 : 0;
  const hip = y - 11;
  const shoulder = y - 19;
  const head = y - 23.5;
  const tip = w.face;

  // Torso, always.
  line.moveTo(x + lean * 4, shoulder);
  line.lineTo(x, hip);

  if (plain) {
    // Legs, one arm and a head. Cheap, but not a stick: at this size the arm
    // is the difference between a person and a tally mark.
    const gait = w.mood === 'walk' ? Math.sin(w.step) : 0;
    line.moveTo(x - 2 - gait * 2, y);
    line.lineTo(x, hip);
    line.lineTo(x + 2 + gait * 2, y);
    line.moveTo(x, shoulder + 1);
    line.lineTo(x + tip * 4, shoulder + (w.mood === 'work' ? 3 : 7));
    solid.moveTo(x + 2.6, head);
    solid.arc(x, head, 2.6, 0, Math.PI * 2);
    solid.moveTo(x - 4, head - 1.4);
    solid.lineTo(x - 3.2, head - 3.4);
    solid.lineTo(x + 3.2, head - 3.4);
    solid.lineTo(x + 4, head - 1.4);
    solid.closePath();
    return;
  }

  const swing = w.mood === 'walk' ? Math.sin(w.step) : 0;
  const bob = w.mood === 'walk' ? Math.abs(Math.cos(w.step)) * 0.9 : 0;

  // Legs.
  line.moveTo(x + swing * 4.4, y - bob);
  line.lineTo(x, hip);
  line.lineTo(x - swing * 4.4, y);

  // Arms. The front one holds the tool and does the work.
  const busy = w.mood === 'work';
  const arm = busy ? Math.sin(w.step * 3 + w.seed * 6) * 0.5 + 0.5 : -swing;
  line.moveTo(x - swing * 3.6, hip + 1);
  line.lineTo(x, shoulder);
  const hx = x + tip * (busy ? 6.2 : 3.4);
  const hy = shoulder + (busy ? 3 + arm * 3 : 7);
  line.lineTo(hx, hy);

  // Head and hat.
  solid.moveTo(x + 2.7, head);
  solid.arc(x, head, 2.7, 0, Math.PI * 2);
  solid.moveTo(x - 4.2, head - 1.2);
  solid.lineTo(x - 3.4, head - 3.6);
  solid.lineTo(x + 3.4, head - 3.6);
  solid.lineTo(x + 4.2, head - 1.2);
  solid.closePath();

  if (w.load) {
    // A crate on the shoulder.
    line.moveTo(x - 4.6, shoulder - 3.4);
    line.lineTo(x + 4.6, shoulder - 3.4);
    line.lineTo(x + 4.6, shoulder - 8.6);
    line.lineTo(x - 4.6, shoulder - 8.6);
    line.closePath();
  }
  if (w.mood === 'talk' || w.mood === 'huddle') {
    // A hand up, mid-sentence.
    line.moveTo(x, shoulder);
    line.lineTo(x + tip * 5, shoulder - 3.5);
  }
  if (busy) kit(line, w, hx, hy, tip);
}

/** The tool at the end of the working arm. */
function kit(line: Path2D, w: Worker, hx: number, hy: number, tip: number) {
  switch (w.job) {
    case 'welder':
    case 'glazier':
      line.moveTo(hx, hy);
      line.lineTo(hx + tip * 5, hy - 1.5);
      line.moveTo(hx + tip * 5, hy - 1.5);
      line.lineTo(hx + tip * 8, hy - 4);
      line.moveTo(hx + tip * 5, hy - 1.5);
      line.lineTo(hx + tip * 8.5, hy + 0.5);
      break;
    case 'sweeper':
      line.moveTo(hx, hy - 4);
      line.lineTo(hx + tip * 5, hy + 8);
      line.moveTo(hx + tip * 2.4, hy + 8);
      line.lineTo(hx + tip * 7.4, hy + 8);
      break;
    case 'surveyor':
      line.moveTo(hx + tip * 3, hy - 6);
      line.lineTo(hx + tip * 3, hy + 11);
      line.moveTo(hx, hy + 11);
      line.lineTo(hx + tip * 3, hy - 6);
      line.lineTo(hx + tip * 6, hy + 11);
      break;
    case 'painter':
    case 'mason':
      line.moveTo(hx, hy);
      line.lineTo(hx + tip * 4, hy - 5);
      line.moveTo(hx + tip * 4, hy - 7.5);
      line.lineTo(hx + tip * 7, hy - 3.5);
      break;
    case 'digger':
      line.moveTo(hx, hy - 2);
      line.lineTo(hx + tip * 4, hy + 7);
      line.moveTo(hx + tip * 2, hy + 7);
      line.lineTo(hx + tip * 6, hy + 9);
      break;
    case 'signaller':
      line.moveTo(hx, hy);
      line.lineTo(hx + tip * 3, hy - 8);
      line.moveTo(hx + tip * 1, hy - 8);
      line.lineTo(hx + tip * 5, hy - 8);
      break;
    case 'porter':
      break;
    default:
      // A board, a clipboard, a can: a small rectangle held out in front.
      line.moveTo(hx, hy - 2.5);
      line.lineTo(hx + tip * 5, hy - 2.5);
      line.lineTo(hx + tip * 5, hy + 2.5);
      line.lineTo(hx, hy + 2.5);
      line.closePath();
  }
}

/** Traffic. Small, and there is a lot of it, so it is four rectangles a car. */
function drawCars(
  ctx: CanvasRenderingContext2D,
  cars: Car[],
  lanes: Array<{ x1: number; y1: number; x2: number; y2: number }>,
  view: { x: number; y: number; r: number; b: number },
  k: number,
) {
  const long = Math.max(6, 11 / Math.max(0.6, k) * 0.6);
  for (let tint = 0; tint < PAINT.length; tint += 1) {
    const body = new Path2D();
    const lamp = new Path2D();
    let any = false;
    for (const car of cars) {
      if (car.tint !== tint) continue;
      const lane = lanes[car.lane];
      if (!lane) continue;
      const x = lane.x1 + (lane.x2 - lane.x1) * car.t;
      const y = lane.y1 + (lane.y2 - lane.y1) * car.t;
      if (x < view.x || x > view.r || y < view.y || y > view.b) continue;
      const vertical = Math.abs(lane.y2 - lane.y1) > Math.abs(lane.x2 - lane.x1);
      const w = vertical ? 7 : long;
      const h = vertical ? long : 7;
      body.rect(x - w / 2, y - h / 2, w, h);
      const ahead = vertical ? Math.sign(lane.y2 - lane.y1) : Math.sign(lane.x2 - lane.x1);
      if (k > 0.5) {
        if (vertical) lamp.rect(x - 2.6, y + (ahead * h) / 2 - 1, 5.2, 2);
        else lamp.rect(x + (ahead * w) / 2 - 1, y - 2.6, 2, 5.2);
      }
      any = true;
    }
    if (!any) continue;
    ctx.fillStyle = PAINT[tint];
    ctx.globalAlpha = 0.5;
    ctx.fill(body);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff6d0';
    ctx.fill(lamp);
  }
  ctx.globalAlpha = 1;
}

export { BAD };
