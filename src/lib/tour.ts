// Guided tour of the working board.
//
// Everything here is pure: option catalogues, the config document (stored in
// site_settings['board.tour'] and editable live from the owner's tour panel),
// the easing/motion maths the camera runs on, and the route builders that turn
// a board full of items into an ordered list of stops. DeskBoard owns the DOM
// and the state machine; this module owns the shapes and the numbers.

import siteSettingsFixture from '../../fixtures/site-settings.json';

/** How the stops are laid out — "varias formas de recorrido". */
export const TOUR_ROUTES = ['custom', 'lists', 'columns', 'rows', 'reading', 'spiral', 'clock', 'random', 'solo'] as const;
export type TourRoute = (typeof TOUR_ROUTES)[number];

/** How the camera travels between two stops — "varias maneras de moverse". */
export const CAMERA_MOTIONS = ['glide', 'arc', 'swoop', 'push', 'pull', 'drift', 'spring', 'cut'] as const;
export type CameraMotion = (typeof CAMERA_MOTIONS)[number];

/** How each item lands on the slate. */
export const REVEAL_STYLES = ['stick', 'drop', 'rise', 'fade', 'zoom', 'flip', 'swing', 'slam', 'none'] as const;
export type RevealStyle = (typeof REVEAL_STYLES)[number];

export const REVEAL_ORDERS = ['sequence', 'reverse', 'random', 'together'] as const;
export type RevealOrder = (typeof REVEAL_ORDERS)[number];

/** How the slate itself arrives, once, at the very start. */
export const INTRO_STYLES = ['slam', 'fade', 'raise', 'sweep', 'none'] as const;
export type IntroStyle = (typeof INTRO_STYLES)[number];

/** Who decides when to move on. */
export const ADVANCE_MODES = ['manual', 'auto', 'scroll'] as const;
export type AdvanceMode = (typeof ADVANCE_MODES)[number];

/** How often a returning visitor sees the tour again. */
export const REPLAY_MODES = ['always', 'session', 'once'] as const;
export type ReplayMode = (typeof REPLAY_MODES)[number];

export const BAR_POSITIONS = ['bottom', 'top'] as const;
export type BarPosition = (typeof BAR_POSITIONS)[number];

export const EASINGS = [
  'inOutCubic', 'outSoft', 'inOutQuint', 'inOutSine', 'outCubic', 'outExpo', 'outBack', 'inOutBack', 'linear',
] as const;
export type Easing = (typeof EASINGS)[number];

export type TourStop = { id: string; label: string; items: string[] };

export type TourCamera = {
  motion: CameraMotion;
  easing: Easing;
  /** ms for the very first flight, then for every later one (before speed). */
  firstDuration: number;
  duration: number;
  /** Framing of a stop: viewport padding, box inflation and a scale ceiling. */
  padX: number;
  padTop: number;
  padBottom: number;
  inflate: number;
  maxScale: number;
  /** Extra screen-space lift for `arc`, and mid-flight zoom-out for `swoop`. */
  arc: number;
  swoop: number;
};

export type TourReveal = {
  style: RevealStyle;
  order: RevealOrder;
  duration: number;
  stagger: number;
  /** Travel distance in px for the styles that fly the item in. */
  distance: number;
  /** Motion blur in px; 0 turns it off. */
  blur: number;
  easing: Easing;
};

export type TourIntro = {
  style: IntroStyle;
  /** Empty-wall hold before the slate arrives. */
  hold: number;
  duration: number;
  /** Beat between the slate landing and the first stop. */
  settle: number;
  shake: boolean;
  dust: boolean;
  studs: boolean;
  studStagger: number;
};

export type TourBar = {
  show: boolean;
  position: BarPosition;
  progress: boolean;
  /** One clickable dot per stop, so a visitor can jump straight to one. */
  dots: boolean;
  counter: boolean;
  label: boolean;
  hint: string;
  nextLabel: string;
  finishLabel: string;
  backLabel: string;
  skipLabel: string;
};

export type TourConfig = {
  enabled: boolean;
  route: TourRoute;
  /** Items per stop for every generated route. */
  groupSize: number;
  /** Divides every duration in the run. */
  speed: number;
  advance: AdvanceMode;
  /** ms held at a stop when `advance === 'auto'`. */
  dwell: number;
  loop: boolean;
  replay: ReplayMode;
  /** Append a final stop with whatever the route left out. */
  includeRest: boolean;
  /** The hand-authored route, used when `route === 'custom'`. */
  stops: TourStop[];
  camera: TourCamera;
  reveal: TourReveal;
  intro: TourIntro;
  bar: TourBar;
};

/** Behavioural defaults. The seeded document only carries the authored route,
 *  so anything the owner has never touched falls through to these. */
const BASE_TOUR: TourConfig = {
  enabled: true,
  route: 'custom',
  groupSize: 2,
  speed: 1,
  advance: 'manual',
  dwell: 3200,
  loop: false,
  replay: 'always',
  includeRest: true,
  stops: [],
  camera: {
    motion: 'glide',
    easing: 'inOutCubic',
    firstDuration: 950,
    duration: 760,
    padX: 60,
    padTop: 70,
    padBottom: 168,
    inflate: 70,
    maxScale: 1.05,
    arc: 90,
    swoop: 0.28,
  },
  reveal: {
    style: 'stick',
    order: 'sequence',
    duration: 560,
    stagger: 150,
    distance: 190,
    blur: 4,
    easing: 'outSoft',
  },
  intro: {
    style: 'slam',
    hold: 340,
    duration: 640,
    settle: 420,
    shake: true,
    dust: true,
    studs: true,
    studStagger: 55,
  },
  bar: {
    show: true,
    position: 'bottom',
    progress: true,
    dots: false,
    counter: true,
    label: true,
    hint: 'space / → next · drag & zoom anytime',
    nextLabel: 'next →',
    finishLabel: 'open the board →',
    backLabel: '← back',
    skipLabel: 'skip',
  },
};

// ---------------------------------------------------------------- parsing

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pickEnum<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : fallback;
}

function num(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = typeof value === 'number' ? value : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function text(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function parseStops(value: unknown, fallback: TourStop[]): TourStop[] {
  if (!Array.isArray(value)) return fallback;
  const stops: TourStop[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const items = Array.isArray(raw.items) ? raw.items.filter((id): id is string => typeof id === 'string') : [];
    stops.push({
      id: typeof raw.id === 'string' ? raw.id : `stop-${stops.length + 1}`,
      label: text(raw.label, ''),
      items,
    });
  }
  return stops;
}

/** Deep-merge a stored tour document over a base so partial saves keep working. */
export function parseTour(value: unknown, base: TourConfig = DEFAULT_TOUR): TourConfig {
  if (!isRecord(value)) return base;
  const camera = isRecord(value.camera) ? value.camera : {};
  const reveal = isRecord(value.reveal) ? value.reveal : {};
  const intro = isRecord(value.intro) ? value.intro : {};
  const bar = isRecord(value.bar) ? value.bar : {};
  return {
    enabled: bool(value.enabled, base.enabled),
    route: pickEnum(value.route, TOUR_ROUTES, base.route),
    groupSize: Math.round(num(value.groupSize, base.groupSize, 1, 8)),
    speed: num(value.speed, base.speed, 0.3, 3),
    advance: pickEnum(value.advance, ADVANCE_MODES, base.advance),
    dwell: num(value.dwell, base.dwell, 600, 20000),
    loop: bool(value.loop, base.loop),
    replay: pickEnum(value.replay, REPLAY_MODES, base.replay),
    includeRest: bool(value.includeRest, base.includeRest),
    stops: parseStops(value.stops, base.stops),
    camera: {
      motion: pickEnum(camera.motion, CAMERA_MOTIONS, base.camera.motion),
      easing: pickEnum(camera.easing, EASINGS, base.camera.easing),
      firstDuration: num(camera.firstDuration, base.camera.firstDuration, 0, 6000),
      duration: num(camera.duration, base.camera.duration, 0, 6000),
      padX: num(camera.padX, base.camera.padX, 0, 400),
      padTop: num(camera.padTop, base.camera.padTop, 0, 400),
      padBottom: num(camera.padBottom, base.camera.padBottom, 0, 500),
      inflate: num(camera.inflate, base.camera.inflate, 0, 400),
      maxScale: num(camera.maxScale, base.camera.maxScale, 0.2, 2.4),
      arc: num(camera.arc, base.camera.arc, 0, 400),
      swoop: num(camera.swoop, base.camera.swoop, 0, 0.7),
    },
    reveal: {
      style: pickEnum(reveal.style, REVEAL_STYLES, base.reveal.style),
      order: pickEnum(reveal.order, REVEAL_ORDERS, base.reveal.order),
      duration: num(reveal.duration, base.reveal.duration, 0, 4000),
      stagger: num(reveal.stagger, base.reveal.stagger, 0, 1500),
      distance: num(reveal.distance, base.reveal.distance, 0, 600),
      blur: num(reveal.blur, base.reveal.blur, 0, 20),
      easing: pickEnum(reveal.easing, EASINGS, base.reveal.easing),
    },
    intro: {
      style: pickEnum(intro.style, INTRO_STYLES, base.intro.style),
      hold: num(intro.hold, base.intro.hold, 0, 3000),
      duration: num(intro.duration, base.intro.duration, 0, 4000),
      settle: num(intro.settle, base.intro.settle, 0, 3000),
      shake: bool(intro.shake, base.intro.shake),
      dust: bool(intro.dust, base.intro.dust),
      studs: bool(intro.studs, base.intro.studs),
      studStagger: num(intro.studStagger, base.intro.studStagger, 0, 400),
    },
    bar: {
      show: bool(bar.show, base.bar.show),
      position: pickEnum(bar.position, BAR_POSITIONS, base.bar.position),
      progress: bool(bar.progress, base.bar.progress),
      dots: bool(bar.dots, base.bar.dots),
      counter: bool(bar.counter, base.bar.counter),
      label: bool(bar.label, base.bar.label),
      hint: text(bar.hint, base.bar.hint),
      nextLabel: text(bar.nextLabel, base.bar.nextLabel),
      finishLabel: text(bar.finishLabel, base.bar.finishLabel),
      backLabel: text(bar.backLabel, base.bar.backLabel),
      skipLabel: text(bar.skipLabel, base.bar.skipLabel),
    },
  };
}

const fixtureTour = (siteSettingsFixture as Array<{ key: string; value: unknown }>)
  .find((row) => row.key === 'board.tour')?.value;

/** The seeded route merged over the behavioural defaults. */
export const DEFAULT_TOUR: TourConfig = parseTour(fixtureTour, BASE_TOUR);

// ---------------------------------------------------------------- easing

/** Sampler for a CSS cubic-bezier, so the JS camera and the CSS-driven item
 *  animations run on exactly the same curve. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;
  const ay = 3 * y1 - 3 * y2 + 1;
  const by = 3 * y2 - 6 * y1;
  const cy = 3 * y1;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i += 1) {
      const slope = slopeX(t);
      if (slope === 0) break;
      t -= (sampleX(t) - x) / slope;
    }
    t = Math.min(1.2, Math.max(-0.2, t));
    return ((ay * t + by) * t + cy) * t;
  };
}

const CURVES: Record<Easing, { css: string; fn: (t: number) => number }> = {
  // The handoff pins this one to its analytic form, so it is not a bezier.
  inOutCubic: { css: 'cubic-bezier(.65,0,.35,1)', fn: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) },
  outSoft: { css: 'cubic-bezier(.17,.85,.2,1)', fn: bezier(0.17, 0.85, 0.2, 1) },
  inOutQuint: { css: 'cubic-bezier(.83,0,.17,1)', fn: bezier(0.83, 0, 0.17, 1) },
  inOutSine: { css: 'cubic-bezier(.37,0,.63,1)', fn: bezier(0.37, 0, 0.63, 1) },
  outCubic: { css: 'cubic-bezier(.33,1,.68,1)', fn: bezier(0.33, 1, 0.68, 1) },
  outExpo: { css: 'cubic-bezier(.16,1,.3,1)', fn: bezier(0.16, 1, 0.3, 1) },
  outBack: { css: 'cubic-bezier(.34,1.56,.64,1)', fn: bezier(0.34, 1.56, 0.64, 1) },
  inOutBack: { css: 'cubic-bezier(.68,-.6,.32,1.6)', fn: bezier(0.68, -0.6, 0.32, 1.6) },
  linear: { css: 'linear', fn: (t) => t },
};

export function easingCss(name: Easing): string {
  return CURVES[name].css;
}

export function easingFn(name: Easing): (t: number) => number {
  return CURVES[name].fn;
}

export type MotionSample = {
  /** Progress of the pan (the framed centre point). */
  pan: number;
  /** Progress of the zoom. */
  zoom: number;
  /** Extra screen-space Y offset in px. */
  lift: number;
  /** Multiplier applied to the interpolated scale. */
  dip: number;
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Where the camera is, as a fraction of the way from A to B, at time `t`. */
export function motionSample(camera: TourCamera, t: number): MotionSample {
  const ease = easingFn(camera.easing);
  const e = ease(t);
  switch (camera.motion) {
    case 'arc':
      return { pan: e, zoom: e, lift: -camera.arc * Math.sin(Math.PI * t), dip: 1 };
    case 'swoop':
      return { pan: e, zoom: e, lift: 0, dip: 1 - camera.swoop * Math.sin(Math.PI * t) };
    // Pan lands early and the zoom follows it in.
    case 'push':
      return { pan: ease(clamp01(t * 1.5)), zoom: ease(clamp01((t - 0.28) / 0.72)), lift: 0, dip: 1 };
    // The mirror: pull back first, then slide across.
    case 'pull':
      return { pan: ease(clamp01((t - 0.28) / 0.72)), zoom: ease(clamp01(t * 1.5)), lift: 0, dip: 1 };
    case 'drift':
      return { pan: t, zoom: t, lift: 0, dip: 1 };
    case 'spring': {
      const s = easingFn('outBack')(t);
      return { pan: s, zoom: s, lift: 0, dip: 1 };
    }
    case 'cut':
      return { pan: t < 1 ? 0 : 1, zoom: t < 1 ? 0 : 1, lift: 0, dip: 1 };
    case 'glide':
    default:
      return { pan: e, zoom: e, lift: 0, dip: 1 };
  }
}

// ---------------------------------------------------------------- reveal

/** Keyframes for one item landing on the slate.
 *
 *  `fill: 'none'` is deliberate on the caller's side: the element keeps its own
 *  inline `transform: rotate(Xdeg)` (which the drag code reads back), so every
 *  sequence has to finish on exactly that value or the card would snap. */
export function revealKeyframes(reveal: TourReveal, rot: number, dir: 1 | -1): Keyframe[] {
  const rest = { transform: `rotate(${rot}deg) scale(1)`, filter: 'blur(0px)' };
  const blurIn = reveal.blur > 0 ? `blur(${reveal.blur}px)` : 'blur(0px)';
  const d = reveal.distance;

  switch (reveal.style) {
    case 'drop':
      return [
        { opacity: 0, transform: `translateY(${-d * 0.32}px) rotate(${rot}deg) scale(.972)`, filter: blurIn },
        { opacity: 1, offset: 0.42 },
        rest,
      ];
    case 'rise':
      return [
        { opacity: 0, transform: `translateY(${d * 0.28}px) rotate(${rot}deg) scale(.978)`, filter: blurIn },
        { opacity: 1, offset: 0.45 },
        rest,
      ];
    case 'fade':
      return [{ opacity: 0 }, { opacity: 1 }];
    case 'zoom':
      return [
        { opacity: 0, transform: `rotate(${rot}deg) scale(.62)`, filter: blurIn },
        { opacity: 1, offset: 0.35 },
        { transform: `rotate(${rot}deg) scale(1.02)`, filter: 'blur(0px)', offset: 0.78 },
        rest,
      ];
    case 'flip':
      return [
        { opacity: 0, transform: `rotate(${rot}deg) perspective(1100px) rotateY(${dir * 82}deg) scale(.94)`, filter: blurIn },
        { opacity: 1, offset: 0.3 },
        { transform: `rotate(${rot}deg) perspective(1100px) rotateY(${dir * -6}deg) scale(1)`, filter: 'blur(0px)', offset: 0.76 },
        rest,
      ];
    case 'swing':
      return [
        { opacity: 0, transform: `translateY(${-d * 0.22}px) rotate(${rot + dir * 24}deg) scale(1.04)`, filter: blurIn },
        { opacity: 1, offset: 0.28 },
        { transform: `rotate(${rot - dir * 4}deg) scale(1)`, filter: 'blur(0px)', offset: 0.72 },
        rest,
      ];
    case 'slam':
      return [
        { opacity: 0, transform: `rotate(${rot}deg) scale(1.62)`, filter: blurIn },
        { opacity: 1, offset: 0.22 },
        { transform: `rotate(${rot}deg) scale(.972)`, filter: 'blur(0px)', offset: 0.7 },
        rest,
      ];
    case 'none':
      return [{ opacity: 1 }, { opacity: 1 }];
    case 'stick':
    default:
      // The handoff's signature move: thrown in from off-slate and pinned.
      return [
        {
          opacity: 0,
          transform: `translate(${dir * (d * 0.474)}px, ${-d}px) rotate(${rot - dir * 15}deg) scale(1.7)`,
          filter: blurIn,
        },
        { opacity: 1, offset: 0.3 },
        { transform: `rotate(${rot + dir * 1.8}deg) scale(.975)`, filter: 'blur(0px)', offset: 0.74 },
        rest,
      ];
  }
}

/** Which way an item swings in — stable per item so a replay looks the same. */
export function revealDirection(id: string, index: number): 1 | -1 {
  return (id.charCodeAt(0) + index) % 2 ? 1 : -1;
}

/** The order items inside one stop are staggered in. */
export function revealSequence(count: number, order: RevealOrder, rand: () => number = Math.random): number[] {
  const list = Array.from({ length: count }, (_, i) => i);
  if (order === 'reverse') return list.reverse();
  if (order === 'random') {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }
  return list;
}

// ---------------------------------------------------------------- routes

/** One draggable thing on the board, as the route builders see it. */
export type TourItem = {
  id: string;
  x: number;
  y: number;
  w: number;
  label: string;
  group?: string;
  groupLabel?: string;
};

function chunk<T>(list: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/** Split a sorted list wherever the gap along `axis` exceeds `gap`. */
function cluster(items: TourItem[], axis: 'x' | 'y', gap: number): TourItem[][] {
  const sorted = [...items].sort((a, b) => a[axis] - b[axis]);
  const groups: TourItem[][] = [];
  let start = Number.NaN;
  for (const item of sorted) {
    if (groups.length === 0 || item[axis] - start > gap) {
      groups.push([item]);
      start = item[axis];
    } else {
      groups[groups.length - 1].push(item);
    }
  }
  return groups;
}

function labelFor(items: TourItem[]): string {
  const names = items.map((item) => item.label).filter(Boolean);
  if (names.length === 0) return 'the board';
  const head = names.slice(0, 2).join(' · ');
  return names.length > 2 ? `${head} +${names.length - 2}` : head;
}

function toStops(groups: TourItem[][], size: number): TourStop[] {
  const stops: TourStop[] = [];
  for (const group of groups) {
    for (const piece of chunk(group, Math.max(1, size))) {
      stops.push({ id: `auto-${stops.length + 1}`, label: labelFor(piece), items: piece.map((item) => item.id) });
    }
  }
  return stops;
}

function centreOf(items: TourItem[]): { x: number; y: number } {
  if (items.length === 0) return { x: 0, y: 0 };
  const sum = items.reduce((acc, item) => ({ x: acc.x + item.x + item.w / 2, y: acc.y + item.y }), { x: 0, y: 0 });
  return { x: sum.x / items.length, y: sum.y / items.length };
}

/** Turn the board into an ordered list of stops, following the chosen route. */
export function buildStops(tour: TourConfig, items: TourItem[], rand: () => number = Math.random): TourStop[] {
  if (items.length === 0) return [];
  const size = Math.max(1, tour.groupSize);
  const byId = new Map(items.map((item) => [item.id, item]));
  let stops: TourStop[];

  switch (tour.route) {
    case 'lists': {
      const seen: string[] = [];
      const buckets = new Map<string, TourItem[]>();
      const loose: TourItem[] = [];
      for (const item of items) {
        if (!item.group) { loose.push(item); continue; }
        if (!buckets.has(item.group)) { buckets.set(item.group, []); seen.push(item.group); }
        buckets.get(item.group)!.push(item);
      }
      stops = seen.map((group, index) => {
        const bucket = buckets.get(group)!;
        return {
          id: `list-${index + 1}`,
          label: bucket[0]?.groupLabel || labelFor(bucket),
          items: bucket.map((item) => item.id),
        };
      });
      stops.push(...toStops([loose], size));
      break;
    }
    case 'columns':
      stops = toStops(cluster(items, 'x', 320).map((group) => [...group].sort((a, b) => a.y - b.y)), size);
      break;
    case 'rows':
      stops = toStops(cluster(items, 'y', 260).map((group) => [...group].sort((a, b) => a.x - b.x)), size);
      break;
    case 'reading':
      stops = toStops(
        [[...items].sort((a, b) => Math.floor(a.y / 320) - Math.floor(b.y / 320) || a.x - b.x)],
        size,
      );
      break;
    case 'spiral': {
      const mid = centreOf(items);
      const radius = (item: TourItem) => Math.hypot(item.x + item.w / 2 - mid.x, item.y - mid.y);
      const ring = Math.max(1, Math.max(...items.map(radius)) / 3);
      stops = toStops(
        [[...items].sort((a, b) => (
          Math.floor(radius(a) / ring) - Math.floor(radius(b) / ring)
          || Math.atan2(a.y - mid.y, a.x - mid.x) - Math.atan2(b.y - mid.y, b.x - mid.x)
        ))],
        size,
      );
      break;
    }
    case 'clock': {
      const mid = centreOf(items);
      // Angle measured from 12 o'clock, running clockwise.
      const angle = (item: TourItem) => {
        const a = Math.atan2(item.x + item.w / 2 - mid.x, mid.y - item.y);
        return a < 0 ? a + Math.PI * 2 : a;
      };
      stops = toStops([[...items].sort((a, b) => angle(a) - angle(b))], size);
      break;
    }
    case 'random': {
      const shuffled = [...items];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      stops = toStops([shuffled], size);
      break;
    }
    case 'solo':
      stops = toStops([items], 1);
      break;
    case 'custom':
    default:
      stops = tour.stops
        .map((stop, index) => ({
          id: stop.id || `stop-${index + 1}`,
          label: stop.label || labelFor(stop.items.map((id) => byId.get(id)).filter((item): item is TourItem => !!item)),
          items: stop.items.filter((id) => byId.has(id)),
        }))
        .filter((stop) => stop.items.length > 0);
      // An empty or fully stale hand-authored route would leave the board
      // hidden, so fall back to something that always covers it.
      if (stops.length === 0) return buildStops({ ...tour, route: 'reading' }, items, rand);
      break;
  }

  if (tour.includeRest) {
    const covered = new Set(stops.flatMap((stop) => stop.items));
    const rest = items.filter((item) => !covered.has(item.id));
    if (rest.length > 0) {
      stops.push(...toStops([rest], size).map((stop, index) => ({ ...stop, id: `rest-${index + 1}` })));
    }
  }

  return stops;
}

/** Remembers that this visitor has already been walked through the board. */
const SEEN_KEY = 'board.tour.seen';

function store(mode: ReplayMode): Storage | null {
  try {
    if (mode === 'session') return window.sessionStorage;
    if (mode === 'once') return window.localStorage;
  } catch {
    return null;
  }
  return null;
}

export function tourAlreadySeen(mode: ReplayMode): boolean {
  return store(mode)?.getItem(SEEN_KEY) === '1';
}

export function markTourSeen(mode: ReplayMode): void {
  try {
    store(mode)?.setItem(SEEN_KEY, '1');
  } catch {
    // A blocked storage jar just means the tour plays again. Not worth failing.
  }
}
