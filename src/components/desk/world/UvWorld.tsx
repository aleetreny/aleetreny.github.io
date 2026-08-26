// What the blacklight shows.
//
// Three things, in this order: a veil that takes the colour out of the board
// and leaves it in the dark; the marks somebody left on the slate that ordinary
// light does not pick up; and the crew.
//
// The crew's rules are in lib/world/crew.ts and none of them are here — this is
// only the part that has to touch the DOM. Positions are written straight onto
// the nodes on the shared frame loop, like everything else that moves on this
// board, so thirty workers cost thirty transform writes and no renders at all.
//
// Their stations are the real objects at their real positions, re-read twice a
// second, which is why moving something makes the work move with it.

import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { OBJECT_SPECS } from '../../../lib/world/kinds';
import { mulberry32 } from '../../../lib/world/rng';
import {
  JOBS, corral, drop, hire, mingle, stepWorker, type Job, type Station, type Worker,
} from '../../../lib/world/crew';
import { useUiText } from '../ui-text-context';

/** How many of them. Enough that the board is busy wherever you look, few
 *  enough that the whole cost is that many transform writes a frame. */
const CREW = 38;
/** Figure height in board units. They are small on purpose: you find them. */
const TALL = 27;

export function UvWorld({ boardSize }: { boardSize: { width: number; height: number } }) {
  const t = useUiText();
  const world = useWorld();
  const { objects, placeRef, swallowed, reduced } = world;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const nodes = useRef<Array<HTMLDivElement | null>>([]);
  const stations = useRef<Station[]>([]);
  const crew = useRef<Worker[]>([]);
  const dice = useRef(mulberry32(90210));
  const since = useRef(0);
  const onScreen = useOnScreen(hostRef, '30%');
  // The roster is the only part of the crew React knows about: who exists and
  // what trade they are. Everything that moves is in the ref, written straight
  // onto the nodes, so a shift change is one render and a shift is none.
  const [roster, setRoster] = useState<ReadonlyArray<{ id: number; job: Job }>>([]);
  const [marks, setMarks] = useState<ReactNode[]>([]);

  /** Every visible object, where it is now. */
  const survey = useCallback((): Station[] => {
    const found: Station[] = [];
    for (const object of objects) {
      if (!object.visible || swallowed.includes(object.id)) continue;
      const at = placeRef.current.get(object.id);
      if (!at) continue;
      const spec = OBJECT_SPECS[object.id];
      found.push({
        id: object.id,
        x: at.x,
        y: at.y,
        w: spec.w * at.scale,
        h: spec.h * at.scale,
      });
    }
    return found;
  }, [objects, placeRef, swallowed]);

  // Take the survey and, the first time, staff the board from it. Re-running
  // when the object list changes keeps the stations current without ever
  // re-hiring: a crew that vanished because something was swallowed would be
  // a crew, not a board.
  useEffect(() => {
    stations.current = survey();
    if (crew.current.length > 0) return;
    const list = hire(CREW, stations.current, 424242);
    crew.current = list;
    setRoster(list.map((worker) => ({ id: worker.id, job: worker.job })));
    setMarks(chalk(boardSize, stations.current));
  }, [boardSize, survey]);

  const paint = useCallback(() => {
    const list = crew.current;
    for (let i = 0; i < list.length; i += 1) {
      const worker = list[i];
      const node = nodes.current[i];
      if (!node) continue;
      // A walking figure rises and falls on its own stride; a working one is
      // planted. Folded into the one transform so it costs nothing extra.
      const bob = worker.mood === 'walk' ? Math.abs(Math.sin(worker.step)) * -1.1 : 0;
      node.style.transform =
        `translate(${(worker.x - TALL / 2).toFixed(1)}px, ${(worker.y - TALL).toFixed(1)}px)`
        + ` rotate(${worker.spin.toFixed(1)}deg)`
        + ` translateY(${bob.toFixed(2)}px) scaleX(${worker.face})`;
      const mood = `uvw uvw--${worker.job} is-${worker.mood}${worker.load ? ' has-load' : ''}`;
      if (node.className !== mood) node.className = mood;
      node.style.setProperty('--gait', `${(worker.step % (Math.PI * 2)).toFixed(2)}rad`);
    }
  }, []);

  // Put everyone where they belong the moment their nodes exist, so nobody is
  // ever seen standing in the top-left corner.
  useEffect(() => { paint(); }, [paint, roster]);

  useFrame((dt) => {
    const list = crew.current;
    if (list.length === 0) return;
    // The board moves under them: re-read where everything is, twice a second.
    since.current += dt;
    if (since.current > 500) {
      since.current = 0;
      stations.current = survey();
    }
    const r = dice.current;
    const posts = stations.current;
    for (const worker of list) {
      stepWorker(worker, dt, posts, r);
      corral(worker, boardSize.width, boardSize.height);
    }
    mingle(list, r);
    paint();
  }, onScreen && !reduced);

  /** Pick one up. They go limp in the hand and get up where you put them. */
  const grab = useCallback((index: number) => (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const list = crew.current;
    const worker = list?.[index];
    if (!worker) return;
    const node = event.currentTarget;
    const start = { x: event.clientX, y: event.clientY };
    const from = { x: worker.x, y: worker.y };
    const k = () => 1 / (world.scale() || 1);
    worker.mood = 'held';
    worker.spin = 0;
    node.setPointerCapture?.(event.pointerId);
    const move = (ev: PointerEvent) => {
      worker.x = from.x + (ev.clientX - start.x) * k();
      worker.y = from.y + (ev.clientY - start.y) * k();
      corral(worker, boardSize.width, boardSize.height);
      paint();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      node.releasePointerCapture?.(event.pointerId);
      stations.current = survey();
      drop(worker, stations.current, dice.current);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [boardSize.height, boardSize.width, paint, survey, world]);

  return (
    <div className="uvworld" ref={hostRef} aria-hidden="true">
      <div className="uvveil" />

      <svg
        className="uvmarks"
        viewBox={`0 0 ${boardSize.width} ${boardSize.height}`}
        width={boardSize.width}
        height={boardSize.height}
      >
        {marks}
      </svg>

      <div className="uvcrew" data-nodrag>
        {roster.map((worker, i) => (
          <div
            key={worker.id}
            ref={(el) => { nodes.current[i] = el; }}
            className={`uvw uvw--${worker.job}`}
            style={{ width: TALL, height: TALL }}
            onPointerDown={grab(i)}
          >
            <Figure job={worker.job} />
          </div>
        ))}
      </div>

      <span className="uvworld__sign">{t('world.uv.crew')}</span>
    </div>
  );
}

/** One of them. Eleven units across, twenty-two tall, feet on the baseline —
 *  small enough to be a person on a table rather than a mascot. */
const Figure = memo(function Figure({ job }: { job: Job }) {
  return (
    <svg viewBox="-11 -22 22 23" className="uvw__body">
      <g className="uvw__legs">
        <rect className="uvw__leg uvw__leg--back" x="-2.9" y="-8.4" width="2.2" height="8.6" rx="1" />
        <rect className="uvw__leg uvw__leg--front" x="0.7" y="-8.4" width="2.2" height="8.6" rx="1" />
      </g>
      <rect className="uvw__torso" x="-3.4" y="-16" width="6.8" height="8.2" rx="2" />
      <rect className="uvw__vest" x="-3.4" y="-13.4" width="6.8" height="2.1" />
      <g className="uvw__arms">
        <rect className="uvw__arm uvw__arm--back" x="-5.4" y="-15.4" width="2" height="7.6" rx="1" />
        <rect className="uvw__arm uvw__arm--front" x="3.4" y="-15.4" width="2" height="7.6" rx="1" />
      </g>
      <circle className="uvw__head" cx="0" cy="-18" r="2.7" />
      <path className="uvw__hat" d="M-4 -18.6a4 4 0 0 1 8 0z" />
      <g className="uvw__tool">{tool(job)}</g>
      <rect className="uvw__load" x="-4.6" y="-22.4" width="9.2" height="5.4" rx="0.8" />
    </svg>
  );
});

/** The kit. One shape each, because at this size a second one is a smudge. */
function tool(job: Job) {
  switch (job) {
    case 'welder': return (
      <>
        <path className="uvw__kit" d="M4.6 -12.6l4.4 -2.2 1.4 1.9 -4.6 2.4z" />
        <g className="uvw__spark">
          <path d="M10.4 -12.6l3 -2.2M10.4 -12.6l3.4 0.6M10.4 -12.6l1.4 3" />
        </g>
      </>
    );
    case 'sparks': return (
      <>
        <path className="uvw__kit" d="M4.4 -15.6h1.6v3.2h-1.6z" />
        <path className="uvw__wire" d="M5.2 -15.4c5 -1.4 8 1.6 10.6 0.4" />
      </>
    );
    case 'porter': return <path className="uvw__kit" d="M4.2 -13.4l4.6 -0.6 0.4 2.2 -4.8 0.6z" />;
    case 'sweeper': return (
      <>
        <path className="uvw__kit" d="M4.6 -13.2l6.4 8.6" />
        <path className="uvw__brush" d="M10.2 -5.6l3.2 1.4 -1.2 2.6 -3.2 -1.6z" />
      </>
    );
    case 'surveyor': return (
      <>
        <path className="uvw__kit" d="M6 -13.8l4 0M8 -13.8v12.6M8 -13.8l-2.6 12.4M8 -13.8l2.6 12.4" />
        <circle className="uvw__lens" cx="10.6" cy="-13.8" r="1.5" />
      </>
    );
    case 'oiler': return (
      <>
        <path className="uvw__kit" d="M4.4 -11.6h3.4v2.6h-3.4zM7.8 -11.2l3.4 -2.2" />
        <circle className="uvw__drip" cx="11.4" cy="-11.6" r="0.85" />
      </>
    );
    case 'painter': return (
      <>
        <path className="uvw__kit" d="M4.6 -14.4l3.6 -1.6M8.2 -16.6h3.6v2.2h-3.6z" />
        <path className="uvw__wash" d="M12.6 -18.6v7.4" />
      </>
    );
    default: return (
      <>
        <rect className="uvw__kit" x="4.2" y="-14.6" width="4.6" height="5.8" rx="0.6" />
        <path className="uvw__ticks" d="M5.2 -13.2h2.6M5.2 -11.8h2.6M5.2 -10.4h1.6" />
      </>
    );
  }
}

/** What the light finds on the slate: the crew's own marks, laid out from where
 *  the objects actually are. Written once, never animated in JS. */
function chalk(size: { width: number; height: number }, posts: Station[]) {
  const r = mulberry32(7801);
  const bits: React.ReactNode[] = [];

  // The structure the board is apparently built on.
  bits.push(
    <path
      key="frame"
      className="uvmarks__frame"
      d={`M40 40H${size.width - 40}V${size.height - 40}H40Z`}
    />,
  );
  for (let i = 1; i < 6; i += 1) {
    const x = (size.width / 6) * i;
    bits.push(<path key={`rib${i}`} className="uvmarks__rib" d={`M${x.toFixed(0)} 40V${size.height - 40}`} />);
  }
  for (let i = 1; i < 4; i += 1) {
    const y = (size.height / 4) * i;
    bits.push(<path key={`beam${i}`} className="uvmarks__rib" d={`M40 ${y.toFixed(0)}H${size.width - 40}`} />);
  }

  // A dimension line between neighbours, an inspection tag on some of them, and
  // a survey cross where two of them nearly meet.
  const shuffled = [...posts].sort(() => r() - 0.5);
  for (let i = 0; i < shuffled.length; i += 1) {
    const a = shuffled[i];
    const b = shuffled[(i + 1) % shuffled.length];
    if (!b || a === b) continue;
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h + 12;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h + 12;
    if (Math.hypot(bx - ax, by - ay) > 620) continue;
    if (r() < 0.55) {
      bits.push(
        <g key={`dim${a.id}${b.id}`} className="uvmarks__dim">
          <path d={`M${ax.toFixed(0)} ${ay.toFixed(0)}L${bx.toFixed(0)} ${by.toFixed(0)}`} />
          <path d={`M${ax.toFixed(0)} ${(ay - 5).toFixed(0)}v10M${bx.toFixed(0)} ${(by - 5).toFixed(0)}v10`} />
          <text x={((ax + bx) / 2).toFixed(0)} y={((ay + by) / 2 - 4).toFixed(0)}>
            {Math.round(Math.hypot(bx - ax, by - ay))}
          </text>
        </g>,
      );
    }
    if (r() < 0.45) {
      bits.push(
        <g key={`tag${a.id}`} className="uvmarks__tag" transform={`translate(${(a.x + 4).toFixed(0)} ${(a.y - 9).toFixed(0)})`}>
          <rect x="0" y="-7" width="34" height="10" rx="1" />
          <text x="3" y="0.6">{`OK · ${String(Math.floor(r() * 900) + 100)}`}</text>
        </g>,
      );
    }
    if (r() < 0.3) {
      const cx = a.x + a.w + 16;
      const cy = a.y - 14;
      bits.push(
        <path key={`x${a.id}`} className="uvmarks__cross" d={`M${cx - 6} ${cy}h12M${cx} ${cy - 6}v12`} />,
      );
    }
    // Somebody put a mug down here, more than once.
    if (r() < 0.22) {
      const rx = a.x + a.w * (0.2 + r() * 0.6);
      const ry = a.y + a.h + 26 + r() * 30;
      bits.push(<circle key={`mug${a.id}`} className="uvmarks__ring" cx={rx.toFixed(0)} cy={ry.toFixed(0)} r={(9 + r() * 4).toFixed(1)} />);
    }
  }

  // Every object stands in a numbered bay, stencilled on the slate, with what
  // it is written under it — the board's own parts list, in ink that only this
  // lamp picks up.
  for (let i = 0; i < posts.length; i += 1) {
    const post = posts[i];
    const cx = post.x + post.w / 2;
    const base = post.y + post.h + 16;
    bits.push(
      <text key={`bay${post.id}`} className="uvmarks__bay" x={cx.toFixed(0)} y={base.toFixed(0)}>
        {`BAY ${String(i + 1).padStart(2, '0')}`}
      </text>,
    );
    bits.push(
      <text key={`st${post.id}`} className="uvmarks__stencil" x={cx.toFixed(0)} y={(base + 13).toFixed(0)}>
        {post.id.toUpperCase()}
      </text>,
    );
  }

  // And whoever built it, signing the back of the panel.
  bits.push(
    <text key="sign" className="uvmarks__sign" x={size.width - 96} y={size.height - 62}>
      A·T
    </text>,
  );
  bits.push(
    <text key="since" className="uvmarks__since" x={size.width - 96} y={size.height - 50}>
      MAINT. CREW · {JOBS.length} TRADES
    </text>,
  );
  return bits;
}
