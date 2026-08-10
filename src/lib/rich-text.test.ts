import { describe, expect, it } from 'vitest';
import {
  addTextLink,
  articleHref,
  articleSlug,
  linksForLanguageAt,
  linksForLanguage,
  normaliseExternalHref,
  normaliseTextLinks,
  removeLinksForLanguageAt,
  rebaseTextLinks,
  setLinksForLanguageAt,
  setLinksForLanguage,
} from './rich-text';

describe('article prose links', () => {
  it('only accepts safe external web addresses', () => {
    expect(normaliseExternalHref('example.com/work')).toBe('https://example.com/work');
    expect(normaliseExternalHref('https://example.com/path?q=1')).toBe('https://example.com/path?q=1');
    expect(normaliseExternalHref('javascript:alert(1)')).toBeNull();
    expect(normaliseExternalHref('data:text/html,no')).toBeNull();
  });

  it('uses a dedicated, validated target for another portfolio article', () => {
    expect(articleHref('treasury-study')).toBe('article:treasury-study');
    expect(articleSlug('article:treasury-study')).toBe('treasury-study');
    expect(articleHref('../unsafe')).toBeNull();
  });

  it('filters malformed and overlapping ranges before display', () => {
    expect(normaliseTextLinks([
      { start: 0, end: 4, href: 'https://example.com' },
      { start: 2, end: 5, href: 'https://example.net' },
      { start: 8, end: 20, href: 'https://example.org' },
      { start: 5, end: 7, href: 'javascript:alert(1)' },
    ], 10)).toEqual([{ start: 0, end: 4, href: 'https://example.com' }]);
  });

  it('replaces overlapping links and keeps the rest when a range is added', () => {
    expect(addTextLink([
      { start: 0, end: 3, href: 'https://one.example' },
      { start: 5, end: 8, href: 'https://two.example' },
    ], 2, 6, 'article:case-study', 10)).toEqual([
      { start: 2, end: 6, href: 'article:case-study' },
    ]);
  });

  it('keeps links in untouched text when prose changes', () => {
    const links = [
      { start: 0, end: 4, href: 'https://one.example' },
      { start: 10, end: 14, href: 'https://two.example' },
    ];
    expect(rebaseTextLinks(links, 'link then tail', 'link longer then tail')).toEqual([
      { start: 0, end: 4, href: 'https://one.example' },
      { start: 17, end: 21, href: 'https://two.example' },
    ]);
  });

  it('keeps link ranges isolated to their article language', () => {
    const es = [{ start: 0, end: 4, href: 'article:nota' }];
    const saved = setLinksForLanguage({ en: [{ start: 0, end: 4, href: 'https://example.com' }] }, 'es', es);
    expect(linksForLanguage(saved, 'es', 4)).toEqual(es);
    expect(linksForLanguage(saved, 'en', 4)).toEqual([{ start: 0, end: 4, href: 'https://example.com' }]);
  });

  it('keeps list-item links isolated by language and item', () => {
    const saved = setLinksForLanguageAt({}, 'es', 1, [{ start: 0, end: 4, href: 'article:nota' }]);
    expect(linksForLanguageAt(saved, 'es', 0, 4)).toEqual([]);
    expect(linksForLanguageAt(saved, 'es', 1, 4)).toEqual([{ start: 0, end: 4, href: 'article:nota' }]);
    expect(removeLinksForLanguageAt(saved, 'es', 0).es).toEqual([[{ start: 0, end: 4, href: 'article:nota' }]]);
  });
});
