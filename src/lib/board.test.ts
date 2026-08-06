import { describe, expect, it } from 'vitest';
import {
  DEFAULT_THEME,
  dossierOrder,
  entriesForGroup,
  parseBoard,
  parseLayout,
  parseTheme,
  themeVars,
} from './board';
import type { PortfolioEntry } from '../types/content';

function entry(slug: string, group: string, order: number): PortfolioEntry {
  return {
    id: `id-${slug}`,
    version: 1,
    slug,
    title: `Title ${slug}`,
    summary: 'Lede',
    entryType: 'note',
    status: 'published',
    publishedAt: '2026-08-05T00:00:00.000Z',
    metadata: { group, order, when: '2025', where: 'Madrid', stats: [['1', 'a']], tags: ['x'], links: [] },
    blocks: [
      { id: `${slug}-1`, type: 'text', position: 1, props: { text: 'second' }, layout: {} },
      { id: `${slug}-0`, type: 'text', position: 0, props: { text: 'first' }, layout: {} },
    ],
  };
}

describe('board settings parsing', () => {
  it('merges a partial theme over the defaults', () => {
    const theme = parseTheme({ colors: { accent: '#ff0000' }, boardStyle: 'cork' });
    expect(theme.boardStyle).toBe('cork');
    expect(theme.colors.accent).toBe('#ff0000');
    expect(theme.colors.paper).toBe(DEFAULT_THEME.colors.paper);
    expect(theme.fonts.display).toBe(DEFAULT_THEME.fonts.display);
  });

  it('falls back to the default board on malformed input', () => {
    expect(parseBoard(null).cards.length).toBeGreaterThan(0);
    expect(parseLayout('nope')).toEqual({});
  });

  it('exposes every colour as a CSS variable', () => {
    const vars = themeVars(DEFAULT_THEME);
    expect(vars['--c-accent']).toBe(DEFAULT_THEME.colors.accent);
    expect(vars['--font-display']).toBe(DEFAULT_THEME.fonts.display);
  });
});

describe('board derivations', () => {
  const entries = [entry('b', 'work', 1), entry('a', 'work', 0), entry('c', 'edu', 0)];

  it('orders drawer entries by their stored order', () => {
    expect(entriesForGroup(entries, 'work').map((item) => item.slug)).toEqual(['a', 'b']);
  });

  it('builds a stable dossier order across drawers', () => {
    expect(dossierOrder(entries)).toEqual(['a', 'b', 'c']);
  });
});
