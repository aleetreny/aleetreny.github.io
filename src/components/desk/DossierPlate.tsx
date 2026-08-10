import { useEffect, useRef, useState, type DragEvent } from 'react';
import type { ContentBlock, PortfolioEntry } from '../../types/content';
import { BLOCK_PALETTE, newBlock, propPairList, propString, propStringList, reorderById, type DossierBlockType } from '../../lib/blocks';
import type { DossierConfig } from '../../lib/board';
import { linksForLanguage, linksForLanguageAt, removeLinksForLanguageAt, setLinksForLanguage, setLinksForLanguageAt, type TextLink } from '../../lib/rich-text';
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

type DropTarget = { id: string; after: boolean };
const DRAG_SCROLL_EDGE = 88;
const DRAG_SCROLL_MAX = 18;

export function DossierPlate({
  entry, articles, activeLanguage, posLabel, prevTitle, nextTitle, editing, onClose, onPrev, onNext, onOpenArticle, onChange, uploadPhoto, dossier,
}: DossierPlateProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busyBlock, setBusyBlock] = useState<string | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const dragScrollFrame = useRef<number | null>(null);
  const dragPointerY = useRef(0);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { if (sheetRef.current) sheetRef.current.scrollTop = 0; }, [entry.slug]);
  useEffect(() => () => {
    if (dragScrollFrame.current !== null) window.cancelAnimationFrame(dragScrollFrame.current);
  }, []);

  const blocks = [...entry.blocks].sort((a, b) => a.position - b.position);

  const setMeta = (key: string, value: unknown) => onChange({ ...entry, metadata: { ...entry.metadata, [key]: value } });
  const commitBlocks = (next: ContentBlock[]) => onChange({ ...entry, blocks: next.map((block, index) => ({ ...block, position: index })) });
  const updateBlock = (id: string, props: Record<string, unknown>) =>
    commitBlocks(blocks.map((block) => (block.id === id ? { ...block, props: { ...block.props, ...props } } : block)));
  const updateLinkedText = (block: ContentBlock, text: string, links: TextLink[]) =>
    updateBlock(block.id, { text, textLinks: setLinksForLanguage(block.props.textLinks, activeLanguage, links) });
  const updateLinkedListItem = (block: ContentBlock, index: number, text: string, links: TextLink[]) => {
    const items = propStringList(block, 'items');
    const nextItems = [...items];
    nextItems[index] = text;
    updateBlock(block.id, { items: nextItems, itemTextLinks: setLinksForLanguageAt(block.props.itemTextLinks, activeLanguage, index, links) });
  };
  const removeBlock = (id: string) => commitBlocks(blocks.filter((block) => block.id !== id));
  const addBlock = (type: DossierBlockType) => commitBlocks([...blocks, newBlock(type, blocks.length)]);

  function stopDragAutoScroll() {
    if (dragScrollFrame.current !== null) {
      window.cancelAnimationFrame(dragScrollFrame.current);
      dragScrollFrame.current = null;
    }
  }

  function runDragAutoScroll() {
    if (dragScrollFrame.current !== null) return;
    dragScrollFrame.current = window.requestAnimationFrame(() => {
      dragScrollFrame.current = null;
      const sheet = sheetRef.current;
      if (!sheet || !draggingBlock) return;
      const bounds = sheet.getBoundingClientRect();
      const y = dragPointerY.current;
      let distance = 0;
      if (y < bounds.top + DRAG_SCROLL_EDGE) distance = y - (bounds.top + DRAG_SCROLL_EDGE);
      if (y > bounds.bottom - DRAG_SCROLL_EDGE) distance = y - (bounds.bottom - DRAG_SCROLL_EDGE);
      if (distance === 0) return;

      const direction = distance < 0 ? -1 : 1;
      const intensity = Math.min(1, Math.abs(distance) / DRAG_SCROLL_EDGE);
      const amount = direction * Math.max(2, Math.round(DRAG_SCROLL_MAX * intensity));
      const previous = sheet.scrollTop;
      sheet.scrollTop += amount;
      if (sheet.scrollTop !== previous) runDragAutoScroll();
    });
  }

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
    dragPointerY.current = event.clientY;
  }

  function markDropTarget(event: DragEvent<HTMLDivElement>, id: string) {
    const source = draggingBlock || event.dataTransfer.getData('text/plain');
    if (!source) return;
    event.preventDefault();
    dragPointerY.current = event.clientY;
    runDragAutoScroll();
    if (source === id) return;
    event.dataTransfer.dropEffect = 'move';
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    setDropTarget((current) => current?.id === id && current.after === after ? current : { id, after });
  }

  function dropBlock(event: DragEvent<HTMLDivElement>, id: string) {
    event.preventDefault();
    stopDragAutoScroll();
    const source = draggingBlock || event.dataTransfer.getData('text/plain');
    const rect = event.currentTarget.getBoundingClientRect();
    const after = event.clientY > rect.top + rect.height / 2;
    if (source && source !== id) commitBlocks(reorderById(blocks, source, id, after));
    setDraggingBlock(null);
    setDropTarget(null);
  }

  function markSheetDragOver(event: DragEvent<HTMLDivElement>) {
    const source = draggingBlock || event.dataTransfer.getData('text/plain');
    if (!source) return;
    event.preventDefault();
    dragPointerY.current = event.clientY;
    runDragAutoScroll();
  }

  function renderBlockBody(block: ContentBlock) {
    const text = propString(block, 'text');
    const textLinks = linksForLanguage(block.props.textLinks, activeLanguage, text.length);
    const linkableArticles = articles.filter((article) => article.slug !== entry.slug && article.status === 'published');
    const ed = (key: string) => (editing
      ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => updateBlock(block.id, { [key]: readText(e) }) }
      : {});

    switch (block.type) {
      case 'heading':
        return <RichText as="h3" className="db-heading" text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />;
      case 'callout':
        return <RichText as="div" className="db-callout" text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />;
      case 'quote':
        return (
          <blockquote className="db-quote">
            <RichText as="p" className="" text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />
            {propString(block, 'cite') || editing ? <cite {...ed('cite')}>{propString(block, 'cite')}</cite> : null}
          </blockquote>
        );
      case 'divider':
        return <hr className="db-divider" />;
      case 'list': {
        const items = propStringList(block, 'items');
        const removeItem = (index: number) => updateBlock(block.id, {
          items: items.filter((_, i) => i !== index),
          itemTextLinks: removeLinksForLanguageAt(block.props.itemTextLinks, activeLanguage, index),
        });
        return (
          <ul className="db-list">
            {items.map((item, index) => (
              <li key={index}>
                <RichText
                  as="span"
                  className="db-list__item-text"
                  text={item}
                  links={linksForLanguageAt(block.props.itemTextLinks, activeLanguage, index, item.length)}
                  editing={editing}
                  articles={linkableArticles}
                  onChange={(nextText, links) => updateLinkedListItem(block, index, nextText, links)}
                  onOpenArticle={onOpenArticle}
                />
                {editing ? <button className="db-x" type="button" onClick={() => removeItem(index)} aria-label="Delete">×</button> : null}
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
      case 'image': {
        return (
          <figure className="db-image">
            <div className="db-image__frame" style={{ height: 280 }}>
              <ImageSlot url={propString(block, 'url') || undefined} alt={propString(block, 'alt')} placeholder={propString(block, 'caption') || 'drop a photo'} editable={editing} busy={busyBlock === block.id} onPick={(file) => pickBlockImage(block.id, file)} />
            </div>
            {propString(block, 'caption') || editing ? <figcaption {...ed('caption')}>{propString(block, 'caption')}</figcaption> : null}
          </figure>
        );
      }
      default:
        return <RichText as="p" className="db-text" text={text} links={textLinks} editing={editing} articles={linkableArticles} onChange={(nextText, links) => updateLinkedText(block, nextText, links)} onOpenArticle={onOpenArticle} />;
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

        <div className="dossier__sheet" ref={sheetRef} onDragOver={editing ? markSheetDragOver : undefined}>
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
                      <button className="db-block__drag" type="button" draggable onDragStart={(event) => startBlockDrag(event, block.id)} onDragEnd={() => { stopDragAutoScroll(); setDraggingBlock(null); setDropTarget(null); }} aria-label="Drag block to reorder" title="Drag to reorder">⠿</button>
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
