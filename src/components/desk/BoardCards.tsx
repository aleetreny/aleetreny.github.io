import { memo, type CSSProperties, type ReactNode } from 'react';
import type { BoardCard } from '../../lib/board';
import { entriesForGroup, reorderGroupEntries, STICKER_MARKS } from '../../lib/board';
import type { ScrapKind } from '../../lib/board';
import { spotifyTrackEmbedUrl } from '../../lib/spotify-embed';
import type { PortfolioEntry } from '../../types/content';
import { EditableText } from './EditableText';
import { useUiText } from './ui-text-context';

type CardEdit = (cardId: string, patch: Partial<BoardCard>) => void;

type BoardCardViewProps = {
  card: BoardCard;
  entries: PortfolioEntry[];
  /** The list label is owned by the board's list settings, not the card copy. */
  groupLabel?: string;
  editing: boolean;
  onCardEdit: CardEdit;
  onAddEntry: (group: string) => void;
  onDeleteEntry: (entry: PortfolioEntry) => void;
  onReorderEntries: (entries: PortfolioEntry[]) => void;
};

type FieldTag = 'span' | 'div' | 'p';

/** Older boards stored the whole drawer label in `kicker` (for example,
 * "drawer 01 — paid work"). The card now owns only its number; the list name
 * is always read from the drawer it represents. */
export function drawerNumberFromKicker(kicker: string | undefined): string {
  return kicker?.match(/\d+/)?.[0] ?? '';
}

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

function EntryRowControls({
  entry,
  index,
  count,
  onMove,
  onDelete,
}: {
  entry: PortfolioEntry;
  index: number;
  count: number;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
}) {
  const t = useUiText();
  return (
    <span className="row__controls" data-nodrag role="group" aria-label={t('inv.reorderEntry', { title: entry.title })}>
      <button
        type="button"
        disabled={index === 0}
        onClick={() => onMove(-1)}
        aria-label={t('inv.moveEntryUp', { title: entry.title })}
        title={t('inv.moveEntryUp', { title: entry.title })}
      >↑</button>
      <button
        type="button"
        disabled={index === count - 1}
        onClick={() => onMove(1)}
        aria-label={t('inv.moveEntryDown', { title: entry.title })}
        title={t('inv.moveEntryDown', { title: entry.title })}
      >↓</button>
      <button
        className="row__delete"
        type="button"
        onClick={onDelete}
        aria-label={t('card.deleteEntry', { title: entry.title })}
        title={t('card.deleteEntry', { title: entry.title })}
      >×</button>
    </span>
  );
}

function DrawerRows({
  card,
  entries,
  editing,
  onDeleteEntry,
  onReorderEntries,
}: {
  card: BoardCard;
  entries: PortfolioEntry[];
  editing: boolean;
  onDeleteEntry: (entry: PortfolioEntry) => void;
  onReorderEntries: (entries: PortfolioEntry[]) => void;
}) {
  const items = entriesForGroup(entries, card.group ?? '');
  const layout = card.layout ?? 'list';
  const cap = card.maxItems && card.maxItems > 0 ? card.maxItems : items.length;
  const visible = items.slice(0, cap);
  const overflow = items.length - visible.length;
  const groupId = card.group ?? '';
  const controls = (entry: PortfolioEntry, index: number) => editing ? (
    <EntryRowControls
      entry={entry}
      index={index}
      count={items.length}
      onMove={(delta) => {
        const nextIndex = index + delta;
        onReorderEntries(reorderGroupEntries(entries, groupId, index, nextIndex));
      }}
      onDelete={() => onDeleteEntry(entry)}
    />
  ) : null;

  if (layout === 'grid') {
    return (
      <div className="rows rows--grid">
        {visible.map((entry, index) => (
          <div className="row row--stack" data-open={entry.slug} key={entry.id}>
            <span className="row__title" style={{ fontSize: 13.5 }}>{entry.title}</span>
            <span className="row__desc">{firstTag(entry) || metaLine(entry)}</span>
            {controls(entry, index)}
          </div>
        ))}
        {overflow > 0 ? <MoreRow count={overflow} groupId={groupId} /> : null}
      </div>
    );
  }

  if (layout === 'atlas') {
    return (
      <div className="rows">
        {visible.map((entry, index) => (
          <div
            className="row"
            data-open={entry.slug}
            key={entry.id}
            style={{ display: 'grid', gridTemplateColumns: '34px 1fr auto auto', gap: 10, alignItems: 'baseline', padding: '6px 9px' }}
          >
            <span style={{ color: 'var(--c-accent)', fontSize: 11 }}>{typeof entry.metadata.code === 'string' ? entry.metadata.code : '·'}</span>
            <span className="row__title" style={{ fontWeight: 600 }}>{entry.title}</span>
            <span className="row__meta">{typeof entry.metadata.when === 'string' ? entry.metadata.when : ''}</span>
            {controls(entry, index)}
          </div>
        ))}
        {overflow > 0 ? <MoreRow count={overflow} groupId={groupId} /> : null}
      </div>
    );
  }

  if (layout === 'compact' || layout === 'notes') {
    return (
      <div className="rows">
        {visible.map((entry, index) => (
          <div className="row row--stack" data-open={entry.slug} key={entry.id}>
            <span className="row__title" style={{ fontSize: 14 }}>{entry.title}</span>
            <span className="row__desc">{layout === 'notes' ? entry.summary : (metaLine(entry) || firstTag(entry))}</span>
            {controls(entry, index)}
          </div>
        ))}
        {overflow > 0 ? <MoreRow count={overflow} groupId={groupId} /> : null}
      </div>
    );
  }

  // list
  return (
    <div className="rows">
      {visible.map((entry, index) => (
        <div className="row" data-open={entry.slug} key={entry.id}>
          <span className="row__title">{entry.title}</span>
          <span className="row__meta">{metaLine(entry)}</span>
          {controls(entry, index)}
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

/** The compact footer on a spotlight is still owner-authored content. Keep its
 *  small, single-line fields editable without making the card's click target
 *  or drag gesture fire while someone is typing. */
function SpotlightFooter({ card, editing, onCardEdit }: { card: BoardCard; editing: boolean; onCardEdit: CardEdit }) {
  const t = useUiText();
  if (!Array.isArray(card.footer)) return null;

  const setItem = (index: number, value: string) => {
    const next = [...card.footer as string[]];
    next[index] = value;
    onCardEdit(card.id, { footer: next });
  };

  return (
    <div className="spot__foot" {...(editing ? { 'data-nodrag': '' } : {})}>
      {card.footer.map((item, index) => (
        <CardField
          as="span"
          key={index}
          editing={editing}
          value={item}
          placeholder={t('ph.text')}
          multiline={false}
          commit={(value) => setItem(index, value)}
        />
      ))}
    </div>
  );
}

/** The two-column figures on a spotlight are content too. Keep both the value
 *  and its label in place so the owner can correct a number without rebuilding
 *  the card layout. */
function SpotlightGrid({ card, editing, onCardEdit }: { card: BoardCard; editing: boolean; onCardEdit: CardEdit }) {
  const t = useUiText();
  if (!card.grid?.length) return null;

  const setPair = (index: number, part: 0 | 1, value: string) => {
    const next = card.grid!.map((pair) => [...pair] as [string, string]);
    next[index][part] = value;
    onCardEdit(card.id, { grid: next });
  };

  return (
    <div className="dgrid" {...(editing ? { 'data-nodrag': '' } : {})}>
      {card.grid.map((pair, index) => (
        <div key={index}>
          <CardField className="dgrid__v" editing={editing} value={pair[0]} placeholder="0" multiline={false} commit={(value) => setPair(index, 0, value)} />
          <CardField className="dgrid__l" editing={editing} value={pair[1]} placeholder={t('card.statLabel')} multiline={false} commit={(value) => setPair(index, 1, value)} />
        </div>
      ))}
    </div>
  );
}

/** The rows on a sticker: `[code, level, marks]`. The meter is the whole point
 *  of the shape — a level you read before you read anything — so the owner sets
 *  it with a pair of steppers instead of typing a number into prose. */
function StickerRows({ card, editing, onCardEdit }: { card: BoardCard; editing: boolean; onCardEdit: CardEdit }) {
  const t = useUiText();
  const rows = card.langs ?? [];
  if (rows.length === 0 && !editing) return null;

  const write = (next: Array<[string, string, number]>) => onCardEdit(card.id, { langs: next });
  const copy = () => rows.map((row) => [...row] as [string, string, number]);
  const setText = (index: number, part: 0 | 1, value: string) => {
    const next = copy();
    next[index][part] = value;
    write(next);
  };
  const setMarks = (index: number, marks: number) => {
    const next = copy();
    next[index][2] = Math.max(0, Math.min(STICKER_MARKS, marks));
    write(next);
  };

  return (
    <div className="sticker__rows" {...(editing ? { 'data-nodrag': '' } : {})}>
      {rows.map((row, index) => {
        const code = row[0] ?? '';
        const marks = Math.max(0, Math.min(STICKER_MARKS, Math.round(Number(row[2]) || 0)));
        return (
          <div className="sticker__row" key={index}>
            <CardField className="sticker__code" editing={editing} value={code} placeholder={t('card.langCode')} multiline={false} commit={(value) => setText(index, 0, value)} />
            <span className="sticker__meter" role="img" aria-label={t('card.langMeter', { code, marks, of: STICKER_MARKS })}>
              {Array.from({ length: STICKER_MARKS }).map((_, mark) => (
                <span key={mark} className={mark < marks ? 'is-on' : undefined} />
              ))}
            </span>
            <CardField className="sticker__level" editing={editing} value={row[1]} placeholder={t('card.langLevel')} multiline={false} commit={(value) => setText(index, 1, value)} />
            {editing ? (
              <span className="sticker__ctrl">
                <button type="button" onClick={() => setMarks(index, marks - 1)} aria-label={t('card.langDown', { code })} title={t('card.langDown', { code })}>−</button>
                <button type="button" onClick={() => setMarks(index, marks + 1)} aria-label={t('card.langUp', { code })} title={t('card.langUp', { code })}>+</button>
                <button type="button" onClick={() => write(rows.filter((_, rowIndex) => rowIndex !== index))} aria-label={t('card.removeLang', { code })} title={t('card.removeLang', { code })}>×</button>
              </span>
            ) : null}
          </div>
        );
      })}
      {editing ? (
        <button className="sticker__add" type="button" onClick={() => write([...copy(), ['', '', STICKER_MARKS]])}>{t('card.addLang')}</button>
      ) : null}
    </div>
  );
}

/** The drawn marks between the cards. Each one is a single stroke or two in the
 *  accent ink — no words, nothing to open, nothing to translate. They exist so
 *  the eye has somewhere to go between one drawer and the next. */
function ScrapMark({ kind }: { kind: ScrapKind }) {
  const stroke = { fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const paths: Record<ScrapKind, ReactNode> = {
    arrow: <><path d="M6 34 C24 30 40 20 56 10" {...stroke} /><path d="M44 8 L58 9 L54 22" {...stroke} /></>,
    circle: <path d="M32 6 C52 6 60 16 58 24 C56 34 40 40 26 38 C12 36 4 28 8 18 C11 10 22 6 34 7" {...stroke} />,
    underline: <><path d="M4 26 C22 20 44 20 62 24" {...stroke} /><path d="M8 32 C24 28 42 28 58 31" {...stroke} /></>,
    bracket: <path d="M22 4 C10 8 10 18 14 22 C10 26 10 36 22 40" {...stroke} />,
    star: <path d="M32 6 L37 24 L56 24 L41 34 L46 52 L32 41 L18 52 L23 34 L8 24 L27 24 Z" {...stroke} />,
    spiral: <path d="M34 22 C34 16 26 16 26 22 C26 30 38 30 38 20 C38 8 22 8 22 22 C22 38 42 38 42 20" {...stroke} />,
    cross: <><path d="M12 12 L52 40" {...stroke} /><path d="M52 12 L12 40" {...stroke} /></>,
    wave: <path d="M4 26 C12 14 20 38 28 26 C36 14 44 38 52 26 C56 20 60 22 62 26" {...stroke} />,
    tape: <rect className="scrap__tape" x="2" y="14" width="60" height="20" rx="1" />,
    clip: <path d="M40 8 L40 36 C40 44 26 44 26 36 L26 12 C26 6 34 6 34 12 L34 34" {...stroke} />,
    pin: <><circle className="scrap__solid" cx="32" cy="18" r="9" /><path d="M32 27 L32 46" {...stroke} /></>,
    coffee: <><path d="M14 16 L18 38 C19 42 41 42 42 38 L46 16 Z" {...stroke} /><path d="M46 20 C56 18 56 30 46 30" {...stroke} /></>,
    leaf: <><path d="M32 44 C10 34 14 10 40 8 C46 26 44 40 32 44 Z" {...stroke} /><path d="M32 44 C34 32 36 20 40 10" {...stroke} /></>,
    bulb: <><path d="M32 6 C20 6 14 14 18 24 C21 30 24 30 24 38 L40 38 C40 30 43 30 46 24 C50 14 44 6 32 6 Z" {...stroke} /><path d="M25 44 L39 44" {...stroke} /></>,
    die: <><rect x="10" y="10" width="44" height="34" rx="5" {...stroke} /><circle className="scrap__solid" cx="22" cy="22" r="3" /><circle className="scrap__solid" cx="42" cy="32" r="3" /><circle className="scrap__solid" cx="32" cy="27" r="3" /></>,
  };
  return (
    <svg className={`scrap scrap--${kind}`} viewBox="0 0 64 52" role="presentation" aria-hidden="true">
      {paths[kind] ?? paths.star}
    </svg>
  );
}

function Surface({ card, children }: { card: BoardCard; children: ReactNode }) {
  const tone = card.tone ?? 'paper';
  const style: CSSProperties | undefined = tone === 'custom'
    ? { background: card.bg ?? '#fbf7ef', color: card.ink ?? '#17150f' }
    : undefined;
  return <div className={`card__surface card__surface--${tone}`} style={style}>{children}</div>;
}

/** One card.
 *
 *  Memoised, and it matters: the board holds four dozen of these inside a
 *  component that also owns the tour's step counter, the toast, the panels and
 *  the sign-in state. Without this, halting on a stop — or flashing a message,
 *  or opening a panel — re-rendered every card on the slate to change one line
 *  of chrome. Every prop below is either a value or a stable callback, so the
 *  comparison is honest. */
export const BoardCardView = memo(function BoardCardView({ card, entries, groupLabel, editing, onCardEdit, onAddEntry, onDeleteEntry, onReorderEntries }: BoardCardViewProps) {
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

  if (card.type === 'spotify') {
    const embedUrl = spotifyTrackEmbedUrl(card.spotifyUrl);
    return (
      embedUrl ? (
        <iframe
          className="spotify__player"
          src={embedUrl}
          title={card.title || t('card.spotifyTitle')}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          data-nodrag
        />
      ) : editing ? <p className="spotify__empty">{t('card.spotifyPaste')}</p> : null
    );
  }

  if (card.type === 'spotlight') {
    return (
      <Surface card={card}>
        {card.ruled ? <div className="spot--ruled" /> : null}
        <div className="card__head">
          {field('kicker', card.kicker, { as: 'span', className: 'k', placeholder: t('ph.kicker'), multiline: false })}
        </div>
        <div className="spot" data-open={editing ? undefined : card.open}>
          {field('title', card.title, { className: 'spot__title', placeholder: t('ph.title') })}
          {field('blurb', card.blurb, { className: 'spot__blurb', placeholder: t('ph.text') })}
          <SpotlightGrid card={card} editing={editing} onCardEdit={onCardEdit} />
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
          {card.barCaption || editing ? field('barCaption', card.barCaption, { className: 'k', style: { marginTop: 6, opacity: 0.6 }, placeholder: t('ph.text'), multiline: false }) : null}
          <SpotlightFooter card={card} editing={editing} onCardEdit={onCardEdit} />
        </div>
      </Surface>
    );
  }

  // A sticker is the smallest thing on the board: a seal, a couple of level
  // rows and one line underneath. It opens a dossier like a spotlight does,
  // but it is meant to be read without opening anything.
  if (card.type === 'sticker') {
    return (
      <Surface card={card}>
        <div className="sticker" data-open={editing ? undefined : card.open}>
          <span className="sticker__seal" aria-hidden="true">{(card.langs ?? []).length || '·'}</span>
          {field('kicker', card.kicker, { as: 'span', className: 'k', placeholder: t('ph.kicker'), multiline: false })}
          {field('title', card.title, { className: 'sticker__title', placeholder: t('ph.title') })}
          <StickerRows card={card} editing={editing} onCardEdit={onCardEdit} />
          {card.note || editing ? field('note', card.note, { className: 'sticker__note', placeholder: t('ph.text') }) : null}
        </div>
      </Surface>
    );
  }

  // A scrap is a drawn mark, not a card: no surface, no words, nothing to open.
  if (card.type === 'scrap') {
    return <ScrapMark kind={card.kind ?? 'star'} />;
  }

  // A franked square. It opens a dossier the way a spotlight does, but it reads
  // as something stuck in a passport rather than something filed.
  if (card.type === 'stamp') {
    return (
      <div className="stamp" data-open={editing ? undefined : card.open}>
        <div className="stamp__paper">
          <span className="stamp__glyph" aria-hidden="true">
            <CardField as="span" editing={editing} value={card.glyph} placeholder="✦" multiline={false} commit={(value) => onCardEdit(card.id, { glyph: value.slice(0, 3) })} />
          </span>
          {field('title', card.title, { className: 'stamp__title', placeholder: t('ph.title') })}
          {field('denom', card.denom, { as: 'span', className: 'stamp__denom', placeholder: t('card.stampDenom'), multiline: false })}
          <span className="stamp__mark" aria-hidden="true">
            <CardField as="span" editing={editing} value={card.postmark} placeholder={t('card.stampMark')} multiline={false} commit={(value) => onCardEdit(card.id, { postmark: value })} />
          </span>
        </div>
      </div>
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
  const drawerNumber = drawerNumberFromKicker(card.kicker);
  const drawerLabel = groupLabel ?? card.group ?? '';
  return (
    <Surface card={card}>
      {card.sweep ? <div className="sweep" /> : null}
      <div className="card__head">
        <span className="k drawer__kicker">
          <CardField
            as="span"
            className="drawer__number"
            editing={editing}
            value={drawerNumber}
            placeholder="00"
            multiline={false}
            commit={(value) => onCardEdit(card.id, { kicker: value.replace(/\D/g, '') })}
          />
          <span aria-hidden="true"> — </span>
          <span className="drawer__list-name">{drawerLabel}</span>
        </span>
        <span className="k">{count} {count === 1 ? t('card.entryOne') : t('card.entryMany')}</span>
      </div>
      {field('title', card.title, { className: 'card__title', placeholder: t('ph.title') })}
      {card.subtitle || editing ? field('subtitle', card.subtitle, { className: 'card__sub', placeholder: t('ph.text') }) : null}
      {card.intro || editing ? field('intro', card.intro, { className: 'card__intro', placeholder: t('ph.text') }) : null}
      <DrawerRows card={card} entries={entries} editing={editing} onDeleteEntry={onDeleteEntry} onReorderEntries={onReorderEntries} />
      {editing ? (
        <button className="drawer__add" type="button" data-nodrag onClick={() => onAddEntry(card.group ?? '')}>
          {t('card.addEntry')}
        </button>
      ) : null}
      <CardStats card={card} editing={editing} onCardEdit={onCardEdit} />
      <ToolChips card={card} editing={editing} onCardEdit={onCardEdit} />
      {card.footerLink ? (
        <a className="card__footlink" href={card.footerLink[1]} target="_blank" rel="noreferrer" data-nodrag>{card.footerLink[0]}</a>
      ) : null}
    </Surface>
  );
});
