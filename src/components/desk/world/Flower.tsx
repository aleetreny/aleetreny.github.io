// A Venus flytrap that mistakes the visitor for lunch.
//
// The cursor is still the shared light source, so the stem follows it like the
// old flower did. The difference is appetite: linger over the open trap (or
// tap it) and it snaps, swallows the fluorescent fly, digests for a moment,
// burps, counts the meal and opens again. All continuous motion stays in refs;
// React only hears about the two semantic state changes in a feeding cycle.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { clamp, wobble } from '../../../lib/world/rng';
import { light, watchLight } from '../../../lib/world/light';
import { useUiText } from '../ui-text-context';

const ROOT_X = 66;
const ROOT_Y = 137;
const HEAD_Y = 49;
const MAX_LEAN = 28;
const VIEW = { x: -8, w: 148, h: 168 };
const BURPS = 6;

type TrapMode = 'hunting' | 'digesting';

export function Flower() {
  const t = useUiText();
  const { reduced, placeRef } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stemRef = useRef<SVGGElement | null>(null);
  const headRef = useRef<SVGGElement | null>(null);
  const upperRef = useRef<SVGGElement | null>(null);
  const lowerRef = useRef<SVGGElement | null>(null);
  const flyRef = useRef<SVGGElement | null>(null);
  const bellyRef = useRef<SVGEllipseElement | null>(null);
  const burpRef = useRef<SVGGElement | null>(null);
  const onScreen = useOnScreen(hostRef);
  const lean = useRef(0);
  const jaw = useRef(0.62);
  const hover = useRef(0);
  const cycle = useRef(-1);
  /** One fly per approach: staying parked over the mouth cannot farm the
   * counter. The visitor has to leave the trap and tempt it again. */
  const armed = useRef(true);
  const [mode, setMode] = useState<TrapMode>('hunting');
  const [caught, setCaught] = useState(0);

  useEffect(watchLight, []);

  const feed = useCallback(() => {
    if (cycle.current >= 0) return;
    cycle.current = 0;
    hover.current = 0;
    armed.current = false;
    setMode('digesting');
    setCaught((count) => count + 1);
  }, []);

  useFrame((dt, now) => {
    const at = placeRef.current.get('flower');
    const host = hostRef.current;
    if (!at || !host) return;
    const box = host.getBoundingClientRect();
    const rootX = box.left + box.width * ((ROOT_X - VIEW.x) / VIEW.w);
    const rootY = box.bottom - 8;
    const sun = light();
    const dx = sun.x - rootX;
    const dy = sun.y - rootY;
    const distance = Math.hypot(dx, dy);
    const awake = distance < 440 && sun.at > 0;

    const want = awake ? clamp((dx / Math.max(70, Math.abs(dy) || 70)) * 34, -MAX_LEAN, MAX_LEAN) : 0;
    lean.current += (want - lean.current) * Math.min(1, dt / 330);
    const sway = reduced ? 0 : wobble(now / 1900, 4) * 1.7;
    const tilt = clamp(lean.current + sway, -MAX_LEAN, MAX_LEAN);
    stemRef.current?.setAttribute('transform', `rotate(${tilt.toFixed(2)} ${ROOT_X} ${ROOT_Y})`);
    headRef.current?.setAttribute('transform', `rotate(${(-tilt * 0.32).toFixed(2)} ${ROOT_X} ${HEAD_Y})`);

    if (cycle.current < 0) {
      const tempting = distance < 150 && sun.at > 0;
      if (!tempting) {
        hover.current = Math.max(0, hover.current - dt * 2.2);
        if (distance > 190) armed.current = true;
      } else if (armed.current) {
        hover.current += dt;
      }
      const wantJaw = tempting ? 1 : awake ? 0.78 : 0.58;
      jaw.current += (wantJaw - jaw.current) * Math.min(1, dt / 180);
      if (armed.current && hover.current > 760) feed();
    } else {
      cycle.current += dt;
      const elapsed = cycle.current;
      if (elapsed < 115) {
        jaw.current += (0 - jaw.current) * Math.min(1, dt / 22);
      } else if (elapsed < 1950) {
        jaw.current = reduced ? 0.035 : 0.035 + Math.sin(now / 105) * 0.018;
      } else {
        jaw.current += (0.66 - jaw.current) * Math.min(1, dt / 280);
      }
      if (elapsed > 2920) {
        cycle.current = -1;
        setMode('hunting');
      }
    }

    const angle = 25 * jaw.current;
    upperRef.current?.setAttribute('transform', `rotate(${(-angle).toFixed(2)} ${ROOT_X} ${HEAD_Y})`);
    lowerRef.current?.setAttribute('transform', `rotate(${angle.toFixed(2)} ${ROOT_X} ${HEAD_Y})`);

    const fly = flyRef.current;
    if (fly) {
      const elapsed = cycle.current;
      if (elapsed >= 0 && elapsed < 150) {
        const pull = clamp(elapsed / 150, 0, 1);
        const x = ROOT_X + Math.cos(now / 90) * 20 * (1 - pull);
        const y = HEAD_Y - 5 + Math.sin(now / 70) * 12 * (1 - pull);
        fly.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${(1 - pull).toFixed(2)})`);
        fly.setAttribute('opacity', '1');
      } else if (elapsed >= 150) {
        fly.setAttribute('opacity', '0');
      } else if (awake) {
        const x = ROOT_X + Math.cos(now / 135) * 29;
        const y = HEAD_Y - 5 + Math.sin(now / 92) * 17;
        fly.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(now / 8) % 18 - 9})`);
        fly.setAttribute('opacity', '1');
      } else {
        fly.setAttribute('opacity', '0');
      }
    }

    const digest = cycle.current >= 150 && cycle.current < 1950;
    if (bellyRef.current) {
      const pulse = digest && !reduced ? 1 + Math.sin(now / 130) * 0.13 : 1;
      bellyRef.current.setAttribute('transform', `translate(${ROOT_X} 92) scale(${pulse.toFixed(3)}) translate(${-ROOT_X} -92)`);
      bellyRef.current.setAttribute('opacity', digest ? '0.72' : '0.18');
    }

    const burps = burpRef.current;
    if (burps) {
      const burst = cycle.current - 1780;
      for (let i = 0; i < BURPS; i += 1) {
        const bubble = burps.children[i] as SVGCircleElement | undefined;
        if (!bubble) continue;
        const age = burst - i * 75;
        if (age < 0 || age > 720 || reduced) {
          bubble.setAttribute('opacity', '0');
          continue;
        }
        bubble.setAttribute('cx', (ROOT_X + Math.sin(i * 2.1) * 7 + age * 0.008).toFixed(1));
        bubble.setAttribute('cy', (HEAD_Y - age * 0.052).toFixed(1));
        bubble.setAttribute('r', (1.8 + i * 0.35).toFixed(1));
        bubble.setAttribute('opacity', (Math.sin((age / 720) * Math.PI) * 0.82).toFixed(2));
      }
    }
  }, onScreen);

  return (
    <ObjectShell
      id="flower"
      label={t('world.flower.label')}
      hint={mode === 'hunting' ? t('world.flower.hint') : t('world.flower.digesting')}
    >
      <div
        className={`flytrap flytrap--${mode}`}
        ref={hostRef}
        data-nodrag
        role="button"
        tabIndex={0}
        aria-label={t('world.flower.aria')}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          event.stopPropagation();
          event.preventDefault();
          feed();
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          feed();
        }}
      >
        <svg viewBox={`${VIEW.x} 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
          <defs>
            <linearGradient id="trap-lobe" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#88be46" />
              <stop offset="0.62" stopColor="#4d8b37" />
              <stop offset="1" stopColor="#2d642f" />
            </linearGradient>
            <radialGradient id="trap-mouth">
              <stop offset="0" stopColor="#d84d66" />
              <stop offset="1" stopColor="#7f2747" />
            </radialGradient>
          </defs>

          <path d="M40 137h52l-6 27H46z" fill="#643e31" />
          <rect x="36" y="130" width="60" height="10" rx="3" fill="#8d5940" />
          <path d="M40 138h52l-2 6H42z" fill="rgba(0,0,0,.25)" />
          <ellipse cx="66" cy="134" rx="28" ry="6" fill="#28231c" />

          <g ref={stemRef}>
            <path d="M66 134C64 111 66 83 66 53" stroke="#4f873e" strokeWidth="5.2" fill="none" strokeLinecap="round" />
            <path d="M64 105c-18-10-28-5-30 7 13 8 25 3 30-7z" fill="#5c963f" />
            <path d="M67 87c17-10 27-5 29 6-12 8-23 4-29-6z" fill="#4f8738" />
            <ellipse ref={bellyRef} cx="66" cy="92" rx="7.5" ry="14" fill="#b6ee5a" opacity=".18" />

            <g ref={headRef}>
              <g ref={upperRef}>
                <path d="M66 49C52 47 39 39 40 27C41 13 56 8 67 18C73 24 74 37 66 49Z" fill="url(#trap-lobe)" stroke="#274e2a" strokeWidth="1.7" />
                <path d="M66 47C54 45 45 38 46 28C47 20 56 17 64 24C68 29 70 39 66 47Z" fill="url(#trap-mouth)" opacity=".92" />
                <path className="flytrap__teeth" d="M45 42l-5 6m11-3l-3 8m10-6l-1 8m7-7l2 8" />
                <circle cx="54" cy="30" r="1.2" fill="#ffd7e2" opacity=".65" />
                <circle cx="60" cy="37" r="1" fill="#ffd7e2" opacity=".5" />
              </g>
              <g ref={lowerRef}>
                <path d="M66 49C52 51 39 59 40 71C41 85 56 90 67 80C73 74 74 61 66 49Z" fill="url(#trap-lobe)" stroke="#274e2a" strokeWidth="1.7" />
                <path d="M66 51C54 53 45 60 46 70C47 78 56 81 64 74C68 69 70 59 66 51Z" fill="url(#trap-mouth)" opacity=".92" />
                <path className="flytrap__teeth" d="M45 56l-5-6m11 3l-3-8m10 6l-1-8m7 7l2-8" />
                <circle cx="54" cy="68" r="1.2" fill="#ffd7e2" opacity=".65" />
                <circle cx="60" cy="61" r="1" fill="#ffd7e2" opacity=".5" />
              </g>
            </g>
          </g>

          <g ref={flyRef} className="flytrap__fly" opacity="0">
            <ellipse cx="0" cy="0" rx="2.4" ry="3.2" fill="#111" />
            <ellipse cx="-3" cy="-1" rx="3.2" ry="1.7" />
            <ellipse cx="3" cy="-1" rx="3.2" ry="1.7" />
            <path d="M-1 2l-3 3m5-3l3 3" />
          </g>
          <g ref={burpRef} className="flytrap__burps">
            {Array.from({ length: BURPS }, (_unused, index) => <circle key={index} cx="0" cy="0" r="2" opacity="0" />)}
          </g>
        </svg>
        <span className="flytrap__counter" aria-live="polite">{t('world.flower.caught', { count: caught })}</span>
      </div>
    </ObjectShell>
  );
}
