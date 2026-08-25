// A letter somebody left on the desk.
//
// Not a badge, not an achievement, not a card with a trophy on it. An envelope
// with a wax seal and a slightly bent corner, and inside it a single sheet
// folded in three, of the sort that arrives when an institution has decided
// something about you.

import { useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useUiText } from '../ui-text-context';

export function Scholarship() {
  const t = useUiText();
  const [open, setOpen] = useState(false);

  return (
    <ObjectShell
      id="scholarship"
      onActivate={() => setOpen((v) => !v)}
      hint={open ? undefined : t('world.letter.hint')}
      label={t('world.letter.label')}
      className={open ? 'obj--letter-open' : ''}
    >
      <div className={`letter${open ? ' letter--open' : ''}`}>
        <div className="letter__env mat-card">
          <span className="letter__flap" aria-hidden="true" />
          <span className="letter__seal" aria-hidden="true">K</span>
          <span className="letter__addr">
            <span>A. TRENY ORTEGA</span>
            <span>MÁLAGA · ES</span>
          </span>
          <span className="letter__frank" aria-hidden="true">✈</span>
        </div>

        {open ? (
          <div className="letter__sheet mat-paper" data-nodrag>
            <span className="letter__clip" aria-hidden="true" />
            <div className="letter__crest" aria-hidden="true">
              <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" /><path d="M20 6l4 9 10 1-7.5 7 2 10-8.5-5-8.5 5 2-10L6 16l10-1z" /></svg>
            </div>
            <h4 className="letter__title">Kareema Excellence Scholarship</h4>
            <p className="letter__amount">€45,000</p>
            <p className="letter__line">MSc Data Science &amp; Machine Learning</p>
            <p className="letter__line letter__line--quiet">University College London · 2026</p>
            <span className="letter__sign" aria-hidden="true">
              <svg viewBox="0 0 120 34"><path d="M4 26c10-18 16 4 22-6s10 10 17-2 11 8 18-4 12 6 20-6 14 4 18-2" /></svg>
            </span>
            <span className="letter__emboss" aria-hidden="true">UCL</span>
          </div>
        ) : null}
      </div>
    </ObjectShell>
  );
}
