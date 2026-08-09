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

/** How a card is built as an object: its edge, its weight, its fastening. */
export const CARD_EDGES = ['hairline', 'none', 'heavy', 'double', 'dashed', 'inked'] as const;
export type CardEdge = (typeof CARD_EDGES)[number];

export const CARD_FASTENERS = ['none', 'tape', 'pin', 'clip', 'staple'] as const;
export type CardFastener = (typeof CARD_FASTENERS)[number];

export const CARD_LIFTS = ['none', 'raise', 'straighten', 'tilt', 'glow'] as const;
export type CardLift = (typeof CARD_LIFTS)[number];

export type CardsConfig = {
  edge: CardEdge;
  /** 0 – 2.5 × on the drop shadow under every surface. */
  shadow: number;
  /** 0 – 1 paper grain over paper-toned surfaces. */
  grain: number;
  /** Padding inside a card surface, in px. */
  padding: number;
  /** What holds the card to the slate. */
  fastener: CardFastener;
  /** What a card does under the pointer. */
  lift: CardLift;
  /** 0 – 1 how strongly a drawer row is tinted against its card. */
  rowContrast: number;
  /** Thickness of the accent rule down the left of a drawer row, in px. */
  rowRule: number;
};

/** The dossier: the full-page article a card opens into. */
export const DOSSIER_ENTERS = ['plate', 'fade', 'rise', 'sheet', 'none'] as const;
export type DossierEnter = (typeof DOSSIER_ENTERS)[number];

export const DOSSIER_TITLE_CASES = ['none', 'upper', 'lower'] as const;
export type TitleCase = (typeof DOSSIER_TITLE_CASES)[number];

export const DOSSIER_LEDES = ['italic', 'plain', 'large', 'kicker'] as const;
export type DossierLede = (typeof DOSSIER_LEDES)[number];

export const BODY_FACES = ['display', 'mono'] as const;
export type BodyFace = (typeof BODY_FACES)[number];

export type DossierConfig = {
  /** Plate width in px. */
  width: number;
  /** Reading measure in ch — the real lever on how an article feels. */
  measure: number;
  /** Body copy family. */
  bodyFace: BodyFace;
  bodySize: number;
  bodyLeading: number;
  /** Title. */
  titleSize: number;
  titleWeight: number;
  titleCase: TitleCase;
  titleTracking: number;
  /** The opening line under the title. */
  lede: DossierLede;
  /** A raised initial on the first paragraph. */
  dropCap: boolean;
  /** Number every block in the margin. */
  numbered: boolean;
  /** Gap between blocks, in px. */
  blockGap: number;
  /** How the plate arrives. */
  enter: DossierEnter;
  /** 0 – 1 darkness of the scrim behind it, and its blur in px. */
  scrim: number;
  scrimBlur: number;
  /** Centre the column instead of running it flush left. */
  centred: boolean;
};

export type ThemeConfig = {
  boardStyle: BoardStyle;
  chaos: number;
  showMarginalia: boolean;
  cardRadius: number;
  backdrop: BackdropConfig;
  cards: CardsConfig;
  dossier: DossierConfig;
  fonts: { display: string; mono: string; scale: number; displayWeight: number; tracking: number };
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

export const DEFAULT_CARDS: CardsConfig = {
  edge: 'hairline',
  shadow: 1,
  grain: 0,
  padding: 22,
  fastener: 'none',
  lift: 'none',
  rowContrast: 0.5,
  rowRule: 3,
};

export const DEFAULT_DOSSIER: DossierConfig = {
  width: 860,
  measure: 60,
  bodyFace: 'display',
  bodySize: 16.5,
  bodyLeading: 1.66,
  titleSize: 46,
  titleWeight: 800,
  titleCase: 'none',
  titleTracking: -0.03,
  lede: 'italic',
  dropCap: false,
  numbered: false,
  blockGap: 18,
  enter: 'plate',
  scrim: 0.78,
  scrimBlur: 5,
  centred: false,
};

const DEFAULT_FONTS = {
  display: "'Bricolage Grotesque', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  scale: 1,
  displayWeight: 700,
  tracking: 0,
};

const fixtureTheme = fixtureByKey.theme as Partial<ThemeConfig> | undefined;

export const DEFAULT_THEME = {
  ...(fixtureTheme as ThemeConfig),
  backdrop: { ...DEFAULT_BACKDROP, ...(fixtureTheme?.backdrop ?? {}) },
  cards: { ...DEFAULT_CARDS, ...(fixtureTheme?.cards ?? {}) },
  dossier: { ...DEFAULT_DOSSIER, ...(fixtureTheme?.dossier ?? {}) },
  fonts: { ...DEFAULT_FONTS, ...(fixtureTheme?.fonts ?? {}) },
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
  const cards = isRecord(value.cards) ? value.cards : {};
  const dossier = isRecord(value.dossier) ? value.dossier : {};
  return {
    boardStyle: (BOARD_STYLE_IDS as readonly string[]).includes(value.boardStyle as string)
      ? (value.boardStyle as BoardStyle)
      : DEFAULT_THEME.boardStyle,
    chaos: typeof value.chaos === 'number' ? value.chaos : DEFAULT_THEME.chaos,
    showMarginalia: typeof value.showMarginalia === 'boolean' ? value.showMarginalia : DEFAULT_THEME.showMarginalia,
    cardRadius: typeof value.cardRadius === 'number' ? value.cardRadius : DEFAULT_THEME.cardRadius,
    backdrop: { ...DEFAULT_THEME.backdrop, ...(backdrop as Partial<BackdropConfig>) },
    cards: { ...DEFAULT_THEME.cards, ...(cards as Partial<CardsConfig>) },
    dossier: { ...DEFAULT_THEME.dossier, ...(dossier as Partial<DossierConfig>) },
    fonts: { ...DEFAULT_THEME.fonts, ...(fonts as Partial<ThemeConfig['fonts']>) },
    colors: { ...DEFAULT_THEME.colors, ...(colors as Partial<ThemeConfig['colors']>) },
  };
}

/** One-click looks.
 *
 *  A preset never touches content, positions or the tour, so trying one on and
 *  going back costs nothing. It does fully own the three surfaces it describes
 *  — backdrop, cards and article — building each from the defaults rather than
 *  from whatever the last look left behind, so applying a look twice, or after
 *  another one, always lands in the same place. Fonts stay as the owner set
 *  them, and colours are merged, because those are personal choices. */
export type ThemePreset = {
  id: string;
  label: string;
  hint: string;
  patch: (theme: ThemeConfig) => ThemeConfig;
};

const withColors = (theme: ThemeConfig, colors: Partial<ThemeConfig['colors']>): ThemeConfig =>
  ({ ...theme, colors: { ...theme.colors, ...colors } });

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'slate',
    label: 'Working slate',
    hint: 'the original: a dark slate on a plaster wall, straight paper, hard shadows',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'slate',
      cardRadius: 0,
      chaos: 1,
      backdrop: { ...DEFAULT_BACKDROP, plate: true, wall: 'plaster', grain: 0.5, vignette: 0.55, frame: 10, studs: true, grid: 'plate' },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 1, grain: 0, fastener: 'none', lift: 'none', rowRule: 3 },
      dossier: { ...DEFAULT_DOSSIER, width: 860, measure: 60, lede: 'italic', dropCap: false, numbered: false, enter: 'plate', titleWeight: 800 },
    }, { accent: 'oklch(0.5 0.13 45)', signal: 'oklch(0.78 0.14 66)' }),
  },
  {
    id: 'newsprint',
    label: 'Newsprint',
    hint: 'bone paper wall to wall, no slate, ink rules, numbered blocks, a drop cap',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'paper',
      cardRadius: 0,
      chaos: 0.3,
      backdrop: { ...DEFAULT_BACKDROP, plate: false, grid: 'viewport', gridScale: 1 },
      cards: { ...DEFAULT_CARDS, edge: 'inked', shadow: 0.25, grain: 0.35, fastener: 'none', lift: 'none', rowContrast: 0.3, rowRule: 0 },
      dossier: { ...DEFAULT_DOSSIER, width: 780, measure: 66, bodyFace: 'display', titleWeight: 800, titleCase: 'upper', titleTracking: -0.01, lede: 'plain', dropCap: true, numbered: true, enter: 'sheet', scrim: 0.9, scrimBlur: 0 },
    }, { accent: 'oklch(0.42 0.14 30)', accent2: 'oklch(0.45 0.1 250)', signal: 'oklch(0.72 0.15 70)', ink: '#151310' }),
  },
  {
    id: 'blueprint',
    label: 'Blueprint studio',
    hint: 'a drafting table: cyan grid, thin edges, a technical, quiet article',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'blueprint',
      cardRadius: 0,
      chaos: 0.4,
      backdrop: { ...DEFAULT_BACKDROP, plate: true, wall: 'ink', grain: 0.3, vignette: 0.45, frame: 6, studs: true, studSize: 16, grid: 'plate', gridScale: 0.8 },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 0.6, grain: 0, fastener: 'clip', lift: 'raise', rowRule: 2 },
      dossier: { ...DEFAULT_DOSSIER, width: 820, measure: 64, bodyFace: 'mono', bodySize: 14.5, bodyLeading: 1.75, titleWeight: 600, titleCase: 'upper', titleTracking: 0.02, lede: 'kicker', numbered: true, enter: 'rise' },
    }, { accent: 'oklch(0.62 0.13 240)', accent2: 'oklch(0.7 0.13 200)', signal: 'oklch(0.8 0.12 200)', lab: 'oklch(0.78 0.11 210)' }),
  },
  {
    id: 'corkroom',
    label: 'Cork room',
    hint: 'warm cork, pinned paper, tilted cards, a soft article',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'cork',
      cardRadius: 3,
      chaos: 1.6,
      backdrop: { ...DEFAULT_BACKDROP, plate: true, wall: 'warm', grain: 0.65, vignette: 0.6, frame: 14, plateShadow: 1.2, studs: true, grid: 'plate' },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 1.4, grain: 0.5, fastener: 'pin', lift: 'straighten', rowRule: 3 },
      dossier: { ...DEFAULT_DOSSIER, width: 800, measure: 58, lede: 'large', dropCap: true, enter: 'plate', scrim: 0.7, scrimBlur: 8 },
    }, { accent: 'oklch(0.5 0.14 50)', signal: 'oklch(0.8 0.14 75)' }),
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    hint: 'no shadow, heavy black edges, upper-case titles, everything flat and loud',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'graphite',
      cardRadius: 0,
      chaos: 0,
      backdrop: { ...DEFAULT_BACKDROP, plate: true, wall: 'void', grain: 0, vignette: 0.2, frame: 0, plateShadow: 0, studs: false, grid: 'plate', gridScale: 1.4 },
      cards: { ...DEFAULT_CARDS, edge: 'heavy', shadow: 0, grain: 0, padding: 26, fastener: 'none', lift: 'tilt', rowContrast: 0.85, rowRule: 6 },
      dossier: { ...DEFAULT_DOSSIER, width: 900, measure: 72, bodyFace: 'mono', bodySize: 15, titleSize: 58, titleWeight: 800, titleCase: 'upper', titleTracking: -0.04, lede: 'plain', numbered: true, blockGap: 26, enter: 'none', scrim: 0.95, scrimBlur: 0 },
    }, { accent: 'oklch(0.62 0.24 28)', accent2: 'oklch(0.7 0.2 250)', signal: 'oklch(0.85 0.2 95)' }),
  },
  {
    id: 'nightlab',
    label: 'Night lab',
    hint: 'near-black, cool instrument light, a glow on hover, a long calm measure',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'midnight',
      cardRadius: 2,
      chaos: 0.6,
      backdrop: { ...DEFAULT_BACKDROP, plate: true, wall: 'ink', grain: 0.25, vignette: 0.75, frame: 8, plateShadow: 1.3, studs: true, studSize: 14, grid: 'plate', gridScale: 1.2 },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 1.6, grain: 0, fastener: 'none', lift: 'glow', rowContrast: 0.6, rowRule: 2 },
      dossier: { ...DEFAULT_DOSSIER, width: 840, measure: 64, bodySize: 16, bodyLeading: 1.8, titleWeight: 700, lede: 'italic', enter: 'fade', scrim: 0.88, scrimBlur: 10 },
    }, { accent: 'oklch(0.72 0.13 200)', accent2: 'oklch(0.68 0.16 280)', signal: 'oklch(0.82 0.14 190)', lab: 'oklch(0.8 0.12 195)' }),
  },
  {
    id: 'sunbleached',
    label: 'Sun-bleached',
    hint: 'a bright studio wall, warm paper, taped photos, a generous article',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'paper',
      cardRadius: 6,
      chaos: 1.2,
      backdrop: { ...DEFAULT_BACKDROP, plate: true, wall: 'studio', grain: 0.4, vignette: 0.25, frame: 4, plateShadow: 0.7, studs: false, grid: 'plate', gridScale: 1.2 },
      cards: { ...DEFAULT_CARDS, edge: 'none', shadow: 0.8, grain: 0.4, padding: 24, fastener: 'tape', lift: 'raise', rowContrast: 0.35, rowRule: 0 },
      dossier: { ...DEFAULT_DOSSIER, width: 760, measure: 56, bodySize: 17.5, bodyLeading: 1.72, titleSize: 42, titleWeight: 700, lede: 'large', dropCap: true, blockGap: 22, enter: 'rise', scrim: 0.6, scrimBlur: 6, centred: true },
    }, { accent: 'oklch(0.55 0.15 40)', accent2: 'oklch(0.6 0.14 230)', signal: 'oklch(0.82 0.15 80)' }),
  },
  {
    id: 'sunset',
    label: 'Late sunset',
    hint: 'plum and ember, staples, a headline that shouts and a body that does not',
    patch: (t) => withColors({
      ...t,
      boardStyle: 'sunset',
      cardRadius: 0,
      chaos: 1.1,
      backdrop: { ...DEFAULT_BACKDROP, plate: true, wall: 'warm', grain: 0.45, vignette: 0.7, frame: 12, studs: true, grid: 'plate' },
      cards: { ...DEFAULT_CARDS, edge: 'double', shadow: 1.2, grain: 0.2, fastener: 'staple', lift: 'raise', rowRule: 4 },
      dossier: { ...DEFAULT_DOSSIER, width: 820, measure: 60, titleSize: 52, titleWeight: 800, titleTracking: -0.045, lede: 'italic', enter: 'plate' },
    }, { accent: 'oklch(0.58 0.17 30)', accent2: 'oklch(0.65 0.16 330)', signal: 'oklch(0.8 0.16 60)' }),
  },
];

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

/** CSS custom properties derived from a theme, applied on the viewport.
 *
 *  Everything the stylesheet needs to know about the theme arrives this way, so
 *  a setting change repaints without a re-render of the board. */
export function themeVars(theme: ThemeConfig): Record<string, string> {
  const c = theme.colors;
  const cards = theme.cards;
  const d = theme.dossier;
  return {
    '--font-display': theme.fonts.display,
    '--font-mono': theme.fonts.mono,
    '--font-scale': String(theme.fonts.scale),
    '--font-display-weight': String(theme.fonts.displayWeight),
    '--font-tracking': `${theme.fonts.tracking}em`,
    '--card-radius': `${theme.cardRadius}px`,
    '--card-pad': `${cards.padding}px`,
    '--card-shadow': String(cards.shadow),
    '--card-grain': String(cards.grain),
    '--row-contrast': String(cards.rowContrast),
    '--row-rule': `${cards.rowRule}px`,
    '--dossier-width': `${d.width}px`,
    '--dossier-measure': `${d.measure}ch`,
    '--dossier-body': d.bodyFace === 'mono' ? 'var(--font-mono)' : 'var(--font-display)',
    '--dossier-body-size': `${d.bodySize}px`,
    '--dossier-leading': String(d.bodyLeading),
    '--dossier-title-size': `${d.titleSize}px`,
    '--dossier-title-weight': String(d.titleWeight),
    '--dossier-title-case': d.titleCase === 'none' ? 'none' : d.titleCase === 'upper' ? 'uppercase' : 'lowercase',
    '--dossier-title-tracking': `${d.titleTracking}em`,
    '--dossier-gap': `${d.blockGap}px`,
    '--dossier-scrim': `rgba(8, 16, 22, ${d.scrim})`,
    '--dossier-blur': `${d.scrimBlur}px`,
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
