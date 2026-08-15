import type { CSSProperties, ReactNode } from 'react';
import type { BoardCard } from '../../lib/board';
import { entriesForGroup } from '../../lib/board';
import type { PortfolioEntry } from '../../types/content';
import { EditableText } from './EditableText';
import { useUiText } from './ui-text-context';

type CardEdit = (cardId: string, patch: Partial<BoardCard>) => void;

type BoardCardViewProps = {
  card: BoardCard;
  entries: PortfolioEntry[];
  editing: boolean;
  onCardEdit: CardEdit;
};

type FieldTag = 'span' | 'div' | 'p';

/** One editable card field. It goes through the shared editable so a card
 *  title behaves exactly like article prose: Enter keeps its line break, a
 *  paste arrives as plain text, and an empty field still has something to
 *  click on. */
function CardField({
  as = 'div', className, style, editing, value, placeholder, multiline = true, commit,
}: {
  as?: FieldTag;
  className?: string;
  style?: CSSProperties;
  editing: boolean;
  value: string | undefined;
  placeholder?: string;
  multiline?: boolean;
  commit: (value: string) => void;
}) {
  return (
    <EditableText
      as={as}
      className={className}
      style={style}
      text={value ?? ''}
      placeholder={placeholder}
      editing={editing}
      multiline={multiline}
      onCommit={commit}
    />
  );
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
  const t = useUiText();
  return (
    <div className="row row--more" data-more={groupId}>
      <span className="row__title">{t('card.more', { count })}</span>
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

/** The role badges on the hero used to be the lone chip group without owner
 * controls. Keep each badge editable in place, just like the tool chips. */
function TagChips({ card, editing, onCardEdit }: { card: BoardCard; editing: boolean; onCardEdit: CardEdit }) {
  const t = useUiText();
  const tags = card.tags;
  if (!tags?.length) return null;

  const setTag = (index: number, value: string) => {
    const next = tags.map((tag, tagIndex) => {
      if (tagIndex !== index) return tag;
      return typeof tag === 'string' ? value : { ...tag, label: value };
    });
    onCardEdit(card.id, { tags: next });
  };
  const deleteTag = (index: number) => onCardEdit(card.id, { tags: tags.filter((_, tagIndex) => tagIndex !== index) });
  const addTag = () => onCardEdit(card.id, { tags: [...tags, ''] });

  return (
    <div className="hero__tags" {...(editing ? { 'data-nodrag': '' } : {})}>
      {tags.map((tag, index) => {
        const label = typeof tag === 'string' ? tag : tag.label;
        const accent = typeof tag === 'string' ? false : Boolean(tag.accent);
        return (
          <span key={index} className={accent ? 'is-accent' : undefined}>
            <CardField as="span" editing={editing} value={label} placeholder={t('card.newRole')} multiline={false} commit={(value) => setTag(index, value)} />
            {editing ? <button type="button" className="hero__tag-remove" onClick={() => deleteTag(index)} aria-label={t('card.removeRole', { label })}>×</button> : null}
          </span>
        );
      })}
      {editing ? <button type="button" className="hero__tag-add" onClick={addTag}>{t('card.addRole')}</button> : null}
    </div>
  );
}

/** The "tools" chip row under lab-style drawers — fully editable: add, edit
 * and remove chips, or enable the row on a drawer that doesn't have one yet. */
function ToolChips({ card, editing, onCardEdit }: { card: BoardCard; editing: boolean; onCardEdit: CardEdit }) {
  const t = useUiText();
  const tech = card.tech;
  if (!tech) {
    if (!editing) return null;
    return (
      <button
        className="chips-add"
        type="button"
        data-nodrag
        onClick={() => onCardEdit(card.id, { tech: [''] })}
      >
        {t('card.addToolsRow')}
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
  const addChip = () => onCardEdit(card.id, { tech: [...tech, ''] });

  return (
    <div className="chips" {...(editing ? { 'data-nodrag': '' } : {})}>
      {tech.map((chip, index) => (
        <span className="chip" key={index}>
          <CardField as="span" editing={editing} value={chip} placeholder={t('card.newTool')} multiline={false} commit={(value) => setChip(index, value)} />
          {editing ? <button type="button" className="chip__x" onClick={() => delChip(index)} aria-label={t('card.removeTool')}>×</button> : null}
        </span>
      ))}
      {editing ? <button type="button" className="chip chip--add" onClick={addChip}>{t('card.addTool')}</button> : null}
    </div>
  );
}

/** The large value/label pairs on a drawer are portfolio content, not fixed
 * decoration. Give them the same inline add, edit and remove controls as the
 * other card chips. */
function CardStats({ card, editing, onCardEdit }: { card: BoardCard; editing: boolean; onCardEdit: CardEdit }) {
  const t = useUiText();
  const stats = card.stats;
  if (!stats?.length) {
    return editing ? (
      <button className="statline__add" type="button" data-nodrag onClick={() => onCardEdit(card.id, { stats: [['', '']] })}>{t('card.addStat')}</button>
    ) : null;
  }

  const setPair = (index: number, part: 0 | 1, value: string) => {
    const next = stats.map((pair) => [...pair] as [string, string]);
    next[index][part] = value;
    onCardEdit(card.id, { stats: next });
  };
  const deleteStat = (index: number) => onCardEdit(card.id, { stats: stats.filter((_, statIndex) => statIndex !== index) });
  const addStat = () => onCardEdit(card.id, { stats: [...stats, ['', '']] });

  return (
    <div className="statline" {...(editing ? { 'data-nodrag': '' } : {})}>
      {stats.map((pair, index) => (
        <div className="statline__item" key={index}>
          <CardField className="statline__v" editing={editing} value={pair[0]} placeholder="0" multiline={false} commit={(value) => setPair(index, 0, value)} />
          <CardField className="statline__l" editing={editing} value={pair[1]} placeholder={t('card.statLabel')} multiline={false} commit={(value) => setPair(index, 1, value)} />
          {editing ? <button className="statline__remove" type="button" onClick={() => deleteStat(index)} aria-label={t('card.removeStat', { label: pair[0] })}>×</button> : null}
        </div>
      ))}
      {editing ? <button className="statline__add" type="button" onClick={addStat}>{t('card.addStat')}</button> : null}
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
  const t = useUiText();
  const field = (
    key: keyof BoardCard,
    value: string | undefined,
    options: { as?: FieldTag; className?: string; style?: CSSProperties; placeholder?: string; multiline?: boolean } = {},
  ) => (
    <CardField
      as={options.as}
      className={options.className}
      style={options.style}
      editing={editing}
      value={value}
      placeholder={options.placeholder}
      multiline={options.multiline}
      commit={(next) => onCardEdit(card.id, { [key]: next } as Partial<BoardCard>)}
    />
  );

  if (card.type === 'hero') {
    return (
      <div style={{ color: 'var(--board-ink, #f0ece1)' }}>
        {field('kicker', card.kicker, { className: 'hero__eyebrow', placeholder: t('ph.kicker') })}
        <h1 className="hero__name">
          <EditableText as="span" text={card.name ?? ''} placeholder={t('ph.title')} editing={editing} onCommit={(v) => onCardEdit(card.id, { name: v })} />
        </h1>
        <TagChips card={card} editing={editing} onCardEdit={onCardEdit} />
        {field('intro', card.intro, { as: 'p', className: 'hero__intro', placeholder: t('ph.text') })}
        {field('hint', card.hint, { as: 'p', className: 'hero__hint', placeholder: t('ph.text') })}
      </div>
    );
  }

  if (card.type === 'now') {
    return (
      <Surface card={card}>
        <div className="now__label"><span className="now__dot" />{card.label ?? t('card.currently')}</div>
        <div className="now__cur" data-open={card.current}>
          {field('currentTitle', card.currentTitle, { className: 'now__cur-title', placeholder: t('ph.title') })}
          {field('currentSub', card.currentSub, { className: 'now__cur-sub', placeholder: t('ph.text') })}
        </div>
        <div className="now__rule" />
        <div className="k" style={{ fontWeight: 600 }}>{card.nextLabel ?? t('card.next')}</div>
        <div className="now__next" data-open={card.next}>
          {field('nextTitle', card.nextTitle, { className: 'now__next-title', placeholder: t('ph.title') })}
          {field('nextSub', card.nextSub, { className: 'now__next-sub', placeholder: t('ph.text') })}
        </div>
      </Surface>
    );
  }

  if (card.type === 'spotlight') {
    return (
      <Surface card={card}>
        {card.ruled ? <div className="spot--ruled" /> : null}
        <div className="card__head">
          {field('kicker', card.kicker, { as: 'span', className: 'k', placeholder: t('ph.kicker'), multiline: false })}
        </div>
        <div className="spot" data-open={card.open}>
          {field('title', card.title, { className: 'spot__title', placeholder: t('ph.title') })}
          {field('blurb', card.blurb, { className: 'spot__blurb', placeholder: t('ph.text') })}
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
        {field('kicker', card.kicker, { className: 'k', placeholder: t('ph.kicker'), multiline: false })}
        {field('title', card.title, { className: 'card__title', style: { marginTop: 10 }, placeholder: t('ph.title') })}
        <div className="links">
          {(card.links ?? []).map((link, index) => (
            <a key={index} href={link[1]} target="_blank" rel="noreferrer" data-nodrag>{link[0]}</a>
          ))}
        </div>
        {field('note', card.note, { style: { marginTop: 16, fontSize: 11.5, lineHeight: 1.6, opacity: 0.6 }, placeholder: t('ph.text') })}
      </Surface>
    );
  }

  // drawer
  const count = entriesForGroup(entries, card.group ?? '').length;
  return (
    <Surface card={card}>
      {card.sweep ? <div className="sweep" /> : null}
      <div className="card__head">
        {field('kicker', card.kicker, { as: 'span', className: 'k', placeholder: t('ph.kicker'), multiline: false })}
        <span className="k">{count} {count === 1 ? t('card.entryOne') : t('card.entryMany')}</span>
      </div>
      {field('title', card.title, { className: 'card__title', placeholder: t('ph.title') })}
      {card.subtitle || editing ? field('subtitle', card.subtitle, { className: 'card__sub', placeholder: t('ph.text') }) : null}
      {card.intro || editing ? field('intro', card.intro, { className: 'card__intro', placeholder: t('ph.text') }) : null}
      <DrawerRows card={card} entries={entries} />
      <CardStats card={card} editing={editing} onCardEdit={onCardEdit} />
      <ToolChips card={card} editing={editing} onCardEdit={onCardEdit} />
      {card.footerLink ? (
        <a className="card__footlink" href={card.footerLink[1]} target="_blank" rel="noreferrer" data-nodrag>{card.footerLink[0]}</a>
      ) : null}
    </Surface>
  );
}
