import { describe, expect, it } from 'vitest';
import {
  BOARD_STYLE_IDS,
  BOARD_TEXTURES,
  DEFAULT_BACKDROP,
  DEFAULT_BOARD,
  DEFAULT_THEME,
  WALLS,
  dossierOrder,
  entriesForGroup,
  parseBoard,
  parseLayout,
  parseTheme,
  scalePatternSize,
  themeVars,
  wallBackground,
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
    expect(parseBoard(null).groups.length).toBeGreaterThan(0);
    expect(parseLayout('nope')).toEqual({});
  });

  it('accepts a custom list of groups and rejects malformed ones', () => {
    const board = parseBoard({ cards: [], groups: [{ id: 'x', label: 'X' }, { id: 2, label: 'bad' }] });
    expect(board.groups).toEqual([{ id: 'x', label: 'X' }]);
    const fallback = parseBoard({ cards: [], groups: [] });
    expect(fallback.groups).toEqual(DEFAULT_BOARD.groups);
  });

  it('exposes every colour as a CSS variable', () => {
    const vars = themeVars(DEFAULT_THEME);
    expect(vars['--c-accent']).toBe(DEFAULT_THEME.colors.accent);
    expect(vars['--font-display']).toBe(DEFAULT_THEME.fonts.display);
  });

  it('completes a backdrop saved before the slate existed', () => {
    const theme = parseTheme({ boardStyle: 'slate', backdrop: { wall: 'ink', studs: false } });
    expect(theme.backdrop.wall).toBe('ink');
    expect(theme.backdrop.studs).toBe(false);
    expect(theme.backdrop.plate).toBe(DEFAULT_BACKDROP.plate);
    expect(theme.backdrop.plateMargin).toBe(DEFAULT_BACKDROP.plateMargin);
    // A theme document with no backdrop at all still resolves to a full one.
    expect(parseTheme({ chaos: 0 }).backdrop).toEqual(DEFAULT_THEME.backdrop);
  });
});

describe('backdrop rendering', () => {
  it('hangs the slate on a wall, or lets the texture fill the viewport', () => {
    const texture = BOARD_TEXTURES.slate;
    const onWall = wallBackground({ ...DEFAULT_BACKDROP, wall: 'ink' }, texture);
    expect(onWall).toBe(WALLS.ink);
    // No slate means today's board: the texture is the viewport, edge to edge.
    expect(wallBackground({ ...DEFAULT_BACKDROP, plate: false }, texture)).toBe(texture.vp);
  });

  it('builds a custom wall from the two backdrop colours', () => {
    const wall = wallBackground({ ...DEFAULT_BACKDROP, wall: 'custom', wallColor: '#123456', wallColor2: '#000000' }, BOARD_TEXTURES.slate);
    expect(wall).toContain('#123456');
    expect(wall).toContain('#000000');
  });

  it('scales every length in a pattern size list', () => {
    expect(scalePatternSize('42px 42px, 168px 168px', 1)).toBe('42px 42px, 168px 168px');
    expect(scalePatternSize('42px 42px, 168px 168px', 2)).toBe('84px 84px, 336px 336px');
    expect(scalePatternSize('20px 20px', 0.5)).toBe('10px 10px');
  });

  it('gives every texture a coarser pattern for the slate', () => {
    for (const style of BOARD_STYLE_IDS) {
      const texture = BOARD_TEXTURES[style];
      // Layer count has to match, or background-size lines up with the wrong image.
      expect(texture.plateImg.split('),').length, style).toBe(texture.plateSize.split(',').length);
      expect(texture.img.split('),').length, style).toBe(texture.size.split(',').length);
    }
  });
});

describe('board derivations', () => {
  const entries = [entry('b', 'work', 1), entry('a', 'work', 0), entry('c', 'edu', 0)];

  it('orders drawer entries by their stored order', () => {
    expect(entriesForGroup(entries, 'work').map((item) => item.slug)).toEqual(['a', 'b']);
  });

  it('builds a stable dossier order across drawers', () => {
    expect(dossierOrder(entries, ['work', 'edu'])).toEqual(['a', 'b', 'c']);
  });

  it('appends entries whose group is missing from the given order', () => {
    // entries not covered by groupIds keep their original relative order.
    expect(dossierOrder(entries, ['edu'])).toEqual(['c', 'b', 'a']);
  });
});
