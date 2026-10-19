import { useId, useState } from 'react';
import type { BoardCard } from '../../lib/board';
import { useUiText } from './ui-text-context';

/** A small letter, using the same paper, flap and wax seal as Kareema's. */
export function ScholarshipCard({ card }: { card: BoardCard }) {
  const t = useUiText();
  const [open, setOpen] = useState(false);
  const sheetId = useId();
  return (
    <div className={`letter letter--board${card.glyph === 'K' ? ' letter--kareema' : ''}${open ? ' letter--open' : ''}`}>
      <button
        className="letter__env mat-card"
        type="button"
        data-nodrag
        aria-expanded={open}
        aria-controls={open ? sheetId : undefined}
        aria-label={`${card.title} · ${card.label}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="letter__flap" aria-hidden="true" />
        <span className="letter__seal" aria-hidden="true">{card.glyph}</span>
        <span className="letter__addr"><span>{card.title}</span><span>{card.label}</span></span>
      </button>
      {open ? (
        <section className="letter__sheet mat-paper" id={sheetId} aria-label={card.title} data-nodrag>
          <button className="letter__close" type="button" onClick={() => setOpen(false)} aria-label={t('world.letter.close')}>×</button>
          <span className="letter__clip" aria-hidden="true" />
          <div className="letter__crest" aria-hidden="true">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" /><path d="M20 6l4 9 10 1-7.5 7 2 10-8.5-5-8.5 5 2-10L6 16l10-1z" /></svg>
          </div>
          <h4 className="letter__title">{card.title}</h4>
          {card.barCaption ? <p className="letter__amount">{card.barCaption}</p> : null}
          <p className="letter__line">{card.label}</p>
          <p className="letter__line letter__line--quiet">{card.blurb}</p>
          {card.note ? <p className="letter__line letter__line--quiet">{card.note}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
