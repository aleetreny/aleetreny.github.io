// The thing every object on the table has in common.
//
// A shadow, a weight, the fact that you can pick it up, the fact that paint
// sticks to it. Everything above this line is what the object *is*; everything
// below it is what makes it an object rather than a widget.

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { OBJECT_SPECS, hasTrait, type ObjectKind } from '../../../lib/world/kinds';
import { useWorld } from '../../../lib/world/context';
import { SplatMarks } from './SplatMarks';

type ObjectShellProps = {
  id: ObjectKind;
  children: ReactNode;
  /** A word or two, shown on hover only. Most objects need none: the whole
   *  point is that you find out by touching. */
  hint?: string;
  /** A plain click, once it is clear the visitor was not dragging. */
  onActivate?: () => void;
  className?: string;
  /** Stop the object being picked up — the black hole is bolted down, and a
   *  tool that has been picked up is not on the table any more. */
  fixed?: boolean;
  label?: string;
};

export function ObjectShell({ id, children, hint, onActivate, className = '', fixed = false, label }: ObjectShellProps) {
  const world = useWorld();
  const ref = useRef<HTMLDivElement | null>(null);
  const spec = OBJECT_SPECS[id];
  const { register, place, bump, scale, wake, swallowed } = world;
  const gone = swallowed.includes(id);

  // The starting position is written once, imperatively, exactly like the
  // camera: a physics step is not a render, and React must not fight one.
  useEffect(() => {
    const el = ref.current;
    register(id, el);
    if (!el) return undefined;
    const at = place(id);
    el.style.left = `${at.x}px`;
    el.style.top = `${at.y}px`;
    el.style.transform = `rotate(${at.rot}deg) scale(${at.scale})`;
    return () => register(id, null);
  }, [id, place, register]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const el = ref.current;
    if (!el) return;
    const target = event.target as HTMLElement;
    // Anything with its own job — a button, a canvas that draws, a text box —
    // keeps the pointer. The rest of the object is a handle.
    if (target.closest('[data-nodrag]')) return;
    event.stopPropagation();
    if (fixed || world.tool) return;

    const at = place(id);
    const start = { x: event.clientX, y: event.clientY };
    const from = { x: at.x, y: at.y };
    let moved = false;
    let last = { x: event.clientX, y: event.clientY, t: performance.now() };
    let velocity = { x: 0, y: 0 };
    const k = () => 1 / (scale() || 1);
    bump(el);
    el.setPointerCapture?.(event.pointerId);
    el.classList.add('obj--held');

    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - start.x) * k();
      const dy = (ev.clientY - start.y) * k();
      if (!moved && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 4) moved = true;
      if (!moved) return;
      at.x = from.x + dx;
      at.y = from.y + dy;
      el.style.left = `${at.x}px`;
      el.style.top = `${at.y}px`;
      const now = performance.now();
      const gap = Math.max(1, now - last.t);
      // Board units per millisecond, smoothed — this is what a throw is made of.
      velocity = {
        x: velocity.x * 0.6 + ((ev.clientX - last.x) * k() / gap) * 0.4,
        y: velocity.y * 0.6 + ((ev.clientY - last.y) * k() / gap) * 0.4,
      };
      last = { x: ev.clientX, y: ev.clientY, t: now };
    };

    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.classList.remove('obj--held');
      if (!moved) { onActivate?.(); return; }
      const speed = Math.hypot(velocity.x, velocity.y);
      // Let go of something near the hole, or let go of it hard, and the
      // physics takes over. Put it down gently and it stays put.
      if (hasTrait(id, 'physics') && (speed > 0.05 || nearTheHole(world, id))) {
        wake(id, velocity.x, velocity.y);
      }
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [bump, fixed, id, onActivate, place, scale, wake, world]);

  return (
    <div
      ref={ref}
      className={`obj obj--${id} ${className}`.trim()}
      data-obj={id}
      data-nodrag
      data-object-label={label ?? id}
      style={{ width: spec.w, height: spec.h }}
      onPointerDown={onPointerDown}
      onDoubleClick={(event) => event.stopPropagation()}
      hidden={gone}
      aria-hidden={gone || undefined}
    >
      {children}
      <SplatMarks on={id} />
      {hint ? <span className="obj__hint">{hint}</span> : null}
    </div>
  );
}

/** Is this object already inside the hole's reach? Letting go of something
 *  there should hand it to the hole even if the hand was perfectly still. */
function nearTheHole(world: ReturnType<typeof useWorld>, id: ObjectKind): boolean {
  if (!hasTrait(id, 'blackhole') || world.swallowed.includes('blackhole')) return false;
  const hole = world.placeRef.current.get('blackhole');
  const mine = world.placeRef.current.get(id);
  if (!hole || !mine) return false;
  const hw = (OBJECT_SPECS.blackhole.w * hole.scale) / 2;
  const dx = (hole.x + hw) - (mine.x + (OBJECT_SPECS[id].w * mine.scale) / 2);
  const dy = (hole.y + hw) - (mine.y + (OBJECT_SPECS[id].h * mine.scale) / 2);
  return Math.hypot(dx, dy) < hw * 3.2;
}
