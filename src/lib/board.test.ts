import { describe, expect, it } from 'vitest';
import {
  BOARD_STYLE_IDS,
  BOARD_TEXTURES,
  DEFAULT_BACKDROP,
  DEFAULT_BOARD,
  DEFAULT_THEME,
  PATTERN_STYLES,
  THEME_PRESETS,
  WALLS,
  dossierOrder,
  entriesForGroup,
  parseBoard,
  parseLayout,
  parseTheme,
  patternLayers,
  scalePatternSize,
  slateBackground,
  slateInk,
  themeVars,
  tintLuminance,
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

describe('a slate of any colour', () => {
  const texture = BOARD_TEXTURES.slate;

  it('keeps the board style until a colour is chosen', () => {
    expect(slateBackground(DEFAULT_BACKDROP, texture)).toBe(texture.vp);
    expect(slateInk(DEFAULT_BACKDROP, texture)).toBe(texture.ink);
  });

  it('paints the chosen colour, edge falling back to centre', () => {
    const one = slateBackground({ ...DEFAULT_BACKDROP, slate: '#fdf6e3' }, texture);
    expect(one).toContain('#fdf6e3');
    const two = slateBackground({ ...DEFAULT_BACKDROP, slate: '#fdf6e3', slate2: '#eee8d5' }, texture);
    expect(two).toContain('#eee8d5');
  });

  it('writes dark on a pale slate and pale on a dark one', () => {
    expect(tintLuminance('#fdf6e3')).toBeGreaterThan(0.55);
    expect(tintLuminance('#282a36')).toBeLessThan(0.55);
    expect(tintLuminance('#fff')).toBeCloseTo(1, 2);
    expect(tintLuminance('not a colour')).toBe(0);
    expect(slateInk({ ...DEFAULT_BACKDROP, slate: '#fdf6e3' }, texture)).toBe('#16150f');
    expect(slateInk({ ...DEFAULT_BACKDROP, slate: '#1a1b26' }, texture)).toBe('#f4f1e8');
    // An explicit choice always wins.
    expect(slateInk({ ...DEFAULT_BACKDROP, slate: '#fdf6e3', slateInk: '#ff0000' }, texture)).toBe('#ff0000');
  });
});

describe('slate patterns', () => {
  const texture = BOARD_TEXTURES.slate;
  const at = (over: Partial<typeof DEFAULT_BACKDROP>) => patternLayers({ ...DEFAULT_BACKDROP, ...over }, texture, true);

  it('defers to the board texture by default', () => {
    expect(at({}).image).toBe(texture.plateImg);
  });

  it('draws nothing when asked for nothing', () => {
    expect(at({ pattern: 'none' }).image).toBe('none');
  });

  it('keeps image and size layer counts in step for every pattern', () => {
    for (const pattern of PATTERN_STYLES) {
      const { image, size } = at({ pattern, slate: '#2e3a38' });
      if (image === 'none' || size === 'auto') continue;
      // Split on the top level only: gradients contain commas of their own.
      const images = image.split(/\),\s*(?=[a-z-]+gradient)/).length;
      expect(images, pattern).toBe(size.split(',').length);
    }
  });

  it('flips the ink so a pattern survives on a pale slate', () => {
    // Auto follows the slate: dark lines on cream, light lines on charcoal.
    expect(at({ pattern: 'grid', slate: '#fdf6e3' }).image).toContain('23,21,15');
    expect(at({ pattern: 'grid', slate: '#1a1b26' }).image).toContain('255,255,255');
    // And an explicit choice overrides it.
    expect(at({ pattern: 'grid', slate: '#fdf6e3', patternInk: 'light' }).image).toContain('255,255,255');
  });

  it('fades to nothing and scales with the board', () => {
    expect(at({ pattern: 'dots', patternFade: 0 }).image).toContain(',0)');
    expect(at({ pattern: 'dots', gridScale: 2 }).size)
      .not.toBe(at({ pattern: 'dots', gridScale: 1 }).size);
  });
});

describe('the looks', () => {
  it('offers light boards as well as dark ones', () => {
    const slates = THEME_PRESETS.map((p) => p.patch(DEFAULT_THEME).backdrop.slate).filter(Boolean);
    expect(slates.filter((s) => tintLuminance(s) > 0.55).length).toBeGreaterThanOrEqual(3);
    expect(slates.filter((s) => tintLuminance(s) <= 0.2).length).toBeGreaterThanOrEqual(5);
  });

  it('gives every look its own accent and its own palette as a whole', () => {
    const themes = THEME_PRESETS.map((p) => p.patch(DEFAULT_THEME));
    // The accent is the colour a visitor reads the board by, so no two share it.
    expect(new Set(themes.map((t) => t.colors.accent)).size).toBe(THEME_PRESETS.length);
    // Individual channels may coincide — Dracula and Monokai really do both use
    // #f8f8f2 — but no two looks may resolve to the same palette.
    const fingerprint = themes.map((t) => [
      t.colors.paper, t.colors.ink, t.colors.accent, t.colors.signal,
      t.backdrop.slate, t.backdrop.wallColor,
    ].join('|'));
    expect(new Set(fingerprint).size).toBe(THEME_PRESETS.length);
  });

  it('lands in the same place however you got there', () => {
    // Applying B after A must equal applying B on its own, or a look would
    // inherit leftovers from whatever was tried before it.
    const first = THEME_PRESETS[0];
    for (const preset of THEME_PRESETS) {
      const direct = preset.patch(DEFAULT_THEME);
      const after = preset.patch(first.patch(DEFAULT_THEME));
      expect(after, preset.id).toEqual(direct);
    }
  });

  it('never touches the board, the tour or the owner’s typeface', () => {
    const fonts = { ...DEFAULT_THEME.fonts, display: 'Comic Sans', scale: 1.4 };
    for (const preset of THEME_PRESETS) {
      expect(preset.patch({ ...DEFAULT_THEME, fonts }).fonts, preset.id).toEqual(fonts);
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
