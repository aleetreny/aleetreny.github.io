// A button under a lid, and the lid says not to.
//
// Five presses, five escalating consequences, none of them announced and none
// of them destructive. The first four are local — the button lights, a screw
// works loose, something on the desk spins, the room goes red — and the fifth
// takes the gravity away, which is a thing the whole board can feel.
//
// The escalation is the joke, so every single press has to land: a red button
// that swallows the first two presses in silence is not a mischievous object,
// it is a broken one. The row of lamps under the button is the receipt.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useUiText } from '../ui-text-context';

/** How many presses the escalation runs for before it does the big one. */
const STAGES = 5;

export function DoNotPress({ onAlarm, onSpin }: { onAlarm: () => void; onSpin: () => void }) {
  const t = useUiText();
  const { setZeroG, zeroG } = useWorld();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [screw, setScrew] = useState(false);
  const [alarm, setAlarm] = useState(false);
  const [fired, setFired] = useState(0);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  useEffect(() => () => { for (const id of timers.current) window.clearTimeout(id); }, []);

  const press = useCallback(() => {
    const n = count + 1;
    setCount(n >= STAGES ? 0 : n);
    // A new key each press, so a second press mid-animation restarts the
    // flash instead of being swallowed by the one already running.
    setFired((k) => k + 1);
    if (n === 2) { setScrew(true); later(() => setScrew(false), 2400); }
    if (n === 3) onSpin();
    if (n === 4) { setAlarm(true); onAlarm(); later(() => setAlarm(false), 2600); }
    if (n >= STAGES) {
      setZeroG(!zeroG);
      // And the lid comes back down over it, which is both the reset and the
      // only apology the object ever offers.
      later(() => setOpen(false), 900);
    }
  }, [count, later, onAlarm, onSpin, setZeroG, zeroG]);

  return (
    <ObjectShell
      id="donotpress"
      label={t('world.press.label')}
      onActivate={() => { if (open) press(); else setOpen(true); }}
    >
      <div className={`press${alarm ? ' press--alarm' : ''}${open ? ' press--open' : ''}`}>
        <div className="press__base mat-metal" />
        <span className="press__lights" aria-hidden="true">
          {Array.from({ length: STAGES - 1 }, (_, i) => (
            <i key={i} className={i < count ? 'is-lit' : undefined} />
          ))}
        </span>
        <button
          className="press__button"
          type="button"
          data-nodrag
          disabled={!open}
          onClick={press}
          aria-label={t('world.press.aria')}
        >
          <span className="press__cap" />
          {/* One ring per press, thrown away as soon as it has finished. */}
          {fired > 0 ? <span className="press__ring" key={fired} aria-hidden="true" /> : null}
        </button>
        <div
          className={`press__lid${open ? ' press__lid--open' : ''}`}
          data-nodrag
          onClick={() => setOpen((v) => !v)}
          role="presentation"
        >
          <span className="press__lidglass" />
        </div>
        <span className="press__plate">{t('world.press.plate')}</span>
        {screw ? <span className="press__screw" aria-hidden="true">◉</span> : null}
      </div>
    </ObjectShell>
  );
}
