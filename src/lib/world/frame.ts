// One animation loop for the whole board.
//
// Twenty-odd simulations each calling requestAnimationFrame is twenty-odd
// callbacks the browser schedules separately, and a laptop fan that never stops.
// Everything on this board shares one loop: it starts when the first thing
// needs it and stops dead when the last one lets go, so a board nobody is
// touching costs exactly nothing.

import { useEffect, useRef, useState } from 'react';

type FrameFn = (dt: number, now: number) => void;

const subscribers = new Set<FrameFn>();
let handle = 0;
let last = 0;

function tick(now: number) {
  // Clamped: a tab that was in the background for a minute must not deliver a
  // sixty-second step to a physics integrator.
  const dt = last === 0 ? 16.7 : Math.min(48, now - last);
  last = now;
  for (const fn of [...subscribers]) {
    try {
      fn(dt, now);
    } catch (error) {
      console.error('A board object threw inside the frame loop; dropping it.', error);
      subscribers.delete(fn);
    }
  }
  handle = subscribers.size > 0 ? requestAnimationFrame(tick) : 0;
}

export function addFrame(fn: FrameFn): () => void {
  subscribers.add(fn);
  if (handle === 0) {
    last = 0;
    handle = requestAnimationFrame(tick);
  }
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && handle !== 0) {
      cancelAnimationFrame(handle);
      handle = 0;
    }
  };
}

/** Run `fn` on the shared loop while `active` — and not one frame longer.
 *
 *  The callback is read from a ref, so a component can close over fresh state
 *  every render without the subscription being torn down and rebuilt. */
export function useFrame(fn: FrameFn, active: boolean): void {
  const ref = useRef<FrameFn | null>(null);
  // Written after the commit rather than during the render, so the loop always
  // calls a callback React has finished with.
  useEffect(() => { ref.current = fn; });
  useEffect(() => {
    if (!active) return undefined;
    return addFrame((dt, now) => ref.current?.(dt, now));
  }, [active]);
}

/** True while the visitor has asked their machine for less movement. */
export function reducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** Is this element close enough to the viewport to be worth simulating?
 *
 *  Every heavy object hangs its loop off this, which is what keeps a board with
 *  a dozen canvases on it costing about the same as a board with one. */
export function useOnScreen(ref: React.RefObject<HTMLElement | null>, margin = '220px'): boolean {
  // A browser with no observer has no way to tell us, so everything is on
  // screen as far as it is concerned.
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => { for (const entry of entries) setSeen(entry.isIntersecting); },
      { rootMargin: margin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [margin, ref]);
  return seen;
}

/** Is this object drawn large enough on screen to be worth simulating?
 *
 *  A board fitted to a laptop draws a two-hundred-pixel instrument about
 *  twenty pixels across, and at twenty pixels a fluid, a vibrating plate and a
 *  field of dunes are all the same grey smudge. The heavy instruments hang
 *  their loop off this as well as off `useOnScreen`, so zooming out to look at
 *  the whole desk *stops* a dozen simulations instead of starting them, and
 *  zooming into one starts exactly that one.
 *
 *  Sampled on a slow timer rather than per frame: it is a layout read, and the
 *  answer only changes when the camera does. */
export function useDetail(ref: React.RefObject<HTMLElement | null>, minPx = 96, every = 480): boolean {
  const [big, setBig] = useState(true);
  useEffect(() => {
    const check = () => {
      const el = ref.current;
      if (!el) return;
      setBig(el.getBoundingClientRect().width >= minPx);
    };
    check();
    const timer = window.setInterval(check, every);
    return () => window.clearInterval(timer);
  }, [every, minPx, ref]);
  return big;
}
