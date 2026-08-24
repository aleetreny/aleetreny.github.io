import { Component, useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type ErrorInfo, type MouseEvent as ReactMouseEvent, type PointerEvent, type ReactNode } from 'react';
import type { ContentBlock, PortfolioEntry } from '../../types/content';
import { BLOCK_TYPES, insertAfterId, newBlock, propPairList, propString, propStringList, reorderById, updateById, type DossierBlockType } from '../../lib/blocks';
import type { DossierConfig } from '../../lib/board';
import { linksForLanguage, linksForLanguageAt, rebaseTextLinks, removeLinksForLanguageAt, setLinksForLanguage, setLinksForLanguageAt, splitTextLinks, type TextLink } from '../../lib/rich-text';
import { ImageSlot } from './ImageSlot';
import { RichText } from './RichText';
import { EditableText } from './EditableText';
import { useUiText } from './ui-text-context';

/** What the board is doing with the owner's typing right now. */
export type SaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

type DossierPlateProps = {
  entry: PortfolioEntry;
  articles: PortfolioEntry[];
  activeLanguage: string;
  posLabel: string;
  prevTitle: string;
  nextTitle: string;
  editing: boolean;
  saveState: SaveState;
  saveError: string;
  onRetrySave: () => void;
  canTranslate: boolean;
  translating: boolean;
  onTranslate: () => void;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenArticle: (slug: string) => void;
  onChange: (next: PortfolioEntry) => void;
  uploadPhoto: (file: File) => Promise<string>;
  onUploadError: (reason: unknown) => void;
  /** Article design: measure, title, lede, drop cap, numbering, entrance. */
  dossier: DossierConfig;
};

function metaString(entry: PortfolioEntry, key: string): string {
  const value = entry.metadata[key];
  return typeof value === 'string' ? value : '';
}

type DropTarget = { id: string; after: boolean };
const DRAG_SCROLL_EDGE = 88;
const DRAG_SCROLL_MAX = 18;

function useLatestEntryCommit(entry: PortfolioEntry, onChange: (next: PortfolioEntry) => void) {
  const entryRef = useRef(entry);
  useLayoutEffect(() => { entryRef.current = entry; }, [entry]);
  return useCallback((change: (current: PortfolioEntry) => PortfolioEntry) => {
    const current = entryRef.current;
    const next = change(current);
    if (next === current) return;
    entryRef.current = next;
    onChange(next);
  }, [onChange]);
}

/** Which block types Enter should split into a second block of the same kind
 *  rather than break a line inside. Writing prose, Enter means "next
 *  paragraph"; inside a callout or a quote it means "next line". */
const SPLITS_ON_ENTER = new Set<string>(['text', 'heading']);

/** Keep a rendering failure inside the dossier from stranding the owner on an
 * empty board. The normal edit path avoids the stale updates that caused the
 * failure; this is the last-resort escape hatch for malformed remote content. */
export class DossierErrorBoundary extends Component<{
  children: ReactNode;
  onClose: () => void;
  closeLabel: string;
}, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: true } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Dossier render failed', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="dossier" data-editing="false">
        <div className="dossier__scrim" onClick={this.props.onClose} />
        <section className="dossier__plate" role="alertdialog" aria-modal="true" aria-label="Editor error">
          <div className="dossier__inner">
            <h2 className="dossier__title">No se ha podido mostrar este dossier.</h2>
            <p className="dossier__lede">El tablero sigue disponible y puedes volver a él sin recargar la página.</p>
            <button className="pbtn" type="button" onClick={this.props.onClose}>{this.props.closeLabel}</button>
          </div>
        </section>
      </div>
    );
  }
}

export function DossierPlate({
  entry, articles, activeLanguage, posLabel, prevTitle, nextTitle, editing,
  saveState, saveError, onRetrySave, canTranslate, translating, onTranslate,
  onClose, onPrev, onNext, onOpenArticle, onChange, uploadPhoto, onUploadError, dossier,
}: DossierPlateProps) {
  const t = useUiText();
  const closeRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [busyBlock, setBusyBlock] = useState<string | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  /** The block, or list row, that Enter just created and that should already
   *  have the caret in it by the time the owner looks up. */
  const [focusTarget, setFocusTarget] = useState<{ block: string; item?: number } | null>(null);
  const dragScrollFrame = useRef<number | null>(null);
  const draggingBlockRef = useRef<string | null>(null);
  const dropTargetRef = useRef<DropTarget | null>(null);
  const dragPointerId = useRef<number | null>(null);
  const dragPointerX = useRef(0);
  const dragPointerY = useRef(0);

  useEffect(() => { closeRef.current?.focus(); }, []);
  useEffect(() => { if (sheetRef.current) sheetRef.current.scrollTop = 0; }, [entry.slug]);
  useEffect(() => () => {
    if (dragScrollFrame.current !== null) window.cancelAnimationFrame(dragScrollFrame.current);
  }, []);
  // The focus request is consumed by the render that follows it; holding it any
  // longer would steal the caret back every time the article re-rendered.
  useEffect(() => {
    if (!focusTarget) return undefined;
    const timer = window.setTimeout(() => setFocusTarget(null), 250);
    return () => window.clearTimeout(timer);
  }, [focusTarget]);

  const orderedBlocks = (source: PortfolioEntry) => [...source.blocks].sort((a, b) => a.position - b.position);
  const blocks = orderedBlocks(entry);

  /** Every edit starts from the most recent local dossier, not the render that
   * created the event handler. This matters when blur, click and unmount all
   * happen in the same interaction. */
  const commitEntry = useLatestEntryCommit(entry, onChange);
  const setMeta = (key: string, value: unknown) => commitEntry((current) => ({
    ...current,
    metadata: { ...current.metadata, [key]: value },
  }));
  const normaliseBlocks = (next: ContentBlock[]) => next.map((block, index) => ({ ...block, position: index }));
  const commitBlocks = (change: (current: ContentBlock[]) => ContentBlock[]) => commitEntry((current) => {
    const currentBlocks = orderedBlocks(current);
    const nextBlocks = change(currentBlocks);
    return nextBlocks === currentBlocks ? current : { ...current, blocks: normaliseBlocks(nextBlocks) };
  });
  const updateBlock = (id: string, props: Record<string, unknown>) => commitBlocks((current) =>
    updateById(current, id, (block) => ({ ...block, props: { ...block.props, ...props } })),
  );
  const updateLinkedText = (block: ContentBlock, text: string, links: TextLink[]) =>
    updateBlock(block.id, { text, textLinks: setLinksForLanguage(block.props.textLinks, activeLanguage, links) });
  const updateLinkedListItem = (block: ContentBlock, index: number, text: string, links: TextLink[]) => {
    const items = propStringList(block, 'items');
    const nextItems = [...items];
    nextItems[index] = text;
    updateBlock(block.id, { items: nextItems, itemTextLinks: setLinksForLanguageAt(block.props.itemTextLinks, activeLanguage, index, links) });
  };
  const removeBlock = (id: string) => {
    commitBlocks((current) => {
      const next = current.filter((block) => block.id !== id);
      return next.length === current.length ? current : next;
    });
    setFocusTarget((current) => (current?.block === id ? null : current));
  };
  const addBlock = (type: DossierBlockType) => {
    const block = newBlock(type, 0);
    commitBlocks((current) => [...current, block]);
    setFocusTarget({ block: block.id });
  };
  const addParagraphAfter = (id: string) => {
    // Let the field losing focus store its text before producing the following
    // block. Reading the latest entry prevents the pending blur from replacing
    // that paragraph with its stale pre-click value.
    window.setTimeout(() => {
      const paragraph = newBlock('text', 0);
      commitBlocks((current) => insertAfterId(current, id, paragraph));
      setFocusTarget({ block: paragraph.id });
    }, 0);
  };

  /** Enter inside prose: keep what is before the caret, carry what is after it
   *  into a fresh block, and put the caret at its start.
   *
   *  A heading splits into a paragraph rather than a second heading — pressing
   *  Enter at the end of a title means "now write the section", not "now write
   *  another title". Splitting a heading in the middle does keep both halves as
   *  headings, because that is a rename, not a new section. */
  const splitBlock = (blockId: string, before: string, after: string) => {
    const source = blocks.find((block) => block.id === blockId);
    if (!source) return;
    const nextType: DossierBlockType = source.type === 'heading' && !after.trim()
      ? 'text'
      : (source.type as DossierBlockType);
    const created = newBlock(nextType, 0);
    commitBlocks((current) => {
      const index = current.findIndex((item) => item.id === blockId);
      if (index < 0) return current;
      const block = current[index];
      const previous = propString(block, 'text');
      const combined = `${before}${after}`;
      const rebasedLinks = rebaseTextLinks(
        linksForLanguage(block.props.textLinks, activeLanguage, previous.length),
        previous,
        combined,
      );
      const { before: beforeLinks, after: afterLinks } = splitTextLinks(rebasedLinks, before.length, combined.length);
      const next = updateById(current, blockId, (item) => ({
        ...item,
        props: { ...item.props, text: before, textLinks: setLinksForLanguage(item.props.textLinks, activeLanguage, beforeLinks) },
      }));
      next.splice(index + 1, 0, {
        ...created,
        props: { ...created.props, text: after, textLinks: setLinksForLanguage(undefined, activeLanguage, afterLinks) },
      });
      return next;
    });
    setFocusTarget({ block: created.id });
  };

  /** Enter inside a bullet: the same idea, one row down. */
  const splitListItem = (blockId: string, index: number, before: string, after: string) => {
    commitBlocks((current) => {
      const block = current.find((item) => item.id === blockId);
      if (!block) return current;
      const items = propStringList(block, 'items');
      const next = [...items];
      next[index] = before;
      next.splice(index + 1, 0, after);
      return updateById(current, blockId, (item) => ({
        ...item,
        props: {
          ...item.props,
          items: next,
          itemTextLinks: setLinksForLanguageAt(block.props.itemTextLinks, activeLanguage, index, []),
        },
      }));
    });
    setFocusTarget({ block: blockId, item: index + 1 });
  };

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
      if (!sheet || !draggingBlockRef.current) return;
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
      if (sheet.scrollTop !== previous) {
        updateDropTargetAt(dragPointerX.current, dragPointerY.current);
        runDragAutoScroll();
      }
    });
  }

  async function pickBlockImage(id: string, file: File) {
    setBusyBlock(id);
    try {
      const url = await uploadPhoto(file);
      updateBlock(id, { url });
    } catch (reason) {
      onUploadError(reason);
    } finally {
      setBusyBlock(null);
    }
  }

  function setCurrentDropTarget(next: DropTarget | null) {
    const current = dropTargetRef.current;
    if (current?.id === next?.id && current?.after === next?.after) return;
    dropTargetRef.current = next;
    setDropTarget(next);
  }

  function updateDropTargetAt(clientX: number, clientY: number) {
    const source = draggingBlockRef.current;
    const sheet = sheetRef.current;
    if (!source || !sheet) return;
    const sheetBounds = sheet.getBoundingClientRect();
    if (clientY < sheetBounds.top || clientY > sheetBounds.bottom || clientX < sheetBounds.left || clientX > sheetBounds.right) {
      setCurrentDropTarget(null);
      return;
    }
    const direct = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-block-id]');
    // The handle lives in the left rail, just outside the block itself. When a
    // drag stays vertically aligned with that rail, find the block by height
    // rather than making the owner steer back over the prose first.
    const candidates = [...sheet.querySelectorAll<HTMLElement>('[data-block-id]')];
    const candidate = direct ?? candidates.find((block) => {
      const rect = block.getBoundingClientRect();
      return clientY >= rect.top && clientY <= rect.bottom;
    }) ?? candidates.reduce<HTMLElement | null>((nearest, block) => {
      if (!nearest) return block;
      const current = block.getBoundingClientRect();
      const previous = nearest.getBoundingClientRect();
      const currentDistance = clientY < current.top ? current.top - clientY : clientY - current.bottom;
      const previousDistance = clientY < previous.top ? previous.top - clientY : clientY - previous.bottom;
      return currentDistance < previousDistance ? block : nearest;
    }, null);
    if (!candidate || !sheet.contains(candidate)) {
      setCurrentDropTarget(null);
      return;
    }
    const id = candidate.dataset.blockId;
    if (!id || id === source) {
      setCurrentDropTarget(null);
      return;
    }
    const rect = candidate.getBoundingClientRect();
    setCurrentDropTarget({ id, after: clientY > rect.top + rect.height / 2 });
  }

  function clearBlockDrag() {
    stopDragAutoScroll();
    draggingBlockRef.current = null;
    dragPointerId.current = null;
    setCurrentDropTarget(null);
    setDraggingBlock(null);
  }

  function beginBlockDrag(id: string, pointerId: number, clientX: number, clientY: number) {
    draggingBlockRef.current = id;
    dragPointerId.current = pointerId;
    dragPointerX.current = clientX;
    dragPointerY.current = clientY;
    setDraggingBlock(id);
    setCurrentDropTarget(null);
  }

  function moveBlockDragAt(clientX: number, clientY: number) {
    dragPointerX.current = clientX;
    dragPointerY.current = clientY;
    updateDropTargetAt(clientX, clientY);
    runDragAutoScroll();
  }

  function finishBlockDrag() {
    const source = draggingBlockRef.current;
    const target = dropTargetRef.current;
    if (source && target) commitBlocks((current) => reorderById(current, source, target.id, target.after));
    clearBlockDrag();
  }

  function startBlockDrag(event: PointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    beginBlockDrag(id, event.pointerId, event.clientX, event.clientY);
  }

  function movePointerBlockDrag(event: PointerEvent<HTMLButtonElement>) {
    if (dragPointerId.current !== event.pointerId) return;
    event.preventDefault();
    moveBlockDragAt(event.clientX, event.clientY);
  }

  function finishPointerBlockDrag(event: PointerEvent<HTMLButtonElement>) {
    if (dragPointerId.current !== event.pointerId) return;
    event.preventDefault();
    moveBlockDragAt(event.clientX, event.clientY);
    finishBlockDrag();
  }

  function startMouseBlockDrag(event: ReactMouseEvent<HTMLButtonElement>, id: string) {
    // Pointer Events are the primary path. The mouse fallback keeps reordering
    // working in browsers and automation surfaces that only emit Mouse Events.
    if (dragPointerId.current !== null || event.button !== 0) return;
    event.preventDefault();
    beginBlockDrag(id, -1, event.clientX, event.clientY);
  }

  const moveMouseBlockDrag = useEffectEvent((event: MouseEvent) => {
    if (!draggingBlockRef.current) return;
    moveBlockDragAt(event.clientX, event.clientY);
  });

  const finishMouseBlockDrag = useEffectEvent((event: MouseEvent) => {
    if (!draggingBlockRef.current) return;
    moveBlockDragAt(event.clientX, event.clientY);
    finishBlockDrag();
  });

  useLayoutEffect(() => {
    const move = (event: MouseEvent) => moveMouseBlockDrag(event);
    const finish = (event: MouseEvent) => finishMouseBlockDrag(event);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', finish);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', finish);
    };
  }, []);

  function renderBlockBody(block: ContentBlock) {
    const text = propString(block, 'text');
    const textLinks = linksForLanguage(block.props.textLinks, activeLanguage, text.length);
    const linkableArticles = articles.filter((article) => article.slug !== entry.slug && article.status === 'published');
    const focusHere = focusTarget?.block === block.id && focusTarget.item === undefined;
    const prose = (as: 'h3' | 'div' | 'p', className: string, placeholder: string) => (
      <RichText
        as={as}
        className={className}
        text={text}
        links={textLinks}
        editing={editing}
        articles={linkableArticles}
        placeholder={placeholder}
        autoFocus={focusHere}
        onSplit={SPLITS_ON_ENTER.has(block.type) ? (before, after) => splitBlock(block.id, before, after) : undefined}
        onChange={(nextText, links) => updateLinkedText(block, nextText, links)}
        onOpenArticle={onOpenArticle}
      />
    );

    switch (block.type) {
      case 'heading':
        return prose('h3', 'db-heading', t('ph.heading'));
      case 'callout':
        return prose('div', 'db-callout', t('ph.callout'));
      case 'quote':
        return (
          <blockquote className="db-quote">
            {prose('p', '', t('ph.quote'))}
            {propString(block, 'cite') || editing ? (
              <EditableText
                as="cite"
                text={propString(block, 'cite')}
                placeholder={t('ph.cite')}
                editing={editing}
                multiline={false}
                onCommit={(value) => updateBlock(block.id, { cite: value })}
              />
            ) : null}
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
        const addItem = () => {
          updateBlock(block.id, { items: [...items, ''] });
          setFocusTarget({ block: block.id, item: items.length });
        };
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
                  placeholder={t('ph.item')}
                  autoFocus={focusTarget?.block === block.id && focusTarget.item === index}
                  onSplit={(before, after) => splitListItem(block.id, index, before, after)}
                  onChange={(nextText, links) => updateLinkedListItem(block, index, nextText, links)}
                  onOpenArticle={onOpenArticle}
                />
                {editing ? <button className="db-x" type="button" onClick={() => removeItem(index)} aria-label={t('dossier.delete')}>×</button> : null}
              </li>
            ))}
            {editing ? <button className="db-add-item" type="button" onClick={addItem}>{t('dossier.addPoint')}</button> : null}
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
                <EditableText as="b" text={pair[0]} placeholder="0" editing={editing} multiline={false} onCommit={(value) => setPair(index, 0, value)} />
                <EditableText as="span" text={pair[1]} placeholder={t('card.statLabel')} editing={editing} multiline={false} onCommit={(value) => setPair(index, 1, value)} />
                {editing ? <button className="db-x" type="button" onClick={() => updateBlock(block.id, { items: items.filter((_, i) => i !== index) })} aria-label={t('dossier.delete')}>×</button> : null}
              </div>
            ))}
            {editing ? <button className="db-add-item" type="button" onClick={() => updateBlock(block.id, { items: [...items, ['', '']] })}>{t('dossier.addNumber')}</button> : null}
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
                <input className="db-input" value={pair[0]} placeholder={t('dossier.linkLabelPlaceholder')} onChange={(e) => setPair(index, 0, e.target.value)} data-nodrag />
                <input className="db-input" value={pair[1]} placeholder="https://" onChange={(e) => setPair(index, 1, e.target.value)} data-nodrag />
                <button className="db-x" type="button" onClick={() => updateBlock(block.id, { items: items.filter((_, i) => i !== index) })} aria-label={t('dossier.delete')}>×</button>
              </div>
            ) : (
              pair[0] && pair[1] ? <a key={index} href={pair[1]} target="_blank" rel="noreferrer" data-nodrag>{pair[0]} →</a> : null
            )))}
            {editing ? <button className="db-add-item" type="button" onClick={() => updateBlock(block.id, { items: [...items, ['', 'https://']] })}>{t('dossier.addLink')}</button> : null}
          </div>
        );
      }
      case 'tags': {
        const items = propStringList(block, 'items');
        const setItem = (index: number, value: string) => { const next = [...items]; next[index] = value; updateBlock(block.id, { items: next }); };
        return (
          <div className="db-tags">
            <span className="db-tags__lbl">{t('dossier.filedUnder')}</span>
            {items.map((item, index) => (
              <span className="db-tag" key={index}>
                <EditableText as="span" text={item} placeholder={t('dossier.newTag')} editing={editing} multiline={false} onCommit={(value) => setItem(index, value)} />
                {editing ? <button className="db-x" type="button" onClick={() => updateBlock(block.id, { items: items.filter((_, i) => i !== index) })} aria-label={t('dossier.delete')}>×</button> : null}
              </span>
            ))}
            {editing ? <button className="db-add-item" type="button" onClick={() => updateBlock(block.id, { items: [...items, ''] })}>{t('dossier.addTag')}</button> : null}
          </div>
        );
      }
      case 'image': {
        return (
          <figure className="db-image">
            <div className="db-image__frame">
              <ImageSlot url={propString(block, 'url') || undefined} alt={propString(block, 'alt')} placeholder={propString(block, 'caption') || t('card.dropPhoto')} editable={editing} busy={busyBlock === block.id} onPick={(file) => pickBlockImage(block.id, file)} />
            </div>
            {propString(block, 'caption') || editing ? (
              <EditableText
                as="figcaption"
                text={propString(block, 'caption')}
                placeholder={t('ph.caption')}
                editing={editing}
                multiline={false}
                onCommit={(value) => updateBlock(block.id, { caption: value })}
              />
            ) : null}
          </figure>
        );
      }
      default:
        return prose('p', 'db-text', t('ph.text'));
    }
  }

  const saveLabel = saveState === 'error' ? t('dossier.saveFailed')
    : saveState === 'saving' || saveState === 'pending' ? t('dossier.saving')
      : saveState === 'saved' ? t('dossier.saved') : '';

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
            <EditableText as="span" className="k" text={metaString(entry, 'kicker')} placeholder={t('ph.kicker')} editing={editing} multiline={false} onCommit={(value) => setMeta('kicker', value)} />
          </div>
          <div className="dossier__bar-actions">
            <span className="dossier__bar-pos">{posLabel}</span>
            {editing && saveLabel ? (
              <span className={`dossier__save dossier__save--${saveState}`} title={saveError || undefined}>
                {saveLabel}
                {saveState === 'error' ? (
                  <button className="dossier__save-retry" type="button" onClick={onRetrySave}>{t('dossier.retry')}</button>
                ) : null}
              </span>
            ) : null}
            {editing && canTranslate ? (
              <button
                className="pbtn"
                type="button"
                disabled={translating}
                title={t('dossier.translateTitle')}
                onClick={onTranslate}
              >
                {translating ? t('dossier.translating') : t('dossier.translate')}
              </button>
            ) : null}
            <button className="pbtn" onClick={onPrev} type="button" aria-label={t('dossier.prev')}>←</button>
            <button className="pbtn" onClick={onNext} type="button" aria-label={t('dossier.next')}>→</button>
            <button ref={closeRef} className="pbtn pbtn--close" onClick={onClose} type="button">{t('dossier.close')}</button>
          </div>
        </div>

        <div className="dossier__sheet" ref={sheetRef}>
          <div className="dossier__inner">
            <div className="dossier__crumbs">
              <EditableText as="span" text={metaString(entry, 'when')} placeholder={t('ph.when')} editing={editing} multiline={false} onCommit={(value) => setMeta('when', value)} />
              <span className="dot">·</span>
              <EditableText as="span" text={metaString(entry, 'where')} placeholder={t('ph.where')} editing={editing} multiline={false} onCommit={(value) => setMeta('where', value)} />
            </div>

            <EditableText
              as="h2"
              className="dossier__title"
              text={entry.title}
              placeholder={t('ph.title')}
              editing={editing}
              onCommit={(value) => onChange({ ...entry, title: value || entry.title })}
            />
            <EditableText
              as="p"
              className="dossier__lede"
              text={entry.summary}
              placeholder={t('ph.lede')}
              editing={editing}
              onCommit={(value) => onChange({ ...entry, summary: value })}
            />

            <div className="dossier__body">
              {blocks.map((block) => (
                <div
                  className={`db-block db-block--${block.type}`}
                  key={block.id}
                  data-block-id={block.id}
                  data-dragging={draggingBlock === block.id || undefined}
                  data-drop={dropTarget?.id === block.id ? (dropTarget.after ? 'after' : 'before') : undefined}
                >
                  {editing ? (
                    <div className="db-block__ctrl" data-nodrag>
                      <button className="db-block__drag" type="button" onPointerDown={(event) => startBlockDrag(event, block.id)} onPointerMove={movePointerBlockDrag} onPointerUp={finishPointerBlockDrag} onPointerCancel={clearBlockDrag} onLostPointerCapture={clearBlockDrag} onMouseDown={(event) => startMouseBlockDrag(event, block.id)} aria-label={t('dossier.dragBlock')} title={t('dossier.dragBlock')}>⠿</button>
                      <button className="db-block__add" type="button" onClick={() => addParagraphAfter(block.id)} aria-label={t('dossier.addParagraph')} title={t('dossier.addParagraph')}>+</button>
                      <button type="button" onClick={() => removeBlock(block.id)} aria-label={t('dossier.deleteBlock')}>✕</button>
                    </div>
                  ) : null}
                  {renderBlockBody(block)}
                </div>
              ))}
            </div>

            {editing ? (
              <div className="db-palette" data-nodrag>
                <span className="db-palette__lbl">{t('dossier.addBlock')}</span>
                {BLOCK_TYPES.map((type) => (
                  <button key={type} type="button" className="db-palette__btn" title={t(`block.${type}.hint`)} onClick={() => addBlock(type)}>+ {t(`block.${type}`).toLowerCase()}</button>
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
