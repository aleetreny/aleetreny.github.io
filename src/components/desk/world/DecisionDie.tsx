// A die that picks an actual thing to read, never a vague category.

import { useCallback, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useUiText } from '../ui-text-context';

type EntryChoice = { slug: string; title: string };

export function DecisionDie({ entries, onOpenEntry }: {
  entries: EntryChoice[];
  onOpenEntry: (slug: string) => void;
}) {
  const t = useUiText();
  const { reduced } = useWorld();
  const [face, setFace] = useState(1);
  const [choice, setChoice] = useState<EntryChoice | null>(null);
  const [rolling, setRolling] = useState(false);
  const [settled, setSettled] = useState(false);
  const cubeRef = useRef<HTMLDivElement | null>(null);

  const roll = useCallback(() => {
    if (rolling) return;
    const nextFace = 1 + Math.floor(Math.random() * 6);
    const nextEntry = entries.length ? entries[Math.floor(Math.random() * entries.length)] : null;
    const land = () => {
      setFace(nextFace);
      setChoice(nextEntry);
      setRolling(false);
      setSettled(true);
    };
    const el = cubeRef.current;
    if (!el || reduced) { land(); return; }
    setRolling(true);
    setSettled(false);
    el.animate([
      { transform: 'translate(0,0) rotate(0deg) scale(1)' },
      { transform: 'translate(14px,-44px) rotate(200deg) scale(1.08)', offset: 0.26 },
      { transform: 'translate(24px,-6px) rotate(410deg) scale(.98)', offset: 0.48 },
      { transform: 'translate(30px,-22px) rotate(560deg) scale(1.03)', offset: 0.66 },
      { transform: 'translate(34px,-2px) rotate(700deg) scale(.99)', offset: 0.84 },
      { transform: 'translate(32px,0) rotate(720deg) scale(1)' },
    ], { duration: 1050, easing: 'cubic-bezier(.28,.9,.4,1)', fill: 'none' })
      .addEventListener('finish', land, { once: true });
  }, [entries, reduced, rolling]);

  return (
    <ObjectShell id="die" onActivate={roll} hint={settled ? undefined : t('world.die.hint')} label={t('world.die.label')}>
      <div className="die" ref={cubeRef} data-rolling={rolling || undefined}>
        <span className="die__face">{rolling ? '·' : face}</span>
        <span className="die__pip die__pip--a" />
        <span className="die__pip die__pip--b" />
      </div>
      {settled && choice ? (
        <button className="die__suggest" type="button" data-nodrag onClick={() => onOpenEntry(choice.slug)}>
          {t('world.die.go', { entry: choice.title })}
        </button>
      ) : null}
      {settled && !choice ? <span className="die__suggest die__suggest--none" data-nodrag>{t('world.die.shrug')}</span> : null}
    </ObjectShell>
  );
}
