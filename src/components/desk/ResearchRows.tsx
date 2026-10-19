import type { PortfolioEntry } from '../../types/content';

/** Four work slips inside a folder. The group and its entries remain data. */
export function ResearchRows({ entries, onOpen }: { entries: PortfolioEntry[]; onOpen: (slug: string) => void }) {
  return (
    <div className="research-rows">
      {entries.map((entry, index) => (
        <button
          type="button"
          className="research-row"
          key={entry.id}
          data-nodrag
          onClick={() => onOpen(entry.slug)}
        >
          <span className="research-row__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span className="research-row__body">
            <span className="research-row__kind">{typeof entry.metadata.kicker === 'string' ? entry.metadata.kicker : ''}</span>
            <span className="research-row__title">{entry.title}</span>
          </span>
          <span className="research-row__arrow" aria-hidden="true">↗</span>
        </button>
      ))}
    </div>
  );
}
