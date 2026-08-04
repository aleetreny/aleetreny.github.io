import type { PortfolioEntry } from '../types/content';

type EntryCardProps = {
  entry: PortfolioEntry;
  showStatus?: boolean;
};

export function EntryCard({ entry, showStatus = false }: EntryCardProps) {
  const topics = Array.isArray(entry.metadata.topics)
    ? entry.metadata.topics.filter((topic): topic is string => typeof topic === 'string')
    : [];

  return (
    <article className="entry-card">
      <div className="entry-card__meta">
        <span>{entry.entryType}</span>
        {showStatus ? <span className={`status status--${entry.status}`}>{entry.status}</span> : null}
      </div>
      <h2>{entry.title}</h2>
      <p>{entry.summary}</p>
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
