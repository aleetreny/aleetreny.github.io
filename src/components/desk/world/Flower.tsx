// A plant that thinks the cursor is the sun.
//
// It leans, slowly, the way a real stem does — over seconds, not frames. Hold
// still near it for long enough and it turns to face you properly, opens, and
// eventually puts out a leaf. There is nothing to click and nothing to read.

import { useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { clamp, wobble } from '../../../lib/world/rng';

export function Flower() {
  const { reduced, placeRef } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const stemRef = useRef<SVGGElement | null>(null);
  const headRef = useRef<SVGGElement | null>(null);
  const onScreen = useOnScreen(hostRef);
  const lean = useRef(0);
  const light = useRef({ x: 0, y: 0, at: 0, still: 0 });
  const [bloom, setBloom] = useState(0);
  const [leaves, setLeaves] = useState(0);

  useEffect(() => {
    const follow = (event: PointerEvent) => {
      light.current = { ...light.current, x: event.clientX, y: event.clientY, at: performance.now() };
    };
    window.addEventListener('pointermove', follow);
    return () => window.removeEventListener('pointermove', follow);
  }, []);

  useFrame((dt, now) => {
    const at = placeRef.current.get('flower');
    const host = hostRef.current;
    if (!at || !host) return;
    const box = host.getBoundingClientRect();
    const rootX = box.left + box.width / 2;
    const rootY = box.bottom;
    const dx = light.current.x - rootX;
    const dy = light.current.y - rootY;
    const distance = Math.hypot(dx, dy);
    const near = distance < 420 && light.current.at > 0;

    // Phototropism, with an honest time constant: a plant does not snap.
    // It is a deliberately theatrical flower: the cursor is its sun and the
    // response needs to be obvious at board scale, not a two-degree twitch.
    const want = near ? clamp((dx / Math.max(44, Math.abs(dy) || 44)) * 62, -58, 58) : 0;
    lean.current += (want - lean.current) * Math.min(1, dt / 360);
    const sway = reduced ? 0 : wobble(now / 1800, 3) * 3.2;

    if (near) light.current.still += dt; else light.current.still = 0;
    if (light.current.still > 2600 && bloom < 1) setBloom((b) => Math.min(1, b + 0.02));
    if (light.current.still > 9000 && leaves < 2) setLeaves((n) => n + 1);
    if (!near && bloom > 0) setBloom((b) => Math.max(0, b - 0.004));

    if (stemRef.current) stemRef.current.setAttribute('transform', `rotate(${(lean.current + sway).toFixed(2)} 55 150)`);
    if (headRef.current) headRef.current.setAttribute('transform', `rotate(${(-lean.current * 0.26).toFixed(2)} 55 44) scale(${(0.82 + bloom * 0.24).toFixed(3)})`);
  }, onScreen);

  return (
    <ObjectShell id="flower" label="a plant">
      <div
        className="flower"
        ref={hostRef}
      >
        <svg viewBox="0 0 110 160" aria-hidden="true">
          {/* the pot */}
          <path d="M32 128h46l-5 30H37z" fill="#8a5a3c" />
          <rect x="28" y="120" width="54" height="10" rx="3" fill="#a06a48" />
          <path d="M32 128h46l-1 6H33z" fill="rgba(0,0,0,.22)" />
          <ellipse cx="55" cy="124" rx="25" ry="5" fill="#3a2a1e" />
          <g ref={stemRef} style={{ transformOrigin: '55px 150px' }}>
            <path d="M55 124C55 96 52 74 55 52" stroke="#4e7a44" strokeWidth="4.5" fill="none" strokeLinecap="round" />
            {leaves > 0 ? <path d="M55 96c-16-6-22-2-24 6 10 6 20 2 24-6z" fill="#5b8c4e" /> : null}
            {leaves > 1 ? <path d="M55 78c15-7 21-3 23 5-10 6-19 3-23-5z" fill="#527f47" /> : null}
            <g ref={headRef} style={{ transformOrigin: '55px 44px' }}>
              {Array.from({ length: 9 }, (_, i) => {
                const a = (i / 9) * Math.PI * 2;
                return (
                  <ellipse
                    key={i}
                    cx={55 + Math.cos(a) * 15}
                    cy={44 + Math.sin(a) * 15}
                    rx="9"
                    ry="6"
                    fill={i % 2 ? '#f0c34a' : '#e8b23a'}
                    transform={`rotate(${(a * 180) / Math.PI} ${55 + Math.cos(a) * 15} ${44 + Math.sin(a) * 15})`}
                  />
                );
              })}
              <circle cx="55" cy="44" r="10" fill="#6a4a22" />
              <circle cx="55" cy="44" r="6" fill="#4d3417" />
            </g>
          </g>
        </svg>
      </div>
    </ObjectShell>
  );
}
