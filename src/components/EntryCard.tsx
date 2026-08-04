import type { PortfolioEntry } from '../types/content';
import { ContentBlocks } from './ContentBlocks';

type EntryCardProps = {
  entry: PortfolioEntry;
  showStatus?: boolean;
};

export function EntryCard({ entry, showStatus = false }: EntryCardProps) {
  const topics = Array.isArray(entry.metadata.topics)
    ? entry.metadata.topics.filter((topic): topic is string => typeof topic === 'string')
    : [];
  const organization = typeof entry.metadata.organization === 'string' ? entry.metadata.organization : '';
  const period = typeof entry.metadata.period === 'string' ? entry.metadata.period : '';

  return (
    <article className="entry-card">
      <div className="entry-card__meta">
        <span>{organization || entry.entryType}</span>
        {showStatus ? <span className={`status status--${entry.status}`}>{entry.status}</span> : null}
      </div>
      <h2>{entry.title}</h2>
      {period ? <p className="entry-card__period">{period}</p> : null}
      <p>{entry.summary}</p>
      <ContentBlocks blocks={entry.blocks} />
      {topics.length > 0 ? (
        <ul className="tag-list" aria-label="Temas">
          {topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
