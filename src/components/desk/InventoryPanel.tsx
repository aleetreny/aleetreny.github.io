import { useEffect, useState } from 'react';
import type { EntryType, PortfolioEntry, StoredPortfolioEntry, DeletedEntrySummary } from '../../types/content';
import { createEntry, slugify } from '../../lib/editor';
import { entriesForGroup, reorderGroupEntries, type BoardConfig } from '../../lib/board';
import {
  deleteContentEntry,
  listDeletedEntries,
  restoreDeletedContentEntry,
  saveContentEntry,
} from '../../lib/content-repository';
import { useUiText } from './ui-text-context';

type InventoryPanelProps = {
  entries: PortfolioEntry[];
  board: BoardConfig;
  remoteDataEnabled: boolean;
  onClose: () => void;
  onCreated: (entry: StoredPortfolioEntry) => void;
  onDeleted: (id: string) => void;
  onRestored: (entry: StoredPortfolioEntry) => void;
  onMoveEntry: (entry: PortfolioEntry, group: string) => void;
  onReorderEntries: (entries: PortfolioEntry[]) => void;
  onBoardChange: (next: BoardConfig) => void;
  notify: (message: string, isError?: boolean) => void;
};

// Heuristic default entry type for a freshly created dossier, keyed by list
// id. Unrecognised (custom) lists just fall back to 'note'.
const GROUP_TYPE: Record<string, EntryType> = {
  work: 'experience', edu: 'education', lab: 'project', vol: 'experience',
  hack: 'project', repos: 'project', travel: 'note', random: 'note', contact: 'note',
};

export function InventoryPanel({
  entries, board, remoteDataEnabled, onClose, onCreated, onDeleted, onRestored, onMoveEntry, onReorderEntries, onBoardChange, notify,
}: InventoryPanelProps) {
  const t = useUiText();
  const [group, setGroup] = useState<string>(board.groups[0]?.id ?? 'random');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [trash, setTrash] = useState<DeletedEntrySummary[]>([]);
  const [newListName, setNewListName] = useState('');

  useEffect(() => {
    if (!remoteDataEnabled) return;
    listDeletedEntries().then(setTrash).catch(() => setTrash([]));
  }, [remoteDataEnabled]);

  const labelFor = (id: string) => board.groups.find((g) => g.id === id)?.label ?? id;

  async function create() {
    const clean = title.trim();
    if (!clean) { notify(t('inv.needTitle'), true); return; }
    setBusy(true);
    try {
      const base = createEntry(GROUP_TYPE[group] ?? 'note');
      const order = entriesForGroup(entries, group).length;
      const entry: PortfolioEntry = {
        ...base,
        version: 1,
        slug: slugify(clean) || `nota-${base.id.slice(0, 6)}`,
        title: clean,
        summary: '',
        status: 'published',
        publishedAt: new Date().toISOString(),
        metadata: { kicker: labelFor(group), when: '', where: '', group, order },
        blocks: [],
      };
      // Local preview keeps it in session; production persists to Neon.
      const saved = remoteDataEnabled ? await saveContentEntry(entry, 'create from board') : entry;
      onCreated(saved);
      setTitle('');
      notify(t('inv.created'));
    } catch (error) {
      notify(error instanceof Error ? error.message : t('inv.createFailed'), true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: PortfolioEntry) {
    if (!window.confirm(t('inv.confirmTrash', { title: entry.title }))) return;
    try {
      if (remoteDataEnabled) {
        await deleteContentEntry({ id: entry.id, version: entry.version });
        setTrash(await listDeletedEntries());
      }
      onDeleted(entry.id);
      notify(t('inv.trashed'));
    } catch (error) {
      notify(error instanceof Error ? error.message : t('inv.deleteFailed'), true);
    }
  }

  async function restore(item: DeletedEntrySummary) {
    try {
      const restored = await restoreDeletedContentEntry({ id: item.id, version: item.version });
      onRestored(restored);
      setTrash(await listDeletedEntries());
      notify(t('inv.restored'));
    } catch (error) {
      notify(error instanceof Error ? error.message : t('inv.restoreFailed'), true);
    }
  }

  function addList() {
    const label = newListName.trim();
    if (!label) return;
    let id = slugify(label) || `list-${Date.now().toString(36)}`;
    if (board.groups.some((g) => g.id === id)) id = `${id}-${Date.now().toString(36).slice(-4)}`;
    onBoardChange({ ...board, groups: [...board.groups, { id, label }] });
    setNewListName('');
    notify(t('inv.listCreated'));
  }

  function renameList(id: string, label: string) {
    onBoardChange({ ...board, groups: board.groups.map((g) => (g.id === id ? { ...g, label } : g)) });
  }

  function deleteList(id: string) {
    const remaining = board.groups.filter((g) => g.id !== id);
    if (remaining.length === 0) { notify(t('inv.keepOneList'), true); return; }
    const label = labelFor(id);
    const affected = entriesForGroup(entries, id);
    const fallback = remaining.find((g) => g.id === 'random')?.id ?? remaining[0].id;
    if (affected.length > 0) {
      const ok = window.confirm(t('inv.confirmDeleteListWith', { label, count: affected.length, fallback: labelFor(fallback) }));
      if (!ok) return;
      for (const entry of affected) onMoveEntry(entry, fallback);
    } else if (!window.confirm(t('inv.confirmDeleteList', { label }))) {
      return;
    }
    const cards = board.cards.map((c) => (c.type === 'drawer' && c.group === id ? { ...c, group: fallback } : c));
    onBoardChange({ ...board, groups: remaining, cards });
    if (group === id) setGroup(fallback);
    notify(t('inv.listDeleted'));
  }

  function reorder(groupId: string, fromIndex: number, toIndex: number) {
    onReorderEntries(reorderGroupEntries(entries, groupId, fromIndex, toIndex));
  }

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label={t('inv.aria')}>
        <div className="panel__eyebrow">{t('inv.eyebrow')}</div>
        <div className="panel__title">{t('inv.title')}</div>
        <p className="panel__hint">{t('inv.hint')}</p>

        <div className="panel__section">{t('inv.newEntry')}</div>
        <div className="field-row">
          <label htmlFor="inv-group">{t('inv.drawer')}</label>
          <select id="inv-group" value={group} onChange={(event) => setGroup(event.target.value)}>
            {board.groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
        <input
          className="field"
          type="text"
          placeholder={t('inv.titleField')}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !busy) void create(); }}
        />
        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={create} disabled={busy}>{busy ? t('inv.creating') : t('inv.create')}</button>
        </div>

        <div className="panel__section">{t('inv.lists', { count: board.groups.length })}</div>
        <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {board.groups.map((g) => (
            <div key={g.id} className="field-row" style={{ margin: 0 }}>
              <input
                className="field-inline"
                type="text"
                value={g.label}
                onChange={(event) => renameList(g.id, event.target.value)}
              />
              <span className="list-count">{entriesForGroup(entries, g.id).length}</span>
              <button className="editdel" type="button" onClick={() => deleteList(g.id)} aria-label={t('inv.deleteList', { label: g.label })}>×</button>
            </div>
          ))}
        </div>
        <div className="field-row">
          <input
            className="field-inline"
            type="text"
            placeholder={t('inv.newList')}
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') addList(); }}
          />
          <button className="tbtn" type="button" onClick={addList}>{t('inv.addList')}</button>
        </div>

        <div className="panel__section">{t('inv.onBoard', { count: entries.length })}</div>
        <p className="panel__note">{t('inv.orderHint')}</p>
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {board.groups.map((g) => entriesForGroup(entries, g.id).map((entry, index, groupEntries) => (
            <div key={entry.id} className="field-row" style={{ margin: 0 }}>
              <label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{entry.title}</label>
              <span className="entry-order" role="group" aria-label={t('inv.reorderEntry', { title: entry.title })}>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => reorder(g.id, index, index - 1)}
                  aria-label={t('inv.moveEntryUp', { title: entry.title })}
                  title={t('inv.moveEntryUp', { title: entry.title })}
                >↑</button>
                <button
                  type="button"
                  disabled={index === groupEntries.length - 1}
                  onClick={() => reorder(g.id, index, index + 1)}
                  aria-label={t('inv.moveEntryDown', { title: entry.title })}
                  title={t('inv.moveEntryDown', { title: entry.title })}
                >↓</button>
              </span>
              <select
                className="entry-move"
                value={g.id}
                onChange={(event) => onMoveEntry(entry, event.target.value)}
                aria-label={t('inv.moveEntry', { title: entry.title })}
              >
                {board.groups.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <button className="editdel" type="button" onClick={() => remove(entry)} aria-label={t('inv.deleteEntry', { title: entry.title })}>×</button>
            </div>
          )))}
        </div>

        {trash.length > 0 ? (
          <>
            <div className="panel__section">{t('inv.trash', { count: trash.length })}</div>
            <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {trash.map((item) => (
                <div key={item.id} className="field-row" style={{ margin: 0 }}>
                  <label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</label>
                  <button className="tbtn" type="button" onClick={() => restore(item)}>{t('inv.restore')}</button>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="panel__actions">
          <button className="tbtn" type="button" onClick={onClose}>{t('inv.close')}</button>
        </div>
      </div>
    </div>
  );
}
