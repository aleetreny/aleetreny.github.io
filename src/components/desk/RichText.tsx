import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
import { caretOffset, readEditable, useEditable } from './EditableText';
import { useUiText } from './ui-text-context';

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
  placeholder?: string;
  /** Enter splits the prose into two blocks instead of breaking the line. */
  onSplit?: (before: string, after: string) => void;
  autoFocus?: boolean;
  onChange: (text: string, links: TextLink[]) => void;
  onOpenArticle: (slug: string) => void;
};

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
export function RichText({
  as, className, style, text, links, editing, articles, placeholder,
  onSplit, autoFocus, onChange, onOpenArticle,
}: RichTextProps) {
  const t = useUiText();
  const rootRef = useRef<HTMLElement | null>(null);
  const linkerRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<SelectedTextRange | null>(null);
  const [activeLink, setActiveLink] = useState<TextLink | null>(null);
  const [destination, setDestination] = useState<'article' | 'external'>('external');
  const [articleSlugValue, setArticleSlugValue] = useState(articles[0]?.slug ?? '');
  const [externalHref, setExternalHref] = useState('');
  const [error, setError] = useState('');

  const editingRange = activeLink ?? selected;
  const selectedText = selected?.text ?? (activeLink ? text.slice(activeLink.start, activeLink.end) : '');

  // Line breaks and pastes are the shared editable's job; this component only
  // adds the link ranges on top.
  const { ref: bindEditable, generation, props: editableProps } = useEditable({
    editing,
    text,
    multiline: true,
    autoFocus,
    onSplit,
    onCommit: (next) => { if (next !== text) onChange(next, rebaseTextLinks(links, text, next)); },
  });

  useEffect(() => {
    if (!editing) return undefined;
    const dismissWhenSelectionLeaves = () => {
      const selection = window.getSelection();
      const root = rootRef.current;
      if (linkerRef.current?.contains(document.activeElement)) return;
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed || !root
        || !root.contains(selection.anchorNode) || !root.contains(selection.focusNode)) {
        setSelected(null);
        setActiveLink(null);
        setError('');
      }
    };
    document.addEventListener('selectionchange', dismissWhenSelectionLeaves);
    return () => document.removeEventListener('selectionchange', dismissWhenSelectionLeaves);
  }, [editing]);

  /** Note the selection so the link editor knows what it is linking.
   *
   *  This used to run on every keyup, which meant holding Shift+Arrow popped
   *  the link editor open on the way to simply replacing a word — and, worse,
   *  committed the text mid-keystroke, so React re-rendered the paragraph under
   *  the caret and the caret jumped to the front. Now the mouse has to finish
   *  its drag, or Shift has to be released, and nothing is committed here at
   *  all: the text reaches the model when the field is left, exactly like every
   *  other edit. */
  function captureSelection() {
    if (!editing || !rootRef.current) return;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (!rootRef.current.contains(range.startContainer) || !rootRef.current.contains(range.endContainer)) return;
    const currentText = readEditable(rootRef.current);
    const picked = selection.toString().replace(/\u00a0/g, ' ');
    let start: number | null = caretOffset(rootRef.current, range.startContainer, range.startOffset);
    let end: number | null = caretOffset(rootRef.current, range.endContainer, range.endOffset);
    const captured = start === null || end === null ? '' : currentText.slice(Math.min(start, end), Math.max(start, end));
    if (captured !== picked) {
      const repaired = locateSelectedText(currentText, picked, start ?? 0);
      if (!repaired) return;
      start = repaired.start;
      end = repaired.end;
    }
    if (start === null || end === null || start === end) return;
    setSelected({ start: Math.min(start, end), end: Math.max(start, end), text: picked });
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
    // While editing, the click is *not* swallowed: the caret lands where it was
    // aimed, so a typo inside a linked phrase can be fixed, and the link editor
    // opens alongside rather than instead of it.
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
      setError(destination === 'article' ? t('link.errArticle') : t('link.errUrl'));
      return;
    }
    const sourceText = rootRef.current ? readEditable(rootRef.current) : text;
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
        key={generation}
        className={className}
        style={style}
        data-placeholder={editing ? placeholder : undefined}
        ref={(node: HTMLElement | null) => { rootRef.current = node; bindEditable(node); }}
        {...editableProps}
        {...(editing ? {
          onMouseUp: captureSelection,
          onKeyUp: (event: React.KeyboardEvent) => { if (event.key === 'Shift') captureSelection(); },
        } : {})}
        onClick={handleLinkClick}
      >
        {textNodes(text, links)}
      </Tag>
      {editing && editingRange ? (
        <div className="db-linker" ref={linkerRef} data-nodrag role="group" aria-label={t('link.aria')}>
          <span className="db-linker__selection">“{selectedText}”</span>
          <label>
            {t('link.linkTo')}
            <select value={destination} onChange={(event) => { setDestination(event.target.value as 'article' | 'external'); setError(''); }}>
              <option value="external">{t('link.external')}</option>
              <option value="article" disabled={articles.length === 0}>{t('link.internal')}</option>
            </select>
          </label>
          {destination === 'article' ? (
            <label>
              {t('link.article')}
              <select value={articleSlugValue} onChange={(event) => { setArticleSlugValue(event.target.value); setError(''); }}>
                {articles.length === 0 ? <option value="">{t('link.noArticles')}</option> : null}
                {articles.map((article) => <option key={article.id} value={article.slug}>{article.title}</option>)}
              </select>
            </label>
          ) : (
            <label className="db-linker__url">
              {t('link.address')}
              <input type="url" value={externalHref} placeholder="https://example.com" onChange={(event) => { setExternalHref(event.target.value); setError(''); }} />
            </label>
          )}
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={applyLink}>{activeLink ? t('link.update') : t('link.add')}</button>
          {activeLink ? <button type="button" className="db-linker__remove" onMouseDown={(event) => event.preventDefault()} onClick={removeLink}>{t('link.remove')}</button> : null}
          <button type="button" className="db-linker__dismiss" onMouseDown={(event) => event.preventDefault()} onClick={() => { setSelected(null); setActiveLink(null); setError(''); }} aria-label={t('link.dismiss')}>×</button>
          {error ? <span className="db-linker__error">{error}</span> : null}
        </div>
      ) : null}
    </>
  );
}
