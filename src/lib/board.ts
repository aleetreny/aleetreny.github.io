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

/** What is drawn on the slate. `texture` keeps whatever the board style paints;
 *  the rest are drawn in the pattern ink, so they work on a pale slate as well
 *  as a dark one. */
export const PATTERN_STYLES = ['texture', 'none', 'dots', 'grid', 'graph', 'rules', 'weave', 'stars', 'diagonal'] as const;
export type PatternStyle = (typeof PATTERN_STYLES)[number];

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
  /** The slate's own colour, centre and edge. Empty means "whatever the board
   *  texture paints", which is how every board looked before these existed. */
  slate: string;
  slate2: string;
  /** What is written on the slate. Empty picks black or white by contrast. */
  slateInk: string;
  /** The pattern drawn on the slate. `texture` keeps the board style's own. */
  pattern: PatternStyle;
  /** Light or dark pattern lines; `auto` follows the slate's brightness. */
  patternInk: 'auto' | 'light' | 'dark';
  /** 0..2 multiplier on how strongly the pattern reads. */
  patternFade: number;
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

/** The loose things pinned between the cards. A scrap carries no words and
 *  opens nothing: it is there so the eye has somewhere to rest between one
 *  drawer and the next. */
export const SCRAP_KINDS = [
  'arrow', 'circle', 'underline', 'bracket', 'star', 'spiral', 'cross', 'wave',
  'tape', 'clip', 'pin', 'coffee', 'leaf', 'bulb', 'die',
] as const;
export type ScrapKind = (typeof SCRAP_KINDS)[number];

/** Every shape the board still knows how to draw.
 *
 *  This is also the filter a stored board is read through: the plot, the
 *  boarding stub and the console panel were retired, and a board saved while
 *  they existed still carries them. Anything not on this list is dropped on
 *  the way in rather than falling through to the drawer renderer and coming
 *  back as a card nobody wrote. */
export const CARD_TYPES = [
  'hero', 'now', 'drawer', 'spotlight', 'sticker', 'contact', 'spotify', 'stamp', 'scrap',
] as const;
export type CardType = (typeof CARD_TYPES)[number];

export type BoardCard = {
  id: string;
  type: CardType;
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
  /** A copied Spotify track URL or spotify:track URI for the music card. */
  spotifyUrl?: string;
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
  /** Sticker rows: `[code, level, marks]` — a short label, what it means, and
   *  how many of `STICKER_MARKS` are filled in. Structure, like `stats`, so it
   *  is never handed to the translator. */
  langs?: Array<[string, string, number]>;
  /** What holds this one card to the slate, when it should not be whatever the
   *  theme fastens everything else with. A board where every card is taped
   *  down reads as a print; a board where some are clipped and one is pinned
   *  reads as a board somebody uses. */
  fastener?: CardFastener;

  // ---- stamp: a franked square ----
  /** One or two characters printed large on the stamp. */
  glyph?: string;
  /** The value line under the glyph, e.g. "ES · 2025". */
  denom?: string;
  /** What the postmark ring reads. */
  postmark?: string;

  // ---- scrap: a drawn mark, no words ----
  kind?: ScrapKind;
};

/** Card types that are drawn rather than written: no paper surface, no tone,
 *  no fastener, nothing to translate. */
export const CHROMELESS_CARDS: ReadonlyArray<BoardCard['type']> = ['hero', 'spotify', 'scrap'];

/** How many marks a sticker row draws. Five reads as a level at a glance and
 *  still fits inside a card narrow enough to be a sticker. */
export const STICKER_MARKS = 5;

/** The focal point and enlargement for a photo inside its fixed board frame.
 * Missing values deliberately mean the original, centred `object-fit: cover`
 * treatment, so boards saved before reframing existed keep their exact look. */
export type MediaFrame = {
  x?: number;
  y?: number;
  scale?: number;
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
  assetMediaType?: string;
  imageFrame?: MediaFrame;
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
  /** Ids of shipped cards the owner has thrown away. A board is stored whole,
   *  so without this list a card added to the shipped set after they first
   *  saved theirs could never reach them — and merging one in blindly would
   *  resurrect the ones they deleted on purpose. */
  dismissed: string[];
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
  slate: '',
  slate2: '',
  slateInk: '',
  pattern: 'texture',
  patternInk: 'auto',
  patternFade: 1,
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
  width: 1600,
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

/** The shipped palette, hardcoded rather than read from the fixture so that a
 *  look always lands in the same place no matter what the board was seeded
 *  with. Every preset builds its colours from here. */
export const DEFAULT_COLORS: ThemeConfig['colors'] = {
  accent: 'oklch(0.5 0.13 45)',
  accent2: 'oklch(0.62 0.16 250)',
  signal: 'oklch(0.78 0.14 66)',
  signalSoft: 'oklch(0.82 0.11 74)',
  lab: 'oklch(0.75 0.1 220)',
  paper: '#fbf7ef',
  paperWarm: '#faf3e6',
  paperCream: '#efe7d4',
  ink: '#17150f',
  dark: '#171510',
  slate: '#1d2733',
  slateInk: '#e6eef6',
  darkInk: '#f3ecdd',
};

export const DEFAULT_THEME = {
  ...(fixtureTheme as ThemeConfig),
  backdrop: { ...DEFAULT_BACKDROP, ...(fixtureTheme?.backdrop ?? {}) },
  cards: { ...DEFAULT_CARDS, ...(fixtureTheme?.cards ?? {}) },
  dossier: { ...DEFAULT_DOSSIER, ...(fixtureTheme?.dossier ?? {}) },
  fonts: { ...DEFAULT_FONTS, ...(fixtureTheme?.fonts ?? {}) },
} as ThemeConfig;
/** The fixture predates `dismissed` and never needs one: a board shipped as
 *  the default has nothing thrown away yet. */
export const DEFAULT_BOARD: BoardConfig = {
  ...(fixtureByKey.board as Omit<BoardConfig, 'dismissed'>),
  dismissed: [],
};
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
 *  — backdrop, cards, article and palette — building each from the defaults
 *  rather than from whatever the last look left behind, so applying a look
 *  twice, or after another one, always lands in the same place. Only the fonts
 *  survive, because a typeface is a personal choice; a palette is the look.
 *
 *  The colours are the published schemes they are named after, so the board can
 *  be pale or near-black and still hold together: the slate, the wall, the card
 *  paper and the ink all move at once. */
export type ThemePreset = {
  id: string;
  label: string;
  hint: string;
  patch: (theme: ThemeConfig) => ThemeConfig;
};


export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'slate',
    label: 'Working slate',
    hint: 'the original — a green-grey slate on a plaster wall, straight paper, hard shadows',
    patch: (t) => ({
      ...t,
      boardStyle: 'slate',
      cardRadius: 0,
      chaos: 1,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#232629', wallColor2: '#0a0b0d',
        slate: '#2e3a38', slate2: '#172120',
        pattern: 'texture', grain: 0.5, vignette: 0.55, frame: 10, studs: true,
      },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 1, grain: 0, fastener: 'none', lift: 'none', rowRule: 3 },
      dossier: { ...DEFAULT_DOSSIER, width: 860, measure: 60, lede: 'italic', enter: 'plate', titleWeight: 800 },
      colors: {
        ...DEFAULT_COLORS,
        accent: 'oklch(0.5 0.13 45)', accent2: 'oklch(0.55 0.12 250)',
        signal: 'oklch(0.78 0.14 66)', lab: 'oklch(0.74 0.11 200)',
      },
    }),
  },
  {
    id: 'solarized-light',
    label: 'Solarized Light',
    hint: 'Ethan Schoonover’s daylight palette — warm base3 paper, cyan-blue ink, a calm serif article',
    patch: (t) => ({
      ...t,
      boardStyle: 'paper',
      cardRadius: 2,
      chaos: 0.35,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#e6dfc8', wallColor2: '#cec7ae',
        slate: '#fdf6e3', slate2: '#eee8d5',
        pattern: 'grid', patternInk: 'dark', patternFade: 0.75, gridScale: 1.1,
        grain: 0.3, vignette: 0.18, frame: 3, plateShadow: 0.6, studs: false,
      },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 0.55, grain: 0.15, padding: 24, fastener: 'none', lift: 'raise', rowContrast: 0.3, rowRule: 2 },
      dossier: { ...DEFAULT_DOSSIER, width: 800, measure: 62, bodySize: 17, bodyLeading: 1.72, titleSize: 42, titleWeight: 700, lede: 'italic', blockGap: 20, enter: 'rise', scrim: 0.55, scrimBlur: 8 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#fdf6e3', paperWarm: '#eee8d5', paperCream: '#f5efdc',
        ink: '#073642', dark: '#073642', darkInk: '#eee8d5',
        slate: '#586e75', slateInk: '#fdf6e3',
        accent: '#268bd2', accent2: '#2aa198', signal: '#b58900', signalSoft: '#cb9d3a', lab: '#859900',
      },
    }),
  },
  {
    id: 'nord',
    label: 'Nord',
    hint: 'the arctic palette — polar-night slate, frost blues, snow-storm paper, a technical article',
    patch: (t) => ({
      ...t,
      boardStyle: 'graphite',
      cardRadius: 4,
      chaos: 0.5,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#242933', wallColor2: '#12151c',
        slate: '#3b4252', slate2: '#2e3440',
        pattern: 'graph', patternInk: 'light', patternFade: 0.8, gridScale: 0.9,
        grain: 0.25, vignette: 0.45, frame: 6, studs: true, studSize: 16,
      },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 0.9, grain: 0, padding: 22, fastener: 'clip', lift: 'raise', rowContrast: 0.4, rowRule: 2 },
      dossier: { ...DEFAULT_DOSSIER, width: 840, measure: 66, bodyFace: 'mono', bodySize: 14.5, bodyLeading: 1.78, titleWeight: 600, titleTracking: -0.01, lede: 'kicker', numbered: true, enter: 'rise', scrim: 0.86, scrimBlur: 10 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#eceff4', paperWarm: '#e5e9f0', paperCream: '#f0f3f8',
        ink: '#2e3440', dark: '#3b4252', darkInk: '#eceff4',
        slate: '#4c566a', slateInk: '#eceff4',
        accent: '#5e81ac', accent2: '#81a1c1', signal: '#88c0d0', signalSoft: '#8fbcbb', lab: '#a3be8c',
      },
    }),
  },
  {
    id: 'gruvbox',
    label: 'Gruvbox',
    hint: 'retro groove — charcoal slate, cream paper, burnt orange, a drop cap and taped photos',
    patch: (t) => ({
      ...t,
      boardStyle: 'graphite',
      cardRadius: 2,
      chaos: 1.2,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#3c3836', wallColor2: '#1d2021',
        slate: '#32302f', slate2: '#1d2021',
        pattern: 'dots', patternInk: 'light', patternFade: 0.9, gridScale: 1.1,
        grain: 0.55, vignette: 0.6, frame: 12, plateShadow: 1.2, studs: true,
      },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 1.3, grain: 0.45, padding: 23, fastener: 'tape', lift: 'straighten', rowContrast: 0.5, rowRule: 3 },
      dossier: { ...DEFAULT_DOSSIER, width: 800, measure: 58, bodySize: 17, titleSize: 46, titleWeight: 800, lede: 'large', dropCap: true, enter: 'plate', scrim: 0.85, scrimBlur: 6 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#fbf1c7', paperWarm: '#f2e5bc', paperCream: '#f9f5d7',
        ink: '#3c3836', dark: '#504945', darkInk: '#fbf1c7',
        slate: '#665c54', slateInk: '#fbf1c7',
        accent: '#d65d0e', accent2: '#458588', signal: '#fabd2f', signalSoft: '#d79921', lab: '#98971a',
      },
    }),
  },
  {
    id: 'dracula',
    label: 'Dracula',
    hint: 'the purple classic — near-black slate, violet and pink, rounded cards with a glow',
    patch: (t) => ({
      ...t,
      boardStyle: 'midnight',
      cardRadius: 8,
      chaos: 0.7,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#21222c', wallColor2: '#0b0b10',
        slate: '#282a36', slate2: '#191a21',
        pattern: 'stars', patternInk: 'light', patternFade: 1.1, gridScale: 1,
        grain: 0.2, vignette: 0.7, frame: 6, plateShadow: 1.3, studs: false,
      },
      cards: { ...DEFAULT_CARDS, edge: 'none', shadow: 1.5, grain: 0, padding: 24, fastener: 'none', lift: 'glow', rowContrast: 0.55, rowRule: 0 },
      dossier: { ...DEFAULT_DOSSIER, width: 840, measure: 62, bodySize: 16.5, bodyLeading: 1.8, titleSize: 46, titleWeight: 700, lede: 'large', enter: 'sheet', scrim: 0.9, scrimBlur: 14 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#f8f8f2', paperWarm: '#eeeef0', paperCream: '#fbfbf6',
        ink: '#282a36', dark: '#44475a', darkInk: '#f8f8f2',
        slate: '#44475a', slateInk: '#f8f8f2',
        accent: '#bd93f9', accent2: '#ff79c6', signal: '#f1fa8c', signalSoft: '#ffb86c', lab: '#8be9fd',
      },
    }),
  },
  {
    id: 'latte',
    label: 'Catppuccin Latte',
    hint: 'the soft light one — pale lavender-grey, rounded paper, a centred article, no rules',
    patch: (t) => ({
      ...t,
      boardStyle: 'paper',
      cardRadius: 12,
      chaos: 0.5,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#dce0e8', wallColor2: '#bcc0cc',
        slate: '#eff1f5', slate2: '#e6e9ef',
        pattern: 'dots', patternInk: 'dark', patternFade: 0.55, gridScale: 1.2,
        grain: 0.2, vignette: 0.15, frame: 0, plateShadow: 0.5, studs: false,
      },
      cards: { ...DEFAULT_CARDS, edge: 'none', shadow: 0.7, grain: 0, padding: 26, fastener: 'none', lift: 'raise', rowContrast: 0.25, rowRule: 0 },
      dossier: { ...DEFAULT_DOSSIER, width: 760, measure: 56, bodySize: 17.5, bodyLeading: 1.75, titleSize: 40, titleWeight: 700, lede: 'large', blockGap: 24, enter: 'rise', scrim: 0.5, scrimBlur: 12, centred: true },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#ffffff', paperWarm: '#eff1f5', paperCream: '#f7f8fa',
        ink: '#4c4f69', dark: '#5c5f77', darkInk: '#eff1f5',
        slate: '#6c6f85', slateInk: '#eff1f5',
        accent: '#1e66f5', accent2: '#8839ef', signal: '#df8e1d', signalSoft: '#fe640b', lab: '#179299',
      },
    }),
  },
  {
    id: 'tokyonight',
    label: 'Tokyo Night',
    hint: 'deep indigo, neon blue and violet, a starfield slate and numbered mono blocks',
    patch: (t) => ({
      ...t,
      boardStyle: 'midnight',
      cardRadius: 6,
      chaos: 0.4,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#16161e', wallColor2: '#08080c',
        slate: '#1a1b26', slate2: '#101018',
        pattern: 'stars', patternInk: 'light', patternFade: 1.3, gridScale: 0.9,
        grain: 0.15, vignette: 0.8, frame: 4, plateShadow: 1.4, studs: false,
      },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 1.4, grain: 0, padding: 22, fastener: 'none', lift: 'glow', rowContrast: 0.6, rowRule: 2 },
      dossier: { ...DEFAULT_DOSSIER, width: 860, measure: 68, bodyFace: 'mono', bodySize: 14.5, bodyLeading: 1.8, titleWeight: 700, titleTracking: -0.02, lede: 'kicker', numbered: true, enter: 'fade', scrim: 0.92, scrimBlur: 12 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#e8eaf6', paperWarm: '#dfe3f2', paperCream: '#f0f2fb',
        ink: '#1a1b26', dark: '#24283b', darkInk: '#c0caf5',
        slate: '#414868', slateInk: '#c0caf5',
        accent: '#7aa2f7', accent2: '#bb9af7', signal: '#7dcfff', signalSoft: '#e0af68', lab: '#9ece6a',
      },
    }),
  },
  {
    id: 'rosepine-dawn',
    label: 'Rosé Pine Dawn',
    hint: 'the light rosé — blush paper, muted plum ink, pinned photos and a drop cap',
    patch: (t) => ({
      ...t,
      boardStyle: 'paper',
      cardRadius: 6,
      chaos: 1.4,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#f2e9e1', wallColor2: '#dfd4cc',
        slate: '#faf4ed', slate2: '#f2e9e1',
        pattern: 'weave', patternInk: 'dark', patternFade: 0.5, gridScale: 1.1,
        grain: 0.35, vignette: 0.2, frame: 6, plateShadow: 0.8, studs: true, studSize: 16,
      },
      cards: { ...DEFAULT_CARDS, edge: 'none', shadow: 0.9, grain: 0.3, padding: 24, fastener: 'pin', lift: 'tilt', rowContrast: 0.28, rowRule: 0 },
      dossier: { ...DEFAULT_DOSSIER, width: 780, measure: 58, bodySize: 17, bodyLeading: 1.74, titleSize: 44, titleWeight: 700, lede: 'italic', dropCap: true, enter: 'plate', scrim: 0.55, scrimBlur: 10 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#fffaf3', paperWarm: '#faf4ed', paperCream: '#fdf8f1',
        ink: '#575279', dark: '#6e6a86', darkInk: '#faf4ed',
        slate: '#797593', slateInk: '#faf4ed',
        accent: '#b4637a', accent2: '#907aa9', signal: '#ea9d34', signalSoft: '#d7827e', lab: '#56949f',
      },
    }),
  },
  {
    id: 'everforest',
    label: 'Everforest',
    hint: 'soft forest greens on warm cream, a woven slate, stapled paper, a plain calm article',
    patch: (t) => ({
      ...t,
      boardStyle: 'slate',
      cardRadius: 4,
      chaos: 0.9,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#1e2326', wallColor2: '#0d1012',
        slate: '#2d353b', slate2: '#232a2e',
        pattern: 'weave', patternInk: 'light', patternFade: 0.85, gridScale: 1,
        grain: 0.4, vignette: 0.5, frame: 10, plateShadow: 1.1, studs: true,
      },
      cards: { ...DEFAULT_CARDS, edge: 'hairline', shadow: 1.1, grain: 0.3, padding: 23, fastener: 'staple', lift: 'straighten', rowContrast: 0.45, rowRule: 3 },
      dossier: { ...DEFAULT_DOSSIER, width: 820, measure: 60, bodySize: 16.5, bodyLeading: 1.76, titleSize: 42, titleWeight: 700, lede: 'plain', enter: 'plate', scrim: 0.84, scrimBlur: 8 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#fff9e8', paperWarm: '#f4f0d9', paperCream: '#fdf6e3',
        ink: '#343f44', dark: '#3d484d', darkInk: '#d3c6aa',
        slate: '#4f585e', slateInk: '#d3c6aa',
        accent: '#a7c080', accent2: '#7fbbb3', signal: '#dbbc7f', signalSoft: '#e69875', lab: '#83c092',
      },
    }),
  },
  {
    id: 'monokai',
    label: 'Monokai',
    hint: 'the editor classic — olive-black slate, hot pink and lime, heavy edges, upper-case titles',
    patch: (t) => ({
      ...t,
      boardStyle: 'graphite',
      cardRadius: 0,
      chaos: 0.2,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#1d1e19', wallColor2: '#0a0b08',
        slate: '#272822', slate2: '#1a1b16',
        pattern: 'diagonal', patternInk: 'light', patternFade: 1, gridScale: 1.4,
        grain: 0.2, vignette: 0.45, frame: 0, plateShadow: 0.6, studs: false,
      },
      cards: { ...DEFAULT_CARDS, edge: 'heavy', shadow: 0.2, grain: 0, padding: 24, fastener: 'none', lift: 'tilt', rowContrast: 0.75, rowRule: 5 },
      dossier: { ...DEFAULT_DOSSIER, width: 880, measure: 70, bodyFace: 'mono', bodySize: 15, titleSize: 50, titleWeight: 800, titleCase: 'upper', titleTracking: -0.03, lede: 'plain', numbered: true, blockGap: 24, enter: 'none', scrim: 0.93, scrimBlur: 0 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#f8f8f2', paperWarm: '#efefe6', paperCream: '#fbfbf3',
        ink: '#272822', dark: '#3e3d32', darkInk: '#f8f8f2',
        slate: '#49483e', slateInk: '#f8f8f2',
        accent: '#f92672', accent2: '#ae81ff', signal: '#a6e22e', signalSoft: '#e6db74', lab: '#66d9ef',
      },
    }),
  },
  {
    id: 'newsprint',
    label: 'Newsprint',
    hint: 'bone paper wall to wall, no slate at all, ink rules, numbered blocks and a drop cap',
    patch: (t) => ({
      ...t,
      boardStyle: 'paper',
      cardRadius: 0,
      chaos: 0.3,
      backdrop: {
        ...DEFAULT_BACKDROP,
        plate: false,
        slate: '#f4efe1', slate2: '#e4dcc6',
        pattern: 'rules', patternInk: 'dark', patternFade: 0.6,
        grid: 'viewport', gridScale: 1,
      },
      cards: { ...DEFAULT_CARDS, edge: 'inked', shadow: 0.25, grain: 0.35, fastener: 'none', lift: 'none', rowContrast: 0.3, rowRule: 0 },
      dossier: { ...DEFAULT_DOSSIER, width: 780, measure: 66, bodyFace: 'display', titleWeight: 800, titleCase: 'upper', titleTracking: -0.01, lede: 'plain', dropCap: true, numbered: true, enter: 'sheet', scrim: 0.9, scrimBlur: 0 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#f7f3e7', paperWarm: '#efe8d6', paperCream: '#fbf8ee',
        ink: '#151310', dark: '#2a2620', darkInk: '#f7f3e7',
        slate: '#4a453c', slateInk: '#f7f3e7',
        accent: 'oklch(0.42 0.14 30)', accent2: 'oklch(0.45 0.1 250)', signal: 'oklch(0.72 0.15 70)', lab: 'oklch(0.5 0.1 160)',
      },
    }),
  },
  {
    id: 'brutalist',
    label: 'Brutalist',
    hint: 'no shadow, heavy black edges, a red accent, everything flat and loud',
    patch: (t) => ({
      ...t,
      boardStyle: 'graphite',
      cardRadius: 0,
      chaos: 0,
      backdrop: {
        ...DEFAULT_BACKDROP,
        wall: 'custom', wallColor: '#101011', wallColor2: '#000000',
        slate: '#101011', slate2: '#000000',
        pattern: 'grid', patternInk: 'light', patternFade: 0.7, gridScale: 1.4,
        grain: 0, vignette: 0.2, frame: 0, plateShadow: 0, studs: false,
      },
      cards: { ...DEFAULT_CARDS, edge: 'heavy', shadow: 0, grain: 0, padding: 26, fastener: 'none', lift: 'tilt', rowContrast: 0.85, rowRule: 6 },
      dossier: { ...DEFAULT_DOSSIER, width: 900, measure: 72, bodyFace: 'mono', bodySize: 15, titleSize: 58, titleWeight: 800, titleCase: 'upper', titleTracking: -0.04, lede: 'plain', numbered: true, blockGap: 26, enter: 'none', scrim: 0.95, scrimBlur: 0 },
      colors: {
        ...DEFAULT_COLORS,
        paper: '#ffffff', paperWarm: '#f2f2f2', paperCream: '#fafafa',
        ink: '#000000', dark: '#111111', darkInk: '#ffffff',
        slate: '#1a1a1a', slateInk: '#ffffff',
        accent: 'oklch(0.62 0.24 28)', accent2: 'oklch(0.7 0.2 250)', signal: 'oklch(0.85 0.2 95)', lab: 'oklch(0.8 0.18 150)',
      },
    }),
  },
];
function isBoardGroup(value: unknown): value is BoardGroup {
  return isRecord(value) && typeof value.id === 'string' && typeof value.label === 'string';
}

/** A stored board is a complete document, so a card that joins the shipped set
 *  later would otherwise never appear on a board saved before it existed.
 *  Append the shipped cards this board has never seen, skipping any the owner
 *  removed — `dismissed` is what tells the two apart. */
function withShippedCards(cards: BoardCard[], dismissed: string[]): BoardCard[] {
  const known = new Set(cards.map((card) => card.id));
  const missing = DEFAULT_BOARD.cards.filter((card) => !known.has(card.id) && !dismissed.includes(card.id));
  return missing.length > 0 ? [...cards, ...missing] : cards;
}

const SUPPORTED = new Set<string>(CARD_TYPES);

/** Cards taken down by name rather than by kind.
 *
 *  Asunción and Bratislava were franked squares pinned to the slate, each a
 *  second door onto a dossier that its drawer already opens. Two doors onto
 *  one room is one door too many, so the pins are gone and the rooms are
 *  reached the way everything else is. The stamp *shape* stays available to
 *  the owner bar; it is these two that are retired. */
export const RETIRED_CARDS: ReadonlySet<string> = new Set(['stamp-py', 'stamp-sk']);

/** A stored card list, minus the shapes the board no longer draws. */
function supportedCards(cards: unknown[]): BoardCard[] {
  return cards.filter((card): card is BoardCard => (
    isRecord(card)
    && typeof card.type === 'string'
    && SUPPORTED.has(card.type)
    && !(typeof card.id === 'string' && RETIRED_CARDS.has(card.id))
  ));
}

export function parseBoard(value: unknown): BoardConfig {
  if (!isRecord(value) || !Array.isArray(value.cards)) return DEFAULT_BOARD;
  const groups = Array.isArray(value.groups) ? value.groups.filter(isBoardGroup) : [];
  const dismissed = Array.isArray(value.dismissed)
    ? value.dismissed.filter((id): id is string => typeof id === 'string')
    : [];
  return {
    size: isRecord(value.size)
      ? { width: Number(value.size.width) || DEFAULT_BOARD.size.width, height: Number(value.size.height) || DEFAULT_BOARD.size.height }
      : DEFAULT_BOARD.size,
    groups: groups.length > 0 ? groups : DEFAULT_BOARD.groups,
    cards: withShippedCards(supportedCards(value.cards), dismissed),
    polaroids: Array.isArray(value.polaroids) ? (value.polaroids as Polaroid[]) : [],
    marginalia: Array.isArray(value.marginalia) ? (value.marginalia as Marginal[]) : [],
    dismissed,
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

/** Return a drawer's entries after moving one item and normalising every
 * stored order. Keeping this operation here means every editor surface uses
 * the same ordering rules, including entries that arrived without an order. */
export function reorderGroupEntries(
  entries: PortfolioEntry[],
  group: string,
  fromIndex: number,
  toIndex: number,
): PortfolioEntry[] {
  const ordered = entriesForGroup(entries, group);
  if (
    fromIndex < 0 || fromIndex >= ordered.length
    || toIndex < 0 || toIndex >= ordered.length
    || fromIndex === toIndex
  ) {
    return ordered;
  }

  const next = [...ordered];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next.map((entry, order) => ({
    ...entry,
    metadata: { ...entry.metadata, order },
  }));
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

/** What the viewport is painted with. Without a slate the board surface fills
 *  the whole viewport, exactly as it did before the slate existed. */
export function wallBackground(backdrop: BackdropConfig, texture: BoardTexture): string {
  if (!backdrop.plate) return slateBackground(backdrop, texture);
  if (backdrop.wall === 'custom') {
    return `radial-gradient(120% 100% at 50% -25%, ${backdrop.wallColor} 0%, ${backdrop.wallColor2} 100%)`;
  }
  return WALLS[backdrop.wall] ?? WALLS.plaster;
}

// ------------------------------------------------------------ the slate

/** Perceived brightness of a `#rgb` / `#rrggbb`, 0..1. Anything else reads as
 *  dark, which is the safe assumption for a board. */
export function tintLuminance(hex: string): number {
  const clean = hex.trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return 0;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The slate's own colour. An unset tint keeps the board style's gradient, so
 *  every board built before these fields existed looks exactly as it did. */
export function slateBackground(backdrop: BackdropConfig, texture: BoardTexture): string {
  if (!backdrop.slate) return texture.vp;
  const edge = backdrop.slate2 || backdrop.slate;
  return `radial-gradient(130% 110% at 26% -10%, ${backdrop.slate} 0%, ${edge} 100%)`;
}

/** One flat colour that stands for the slate.
 *
 *  The slate itself is a gradient, and a gradient cannot be handed to a canvas
 *  that is drawing a small picture of the board — the Polaroid and the
 *  telescope both need a single ground to paint before anything else. The mid
 *  stop is the honest answer. */
export function slateGround(backdrop: BackdropConfig, texture: BoardTexture): string {
  if (backdrop.slate) return backdrop.slate;
  const stops = slateBackground(backdrop, texture).match(/#[0-9a-fA-F]{3,8}/g) ?? [];
  return stops[1] ?? stops[0] ?? '#1b2724';
}

/** What is legible written on the slate. */
export function slateInk(backdrop: BackdropConfig, texture: BoardTexture): string {
  if (backdrop.slateInk) return backdrop.slateInk;
  if (!backdrop.slate) return texture.ink;
  return tintLuminance(backdrop.slate) > 0.55 ? '#16150f' : '#f4f1e8';
}

const patternAlpha = (base: number, fade: number) => Math.round(base * fade * 1000) / 1000;

/** The pattern layers, drawn in an ink that suits the slate rather than in the
 *  board style's baked-in white. This is what lets a pale look keep a visible
 *  grid: the same pattern, drawn dark. */
export function patternLayers(
  backdrop: BackdropConfig,
  texture: BoardTexture,
  onPlate: boolean,
): { image: string; size: string } {
  const scale = backdrop.gridScale;
  if (backdrop.pattern === 'texture') {
    const image = onPlate ? texture.plateImg : texture.img;
    const size = onPlate ? texture.plateSize : texture.size;
    return { image, size: scalePatternSize(size, scale) };
  }
  if (backdrop.pattern === 'none') return { image: 'none', size: 'auto' };

  const light = backdrop.patternInk === 'auto'
    ? tintLuminance(backdrop.slate || '#000') <= 0.55
    : backdrop.patternInk === 'light';
  const rgb = light ? '255,255,255' : '23,21,15';
  const a = (base: number) => patternAlpha(base, backdrop.patternFade);
  const px = (n: number) => `${Math.round(n * scale * (onPlate ? 1.25 : 1) * 100) / 100}px`;

  switch (backdrop.pattern) {
    case 'dots':
      return {
        image: `radial-gradient(rgba(${rgb},${a(0.16)}) 1.4px, transparent 1.9px)`,
        size: `${px(26)} ${px(26)}`,
      };
    case 'grid':
      return {
        image: `linear-gradient(rgba(${rgb},${a(0.09)}) 1px, transparent 1px), linear-gradient(90deg, rgba(${rgb},${a(0.09)}) 1px, transparent 1px)`,
        size: `${px(130)} ${px(130)}, ${px(130)} ${px(130)}`,
      };
    case 'graph':
      return {
        image: [
          `linear-gradient(rgba(${rgb},${a(0.13)}) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(${rgb},${a(0.13)}) 1px, transparent 1px)`,
          `linear-gradient(rgba(${rgb},${a(0.06)}) 1px, transparent 1px)`,
          `linear-gradient(90deg, rgba(${rgb},${a(0.06)}) 1px, transparent 1px)`,
        ].join(', '),
        size: `${px(160)} ${px(160)}, ${px(160)} ${px(160)}, ${px(32)} ${px(32)}, ${px(32)} ${px(32)}`,
      };
    case 'rules':
      return {
        image: `linear-gradient(rgba(${rgb},${a(0.1)}) 1px, transparent 1px)`,
        size: `${px(38)} ${px(38)}`,
      };
    case 'weave':
      return {
        image: `radial-gradient(rgba(${rgb},${a(0.13)}) 1.6px, transparent 2.1px), radial-gradient(rgba(${light ? '0,0,0' : '255,255,255'},${a(0.1)}) 1.8px, transparent 2.3px)`,
        size: `${px(24)} ${px(24)}, ${px(36)} ${px(36)}`,
      };
    case 'stars':
      return {
        image: `radial-gradient(rgba(${rgb},${a(0.24)}) 1px, transparent 1.5px), radial-gradient(rgba(${rgb},${a(0.11)}) 1px, transparent 1.7px)`,
        size: `${px(90)} ${px(90)}, ${px(220)} ${px(220)}`,
      };
    case 'diagonal':
      return {
        image: `repeating-linear-gradient(45deg, rgba(${rgb},${a(0.08)}) 0 1px, transparent 1px ${px(14)})`,
        size: 'auto',
      };
    default:
      return { image: 'none', size: 'auto' };
  }
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
