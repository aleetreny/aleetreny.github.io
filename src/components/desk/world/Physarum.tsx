// A slime mould, on the usual three rules.
//
// Four thousand agents, each of which can only do three things: sniff a little
// ahead and a little to each side, turn toward whichever smells strongest, and
// leave a trail behind it. The trail diffuses and evaporates. Nothing in here
// knows what a network is, and a network is what comes out — which is the whole
// reason Physarum polycephalum is worth putting on a desk.
//
// Drop food and it will find it, and then it will find the route between the
// pieces, and then it will stop maintaining the routes it is not using.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

// The domain is wider than the dish on purpose, at the same resolution: the
// culture is allowed over the rim, and the network keeps the scale it reads
// best at.
const N = 176;
const AGENTS = 4800;
const SENSE = 7;
const SENSE_ANGLE = 0.42;
const TURN = 0.38;
const SPEED = 0.9;
const DECAY = 0.965;

type Agent = { x: number; y: number; a: number };

/** Inoculated as a blob in the middle, the way a culture actually is. */
function inoculate(): Agent[] {
  const made: Agent[] = [];
  for (let i = 0; i < AGENTS; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * 12;
    made.push({ x: N / 2 + Math.cos(a) * r, y: N / 2 + Math.sin(a) * r, a: Math.random() * Math.PI * 2 });
  }
  return made;
}

export function Physarum() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const trail = useRef<Float32Array | null>(null);
  const next = useRef<Float32Array | null>(null);
  const agents = useRef<Agent[] | null>(null);
  const food = useRef<Array<{ x: number; y: number; left: number }> | null>(null);
  const image = useRef<ImageData | null>(null);
  const [awake, setAwake] = useState(false);
  const onScreen = useOnScreen(hostRef);

  const sample = useCallback((x: number, y: number): number => {
    const gx = ((Math.round(x) % N) + N) % N;
    const gy = ((Math.round(y) % N) + N) % N;
    let value = trail.current?.[gy * N + gx] ?? 0;
    // Food is a strong, slowly-consumed source of the same signal, which is why
    // an agent walks to it without ever being told to.
    for (const bite of food.current ?? []) {
      const d2 = (x - bite.x) ** 2 + (y - bite.y) ** 2;
      if (d2 < 400) value += (bite.left * 26) / (4 + d2);
    }
    return value;
  }, []);

  useFrame(() => {
    const t0 = (trail.current ??= new Float32Array(N * N));
    const t1 = (next.current ??= new Float32Array(N * N));
    const list = (agents.current ??= inoculate());
    const bites = (food.current ??= []);

    for (const agent of list) {
      const f = sample(agent.x + Math.cos(agent.a) * SENSE, agent.y + Math.sin(agent.a) * SENSE);
      const l = sample(agent.x + Math.cos(agent.a - SENSE_ANGLE) * SENSE, agent.y + Math.sin(agent.a - SENSE_ANGLE) * SENSE);
      const r = sample(agent.x + Math.cos(agent.a + SENSE_ANGLE) * SENSE, agent.y + Math.sin(agent.a + SENSE_ANGLE) * SENSE);
      if (f > l && f > r) { /* straight on */ }
      else if (l > r) agent.a -= TURN * (0.5 + Math.random() * 0.5);
      else if (r > l) agent.a += TURN * (0.5 + Math.random() * 0.5);
      else agent.a += (Math.random() - 0.5) * TURN;

      agent.x += Math.cos(agent.a) * SPEED;
      agent.y += Math.sin(agent.a) * SPEED;
      // The dish wraps, so a culture never piles up against a wall.
      if (agent.x < 0) agent.x += N;
      if (agent.y < 0) agent.y += N;
      if (agent.x >= N) agent.x -= N;
      if (agent.y >= N) agent.y -= N;

      const index = (Math.floor(agent.y) * N + Math.floor(agent.x)) | 0;
      t0[index] = Math.min(1.6, t0[index] + 0.28);
    }

    // Diffuse, then evaporate: the used routes are reinforced faster than they
    // fade and the unused ones simply go.
    for (let y = 0; y < N; y += 1) {
      const up = ((y - 1 + N) % N) * N;
      const row = y * N;
      const down = ((y + 1) % N) * N;
      for (let x = 0; x < N; x += 1) {
        const l = (x - 1 + N) % N;
        const r = (x + 1) % N;
        const sum = (
          t0[up + l] + t0[up + x] + t0[up + r]
          + t0[row + l] + t0[row + x] + t0[row + r]
          + t0[down + l] + t0[down + x] + t0[down + r]
        );
        t1[row + x] = (sum / 9) * DECAY;
      }
    }
    trail.current = t1;
    next.current = t0;

    for (const bite of bites) bite.left = Math.max(0, bite.left - 0.0016);
    food.current = bites.filter((bite) => bite.left > 0.02);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (canvas.width !== N) { canvas.width = N; canvas.height = N; }
    if (!image.current) image.current = ctx.createImageData(N, N);
    const data = image.current.data;
    const field = t1;
    for (let i = 0; i < N * N; i += 1) {
      const c = Math.min(1, field[i] * 1.5);
      const p = i * 4;
      data[p] = 26 + c * 230;
      data[p + 1] = 24 + c * 200;
      data[p + 2] = 20 + c * 60;
      data[p + 3] = Math.round(30 + c * 225);
    }
    ctx.putImageData(image.current, 0, 0);
    for (const bite of food.current ?? []) {
      ctx.fillStyle = `rgba(214,90,66,${0.35 + bite.left * 0.6})`;
      ctx.beginPath();
      ctx.arc(bite.x, bite.y, 1.6 + bite.left * 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, awake && onScreen && !reduced);

  /** At rest it is not an empty dish: it is a culture that has not been given a
   *  reason to move yet. Painted once, on mount, and then left alone. */
  useEffect(() => {
    if (awake) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (canvas.width !== N) { canvas.width = N; canvas.height = N; }
    const field = (trail.current ??= new Float32Array(N * N));
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        const d = Math.hypot(x - N / 2, y - N / 2);
        // A blob with a ragged edge, the way a culture sits in agar.
        const wobble = 1 + Math.sin(Math.atan2(y - N / 2, x - N / 2) * 5) * 0.12;
        field[y * N + x] = Math.max(0, 1 - d / (13 * wobble)) * 1.2;
      }
    }
    const still = ctx.createImageData(N, N);
    const data = still.data;
    for (let i = 0; i < N * N; i += 1) {
      const c = Math.min(1, field[i] * 1.5);
      const p = i * 4;
      data[p] = 26 + c * 230;
      data[p + 1] = 24 + c * 200;
      data[p + 2] = 20 + c * 60;
      data[p + 3] = Math.round(30 + c * 225);
    }
    ctx.putImageData(still, 0, 0);
  }, [awake]);

  const drop = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    setAwake(true);
    const box = canvas.getBoundingClientRect();
    food.current = [
      ...(food.current ?? []).slice(-9),
      { x: ((event.clientX - box.left) / box.width) * N, y: ((event.clientY - box.top) / box.height) * N, left: 1 },
    ];
  }, []);

  return (
    <ObjectShell id="physarum" label={t('world.slime.label')} hint={awake ? undefined : t('world.slime.hint')}>
      {/* The dish is drawn under the culture and the culture is drawn wider
          than the dish, so a colony that has found food near the rim crawls
          over it and out onto the slate — which is what this organism does. */}
      <div className="slime" ref={hostRef}>
        <span className="slime__ring" aria-hidden="true" />
        <canvas
          ref={canvasRef}
          width={N}
          height={N}
          data-nodrag
          style={{ width: 196, height: 196 }}
          onPointerDown={drop}
        />
        {!awake ? <button className="slime__wake" type="button" data-nodrag onClick={() => setAwake(true)}>·</button> : null}
        <span className="slime__label">P. polycephalum</span>
      </div>
    </ObjectShell>
  );
}
