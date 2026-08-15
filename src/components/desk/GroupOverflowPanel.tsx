import { entriesForGroup } from '../../lib/board';
import type { PortfolioEntry } from '../../types/content';
import { useUiText } from './ui-text-context';

type GroupOverflowPanelProps = {
  groupId: string;
  label: string;
  entries: PortfolioEntry[];
  onOpen: (slug: string) => void;
  onClose: () => void;
};

function metaLine(entry: PortfolioEntry): string {
  const when = typeof entry.metadata.when === 'string' ? entry.metadata.when : '';
  const where = typeof entry.metadata.where === 'string' ? entry.metadata.where : '';
  if (where && when) return `${where} · ${when}`;
  return when || where;
}

/** Full list of a drawer's dossiers, opened from its "+N more" row. Picking
 * one here opens the dossier the same way clicking it on the board would. */
export function GroupOverflowPanel({ groupId, label, entries, onOpen, onClose }: GroupOverflowPanelProps) {
  const t = useUiText();
  const items = entriesForGroup(entries, groupId);

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label={t('overflow.aria', { label })}>
        <div className="panel__eyebrow">{label}</div>
        <div className="panel__title">{t('overflow.title', { count: items.length })}</div>
        <div className="rows" style={{ maxHeight: '58vh', overflowY: 'auto' }}>
          {items.map((entry) => (
            <div className="row" key={entry.id} onClick={() => { onOpen(entry.slug); onClose(); }}>
              <span className="row__title">{entry.title}</span>
              <span className="row__meta">{metaLine(entry)}</span>
            </div>
          ))}
        </div>
        <div className="panel__actions">
          <button className="tbtn" type="button" onClick={onClose}>{t('inv.close')}</button>
        </div>
      </div>
    </div>
  );
}
