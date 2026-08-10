import { useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { PortfolioEntry } from '../../types/content';
import {
  addTextLink,
  articleHref,
  articleSlug,
  locateSelectedText,
  normaliseExternalHref,
  rebaseTextLinks,
  removeTextLink,
  type TextLink,
} from '../../lib/rich-text';

type RichTextTag = 'h3' | 'div' | 'p' | 'span';

type TextRange = Pick<TextLink, 'start' | 'end'>;
type SelectedTextRange = TextRange & { text: string };

type RichTextProps = {
  as: RichTextTag;
  className: string;
  style?: CSSProperties;
  text: string;
  links: TextLink[];
  editing: boolean;
  articles: PortfolioEntry[];
  onChange: (text: string, links: TextLink[]) => void;
  onOpenArticle: (slug: string) => void;
};

function rangeOffset(root: HTMLElement, node: Node, offset: number): number | null {
  if (node.nodeType === Node.TEXT_NODE) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let total = 0;
    let current = walker.nextNode();
    while (current) {
      const length = current.textContent?.length ?? 0;
      if (current === node) return total + Math.min(offset, length);
      total += length;
      current = walker.nextNode();
    }
  }
  return null;
}

function textNodes(text: string, links: TextLink[]): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  for (const link of links) {
    if (cursor < link.start) nodes.push(text.slice(cursor, link.start));
    const article = articleSlug(link.href);
    nodes.push(
      <a
        className="db-inline-link"
        href={article ? `#article-${article}` : link.href}
        key={`${link.start}-${link.end}-${link.href}`}
        target={article ? undefined : '_blank'}
        rel={article ? undefined : 'noreferrer'}
        data-rich-link
        data-link-start={link.start}
        data-link-end={link.end}
        data-link-href={link.href}
      >
        {text.slice(link.start, link.end)}
      </a>,
    );
    cursor = link.end;
  }
  if (cursor < text.length || nodes.length === 0) nodes.push(text.slice(cursor));
  return nodes;
}

/** Inline article prose with links held as text ranges rather than HTML. */
export function RichText({ as, className, style, text, links, editing, articles, onChange, onOpenArticle }: RichTextProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [selected, setSelected] = useState<SelectedTextRange | null>(null);
  const [activeLink, setActiveLink] = useState<TextLink | null>(null);
  const [destination, setDestination] = useState<'article' | 'external'>('external');
  const [articleSlugValue, setArticleSlugValue] = useState(articles[0]?.slug ?? '');
  const [externalHref, setExternalHref] = useState('');
  const [error, setError] = useState('');

  const editingRange = activeLink ?? selected;
  const selectedText = selected?.text ?? (activeLink ? text.slice(activeLink.start, activeLink.end) : '');

  function saveText() {
    const nextText = rootRef.current?.textContent?.replace(/\u00a0/g, ' ') ?? text;
    if (nextText !== text) onChange(nextText, rebaseTextLinks(links, text, nextText));
  }

  function captureSelection() {
    if (!editing || !rootRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!rootRef.current.contains(range.startContainer) || !rootRef.current.contains(range.endContainer)) return;
    const currentText = rootRef.current.textContent?.replace(/\u00a0/g, ' ') ?? text;
    const selectedText = selection.toString().replace(/\u00a0/g, ' ');
    let start = rangeOffset(rootRef.current, range.startContainer, range.startOffset);
    let end = rangeOffset(rootRef.current, range.endContainer, range.endOffset);
    const captured = start === null || end === null ? '' : currentText.slice(Math.min(start, end), Math.max(start, end));
    if (captured !== selectedText) {
      const repaired = locateSelectedText(currentText, selectedText, start ?? 0);
      if (!repaired) return;
      start = repaired.start;
      end = repaired.end;
    }
    if (start === null || end === null || start === end) return;
    if (currentText !== text) onChange(currentText, rebaseTextLinks(links, text, currentText));
    setSelected({ start: Math.min(start, end), end: Math.max(start, end), text: selectedText });
    setActiveLink(null);
    setDestination('external');
    setExternalHref('');
    setError('');
  }

  function handleLinkClick(event: React.MouseEvent<HTMLElement>) {
    const source = event.target as HTMLElement;
    const anchor = source.closest<HTMLAnchorElement>('a[data-rich-link]');
    if (!anchor || !rootRef.current?.contains(anchor)) return;
    const internalSlug = articleSlug(anchor.dataset.linkHref ?? '');
    if (!editing && internalSlug) {
      event.preventDefault();
      onOpenArticle(internalSlug);
      return;
    }
    if (!editing) return;

    event.preventDefault();
    const start = Number(anchor.dataset.linkStart);
    const end = Number(anchor.dataset.linkEnd);
    const href = anchor.dataset.linkHref ?? '';
    if (!Number.isInteger(start) || !Number.isInteger(end)) return;
    setSelected(null);
    setActiveLink({ start, end, href });
    setDestination(internalSlug ? 'article' : 'external');
    setArticleSlugValue(internalSlug ?? articles[0]?.slug ?? '');
    setExternalHref(internalSlug ? '' : href);
    setError('');
  }

  function applyLink() {
    if (!editingRange) return;
    const href = destination === 'article'
      ? articleHref(articleSlugValue)
      : normaliseExternalHref(externalHref);
    if (!href) {
      setError(destination === 'article' ? 'Choose an article.' : 'Enter a valid web address.');
      return;
    }
    const sourceText = selected?.text !== undefined ? rootRef.current?.textContent?.replace(/\u00a0/g, ' ') ?? text : text;
    const sourceLinks = sourceText === text ? links : rebaseTextLinks(links, text, sourceText);
    onChange(sourceText, addTextLink(sourceLinks, editingRange.start, editingRange.end, href, sourceText.length));
    setSelected(null);
    setActiveLink(null);
    setError('');
  }

  function removeLink() {
    if (!activeLink) return;
    onChange(text, removeTextLink(links, activeLink));
    setActiveLink(null);
    setSelected(null);
    setError('');
  }

  const Tag = as;
  return (
    <>
      <Tag
        className={className}
        style={style}
        ref={(node: HTMLElement | null) => { rootRef.current = node; }}
        {...(editing ? {
          contentEditable: true,
          suppressContentEditableWarning: true,
          'data-nodrag': '',
          onBlur: saveText,
          onMouseUp: captureSelection,
          onKeyUp: captureSelection,
        } : {})}
        onClick={handleLinkClick}
      >
        {textNodes(text, links)}
      </Tag>
      {editing && editingRange ? (
        <div className="db-linker" data-nodrag role="group" aria-label="Link selected text">
          <span className="db-linker__selection">“{selectedText}”</span>
          <label>
            link to
            <select value={destination} onChange={(event) => { setDestination(event.target.value as 'article' | 'external'); setError(''); }}>
              <option value="external">external website</option>
              <option value="article" disabled={articles.length === 0}>another article</option>
            </select>
          </label>
          {destination === 'article' ? (
            <label>
              article
              <select value={articleSlugValue} onChange={(event) => { setArticleSlugValue(event.target.value); setError(''); }}>
                {articles.length === 0 ? <option value="">No published articles</option> : null}
                {articles.map((article) => <option key={article.id} value={article.slug}>{article.title}</option>)}
              </select>
            </label>
          ) : (
            <label className="db-linker__url">
              web address
              <input type="url" value={externalHref} placeholder="https://example.com" onChange={(event) => { setExternalHref(event.target.value); setError(''); }} />
            </label>
          )}
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={applyLink}>{activeLink ? 'update link' : 'add link'}</button>
          {activeLink ? <button type="button" className="db-linker__remove" onMouseDown={(event) => event.preventDefault()} onClick={removeLink}>remove</button> : null}
          <button type="button" className="db-linker__dismiss" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSelected(null); setActiveLink(null); setError(''); }} aria-label="Dismiss link editor">×</button>
          {error ? <span className="db-linker__error">{error}</span> : null}
        </div>
      ) : null}
    </>
  );
}
