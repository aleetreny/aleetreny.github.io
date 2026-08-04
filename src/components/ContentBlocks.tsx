import type { ContentBlock } from '../types/content';

function stringProp(block: ContentBlock, key: string): string {
  return typeof block.props[key] === 'string' ? block.props[key] : '';
}

export function ContentBlocks({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="content-blocks">
      {blocks.map((block) => {
        const className = `content-block content-block--${block.type} content-block--${String(block.layout.width ?? 'wide')}`;
        if (block.type === 'heading') {
          return <h3 className={className} key={block.id}>{stringProp(block, 'text')}</h3>;
        }
        if (block.type === 'list') {
          const items = Array.isArray(block.props.items)
            ? block.props.items.filter((item): item is string => typeof item === 'string' && item.length > 0)
            : [];
          return (
            <ul className={className} key={block.id}>
              {items.map((item, index) => <li key={`${block.id}-${index}`}>{item}</li>)}
            </ul>
          );
        }
        if (block.type === 'metric') {
          return (
            <div className={className} key={block.id}>
              <strong>{stringProp(block, 'value')}</strong>
              <span>{stringProp(block, 'label')}</span>
            </div>
          );
        }
        if (block.type === 'quote') {
          return (
            <blockquote className={className} key={block.id}>
              <p>{stringProp(block, 'text')}</p>
              {stringProp(block, 'attribution') ? <cite>{stringProp(block, 'attribution')}</cite> : null}
            </blockquote>
          );
        }
        if (block.type === 'image') {
          const url = stringProp(block, 'url');
          return url ? (
            <figure className={className} key={block.id}>
              <img alt={stringProp(block, 'alt')} loading="lazy" src={url} />
            </figure>
          ) : null;
        }
        return <p className={className} key={block.id}>{stringProp(block, 'text')}</p>;
      })}
    </div>
  );
}
