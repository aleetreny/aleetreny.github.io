import siteSettingsFixture from '../../fixtures/site-settings.json';
import type { PortfolioEntry } from '../types/content';

export const BOARD_STYLE_IDS = ['blueprint', 'cork', 'graphite', 'slate', 'paper', 'midnight', 'sunset'] as const;
export type BoardStyle = (typeof BOARD_STYLE_IDS)[number];
export type CardTone = 'paper' | 'paperWarm' | 'paperCream' | 'dark' | 'slate' | 'amber' | 'custom';

export type ThemeConfig = {
  boardStyle: BoardStyle;
  chaos: number;
  showMarginalia: boolean;
  cardRadius: number;
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

export const DEFAULT_THEME = fixtureByKey.theme as ThemeConfig;
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
  return {
    boardStyle: (BOARD_STYLE_IDS as readonly string[]).includes(value.boardStyle as string)
      ? (value.boardStyle as BoardStyle)
      : DEFAULT_THEME.boardStyle,
    chaos: typeof value.chaos === 'number' ? value.chaos : DEFAULT_THEME.chaos,
    showMarginalia: typeof value.showMarginalia === 'boolean' ? value.showMarginalia : DEFAULT_THEME.showMarginalia,
    cardRadius: typeof value.cardRadius === 'number' ? value.cardRadius : DEFAULT_THEME.cardRadius,
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

/** Board texture presets (viewport gradient + grid image + ink colour). */
export const BOARD_TEXTURES: Record<BoardStyle, { vp: string; img: string; size: string; ink: string }> = {
  blueprint: {
    vp: 'radial-gradient(130% 110% at 26% -10%, #1b3346 0%, #132635 46%, #0b1620 100%)',
    img: 'linear-gradient(rgba(150,200,235,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(150,200,235,.10) 1px, transparent 1px), linear-gradient(rgba(150,200,235,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(150,200,235,.05) 1px, transparent 1px)',
    size: '160px 160px, 160px 160px, 32px 32px, 32px 32px',
    ink: '#eef4f8',
  },
  cork: {
    vp: 'radial-gradient(130% 110% at 30% -6%, #8a5f2c 0%, #6f4a21 48%, #4c3115 100%)',
    img: 'radial-gradient(rgba(255,235,200,.10) 1.2px, transparent 1.6px), radial-gradient(rgba(60,34,10,.20) 1.4px, transparent 1.8px), linear-gradient(rgba(255,235,200,.05) 1px, transparent 1px)',
    size: '18px 18px, 27px 27px, 150px 150px',
    ink: '#fdf3df',
  },
  graphite: {
    vp: 'radial-gradient(130% 110% at 24% -8%, #2a2a2c 0%, #1d1d1f 50%, #121213 100%)',
    img: 'linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.055) 1px, transparent 1px)',
    size: '120px 120px, 120px 120px',
    ink: '#f2f0ea',
  },
  slate: {
    vp: 'radial-gradient(130% 110% at 28% -8%, #2e3a38 0%, #24302e 46%, #172120 100%)',
    img: 'radial-gradient(rgba(255,255,255,.055) 1px, transparent 1.4px), linear-gradient(rgba(255,255,255,.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.028) 1px, transparent 1px)',
    size: '26px 26px, 130px 130px, 130px 130px',
    ink: '#f0ece1',
  },
  paper: {
    vp: 'radial-gradient(130% 110% at 26% -10%, #f7f2e6 0%, #efe8d6 46%, #e6dcc4 100%)',
    img: 'radial-gradient(rgba(23,21,15,.09) 1.2px, transparent 1.6px), linear-gradient(rgba(23,21,15,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(23,21,15,.05) 1px, transparent 1px)',
    size: '20px 20px, 140px 140px, 140px 140px',
    ink: '#171510',
  },
  midnight: {
    vp: 'radial-gradient(130% 110% at 24% -10%, #0c1220 0%, #070a12 50%, #030408 100%)',
    img: 'radial-gradient(rgba(255,255,255,.09) 1px, transparent 1.4px), radial-gradient(rgba(255,255,255,.04) 1px, transparent 1.6px)',
    size: '90px 90px, 220px 220px',
    ink: '#eef1f8',
  },
  sunset: {
    vp: 'radial-gradient(130% 110% at 30% -10%, #6a2f3a 0%, #4a2032 46%, #2c1424 100%)',
    img: 'radial-gradient(rgba(255,214,170,.12) 1.2px, transparent 1.6px), linear-gradient(rgba(255,214,170,.05) 1px, transparent 1px)',
    size: '22px 22px, 150px 150px',
    ink: '#fbe9dc',
  },
};

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
