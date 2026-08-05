import { useEffect, useState } from 'react';
import type { EntryType, PortfolioEntry, DeletedEntrySummary } from '../../types/content';
import { createEntry, slugify } from '../../lib/editor';
import { GROUP_SEQUENCE, entriesForGroup } from '../../lib/board';
import {
  deleteContentEntry,
  listDeletedEntries,
  restoreDeletedContentEntry,
  saveContentEntry,
} from '../../lib/content-repository';

type InventoryPanelProps = {
  entries: PortfolioEntry[];
  onClose: () => void;
  onCreated: (entry: PortfolioEntry) => void;
  onDeleted: (id: string) => void;
  onRestored: (entry: PortfolioEntry) => void;
  notify: (message: string, isError?: boolean) => void;
};

const GROUP_TYPE: Record<string, EntryType> = {
  work: 'experience', edu: 'education', lab: 'project', vol: 'experience',
  hack: 'project', repos: 'project', travel: 'note', random: 'note', contact: 'note',
};

const GROUP_LABEL: Record<string, string> = {
  work: 'Paid work', edu: 'Schooling', lab: 'Lab bench', vol: 'Unpaid',
  hack: 'Hackathons & prizes', repos: 'The workshop', travel: 'Field log',
  random: 'The drawer', contact: 'Reachable',
};

export function InventoryPanel({ entries, onClose, onCreated, onDeleted, onRestored, notify }: InventoryPanelProps) {
  const [group, setGroup] = useState<string>('random');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [trash, setTrash] = useState<DeletedEntrySummary[]>([]);

  useEffect(() => {
    listDeletedEntries().then(setTrash).catch(() => setTrash([]));
  }, []);

  async function create() {
    const clean = title.trim();
    if (!clean) { notify('Escribe un título primero.', true); return; }
    setBusy(true);
    try {
      const base = createEntry(GROUP_TYPE[group] ?? 'note');
      const order = entriesForGroup(entries, group).length;
      const entry: PortfolioEntry = {
        ...base,
        slug: slugify(clean) || `nota-${base.id.slice(0, 6)}`,
        title: clean,
        summary: 'Click to write the opening line.',
        status: 'published',
        publishedAt: new Date().toISOString(),
        metadata: { kicker: GROUP_LABEL[group] ?? '', when: '', where: '', group, order, stats: [], tags: [], links: [], photos: 0 },
        blocks: [],
      };
      const saved = await saveContentEntry(entry, 'create from board');
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
      await deleteContentEntry({ id: entry.id, version: entry.version });
      onDeleted(entry.id);
      setTrash(await listDeletedEntries());
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
            {GROUP_SEQUENCE.filter((g) => g !== 'contact').map((g) => (
              <option key={g} value={g}>{GROUP_LABEL[g] ?? g}</option>
            ))}
          </select>
        </div>
        <input className="field" type="text" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={create} disabled={busy}>{busy ? 'creating…' : '+ create'}</button>
        </div>

        <div className="panel__section">on the board · {entries.length}</div>
        <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {GROUP_SEQUENCE.map((g) => entriesForGroup(entries, g).map((entry) => (
            <div key={entry.id} className="field-row" style={{ margin: 0 }}>
              <label style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ opacity: 0.5 }}>{g}</span> · {entry.title}
              </label>
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
