// The world the objects share.
//
// Every toy on this board could have been a component with its own state, its
// own animation frame and its own opinion about where it is. That would have
// been twenty-six little islands. This is the alternative: one place that knows
// where everything is, what is holding the visitor's hand, whether the gravity
// is on, and what the black hole is currently eating — so that the paint can
// stain the passport, a Polaroid can photograph the slime mould, and the coin
// can be thrown into the hole without any of those three knowing about the
// others.
//
// Positions are deliberately *not* React state. They are written straight onto
// the nodes, exactly as the camera and the guided tour are, because a physics
// step at sixty frames a second is not a render.

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from 'react';
import { DEFAULT_OBJECT_LAYOUT, OBJECT_SPECS, hasTrait, type DeskObject, type ObjectKind } from './kinds';
import { addFrame, reducedMotion } from './frame';
import { clamp } from './rng';
import { type Splat } from './splats';
import { PAINT_COLORS } from './splats';
import type { PassportStamp } from './passport';
import { readLocal, readSession, writeLocal, writeSession } from './visitor';

export type Placement = { x: number; y: number; rot: number; scale: number };

/** What the visitor is holding. Holding something changes the cursor and takes
 *  the board's ordinary click meanings away, so only one at a time. */
export type Tool = 'paint' | 'camera' | 'scope' | 'water';

/** A photo taken of the board, during this session and only this session. */
export type Photo = {
  id: string;
  x: number;
  y: number;
  rot: number;
  w: number;
  h: number;
  /** Board rectangle the shutter caught. */
  rect: { x: number; y: number; w: number; h: number };
  at: number;
};

/** How long the paint lives. The owner's dial; `session` is the shipped one.
 *  `none` still lets a visitor shoot — it simply keeps nothing past the tab. */
export type PaintMode = 'none' | 'session' | 'global';

export type WorldSettings = {
  /** Objects the owner has switched off entirely, by kind. */
  hidden: ObjectKind[];
  paint: PaintMode;
};

type WorldValue = {
  objects: DeskObject[];
  /** Live positions. A ref: read it in a handler, never in a render. */
  placeRef: React.RefObject<Map<ObjectKind, Placement>>;
  nodes: React.RefObject<Map<string, HTMLElement>>;
  register: (id: string, el: HTMLElement | null) => void;
  boardRef: React.RefObject<HTMLElement | null>;
  /** Board units per screen pixel, right now. */
  scale: () => number;
  place: (id: ObjectKind) => Placement;
  moveTo: (id: ObjectKind, next: Partial<Placement>) => void;
  bump: (el: HTMLElement) => void;

  tool: Tool | null;
  hold: (tool: Tool | null) => void;
  paintColor: string;
  setPaintColor: (id: string) => void;

  splats: Splat[];
  addSplat: (splat: Splat) => void;
  clearSplats: () => void;
  paintMode: PaintMode;
  setPaintMode: (mode: PaintMode) => void;

  zeroG: boolean;
  setZeroG: (on: boolean) => void;

  swallowed: ObjectKind[];
  swallow: (id: ObjectKind) => void;
  /** Start the black-hole capture immediately when an object crosses the
   * horizon, including while the visitor is still holding it. */
  absorb: (id: ObjectKind, previous?: { x: number; y: number }) => boolean;
  restoreWorld: () => void;

  photos: Photo[];
  addPhoto: (photo: Photo) => void;
  dropPhoto: (id: string) => void;
  clearPhotos: () => void;

  /** The recurring joke. Fires the alignment, returns nothing, breaks nothing. */
  answer: number;
  fireAnswer: () => void;

  /** Owner-editable content the objects carry. Threaded through the world
   *  rather than through every component, because three of them need it and
   *  none of them should know where the settings document lives. */
  passport: PassportStamp[];
  savePassport: (next: PassportStamp[]) => void;
  editing: boolean;
  /** Put a file in the bucket and hand back its URL. Null when there is no
   *  storage wired up, in which case a photo slot simply stays empty. */
  upload: ((file: File) => Promise<string>) | null;

  /** Objects report their bodies here so the shared integrator can move them. */
  wake: (id: ObjectKind, vx?: number, vy?: number) => void;
  reduced: boolean;
};

const WorldContext = createContext<WorldValue | null>(null);

export function useWorld(): WorldValue {
  const value = useContext(WorldContext);
  if (!value) throw new Error('A board object was rendered outside the world.');
  return value;
}

type Body = { x: number; y: number; vx: number; vy: number; rot: number; vr: number; sleep: number };

const SPLAT_KEY = 'board.world.splats';
const ZERO_G_KEY = 'board.world.zeroG';

export function WorldProvider({
  objects,
  boardRef,
  boardSize,
  paintMode,
  onPaintMode,
  passport,
  onPassport,
  editing,
  upload,
  children,
}: {
  objects: DeskObject[];
  boardRef: React.RefObject<HTMLElement | null>;
  boardSize: { width: number; height: number };
  paintMode: PaintMode;
  onPaintMode: (mode: PaintMode) => void;
  passport: PassportStamp[];
  onPassport: (next: PassportStamp[]) => void;
  editing: boolean;
  upload: ((file: File) => Promise<string>) | null;
  children: ReactNode;
}) {
  const reduced = useMemo(() => reducedMotion(), []);
  const nodes = useRef(new Map<string, HTMLElement>());
  const placeRef = useRef(new Map<ObjectKind, Placement>());
  const bodies = useRef(new Map<ObjectKind, Body>());
  const absorbing = useRef(new Set<ObjectKind>());
  const zRef = useRef(400);

  const [tool, setTool] = useState<Tool | null>(null);
  const [paintColor, setPaintColor] = useState<string>(PAINT_COLORS[0].id);
  // Read once, at mount, from whichever jar the owner has chosen. Changing the
  // mode later changes where new paint is kept, not what is already on the
  // board — reloading the board's paint underneath a visitor would be strange.
  const [splats, setSplats] = useState<Splat[]>(() => (
    paintMode === 'global' ? readLocal<Splat[]>(SPLAT_KEY, [])
      : paintMode === 'session' ? readSession<Splat[]>(SPLAT_KEY, [])
        : []
  ));
  const [zeroG, setZeroGState] = useState(false);
  const [swallowed, setSwallowed] = useState<ObjectKind[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [answer, setAnswer] = useState(0);
  const [running, setRunning] = useState(false);

  // ---- authored positions ---------------------------------------------------
  // The catalogue is the *starting* position. Where a visitor leaves something
  // is theirs for the session and nobody else's; where the owner leaves it is
  // saved from the objects panel, deliberately and by hand.
  useEffect(() => {
    const map = placeRef.current;
    for (const object of objects) {
      if (!map.has(object.id)) map.set(object.id, { x: object.x, y: object.y, rot: object.rot, scale: object.scale });
    }
  }, [objects]);

  const place = useCallback((id: ObjectKind): Placement => {
    const found = placeRef.current.get(id);
    if (found) return found;
    const object = objects.find((o) => o.id === id) ?? DEFAULT_OBJECT_LAYOUT.find((o) => o.id === id)!;
    const made = { x: object.x, y: object.y, rot: object.rot, scale: object.scale };
    placeRef.current.set(id, made);
    return made;
  }, [objects]);

  const paint = useCallback((id: ObjectKind) => {
    const el = nodes.current.get(id);
    const at = placeRef.current.get(id);
    if (!el || !at) return;
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
    el.style.transform = `rotate(${at.rot}deg) scale(${at.scale})`;
  }, []);

  const moveTo = useCallback((id: ObjectKind, next: Partial<Placement>) => {
    const at = place(id);
    placeRef.current.set(id, { ...at, ...next });
    paint(id);
  }, [paint, place]);

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) nodes.current.set(id, el);
    else nodes.current.delete(id);
  }, []);

  const bump = useCallback((el: HTMLElement) => { el.style.zIndex = String((zRef.current += 1)); }, []);

  /** Board units per screen pixel. Read off the live transform rather than
   *  threaded through props, so the world never has to know the camera exists. */
  const scale = useCallback(() => {
    const el = boardRef.current;
    if (!el) return 1;
    const rect = el.getBoundingClientRect();
    const width = el.offsetWidth || 1;
    return rect.width / width || 1;
  }, [boardRef]);

  // ---- paint ----------------------------------------------------------------

  const persistSplats = useCallback((next: Splat[]) => {
    if (paintMode === 'global') writeLocal(SPLAT_KEY, next);
    else if (paintMode === 'session') writeSession(SPLAT_KEY, next);
  }, [paintMode]);

  const addSplat = useCallback((splat: Splat) => {
    setSplats((current) => {
      // A board somebody has been shooting at for ten minutes is still a board.
      const next = [...current, splat].slice(-160);
      persistSplats(next);
      return next;
    });
  }, [persistSplats]);

  const clearSplats = useCallback(() => { setSplats([]); persistSplats([]); }, [persistSplats]);

  // ---- gravity --------------------------------------------------------------
  const setZeroG = useCallback((on: boolean) => {
    setZeroGState(on);
    writeSession(ZERO_G_KEY, on);
    if (!on) return;
    // Everything loose gets a shove, so the room drifts apart rather than
    // hanging there like a held breath.
    for (const object of objects) {
      if (!hasTrait(object.id, 'gravity')) continue;
      const at = placeRef.current.get(object.id);
      if (!at) continue;
      bodies.current.set(object.id, {
        x: at.x, y: at.y,
        vx: (Math.random() - 0.5) * 0.07,
        vy: -0.02 - Math.random() * 0.05,
        rot: at.rot,
        vr: (Math.random() - 0.5) * 0.012,
        sleep: 0,
      });
    }
    setRunning(true);
  }, [objects]);

  const wake = useCallback((id: ObjectKind, vx = 0, vy = 0) => {
    const at = placeRef.current.get(id);
    if (!at) return;
    bodies.current.set(id, { x: at.x, y: at.y, vx, vy, rot: at.rot, vr: (vx - vy) * 0.004, sleep: 0 });
    setRunning(true);
  }, []);

  const swallow = useCallback((id: ObjectKind) => {
    bodies.current.delete(id);
    setSwallowed((current) => (current.includes(id) ? current : [...current, id]));
  }, []);

  /**
   * The event horizon is shared by thrown things and things still held by the
   * pointer. Keeping the animation here means both paths get the same long,
   * wound-in disappearance rather than a drag simply snapping out of view.
   */
  const absorb = useCallback((id: ObjectKind, previous?: { x: number; y: number }): boolean => {
    if (!hasTrait(id, 'blackhole') || id === 'blackhole' || swallowed.includes('blackhole')) return false;
    if (swallowed.includes(id) || absorbing.current.has(id)) return true;
    const hole = placeRef.current.get('blackhole');
    const at = placeRef.current.get(id);
    if (!hole || !at) return false;
    const holeSpec = OBJECT_SPECS.blackhole;
    const spec = OBJECT_SPECS[id];
    const hx = hole.x + (holeSpec.w * hole.scale) / 2;
    const hy = hole.y + (holeSpec.h * hole.scale) / 2;
    const cx = at.x + (spec.w * at.scale) / 2;
    const cy = at.y + (spec.h * at.scale) / 2;
    const dx = hx - cx;
    const dy = hy - cy;
    const distance = Math.hypot(dx, dy);
    // The horizon reaches a little past the drawn shadow, and a little further
    // for a big object: a tray of soil dragged across the hole should go in
    // when it covers it, not only when its exact centre crosses.
    const reach = Math.min(40, (Math.min(spec.w, spec.h) * at.scale) / 2.6);
    const horizon = (holeSpec.w * hole.scale) * 0.34 + reach;
    const previousDistance = previous
      ? distanceToSegment(
        hx,
        hy,
        previous.x + (spec.w * at.scale) / 2,
        previous.y + (spec.h * at.scale) / 2,
        cx,
        cy,
      )
      : distance;
    if (Math.min(distance, previousDistance) > horizon) return false;

    bodies.current.delete(id);
    absorbing.current.add(id);
    const finish = () => {
      absorbing.current.delete(id);
      swallow(id);
    };
    const el = nodes.current.get(id);
    if (!el || reducedMotion()) { finish(); return true; }
    const spin = dx >= 0 ? 1 : -1;
    // The genie into the lamp.
    //
    // `rotate(angle)` turns the object's own X axis onto the line to the hole,
    // so the `scale` after it stretches it *along* that line and crushes it
    // across — a ribbon pointing at the hole rather than a thing squashed
    // sideways whichever way it happened to be going. Then the ribbon winds
    // round and is drawn down to nothing at the centre.
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const k = at.scale;
    const run = el.animate([
      { transform: `translate(0px, 0px) rotate(${at.rot}deg) scale(${k})`, filter: 'none', opacity: 1 },
      {
        transform: `translate(${(dx * 0.3).toFixed(1)}px, ${(dy * 0.3).toFixed(1)}px) rotate(${angle.toFixed(1)}deg) scale(${(k * 1.18).toFixed(3)}, ${(k * 0.6).toFixed(3)})`,
        filter: 'hue-rotate(-24deg) saturate(1.5) brightness(.86)',
        opacity: 1,
        offset: 0.32,
      },
      {
        transform: `translate(${(dx * 0.74).toFixed(1)}px, ${(dy * 0.74).toFixed(1)}px) rotate(${(angle + spin * 320).toFixed(1)}deg) scale(${(k * 1.55).toFixed(3)}, ${(k * 0.19).toFixed(3)})`,
        filter: 'hue-rotate(-52deg) saturate(2) brightness(.6) blur(.6px)',
        opacity: 0.92,
        offset: 0.68,
      },
      {
        transform: `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) rotate(${(angle + spin * 820).toFixed(1)}deg) scale(${(k * 0.05).toFixed(3)}, ${(k * 0.02).toFixed(3)})`,
        filter: 'hue-rotate(-80deg) saturate(2.6) brightness(.24) blur(1.2px)',
        opacity: 0,
      },
    ], { duration: 1050, easing: 'cubic-bezier(.5,0,.85,.35)', fill: 'forwards' });
    run.addEventListener('finish', finish, { once: true });
    return true;
  }, [swallowed, swallow]);

  const restoreWorld = useCallback(() => {
    setSwallowed([]);
    bodies.current.clear();
    setZeroGState(false);
    writeSession(ZERO_G_KEY, false);
    for (const object of objects) {
      placeRef.current.set(object.id, { x: object.x, y: object.y, rot: object.rot, scale: object.scale });
      const el = nodes.current.get(object.id);
      if (!el) continue;
      // A fall that ended with `fill: 'forwards'` is still holding the element
      // at the singularity; cancel it before putting the thing back.
      for (const run of el.getAnimations?.() ?? []) run.cancel();
      el.style.left = `${object.x}px`;
      el.style.top = `${object.y}px`;
      el.style.transform = `rotate(${object.rot}deg) scale(${object.scale})`;
      el.style.opacity = '';
      el.style.filter = '';
    }
  }, [objects]);

  // ---- the shared integrator ------------------------------------------------
  //
  // One loop, and only while something is actually moving. A body that comes to
  // rest is dropped from the map; when the map empties the loop stops.
  const holeAt = useCallback((): { x: number; y: number; r: number } | null => {
    if (swallowed.includes('blackhole')) return null;
    const object = objects.find((o) => o.id === 'blackhole');
    if (!object) return null;
    const at = placeRef.current.get('blackhole');
    if (!at) return null;
    const spec = OBJECT_SPECS.blackhole;
    return { x: at.x + (spec.w * at.scale) / 2, y: at.y + (spec.h * at.scale) / 2, r: (spec.w * at.scale) / 2 };
  }, [objects, swallowed]);

  // The integrator reads these rather than closing over them, so an owner
  // moving the hole or a visitor turning the gravity off lands on the very next
  // frame without the loop being torn down and rebuilt.
  const holeRef = useRef(holeAt);
  const zeroRef = useRef(zeroG);
  const absorbRef = useRef(absorb);
  useEffect(() => {
    holeRef.current = holeAt;
    zeroRef.current = zeroG;
    absorbRef.current = absorb;
  });

  useEffect(() => {
    if (!running) return undefined;
    return addFrame((dt) => {
      const step = Math.min(2.4, dt / 16.7);
      const live = bodies.current;
      if (live.size === 0) { setRunning(false); return; }
      const hole = holeRef.current();
      const floating = zeroRef.current;

      for (const [id, body] of live) {
        const spec = OBJECT_SPECS[id];
        const at = placeRef.current.get(id);
        if (!at) { live.delete(id); continue; }
        const hw = (spec.w * at.scale) / 2;
        const hh = (spec.h * at.scale) / 2;
        const cx = body.x + hw;
        const cy = body.y + hh;

        if (hole && hasTrait(id, 'blackhole')) {
          const dx = hole.x - cx;
          const dy = hole.y - cy;
          const d2 = dx * dx + dy * dy;
          const d = Math.sqrt(d2);
          // Softened inverse square: the singularity is a drawing, not a
          // division by zero.
          const pull = 2400 / (d2 + 900);
          if (d < hole.r * 3.4) {
            body.vx += (dx / d) * pull * step;
            body.vy += (dy / d) * pull * step;
            body.vr += 0.0008 * step;
          }
          if (d < hole.r * 0.42) {
            absorbRef.current(id);
            live.delete(id);
            continue;
          }
        }

        if (!floating) {
          // Ordinary board: a thrown thing slides to a stop, it does not fall
          // off the bottom of a vertical slate that is clearly holding it.
          body.vx *= Math.pow(0.94, step);
          body.vy *= Math.pow(0.94, step);
          body.vr *= Math.pow(0.93, step);
        } else {
          body.vx *= Math.pow(0.999, step);
          body.vy *= Math.pow(0.999, step);
        }

        body.x += body.vx * dt;
        body.y += body.vy * dt;
        body.rot += body.vr * dt;

        // The slate's own edges, softly.
        const maxX = boardSize.width - spec.w * at.scale;
        const maxY = boardSize.height - spec.h * at.scale;
        if (body.x < 0) { body.x = 0; body.vx = Math.abs(body.vx) * 0.55; }
        if (body.y < 0) { body.y = 0; body.vy = Math.abs(body.vy) * 0.55; }
        if (body.x > maxX) { body.x = maxX; body.vx = -Math.abs(body.vx) * 0.55; }
        if (body.y > maxY) { body.y = maxY; body.vy = -Math.abs(body.vy) * 0.55; }

        at.x = body.x;
        at.y = body.y;
        at.rot = body.rot;
        const el = nodes.current.get(id);
        if (el) {
          el.style.left = `${body.x.toFixed(1)}px`;
          el.style.top = `${body.y.toFixed(1)}px`;
          el.style.transform = `rotate(${body.rot.toFixed(2)}deg) scale(${at.scale})`;
        }

        const speed = Math.hypot(body.vx, body.vy);
        body.sleep = speed < 0.004 ? body.sleep + dt : 0;
        if (!floating && body.sleep > 260) live.delete(id);
      }

      // Soft collisions: things on a desk nudge each other aside, they do not
      // pass through. Only floating bodies bother — a thrown coin crossing a
      // resting die reads fine, a room full of drifting objects does not.
      if (floating && live.size > 1) {
        const list = [...live.entries()];
        for (let i = 0; i < list.length; i += 1) {
          for (let j = i + 1; j < list.length; j += 1) {
            const [ai, a] = list[i];
            const [bi, b] = list[j];
            const pa = placeRef.current.get(ai)!;
            const pb = placeRef.current.get(bi)!;
            const ra = (OBJECT_SPECS[ai].w * pa.scale) / 2;
            const rb = (OBJECT_SPECS[bi].w * pb.scale) / 2;
            const dx = (b.x + rb) - (a.x + ra);
            const dy = (b.y + rb) - (a.y + ra);
            const d = Math.hypot(dx, dy) || 1;
            const overlap = ra * 0.82 + rb * 0.82 - d;
            if (overlap <= 0) continue;
            const nx = dx / d;
            const ny = dy / d;
            const push = overlap * 0.5;
            a.x -= nx * push; a.y -= ny * push;
            b.x += nx * push; b.y += ny * push;
            const relative = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (relative < 0) {
              const impulse = relative * 0.5;
              a.vx += nx * impulse; a.vy += ny * impulse;
              b.vx -= nx * impulse; b.vy -= ny * impulse;
            }
          }
        }
      }
    });
  }, [boardSize.height, boardSize.width, running]);

  // ---- photographs ----------------------------------------------------------
  const addPhoto = useCallback((photo: Photo) => { setPhotos((current) => [...current.slice(-11), photo]); }, []);
  const dropPhoto = useCallback((id: string) => { setPhotos((current) => current.filter((p) => p.id !== id)); }, []);
  const clearPhotos = useCallback(() => setPhotos([]), []);

  // ---- the answer -----------------------------------------------------------
  const fireAnswer = useCallback(() => { setAnswer((n) => n + 1); }, []);

  const hold = useCallback((next: Tool | null) => {
    setTool((current) => (current === next ? null : next));
  }, []);

  const value = useMemo<WorldValue>(() => ({
    objects,
    placeRef,
    nodes,
    register,
    boardRef,
    scale,
    place,
    moveTo,
    bump,
    tool,
    hold,
    paintColor,
    setPaintColor,
    splats,
    addSplat,
    clearSplats,
    paintMode,
    setPaintMode: onPaintMode,
    zeroG,
    setZeroG,
    swallowed,
    swallow,
    absorb,
    restoreWorld,
    photos,
    addPhoto,
    dropPhoto,
    clearPhotos,
    answer,
    fireAnswer,
    passport,
    savePassport: onPassport,
    editing,
    upload,
    wake,
    reduced,
  }), [
    objects, register, boardRef, scale, place, moveTo, bump, tool, hold, paintColor,
    splats, addSplat, clearSplats, paintMode, onPaintMode, zeroG, setZeroG, swallowed,
    swallow, absorb, restoreWorld, photos, addPhoto, dropPhoto, clearPhotos, answer, fireAnswer,
    passport, onPassport, editing, upload, wake, reduced,
  ]);

  return <WorldContext value={value}>{children}</WorldContext>;
}

export { clamp };

function distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
}
