import siteSettingsFixture from '../../fixtures/site-settings.json';
import type { PortfolioEntry } from '../types/content';

export const BOARD_STYLE_IDS = ['blueprint', 'cork', 'graphite', 'slate', 'paper', 'midnight', 'sunset'] as const;
export type BoardStyle = (typeof BOARD_STYLE_IDS)[number];
export type CardTone = 'paper' | 'paperWarm' | 'paperCream' | 'dark' | 'slate' | 'amber' | 'custom';

/** The room the slate hangs in. `custom` uses the two backdrop colours. */
export const WALL_STYLE_IDS = ['plaster', 'concrete', 'studio', 'ink', 'warm', 'moss', 'void', 'custom'] as const;
export type WallStyle = (typeof WALL_STYLE_IDS)[number];

/** Where the board texture is painted: on the finite slate (it zooms with the
 *  board), across the whole viewport at constant density, or nowhere. */
export const GRID_MODES = ['plate', 'viewport', 'off'] as const;
export type GridMode = (typeof GRID_MODES)[number];

/** Everything behind the cards — wall, slate and its hardware. */
export type BackdropConfig = {
  wall: WallStyle;
  wallColor: string;
  wallColor2: string;
  /** 0..1 plaster grain over the wall. */
  grain: number;
  /** 0..1 corner darkening over the wall. */
  vignette: number;
  /** When false the board texture fills the viewport, as it did before. */
  plate: boolean;
  /** How far the slate reaches beyond the board box, in px. */
  plateMargin: number;
  /** Inset frame thickness on the slate, in px. */
  frame: number;
  /** 0..1.6 multiplier on the slate's drop shadow. */
  plateShadow: number;
  studs: boolean;
  studSize: number;
  /** How far the studs sit outside the board box, in px. */
  studInset: number;
  grid: GridMode;
  /** Multiplies the texture's pattern size on the slate. */
  gridScale: number;
};

export type ThemeConfig = {
  boardStyle: BoardStyle;
  chaos: number;
  showMarginalia: boolean;
  cardRadius: number;
  backdrop: BackdropConfig;
  fonts: { display: string; mono: string; scale: number };
  colors: {
    accent: string;
    accent2: string;
    signal: string;
    signalSoft: string;
    lab: string;
    paper: string;
    paperWarm: string;
    paperCream: string;
    ink: string;
    dark: string;
    slate: string;
    slateInk: string;
    darkInk: string;
  };
};

export type TagChip = string | { label: string; accent?: boolean };

export type BoardCard = {
  id: string;
  type: 'hero' | 'now' | 'drawer' | 'spotlight' | 'contact';
  jump?: string;
  open?: string;
  group?: string;
  x: number;
  y: number;
  rot: number;
  w: number;
  tone?: CardTone;
  kicker?: string;
  title?: string;
  subtitle?: string;
  intro?: string;
  name?: string;
  tags?: TagChip[];
  hint?: string;
  layout?: 'list' | 'grid' | 'compact' | 'notes' | 'atlas';
  maxItems?: number;
  stats?: Array<[string, string]>;
  tech?: string[];
  sweep?: boolean;
  /** Only used when tone === 'custom'. */
  bg?: string;
  ink?: string;
  label?: string;
  current?: string;
  next?: string;
  nextLabel?: string;
  currentTitle?: string;
  currentSub?: string;
  nextTitle?: string;
  nextSub?: string;
  blurb?: string;
  waveform?: boolean;
  footer?: string[] | string;
  footerLink?: [string, string];
  links?: Array<[string, string]>;
  note?: string;
  grid?: Array<[string, string]>;
  ruled?: boolean;
  bars?: boolean;
  barCaption?: string;
};

export type Polaroid = {
  id: string;
  x: number;
  y: number;
  rot: number;
  w: number;
  h: number;
  caption: string;
  hint?: string;
  tape?: boolean;
  placeholder?: string;
  assetId?: string;
  assetUrl?: string;
};

export type Marginal = {
  id: string;
  x: number;
  y: number;
  rot: number;
  w: number;
  style: 'amber' | 'paper-dashed';
  text: string;
};

/** A drawer list. Owner-editable: rename, create, delete, reorder. */
export type BoardGroup = { id: string; label: string };

export type BoardConfig = {
  size: { width: number; height: number };
  groups: BoardGroup[];
  cards: BoardCard[];
  polaroids: Polaroid[];
  marginalia: Marginal[];
};

export type LayoutOverride = { x: number; y: number; rot: number; w?: number };
export type LayoutMap = Record<string, LayoutOverride>;

const fixtureByKey = Object.fromEntries(
  (siteSettingsFixture as Array<{ key: string; value: unknown }>).map((row) => [row.key, row.value]),
);

/** Backdrop fallbacks, so a theme document saved before the slate existed —
 *  or one the owner half-filled — still resolves to a complete backdrop. */
export const DEFAULT_BACKDROP: BackdropConfig = {
  wall: 'plaster',
  wallColor: '#232629',
  wallColor2: '#0a0b0d',
  grain: 0.5,
  vignette: 0.55,
  plate: true,
  plateMargin: 58,
  frame: 10,
  plateShadow: 1,
  studs: true,
  studSize: 22,
  studInset: 34,
  grid: 'plate',
  gridScale: 1,
};

const fixtureTheme = fixtureByKey.theme as Partial<ThemeConfig> | undefined;

export const DEFAULT_THEME = {
  ...(fixtureTheme as ThemeConfig),
  backdrop: { ...DEFAULT_BACKDROP, ...(fixtureTheme?.backdrop ?? {}) },
} as ThemeConfig;
export const DEFAULT_BOARD = fixtureByKey.board as BoardConfig;
export const DEFAULT_LAYOUT = (fixtureByKey['board.layout'] ?? {}) as LayoutMap;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Deep-merge a stored theme document over the defaults so partial saves work. */
export function parseTheme(value: unknown): ThemeConfig {
  if (!isRecord(value)) return DEFAULT_THEME;
  const fonts = isRecord(value.fonts) ? value.fonts : {};
  const colors = isRecord(value.colors) ? value.colors : {};
  const backdrop = isRecord(value.backdrop) ? value.backdrop : {};
  return {
    boardStyle: (BOARD_STYLE_IDS as readonly string[]).includes(value.boardStyle as string)
      ? (value.boardStyle as BoardStyle)
      : DEFAULT_THEME.boardStyle,
    chaos: typeof value.chaos === 'number' ? value.chaos : DEFAULT_THEME.chaos,
    showMarginalia: typeof value.showMarginalia === 'boolean' ? value.showMarginalia : DEFAULT_THEME.showMarginalia,
    cardRadius: typeof value.cardRadius === 'number' ? value.cardRadius : DEFAULT_THEME.cardRadius,
    backdrop: { ...DEFAULT_THEME.backdrop, ...(backdrop as Partial<BackdropConfig>) },
    fonts: { ...DEFAULT_THEME.fonts, ...(fonts as Partial<ThemeConfig['fonts']>) },
    colors: { ...DEFAULT_THEME.colors, ...(colors as Partial<ThemeConfig['colors']>) },
  };
}

function isBoardGroup(value: unknown): value is BoardGroup {
  return isRecord(value) && typeof value.id === 'string' && typeof value.label === 'string';
}

export function parseBoard(value: unknown): BoardConfig {
  if (!isRecord(value) || !Array.isArray(value.cards)) return DEFAULT_BOARD;
  const groups = Array.isArray(value.groups) ? value.groups.filter(isBoardGroup) : [];
  return {
    size: isRecord(value.size)
      ? { width: Number(value.size.width) || DEFAULT_BOARD.size.width, height: Number(value.size.height) || DEFAULT_BOARD.size.height }
      : DEFAULT_BOARD.size,
    groups: groups.length > 0 ? groups : DEFAULT_BOARD.groups,
    cards: value.cards as BoardCard[],
    polaroids: Array.isArray(value.polaroids) ? (value.polaroids as Polaroid[]) : [],
    marginalia: Array.isArray(value.marginalia) ? (value.marginalia as Marginal[]) : [],
  };
}

export function parseLayout(value: unknown): LayoutMap {
  return isRecord(value) ? (value as LayoutMap) : {};
}

function metaString(entry: PortfolioEntry, key: string): string {
  const value = entry.metadata[key];
  return typeof value === 'string' ? value : '';
}

function metaNumber(entry: PortfolioEntry, key: string): number {
  const value = entry.metadata[key];
  return typeof value === 'number' ? value : 0;
}

export function entryGroup(entry: PortfolioEntry): string {
  return metaString(entry, 'group') || 'random';
}

/** Entries belonging to a drawer, ordered by their stored order index. */
export function entriesForGroup(entries: PortfolioEntry[], group: string): PortfolioEntry[] {
  return entries
    .filter((entry) => entryGroup(entry) === group)
    .sort((a, b) => metaNumber(a, 'order') - metaNumber(b, 'order'));
}

/** Board-wide dossier order: drawers in sequence, entries by order within each. */
export function dossierOrder(entries: PortfolioEntry[], groupIds: string[]): string[] {
  const order: string[] = [];
  for (const group of groupIds) {
    for (const entry of entriesForGroup(entries, group)) order.push(entry.slug);
  }
  // Any entry with an unknown group still gets a place at the end.
  for (const entry of entries) {
    if (!order.includes(entry.slug)) order.push(entry.slug);
  }
  return order;
}

/** Board texture presets.
 *
 *  `img`/`size` are the constant-density pattern painted across the viewport
 *  (grid mode `viewport`); `plateImg`/`plateSize` are the coarser pattern used
 *  on the slate, which scales with the zoom and so needs bigger cells to avoid
 *  turning into grain when the board is fitted. */
export type BoardTexture = { vp: string; img: string; size: string; plateImg: string; plateSize: string; ink: string };

export const BOARD_TEXTURES: Record<BoardStyle, BoardTexture> = {
  blueprint: {
    vp: 'radial-gradient(130% 110% at 26% -10%, #1b3346 0%, #132635 46%, #0b1620 100%)',
    img: 'linear-gradient(rgba(150,200,235,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(150,200,235,.10) 1px, transparent 1px), linear-gradient(rgba(150,200,235,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(150,200,235,.05) 1px, transparent 1px)',
    size: '160px 160px, 160px 160px, 32px 32px, 32px 32px',
    plateImg: 'linear-gradient(rgba(150,200,235,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(150,200,235,.10) 1px, transparent 1px)',
    plateSize: '168px 168px, 168px 168px',
    ink: '#eef4f8',
  },
  cork: {
    vp: 'radial-gradient(130% 110% at 30% -6%, #8a5f2c 0%, #6f4a21 48%, #4c3115 100%)',
    img: 'radial-gradient(rgba(255,235,200,.10) 1.2px, transparent 1.6px), radial-gradient(rgba(60,34,10,.20) 1.4px, transparent 1.8px), linear-gradient(rgba(255,235,200,.05) 1px, transparent 1px)',
    size: '18px 18px, 27px 27px, 150px 150px',
    plateImg: 'radial-gradient(rgba(255,235,200,.10) 2px, transparent 2.6px), radial-gradient(rgba(60,34,10,.20) 2.2px, transparent 2.8px)',
    plateSize: '30px 30px, 44px 44px',
    ink: '#fdf3df',
  },
  graphite: {
    vp: 'radial-gradient(130% 110% at 24% -8%, #2a2a2c 0%, #1d1d1f 50%, #121213 100%)',
    img: 'linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)',
    size: '120px 120px, 120px 120px',
    plateImg: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
    plateSize: '150px 150px, 150px 150px',
    ink: '#f2f0ea',
  },
  slate: {
    vp: 'radial-gradient(130% 110% at 28% -8%, #2e3a38 0%, #24302e 46%, #172120 100%)',
    img: 'radial-gradient(rgba(255,255,255,.055) 1px, transparent 1.4px), linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)',
    size: '26px 26px, 130px 130px, 130px 130px',
    plateImg: 'radial-gradient(rgba(255,255,255,.05) 1.6px, transparent 2.2px), linear-gradient(rgba(255,255,255,.026) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.026) 1px, transparent 1px)',
    plateSize: '42px 42px, 168px 168px, 168px 168px',
    ink: '#f0ece1',
  },
  paper: {
    vp: 'radial-gradient(130% 110% at 26% -10%, #f7f2e6 0%, #efe8d6 46%, #e6dcc4 100%)',
    img: 'radial-gradient(rgba(23,21,15,.09) 1.2px, transparent 1.6px), linear-gradient(rgba(23,21,15,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,21,15,.05) 1px, transparent 1px)',
    size: '20px 20px, 140px 140px, 140px 140px',
    plateImg: 'radial-gradient(rgba(23,21,15,.08) 1.8px, transparent 2.4px), linear-gradient(rgba(23,21,15,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(23,21,15,.045) 1px, transparent 1px)',
    plateSize: '32px 32px, 180px 180px, 180px 180px',
    ink: '#171510',
  },
  midnight: {
    vp: 'radial-gradient(130% 110% at 24% -10%, #0c1220 0%, #070a12 50%, #030408 100%)',
    img: 'radial-gradient(rgba(255,255,255,.09) 1px, transparent 1.4px), radial-gradient(rgba(255,255,255,.04) 1px, transparent 1.6px)',
    size: '90px 90px, 220px 220px',
    plateImg: 'radial-gradient(rgba(255,255,255,.08) 1.4px, transparent 2px)',
    plateSize: '110px 110px',
    ink: '#eef1f8',
  },
  sunset: {
    vp: 'radial-gradient(130% 110% at 30% -10%, #6a2f3a 0%, #4a2032 46%, #2c1424 100%)',
    img: 'radial-gradient(rgba(255,214,170,.12) 1.2px, transparent 1.6px), linear-gradient(rgba(255,214,170,.05) 1px, transparent 1px)',
    size: '22px 22px, 150px 150px',
    plateImg: 'radial-gradient(rgba(255,214,170,.11) 1.8px, transparent 2.4px)',
    plateSize: '36px 36px',
    ink: '#fbe9dc',
  },
};

/** Wall gradients — the room the slate is hung in. */
export const WALLS: Record<Exclude<WallStyle, 'custom'>, string> = {
  plaster: 'radial-gradient(120% 100% at 50% -25%, #232629 0%, #15171a 52%, #0a0b0d 100%)',
  concrete: 'radial-gradient(120% 100% at 50% -20%, #3b3e42 0%, #26282b 50%, #131417 100%)',
  studio: 'radial-gradient(120% 100% at 50% -25%, #f3f0e9 0%, #ddd8cc 52%, #bcb6a7 100%)',
  ink: 'radial-gradient(120% 100% at 50% -25%, #17243b 0%, #0d1424 52%, #05080f 100%)',
  warm: 'radial-gradient(120% 100% at 50% -25%, #3c2e23 0%, #261c15 52%, #120c08 100%)',
  moss: 'radial-gradient(120% 100% at 50% -25%, #24312b 0%, #16211c 52%, #080d0b 100%)',
  void: 'radial-gradient(120% 100% at 50% -25%, #101011 0%, #060607 52%, #000 100%)',
};

/** What the viewport is painted with. Without a slate the board texture fills
 *  the whole viewport, exactly as it did before the slate existed. */
export function wallBackground(backdrop: BackdropConfig, texture: BoardTexture): string {
  if (!backdrop.plate) return texture.vp;
  if (backdrop.wall === 'custom') {
    return `radial-gradient(120% 100% at 50% -25%, ${backdrop.wallColor} 0%, ${backdrop.wallColor2} 100%)`;
  }
  return WALLS[backdrop.wall] ?? WALLS.plaster;
}

/** Scale every length in a `background-size` list by `factor`. */
export function scalePatternSize(size: string, factor: number): string {
  if (factor === 1) return size;
  return size
    .split(',')
    .map((piece) => piece
      .trim()
      .split(/\s+/)
      .map((value) => `${Math.round(parseFloat(value) * factor * 100) / 100}px`)
      .join(' '))
    .join(', ');
}

/** CSS custom properties derived from a theme, applied on the viewport. */
export function themeVars(theme: ThemeConfig): Record<string, string> {
  const c = theme.colors;
  return {
    '--font-display': theme.fonts.display,
    '--font-mono': theme.fonts.mono,
    '--font-scale': String(theme.fonts.scale),
    '--card-radius': `${theme.cardRadius}px`,
    '--c-accent': c.accent,
    '--c-accent2': c.accent2,
    '--c-signal': c.signal,
    '--c-signal-soft': c.signalSoft,
    '--c-lab': c.lab,
    '--c-paper': c.paper,
    '--c-paper-warm': c.paperWarm,
    '--c-paper-cream': c.paperCream,
    '--c-ink': c.ink,
    '--c-dark': c.dark,
    '--c-slate': c.slate,
    '--c-slate-ink': c.slateInk,
    '--c-dark-ink': c.darkInk,
  };
}
