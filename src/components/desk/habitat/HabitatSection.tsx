// The habitat, seen all at once.
//
// This is the instrument half of the project: a cutaway drawn the way a survey is
// drawn, in hairlines and cotas and monospaced capitals, with the warm pixel life
// only visible as the small lit dots of people moving about inside it. The
// silhouette is the identity — a hull driven into rock at twenty-two degrees, with
// hand-dug galleries running level off it — and it is legible at thumbnail size.
//
// SVG rather than canvas on purpose. There are sixteen boxes and twenty-five dots
// here, not a simulation; what this needs is crisp one-pixel strokes at any zoom,
// real text in the board's own typeface, and hit targets the keyboard can reach.

import { useMemo } from 'react';
import { mulberry32 } from '../../../lib/world/rng';
import {
  HULL_AXIS, LINKS, PLACEMENTS, SECTION, centreOf, type Placement,
} from '../../../lib/habitat/section';
import { ROOM_BY_ID, type RoomId } from '../../../lib/habitat/rooms';
import type { HabitatSnapshot } from '../../../lib/habitat/snapshot';

/** How far above the rooms the surface sits, in section units. */
const SURFACE_Y = 4;

/** A fixed sky. Deterministic, so it does not shimmer between renders. */
const STARS = (() => {
  const rand = mulberry32(9);
  return Array.from({ length: 90 }, () => ({
    x: -6 + rand() * (SECTION.w + 24),
    y: -8 + rand() * (SURFACE_Y + 7.4),
    r: 0.09 + rand() * 0.17,
  }));
})();


type Props = {
  snapshot: HabitatSnapshot;
  selected: RoomId | null;
  onSelect: (id: RoomId) => void;
};

/** The ship's shell: a long capsule along the axis, wide at the stern and tapering
 *  to the bow, drawn under the rooms so they read as compartments inside it. */
function hullShell(): string {
  const { from, to } = HULL_AXIS;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;
  const bow = 8;
  const stern = 11.5;
  const pad = 6;
  const ax = from.x - (dx / len) * pad;
  const ay = from.y - (dy / len) * pad;
  const bx = to.x + (dx / len) * pad;
  const by = to.y + (dy / len) * pad;
  return [
    `M ${ax + nx * bow} ${ay + ny * bow}`,
    `L ${bx + nx * stern} ${by + ny * stern}`,
    `L ${bx - nx * stern} ${by - ny * stern}`,
    `L ${ax - nx * bow} ${ay - ny * bow}`,
    'Z',
  ].join(' ');
}

/** People stand where the snapshot says they stand, mapped from their room's own
 *  grid into the room's box in the section. */
function dotsFor(p: Placement, snapshot: HabitatSnapshot) {
  const room = ROOM_BY_ID[p.id];
  const gw = room.grid[0]?.length ?? 1;
  const gh = room.grid.length || 1;
  return snapshot.people
    .filter((person) => person.room === p.id)
    .map((person) => ({
      id: person.id,
      x: p.x + ((person.at.x + 0.5) / gw) * p.w,
      y: p.y + ((person.at.y + 0.5) / gh) * p.h,
    }));
}

export function HabitatSection({ snapshot, selected, onSelect }: Props) {
  const lit = useMemo(
    () => new Set(snapshot.rooms.filter((r) => r.lit).map((r) => r.id)),
    [snapshot.rooms],
  );

  return (
    <svg
      className="hab-section"
      viewBox={`-6 -8 ${SECTION.w + 24} ${SECTION.h + 22}`}
      role="img"
      aria-label="Cutaway of the habitat: eight rooms in the wrecked hull and eight cut into the asteroid"
    >
      <defs>
        <pattern id="hab-regolith" width="3" height="3" patternUnits="userSpaceOnUse">
          <rect width="3" height="3" fill="none" />
          <circle cx="0.7" cy="1.1" r="0.18" className="hab-grit" />
          <circle cx="2.2" cy="2.4" r="0.13" className="hab-grit" />
        </pattern>
        <radialGradient id="hab-reactor" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" className="hab-reactor-hot" />
          <stop offset="100%" className="hab-reactor-cold" />
        </radialGradient>
      </defs>

      {/* Above the line there is nothing to breathe, and a great deal to see. */}
      <rect
        x={-6} y={-8} width={SECTION.w + 24} height={SURFACE_Y + 8}
        className="hab-vacuum"
      />
      {STARS.map((st, i) => (
        <circle key={i} cx={st.x} cy={st.y} r={st.r} className="hab-star" />
      ))}
      <line
        x1={-6} y1={SURFACE_Y} x2={SECTION.w + 18} y2={SURFACE_Y}
        className="hab-surface"
      />
      <rect
        x={-6} y={SURFACE_Y} width={SECTION.w + 24} height={SECTION.h + 14 - SURFACE_Y}
        className="hab-rock"
      />
      <rect
        x={-6} y={SURFACE_Y} width={SECTION.w + 24} height={SECTION.h + 14 - SURFACE_Y}
        fill="url(#hab-regolith)"
      />

      {/* The ship. */}
      <path d={hullShell()} className="hab-hull" />

      {/* Galleries. A hull-to-rock link is a hole somebody cut. */}
      {LINKS.map((l) => {
        const a = centreOf(l.a);
        const b = centreOf(l.b);
        const cut = ROOM_BY_ID[l.a].side !== ROOM_BY_ID[l.b].side;
        return (
          <line
            key={`${l.a}-${l.b}`}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            className={cut ? 'hab-link hab-link--cut' : 'hab-link'}
          />
        );
      })}

      {/* Rooms. */}
      {PLACEMENTS.map((p) => {
        const room = ROOM_BY_ID[p.id];
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;
        const isSelected = selected === p.id;
        const dark = !lit.has(p.id);
        const dots = dotsFor(p, snapshot);
        const labelBelow = p.id === 'well' || p.id === 'hollow';
        const label = room.side === 'hull'
          ? { x: p.x + p.w + 1.6, y: cy + 0.8, anchor: 'start' as const }
          : {
            x: cx,
            y: labelBelow ? p.y + p.h + 3.2 : p.y - 1.4,
            anchor: 'middle' as const,
          };
        return (
          <g
            key={p.id}
            className={[
              'hab-room',
              `hab-room--${room.side}`,
              dark ? 'hab-room--dark' : '',
              isSelected ? 'is-selected' : '',
            ].filter(Boolean).join(' ')}
            transform={p.tilt ? `rotate(${p.tilt} ${cx} ${cy})` : undefined}
            role="button"
            tabIndex={0}
            aria-label={`${room.name}, ${dots.length} inside`}
            aria-pressed={isSelected}
            onClick={() => onSelect(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(p.id);
              }
            }}
          >
            <rect x={p.x} y={p.y} width={p.w} height={p.h} className="hab-room__box" />
            {p.id === 'spine' ? (
              <circle cx={cx} cy={p.y + p.h - 1.6} r={2.2} fill="url(#hab-reactor)" />
            ) : null}
            {dots.map((d) => (
              <circle key={d.id} cx={d.x} cy={d.y} r={0.62} className="hab-person" />
            ))}
            {/* Hull labels go clear of the shell, to its open side, where they
                read as survey annotations rather than as clutter on the metal.
                Dug rooms sit in open rock and can carry their name above. */}
            <text
              x={label.x}
              y={label.y}
              className={`hab-room__name hab-room__name--${label.anchor}`}
              transform={p.tilt ? `rotate(${-p.tilt} ${label.x} ${label.y})` : undefined}
            >
              {room.name.replace(/^The /, '').toUpperCase()}
            </text>
          </g>
        );
      })}

      {/* Cotas, because this is a survey and not a poster. */}
      <g className="hab-cota">
        <line x1={-3} y1={SURFACE_Y} x2={-3} y2={SECTION.h + 10} />
        <line x1={-4.4} y1={SURFACE_Y} x2={-1.6} y2={SURFACE_Y} />
        <line x1={-4.4} y1={SECTION.h + 10} x2={-1.6} y2={SECTION.h + 10} />
        <text x={-4.8} y={(SURFACE_Y + SECTION.h + 10) / 2} className="hab-cota__label">
          126 m
        </text>
      </g>
      <text x={0} y={SECTION.h + 17} className="hab-legend">
        HULL · INHERITED · 22° · FINITE
      </text>
      <text x={SECTION.w + 18} y={SECTION.h + 17} className="hab-legend hab-legend--end">
        ROCK · CUT BY HAND · LEVEL · GROWING
      </text>
    </svg>
  );
}
