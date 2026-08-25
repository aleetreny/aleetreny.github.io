// A button under a lid, and the lid says not to.
//
// Five presses, five escalating consequences, none of them announced and none
// of them destructive. The last one takes the gravity away, which is a thing
// the whole board can feel.

import { useCallback, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useUiText } from '../ui-text-context';

export function DoNotPress({ onAlarm, onSpin }: { onAlarm: () => void; onSpin: () => void }) {
  const t = useUiText();
  const { setZeroG, zeroG } = useWorld();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [screw, setScrew] = useState(false);
  const [alarm, setAlarm] = useState(false);

  const press = useCallback(() => {
    const n = count + 1;
    setCount(n);
    // 1: nothing at all, which is the funniest one.
    if (n === 2) { setScrew(true); window.setTimeout(() => setScrew(false), 2400); }
    if (n === 3) onSpin();
    if (n === 4) { setAlarm(true); onAlarm(); window.setTimeout(() => setAlarm(false), 2600); }
    if (n >= 5) { setZeroG(!zeroG); setCount(0); }
  }, [count, onAlarm, onSpin, setZeroG, zeroG]);

  return (
    <ObjectShell id="donotpress" label={t('world.press.label')}>
      <div className={`press${alarm ? ' press--alarm' : ''}`}>
        <div className="press__base mat-metal" />
        <button
          className="press__button"
          type="button"
          data-nodrag
          disabled={!open}
          onClick={press}
          aria-label={t('world.press.aria')}
        >
          <span className="press__cap" />
        </button>
        <div className={`press__lid${open ? ' press__lid--open' : ''}`} data-nodrag onClick={() => setOpen((v) => !v)} role="presentation">
          <span className="press__lidglass" />
        </div>
        <span className="press__plate">DO NOT PRESS</span>
        {screw ? <span className="press__screw" aria-hidden="true">◉</span> : null}
      </div>
    </ObjectShell>
  );
}
