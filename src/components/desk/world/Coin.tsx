// A coin that is not quite fair.
//
// Nobody is told. You flip it, it lands, and a little tally builds up in the
// margin of the coin's own shadow. After a dozen flips a posterior appears; a
// dozen more and the coin has an opinion about itself.
//
// The estimate is a real Beta-Binomial update — Beta(1,1) prior, the posterior
// mean after h heads in n flips is (h+1)/(n+2) — which is exactly why it takes
// a while to accuse the coin of anything.

import { useCallback, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { readLocal, writeLocal } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const KEY = 'board.coin';
/** The bias. It is not 0.5, and it is not so far from it that one flip tells. */
const P_HEADS = 0.62;

type Tally = { heads: number; flips: number };

export function Coin() {
  const t = useUiText();
  const { reduced } = useWorld();
  const [tally, setTally] = useState<Tally>(() => readLocal<Tally>(KEY, { heads: 0, flips: 0 }));
  const [face, setFace] = useState<'heads' | 'tails'>('heads');
  const [spinning, setSpinning] = useState(false);
  const coinRef = useRef<HTMLDivElement | null>(null);

  const flip = useCallback(() => {
    if (spinning) return;
    const heads = Math.random() < P_HEADS;
    const el = coinRef.current;
    const land = () => {
      setFace(heads ? 'heads' : 'tails');
      setSpinning(false);
      setTally((current) => {
        const next = { heads: current.heads + (heads ? 1 : 0), flips: current.flips + 1 };
        writeLocal(KEY, next);
        return next;
      });
    };
    if (!el || reduced) { land(); return; }
    setSpinning(true);
    // Half-turns, so the coin genuinely lands on the face it claims: an even
    // number of half-turns keeps the current face, an odd number swaps it.
    const turns = 6 + Math.floor(Math.random() * 5);
    const swap = (face === 'heads') !== heads;
    const halves = turns * 2 + (swap ? 1 : 0);
    const frames: Keyframe[] = [
      { transform: 'translateY(0) rotateX(0deg) scale(1)' },
      { transform: `translateY(-52px) rotateX(${halves * 90}deg) scale(1.08)`, offset: 0.42 },
      { transform: `translateY(-8px) rotateX(${halves * 160}deg) scale(1.02)`, offset: 0.74 },
      { transform: `translateY(0) rotateX(${halves * 180}deg) scale(1)` },
    ];
    const run = el.animate(frames, { duration: 900, easing: 'cubic-bezier(.3,.05,.35,1)', fill: 'none' });
    run.addEventListener('finish', land, { once: true });
  }, [face, reduced, spinning]);

  const { heads, flips } = tally;
  // Beta(1,1) prior. The mean is where the coin says it stands.
  const posterior = (heads + 1) / (flips + 2);
  // Roughly two posterior standard deviations: enough to know when 0.5 is out.
  const sd = Math.sqrt((posterior * (1 - posterior)) / (flips + 3));
  const suspicious = flips >= 25 && Math.abs(posterior - 0.5) > 2 * sd;

  return (
    <ObjectShell id="coin" onActivate={flip} hint={flips === 0 ? t('world.coin.hint') : undefined} label={t('world.coin.label')}>
      <div className="coin" ref={coinRef} data-face={face}>
        <div className="coin__face coin__face--h">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" className="coin__ring" />
            <circle cx="50" cy="50" r="38" className="coin__ring coin__ring--in" />
            <text x="50" y="60" textAnchor="middle" className="coin__glyph">✦</text>
          </svg>
        </div>
        <div className="coin__face coin__face--t">
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="46" className="coin__ring" />
            <circle cx="50" cy="50" r="38" className="coin__ring coin__ring--in" />
            <text x="50" y="62" textAnchor="middle" className="coin__glyph coin__glyph--t">✕</text>
          </svg>
        </div>
      </div>
      {flips > 0 ? (
        <div className="coin__tally" data-nodrag>
          <span className="coin__count">{heads}/{flips}</span>
          {flips >= 8 ? <span className="coin__p">{t('world.coin.posterior', { p: posterior.toFixed(2) })}</span> : null}
          {suspicious ? <span className="coin__doubt">{t('world.coin.doubt')}</span> : null}
        </div>
      ) : null}
    </ObjectShell>
  );
}
