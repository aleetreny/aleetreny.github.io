// One screen of the walk.
//
// Every card type the board can draw gets a phone treatment here. The rule is
// the same one the desktop board follows — a card is a piece of paper with a
// tone, a number and a heading — but the geometry is inverted: instead of a
// card the visitor zooms towards, the sheet fills the screen and the visitor
// scrolls it. Rows become list rows with a real touch target and a chevron,
// because that is the one gesture every phone user already knows.
//
// The sheets reuse `.card__surface--*` from the board stylesheet, so a look
// picked in the theme panel recolours the phone at the same time as the slate,
// with nothing to keep in step.

import type { ReactNode } from 'react';
import { entriesForGroup, STICKER_MARKS, type BoardCard, type TagChip } from '../../lib/board';
import { spotifyTrackEmbedUrl } from '../../lib/spotify-embed';
import type { PortfolioEntry } from '../../types/content';
import type { MobileChapter } from '../../lib/mobile';
import { splitLabel } from '../../lib/mobile';
import { useUiText } from '../desk/ui-text-context';

type ChapterProps = {
  chapter: MobileChapter;
  entries: PortfolioEntry[];
  groupLabel: (id: string | undefined) => string;
  /** True only for the screen on show. A third-party player is mounted on it
   *  alone: two Spotify frames to look at one is two too many. */
  active: boolean;
  onOpen: (slug: string) => void;
  /** Rendered under the last screen: the ways out of the walk. */
  footer?: ReactNode;
};

function tone(card: BoardCard): string {
  return card.tone ?? 'paper';
}

function metaLine(entry: PortfolioEntry): string {
  const when = typeof entry.metadata.when === 'string' ? entry.metadata.when : '';
  const where = typeof entry.metadata.where === 'string' ? entry.metadata.where : '';
  return [where, when].filter(Boolean).join(' · ');
}

function chipLabel(chip: TagChip): { label: string; accent: boolean } {
  return typeof chip === 'string'
    ? { label: chip, accent: false }
    : { label: chip.label, accent: Boolean(chip.accent) };
}

/** The screen's heading already prints the stop number in the accent colour,
 *  so a card whose kicker opens with the same number ("06 — Entrepreneurship")
 *  would say it twice, three times counting the footer. The heading owns the
 *  number; the kicker keeps the words. */
function withoutNumber(kicker: string | undefined, numbered: boolean): string {
  const text = kicker ?? '';
  if (!numbered) return text;
  return text.replace(/^\s*\d{1,2}\s*[—–\-·.]\s*/, '');
}

/** A link's own words, or the host it points at. A contact row that reads
 *  "linkedin.com/in/…" says more on a phone than one that reads "LinkedIn". */
function linkNote(href: string): string {
  if (href.startsWith('mailto:')) return href.slice(7);
  try {
    return new URL(href).host.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function Rows({ entries, onOpen }: { entries: PortfolioEntry[]; onOpen: (slug: string) => void }) {
  if (entries.length === 0) return null;
  return (
    <ul className="m-rows">
      {entries.map((entry) => (
        <li key={entry.id}>
          <button className="m-row" type="button" onClick={() => onOpen(entry.slug)}>
            <span className="m-row__text">
              <span className="m-row__title">{entry.title}</span>
              {metaLine(entry) ? <span className="m-row__meta">{metaLine(entry)}</span> : null}
            </span>
            <span className="m-row__go" aria-hidden="true">›</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Stats({ pairs }: { pairs: Array<[string, string]> }) {
  if (pairs.length === 0) return null;
  return (
    <dl className="m-stats">
      {pairs.map((pair, index) => (
        <div className="m-stat" key={index}>
          <dt>{pair[0]}</dt>
          <dd>{pair[1]}</dd>
        </div>
      ))}
    </dl>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="m-chips">
      {items.map((item, index) => <span key={index}>{item}</span>)}
    </div>
  );
}

/** The one full-width action a screen offers: open the article this card
 *  stands for. A spotlight on the slate is a card you click anywhere on; on a
 *  phone an ambiguous tap target is a tap target nobody trusts. */
function OpenAction({ slug, label, onOpen }: { slug: string; label: string; onOpen: (slug: string) => void }) {
  return (
    <button className="m-open" type="button" onClick={() => onOpen(slug)}>
      <span>{label}</span>
      <span aria-hidden="true">→</span>
    </button>
  );
}

function CardBody({ card, entries, groupLabel, active, numbered, onOpen }: {
  card: BoardCard;
  entries: PortfolioEntry[];
  groupLabel: (id: string | undefined) => string;
  active: boolean;
  /** The screen above this card already prints its number. */
  numbered: boolean;
  onOpen: (slug: string) => void;
}) {
  const t = useUiText();
  const kicker = withoutNumber(card.kicker, numbered);

  if (card.type === 'hero') {
    return (
      <div className="m-hero">
        {kicker ? <span className="m-hero__kicker">{kicker}</span> : null}
        <h1 className="m-hero__name">{card.name}</h1>
        {(card.tags ?? []).length > 0 ? (
          <div className="m-hero__tags">
            {(card.tags ?? []).map((chip, index) => {
              const { label, accent } = chipLabel(chip);
              return <span key={index} className={accent ? 'is-accent' : undefined}>{label}</span>;
            })}
          </div>
        ) : null}
        {card.intro ? <p className="m-hero__intro">{card.intro}</p> : null}
        {card.hint ? <p className="m-hero__hint">{card.hint}</p> : null}
      </div>
    );
  }

  if (card.type === 'spotify') {
    const embed = spotifyTrackEmbedUrl(card.spotifyUrl);
    if (!embed || !active) return null;
    return (
      <div className="m-spotify">
        <span className="k">{t('card.spotifyKicker')}</span>
        <iframe
          src={embed}
          title={card.title || t('card.spotifyTitle')}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      </div>
    );
  }

  if (card.type === 'spotlight') {
    return (
      <div className={`m-sheet card__surface card__surface--${tone(card)}`}>
        {kicker ? <span className="k m-sheet__kicker">{kicker}</span> : null}
        <h2 className="m-sheet__title m-sheet__title--big">{card.title}</h2>
        {card.blurb ? <p className="m-sheet__blurb">{card.blurb}</p> : null}
        <Stats pairs={card.grid ?? []} />
        {card.bars ? (
          <div className="m-bars" aria-hidden="true">
            {[40, 66, 53, 80, 60, 93, 73, 100, 86, 46, 70, 56].map((height, index) => (
              <span key={index} className={height === 100 ? 'is-peak' : undefined} style={{ height: `${height}%` }} />
            ))}
          </div>
        ) : null}
        {card.waveform ? (
          <div className="m-bars m-bars--wave" aria-hidden="true">
            {Array.from({ length: 28 }).map((_, index) => (
              <span key={index} className={index % 6 === 3 ? 'is-peak' : undefined} style={{ height: `${20 + ((index * 37) % 80)}%` }} />
            ))}
          </div>
        ) : null}
        {card.open ? <OpenAction slug={card.open} label={t('mobile.readFile')} onOpen={onOpen} /> : null}
      </div>
    );
  }

  if (card.type === 'sticker') {
    return (
      <div className={`m-sheet card__surface card__surface--${tone(card)}`}>
        {kicker ? <span className="k m-sheet__kicker">{kicker}</span> : null}
        <h2 className="m-sheet__title">{card.title}</h2>
        <ul className="m-levels">
          {(card.langs ?? []).map((row, index) => (
            <li key={index}>
              <span className="m-levels__code">{row[0]}</span>
              <span className="m-levels__label">{row[1]}</span>
              <span className="m-levels__marks" aria-label={t('card.langMeter', { code: row[0], marks: row[2], of: STICKER_MARKS })}>
                {Array.from({ length: STICKER_MARKS }).map((_, mark) => (
                  <i key={mark} className={mark < row[2] ? 'is-on' : undefined} />
                ))}
              </span>
            </li>
          ))}
        </ul>
        {card.note ? <p className="m-sheet__note">{card.note}</p> : null}
        {card.open ? <OpenAction slug={card.open} label={t('mobile.readFile')} onOpen={onOpen} /> : null}
      </div>
    );
  }

  if (card.type === 'contact') {
    return (
      <div className={`m-sheet card__surface card__surface--${tone(card)}`}>
        {kicker ? <span className="k m-sheet__kicker">{kicker}</span> : null}
        <h2 className="m-sheet__title">{card.title}</h2>
        <ul className="m-rows m-rows--links">
          {(card.links ?? []).map((link, index) => (
            <li key={index}>
              <a className="m-row" href={link[1]} target={link[1].startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
                <span className="m-row__text">
                  <span className="m-row__title">{link[0]}</span>
                  {linkNote(link[1]) !== link[0] && linkNote(link[1]) ? <span className="m-row__meta">{linkNote(link[1])}</span> : null}
                </span>
                <span className="m-row__go" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
        {card.note ? <p className="m-sheet__note">{card.note}</p> : null}
        {card.open ? <OpenAction slug={card.open} label={t('mobile.readFile')} onOpen={onOpen} /> : null}
      </div>
    );
  }

  // drawer
  const list = entriesForGroup(entries, card.group ?? '');
  const number = numbered ? '' : card.kicker?.match(/\d+/)?.[0] ?? '';
  return (
    <div className={`m-sheet card__surface card__surface--${tone(card)}`}>
      <div className="m-sheet__head">
        <span className="k">
          {number ? <b>{number}</b> : null}
          {number ? <span aria-hidden="true"> — </span> : null}
          {groupLabel(card.group)}
        </span>
        <span className="k">{list.length} {list.length === 1 ? t('card.entryOne') : t('card.entryMany')}</span>
      </div>
      <h2 className="m-sheet__title">{card.title}</h2>
      {card.subtitle ? <p className="m-sheet__blurb">{card.subtitle}</p> : null}
      {card.intro ? <p className="m-sheet__note">{card.intro}</p> : null}
      <Rows entries={list} onOpen={onOpen} />
      <Stats pairs={card.stats ?? []} />
      <Chips items={card.tech ?? []} />
      {card.footerLink ? (
        <a className="m-sheet__footlink" href={card.footerLink[1]} target="_blank" rel="noreferrer">
          {card.footerLink[0]} <span aria-hidden="true">↗</span>
        </a>
      ) : null}
    </div>
  );
}

export function MobileChapterView({ chapter, entries, groupLabel, active, onOpen, footer }: ChapterProps) {
  const heading = splitLabel(chapter.label);
  // The cover is its own heading: printing "Who I am" above a card that says
  // the name in 46px says it twice.
  const cover = chapter.card.type === 'hero';
  return (
    <div className={`m-page__inner${cover ? ' m-page__inner--open' : ''}`}>
      {heading.text && !cover ? (
        <header className="m-head">
          {heading.number ? <span className="m-head__no">{heading.number}</span> : null}
          <h2 className="m-head__text">{heading.text}</h2>
        </header>
      ) : null}

      <CardBody card={chapter.card} entries={entries} groupLabel={groupLabel} active={active} numbered={Boolean(heading.number)} onOpen={onOpen} />

      {chapter.extras.map((extra) => (
        <CardBody key={extra.id} card={extra} entries={entries} groupLabel={groupLabel} active={active} numbered={Boolean(heading.number)} onOpen={onOpen} />
      ))}

      {footer}
    </div>
  );
}
