import type { CSSProperties, ReactNode } from 'react';
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

/** The "+N more" row appended when a drawer's item count exceeds its
 * owner-configured cap. Clicking it opens the full-list overflow panel
 * (handled centrally in DeskBoard via the data-more attribute). */
function MoreRow({ count, groupId }: { count: number; groupId: string }) {
  return (
    <div className="row row--more" data-more={groupId}>
      <span className="row__title">+ {count} more</span>
    </div>
  );
}

function DrawerRows({ card, entries }: { card: BoardCard; entries: PortfolioEntry[] }) {
  const items = entriesForGroup(entries, card.group ?? '');
  const layout = card.layout ?? 'list';
  const cap = card.maxItems && card.maxItems > 0 ? card.maxItems : items.length;
  const visible = items.slice(0, cap);
  const overflow = items.length - visible.length;
  const groupId = card.group ?? '';

  if (layout === 'grid') {
    return (
      <div className="rows rows--grid">
        {visible.map((entry) => (
          <div className="row row--stack" data-open={entry.slug} key={entry.id}>
            <span className="row__title" style={{ fontSize: 13.5 }}>{entry.title}</span>
            <span className="row__desc">{firstTag(entry) || metaLine(entry)}</span>
          </div>
        ))}
        {overflow > 0 ? <MoreRow count={overflow} groupId={groupId} /> : null}
      </div>
    );
  }

  if (layout === 'atlas') {
    return (
      <div className="rows">
        {visible.map((entry) => (
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
        {overflow > 0 ? <MoreRow count={overflow} groupId={groupId} /> : null}
      </div>
    );
  }

  if (layout === 'compact' || layout === 'notes') {
    return (
      <div className="rows">
        {visible.map((entry) => (
          <div className="row row--stack" data-open={entry.slug} key={entry.id}>
            <span className="row__title" style={{ fontSize: 14 }}>{entry.title}</span>
            <span className="row__desc">{layout === 'notes' ? entry.summary : (metaLine(entry) || firstTag(entry))}</span>
          </div>
        ))}
        {overflow > 0 ? <MoreRow count={overflow} groupId={groupId} /> : null}
      </div>
    );
  }

  // list
  return (
    <div className="rows">
      {visible.map((entry) => (
        <div className="row" data-open={entry.slug} key={entry.id}>
          <span className="row__title">{entry.title}</span>
          <span className="row__meta">{metaLine(entry)}</span>
        </div>
      ))}
      {overflow > 0 ? <MoreRow count={overflow} groupId={groupId} /> : null}
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

/** The "tools" chip row under lab-style drawers — fully editable: add, edit
 * and remove chips, or enable the row on a drawer that doesn't have one yet. */
function ToolChips({ card, editing, onCardEdit }: { card: BoardCard; editing: boolean; onCardEdit: CardEdit }) {
  const tech = card.tech;
  if (!tech) {
    if (!editing) return null;
    return (
      <button
        className="chips-add"
        type="button"
        data-nodrag
        onClick={() => onCardEdit(card.id, { tech: ['tool'] })}
      >
        + tools row
      </button>
    );
  }
  if (!editing && tech.length === 0) return null;

  const setChip = (index: number, value: string) => {
    const next = [...tech];
    next[index] = value;
    onCardEdit(card.id, { tech: next });
  };
  const delChip = (index: number) => onCardEdit(card.id, { tech: tech.filter((_, i) => i !== index) });
  const addChip = () => onCardEdit(card.id, { tech: [...tech, 'tool'] });

  return (
    <div className="chips" {...(editing ? { 'data-nodrag': '' } : {})}>
      {tech.map((t, index) => (
        <span className="chip" key={index}>
          <span {...editableProps(editing, (value) => setChip(index, value))}>{t}</span>
          {editing ? <button type="button" className="chip__x" onClick={() => delChip(index)} aria-label="Remove tool">×</button> : null}
        </span>
      ))}
      {editing ? <button type="button" className="chip chip--add" onClick={addChip}>+ tech</button> : null}
    </div>
  );
}

function Surface({ card, children }: { card: BoardCard; children: ReactNode }) {
  const tone = card.tone ?? 'paper';
  const style: CSSProperties | undefined = tone === 'custom'
    ? { background: card.bg ?? '#fbf7ef', color: card.ink ?? '#17150f' }
    : undefined;
  return <div className={`card__surface card__surface--${tone}`} style={style}>{children}</div>;
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
      <ToolChips card={card} editing={editing} onCardEdit={onCardEdit} />
      {card.footerLink ? (
        <a className="card__footlink" href={card.footerLink[1]} target="_blank" rel="noreferrer" data-nodrag>{card.footerLink[0]}</a>
      ) : null}
    </Surface>
  );
}
