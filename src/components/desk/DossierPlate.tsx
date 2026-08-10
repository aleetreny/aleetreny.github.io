import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import type { ContentBlock, PortfolioEntry } from '../../types/content';
import { BLOCK_PALETTE, newBlock, propPairList, propString, propStringList, reorderById, type DossierBlockType } from '../../lib/blocks';
import type { DossierConfig } from '../../lib/board';
import { linksForLanguage, setLinksForLanguage, type TextLink } from '../../lib/rich-text';
import { ImageSlot } from './ImageSlot';
import { RichText } from './RichText';

type DossierPlateProps = {
  entry: PortfolioEntry;
  articles: PortfolioEntry[];
  activeLanguage: string;
  posLabel: string;
  prevTitle: string;
  nextTitle: string;
  editing: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenArticle: (slug: string) => void;
  onChange: (next: PortfolioEntry) => void;
  uploadPhoto: (file: File) => Promise<string>;
  /** Article design: measure, title, lede, drop cap, numbering, entrance. */
  dossier: DossierConfig;
};

function readText(event: { currentTarget: HTMLElement }): string {
  return (event.currentTarget.textContent ?? '').trim();
}

function metaString(entry: PortfolioEntry, key: string): string {
  const value = entry.metadata[key];
  return typeof value === 'string' ? value : '';
}

type BlockAlign = 'start' | 'center' | 'end';
type BlockWidth = 'normal' | 'compact' | 'wide';
type ImageFit = 'cover' | 'contain';
type DropTarget = { id: string; after: boolean };

function layoutChoice<T extends string>(block: ContentBlock, key: string, choices: readonly T[], fallback: T): T {
  const value = block.layout[key];
  return typeof value === 'string' && choices.includes(value as T) ? value as T : fallback;
}

function layoutNumber(block: ContentBlock, key: string, fallback: number): number {
  const value = block.layout[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Per-block visual overrides live in `layout`, which already persists with
 * every content block. They never change the appearance of other blocks. */
function blockStyle(block: ContentBlock): CSSProperties {
  const style: CSSProperties = {};
  const fontSize = block.layout.fontSize;
  const lineHeight = block.layout.lineHeight;
  const align = layoutChoice(block, 'align', ['start', 'center', 'end'] as const, 'start');
  const width = layoutChoice(block, 'width', ['normal', 'compact', 'wide'] as const, 'normal');

  if (typeof fontSize === 'number' && Number.isFinite(fontSize)) style.fontSize = `${fontSize}px`;
  if (typeof lineHeight === 'number' && Number.isFinite(lineHeight)) style.lineHeight = lineHeight;
  if (width === 'compact') style.maxWidth = '38ch';
  if (width === 'wide') style.maxWidth = '100%';
  if (align === 'center') { style.textAlign = 'center'; style.marginLeft = 'auto'; style.marginRight = 'auto'; }
  if (align === 'end') { style.textAlign = 'right'; style.marginLeft = 'auto'; }
  return style;
}

export function DossierPlate({
  entry, articles, activeLanguage, posLabel, prevTitle, nextTitle, editing, onClose, onPrev, onNext, onOpenArticle, onChange, uploadPhoto, dossier,
}: DossierPlateProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busyBlock, setBusyBlock] = useState<string | null>(null);
  const [inspectorBlock, setInspectorBlock] = useState<string | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { if (sheetRef.current) sheetRef.current.scrollTop = 0; }, [entry.slug]);

  const blocks = [...entry.blocks].sort((a, b) => a.position - b.position);

  const setMeta = (key: string, value: unknown) => onChange({ ...entry, metadata: { ...entry.metadata, [key]: value } });
  const commitBlocks = (next: ContentBlock[]) => onChange({ ...entry, blocks: next.map((block, index) => ({ ...block, position: index })) });
  const updateBlock = (id: string, props: Record<string, unknown>) =>
    commitBlocks(blocks.map((block) => (block.id === id ? { ...block, props: { ...block.props, ...props } } : block)));
  const updateBlockLayout = (id: string, layout: Record<string, unknown>) =>
    commitBlocks(blocks.map((block) => (block.id === id ? { ...block, layout: { ...block.layout, ...layout } } : block)));
  const updateLinkedText = (block: ContentBlock, text: string, links: TextLink[]) =>
    updateBlock(block.id, { text, textLinks: setLinksForLanguage(block.props.textLinks, activeLanguage, links) });
  const removeBlock = (id: string) => commitBlocks(blocks.filter((block) => block.id !== id));
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

  function startBlockDrag(event: DragEvent<HTMLButtonElement>, id: string) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    setDraggingBlock(id);
    setDropTarget(null);
  }

  function markDropTarget(event: DragEvent<HTMLDivElement>, id: string) {
    const source = draggingBlock || event.dataTransfer.getData('text/plain');
    if (!source || source === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    setDropTarget((current) => current?.id === id && current.after === after ? current : { id, after });
  }

  function dropBlock(event: DragEvent<HTMLDivElement>, id: string) {
    event.preventDefault();
    const source = draggingBlock || event.dataTransfer.getData('text/plain');
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    if (source && source !== id) commitBlocks(reorderById(blocks, source, id, after));
    setDraggingBlock(null);
    setDropTarget(null);
  }

  function renderBlockInspector(block: ContentBlock) {
    const isImage = block.type === 'image';
    const align = layoutChoice(block, 'align', ['start', 'center', 'end'] as const, 'start');
    const width = layoutChoice(block, 'width', ['normal', 'compact', 'wide'] as const, 'normal');
    const defaultSize = block.type === 'heading' ? 21 : block.type === 'callout' ? 14.5 : 16.5;
    const fontSize = layoutNumber(block, 'fontSize', defaultSize);
    const lineHeight = layoutNumber(block, 'lineHeight', block.type === 'heading' ? 1.2 : 1.66);
    const imageHeight = layoutNumber(block, 'height', 280);
    const imageFit = layoutChoice(block, 'fit', ['cover', 'contain'] as const, 'cover');
    const supportsTypography = block.type === 'heading' || block.type === 'text' || block.type === 'callout';

    return (
      <div className="db-block__inspector" data-nodrag role="group" aria-label="Block settings">
        <div className="db-block__inspector-title">this block · live preview</div>
        <label>
          alignment
          <select value={align} onChange={(event) => updateBlockLayout(block.id, { align: event.target.value as BlockAlign })}>
            <option value="start">left</option>
            <option value="center">centre</option>
            <option value="end">right</option>
          </select>
        </label>
        <label>
          width
          <select value={width} onChange={(event) => updateBlockLayout(block.id, { width: event.target.value as BlockWidth })}>
            <option value="normal">normal</option>
            <option value="compact">compact</option>
            <option value="wide">wide</option>
          </select>
        </label>
        {isImage ? (
          <>
            <label className="db-block__range">
              height <output>{imageHeight}px</output>
              <input type="range" min={140} max={640} step={10} value={imageHeight} onChange={(event) => updateBlockLayout(block.id, { height: Number(event.target.value) })} />
            </label>
            <label>
              crop
              <select value={imageFit} onChange={(event) => updateBlockLayout(block.id, { fit: event.target.value as ImageFit })}>
                <option value="cover">fill frame</option>
                <option value="contain">show all</option>
              </select>
            </label>
          </>
        ) : supportsTypography ? (
          <>
            <label className="db-block__range">
              size <output>{fontSize}px</output>
              <input type="range" min={12} max={block.type === 'heading' ? 60 : 32} step={0.5} value={fontSize} onChange={(event) => updateBlockLayout(block.id, { fontSize: Number(event.target.value) })} />
            </label>
            <label className="db-block__range">
              leading <output>{lineHeight.toFixed(2)}</output>
              <input type="range" min={1.1} max={2.2} step={0.02} value={lineHeight} onChange={(event) => updateBlockLayout(block.id, { lineHeight: Number(event.target.value) })} />
            </label>
          </>
        ) : null}
      </div>
    );
  }

  function renderBlockBody(block: ContentBlock) {
    const style = blockStyle(block);
    const text = propString(block, 'text');
    const textLinks = linksForLanguage(block.props.textLinks, activeLanguage, text.length);
    const linkableArticles = articles.filter((article) => article.slug !== entry.slug && article.status === 'published');
    const ed = (key: string) => (editing
      ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => updateBlock(block.id, { [key]: readText(e) }) }
      : {});

    switch (block.type) {
      case 'heading':
        return <RichText as="h3" className="db-heading" style={style} text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />;
      case 'callout':
        return <RichText as="div" className="db-callout" style={style} text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />;
      case 'quote':
        return (
          <blockquote className="db-quote" style={style}>
            <RichText as="p" className="" text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />
            {propString(block, 'cite') || editing ? <cite {...ed('cite')}>{propString(block, 'cite')}</cite> : null}
          </blockquote>
        );
      case 'divider':
        return <hr className="db-divider" style={style} />;
      case 'list': {
        const items = propStringList(block, 'items');
        const setItem = (index: number, value: string) => { const next = [...items]; next[index] = value; updateBlock(block.id, { items: next }); };
        return (
          <ul className="db-list" style={style}>
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
          <div className="db-metrics" style={style}>
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
          <div className="db-links" style={style}>
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
          <div className="db-tags" style={style}>
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
      case 'image': {
        const imageHeight = layoutNumber(block, 'height', 280);
        const imageFit = layoutChoice(block, 'fit', ['cover', 'contain'] as const, 'cover');
        return (
          <figure className="db-image" style={style}>
            <div className="db-image__frame" data-fit={imageFit} style={{ height: imageHeight }}>
              <ImageSlot url={propString(block, 'url') || undefined} alt={propString(block, 'alt')} placeholder={propString(block, 'caption') || 'drop a photo'} editable={editing} busy={busyBlock === block.id} onPick={(file) => pickBlockImage(block.id, file)} />
            </div>
            {propString(block, 'caption') || editing ? <figcaption {...ed('caption')}>{propString(block, 'caption')}</figcaption> : null}
          </figure>
        );
      }
      default:
        return <RichText as="p" className="db-text" style={style} text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />;
    }
  }

  return (
    // The theme drives the article's shape through data attributes rather than
    // inline styles, so one stylesheet holds every variant.
    <div
      className="dossier"
      role="presentation"
      data-enter={dossier.enter}
      data-lede={dossier.lede}
      data-numbered={dossier.numbered ? 'true' : 'false'}
      data-dropcap={dossier.dropCap ? 'true' : 'false'}
      data-centred={dossier.centred ? 'true' : 'false'}
      data-editing={editing ? 'true' : 'false'}
    >
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
              {blocks.map((block) => (
                <div
                  className={`db-block db-block--${block.type}`}
                  key={block.id}
                  data-dragging={draggingBlock === block.id || undefined}
                  data-drop={dropTarget?.id === block.id ? (dropTarget.after ? 'after' : 'before') : undefined}
                  onDragOver={editing ? (event) => markDropTarget(event, block.id) : undefined}
                  onDrop={editing ? (event) => dropBlock(event, block.id) : undefined}
                >
                  {editing ? (
                    <div className="db-block__ctrl" data-nodrag>
                      <button type="button" onClick={() => setInspectorBlock((open) => (open === block.id ? null : block.id))} aria-label="Edit this block's appearance" aria-expanded={inspectorBlock === block.id}>⚙</button>
                      <button className="db-block__drag" type="button" draggable onDragStart={(event) => startBlockDrag(event, block.id)} onDragEnd={() => { setDraggingBlock(null); setDropTarget(null); }} aria-label="Drag block to reorder" title="Drag to reorder">⠿</button>
                      <button type="button" onClick={() => removeBlock(block.id)} aria-label="Delete block">✕</button>
                    </div>
                  ) : null}
                  {renderBlockBody(block)}
                  {editing && inspectorBlock === block.id ? renderBlockInspector(block) : null}
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
