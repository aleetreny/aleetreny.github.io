// Three doors, a car and two goats.
//
// The whole of the Monty Hall problem is in the second click, so nothing here
// explains it. You pick a door; the host — who knows where the car is — opens
// one of the other two and it is always a goat; you either keep your door or
// take the other one. Play it a dozen times and the little brass plate under
// the doors quietly makes the case: staying wins a third of the time, and
// switching wins two thirds, because the door you did not pick has been
// carrying the other two thirds all along.
//
// The counter is the argument. There is no paragraph anywhere on this object.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { readLocal, writeLocal } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const KEY = 'board.monty';

type Tally = { stayPlays: number; stayWins: number; switchPlays: number; switchWins: number };
const EMPTY: Tally = { stayPlays: 0, stayWins: 0, switchPlays: 0, switchWins: 0 };

type Phase = 'idle' | 'offer' | 'done';

export function MontyHall() {
  const t = useUiText();
  const { reduced, editing } = useWorld();
  const [prize, setPrize] = useState(() => Math.floor(Math.random() * 3));
  const [pick, setPick] = useState<number | null>(null);
  const [host, setHost] = useState<number | null>(null);
  const [taken, setTaken] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [tally, setTally] = useState<Tally>(() => readLocal<Tally>(KEY, EMPTY));
  const timers = useRef<number[]>([]);

  useEffect(() => () => { for (const id of timers.current) window.clearTimeout(id); }, []);

  const choose = useCallback((door: number) => {
    if (phase !== 'idle') return;
    setPick(door);
    // The host knows, and never opens the car. That single fact is the whole
    // asymmetry: the door left closed is not a fresh coin toss, it is the
    // survivor of a filtered draw.
    const goats = [0, 1, 2].filter((d) => d !== door && d !== prize);
    const opened = goats[Math.floor(Math.random() * goats.length)];
    const reveal = () => { setHost(opened); setPhase('offer'); };
    if (reduced) { reveal(); return; }
    timers.current.push(window.setTimeout(reveal, 420));
  }, [phase, prize, reduced]);

  const settle = useCallback((switching: boolean) => {
    if (phase !== 'offer' || pick === null || host === null) return;
    const other = [0, 1, 2].find((d) => d !== pick && d !== host)!;
    const final = switching ? other : pick;
    setTaken(final);
    setPhase('done');
    setTally((current) => {
      const next: Tally = {
        stayPlays: current.stayPlays + (switching ? 0 : 1),
        stayWins: current.stayWins + (!switching && final === prize ? 1 : 0),
        switchPlays: current.switchPlays + (switching ? 1 : 0),
        switchWins: current.switchWins + (switching && final === prize ? 1 : 0),
      };
      writeLocal(KEY, next);
      return next;
    });
  }, [host, phase, pick, prize]);

  const again = useCallback(() => {
    setPrize(Math.floor(Math.random() * 3));
    setPick(null);
    setHost(null);
    setTaken(null);
    setPhase('idle');
  }, []);

  const open = (door: number) => phase === 'done' || door === host;
  const won = phase === 'done' && taken === prize;
  const rate = (wins: number, plays: number) => (plays === 0 ? '—' : `${Math.round((wins / plays) * 100)}%`);
  const stayShare = tally.stayPlays > 0 ? tally.stayWins / tally.stayPlays : 0;
  const switchShare = tally.switchPlays > 0 ? tally.switchWins / tally.switchPlays : 0;

  return (
    <ObjectShell
      id="montyhall"
      label={t('world.monty.label')}
      hint={phase === 'idle' && pick === null ? t('world.monty.hint') : undefined}
      onActivate={phase === 'done' ? again : undefined}
    >
      <div className={`monty${phase === 'done' ? (won ? ' monty--won' : ' monty--lost') : ''}`}>
        <div className="monty__cab mat-dark">
          <span className="monty__valance" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => <i key={i} />)}
          </span>

          <div className="monty__doors" data-nodrag>
            {[0, 1, 2].map((door) => (
              <button
                key={door}
                type="button"
                className={[
                  'monty__door',
                  open(door) ? 'is-open' : '',
                  pick === door ? 'is-picked' : '',
                  taken === door ? 'is-taken' : '',
                ].join(' ').trim()}
                onClick={() => (phase === 'idle' ? choose(door) : phase === 'done' ? again() : undefined)}
                aria-label={t('world.monty.door', { n: door + 1 })}
              >
                <span className="monty__room">{door === prize ? <Car /> : <Goat />}</span>
                <span className="monty__leaf">
                  <span className="monty__no">{door + 1}</span>
                  <span className="monty__knob" />
                </span>
              </button>
            ))}
          </div>

          <div className="monty__bar" data-nodrag>
            {phase === 'offer' ? (
              <>
                <button type="button" className="monty__lever" onClick={() => settle(false)}>{t('world.monty.stay')}</button>
                <button type="button" className="monty__lever monty__lever--go" onClick={() => settle(true)}>{t('world.monty.switch')}</button>
              </>
            ) : (
              <span className="monty__score">
                <i className="monty__scale" aria-hidden="true">
                  <b style={{ height: `${Math.round(stayShare * 100)}%` }} />
                  <b className="is-switch" style={{ height: `${Math.round(switchShare * 100)}%` }} />
                </i>
                <em>{t('world.monty.stay')} {tally.stayWins}/{tally.stayPlays} · {rate(tally.stayWins, tally.stayPlays)}</em>
                <em>{t('world.monty.switch')} {tally.switchWins}/{tally.switchPlays} · {rate(tally.switchWins, tally.switchPlays)}</em>
              </span>
            )}
          </div>
        </div>

        {editing ? (
          <button
            className="monty__wipe"
            type="button"
            data-nodrag
            onClick={() => { setTally(EMPTY); writeLocal(KEY, EMPTY); }}
          >{t('world.monty.reset')}</button>
        ) : null}
      </div>
    </ObjectShell>
  );
}

function Goat() {
  return (
    <svg viewBox="0 0 40 34" aria-hidden="true" className="monty__beast">
      <path d="M8 26c-1-6 1-10 6-11l9-1 5-4 3 1-1 5 4 3-2 3-4 1-2 6" fill="#b9b2a4" />
      <path d="M27 10c2-3 5-4 7-2-2 1-3 3-3 5z" fill="#8d867a" />
      <path d="M11 24l1 7M17 24l1 7M23 23l1 8" stroke="#8d867a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="31" cy="12" r="1" fill="#2b2721" />
      <path d="M8 22c-3 2-4 5-2 7" stroke="#b9b2a4" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Car() {
  return (
    <svg viewBox="0 0 40 34" aria-hidden="true" className="monty__beast monty__beast--car">
      <path d="M4 22l3-7c1-2 2-3 4-3h14c2 0 3 1 4 2l5 6 2 1v4H4z" fill="#e2b44a" />
      <path d="M11 13h6v5h-9zM19 13h6l4 5H19z" fill="#2a3742" opacity=".8" />
      <circle cx="12" cy="26" r="4" fill="#22262a" /><circle cx="12" cy="26" r="1.6" fill="#7c8288" />
      <circle cx="28" cy="26" r="4" fill="#22262a" /><circle cx="28" cy="26" r="1.6" fill="#7c8288" />
    </svg>
  );
}
