import { useEffect, useRef, useState } from 'react';
import type { ContentBlock, PortfolioEntry } from '../../types/content';
import { BLOCK_PALETTE, newBlock, propPairList, propString, propStringList, type DossierBlockType } from '../../lib/blocks';
import { ImageSlot } from './ImageSlot';

type DossierPlateProps = {
  entry: PortfolioEntry;
  posLabel: string;
  prevTitle: string;
  nextTitle: string;
  editing: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onChange: (next: PortfolioEntry) => void;
  uploadPhoto: (file: File) => Promise<string>;
};

function readText(event: { currentTarget: HTMLElement }): string {
  return (event.currentTarget.textContent ?? '').trim();
}

function metaString(entry: PortfolioEntry, key: string): string {
  const value = entry.metadata[key];
  return typeof value === 'string' ? value : '';
}

export function DossierPlate({
  entry, posLabel, prevTitle, nextTitle, editing, onClose, onPrev, onNext, onChange, uploadPhoto,
}: DossierPlateProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busyBlock, setBusyBlock] = useState<string | null>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { if (sheetRef.current) sheetRef.current.scrollTop = 0; }, [entry.slug]);

  const blocks = [...entry.blocks].sort((a, b) => a.position - b.position);

  const setMeta = (key: string, value: unknown) => onChange({ ...entry, metadata: { ...entry.metadata, [key]: value } });
  const commitBlocks = (next: ContentBlock[]) => onChange({ ...entry, blocks: next.map((block, index) => ({ ...block, position: index })) });
  const updateBlock = (id: string, props: Record<string, unknown>) =>
    commitBlocks(blocks.map((block) => (block.id === id ? { ...block, props: { ...block.props, ...props } } : block)));
  const removeBlock = (id: string) => commitBlocks(blocks.filter((block) => block.id !== id));
  const moveBlock = (id: string, dir: -1 | 1) => {
    const index = blocks.findIndex((block) => block.id === id);
    const target = index + dir;
    if (index < 0 || target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commitBlocks(next);
  };
  const addBlock = (type: DossierBlockType) => commitBlocks([...blocks, newBlock(type, blocks.length)]);

  async function pickBlockImage(id: string, file: File) {
    setBusyBlock(id);
    try {
      const url = await uploadPhoto(file);
      updateBlock(id, { url });
    } finally {
      setBusyBlock(null);
    }
  }

  function renderBlockBody(block: ContentBlock) {
    const ed = (key: string) => (editing
      ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => updateBlock(block.id, { [key]: readText(e) }) }
      : {});

    switch (block.type) {
      case 'heading':
        return <h3 className="db-heading" {...ed('text')}>{propString(block, 'text')}</h3>;
      case 'callout':
        return <div className="db-callout" {...ed('text')}>{propString(block, 'text')}</div>;
      case 'quote':
        return (
          <blockquote className="db-quote">
            <p {...ed('text')}>{propString(block, 'text')}</p>
            {propString(block, 'cite') || editing ? <cite {...ed('cite')}>{propString(block, 'cite')}</cite> : null}
          </blockquote>
        );
      case 'divider':
        return <hr className="db-divider" />;
      case 'list': {
        const items = propStringList(block, 'items');
        const setItem = (index: number, value: string) => { const next = [...items]; next[index] = value; updateBlock(block.id, { items: next }); };
        return (
          <ul className="db-list">
            {items.map((item, index) => (
              <li key={index}>
                <span {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => setItem(index, readText(e)) } : {})}>{item}</span>
                {editing ? <button className="db-x" type="button" onClick={() => updateBlock(block.id, { items: items.filter((_, i) => i !== index) })} aria-label="Delete">×</button> : null}
              </li>
            ))}
            {editing ? <button className="db-add-item" type="button" onClick={() => updateBlock(block.id, { items: [...items, 'New point'] })}>+ point</button> : null}
          </ul>
        );
      }
      case 'metrics': {
        const items = propPairList(block, 'items');
        const setPair = (index: number, which: 0 | 1, value: string) => { const next = items.map((p) => [...p] as [string, string]); next[index][which] = value; updateBlock(block.id, { items: next }); };
        return (
          <div className="db-metrics">
            {items.map((pair, index) => (
              <div className="db-metric" key={index}>
                <b {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => setPair(index, 0, readText(e)) } : {})}>{pair[0]}</b>
                <span {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => setPair(index, 1, readText(e)) } : {})}>{pair[1]}</span>
                {editing ? <button className="db-x" type="button" onClick={() => updateBlock(block.id, { items: items.filter((_, i) => i !== index) })} aria-label="Delete">×</button> : null}
              </div>
            ))}
            {editing ? <button className="db-add-item" type="button" onClick={() => updateBlock(block.id, { items: [...items, ['0', 'label']] })}>+ number</button> : null}
          </div>
        );
      }
      case 'links': {
        const items = propPairList(block, 'items');
        const setPair = (index: number, which: 0 | 1, value: string) => { const next = items.map((p) => [...p] as [string, string]); next[index][which] = value; updateBlock(block.id, { items: next }); };
        return (
          <div className="db-links">
            {items.map((pair, index) => (editing ? (
              <div className="db-link-edit" key={index}>
                <input className="db-input" value={pair[0]} placeholder="label" onChange={(e) => setPair(index, 0, e.target.value)} data-nodrag />
                <input className="db-input" value={pair[1]} placeholder="https://" onChange={(e) => setPair(index, 1, e.target.value)} data-nodrag />
                <button className="db-x" type="button" onClick={() => updateBlock(block.id, { items: items.filter((_, i) => i !== index) })} aria-label="Delete">×</button>
              </div>
            ) : (
              <a key={index} href={pair[1]} target="_blank" rel="noreferrer" data-nodrag>{pair[0]} →</a>
            )))}
            {editing ? <button className="db-add-item" type="button" onClick={() => updateBlock(block.id, { items: [...items, ['Label', 'https://']] })}>+ link</button> : null}
          </div>
        );
      }
      case 'tags': {
        const items = propStringList(block, 'items');
        const setItem = (index: number, value: string) => { const next = [...items]; next[index] = value; updateBlock(block.id, { items: next }); };
        return (
          <div className="db-tags">
            <span className="db-tags__lbl">filed under</span>
            {items.map((item, index) => (
              <span className="db-tag" key={index}>
                <span {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => setItem(index, readText(e)) } : {})}>{item}</span>
                {editing ? <button className="db-x" type="button" onClick={() => updateBlock(block.id, { items: items.filter((_, i) => i !== index) })} aria-label="Delete">×</button> : null}
              </span>
            ))}
            {editing ? <button className="db-add-item" type="button" onClick={() => updateBlock(block.id, { items: [...items, 'tag'] })}>+ tag</button> : null}
          </div>
        );
      }
      case 'image':
        return (
          <figure className="db-image">
            <div style={{ position: 'relative', width: '100%', height: 280 }}>
              <ImageSlot url={propString(block, 'url') || undefined} alt={propString(block, 'alt')} placeholder={propString(block, 'caption') || 'drop a photo'} editable={editing} busy={busyBlock === block.id} onPick={(file) => pickBlockImage(block.id, file)} />
            </div>
            {propString(block, 'caption') || editing ? <figcaption {...ed('caption')}>{propString(block, 'caption')}</figcaption> : null}
          </figure>
        );
      default:
        return <p className="db-text" {...ed('text')}>{propString(block, 'text')}</p>;
    }
  }

  return (
    <div className="dossier" role="presentation">
      <div className="dossier__scrim" onClick={onClose} />
      <div className="dossier__plate" role="dialog" aria-modal="true" aria-label={entry.title}>
        <div className="dossier__bar">
          <div className="dossier__bar-meta">
            <span className="k" {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => setMeta('kicker', readText(e)) } : {})}>{metaString(entry, 'kicker')}</span>
            <span className="dossier__bar-pos">{posLabel}</span>
          </div>
          <div className="dossier__bar-actions">
            {editing ? <span className="dossier__editflag">editing — click any text</span> : null}
            <button className="pbtn" onClick={onPrev} type="button" aria-label="Previous">←</button>
            <button className="pbtn" onClick={onNext} type="button" aria-label="Next">→</button>
            <button ref={closeRef} className="pbtn pbtn--close" onClick={onClose} type="button">close · esc</button>
          </div>
        </div>

        <div className="dossier__sheet" ref={sheetRef}>
          <div className="dossier__inner">
            <div className="dossier__crumbs">
              <span {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => setMeta('when', readText(e)) } : {})}>{metaString(entry, 'when')}</span>
              <span className="dot">·</span>
              <span {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => setMeta('where', readText(e)) } : {})}>{metaString(entry, 'where')}</span>
            </div>

            <h2 className="dossier__title" {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => onChange({ ...entry, title: readText(e) || entry.title }) } : {})}>{entry.title}</h2>
            <p className="dossier__lede" {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => onChange({ ...entry, summary: readText(e) }) } : {})}>{entry.summary}</p>

            <div className="dossier__body">
              {blocks.map((block, index) => (
                <div className={`db-block db-block--${block.type}`} key={block.id}>
                  {editing ? (
                    <div className="db-block__ctrl" data-nodrag>
                      <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                      <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={index === blocks.length - 1} aria-label="Move down">↓</button>
                      <button type="button" onClick={() => removeBlock(block.id)} aria-label="Delete block">✕</button>
                    </div>
                  ) : null}
                  {renderBlockBody(block)}
                </div>
              ))}
            </div>

            {editing ? (
              <div className="db-palette" data-nodrag>
                <span className="db-palette__lbl">add block</span>
                {BLOCK_PALETTE.map((item) => (
                  <button key={item.type} type="button" className="db-palette__btn" title={item.hint} onClick={() => addBlock(item.type)}>+ {item.label.toLowerCase()}</button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="dossier__foot">
          <span onClick={onPrev}>← {prevTitle}</span>
          <span onClick={onNext} style={{ textAlign: 'right' }}>{nextTitle} →</span>
        </div>
      </div>
    </div>
  );
}
