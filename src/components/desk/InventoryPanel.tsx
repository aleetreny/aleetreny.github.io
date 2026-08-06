import { useEffect, useState } from 'react';
import type { EntryType, PortfolioEntry, DeletedEntrySummary } from '../../types/content';
import { createEntry, slugify } from '../../lib/editor';
import { entriesForGroup, type BoardConfig } from '../../lib/board';
import {
  deleteContentEntry,
  listDeletedEntries,
  restoreDeletedContentEntry,
  saveContentEntry,
} from '../../lib/content-repository';

type InventoryPanelProps = {
  entries: PortfolioEntry[];
  board: BoardConfig;
  remoteDataEnabled: boolean;
  onClose: () => void;
  onCreated: (entry: PortfolioEntry) => void;
  onDeleted: (id: string) => void;
  onRestored: (entry: PortfolioEntry) => void;
  onMoveEntry: (entry: PortfolioEntry, group: string) => void;
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
  entries, board, remoteDataEnabled, onClose, onCreated, onDeleted, onRestored, onMoveEntry, onBoardChange, notify,
}: InventoryPanelProps) {
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
    if (!clean) { notify('Escribe un título primero.', true); return; }
    setBusy(true);
    try {
      const base = createEntry(GROUP_TYPE[group] ?? 'note');
      const order = entriesForGroup(entries, group).length;
      const entry: PortfolioEntry = {
        ...base,
        version: 1,
        slug: slugify(clean) || `nota-${base.id.slice(0, 6)}`,
        title: clean,
        summary: 'Click to write the opening line.',
        status: 'published',
        publishedAt: new Date().toISOString(),
        metadata: { kicker: labelFor(group), when: '', where: '', group, order },
        blocks: [],
      };
      // Local preview keeps it in session; production persists to Neon.
      const saved = remoteDataEnabled ? await saveContentEntry(entry, 'create from board') : entry;
      onCreated(saved);
      setTitle('');
      notify('Dossier creado.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo crear.', true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry: PortfolioEntry) {
    if (!window.confirm(`¿Enviar "${entry.title}" a la papelera?`)) return;
    try {
      if (remoteDataEnabled) {
        await deleteContentEntry({ id: entry.id, version: entry.version });
        setTrash(await listDeletedEntries());
      }
      onDeleted(entry.id);
      notify('Movido a la papelera.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo borrar.', true);
    }
  }

  async function restore(item: DeletedEntrySummary) {
    try {
      const restored = await restoreDeletedContentEntry({ id: item.id, version: item.version });
      onRestored(restored);
      setTrash(await listDeletedEntries());
      notify('Restaurado.');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo restaurar.', true);
    }
  }

  function addList() {
    const label = newListName.trim();
    if (!label) return;
    let id = slugify(label) || `list-${Date.now().toString(36)}`;
    if (board.groups.some((g) => g.id === id)) id = `${id}-${Date.now().toString(36).slice(-4)}`;
    onBoardChange({ ...board, groups: [...board.groups, { id, label }] });
    setNewListName('');
    notify('Lista creada.');
  }

  function renameList(id: string, label: string) {
    onBoardChange({ ...board, groups: board.groups.map((g) => (g.id === id ? { ...g, label } : g)) });
  }

  function deleteList(id: string) {
    const remaining = board.groups.filter((g) => g.id !== id);
    if (remaining.length === 0) { notify('Debe quedar al menos una lista.', true); return; }
    const label = labelFor(id);
    const affected = entriesForGroup(entries, id);
    const fallback = remaining.find((g) => g.id === 'random')?.id ?? remaining[0].id;
    if (affected.length > 0) {
      const ok = window.confirm(`"${label}" tiene ${affected.length} dossier(s); se moverán a "${labelFor(fallback)}". ¿Borrar la lista?`);
      if (!ok) return;
      for (const entry of affected) onMoveEntry(entry, fallback);
    } else if (!window.confirm(`¿Borrar la lista "${label}"?`)) {
      return;
    }
    const cards = board.cards.map((c) => (c.type === 'drawer' && c.group === id ? { ...c, group: fallback } : c));
    onBoardChange({ ...board, groups: remaining, cards });
    if (group === id) setGroup(fallback);
    notify('Lista borrada.');
  }

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label="Gestionar dossiers">
        <div className="panel__eyebrow">inventory</div>
        <div className="panel__title">Manage dossiers</div>
        <p className="panel__hint">Add a new card to any drawer, or send one to the recoverable trash. Edit its text and photos inline on the board.</p>

        <div className="panel__section">new dossier</div>
        <div className="field-row">
          <label htmlFor="inv-group">Drawer</label>
          <select id="inv-group" value={group} onChange={(event) => setGroup(event.target.value)}>
            {board.groups.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>
        <input className="field" type="text" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={create} disabled={busy}>{busy ? 'creating…' : '+ create'}</button>
        </div>

        <div className="panel__section">lists · {board.groups.length}</div>
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
              <button className="editdel" type="button" onClick={() => deleteList(g.id)} aria-label={`Borrar lista ${g.label}`}>×</button>
            </div>
          ))}
        </div>
        <div className="field-row">
          <input
            className="field-inline"
            type="text"
            placeholder="New list name"
            value={newListName}
            onChange={(event) => setNewListName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') addList(); }}
          />
          <button className="tbtn" type="button" onClick={addList}>+ add</button>
        </div>

        <div className="panel__section">on the board · {entries.length}</div>
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {board.groups.map((g) => entriesForGroup(entries, g.id).map((entry) => (
            <div key={entry.id} className="field-row" style={{ margin: 0 }}>
              <label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{entry.title}</label>
              <select
                className="entry-move"
                value={g.id}
                onChange={(event) => onMoveEntry(entry, event.target.value)}
                aria-label={`Mover ${entry.title} a otra lista`}
              >
                {board.groups.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
              <button className="editdel" type="button" onClick={() => remove(entry)} aria-label={`Borrar ${entry.title}`}>×</button>
            </div>
          )))}
        </div>

        {trash.length > 0 ? (
          <>
            <div className="panel__section">trash · {trash.length}</div>
            <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {trash.map((item) => (
                <div key={item.id} className="field-row" style={{ margin: 0 }}>
                  <label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</label>
                  <button className="tbtn" type="button" onClick={() => restore(item)}>restore</button>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="panel__actions">
          <button className="tbtn" type="button" onClick={onClose}>close</button>
        </div>
      </div>
    </div>
  );
}
