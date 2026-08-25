// The paint that has landed on one thing.
//
// Marks on a card or on bare slate are drawn once, in the board's own splat
// layers. Marks on an *object* are drawn here, inside it, in its own
// coordinates — which is the only reason a stained passport stays stained when
// you slide it across the desk.

import { useMemo } from 'react';
import { useWorld } from '../../../lib/world/context';
import { paintHex, splatShape, type Splat } from '../../../lib/world/splats';

export function SplatMark({ splat }: { splat: Splat }) {
  const shape = useMemo(() => splatShape(splat.seed, splat.r, splat.angle), [splat.seed, splat.r, splat.angle]);
  const hex = paintHex(splat.color);
  const span = splat.r * 5;
  return (
    <svg
      className="splat"
      style={{ left: splat.x - span / 2, top: splat.y - span / 2, width: span, height: span }}
      viewBox={`${-span / 2} ${-span / 2} ${span} ${span}`}
      aria-hidden="true"
    >
      <g fill={hex}>
        {shape.drips.map((d, i) => <path key={`drip-${i}`} d={d} opacity={0.88} />)}
        <path d={shape.d} />
        {shape.drops.map((drop, i) => (
          <ellipse
            key={`drop-${i}`}
            cx={drop.x}
            cy={drop.y}
            rx={drop.r}
            ry={drop.r * (0.62 + ((splat.seed >> i) & 7) / 12)}
            opacity={0.92}
          />
        ))}
      </g>
      {/* The wet edge: paint pools thicker where it stopped. */}
      <path d={shape.d} fill="none" stroke="rgba(0,0,0,.24)" strokeWidth={Math.max(0.6, splat.r * 0.035)} />
    </svg>
  );
}

export function SplatMarks({ on }: { on: string }) {
  const { splats } = useWorld();
  const mine = splats.filter((splat) => splat.on === on && splat.layer === 'object');
  if (mine.length === 0) return null;
  return <div className="obj__paint" aria-hidden="true">{mine.map((splat) => <SplatMark key={splat.id} splat={splat} />)}</div>;
}
