// The dossier, pushed in from the right.
//
// The desktop article is a plate that lands on the slate with a scrim behind
// it; the phone one is a screen that slides over the walk and slides back off,
// with the heading of the screen it came from still readable in the bar. That
// is the difference between a modal and a stack, and on a phone the stack is
// the one people already know how to leave.
//
// It renders the same blocks the desktop dossier does, through the same
// `RichText`, under the same `db-*` classes — so the owner's article settings
// (measure, body face, leading, drop cap, block numbering) reach the phone
// unchanged. What it does not carry is the editor: on a phone this is a
// reading surface, and the whole editing apparatus stays on the desk.

import { useEffect, useRef } from 'react';
import type { ContentBlock, PortfolioEntry } from '../../types/content';
import { propPairList, propString, propStringList } from '../../lib/blocks';
import type { DossierConfig } from '../../lib/board';
import { isVideoMedia } from '../../lib/image-upload';
import { linksForLanguage, linksForLanguageAt } from '../../lib/rich-text';
import { RichText } from '../desk/RichText';
import { useUiText } from '../desk/ui-text-context';

type MobileArticleProps = {
  entry: PortfolioEntry;
  articles: PortfolioEntry[];
  activeLanguage: string;
  position: string;
  /** The screen the reader came from, printed in the bar so the way back is
   *  named rather than implied. */
  fromLabel: string;
  prevTitle: string;
  nextTitle: string;
  dossier: DossierConfig;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenArticle: (slug: string) => void;
};

function metaString(entry: PortfolioEntry, key: string): string {
  const value = entry.metadata[key];
  return typeof value === 'string' ? value : '';
}

const noop = () => undefined;

function BlockBody({ block, language, articles, onOpenArticle }: {
  block: ContentBlock;
  language: string;
  articles: PortfolioEntry[];
  onOpenArticle: (slug: string) => void;
}) {
  const t = useUiText();
  const text = propString(block, 'text');
  const prose = (as: 'h3' | 'div' | 'p', className: string) => (
    <RichText
      as={as}
      className={className}
      text={text}
      links={linksForLanguage(block.props.textLinks, language, text.length)}
      editing={false}
      articles={articles}
      onChange={noop}
      onOpenArticle={onOpenArticle}
    />
  );

  switch (block.type) {
    case 'heading':
      return prose('h3', 'db-heading');
    case 'callout':
      return prose('div', 'db-callout');
    case 'quote':
      return (
        <blockquote className="db-quote">
          {prose('p', '')}
          {propString(block, 'cite') ? <cite>{propString(block, 'cite')}</cite> : null}
        </blockquote>
      );
    case 'divider':
      return <hr className="db-divider" />;
    case 'list': {
      const items = propStringList(block, 'items');
      return (
        <ul className="db-list">
          {items.map((item, index) => (
            <li key={index}>
              <RichText
                as="span"
                className="db-list__item-text"
                text={item}
                links={linksForLanguageAt(block.props.itemTextLinks, language, index, item.length)}
                editing={false}
                articles={articles}
                onChange={noop}
                onOpenArticle={onOpenArticle}
              />
            </li>
          ))}
        </ul>
      );
    }
    case 'metrics':
      return (
        <div className="db-metrics">
          {propPairList(block, 'items').map((pair, index) => (
            <div className="db-metric" key={index}>
              <b>{pair[0]}</b>
              <span>{pair[1]}</span>
            </div>
          ))}
        </div>
      );
    case 'links':
      return (
        <div className="db-links">
          {propPairList(block, 'items').map((pair, index) => (
            pair[0] && pair[1]
              ? <a key={index} href={pair[1]} target="_blank" rel="noreferrer">{pair[0]} →</a>
              : null
          ))}
        </div>
      );
    case 'tags':
      return (
        <div className="db-tags">
          <span className="db-tags__lbl">{t('dossier.filedUnder')}</span>
          {propStringList(block, 'items').map((item, index) => <span className="db-tag" key={index}>{item}</span>)}
        </div>
      );
    case 'image': {
      const url = propString(block, 'url');
      const caption = propString(block, 'caption');
      if (!url) return null;
      return (
        <figure className="db-image">
          <div className="db-image__frame">
            {isVideoMedia(propString(block, 'mediaType'), url)
              ? <video className="m-article__media" src={url} controls playsInline preload="metadata" />
              : <img className="m-article__media" src={url} alt={propString(block, 'alt')} loading="lazy" decoding="async" />}
          </div>
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      );
    }
    default:
      return prose('p', 'db-text');
  }
}

export function MobileArticle({
  entry, articles, activeLanguage, position, fromLabel, prevTitle, nextTitle,
  dossier, onClose, onPrev, onNext, onOpenArticle,
}: MobileArticleProps) {
  const t = useUiText();
  const sheetRef = useRef<HTMLDivElement>(null);

  // A pushed screen starts at the top, whichever article it is showing: moving
  // to the next dossier while halfway down the previous one used to leave the
  // reader in the middle of a sentence they had not read.
  useEffect(() => { sheetRef.current?.scrollTo({ top: 0 }); }, [entry.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const blocks = [...entry.blocks].sort((a, b) => a.position - b.position);
  const when = metaString(entry, 'when');
  const where = metaString(entry, 'where');

  return (
    <div
      className="m-article"
      role="dialog"
      aria-modal="true"
      aria-label={entry.title}
      data-lede={dossier.lede}
      data-numbered={dossier.numbered ? 'true' : 'false'}
      data-dropcap={dossier.dropCap ? 'true' : 'false'}
    >
      <div className="m-bar m-bar--article">
        <button className="m-bar__back" type="button" onClick={onClose}>
          <span aria-hidden="true">‹</span>
          <span className="m-bar__back-label">{fromLabel || t('mobile.back')}</span>
        </button>
        <span className="m-bar__pos">{position}</span>
      </div>

      <div className="m-article__sheet" ref={sheetRef}>
        <article className="dossier__inner m-article__inner">
          {when || where ? (
            <div className="dossier__crumbs">
              {when ? <span>{when}</span> : null}
              {when && where ? <span className="dot">·</span> : null}
              {where ? <span>{where}</span> : null}
            </div>
          ) : null}
          <h1 className="dossier__title">{entry.title}</h1>
          {entry.summary ? <p className="dossier__lede">{entry.summary}</p> : null}

          <div className="dossier__body">
            {blocks.map((block) => (
              <div className={`db-block db-block--${block.type}`} key={block.id}>
                <BlockBody block={block} language={activeLanguage} articles={articles} onOpenArticle={onOpenArticle} />
              </div>
            ))}
          </div>

          <nav className="m-article__nav">
            <button type="button" onClick={onPrev}>
              <span className="k">← {t('dossier.prev')}</span>
              <span>{prevTitle}</span>
            </button>
            <button type="button" onClick={onNext}>
              <span className="k">{t('dossier.next')} →</span>
              <span>{nextTitle}</span>
            </button>
          </nav>
        </article>
      </div>
    </div>
  );
}
