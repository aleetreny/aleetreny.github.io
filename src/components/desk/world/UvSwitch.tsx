// The switch on the wall, and what it is wired to.
//
// Everything else on this board is a thing that does something when you touch
// it. This is a thing that changes what everything else *is*: throw it and the
// slate goes over to the blacklight, and the board turns out to have been
// staffed the whole time — a crew who keep it standing, who were simply never
// lit in a way that showed them.
//
// The lever is a real one, hinged in three dimensions and thrown rather than
// clicked: take it and drag, or push it, and it goes over centre and snaps. A
// tube like this does not come on cleanly either, so it strikes twice before it
// holds, and it fades rather than cuts when it goes off.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useUiText } from '../ui-text-context';

export function UvSwitch() {
  const t = useUiText();
  const { uv, setUv, reduced } = useWorld();
  const [throwing, setThrowing] = useState(0);
  const leverRef = useRef<HTMLSpanElement | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => { for (const id of timers.current) window.clearTimeout(id); }, []);

  const flip = useCallback((next: boolean) => {
    if (next === uv) return;
    setUv(next);
    if (reduced) return;
    // The strike. Two stutters and then it holds — off is a clean fade, the way
    // a tube actually behaves at each end.
    setThrowing(next ? 1 : 2);
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [window.setTimeout(() => setThrowing(0), next ? 900 : 520)];
  }, [reduced, setUv, uv]);

  /** Throw it. A pointer that travels is a lever being pushed over; a pointer
   *  that does not is a lever being slapped, and both are the same throw. */
  const grab = useCallback((event: React.PointerEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();
    const el = event.currentTarget;
    const box = el.getBoundingClientRect();
    const pivot = box.top + box.height;
    const from = uv;
    let over = from;
    el.setPointerCapture?.(event.pointerId);
    const move = (ev: PointerEvent) => {
      // How far past the pivot the pointer is, as a fraction of the lever.
      const reach = Math.max(18, box.height);
      const past = (ev.clientY - pivot) / reach;
      const next = past > -0.42;
      if (next === over) return;
      over = next;
      el.style.setProperty('--thrown', next ? '1' : '0');
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.releasePointerCapture?.(event.pointerId);
      el.style.removeProperty('--thrown');
      // A lever that never travelled was still thrown: that is what a switch is.
      flip(over === from ? !from : over);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [flip, uv]);

  return (
    <ObjectShell
      id="uvswitch"
      label={t('world.uv.label')}
      hint={uv ? t('world.uv.off') : t('world.uv.on')}
      fixed
    >
      <div className={`uvsw${uv ? ' is-on' : ''}${throwing === 1 ? ' is-striking' : ''}`}>
        {/* The tube, in its cage. */}
        <span className="uvsw__lamp" aria-hidden="true">
          <i className="uvsw__tube" />
          <i className="uvsw__cage" />
          <i className="uvsw__spill" />
        </span>

        {/* The isolator: a cast box, a plate, and a lever that stands off it. */}
        <span className="uvsw__box" aria-hidden="true">
          <i className="uvsw__plate" />
          <i className="uvsw__bolt uvsw__bolt--tl" />
          <i className="uvsw__bolt uvsw__bolt--tr" />
          <i className="uvsw__bolt uvsw__bolt--bl" />
          <i className="uvsw__bolt uvsw__bolt--br" />
          <b className="uvsw__mark uvsw__mark--on">I</b>
          <b className="uvsw__mark uvsw__mark--off">O</b>
          <i className="uvsw__slot" />
          <span
            className="uvsw__lever"
            ref={leverRef}
            data-nodrag
            role="switch"
            aria-checked={uv}
            aria-label={t('world.uv.label')}
            tabIndex={0}
            onPointerDown={grab}
            onKeyDown={(event) => {
              if (event.key !== ' ' && event.key !== 'Enter') return;
              event.preventDefault();
              flip(!uv);
            }}
          >
            <i className="uvsw__shaft" />
            <i className="uvsw__knob" />
          </span>
        </span>

        <span className="uvsw__label" aria-hidden="true">365 nm</span>
      </div>
    </ObjectShell>
  );
}
