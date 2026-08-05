import type { ReactNode } from 'react';
import type { BoardCard, TagChip } from '../../lib/board';
import { entriesForGroup } from '../../lib/board';
import type { PortfolioEntry } from '../../types/content';

type CardEdit = (cardId: string, patch: Partial<BoardCard>) => void;

type BoardCardViewProps = {
  card: BoardCard;
  entries: PortfolioEntry[];
  editing: boolean;
  onCardEdit: CardEdit;
};

function editableProps(editing: boolean, commit: (value: string) => void) {
  if (!editing) return {};
  return {
    contentEditable: true,
    suppressContentEditableWarning: true,
    'data-nodrag': '',
    onBlur: (event: { currentTarget: HTMLElement }) => commit((event.currentTarget.textContent ?? '').trim()),
  };
}

function metaLine(entry: PortfolioEntry): string {
  const when = typeof entry.metadata.when === 'string' ? entry.metadata.when : '';
  const where = typeof entry.metadata.where === 'string' ? entry.metadata.where : '';
  if (where && when) return `${where} · ${when}`;
  return when || where;
}

function firstTag(entry: PortfolioEntry): string {
  const tags = entry.metadata.tags;
  return Array.isArray(tags) && typeof tags[0] === 'string' ? (tags[0] as string) : '';
}

function DrawerRows({ card, entries }: { card: BoardCard; entries: PortfolioEntry[] }) {
  const items = entriesForGroup(entries, card.group ?? '');
  const layout = card.layout ?? 'list';

  if (layout === 'grid') {
    return (
      <div className="rows rows--grid">
        {items.map((entry) => (
          <div className="row row--stack" data-open={entry.slug} key={entry.id}>
            <span className="row__title" style={{ fontSize: 13.5 }}>{entry.title}</span>
            <span className="row__desc">{firstTag(entry) || metaLine(entry)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'atlas') {
    return (
      <div className="rows">
        {items.map((entry) => (
          <div
            className="row"
            data-open={entry.slug}
            key={entry.id}
            style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto', gap: 10, alignItems: 'baseline', padding: '6px 9px' }}
          >
            <span style={{ color: 'var(--c-accent)', fontSize: 11 }}>{typeof entry.metadata.code === 'string' ? entry.metadata.code : '·'}</span>
            <span className="row__title" style={{ fontWeight: 600 }}>{entry.title}</span>
            <span className="row__meta">{typeof entry.metadata.when === 'string' ? entry.metadata.when : ''}</span>
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'compact' || layout === 'notes') {
    return (
      <div className="rows">
        {items.map((entry) => (
          <div className="row row--stack" data-open={entry.slug} key={entry.id}>
            <span className="row__title" style={{ fontSize: 14 }}>{entry.title}</span>
            <span className="row__desc">{layout === 'notes' ? entry.summary : (metaLine(entry) || firstTag(entry))}</span>
          </div>
        ))}
      </div>
    );
  }

  // list
  return (
    <div className="rows">
      {items.map((entry) => (
        <div className="row" data-open={entry.slug} key={entry.id}>
          <span className="row__title">{entry.title}</span>
          <span className="row__meta">{metaLine(entry)}</span>
        </div>
      ))}
    </div>
  );
}

function TagChips({ tags }: { tags?: TagChip[] }) {
  if (!tags?.length) return null;
  return (
    <div className="hero__tags">
      {tags.map((tag, index) => {
        const label = typeof tag === 'string' ? tag : tag.label;
        const accent = typeof tag === 'string' ? false : Boolean(tag.accent);
        return <span key={index} className={accent ? 'is-accent' : undefined}>{label}</span>;
      })}
    </div>
  );
}

function Surface({ card, children }: { card: BoardCard; children: ReactNode }) {
  return <div className={`card__surface card__surface--${card.tone ?? 'paper'}`}>{children}</div>;
}

export function BoardCardView({ card, entries, editing, onCardEdit }: BoardCardViewProps) {
  const ed = (patch: (value: string) => Partial<BoardCard>) =>
    editableProps(editing, (value) => onCardEdit(card.id, patch(value)));

  if (card.type === 'hero') {
    return (
      <div style={{ color: 'var(--board-ink, #f0ece1)' }}>
        <div className="hero__eyebrow" {...ed((v) => ({ kicker: v }))}>{card.kicker}</div>
        <h1 className="hero__name" {...ed((v) => ({ name: v }))}>{card.name}</h1>
        <TagChips tags={card.tags} />
        <p className="hero__intro" {...ed((v) => ({ intro: v }))}>{card.intro}</p>
        <p className="hero__hint" {...ed((v) => ({ hint: v }))}>{card.hint}</p>
      </div>
    );
  }

  if (card.type === 'now') {
    return (
      <Surface card={card}>
        <div className="now__label"><span className="now__dot" />{card.label ?? 'currently'}</div>
        <div className="now__cur" data-open={card.current}>
          <div className="now__cur-title" {...ed((v) => ({ currentTitle: v }))}>{card.currentTitle}</div>
          <div className="now__cur-sub" {...ed((v) => ({ currentSub: v }))}>{card.currentSub}</div>
        </div>
        <div className="now__rule" />
        <div className="k" style={{ fontWeight: 600 }}>{card.nextLabel ?? 'next'}</div>
        <div className="now__next" data-open={card.next}>
          <div className="now__next-title" {...ed((v) => ({ nextTitle: v }))}>{card.nextTitle}</div>
          <div className="now__next-sub" {...ed((v) => ({ nextSub: v }))}>{card.nextSub}</div>
        </div>
      </Surface>
    );
  }

  if (card.type === 'spotlight') {
    const count = entriesForGroup(entries, card.group ?? '').length;
    return (
      <Surface card={card}>
        {card.ruled ? <div className="spot--ruled" /> : null}
        <div className="card__head">
          <span className="k" {...ed((v) => ({ kicker: v }))}>{card.kicker}</span>
        </div>
        <div className="spot" data-open={card.open}>
          <div className="spot__title" {...ed((v) => ({ title: v }))}>{card.title}</div>
          <div className="spot__blurb" {...ed((v) => ({ blurb: v }))}>{card.blurb}</div>
          {card.grid ? (
            <div className="dgrid">
              {card.grid.map((pair, index) => (
                <div key={index}><div className="dgrid__v">{pair[0]}</div><div className="dgrid__l">{pair[1]}</div></div>
              ))}
            </div>
          ) : null}
          {card.waveform ? (
            <div className="wave">
              {Array.from({ length: 24 }).map((_, index) => {
                const h = 20 + ((index * 37) % 80);
                const peak = index % 6 === 3;
                return <span key={index} className={peak ? 'is-peak' : undefined} style={{ height: `${h}%` }} />;
              })}
            </div>
          ) : null}
          {card.bars ? (
            <div className="bars">
              {[40, 66, 53, 80, 60, 93, 73, 100, 86, 46, 70, 56].map((h, index) => (
                <span key={index} className={h === 100 ? 'is-peak' : undefined} style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : null}
          {card.barCaption ? <div className="k" style={{ marginTop: 6, opacity: 0.6 }}>{card.barCaption}</div> : null}
          {Array.isArray(card.footer) ? <div className="spot__foot">{card.footer.map((f, i) => <span key={i}>{f}</span>)}</div> : null}
        </div>
        {count > 0 ? null : null}
      </Surface>
    );
  }

  if (card.type === 'contact') {
    return (
      <Surface card={card}>
        <div className="k" {...ed((v) => ({ kicker: v }))}>{card.kicker}</div>
        <div className="card__title" style={{ marginTop: 10 }} {...ed((v) => ({ title: v }))}>{card.title}</div>
        <div className="links">
          {(card.links ?? []).map((link, index) => (
            <a key={index} href={link[1]} target="_blank" rel="noreferrer" data-nodrag>{link[0]}</a>
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 11.5, lineHeight: 1.6, opacity: 0.6 }} {...ed((v) => ({ note: v }))}>{card.note}</div>
      </Surface>
    );
  }

  // drawer
  const count = entriesForGroup(entries, card.group ?? '').length;
  return (
    <Surface card={card}>
      {card.sweep ? <div className="sweep" /> : null}
      <div className="card__head">
        <span className="k" {...ed((v) => ({ kicker: v }))}>{card.kicker}</span>
        <span className="k">{count} {count === 1 ? 'entry' : 'entries'}</span>
      </div>
      <div className="card__title" {...ed((v) => ({ title: v }))}>{card.title}</div>
      {card.subtitle ? <div className="card__sub" {...ed((v) => ({ subtitle: v }))}>{card.subtitle}</div> : null}
      {card.intro ? <div className="card__intro" {...ed((v) => ({ intro: v }))}>{card.intro}</div> : null}
      <DrawerRows card={card} entries={entries} />
      {card.stats ? (
        <div className="statline">
          {card.stats.map((pair, index) => (
            <div key={index}><div className="statline__v">{pair[0]}</div><div className="statline__l">{pair[1]}</div></div>
          ))}
        </div>
      ) : null}
      {card.tech ? (
        <div className="chips">{card.tech.map((t, index) => <span key={index} className="chip">{t}</span>)}</div>
      ) : null}
      {card.footerLink ? (
        <a className="card__footlink" href={card.footerLink[1]} target="_blank" rel="noreferrer" data-nodrag>{card.footerLink[0]}</a>
      ) : null}
    </Surface>
  );
}
