// A plant that thinks the cursor is the sun.
//
// It leans, slowly, the way a real stem does — over seconds, not frames. Hold
// still near it for long enough and it turns to face you properly, opens, and
// eventually puts out a leaf. There is nothing to click and nothing to read.
//
// The head is not a sticker. Every petal breathes on its own clock and lifts
// away from the disc as the flower opens, and if you swing the sun across it
// fast enough while it is open it shakes its pollen loose.

import { useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { clamp, wobble } from '../../../lib/world/rng';
import { light, watchLight } from '../../../lib/world/light';

/** Where the stem meets the soil. Everything above it may lean; this point
 *  may not move. */
const ROOT_X = 55;
const ROOT_Y = 124;
/** How far the head stands above the root. */
const STEM = ROOT_Y - 44;
/** Degrees. Generous enough to be theatrical, small enough to stay planted. */
const MAX_LEAN = 34;
/** The frame. Wide enough that a head at full lean, fully open, with every
 *  petal at the top of its breath still lands inside it — a plant that paints
 *  outside its own box leaves the pixels behind when it comes back. */
const VIEW = { x: -22, w: 154, h: 160 };
const POLLEN = 8;

const PETALS = Array.from({ length: 9 }, (_unused, i) => {
  const a = (i / 9) * Math.PI * 2;
  const cx = ROOT_X + Math.cos(a) * 15;
  const cy = 44 + Math.sin(a) * 15;
  return { a, cx, cy, deg: (a * 180) / Math.PI, warm: i % 2 === 1 };
});

type Grain = { x: number; y: number; vx: number; vy: number; life: number };

export function Flower() {
  const { reduced, placeRef } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stemRef = useRef<SVGGElement | null>(null);
  const headRef = useRef<SVGGElement | null>(null);
  const petalRef = useRef<SVGGElement | null>(null);
  const dustRef = useRef<SVGGElement | null>(null);
  const grains = useRef<Grain[]>(Array.from({ length: POLLEN }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 })));
  const shed = useRef(0);
  const wasTilt = useRef(0);
  const onScreen = useOnScreen(hostRef);
  const lean = useRef(0);
  /** How long the light has been holding still near enough to matter. The
   *  light's own position is the room's, shared with the microscope slide. */
  const still = useRef(0);
  // Opening is a number the frame loop reads and the frame loop draws; there
  // is nothing in the markup that depends on it, so it stays out of React and
  // the plant costs no re-renders while it breathes.
  const bloom = useRef(0);
  const [leaves, setLeaves] = useState(0);

  useEffect(watchLight, []);

  useFrame((dt, now) => {
    const at = placeRef.current.get('flower');
    const host = hostRef.current;
    if (!at || !host) return;
    const box = host.getBoundingClientRect();
    const rootX = box.left + box.width / 2;
    const rootY = box.bottom;
    const sun = light();
    const dx = sun.x - rootX;
    const dy = sun.y - rootY;
    const distance = Math.hypot(dx, dy);
    const near = distance < 420 && sun.at > 0;

    // Phototropism, with an honest time constant: a plant does not snap.
    // It is a deliberately theatrical flower: the cursor is its sun and the
    // response needs to be obvious at board scale, not a two-degree twitch.
    // The ceiling is what keeps it a plant rather than a windscreen wiper: the
    // stem is hinged at the soil, so this is the angle the whole thing leans
    // at, and past forty degrees a stem stops looking rooted in its pot.
    const want = near ? clamp((dx / Math.max(44, Math.abs(dy) || 44)) * 40, -MAX_LEAN, MAX_LEAN) : 0;
    lean.current += (want - lean.current) * Math.min(1, dt / 360);
    const sway = reduced ? 0 : wobble(now / 1800, 3) * 2.6;
    const tilt = clamp(lean.current + sway, -MAX_LEAN, MAX_LEAN);

    if (near) still.current += dt; else still.current = 0;
    if (still.current > 2600) bloom.current = Math.min(1, bloom.current + 0.02);
    if (!near) bloom.current = Math.max(0, bloom.current - 0.004);
    if (still.current > 9000 && leaves < 2) setLeaves((n) => n + 1);

    // Hinged at the soil line, not below the pot: the base of the stem is the
    // one point that must not move, or the plant walks out of its own basket.
    if (stemRef.current) stemRef.current.setAttribute('transform', `rotate(${tilt.toFixed(2)} ${ROOT_X} ${ROOT_Y})`);
    // The head keeps looking at the light while the stem leans away from it,
    // which is the bit that reads as a plant rather than a rotating sticker.
    const open = bloom.current;
    if (headRef.current) {
      const grow = (0.82 + open * 0.24).toFixed(3);
      headRef.current.setAttribute('transform', `translate(55 44) rotate(${(-tilt * 0.3).toFixed(2)}) scale(${grow}) translate(-55 -44)`);
    }

    // Each petal on its own clock, and lifting away from the disc as it opens.
    const petals = petalRef.current;
    if (petals) {
      for (let i = 0; i < PETALS.length; i += 1) {
        const p = PETALS[i];
        const beat = reduced ? 1 : 1 + Math.sin(now / 620 + i * 1.7) * (0.03 + open * 0.05);
        const push = open * 2.4;
        const node = petals.children[i] as SVGElement | undefined;
        node?.setAttribute(
          'transform',
          `translate(${(Math.cos(p.a) * push).toFixed(2)} ${(Math.sin(p.a) * push).toFixed(2)})`
          + ` rotate(${p.deg.toFixed(2)} ${p.cx.toFixed(2)} ${p.cy.toFixed(2)})`
          + ` translate(${p.cx.toFixed(2)} ${p.cy.toFixed(2)}) scale(${beat.toFixed(3)})`
          + ` translate(${(-p.cx).toFixed(2)} ${(-p.cy).toFixed(2)})`,
        );
      }
    }

    // Pollen. An open head that gets swung about sheds a little of it, which
    // is the one thing a flower does that a leaning shape cannot fake.
    const dust = dustRef.current;
    const step = Math.min(2.4, dt / 16.7);
    const drift = tilt - wasTilt.current;
    const swing = (Math.abs(drift) / Math.max(1, dt)) * 1000;
    wasTilt.current = tilt;
    shed.current -= dt;
    if (dust && !reduced) {
      if (open > 0.5 && swing > 22 && shed.current <= 0) {
        const spare = grains.current.find((g) => g.life <= 0);
        if (spare) {
          const rad = (tilt * Math.PI) / 180;
          spare.x = ROOT_X + STEM * Math.sin(rad) + (Math.random() - 0.5) * 9;
          spare.y = ROOT_Y - STEM * Math.cos(rad) + (Math.random() - 0.5) * 9;
          // Flung the way the head was going when it let go.
          spare.vx = Math.sign(drift) * 0.55 + (Math.random() - 0.5) * 0.7;
          spare.vy = -0.35 - Math.random() * 0.3;
          spare.life = 1200 + Math.random() * 400;
          shed.current = 70;
        }
      }
      for (let i = 0; i < POLLEN; i += 1) {
        const g = grains.current[i];
        const node = dust.children[i] as SVGElement | undefined;
        if (!node) continue;
        if (g.life <= 0) { node.setAttribute('opacity', '0'); continue; }
        g.life -= dt;
        g.vy += 0.022 * step;
        g.vx *= 0.985;
        g.x += g.vx * step;
        g.y += g.vy * step;
        node.setAttribute('cx', g.x.toFixed(1));
        node.setAttribute('cy', g.y.toFixed(1));
        node.setAttribute('opacity', clamp(g.life / 500, 0, 0.85).toFixed(2));
      }
    }
  }, onScreen);

  return (
    <ObjectShell id="flower" label="a plant">
      <div
        className="flower"
        ref={hostRef}
      >
        <svg viewBox={`${VIEW.x} 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
          {/* the pot */}
          <path d="M32 128h46l-5 30H37z" fill="#8a5a3c" />
          <rect x="28" y="120" width="54" height="10" rx="3" fill="#a06a48" />
          <path d="M32 128h46l-1 6H33z" fill="rgba(0,0,0,.22)" />
          <ellipse cx="55" cy="124" rx="25" ry="5" fill="#3a2a1e" />
          <g ref={stemRef}>
            <path d="M55 124C55 96 52 74 55 52" stroke="#4e7a44" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            {leaves > 0 ? <path d="M55 96c-16-6-22-2-24 6 10 6 20 2 24-6z" fill="#5b8c4e" /> : null}
            {leaves > 1 ? <path d="M55 78c15-7 21-3 23 5-10 6-19 3-23-5z" fill="#527f47" /> : null}
            <g ref={headRef}>
              <g ref={petalRef}>
                {PETALS.map((p) => (
                  <ellipse
                    key={p.deg}
                    cx={p.cx}
                    cy={p.cy}
                    rx="9"
                    ry="6"
                    fill={p.warm ? '#f0c34a' : '#e8b23a'}
                    transform={`rotate(${p.deg} ${p.cx} ${p.cy})`}
                  />
                ))}
              </g>
              <circle cx="55" cy="44" r="10" fill="#6a4a22" />
              <circle cx="55" cy="44" r="6" fill="#4d3417" />
            </g>
          </g>
          {/* Pollen rides in the pot's frame, not the stem's: once it is off
              the head it has nothing more to do with which way the plant leans. */}
          <g ref={dustRef}>
            {Array.from({ length: POLLEN }, (_unused, i) => (
              <circle key={i} r="1.8" cx="0" cy="0" fill="#f7dc86" opacity="0" />
            ))}
          </g>
        </svg>
      </div>
    </ObjectShell>
  );
}
