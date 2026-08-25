// Six faces, one of which is a shrug.
//
// It rolls, it bounces, it stops on a face, and then it suggests — never
// performs — somewhere on the board to go. Being teleported by a die you threw
// for fun is not a feature.

import { useCallback, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useUiText } from '../ui-text-context';

export const DIE_FACES = ['WORK', 'MATH', 'TRAVEL', 'CHAOS', 'PROJECT', '?'] as const;
export type DieFace = (typeof DIE_FACES)[number];

/** Where a face points. `?` points nowhere on purpose. */
const FACE_JUMP: Record<DieFace, string> = {
  WORK: 'work', MATH: 'lab', TRAVEL: 'giving', CHAOS: 'odd', PROJECT: 'code', '?': '',
};

export function DecisionDie({ onJump, onChaos }: { onJump: (name: string) => void; onChaos: () => void }) {
  const t = useUiText();
  const { reduced } = useWorld();
  const [face, setFace] = useState<DieFace>('MATH');
  const [rolling, setRolling] = useState(false);
  const [settled, setSettled] = useState(false);
  const cubeRef = useRef<HTMLDivElement | null>(null);

  const roll = useCallback(() => {
    if (rolling) return;
    const next = DIE_FACES[Math.floor(Math.random() * DIE_FACES.length)];
    const land = () => {
      setFace(next);
      setRolling(false);
      setSettled(true);
      if (next === '?') onChaos();
    };
    const el = cubeRef.current;
    if (!el || reduced) { land(); return; }
    setRolling(true);
    setSettled(false);
    // A throw, a couple of bounces, then it gives up and lies still.
    el.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(1)' },
      { transform: 'translate(14px,-44px) rotate(200deg) scale(1.08)', offset: 0.26 },
      { transform: 'translate(24px,-6px) rotate(410deg) scale(.98)', offset: 0.48 },
      { transform: 'translate(30px,-22px) rotate(560deg) scale(1.03)', offset: 0.66 },
      { transform: 'translate(34px,-2px) rotate(700deg) scale(.99)', offset: 0.84 },
      { transform: 'translate(32px,0) rotate(720deg) scale(1)' },
    ], { duration: 1050, easing: 'cubic-bezier(.28,.9,.4,1)', fill: 'none' })
      .addEventListener('finish', land, { once: true });
  }, [onChaos, reduced, rolling]);

  const jump = FACE_JUMP[face];
  return (
    <ObjectShell id="die" onActivate={roll} hint={t('world.die.hint')} label={t('world.die.label')}>
      <div className="die" ref={cubeRef} data-rolling={rolling || undefined}>
        <span className="die__face">{rolling ? '·' : face}</span>
        <span className="die__pip die__pip--a" />
        <span className="die__pip die__pip--b" />
      </div>
      {settled && jump ? (
        <button className="die__suggest" type="button" data-nodrag onClick={() => onJump(jump)}>
          {t('world.die.go', { face })}
        </button>
      ) : null}
      {settled && !jump ? <span className="die__suggest die__suggest--none" data-nodrag>{t('world.die.shrug')}</span> : null}
    </ObjectShell>
  );
}
