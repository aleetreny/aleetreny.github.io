// One decision, taken once, by everybody separately.
//
// Two levers under a small brass plate. You cannot see what anyone else did
// until you have done yours — which is the only thing that makes the number
// afterwards worth looking at.

import { useCallback, useEffect, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { castVote, myVote, voteTally, type VoteChoice, type VoteTally } from '../../../lib/world/remote';
import { useUiText } from '../ui-text-context';

export function Dilemma() {
  const t = useUiText();
  const [choice, setChoice] = useState<VoteChoice | null>(() => myVote());
  const [tally, setTally] = useState<VoteTally | null>(null);
  const [pulled, setPulled] = useState<VoteChoice | null>(null);

  useEffect(() => {
    if (!choice) return;
    void voteTally().then(setTally).catch(() => undefined);
  }, [choice]);

  const pull = useCallback((next: VoteChoice) => {
    if (choice) return;
    setPulled(next);
    window.setTimeout(() => {
      setChoice(next);
      void castVote(next).then(setTally).catch(() => undefined);
    }, 520);
  }, [choice]);

  const total = tally ? tally.cooperate + tally.betray : 0;
  const share = total > 0 && tally ? Math.round((tally.cooperate / total) * 100) : 0;

  return (
    <ObjectShell id="dilemma" label={t('world.vote.label')}>
      <div className="vote mat-dark">
        <span className="vote__plate">{t('world.vote.plate')}</span>
        {!choice ? (
          <div className="vote__levers" data-nodrag>
            {(['cooperate', 'betray'] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={`vote__lever vote__lever--${option}${pulled === option ? ' is-pulled' : ''}`}
                onClick={() => pull(option)}
              >
                <span className="vote__stem" />
                <span className="vote__knob" />
                <span className="vote__word">{option === 'cooperate' ? 'COOPERATE' : 'BETRAY'}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="vote__result" data-nodrag>
            <span className="vote__yours">{t('world.vote.yours', { choice: choice === 'cooperate' ? 'COOPERATE' : 'BETRAY' })}</span>
            <span className="vote__bar" aria-hidden="true">
              <i className="vote__fill" style={{ width: `${share}%` }} />
            </span>
            <span className="vote__nums">
              <b>{share}%</b> {t('world.vote.cooperated')}
              <em>{total} {t('world.vote.decisions')}</em>
            </span>
          </div>
        )}
      </div>
    </ObjectShell>
  );
}
