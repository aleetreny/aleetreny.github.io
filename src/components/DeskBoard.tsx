import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { PortfolioEntry, StoredPortfolioEntry } from '../types/content';
import { demoEntries, demoSettings } from '../content/demo';
import {
  BOARD_TEXTURES,
  DEFAULT_BOARD,
  dossierOrder,
  entriesForGroup,
  parseBoard,
  parseLayout,
  parseTheme,
  patternLayers,
  slateBackground,
  slateGround,
  slateInk,
  tintLuminance,
  themeVars,
  wallBackground,
  CHROMELESS_CARDS,
  SCRAP_KINDS,
  CARD_FASTENERS,
  type BoardCard,
  type BoardConfig,
  type CardTone,
  type CardFastener,
  type ScrapKind,
  type GridMode,
  type LayoutMap,
  type LayoutOverride,
  type Marginal,
  type Polaroid,
  type ThemeConfig,
} from '../lib/board';
import { createEntry, slugify } from '../lib/editor';
import {
  DEFAULT_I18N,
  boardTextSlots,
  entryTextSlots,
  initialLanguage,
  localise,
  mergeEdit,
  readAt,
  missingAt,
  parseI18n,
  putText,
  rememberLanguage,
  setAt,
  type I18nConfig,
  type Path,
  type TranslateJob,
  type TranslateScope,
} from '../lib/i18n';
import {
  TranslateError,
  TranslateQuotaError,
  providerDailyBudget,
  translateTexts,
  translatorAvailable,
} from '../lib/translate';
import { makeUiText, parseUiOverrides, type UiOverrides } from '../lib/ui-text';
import { runtimeConfig } from '../lib/config';
import {
  buildStops,
  easingCss,
  isNarrow,
  markTourSeen,
  motionSample,
  parseTour,
  resolveCamera,
  revealDirection,
  revealKeyframes,
  revealFor,
  motionFor,
  MOTIF_GLYPHS,
  MOTIF_TIMING,
  revealSequence,
  splitStops,
  walkedPieces,
  tourAlreadySeen,
  type TourConfig,
  type TourItem,
  type TourStop,
  type TourReveal,
  type CameraMotion,
  type Motif,
} from '../lib/tour';
import {
  deleteContentEntry,
  hasOwnerSession,
  isCurrentUserOwner,
  getCurrentOwnerEmail,
  getEntryVersion,
  listPublishedEntries,
  listSiteSettings,
  saveContentEntry,
  saveSiteSetting,
  signInOwner,
  signOutOwner,
  uploadMedia,
} from '../lib/content-repository';
import { isVideoMedia, maxUploadBytesForMediaType, mediaContentType } from '../lib/image-upload';
import { BoardCardView } from './desk/BoardCards';
import type { SaveState } from './desk/DossierPlate';
import { ImageSlot } from './desk/ImageSlot';
import { TourBar } from './desk/TourBar';
import { WorldProvider, type PaintMode } from '../lib/world/context';
import { parseObjects, type DeskObject } from '../lib/world/kinds';
import { DEFAULT_STAMPS, parseStamps, type PassportStamp } from '../lib/world/passport';

// The desk is furniture, and furniture arrives after the room. Everything
// lying on the slate — all twenty-six objects and the chrome a held tool needs
// — is one chunk fetched once the board has already painted, so the portfolio
// itself weighs exactly what it did before any of this existed. The ten canvas
// objects split again from there.
const WorldLayer = lazy(() => import('./desk/world/WorldLayer').then((m) => ({ default: m.WorldLayer })));
const WorldOverlay = lazy(() => import('./desk/world/WorldLayer').then((m) => ({ default: m.WorldOverlay })));
const ObjectsPanel = lazy(() => import('./desk/ObjectsPanel').then((m) => ({ default: m.ObjectsPanel })));

// The full-page article, and the panels behind the owner bar. None of them is
// on screen when the board paints — a dossier waits for a click, the panels
// wait for a sign-in — so none of them belongs in the first download. The
// dossier chunk is fetched on idle a moment later, so the click that opens one
// still opens it immediately.
const dossierChunk = () => import('./desk/DossierPlate');
const DossierPlate = lazy(() => dossierChunk().then((m) => ({ default: m.DossierPlate })));
const DossierErrorBoundary = lazy(() => dossierChunk().then((m) => ({ default: m.DossierErrorBoundary })));
const GroupOverflowPanel = lazy(() => import('./desk/GroupOverflowPanel').then((m) => ({ default: m.GroupOverflowPanel })));
const ThemePanel = lazy(() => import('./desk/ThemePanel').then((m) => ({ default: m.ThemePanel })));
const InventoryPanel = lazy(() => import('./desk/InventoryPanel').then((m) => ({ default: m.InventoryPanel })));
const TourPanel = lazy(() => import('./desk/TourPanel').then((m) => ({ default: m.TourPanel })));
const WordingPanel = lazy(() => import('./desk/WordingPanel').then((m) => ({ default: m.WordingPanel })));

import { UiTextContext } from './desk/ui-text-context';
import { EditableText } from './desk/EditableText';

type DeskBoardProps = {
  remoteDataEnabled: boolean;
  ownerIntent: boolean;
};

type Geom = { x: number; y: number; rot: number; w: number };
type View = { x: number; y: number; s: number };
type Rect = { x: number; y: number; w: number; h: number };

/** `pre` — fitted but empty, nothing has happened yet.
 *  `tour` — the guided run is playing, board chrome is replaced by the tour bar.
 *  `live` — the board as it ships: pan, zoom, drag, dossiers, toolbar. */
type Phase = 'pre' | 'tour' | 'live';

/** What the visitor asked for while the run was parked at a stop. A number is
 *  a direct jump to that stop index (the tour bar's dots). */
type Advance = 'next' | 'back' | 'skip' | number;

/** A short, human label for a board item — used by the tour's generated route
 *  names and by the stop editor's piece picker. */
function itemLabel(text: string | undefined, fallback: string): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return fallback;
  return clean.length > 34 ? `${clean.slice(0, 33)}…` : clean;
}

/** The jump buttons a board falls back to when no card names one. Their words
 *  come from the wording catalogue (`jump.<id>`), so they follow the language
 *  and stay editable. */
const JUMPS = ['me', 'work', 'edu', 'vol', 'hack', 'repos', 'lab', 'travel', 'random', 'contact'];

/** The bar follows the board: one button per card that names a jump, in the
 *  order the cards are laid out. A hardcoded list outlives the cards it points
 *  at — it kept offering a stop that had been deleted, and said nothing about
 *  the ones added since. */
function jumpsFor(cards: BoardCard[]): string[] {
  const out: string[] = [];
  for (const card of cards) {
    const name = card.jump;
    if (name && !out.includes(name)) out.push(name);
  }
  return out.length > 0 ? out : JUMPS;
}

const TONES: CardTone[] = ['paper', 'paperWarm', 'paperCream', 'dark', 'slate', 'amber', 'custom'];

// Older remote boards may still have only the English label stored. Keep the
// default lists readable in Spanish while preserving any custom label the
// owner has written.
const DEFAULT_GROUP_LABELS: Record<string, { en: string; es: string }> = {
  work: { en: 'Paid work', es: 'Trabajo remunerado' },
  edu: { en: 'Schooling', es: 'Estudios' },
  lab: { en: 'Lab bench', es: 'Laboratorio' },
  vol: { en: 'Unpaid', es: 'Voluntariado' },
  hack: { en: 'Hackathons & prizes', es: 'Hackatones y premios' },
  repos: { en: 'The workshop', es: 'El taller' },
  travel: { en: 'Field log', es: 'Bitácora de viajes' },
  random: { en: 'The drawer', es: 'El cajón' },
  contact: { en: 'Reachable', es: 'Contacto' },
};

function localiseDefaultGroupLabels(board: BoardConfig, language: string): BoardConfig {
  if (language !== 'es') return board;
  let changed = false;
  const groups = board.groups.map((group) => {
    const fallback = DEFAULT_GROUP_LABELS[group.id];
    if (!fallback || group.label !== fallback.en) return group;
    changed = true;
    return { ...group, label: fallback.es };
  });
  return changed ? { ...board, groups } : board;
}

/** Which fields on each board item carry prose, and so belong to a language.
 *  Everything else — tones, layouts, group keys — is structure. */
const CARD_TEXT_FIELDS = [
  'kicker', 'title', 'subtitle', 'intro', 'name', 'hint', 'blurb', 'note',
  'label', 'nextLabel', 'currentTitle', 'currentSub', 'nextTitle', 'nextSub', 'barCaption',
];
const POLAROID_TEXT_FIELDS = ['caption', 'placeholder'];

/** One provider call per source language, so a mixed board still batches. */
function groupByFrom<T extends { from: string }>(jobs: T[]): Array<[string, T[]]> {
  const map = new Map<string, T[]>();
  for (const job of jobs) {
    const list = map.get(job.from);
    if (list) list.push(job); else map.set(job.from, [job]);
  }
  return [...map];
}
const NOTE_TEXT_FIELDS = ['text'];
const DRAWER_LAYOUTS = ['list', 'compact', 'grid', 'notes', 'atlas'] as const;
const CARD_WIDTH_MIN = 220;
const CARD_WIDTH_MAX = 1_000;
const CARD_WIDTH_STEP = 10;

export function DeskBoard({ remoteDataEnabled, ownerIntent }: DeskBoardProps) {
  const [rawEntries, setEntries] = useState<StoredPortfolioEntry[]>(demoEntries);
  const [settings, setSettings] = useState<Record<string, unknown>>(demoSettings);
  const [error, setError] = useState('');

  // Local preview: on a build without remote data, `?owner=1` unlocks the full
  // editor against local state so the whole editing surface is usable offline
  // (persistence is skipped). Production keeps the Neon sign-in.
  const localEdit = !remoteDataEnabled && ownerIntent;
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [authed, setAuthed] = useState(localEdit);
  const [editing, setEditing] = useState(localEdit);
  const [loginOpen, setLoginOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [wordingOpen, setWordingOpen] = useState(false);
  const [objectsOpen, setObjectsOpen] = useState(false);
  const [cardMenu, setCardMenu] = useState<string | null>(null);
  const [overflowGroup, setOverflowGroup] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [polBusy, setPolBusy] = useState<string | null>(null);
  // Cards do not move unless the owner deliberately unlocks them. This is UI
  // state rather than content: a reload always starts in the safe position.
  const [positionsLocked, setPositionsLocked] = useState(true);

  const theme = useMemo<ThemeConfig>(() => parseTheme(settings.theme), [settings.theme]);
  const uiOverrides = useMemo<UiOverrides>(() => parseUiOverrides(settings['site.ui']), [settings]);
  const layout = useMemo<LayoutMap>(() => parseLayout(settings['board.layout']), [settings]);
  const i18n = useMemo<I18nConfig>(() => parseI18n(settings['site.i18n'] ?? DEFAULT_I18N), [settings]);
  const [lang, setLang] = useState<string>(() => initialLanguage(parseI18n(demoSettings['site.i18n'] ?? DEFAULT_I18N)));
  const activeLang = i18n.enabled && i18n.languages.some((l) => l.code === lang) ? lang : i18n.primary;
  // Every word of chrome, resolved once per language change. Components read it
  // through a context so a new one cannot quietly go back to English.
  const t = useMemo(() => makeUiText(uiOverrides, activeLang, i18n.primary), [uiOverrides, activeLang, i18n.primary]);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  // The raw documents keep every language; the localised copies are what the
  // board renders, so no component below here knows a second language exists.
  const rawBoard = useMemo<BoardConfig>(() => parseBoard(settings.board), [settings.board]);
  const board = useMemo<BoardConfig>(
    () => localiseDefaultGroupLabels(
      i18n.enabled ? localise(rawBoard, activeLang, i18n.primary) : rawBoard,
      activeLang,
    ),
    [rawBoard, i18n.enabled, i18n.primary, activeLang],
  );
  // The loose things on the slate, and the two documents they read from. Both
  // fall back to what the repository ships, so a board seeded before any of
  // this existed still gets the whole desk.
  const objects = useMemo<DeskObject[]>(() => parseObjects(settings['board.objects']), [settings]);
  // Localise the stored document, then parse it — the same order the tour
  // needs, and for the same reason: parsing coerces every value to the shape it
  // expects, and a `{ es, en }` place name is not a string yet.
  const passport = useMemo<PassportStamp[]>(() => {
    const stored = settings['board.passport'];
    const parsed = parseStamps(i18n.enabled ? localise(stored, activeLang, i18n.primary) : stored);
    return parsed.length > 0 ? parsed : DEFAULT_STAMPS;
  }, [settings, i18n.enabled, i18n.primary, activeLang]);
  const paintMode = useMemo<PaintMode>(() => {
    const world = settings['board.world'];
    const mode = world && typeof world === 'object' ? (world as Record<string, unknown>).paint : undefined;
    return mode === 'global' || mode === 'none' ? mode : 'session';
  }, [settings]);

  const tour = useMemo<TourConfig>(() => {
    // Localise the stored document, then parse it. The other way round loses
    // every bilingual field the tour carries: parsing coerces a value to the
    // shape the tour expects, and a `{ es, en }` heading is not a string yet.
    const stored = settings['board.tour'];
    return parseTour(i18n.enabled ? localise(stored, activeLang, i18n.primary) : stored);
  }, [settings, i18n.enabled, i18n.primary, activeLang]);
  // The one place the stored and rendered shapes meet: after this, prose is a
  // plain string and nothing below knows a second language exists.
  const entries = useMemo<PortfolioEntry[]>(
    () => rawEntries.map((entry) => (i18n.enabled ? localise(entry, activeLang, i18n.primary) : entry) as PortfolioEntry),
    [rawEntries, i18n.enabled, i18n.primary, activeLang],
  );
  const backdrop = theme.backdrop;

  // Decided once, on the first render, so the board never paints fully
  // populated before the tour has a chance to hide it. The editor must not
  // fight an animation, and reduced motion means no tour at all.
  const [phase, setPhase] = useState<Phase>(() => {
    if (localEdit || ownerIntent) return 'live';
    if (!tour.enabled) return 'live';
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'live';
    if (tourAlreadySeen(tour.replay)) return 'live';
    return 'pre';
  });
  // The staggered CSS drop is the intro for a board that is not being toured;
  // when the tour runs it is the intro, so the drop must not also fire.
  const [introDrop, setIntroDrop] = useState(() => phase === 'live');
  const [tourStep, setTourStep] = useState(0);
  const [tourTotal, setTourTotal] = useState(0);
  const [tourLabel, setTourLabel] = useState('');
  const [tourWaiting, setTourWaiting] = useState(false);
  const [tourPaused, setTourPaused] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);
  const shakeRef = useRef<HTMLDivElement>(null);
  const motifRef = useRef<HTMLDivElement>(null);
  const motifRunRef = useRef(0);
  const flashRef = useRef<HTMLDivElement>(null);
  const view = useRef<View>({ x: 0, y: 0, s: 1 });
  const didDrag = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const zTop = useRef(50);
  const ctrlScaleRef = useRef(0);
  const autoTimer = useRef(0);
  const openSlugRef = useRef<string | null>(null);
  const authedRef = useRef(false);

  // ---- tour machinery -------------------------------------------------------
  const phaseRef = useRef<Phase>(phase);
  const tourRef = useRef<TourConfig>(tour);
  const stopsRef = useRef<TourStop[]>([]);
  const shownRef = useRef<Set<string>>(new Set());
  const tokenRef = useRef(0);
  const rafRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const pendingRef = useRef<Array<() => void>>([]);
  const gateRef = useRef<((value: Advance) => void) | null>(null);
  const manualRef = useRef(false);
  const scrollAtRef = useRef(0);
  // Touch: live pointers, the pinch in progress, and the last tap for
  // double-tap detection.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; cx: number; cy: number; view: View } | null>(null);
  /** True from the moment a second finger lands until just after the last one
   *  lifts, so a pinch never lands as a click or a card move. */
  const pinchedRef = useRef(false);
  const tapRef = useRef({ at: 0, x: 0, y: 0 });

  const texture = BOARD_TEXTURES[theme.boardStyle] ?? BOARD_TEXTURES.slate;
  // Without a slate there is nothing for the plate pattern to sit on, so it
  // falls back to the constant-density viewport grid.
  const gridMode: GridMode = backdrop.grid === 'plate' && !backdrop.plate ? 'viewport' : backdrop.grid;
  const groupIds = useMemo(() => board.groups.map((g) => g.id), [board.groups]);
  const orderedSlugs = useMemo(() => dossierOrder(entries, groupIds), [entries, groupIds]);
  const openEntry = openSlug ? entries.find((entry) => entry.slug === openSlug) ?? null : null;

  useEffect(() => { openSlugRef.current = openSlug; }, [openSlug]);
  useEffect(() => { authedRef.current = authed; }, [authed]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { tourRef.current = tour; }, [tour]);

  // Card menus are deliberately local, contextual controls. Once the owner
  // clicks anywhere else, the edit has already been committed and the menu
  // should get out of the way instead of needing a second gear click.
  useEffect(() => {
    if (!cardMenu) return undefined;
    const closeCardMenuOutside = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('.card-ctrl')) setCardMenu(null);
    };
    document.addEventListener('pointerdown', closeCardMenuOutside);
    return () => document.removeEventListener('pointerdown', closeCardMenuOutside);
  }, [cardMenu]);

  const flash = useCallback((text: string, isError = false) => {
    setToast({ text, error: isError });
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  // ---- data load ------------------------------------------------------------
  useEffect(() => {
    let active = true;
    Promise.all([listPublishedEntries(), listSiteSettings()])
      .then(([nextEntries, nextSettings]) => {
        if (!active) return;
        if (nextEntries.length > 0) setEntries(nextEntries);
        if (nextSettings && Object.keys(nextSettings).length > 0) setSettings(nextSettings);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        const detail = reason instanceof Error ? reason.message : tRef.current('board.offlineDetail');
        setError(tRef.current('board.offline', { detail }));
      });
    return () => { active = false; };
  }, []);

  // ---- geometry -------------------------------------------------------------
  const geomFor = useCallback((id: string, base: Geom): Geom => {
    const override = layout[id];
    return override ? { ...base, ...override } : base;
  }, [layout]);

  const cardGeom = useCallback((card: BoardCard): Geom => geomFor(card.id, { x: card.x, y: card.y, rot: card.rot * theme.chaos, w: card.w }), [geomFor, theme.chaos]);
  const polGeom = useCallback((p: Polaroid): Geom => geomFor(p.id, { x: p.x, y: p.y, rot: p.rot * theme.chaos, w: p.w }), [geomFor, theme.chaos]);
  const noteGeom = useCallback((n: Marginal): Geom => geomFor(n.id, { x: n.x, y: n.y, rot: n.rot * theme.chaos, w: n.w }), [geomFor, theme.chaos]);

  /** Every draggable thing on the board, as the tour's route builders and the
   *  stop editor see it. Marginalia only count when the theme shows them. */
  const tourItems = useMemo<TourItem[]>(() => {
    const labelOfGroup = (id?: string) => board.groups.find((g) => g.id === id)?.label;
    const cards = board.cards.map((card) => {
      const geom = cardGeom(card);
      return {
        id: card.id,
        x: geom.x,
        y: geom.y,
        w: geom.w,
        label: itemLabel(card.title ?? card.name ?? card.currentTitle ?? card.kicker ?? card.label, card.id),
        group: card.group,
        groupLabel: labelOfGroup(card.group),
      };
    });
    const polaroids = board.polaroids.map((p) => {
      const geom = polGeom(p);
      return { id: p.id, x: geom.x, y: geom.y, w: geom.w, label: itemLabel(p.caption, p.id) };
    });
    // The loose notes are asides. Walked through between two pieces of work
    // they read as interruptions, so `holdNotes` keeps them out of the route
    // entirely; `revealAll` at the end of the tour is what puts them up.
    const notes = theme.showMarginalia && !tour.holdNotes
      ? board.marginalia.map((n) => {
        const geom = noteGeom(n);
        return { id: n.id, x: geom.x, y: geom.y, w: geom.w, label: itemLabel(n.text, n.id) };
      })
      : [];
    return [...cards, ...polaroids, ...notes];
  }, [board.cards, board.groups, board.marginalia, board.polaroids, cardGeom, noteGeom, polGeom, theme.showMarginalia, tour.holdNotes]);

  const itemsRef = useRef<TourItem[]>(tourItems);
  useEffect(() => { itemsRef.current = tourItems; }, [tourItems]);

  // ---- imperative view ------------------------------------------------------
  //
  // Text quality at high zoom.
  //
  // `.desk__board` used to declare `will-change: transform` permanently. That
  // is the documented way to ask a browser for a composited layer, and a
  // composited layer is rasterised once, at one scale, and then stretched by
  // the GPU. Zooming in therefore did not re-draw the type at its new size: it
  // magnified the bitmap, which is exactly the soft, thin, low-quality lettering
  // you get past about 1.5×.
  //
  // The promotion is still worth having *while the view is moving* — that is
  // what keeps a pan at sixty frames. So it is applied on the first frame of a
  // gesture and dropped once the view has been still for a moment, which makes
  // the browser rasterise the board again at the scale it actually came to rest
  // at. The type is sharp wherever the owner stops.
  const settleTimer = useRef(0);
  const movingRef = useRef(false);
  const settle = useCallback(() => {
    const boardEl = boardRef.current;
    if (!boardEl) return;
    window.clearTimeout(settleTimer.current);
    if (!movingRef.current) {
      movingRef.current = true;
      boardEl.style.willChange = 'transform';
    }
    settleTimer.current = window.setTimeout(() => {
      movingRef.current = false;
      const el = boardRef.current;
      if (!el) return;
      // Dropping the hint is the whole point; the transition has to be gone
      // too, or the next paint animates from a stale layer.
      el.style.willChange = 'auto';
      el.style.transition = 'none';
    }, 420);
  }, []);
  useEffect(() => () => window.clearTimeout(settleTimer.current), []);

  const paint = useCallback((animate: boolean) => {
    const boardEl = boardRef.current;
    const gridEl = gridRef.current;
    const v = view.current;
    if (boardEl) {
      settle();
      boardEl.style.transition = animate ? 'transform .6s cubic-bezier(.22,.9,.2,1)' : 'none';
      boardEl.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
      // The owner's per-item controls ride the board, so at a fitted zoom a
      // 24px gear renders 6px tall. Counter-scale them back towards their real
      // size, capped so they never swell into the card they belong to.
      const ctrl = Math.min(3.2, Math.max(1, 1 / v.s));
      if (ctrl !== ctrlScaleRef.current) {
        ctrlScaleRef.current = ctrl;
        boardEl.style.setProperty('--ctrl-scale', ctrl.toFixed(3));
      }
    }
    if (gridEl) {
      // Constant on-screen density: the grid keeps the same cell size no matter
      // the zoom (only its offset follows the pan), so zooming out never turns
      // the dot pattern into grain. It reads as a calm fixed backdrop. The
      // slate's own pattern (grid mode `plate`) is static markup instead — it
      // rides the board transform, so it scales with the zoom by design.
      const layers = patternLayers(backdrop, texture, false);
      const sizes = layers.size.split(',').map((piece) => piece.trim());
      gridEl.style.backgroundImage = layers.image;
      gridEl.style.backgroundSize = layers.size;
      gridEl.style.backgroundPosition = sizes.map(() => `${v.x}px ${v.y}px`).join(', ');
    }
  }, [texture, backdrop, settle]);

  /** Frame a board-space rectangle inside the viewport. */
  const fitRect = useCallback((rect: Rect, padX: number, padTop: number, padBottom: number, maxScale: number): View | null => {
    const vp = viewportRef.current;
    if (!vp) return null;
    const box = vp.getBoundingClientRect();
    const s = Math.min((box.width - padX * 2) / rect.w, (box.height - padTop - padBottom) / rect.h, maxScale);
    return {
      s,
      x: box.width / 2 - (rect.x + rect.w / 2) * s,
      y: padTop + (box.height - padTop - padBottom) / 2 - (rect.y + rect.h / 2) * s,
    };
  }, []);

  const fitAll = useCallback((instant = false) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const pad = 44;
    const bottom = 96;
    const s = Math.min((rect.width - pad * 2) / board.size.width, (rect.height - pad - bottom) / board.size.height);
    view.current = { s, x: (rect.width - board.size.width * s) / 2, y: (rect.height - bottom - board.size.height * s) / 2 + 8 };
    paint(!instant);
  }, [board.size.height, board.size.width, paint]);

  const zoomAt = useCallback((px: number, py: number, k: number, animate: boolean) => {
    const v = view.current;
    const ns = Math.max(0.14, Math.min(2.4, v.s * k));
    const bx = (px - v.x) / v.s;
    const by = (py - v.y) / v.s;
    view.current = { s: ns, x: px - bx * ns, y: py - by * ns };
    paint(animate);
  }, [paint]);

  const zoomBy = useCallback((k: number) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    zoomAt(rect.width / 2, rect.height / 2, k, true);
  }, [zoomAt]);

  const centerNode = useCallback((node: HTMLElement, animate = true) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const cx = parseFloat(node.style.left || '0') + node.offsetWidth / 2;
    const cy = parseFloat(node.style.top || '0') + node.offsetHeight / 2;
    // Both axes matter: a 620px-wide card centred by height alone runs off the
    // sides of a phone.
    const s = Math.min(
      1,
      (rect.height - 150) / Math.max(node.offsetHeight, 1),
      (rect.width - 28) / Math.max(node.offsetWidth, 1),
    );
    view.current = { s, x: rect.width / 2 - cx * s, y: (rect.height - 60) / 2 - cy * s };
    paint(animate);
  }, [paint]);

  const jump = useCallback((name: string) => {
    const node = boardRef.current?.querySelector<HTMLElement>(`[data-jump="${name}"]`);
    if (node) centerNode(node);
  }, [centerNode]);
  const jumps = useMemo(() => jumpsFor(board.cards), [board.cards]);

  /** Where the board comes to rest: on load and when the tour ends.
   *
   *  On a wide screen that is the whole board. On a phone the whole board fits
   *  at about 0.12, where nothing is legible, so it rests on the first card
   *  instead — the `fit` button still gives the overview on demand. */
  const restView = useCallback((instant = false) => {
    const vp = viewportRef.current;
    const box = vp?.getBoundingClientRect();
    if (box && isNarrow(tourRef.current, box.width, box.height)) {
      const first = boardRef.current?.querySelector<HTMLElement>('[data-card]');
      if (first) { centerNode(first, !instant); return; }
    }
    fitAll(instant);
  }, [centerNode, fitAll]);

  useEffect(() => { paint(false); }, [paint, layout]);
  useEffect(() => { restView(true); }, [restView]);

  // The article is the point of the board, so its chunk is fetched the moment
  // the browser has nothing better to do — after the first paint, before the
  // first click. A visitor who opens a dossier never waits for a download; a
  // visitor who only looks at the slate never paid for one up front.
  useEffect(() => {
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => { void dossierChunk(); }, { timeout: 4000 })
      : window.setTimeout(() => { void dossierChunk(); }, 1400);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);

  // The board is a camera, not a scroller.
  //
  // `.desk` is `overflow: hidden`, which hides the overflow but still leaves
  // the element scrollable *programmatically*. Anything inside it that takes
  // focus — the book's close button, the pad's textarea, a stamp in the
  // passport — makes the browser scroll that control into view, and because
  // the slate is positioned by a transform rather than by the scroll position,
  // the whole board slides out from under the camera and stays there. What the
  // visitor sees is a thing they just closed sitting half off the screen.
  //
  // The stylesheet asks for `overflow: clip`, which makes it not a scroll
  // container at all; this is the belt to that pair of braces, for anything
  // that manages a scroll regardless.
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return undefined;
    const pin = () => {
      if (vp.scrollLeft !== 0) vp.scrollLeft = 0;
      if (vp.scrollTop !== 0) vp.scrollTop = 0;
    };
    vp.addEventListener('scroll', pin, { passive: true });
    return () => vp.removeEventListener('scroll', pin);
  }, []);
  useEffect(() => {
    // Re-fitting mid-tour would fight the camera; the run reframes itself.
    // A phone rotating is a real resize; the on-screen keyboard is not, so
    // only a width change or a big height change counts.
    let last = { w: window.innerWidth, h: window.innerHeight };
    const onResize = () => {
      const next = { w: window.innerWidth, h: window.innerHeight };
      const changed = next.w !== last.w || Math.abs(next.h - last.h) > 120;
      last = next;
      if (changed && phaseRef.current !== 'tour') restView(true);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [restView]);

  // ---- the guided tour ------------------------------------------------------
  // Items are hidden and revealed imperatively, never through React style
  // props: React writes no `opacity` or `pointer-events` on these nodes, so its
  // style diffing leaves the values alone and an unrelated re-render cannot
  // undo the tour.
  // The loose objects are hidden and revealed with everything else: a tour that
  // walks a bare slate and then finds the desk already covered in clutter has
  // told the visitor the wrong story. They are not *stops* — nothing routes
  // through them — so `revealAll` at the end is what puts them out.
  const boardItems = useCallback(
    () => Array.from(boardRef.current?.querySelectorAll<HTMLElement>('[data-card],[data-obj]') ?? []),
    [],
  );
  const studEls = useCallback(
    () => Array.from(boardRef.current?.querySelectorAll<HTMLElement>('[data-stud]') ?? []),
    [],
  );

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
    const pending = pendingRef.current;
    pendingRef.current = [];
    // Resolve rather than drop, so an awaiting run resumes, sees a stale token
    // and returns instead of holding its closure open forever.
    for (const resolve of pending) resolve();
  }, []);

  const wait = useCallback((ms: number) => new Promise<void>((resolve) => {
    if (!(ms > 0)) { resolve(); return; }
    pendingRef.current.push(resolve);
    timersRef.current.push(window.setTimeout(() => { resolve(); }, ms));
  }), []);

  const hideAll = useCallback(() => {
    shownRef.current.clear();
    for (const el of boardItems()) {
      // A finished CSS animation with `fill: both` outranks an inline opacity,
      // so the intro drop has to go before anything can be hidden again.
      el.style.animation = 'none';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }
    setIntroDrop(false);
    if (plateRef.current) plateRef.current.style.opacity = '0';
    for (const stud of studEls()) stud.style.opacity = '0';
  }, [boardItems, studEls]);

  /** Everything back on the board. `settle` makes whatever the walk never
   *  showed — the held notes, anything added since the route was written —
   *  arrive one after another instead of appearing all at once, which is the
   *  moment the slate stops being a presentation and becomes a board. */
  const revealAll = useCallback((settle = false) => {
    const held: HTMLElement[] = [];
    for (const el of boardItems()) {
      const id = el.dataset.card ?? el.dataset.obj;
      const late = settle && !!id && !shownRef.current.has(id);
      el.style.opacity = '1';
      el.style.pointerEvents = '';
      if (id) shownRef.current.add(id);
      if (late) held.push(el);
    }
    if (plateRef.current) plateRef.current.style.opacity = '1';
    for (const stud of studEls()) stud.style.opacity = '1';
    if (held.length === 0) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    held.forEach((el, index) => {
      const rot = parseFloat(el.dataset.rot || '0');
      el.animate([
        { opacity: 0, transform: `translateY(-14px) rotate(${rot - 5}deg) scale(.94)` },
        { opacity: 1, transform: `rotate(${rot}deg) scale(1)` },
      ], { duration: 460, delay: index * 90, easing: 'cubic-bezier(.2,.9,.25,1.1)', fill: 'none' });
    });
  }, [boardItems, studEls]);

  /** The framing numbers in force for the viewport as it is right now. */
  const camera = useCallback(() => {
    const box = viewportRef.current?.getBoundingClientRect();
    const width = box?.width ?? window.innerWidth;
    const height = box?.height ?? window.innerHeight;
    return resolveCamera(tourRef.current, isNarrow(tourRef.current, width, height));
  }, []);

  /** Camera flight between two framings, on the configured motion curve. */
  const flyTo = useCallback((target: View, duration: number, motion?: CameraMotion) => new Promise<void>((resolve) => {
    const vp = viewportRef.current;
    const base = camera();
    const cam = motion ? { ...base, motion } : base;
    if (!vp || !(duration > 0) || cam.motion === 'cut') {
      view.current = { ...target };
      paint(false);
      void wait(Math.min(120, duration)).then(resolve);
      return;
    }
    const box = vp.getBoundingClientRect();
    // Interpolate the framed centre point rather than the raw offset, so a
    // mid-flight zoom change (swoop, spring) keeps the same thing in frame.
    const ax = box.width / 2;
    const ay = cam.padTop + (box.height - cam.padTop - cam.padBottom) / 2;
    const centre = (v: View) => ({ x: (ax - v.x) / v.s, y: (ay - v.y) / v.s });
    const from = { ...view.current };
    const c0 = centre(from);
    const c1 = centre(target);
    const t0 = performance.now();
    // Cancelling a flight cancels the frame loop, so the promise is also parked
    // with the pending resolvers — the run resumes, sees a stale token and
    // returns instead of holding this closure open forever.
    pendingRef.current.push(resolve);
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / duration);
      const m = motionSample(cam, k);
      const s = Math.max(0.02, (from.s + (target.s - from.s) * m.zoom) * m.dip);
      const cx = c0.x + (c1.x - c0.x) * m.pan;
      const cy = c0.y + (c1.y - c0.y) * m.pan;
      view.current = { s, x: ax - cx * s, y: ay - cy * s + m.lift };
      paint(false);
      if (k < 1) { rafRef.current = requestAnimationFrame(tick); return; }
      view.current = { ...target };
      paint(false);
      resolve();
    };
    rafRef.current = requestAnimationFrame(tick);
  }), [camera, paint, wait]);

  /** The framing for one stop: the union of its item boxes, inflated. */
  const frameFor = useCallback((ids: string[]): View | null => {
    const cam = camera();
    const boardEl = boardRef.current;
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity;
    for (const id of ids) {
      const el = boardEl?.querySelector<HTMLElement>(`[data-card="${id}"]`);
      if (!el) continue;
      const x = parseFloat(el.style.left || '0');
      const y = parseFloat(el.style.top || '0');
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x + el.offsetWidth);
      y1 = Math.max(y1, y + el.offsetHeight);
    }
    const m = cam.inflate;
    const rect: Rect = x0 > x1
      ? { x: -m, y: -m, w: board.size.width + m * 2, h: board.size.height + m * 2 }
      : { x: x0 - m, y: y0 - m, w: x1 - x0 + m * 2, h: y1 - y0 + m * 2 };
    return fitRect(rect, cam.padX, cam.padTop, cam.padBottom, cam.maxScale);
  }, [board.size.height, board.size.width, camera, fitRect]);

  /** Land one item on the slate. */
  const showItem = useCallback((id: string, index: number, animate: boolean, reveal?: TourReveal) => {
    const el = boardRef.current?.querySelector<HTMLElement>(`[data-card="${id}"]`);
    if (!el) return;
    shownRef.current.add(id);
    el.style.opacity = '1';
    el.style.pointerEvents = '';
    const cfg = tourRef.current;
    const how = reveal ?? cfg.reveal;
    const speed = cfg.speed > 0 ? cfg.speed : 1;
    if (!animate || how.style === 'none' || !(how.duration > 0)) return;
    const rot = parseFloat(el.dataset.rot || '0');
    // `fill: 'none'` on purpose: the element keeps its own inline rotation,
    // which is what the drag code reads back when the visitor moves it.
    el.animate(revealKeyframes(how, rot, revealDirection(id, index)), {
      duration: how.duration / speed,
      easing: easingCss(how.easing),
      fill: 'none',
    });
  }, []);

  /** Throw a stop's motif across the slate: a scatter of glyphs in the accent
   *  ink that drift and fade while the camera is still flying. It says what the
   *  next stop is about before a word of it is readable — sparks for the lab,
   *  confetti for the prizes, a postmark for the countries.
   *
   *  Purely decorative, so it is built and torn down outside React and skipped
   *  entirely for a visitor who has asked for less motion. */
  const playMotif = useCallback((kind: Motif | undefined) => {
    const layer = motifRef.current;
    if (!layer || !kind || kind === 'none') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const glyphs = MOTIF_GLYPHS[kind] ?? [];
    const timing = MOTIF_TIMING[kind];
    if (glyphs.length === 0 || !timing) return;
    const speed = tourRef.current.speed > 0 ? tourRef.current.speed : 1;
    const life = timing.duration / speed;
    layer.replaceChildren();
    for (let i = 0; i < timing.count; i += 1) {
      const bit = document.createElement('span');
      bit.className = `motif__bit motif__bit--${kind}`;
      bit.textContent = glyphs[i % glyphs.length];
      // Every piece gets its own lane, drift, size and start, so no two runs
      // of the same motif land the same way.
      bit.style.setProperty('--x', `${Math.random() * 100}%`);
      bit.style.setProperty('--y', `${Math.random() * 100}%`);
      bit.style.setProperty('--dx', `${(Math.random() - 0.5) * 220}px`);
      bit.style.setProperty('--dy', `${(Math.random() - 0.5) * 220}px`);
      bit.style.setProperty('--rot', `${(Math.random() - 0.5) * 220}deg`);
      bit.style.setProperty('--size', `${0.75 + Math.random() * 1.5}rem`);
      bit.style.animationDuration = `${life}ms`;
      bit.style.animationDelay = `${Math.random() * life * 0.45}ms`;
      layer.appendChild(bit);
    }
    // Each throw takes a number. Advancing fast enough that the previous
    // motif's cleanup lands after this one has spawned would otherwise wipe
    // the new stop's flourish the moment it appeared.
    const mine = (motifRunRef.current += 1);
    const clear = window.setTimeout(() => {
      if (motifRunRef.current === mine) layer.replaceChildren();
    }, life * 1.6);
    timersRef.current.push(clear);
  }, []);

  /** Put every item of the stops before `index` on the board without ceremony —
   *  used when a visitor jumps ahead from the tour bar's dots. */
  const showThrough = useCallback((index: number) => {
    for (let i = 0; i < index && i < stopsRef.current.length; i += 1) {
      for (const id of walkedPieces(stopsRef.current[i])) {
        if (!shownRef.current.has(id)) showItem(id, 0, false);
      }
    }
  }, [showItem]);

  const endTour = useCallback((mode: 'fit' | 'keep') => {
    if (phaseRef.current === 'live') return;
    tokenRef.current += 1;
    gateRef.current = null;
    cancelAnimationFrame(rafRef.current);
    clearTimers();
    revealAll(true);
    markTourSeen(tourRef.current.replay);
    phaseRef.current = 'live';
    setPhase('live');
    setTourWaiting(false);
    setTourPaused(false);
    if (mode === 'fit') restView(false);
  }, [clearTimers, restView, revealAll]);

  /** Parks the run until the visitor asks for the next (or previous) stop. */
  const gate = useCallback(() => new Promise<Advance>((resolve) => { gateRef.current = resolve; }), []);

  const advance = useCallback((direction: Advance) => {
    const go = gateRef.current;
    if (!go) return;
    gateRef.current = null;
    setTourWaiting(false);
    go(direction);
  }, []);

  /** The slate arriving on the wall, once, at the very start. */
  const playIntro = useCallback(async () => {
    const cfg = tourRef.current.intro;
    const speed = tourRef.current.speed > 0 ? tourRef.current.speed : 1;
    const plate = plateRef.current;
    const studs = studEls();
    const duration = cfg.duration / speed;

    if (plate) plate.style.opacity = '1';
    if (!cfg.studs) for (const stud of studs) stud.style.opacity = '1';

    if (plate && cfg.style !== 'none' && duration > 0) {
      const frames: Record<Exclude<typeof cfg.style, 'none'>, Keyframe[]> = {
        slam: [
          { opacity: 0, transform: 'scale(1.5) translateY(-70px) rotate(-2.2deg)', filter: 'blur(6px)' },
          { opacity: 1, offset: 0.42 },
          { transform: 'scale(.988) rotate(.35deg)', filter: 'blur(0px)', offset: 0.72 },
          { transform: 'none', filter: 'blur(0px)' },
        ],
        fade: [{ opacity: 0 }, { opacity: 1 }],
        raise: [
          { opacity: 0, transform: 'translateY(46px) scale(.985)' },
          { opacity: 1, offset: 0.4 },
          { transform: 'none' },
        ],
        sweep: [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }],
      };
      plate.animate(frames[cfg.style], { duration, easing: 'cubic-bezier(.16,.86,.22,1)' });
    }

    // The impact lands a little under halfway through the slate's arrival.
    const impact = cfg.style === 'none' ? 0 : duration * (300 / 640);
    const atImpact = () => {
      if (cfg.dust && flashRef.current) {
        flashRef.current.animate(
          [{ opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 0 }],
          { duration: 620 / speed, easing: 'ease-out' },
        );
      }
      if (cfg.shake && shakeRef.current) {
        shakeRef.current.animate([
          { transform: 'translate(0,0)' }, { transform: 'translate(5px,-7px)' },
          { transform: 'translate(-4px,4px)' }, { transform: 'translate(3px,2px)' },
          { transform: 'translate(-1px,-1px)' }, { transform: 'translate(0,0)' },
        ], { duration: 300 / speed, easing: 'ease-out' });
      }
      if (cfg.studs) {
        studs.forEach((stud, index) => {
          timersRef.current.push(window.setTimeout(() => {
            stud.style.opacity = '1';
            stud.animate(
              [{ transform: 'scale(2.4)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
              { duration: 240 / speed, easing: 'cubic-bezier(.2,1.4,.4,1)' },
            );
          }, (index * cfg.studStagger) / speed));
        });
      }
    };

    if (impact > 0) timersRef.current.push(window.setTimeout(atImpact, impact));
    else atImpact();
    await wait(duration);
  }, [studEls, wait]);

  const runTour = useCallback(async () => {
    const token = (tokenRef.current += 1);
    const alive = () => token === tokenRef.current;
    try {
      const box = viewportRef.current?.getBoundingClientRect();
      const stops = isNarrow(tourRef.current, box?.width ?? window.innerWidth, box?.height ?? window.innerHeight)
        ? splitStops(buildStops(tourRef.current, itemsRef.current), tourRef.current.mobile.maxPerStop)
        : buildStops(tourRef.current, itemsRef.current);
      stopsRef.current = stops;
      setTourTotal(stops.length);
      if (stops.length === 0) { endTour('fit'); return; }

      const startSpeed = tourRef.current.speed > 0 ? tourRef.current.speed : 1;
      await wait(tourRef.current.intro.hold / startSpeed);
      if (!alive()) return;
      await playIntro();
      if (!alive()) return;
      await wait(tourRef.current.intro.settle / (tourRef.current.speed > 0 ? tourRef.current.speed : 1));
      if (!alive()) return;

      let i = 0;
      while (i < stops.length) {
        if (!alive()) return;
        const stop = stops[i];
        // Read the config fresh each stop, so an owner tweaking the panel mid-run
        // sees it applied from the very next move.
        const cfg = tourRef.current;
        const speed = cfg.speed > 0 ? cfg.speed : 1;
        setTourStep(i + 1);
        setTourLabel(stop.label);
        setTourWaiting(false);

        playMotif(stop.motif);
        const target = frameFor(stop.items);
        if (target) {
          await flyTo(target, (i === 0 ? cfg.camera.firstDuration : cfg.camera.duration) / speed, motionFor(cfg, stop));
        }
        if (!alive()) return;

        // Only what the stop actually frames. A stop's `extras` — the loose
        // photographs, the stamps, the drawn marks — used to be stuck on while
        // the visitor read, and that is what made the walk look half-finished:
        // the camera is holding one card, and a photograph is fading up at the
        // edge of the frame with nothing said about it. They are held back with
        // the rest of the board and arrive together when the walk ends.
        const pieces = walkedPieces(stop);
        if (pieces.some((id) => !shownRef.current.has(id))) {
          // A stop may land its pieces its own way — the work drawer slams, the
          // lab zooms in, the countries flip over.
          const reveal = revealFor(cfg, stop);
          const order = revealSequence(pieces.length, reveal.order);
          const stagger = reveal.order === 'together' ? 0 : reveal.stagger / speed;
          for (const index of order) {
            if (!alive()) return;
            showItem(pieces[index], index, true, reveal);
            await wait(stagger);
          }
          if (!alive()) return;
        }

        setTourWaiting(true);
        const asked = await gate();
        if (!alive()) return;
        if (asked === 'skip') { endTour('fit'); return; }
        if (typeof asked === 'number') {
          const next = Math.max(0, Math.min(stops.length - 1, asked));
          showThrough(next);
          i = next;
          continue;
        }
        i = asked === 'back' ? Math.max(0, i - 1) : i + 1;
        if (i >= stops.length && tourRef.current.loop) i = 0;
      }
      if (!alive()) return;
      endTour('fit');
    } catch (error) {
      // A tour begins by hiding the board. An interrupted animation must not
      // strand visitors on an empty slate until they reload the page.
      if (!alive()) return;
      console.error('Guided tour interrupted; restoring the board.', error);
      endTour('fit');
    }
  }, [endTour, flyTo, frameFor, gate, playIntro, playMotif, showItem, showThrough, wait]);

  /** Re-hide everything and play the run from stop one. */
  const replayTour = useCallback(() => {
    manualRef.current = true;
    tokenRef.current += 1;
    gateRef.current = null;
    cancelAnimationFrame(rafRef.current);
    clearTimers();
    setCardMenu(null);
    hideAll();
    fitAll(true);
    setTourStep(0);
    setTourLabel('');
    setTourWaiting(false);
    setTourPaused(false);
    phaseRef.current = 'tour';
    setPhase('tour');
    void runTour();
  }, [clearTimers, fitAll, hideAll, runTour]);

  // Latest boot/teardown closures. Keeping them on a ref lets the mount effect
  // below carry an empty dependency list — it must fire exactly once per mount
  // and never restart a run in flight because some callback changed identity.
  const bootRef = useRef({ boot: () => {}, stop: () => {} });
  useLayoutEffect(() => {
    bootRef.current = {
      boot: () => {
        if (phaseRef.current !== 'pre') return;
        hideAll();
        phaseRef.current = 'tour';
        setPhase('tour');
        void runTour();
      },
      stop: () => {
        tokenRef.current += 1;
        cancelAnimationFrame(rafRef.current);
        clearTimers();
        // React's development double-mount tears the tour down and mounts
        // again; rewinding lets the second mount replay it instead of leaving
        // the board hidden forever.
        if (phaseRef.current === 'tour') {
          revealAll();
          phaseRef.current = 'pre';
        }
      },
    };
  });

  // Runs after the first commit but before the browser paints, so a toured
  // board is hidden without ever flashing fully populated.
  useLayoutEffect(() => {
    bootRef.current.boot();
    return () => bootRef.current.stop();
  }, []);

  // Anything rendered while the run is in flight — remote data landing, a card
  // the owner just added — starts hidden until its stop reaches it.
  useLayoutEffect(() => {
    if (phaseRef.current === 'live') return;
    for (const el of boardItems()) {
      const id = el.dataset.card ?? '';
      if (shownRef.current.has(id)) continue;
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
    }
  });

  // An owner session that resolves after the tour started still wins: the
  // editor must not fight an animation. A preview the owner asked for does not
  // count.
  useEffect(() => {
    if (authed && phaseRef.current !== 'live' && !manualRef.current) endTour('fit');
  }, [authed, endTour]);

  // Remote settings can disable the tour after the fixture copy started one.
  useEffect(() => {
    if (!tour.enabled && phaseRef.current !== 'live' && !manualRef.current) endTour('fit');
  }, [tour.enabled, endTour]);

  // Unattended mode: hold each stop for the dwell, then move on.
  useEffect(() => {
    if (phase !== 'tour' || !tourWaiting || tour.advance !== 'auto' || tourPaused) return undefined;
    const speed = tour.speed > 0 ? tour.speed : 1;
    const id = window.setTimeout(() => advance('next'), tour.dwell / speed);
    return () => window.clearTimeout(id);
  }, [advance, phase, tourWaiting, tourPaused, tourStep, tour.advance, tour.dwell, tour.speed]);

  // owner session recovery (owner intent without remote data opens the login
  // immediately via the initial loginOpen state, so no sync setState here).
  useEffect(() => {
    if (!remoteDataEnabled) return undefined;
    let active = true;
    hasOwnerSession()
      .then((has) => (has ? isCurrentUserOwner() : false))
      .then((owner) => { if (active && owner) setAuthed(true); else if (active && ownerIntent) setLoginOpen(true); })
      .catch(() => { if (active && ownerIntent) setLoginOpen(true); });
    return () => { active = false; };
  }, [remoteDataEnabled, ownerIntent]);

  // ---- persistence ----------------------------------------------------------
  const settingTimers = useRef<Record<string, number>>({});
  const saveSetting = useCallback((key: string, value: unknown, delay = 450) => {
    if (!remoteDataEnabled) return; // local preview: keep edits in session only
    window.clearTimeout(settingTimers.current[key]);
    settingTimers.current[key] = window.setTimeout(() => {
      saveSiteSetting(key, value).catch((reason: unknown) => flash(reason instanceof Error ? reason.message : tRef.current('msg.saveFailed'), true));
    }, delay);
  }, [flash, remoteDataEnabled]);

  const commitTheme = useCallback((next: ThemeConfig) => { setSettings((s) => ({ ...s, theme: next })); saveSetting('theme', next); }, [saveSetting]);
  const commitBoard = useCallback((next: BoardConfig) => { setSettings((s) => ({ ...s, board: next })); saveSetting('board', next); }, [saveSetting]);
  const commitI18n = useCallback((next: I18nConfig) => { setSettings((s) => ({ ...s, 'site.i18n': next })); saveSetting('site.i18n', next); }, [saveSetting]);
  const commitUi = useCallback((next: UiOverrides) => { setSettings((s) => ({ ...s, 'site.ui': next })); saveSetting('site.ui', next); }, [saveSetting]);

  /** Apply a patch to a raw item, routing prose into the active language slot
   *  and everything else — tones, layouts, ids — straight through. */
  const patchText = useCallback(<T extends Record<string, unknown>>(raw: T, patch: Partial<T>, fields: readonly string[]): T => {
    const next: Record<string, unknown> = { ...raw };
    for (const [key, value] of Object.entries(patch)) {
      next[key] = i18n.enabled && typeof value === 'string' && fields.includes(key)
        ? putText(raw[key], activeLang, value, i18n.primary)
        : value;
    }
    return next as T;
  }, [i18n.enabled, i18n.primary, activeLang]);

  /** Stamps carry prose, so an edit lands in the language the owner is in. */
  const commitPassport = useCallback((next: PassportStamp[]) => {
    // The edit arrives in one language; the document keeps them all. Merge each
    // stamp back over its stored record so the other language survives.
    const stored = settings['board.passport'];
    const byId = new Map<string, Record<string, unknown>>();
    if (Array.isArray(stored)) {
      for (const row of stored as Array<Record<string, unknown>>) {
        if (row && typeof row.id === 'string') byId.set(row.id, row);
      }
    }
    const merged = next.map((stamp) => patchText(
      byId.get(stamp.id) ?? {},
      stamp as unknown as Record<string, unknown>,
      ['place', 'note', 'city'],
    ));
    setSettings((s) => ({ ...s, 'board.passport': merged }));
    saveSetting('board.passport', merged);
  }, [patchText, saveSetting, settings]);
  const commitLayout = useCallback((next: LayoutMap) => { setSettings((s) => ({ ...s, 'board.layout': next })); saveSetting('board.layout', next, 150); }, [saveSetting]);
  const commitTour = useCallback((next: TourConfig) => { setSettings((s) => ({ ...s, 'board.tour': next })); saveSetting('board.tour', next); }, [saveSetting]);
  const commitObjects = useCallback((next: DeskObject[]) => { setSettings((s) => ({ ...s, 'board.objects': next })); saveSetting('board.objects', next); }, [saveSetting]);
  const commitWorld = useCallback((next: { paint: PaintMode }) => { setSettings((s) => ({ ...s, 'board.world': next })); saveSetting('board.world', next); }, [saveSetting]);

  // A ref, because the translate action is declared after the edit path that
  // triggers it and neither should force the other to re-create.
  const autoTranslateRef = useRef<(entryId: string) => void>(() => {});

  // ---- the save queue -------------------------------------------------------
  //
  // Saving used to be one slot and one in-flight request. Two things went
  // wrong with that, and both of them looked to the owner like "it did not
  // keep what I wrote":
  //
  //  - the queued payload carried the version the entry had when it was
  //    edited. If a save had completed in between, that version was already
  //    stale and Postgres rejected the write with an edit conflict — and the
  //    payload had already been cleared, so the text was simply gone;
  //  - a second entry edited while the first was saving overwrote the slot, so
  //    translating several dossiers persisted the first and the last only.
  //
  // Now there is a queue keyed by entry, the version is stamped from the last
  // one the server acknowledged rather than from the edit, and nothing leaves
  // the queue until the server has taken it.
  const pendingEntries = useRef(new Map<string, StoredPortfolioEntry>());
  const entryVersions = useRef(new Map<string, number>());
  const savingRef = useRef(false);
  const entryTimer = useRef<number>(0);
  const flushRef = useRef<() => void>(() => {});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const rawEntriesRef = useRef<StoredPortfolioEntry[]>(rawEntries);
  useEffect(() => { rawEntriesRef.current = rawEntries; }, [rawEntries]);
  const rawBoardRef = useRef<BoardConfig>(rawBoard);
  useEffect(() => { rawBoardRef.current = rawBoard; }, [rawBoard]);
  const primaryRef = useRef(i18n.primary);
  useEffect(() => { primaryRef.current = i18n.primary; }, [i18n.primary]);

  const flushEntry = useCallback(() => {
    if (!remoteDataEnabled) { pendingEntries.current.clear(); setSaveState('idle'); return; } // local preview
    if (savingRef.current) return;
    const first = pendingEntries.current.entries().next();
    if (first.done) return;
    const [id, queued] = first.value;
    savingRef.current = true;
    setSaveState('saving');

    const send = (version: number) => saveContentEntry({ ...queued, version }, 'inline edit', primaryRef.current);
    const known = entryVersions.current.get(id) ?? queued.version;

    send(known)
      // An edit conflict here means the version counter moved on — another tab,
      // or a save this session lost track of. The content in hand is still the
      // owner's newest, so adopt the server's counter and write it once more
      // rather than dropping what they typed.
      .catch(async (reason: unknown) => {
        const message = reason instanceof Error ? reason.message : '';
        if (!message.startsWith('Edit conflict')) throw reason;
        const fresh = await getEntryVersion(id);
        if (fresh === null) throw reason;
        entryVersions.current.set(id, fresh);
        return send(fresh);
      })
      .then((saved) => {
        entryVersions.current.set(id, saved.version);
        // Only drop the payload when nothing newer arrived while it was in
        // flight; otherwise the next pass picks the newer one up.
        if (pendingEntries.current.get(id) === queued) pendingEntries.current.delete(id);
        setEntries((list) => list.map((item) => (item.id === saved.id ? { ...item, version: saved.version } : item)));
        setSaveError('');
        setSaveState(pendingEntries.current.size > 0 ? 'pending' : 'saved');
      })
      .catch((reason: unknown) => {
        const message = reason instanceof Error ? reason.message : '';
        setSaveError(message);
        setSaveState('error');
        flash(tRef.current('msg.textSaveFailed', { detail: message }), true);
      })
      .finally(() => {
        savingRef.current = false;
        if (pendingEntries.current.size > 0) {
          window.clearTimeout(entryTimer.current);
          entryTimer.current = window.setTimeout(() => flushRef.current(), 400);
        }
      });
  }, [flash, remoteDataEnabled]);
  useEffect(() => { flushRef.current = flushEntry; }, [flushEntry]);

  /** Put an already-merged raw entry into the queue and start the timer. */
  const queueEntry = useCallback((merged: StoredPortfolioEntry) => {
    rawEntriesRef.current = rawEntriesRef.current.map((item) => (item.id === merged.id ? merged : item));
    setEntries((list) => list.map((item) => (item.id === merged.id ? merged : item)));
    if (!remoteDataEnabled) return;
    pendingEntries.current.set(merged.id, merged);
    setSaveState((current) => (current === 'saving' ? current : 'pending'));
    window.clearTimeout(entryTimer.current);
    entryTimer.current = window.setTimeout(() => flushRef.current(), 600);
  }, [remoteDataEnabled]);

  const changeEntry = useCallback((next: PortfolioEntry) => {
    // `next` came from the localised view: it carries the structure, the raw
    // entry carries the languages. Read the raw one from the ref rather than
    // from a render closure, so two edits landing back to back cannot compute
    // the second from a copy that predates the first.
    const raw = rawEntriesRef.current.find((item) => item.id === next.id);
    const merged = (i18n.enabled && raw
      ? mergeEdit(raw, next, entryTextSlots(next), activeLang, i18n.primary)
      : next) as StoredPortfolioEntry;
    queueEntry(merged);
    autoTranslateRef.current(merged.id);
  }, [queueEntry, i18n.enabled, i18n.primary, activeLang]);

  // Nothing in the queue may be lost to a closed tab or a reloaded page: flush
  // on the way out, and say so if the browser is willing to ask.
  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (pendingEntries.current.size === 0) return;
      flushRef.current();
      event.preventDefault();
    };
    const onHide = () => { if (pendingEntries.current.size > 0) flushRef.current(); };
    window.addEventListener('beforeunload', onLeave);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.removeEventListener('beforeunload', onLeave);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  const editCard = useCallback((cardId: string, patch: Partial<BoardCard>) => {
    commitBoard({
      ...rawBoard,
      cards: rawBoard.cards.map((card) => (card.id === cardId ? patchText(card as unknown as Record<string, unknown>, patch as Record<string, unknown>, CARD_TEXT_FIELDS) as unknown as BoardCard : card)),
    });
  }, [rawBoard, commitBoard, patchText]);

  /** The rotate handle is primarily dragged, but a keyboard click also nudges
   * an item by five degrees. It wraps after the practical visual limit. */
  const nudgeItemRotation = useCallback((id: string, current: Geom) => {
    const rotation = current.rot >= 30 ? -30 : current.rot + 5;
    const next = {
      ...layout,
      [id]: { x: current.x, y: current.y, rot: rotation, w: current.w },
    };
    if (authedRef.current) commitLayout(next);
    else setSettings((settings) => ({ ...settings, 'board.layout': next }));
  }, [layout, commitLayout]);

  const moveEntryGroup = useCallback((entry: PortfolioEntry, group: string) => {
    const order = entriesForGroup(entries, group).length;
    changeEntry({ ...entry, metadata: { ...entry.metadata, group, order } });
  }, [entries, changeEntry]);

  const reorderEntries = useCallback((reordered: PortfolioEntry[]) => {
    reordered.forEach((entry) => changeEntry(entry));
  }, [changeEntry]);

  const addEntryToDrawer = useCallback((group: string) => {
    const title = window.prompt(tRef.current('inv.titlePrompt'))?.trim();
    if (!title) return;

    const base = createEntry('note');
    const label = board.groups.find((item) => item.id === group)?.label ?? group;
    const entry: PortfolioEntry = {
      ...base,
      // Version 0 tells save_content_entry that this is a new row. The RPC
      // inserts it and returns the first persisted version (1).
      version: 0,
      slug: slugify(title) || `nota-${base.id.slice(0, 6)}`,
      title,
      summary: '',
      status: 'published',
      publishedAt: new Date().toISOString(),
      metadata: { kicker: label, when: '', where: '', group, order: entriesForGroup(entries, group).length },
      blocks: [],
    };

    void (async () => {
      try {
        const saved = remoteDataEnabled ? await saveContentEntry(entry, 'create from drawer', primaryRef.current) : entry;
        setEntries((list) => [...list, saved]);
        flash(tRef.current('inv.created'));
      } catch (reason) {
        flash(reason instanceof Error ? reason.message : tRef.current('inv.createFailed'), true);
      }
    })();
  }, [board.groups, entries, flash, remoteDataEnabled]);

  const deleteEntryFromDrawer = useCallback((entry: PortfolioEntry) => {
    if (!window.confirm(tRef.current('inv.confirmTrash', { title: entry.title }))) return;

    void (async () => {
      try {
        if (remoteDataEnabled) await deleteContentEntry({ id: entry.id, version: entry.version });
        setEntries((list) => list.filter((item) => item.id !== entry.id));
        flash(tRef.current('inv.trashed'));
      } catch (reason) {
        flash(reason instanceof Error ? reason.message : tRef.current('inv.deleteFailed'), true);
      }
    })();
  }, [flash, remoteDataEnabled]);

  // Media upload: Neon Object Storage in production, an in-browser data URL in
  // local preview so the whole flow is testable offline. Both paths retain the
  // original bytes: files are never converted or recompressed in the editor.
  const uploadMediaFile = useCallback(async (file: File): Promise<{ url: string; mimeType: string }> => {
    const mimeType = mediaContentType(file);
    if (!mimeType) throw new Error('Solo se pueden subir imágenes AVIF, GIF, HEIC, HEIF, JPEG, PNG o WebP, o vídeos MP4, MOV, M4V y WebM.');
    const maxBytes = maxUploadBytesForMediaType(mimeType);
    if (!maxBytes || file.size > maxBytes) {
      const kind = isVideoMedia(mimeType) ? 'vídeo' : 'imagen';
      const limit = Math.round((maxBytes ?? 0) / (1024 * 1024));
      throw new Error(`El ${kind} supera el límite de ${limit} MB.`);
    }
    if (!remoteDataEnabled) {
      return new Promise<{ url: string; mimeType: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ url: String(reader.result), mimeType });
        reader.onerror = () => reject(new Error(tRef.current('msg.imageReadFailed')));
        reader.readAsDataURL(file);
      });
    }
    const asset = await uploadMedia(file, file.name);
    return { url: asset.publicUrl, mimeType: asset.mimeType };
  }, [remoteDataEnabled]);

  /** The same upload path, in the shape the world's objects want: a URL, or a
   *  throw. The passport's photographs are the only caller today. */
  const uploadWorldMedia = useCallback(
    (file: File) => uploadMediaFile(file).then((media) => media.url),
    [uploadMediaFile],
  );

  const pickPolaroidMedia = useCallback((polaroidId: string, file: File) => {
    setPolBusy(polaroidId);
    uploadMediaFile(file)
      .then((media) => { commitBoard({ ...rawBoard, polaroids: rawBoard.polaroids.map((p) => (p.id === polaroidId ? { ...p, assetUrl: media.url, assetMediaType: media.mimeType, imageFrame: undefined } : p)) }); })
      .catch((reason: unknown) => flash(reason instanceof Error ? reason.message : tRef.current('msg.uploadFailed'), true))
      .finally(() => setPolBusy(null));
  }, [rawBoard, commitBoard, flash, uploadMediaFile]);

  // ---- board card management ------------------------------------------------
  const viewCenterWorld = useCallback(() => {
    const vp = viewportRef.current;
    const v = view.current;
    if (!vp) return { x: 200, y: 200 };
    const rect = vp.getBoundingClientRect();
    return { x: Math.round((rect.width / 2 - v.x) / v.s - 150), y: Math.round((rect.height / 2 - v.y) / v.s - 90) };
  }, []);

  const addCard = useCallback((type: 'drawer' | 'spotlight' | 'sticker' | 'spotify' | 'stamp' | 'scrap') => {
    const at = viewCenterWorld();
    const id = crypto.randomUUID();
    const newCard: Record<typeof type, BoardCard> = {
      drawer: { id, type: 'drawer', x: at.x, y: at.y, rot: 0, w: 440, tone: 'paper', kicker: '', title: '', group: board.groups[0]?.id ?? 'random', layout: 'compact' },
      spotlight: { id, type: 'spotlight', x: at.x, y: at.y, rot: 0, w: 400, tone: 'paperWarm', kicker: '', title: '', blurb: '', open: entries[0]?.slug },
      sticker: { id, type: 'sticker', x: at.x, y: at.y, rot: 0, w: 300, tone: 'paperCream', kicker: '', title: '', langs: [['', '', 5]], open: entries[0]?.slug },
      spotify: { id, type: 'spotify', x: at.x, y: at.y, rot: 0, w: 420, spotifyUrl: '' },
      stamp: { id, type: 'stamp', x: at.x, y: at.y, rot: 0, w: 190, glyph: '✦', title: '', denom: '', postmark: '', open: entries[0]?.slug },
      scrap: { id, type: 'scrap', x: at.x, y: at.y, rot: 0, w: 120, kind: 'star' },
    };
    commitBoard({ ...rawBoard, cards: [...rawBoard.cards, newCard[type]] });
    setCardMenu(id);
  }, [rawBoard, commitBoard, entries, board.groups, viewCenterWorld]);

  const addPolaroid = useCallback(() => {
    const at = viewCenterWorld();
    const polaroid: Polaroid = { id: crypto.randomUUID(), x: at.x, y: at.y, rot: 0, w: 280, h: 220, caption: '', placeholder: '' };
    commitBoard({ ...rawBoard, polaroids: [...rawBoard.polaroids, polaroid] });
  }, [rawBoard, commitBoard, viewCenterWorld]);

  const addNote = useCallback(() => {
    const at = viewCenterWorld();
    const note: Marginal = { id: crypto.randomUUID(), x: at.x, y: at.y, rot: 0, w: 250, style: 'amber', text: '' };
    commitBoard({ ...rawBoard, marginalia: [...rawBoard.marginalia, note] });
  }, [rawBoard, commitBoard, viewCenterWorld]);

  // Removing a card the board ships with has to be remembered, or the merge in
  // `parseBoard` — the one that lets a board gain a card added upstream — would
  // put it straight back on the next load.
  const removeCard = useCallback((id: string) => {
    const shipped = DEFAULT_BOARD.cards.some((card) => card.id === id);
    commitBoard({
      ...rawBoard,
      cards: rawBoard.cards.filter((c) => c.id !== id),
      dismissed: shipped && !rawBoard.dismissed.includes(id) ? [...rawBoard.dismissed, id] : rawBoard.dismissed,
    });
    setCardMenu(null);
  }, [rawBoard, commitBoard]);
  const removePolaroid = useCallback((id: string) => { commitBoard({ ...rawBoard, polaroids: rawBoard.polaroids.filter((p) => p.id !== id) }); }, [rawBoard, commitBoard]);
  const removeNote = useCallback((id: string) => { commitBoard({ ...rawBoard, marginalia: rawBoard.marginalia.filter((n) => n.id !== id) }); }, [rawBoard, commitBoard]);
  const editPolaroid = useCallback((id: string, patch: Partial<Polaroid>) => { commitBoard({ ...rawBoard, polaroids: rawBoard.polaroids.map((p) => (p.id === id ? patchText(p as unknown as Record<string, unknown>, patch as Record<string, unknown>, POLAROID_TEXT_FIELDS) as unknown as Polaroid : p)) }); }, [rawBoard, commitBoard, patchText]);
  const editNote = useCallback((id: string, patch: Partial<Marginal>) => { commitBoard({ ...rawBoard, marginalia: rawBoard.marginalia.map((n) => (n.id === id ? patchText(n as unknown as Record<string, unknown>, patch as Record<string, unknown>, NOTE_TEXT_FIELDS) as unknown as Marginal : n)) }); }, [rawBoard, commitBoard, patchText]);

  // ---- pointer / wheel ------------------------------------------------------
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return undefined;

    const onWheel = (event: WheelEvent) => {
      if (openSlugRef.current) return;
      event.preventDefault();
      // In scroll mode the wheel drives the run instead of the zoom. Every
      // other mode keeps zooming, including mid-tour: exploring inside a stop
      // is intended and never ends the run.
      if (phaseRef.current === 'tour' && tourRef.current.advance === 'scroll') {
        const now = performance.now();
        if (now - scrollAtRef.current < 420 || Math.abs(event.deltaY) < 2) return;
        scrollAtRef.current = now;
        advance(event.deltaY > 0 ? 'next' : 'back');
        return;
      }
      const rect = vp.getBoundingClientRect();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.0016), false);
    };

    const isInteractive = (el: HTMLElement | null) =>
      !!el && !!el.closest('[data-nodrag], a, button, input, select, textarea');

    // ---- touch: pinch to zoom, two fingers to pan, double tap to zoom -------
    const live = pointersRef.current;
    const points = () => Array.from(live.values());
    const spread = () => {
      const [a, b] = points();
      return { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
    };

    const onPointerMoveGlobal = (event: PointerEvent) => {
      if (!live.has(event.pointerId)) return;
      const rect = vp.getBoundingClientRect();
      live.set(event.pointerId, { x: event.clientX - rect.left, y: event.clientY - rect.top });
      const pinch = pinchRef.current;
      if (!pinch || live.size < 2) return;
      const now = spread();
      if (!(pinch.dist > 0)) return;
      const s = Math.max(0.14, Math.min(2.4, pinch.view.s * (now.dist / pinch.dist)));
      // The world point under the first midpoint stays under the current one,
      // so the pinch zooms and pans in a single gesture.
      const bx = (pinch.cx - pinch.view.x) / pinch.view.s;
      const by = (pinch.cy - pinch.view.y) / pinch.view.s;
      view.current = { s, x: now.cx - bx * s, y: now.cy - by * s };
      paint(false);
    };

    const endPointer = (event: PointerEvent) => {
      live.delete(event.pointerId);
      if (live.size < 2) pinchRef.current = null;
      if (live.size === 0 && pinchedRef.current) {
        // Keep the drag flag up just past the click the browser synthesizes
        // when the last finger lifts, or a pinch that ends over a drawer row
        // would open its dossier.
        window.setTimeout(() => { pinchedRef.current = false; didDrag.current = false; }, 60);
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (openSlugRef.current) return;
      const rect0 = vp.getBoundingClientRect();
      if (event.pointerType === 'touch') {
        // A primary pointer is the first finger of a new gesture, so anything
        // still in the map is a pointer whose release was never delivered —
        // a finger lifted over browser chrome, say. Start clean.
        if (event.isPrimary) { live.clear(); pinchRef.current = null; pinchedRef.current = false; }
        live.set(event.pointerId, { x: event.clientX - rect0.left, y: event.clientY - rect0.top });
        if (live.size === 2) {
          // A second finger turns whatever was happening into a camera
          // gesture: never a card drag, never a click.
          pinchedRef.current = true;
          didDrag.current = true;
          const start = spread();
          pinchRef.current = { ...start, view: { ...view.current } };
          return;
        }
        if (live.size > 2) return;

        const tap = tapRef.current;
        const now = performance.now();
        if (now - tap.at < 320 && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) < 34) {
          tapRef.current = { at: 0, x: 0, y: 0 };
          const card = (event.target as HTMLElement).closest<HTMLElement>('[data-card]');
          if (card) centerNode(card); else fitAll();
          return;
        }
        tapRef.current = { at: now, x: event.clientX, y: event.clientY };
      }
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      const card = target.closest<HTMLElement>('[data-card]');
      const resizeHandle = target.closest<HTMLElement>('[data-card-resize]');
      const rotateHandle = target.closest<HTMLElement>('[data-card-rotate]');

      // The circular-arrow handle sets the card's real rotation instead of
      // merely changing its hover state. Its angle is measured around the
      // rendered card centre, which keeps the gesture natural at every zoom.
      if (rotateHandle && card) {
        event.preventDefault();
        didDrag.current = false;
        const bounds = card.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const startPointerAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
        const startRotation = parseFloat(card.dataset.rot || '0');
        let rotation = startRotation;
        card.style.zIndex = String(++zTop.current);
        card.style.transition = 'none';
        card.classList.add('is-rotating');

        const move = (ev: PointerEvent) => {
          if (pinchRef.current) return;
          const pointerAngle = Math.atan2(ev.clientY - centerY, ev.clientX - centerX) * 180 / Math.PI;
          let delta = pointerAngle - startPointerAngle;
          if (delta > 180) delta -= 360;
          if (delta < -180) delta += 360;
          rotation = Math.max(-30, Math.min(30, startRotation + delta));
          card.style.transform = `rotate(${rotation.toFixed(2)}deg)`;
          if (!didDrag.current && Math.hypot(ev.clientX - event.clientX, ev.clientY - event.clientY) > 4) {
            didDrag.current = true;
          }
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          card.classList.remove('is-rotating');
          card.style.transition = '';
          rotation = Math.round(rotation * 2) / 2;
          card.style.transform = `rotate(${rotation}deg)`;
          if (didDrag.current && !pinchedRef.current) {
            const id = card.dataset.card as string;
            const geom: LayoutOverride = {
              x: parseFloat(card.style.left || '0'),
              y: parseFloat(card.style.top || '0'),
              rot: rotation,
            };
            const width = parseFloat(card.style.width || '0');
            if (width) geom.w = width;
            const next = { ...layout, [id]: geom };
            if (authedRef.current) commitLayout(next); else setSettings((s) => ({ ...s, 'board.layout': next }));
          }
          window.setTimeout(() => { didDrag.current = false; }, 60);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return;
      }

      // Resize from the card's own left/right edge. Pointer movement is
      // projected onto the card's local x-axis, so an inclined card keeps the
      // same angle while its width changes. The small position correction
      // compensates for CSS's centred transform origin and keeps the opposite
      // edge anchored during the resize.
      if (resizeHandle && card) {
        event.preventDefault();
        const side = resizeHandle.dataset.cardResize === 'left' ? 'left' : 'right';
        const startX = event.clientX;
        const startY = event.clientY;
        const startW = parseFloat(card.style.width || '0');
        const startLeft = parseFloat(card.style.left || '0');
        const startTop = parseFloat(card.style.top || '0');
        const rot = parseFloat(card.dataset.rot || '0');
        const radians = rot * Math.PI / 180;
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        card.style.zIndex = String(++zTop.current);
        card.style.transition = 'none';
        card.classList.add('is-resizing');

        const move = (ev: PointerEvent) => {
          if (pinchRef.current) return;
          const dx = (ev.clientX - startX) / view.current.s;
          const dy = (ev.clientY - startY) / view.current.s;
          const localDelta = dx * cos + dy * sin;
          const candidate = startW + (side === 'right' ? localDelta : -localDelta);
          const width = Math.max(CARD_WIDTH_MIN, Math.min(CARD_WIDTH_MAX, candidate));
          const change = width - startW;
          card.style.width = `${width}px`;
          if (side === 'right') {
            card.style.left = `${startLeft + change * (cos - 1) / 2}px`;
            card.style.top = `${startTop + change * sin / 2}px`;
          } else {
            card.style.left = `${startLeft - change * (cos + 1) / 2}px`;
            card.style.top = `${startTop - change * sin / 2}px`;
          }
          if (!didDrag.current && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) {
            didDrag.current = true;
          }
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          card.classList.remove('is-resizing');
          card.style.transition = '';
          card.style.transform = `rotate(${rot}deg)`;
          const width = Math.max(
            CARD_WIDTH_MIN,
            Math.min(CARD_WIDTH_MAX, Math.round(parseFloat(card.style.width || String(startW)) / CARD_WIDTH_STEP) * CARD_WIDTH_STEP),
          );
          card.style.width = `${width}px`;
          card.style.filter = 'none';
          if (didDrag.current && !pinchedRef.current) {
            const id = card.dataset.card as string;
            const geom: LayoutOverride = {
              x: parseFloat(card.style.left || '0'),
              y: parseFloat(card.style.top || '0'),
              rot,
              w: width,
            };
            if (card.classList.contains('note')) editNote(id, { w: width });
            else editCard(id, { w: width });
            const next = { ...layout, [id]: geom };
            if (authedRef.current) commitLayout(next); else setSettings((s) => ({ ...s, 'board.layout': next }));
          }
          window.setTimeout(() => { didDrag.current = false; }, 60);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return;
      }

      if (isInteractive(target) || target.isContentEditable) return;
      didDrag.current = false;
      const startX = event.clientX;
      const startY = event.clientY;

      if (card && !positionsLocked) {
        card.style.zIndex = String(++zTop.current);
        const rot = parseFloat(card.dataset.rot || '0');
        const ox = parseFloat(card.style.left || '0');
        const oy = parseFloat(card.style.top || '0');
        card.style.transition = 'none';
        const move = (ev: PointerEvent) => {
          // A second finger takes over as a pinch; the card stops following.
          if (pinchRef.current) return;
          const dx = (ev.clientX - startX) / view.current.s;
          const dy = (ev.clientY - startY) / view.current.s;
          if (!didDrag.current && Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) {
            didDrag.current = true;
            card.classList.add('is-dragging');
            card.style.transform = `rotate(${(rot * 0.35).toFixed(2)}deg) scale(1.02)`;
            card.style.filter = 'drop-shadow(0 24px 30px rgba(0,0,0,.45))';
          }
          if (!didDrag.current) return;
          card.style.left = `${ox + dx}px`;
          card.style.top = `${oy + dy}px`;
        };
        const up = () => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          card.classList.remove('is-dragging');
          card.style.filter = 'none';
          card.style.transform = `rotate(${rot}deg)`;
          // A gesture that turned into a pinch moved the camera, not the card.
          if (didDrag.current && !pinchedRef.current) {
            const id = card.dataset.card as string;
            const geom: LayoutOverride = { x: parseFloat(card.style.left || '0'), y: parseFloat(card.style.top || '0'), rot };
            const w = parseFloat(card.style.width || '0');
            if (w) geom.w = w;
            const next = { ...layout, [id]: geom };
            if (authedRef.current) commitLayout(next); else setSettings((s) => ({ ...s, 'board.layout': next }));
          }
          window.setTimeout(() => { didDrag.current = false; }, 60);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        return;
      }

      const v0 = { x: view.current.x, y: view.current.y };
      vp.classList.add('is-panning');
      const move = (ev: PointerEvent) => {
        if (pinchRef.current) return; // the pinch handler owns the camera now
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 4) didDrag.current = true;
        view.current = { ...view.current, x: v0.x + (ev.clientX - startX), y: v0.y + (ev.clientY - startY) };
        paint(false);
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        vp.classList.remove('is-panning');
        window.setTimeout(() => { didDrag.current = false; }, 60);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    };

    const onClick = (event: MouseEvent) => {
      if (didDrag.current) return;
      const target = event.target as HTMLElement;
      if (isInteractive(target) || target.isContentEditable) return;
      const more = target.closest<HTMLElement>('[data-more]');
      if (more?.dataset.more) { setOverflowGroup(more.dataset.more); return; }
      const hit = target.closest<HTMLElement>('[data-open]');
      if (hit?.dataset.open) setOpenSlug(hit.dataset.open);
    };

    const onDblClick = (event: MouseEvent) => {
      if (openSlugRef.current) return;
      const card = (event.target as HTMLElement).closest<HTMLElement>('[data-card]');
      if (card) centerNode(card); else fitAll();
    };

    vp.addEventListener('wheel', onWheel, { passive: false });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('click', onClick);
    vp.addEventListener('dblclick', onDblClick);
    window.addEventListener('pointermove', onPointerMoveGlobal);
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('click', onClick);
      vp.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('pointermove', onPointerMoveGlobal);
      window.removeEventListener('pointerup', endPointer);
      window.removeEventListener('pointercancel', endPointer);
      live.clear();
      pinchRef.current = null;
    };
  }, [advance, zoomAt, paint, centerNode, fitAll, commitLayout, editCard, editNote, layout, positionsLocked]);

  // ---- keyboard -------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) { if (event.key === 'Escape') target?.blur(); return; }
      if (loginOpen || themeOpen || tourOpen || inventoryOpen || wordingOpen || overflowGroup || cardMenu) { if (event.key === 'Escape') { setLoginOpen(false); setThemeOpen(false); setTourOpen(false); setInventoryOpen(false); setWordingOpen(false); setOverflowGroup(null); setCardMenu(null); } return; }
      const current = openSlugRef.current;
      if (current) {
        if (event.key === 'Escape') setOpenSlug(null);
        if (event.key === 'ArrowRight') { const i = orderedSlugs.indexOf(current); if (i >= 0) setOpenSlug(orderedSlugs[(i + 1) % orderedSlugs.length]); }
        if (event.key === 'ArrowLeft') { const i = orderedSlugs.indexOf(current); if (i >= 0) setOpenSlug(orderedSlugs[(i - 1 + orderedSlugs.length) % orderedSlugs.length]); }
        return;
      }
      // Tour keys, only while it is running and nothing is open above it.
      if (phaseRef.current === 'tour') {
        if (event.key === 'Escape') { endTour('fit'); return; }
        if (event.key === ' ' || event.key === 'Enter' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          advance('next');
          return;
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); advance('back'); return; }
      }
      if (event.key === 'f') fitAll();
      if (event.key === 'E' && event.shiftKey && !authedRef.current) setLoginOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advance, endTour, fitAll, orderedSlugs, loginOpen, themeOpen, tourOpen, inventoryOpen, wordingOpen, overflowGroup, cardMenu]);

  // ---- arrange --------------------------------------------------------------
  const draggableIds = useMemo(() => [
    ...board.cards.map((c) => c.id),
    ...board.polaroids.map((p) => p.id),
    ...(theme.showMarginalia ? board.marginalia.map((n) => n.id) : []),
  ], [board, theme.showMarginalia]);

  const arrange = useCallback((mode: 'scatter' | 'reset') => {
    const apply = (next: LayoutMap) => { if (authedRef.current) commitLayout(next); else setSettings((s) => ({ ...s, 'board.layout': next })); };
    if (mode === 'reset') { apply({}); return; }
    const boardEl = boardRef.current;
    if (!boardEl) return;
    const next: LayoutMap = {};
    for (const id of draggableIds) {
      const node = boardEl.querySelector<HTMLElement>(`[data-card="${id}"]`);
      if (!node) continue;
      next[id] = {
        x: 50 + Math.random() * Math.max(50, board.size.width - node.offsetWidth - 100),
        y: 50 + Math.random() * Math.max(50, board.size.height - node.offsetHeight - 100),
        rot: Number((Math.random() * 12 - 6).toFixed(2)),
      };
    }
    apply(next);
  }, [board.size.height, board.size.width, commitLayout, draggableIds]);

  // ---- translation ----------------------------------------------------------
  //
  // Authoring-time only: the result is stored next to the source, so a visitor
  // never waits on a translation service and an outage cannot blank the site.
  //
  // What used to go wrong, in the order it bit:
  //
  //  1. Every run translated the whole site — 144 fields and about 9.000
  //     characters on the seeded board alone. MyMemory's free allowance is
  //     ~5.000 characters a day anonymously, so the very first press ran out
  //     of allowance somewhere in the middle.
  //  2. Everything was thrown away when it did. The fields already translated
  //     lived in a local variable that the `throw` skipped straight past, so a
  //     run that got nine tenths of the way through saved nothing at all.
  //  3. The finished run called `setEntries` with a list captured before the
  //     first request went out, so anything typed during those seconds was
  //     silently overwritten — with `Translate as I write` on, that is a real
  //     risk every ninety seconds.
  //  4. It only ever filled languages that were empty, so editing the Spanish
  //     never reached the English again. "Nothing left to translate" was the
  //     answer to a board that plainly needed translating.
  //
  // So: the open article is the default scope, work is committed batch by
  // batch, every merge happens against the live state, and a `refresh` pass
  // exists for text that has been rewritten.
  const [translating, setTranslating] = useState(false);
  const translatingRef = useRef(false);
  const canTranslate = i18n.enabled
    && translatorAvailable({ provider: i18n.provider, endpoint: runtimeConfig.translateFunctionUrl })
    && i18n.languages.length > 1;

  /** One batch of slots at a time, so a refusal half way through costs the
   *  batch rather than the run. */
  const TRANSLATE_BATCH = 6;

  const runTranslate = useCallback(async (options: {
    entryId?: string;
    scope?: TranslateScope;
    source?: string;
    includeBoard?: boolean;
    quiet?: boolean;
  } = {}) => {
    if (!canTranslate || translatingRef.current) return;
    const scope: TranslateScope = options.scope ?? 'fill';
    const codes = i18n.languages.map((l) => l.code);
    const source = options.source && codes.includes(options.source) ? options.source : i18n.primary;
    const t0 = tRef.current;
    translatingRef.current = true;
    setTranslating(true);

    let filled = 0;
    let failure = '';
    try {
      // MyMemory grants ten times the daily allowance to a request that
      // identifies its owner, so the address is worth asking for before the
      // first call rather than discovering the small quota half way through.
      const email = i18n.provider === 'mymemory' ? await getCurrentOwnerEmail() : undefined;
      let budget = providerDailyBudget(i18n.provider, Boolean(email));

      const translateBatch = async (jobs: TranslateJob[], to: string): Promise<Array<{ path: Path; text: string }>> => {
        const out: Array<{ path: Path; text: string }> = [];
        for (const [from, group] of groupByFrom(jobs)) {
          const done = await translateTexts(
            { texts: group.map((job) => job.text), from, to },
            { provider: i18n.provider, email },
          );
          group.forEach((job, index) => {
            const text = done[index];
            if (!text) return;
            budget -= job.text.length;
            out.push({ path: job.path, text });
          });
        }
        return out;
      };

      // ---- the board's own words -------------------------------------------
      if (options.includeBoard) {
        for (const to of codes) {
          const board0 = rawBoardRef.current;
          const jobs = missingAt(board0, boardTextSlots(board0), codes, to, i18n.primary, scope, source);
          for (let at = 0; at < jobs.length; at += TRANSLATE_BATCH) {
            if (budget <= 0) throw new TranslateQuotaError(t0('msg.translatorQuota'));
            const results = await translateBatch(jobs.slice(at, at + TRANSLATE_BATCH), to);
            if (results.length === 0) continue;
            // Start from the board as it stands now, not as it stood when this
            // run began: the owner may have moved a card or renamed a list
            // while the request was in flight.
            let next = rawBoardRef.current;
            for (const item of results) next = setAt(next, item.path, putText(readAt(next, item.path), to, item.text, i18n.primary));
            rawBoardRef.current = next;
            commitBoard(next);
            filled += results.length;
          }
        }
      }

      // ---- the articles -----------------------------------------------------
      const targets = options.entryId
        ? rawEntriesRef.current.filter((entry) => entry.id === options.entryId)
        : rawEntriesRef.current;

      for (const target of targets) {
        for (const to of codes) {
          // Re-read the entry between batches: it is the live copy that has to
          // be written back, never the one this loop started with.
          const at0 = () => rawEntriesRef.current.find((item) => item.id === target.id) ?? target;
          const jobs = missingAt(at0(), entryTextSlots(at0()), codes, to, i18n.primary, scope, source);
          for (let at = 0; at < jobs.length; at += TRANSLATE_BATCH) {
            if (budget <= 0) throw new TranslateQuotaError(t0('msg.translatorQuota'));
            const results = await translateBatch(jobs.slice(at, at + TRANSLATE_BATCH), to);
            if (results.length === 0) continue;
            let merged = at0();
            for (const item of results) {
              merged = setAt(merged, item.path, putText(readAt(merged, item.path), to, item.text, i18n.primary));
            }
            queueEntry(merged);
            filled += results.length;
          }
        }
      }
    } catch (error) {
      failure = error instanceof TranslateError ? error.message : t0('msg.translatorFailed');
    } finally {
      translatingRef.current = false;
      setTranslating(false);
    }

    if (options.quiet && filled === 0 && !failure) return;
    if (failure) {
      flash(filled > 0 ? t0('msg.translatorPartial', { count: filled, detail: failure }) : failure, true);
      return;
    }
    if (filled === 0) { if (!options.quiet) flash(t0('msg.nothingToTranslate')); return; }
    flash(filled === 1 ? t0('msg.translatedOne') : t0('msg.translated', { count: filled }));
  }, [canTranslate, i18n.languages, i18n.primary, i18n.provider, queueEntry, commitBoard, flash]);

  /** Fill the other languages of the article being written, shortly after the
   *  owner stops typing.
   *
   *  Deliberately narrow: one article, empty slots only, and never while a
   *  dossier other than that one is open. A background pass that rewrote text
   *  the owner had already translated — or that reached across the whole board
   *  — would be a worse bargain than doing nothing. */
  const autoTranslateEntry = useCallback((entryId: string) => {
    if (!canTranslate || !i18n.auto || activeLang !== i18n.primary) return;
    window.clearTimeout(autoTimer.current);
    autoTimer.current = window.setTimeout(() => {
      void runTranslate({ entryId, scope: 'fill', quiet: true });
    }, 4000);
  }, [canTranslate, i18n.auto, activeLang, i18n.primary, runTranslate]);

  useEffect(() => { autoTranslateRef.current = autoTranslateEntry; }, [autoTranslateEntry]);
  useEffect(() => () => window.clearTimeout(autoTimer.current), []);

  // ---- auth -----------------------------------------------------------------
  const doLogin = useCallback(() => {
    setLoginError('');
    const email = emailRef.current?.value ?? '';
    const password = passRef.current?.value ?? '';
    signInOwner(email, password)
      .then(() => isCurrentUserOwner())
      .then((owner) => {
        if (!owner) { setLoginError(tRef.current('login.notOwner')); return; }
        setAuthed(true);
        setEditing(true);
        setLoginOpen(false);
      })
      .catch((reason: unknown) => setLoginError(reason instanceof Error ? reason.message : tRef.current('login.failed')));
  }, []);

  const doLogout = useCallback(() => {
    signOutOwner().catch(() => undefined).finally(() => { setAuthed(false); setEditing(false); });
  }, []);

  // ---- render ---------------------------------------------------------------
  const openIndex = openSlug ? orderedSlugs.indexOf(openSlug) : -1;
  const prevEntry = openIndex >= 0 ? entries.find((e) => e.slug === orderedSlugs[(openIndex - 1 + orderedSlugs.length) % orderedSlugs.length]) : null;
  const nextEntry = openIndex >= 0 ? entries.find((e) => e.slug === orderedSlugs[(openIndex + 1) % orderedSlugs.length]) : null;
  // Published on the document element, not on .desk: the dossier, the panels
  // and the toolbars are siblings of the board, and they all need the theme.
  const cssVars = useMemo(() => {
    // A pale slate takes a light touch: the same inner shadow that gives a dark
    // board its depth turns a bone-white one grey at the edges.
    const pale = Boolean(theme.backdrop.slate) && tintLuminance(theme.backdrop.slate) > 0.55;
    return {
      ...themeVars(theme),
      '--board-ink': slateInk(theme.backdrop, texture),
      // One flat colour for the slate, so a canvas drawing a small picture of
      // the board has a ground to start from.
      '--board-ground': slateGround(theme.backdrop, texture),
      '--plate-shade': pale ? '0.14' : '0.55',
      '--plate-gloss': pale ? '0.5' : '0.06',
    };
  }, [theme, texture]);
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(cssVars)) root.style.setProperty(key, value);
    return () => { for (const key of Object.keys(cssVars)) root.style.removeProperty(key); };
  }, [cssVars]);
  const viewportStyle = { background: wallBackground(backdrop, texture) } as React.CSSProperties;

  const shadow = backdrop.plateShadow;
  const paleSlate = Boolean(backdrop.slate) && tintLuminance(backdrop.slate) > 0.55;
  const plateStyle: React.CSSProperties = {
    left: -backdrop.plateMargin,
    top: -backdrop.plateMargin,
    right: -backdrop.plateMargin,
    bottom: -backdrop.plateMargin,
    background: slateBackground(backdrop, texture),
    boxShadow: [
      `0 ${Math.round(70 * shadow)}px ${Math.round(120 * shadow)}px ${Math.round(-40 * shadow)}px rgba(0,0,0,${Math.min(0.95, 0.9 * shadow).toFixed(2)})`,
      `0 0 0 1px rgba(0,0,0,${paleSlate ? '.25' : '.6'})`,
      // The mount around a pale slate is a light card, not a black border.
      `inset 0 0 0 ${backdrop.frame}px ${paleSlate ? 'rgba(255,255,255,.5)' : 'rgba(20,24,23,.55)'}`,
    ].join(', '),
  };
  const platePattern = patternLayers(backdrop, texture, true);
  const studStyle: React.CSSProperties = { width: backdrop.studSize, height: backdrop.studSize };
  const studCorners: Array<[string, React.CSSProperties]> = [
    ['tl', { left: -backdrop.studInset, top: -backdrop.studInset }],
    ['tr', { right: -backdrop.studInset, top: -backdrop.studInset }],
    ['bl', { left: -backdrop.studInset, bottom: -backdrop.studInset }],
    ['br', { right: -backdrop.studInset, bottom: -backdrop.studInset }],
  ];

  return (
    <UiTextContext value={t}>
      <WorldProvider
        objects={objects}
        boardRef={boardRef}
        boardSize={board.size}
        paintMode={paintMode}
        onPaintMode={(mode) => commitWorld({ paint: mode })}
        passport={passport}
        onPassport={commitPassport}
        editing={editing}
        upload={uploadWorldMedia}
      >
      <div
        className="desk"
        ref={viewportRef}
        style={viewportStyle}
        aria-label={t('board.aria')}
        data-edge={theme.cards.edge}
        data-lift={theme.cards.lift}
      >
        {/* The motif layer sits over the slate but outside the camera transform,
            so its pieces stay the size they were drawn at whatever the zoom. */}
        <div className="motif" ref={motifRef} aria-hidden="true" />
        {backdrop.plate && backdrop.grain > 0 ? (
          <div className="desk__grain" aria-hidden="true" style={{ opacity: backdrop.grain }} />
        ) : null}
        {backdrop.plate && backdrop.vignette > 0 ? (
          <div
            className="desk__vignette"
            aria-hidden="true"
            style={{ background: `radial-gradient(80% 60% at 50% 42%, transparent 40%, rgba(0,0,0,${backdrop.vignette}) 100%)` }}
          />
        ) : null}
        {gridMode === 'viewport' ? <div className="desk__grid" ref={gridRef} aria-hidden="true" /> : null}
        <div className="desk__flash" ref={flashRef} aria-hidden="true" />

        {/* The camera transform lives on .desk__board; the impact shake goes on
            this wrapper so the two never fight over the same property. */}
        <div className="desk__shake" ref={shakeRef}>
          <div className="desk__board" ref={boardRef} style={{ width: board.size.width, height: board.size.height }}>
            {backdrop.plate ? (
              <>
                <div className="desk__plate" ref={plateRef} aria-hidden="true" style={plateStyle}>
                  {gridMode === 'plate' ? (
                    <div
                      className="desk__plate-grid"
                      style={{ backgroundImage: platePattern.image, backgroundSize: platePattern.size }}
                    />
                  ) : null}
                  <div className="desk__plate-shade" />
                </div>
                {backdrop.studs
                  ? studCorners.map(([corner, position]) => (
                    <div key={corner} className="desk__stud" data-stud={corner} aria-hidden="true" style={{ ...studStyle, ...position }} />
                  ))
                  : null}
              </>
            ) : null}
          {board.cards.map((card, index) => {
            const geom = cardGeom(card);
            return (
              <div
                key={card.id}
                className="card"
                data-card={card.id}
                data-jump={card.jump}
                data-rot={geom.rot}
                style={{
                  left: geom.x,
                  top: geom.y,
                  width: geom.w,
                  transform: `rotate(${geom.rot}deg)`,
                  zIndex: 10 + index,
                  ...(introDrop ? { animation: 'drop .7s cubic-bezier(.2,.9,.2,1) both', animationDelay: `${0.02 + index * 0.05}s` } : null),
                }}
              >
                {editing ? (
                  <>
                    <button
                      className="card__rotate-handle"
                      type="button"
                      data-card-rotate
                      data-nodrag
                      aria-label={t('cardmenu.rotation')}
                      title={t('cardmenu.rotation')}
                      onClick={() => nudgeItemRotation(card.id, geom)}
                    >↻</button>
                    <span
                      className="card__resize-handle card__resize-handle--left"
                      data-card-resize="left"
                      data-nodrag
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={t('cardmenu.width')}
                      title={t('cardmenu.width')}
                    />
                    <span
                      className="card__resize-handle card__resize-handle--right"
                      data-card-resize="right"
                      data-nodrag
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={t('cardmenu.width')}
                      title={t('cardmenu.width')}
                    />
                  </>
                ) : null}
                {/* A card drawn rather than written — the hero, a player, a
                    doodle — has no paper surface, so nothing fastens it. A card
                    may also name its own fastener: a board where every piece is
                    taped down reads as a print, not as a board. */}
                {(() => {
                  const fastener = card.fastener ?? theme.cards.fastener;
                  if (fastener === 'none' || CHROMELESS_CARDS.includes(card.type)) return null;
                  return <span className={`card__fastener card__fastener--${fastener}`} aria-hidden="true" />;
                })()}
                {editing ? (
                  <div className="card-ctrl" data-nodrag>
                    <button className="card-ctrl__gear" type="button" onClick={() => setCardMenu((v) => (v === card.id ? null : card.id))} aria-label={t('owner.cardSettings')}>⚙</button>
                    {cardMenu === card.id ? (
                      <div className="card-ctrl__menu">
                        {!CHROMELESS_CARDS.includes(card.type) && card.type !== 'stamp' ? (
                          <label>{t('cardmenu.tone')}
                            <select value={card.tone ?? 'paper'} onChange={(e) => editCard(card.id, { tone: e.target.value as CardTone })}>
                              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </label>
                        ) : null}
                        {!CHROMELESS_CARDS.includes(card.type) ? (
                          <label>{t('cardmenu.fastener')}
                            <select value={card.fastener ?? ''} onChange={(e) => editCard(card.id, { fastener: (e.target.value || undefined) as CardFastener | undefined })}>
                              <option value="">{t('cardmenu.fastenerTheme')}</option>
                              {CARD_FASTENERS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </label>
                        ) : null}
                        {card.type === 'scrap' ? (
                          <label>{t('cardmenu.scrapKind')}
                            <select value={card.kind ?? 'star'} onChange={(e) => editCard(card.id, { kind: e.target.value as ScrapKind })}>
                              {SCRAP_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                          </label>
                        ) : null}
                        {!CHROMELESS_CARDS.includes(card.type) && card.type !== 'stamp' && card.tone === 'custom' ? (
                          <>
                            <label>{t('cardmenu.bg')}
                              <input type="color" value={card.bg ?? '#fbf7ef'} onChange={(e) => editCard(card.id, { bg: e.target.value })} />
                            </label>
                            <label>{t('cardmenu.ink')}
                              <input type="color" value={card.ink ?? '#17150f'} onChange={(e) => editCard(card.id, { ink: e.target.value })} />
                            </label>
                          </>
                        ) : null}
                        {card.type === 'drawer' ? (
                          <>
                            <label>{t('cardmenu.list')}
                              <select value={card.group ?? board.groups[0]?.id ?? ''} onChange={(e) => editCard(card.id, { group: e.target.value })}>
                                {board.groups.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
                              </select>
                            </label>
                            <label>{t('cardmenu.layout')}
                              <select value={card.layout ?? 'list'} onChange={(e) => editCard(card.id, { layout: e.target.value as BoardCard['layout'] })}>
                                {DRAWER_LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </label>
                            <label>{t('cardmenu.maxItems')}
                              <input
                                type="number"
                                min={1}
                                max={99}
                                value={card.maxItems ?? ''}
                                placeholder={t('cardmenu.all')}
                                onChange={(e) => { const v = e.target.value; editCard(card.id, { maxItems: v ? Math.max(1, parseInt(v, 10)) : undefined }); }}
                              />
                            </label>
                          </>
                        ) : null}
                        {card.type === 'spotlight' || card.type === 'sticker' ? (
                          <label>{t('cardmenu.opens')}
                            <select value={card.open ?? ''} onChange={(e) => editCard(card.id, { open: e.target.value })}>
                              <option value="">—</option>
                              {entries.map((entry) => <option key={entry.id} value={entry.slug}>{entry.title}</option>)}
                            </select>
                          </label>
                        ) : null}
                        {card.type === 'spotify' ? (
                          <label>{t('card.spotifyLink')}
                            <input
                              type="url"
                              inputMode="url"
                              value={card.spotifyUrl ?? ''}
                              placeholder="https://open.spotify.com/track/…"
                              onChange={(event) => editCard(card.id, { spotifyUrl: event.target.value })}
                            />
                          </label>
                        ) : null}
                        <button className="card-ctrl__del" type="button" onClick={() => removeCard(card.id)}>{t('cardmenu.delete')}</button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <BoardCardView
                  card={card}
                  entries={entries}
                  groupLabel={card.type === 'drawer' ? board.groups.find((group) => group.id === card.group)?.label : undefined}
                  editing={editing}
                  onCardEdit={editCard}
                  onAddEntry={addEntryToDrawer}
                  onDeleteEntry={deleteEntryFromDrawer}
                  onReorderEntries={reorderEntries}
                />
              </div>
            );
          })}

          {board.polaroids.map((p, index) => {
            const geom = polGeom(p);
            return (
              <div key={p.id} className="polaroid" data-card={p.id} data-rot={geom.rot} style={{ left: geom.x, top: geom.y, width: geom.w, transform: `rotate(${geom.rot}deg)`, zIndex: 40 + index }}>
                {editing ? <span className="item-grip" aria-hidden="true">{t('owner.dragHint')}</span> : null}
                {editing ? <button className="item-del" type="button" data-nodrag onClick={() => removePolaroid(p.id)} aria-label={t('owner.deletePhoto')}>✕</button> : null}
                <div className="polaroid__frame">
                  {p.tape ? <div className="polaroid__tape" /> : null}
                  <div style={{ position: 'relative', width: '100%', height: p.h }}>
                    <ImageSlot
                      url={p.assetUrl}
                      mediaType={p.assetMediaType}
                      alt={p.caption}
                      placeholder={p.placeholder || undefined}
                      editable={editing}
                      busy={polBusy === p.id}
                      onPick={(file) => pickPolaroidMedia(p.id, file)}
                      frame={p.imageFrame}
                      onFrameChange={(imageFrame) => editPolaroid(p.id, { imageFrame })}
                    />
                  </div>
                  <EditableText
                    as="div"
                    className="polaroid__cap"
                    text={p.caption ?? ''}
                    placeholder={t('ph.caption')}
                    editing={editing}
                    onCommit={(value) => editPolaroid(p.id, { caption: value })}
                  />
                </div>
              </div>
            );
          })}

          {theme.showMarginalia && board.marginalia.map((n, index) => {
            const geom = noteGeom(n);
            return (
              <div key={n.id} className={`note note--${n.style}`} data-card={n.id} data-rot={geom.rot} style={{ left: geom.x, top: geom.y, width: geom.w, transform: `rotate(${geom.rot}deg)`, zIndex: 60 + index }}>
                {editing ? <span className="item-grip" aria-hidden="true">{t('owner.dragHint')}</span> : null}
                {editing ? (
                  <>
                    <button
                      className="card__rotate-handle note__rotate-handle"
                      type="button"
                      data-card-rotate
                      data-nodrag
                      aria-label={t('cardmenu.rotation')}
                      title={t('cardmenu.rotation')}
                      onClick={() => nudgeItemRotation(n.id, geom)}
                    >↻</button>
                    <span
                      className="card__resize-handle card__resize-handle--left"
                      data-card-resize="left"
                      data-nodrag
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={t('cardmenu.width')}
                      title={t('cardmenu.width')}
                    />
                    <span
                      className="card__resize-handle card__resize-handle--right"
                      data-card-resize="right"
                      data-nodrag
                      role="separator"
                      aria-orientation="vertical"
                      aria-label={t('cardmenu.width')}
                      title={t('cardmenu.width')}
                    />
                  </>
                ) : null}
                {editing ? (
                  <div className="note-ctrl" data-nodrag>
                    <button className="note-ctrl__style" type="button" onClick={() => editNote(n.id, { style: n.style === 'amber' ? 'paper-dashed' : 'amber' })} aria-label={t('owner.noteStyle')}>◑</button>
                    <button className="item-del item-del--inline" type="button" onClick={() => removeNote(n.id)} aria-label={t('owner.deleteNote')}>✕</button>
                  </div>
                ) : null}
                <EditableText
                  as="div"
                  className="note__body"
                  text={n.text ?? ''}
                  placeholder={t('ph.text')}
                  editing={editing}
                  onCommit={(value) => editNote(n.id, { text: value })}
                />
              </div>
            );
          })}

          {/* Everything loose on the slate. Inside the board, so it shares the
              camera, the light and the coordinates with the paper. */}
          <Suspense fallback={null}>
            <WorldLayer
              objects={objects}
              boardSize={board.size}
              entries={entries.map(({ slug, title }) => ({ slug, title }))}
              onOpenEntry={setOpenSlug}
            />
          </Suspense>
          </div>
        </div>
      </div>

      {/* The chrome a held tool needs, outside the camera so it stays the size
          the screen drew it. */}
      {!openEntry ? <Suspense fallback={null}><WorldOverlay boardSize={board.size} /></Suspense> : null}

      {error ? <div className="board-error" role="alert">{error}</div> : null}

      <div className={`stamp stamp--tl${authed ? ' stamp--tl--owner' : ''}`}>{t('board.stamp')}</div>

      {/* Board-level chrome (owner bar, sign-in, top-right hint, bottom
          toolbar) is hidden while a dossier is open: it floats above the
          dossier plate (higher z-index than the modal) and would otherwise
          overlap its own header/controls. The dossier has everything it
          needs (close/prev/next, editing flag, inline block editor).
          It is hidden again while the tour runs — the tour bar replaces it. */}
      {!openEntry && phase === 'tour' ? (
        <TourBar
          tour={tour}
          step={tourStep}
          total={tourTotal}
          label={tourLabel}
          waiting={tourWaiting}
          paused={tourPaused}
          onNext={() => advance('next')}
          onBack={() => advance('back')}
          onSkip={() => endTour('fit')}
          onJump={(index) => advance(index)}
          onTogglePause={() => setTourPaused((v) => !v)}
        />
      ) : null}

      {!openEntry && phase === 'live' ? (
        <>
          <div className="stamp stamp--tr">{t('board.hintOpen')}<br />{t('board.hintMove')}</div>

          {authed ? (
            <div className={`ownerbar${editing ? ' ownerbar--editing' : ''}`}>
              <div className="ownerbar__controls">
                <div className="ownerbar__row">
                  <button className={`tbtn ${editing ? 'tbtn--on' : ''}`} type="button" onClick={() => setEditing((v) => { if (v) setCardMenu(null); return !v; })}>{editing ? t('owner.editOn') : t('owner.editOff')}</button>
                  <button
                    className={`tbtn ${positionsLocked ? 'tbtn--on' : ''}`}
                    type="button"
                    aria-pressed={positionsLocked}
                    title={positionsLocked ? t('owner.positionsLockedTitle') : t('owner.positionsFreeTitle')}
                    onClick={() => setPositionsLocked((locked) => !locked)}
                  >
                    {positionsLocked ? t('owner.positionsLocked') : t('owner.positionsFree')}
                  </button>
                  {editing ? (
                    <>
                      <span className="ownerbar__add">{t('owner.add')}</span>
                      <button className="tbtn" type="button" onClick={() => addCard('drawer')}>{t('owner.addDrawer')}</button>
                      <button className="tbtn" type="button" onClick={() => addCard('spotlight')}>{t('owner.addSpotlight')}</button>
                      <button className="tbtn" type="button" onClick={() => addCard('sticker')}>{t('owner.addSticker')}</button>
                      <button className="tbtn" type="button" onClick={() => addCard('spotify')}>{t('owner.addSpotify')}</button>
                      <button className="tbtn" type="button" onClick={() => addCard('stamp')}>{t('owner.addStamp')}</button>
                      <button className="tbtn" type="button" onClick={() => addCard('scrap')}>{t('owner.addScrap')}</button>
                      <button className="tbtn" type="button" onClick={addPolaroid}>{t('owner.addPhoto')}</button>
                      <button className="tbtn" type="button" onClick={addNote}>{t('owner.addNote')}</button>
                    </>
                  ) : null}
                </div>

                <div className="ownerbar__row">
                  {i18n.enabled && i18n.languages.length > 1 ? (
                    <>
                      {i18n.languages.map((option) => (
                        <button
                          key={option.code}
                          type="button"
                          className={`tbtn ${option.code === activeLang ? 'tbtn--on' : ''}`}
                          aria-pressed={option.code === activeLang}
                          title={option.code === i18n.primary ? t('owner.primaryTitle', { label: option.label }) : option.label}
                          onClick={() => { setLang(option.code); rememberLanguage(i18n, option.code); }}
                        >
                          {option.code.toUpperCase()}
                        </button>
                      ))}
                      {canTranslate ? (
                        <button
                          className="tbtn"
                          type="button"
                          disabled={translating}
                          title={t('owner.translateTitle')}
                          onClick={(event) => { void runTranslate({ includeBoard: true, scope: event.altKey || event.shiftKey ? 'refresh' : 'fill', source: activeLang }); }}
                        >
                          {translating ? t('owner.translating') : t('owner.translate')}
                        </button>
                      ) : null}
                    </>
                  ) : null}
                  <button className="tbtn" type="button" onClick={() => setThemeOpen(true)}>{t('owner.theme')}</button>
                  <button className="tbtn" type="button" onClick={() => setTourOpen(true)}>{t('owner.tour')}</button>
                  <button className="tbtn" type="button" onClick={() => setInventoryOpen(true)}>{t('owner.entries')}</button>
                  <button className="tbtn" type="button" onClick={() => setWordingOpen(true)}>{t('owner.wording')}</button>
                  <button className="tbtn" type="button" onClick={() => setObjectsOpen(true)}>{t('owner.objects')}</button>
                  {localEdit ? <span className="ownerbar__badge" title={t('owner.previewTitle')}>{t('owner.preview')}</span> : <button className="tbtn tbtn--ghost" type="button" onClick={doLogout} title={t('owner.signOut')}>⏏</button>}
                </div>
              </div>
            </div>
          ) : (
            <button className="signin" type="button" onClick={() => setLoginOpen(true)}>{t('board.signIn')}</button>
          )}

          <div className="toolbar">
            <div className="toolbar__inner">
              <span className="toolbar__label">{t('board.label')}</span>
              <button className="tbtn" type="button" onClick={() => fitAll()}>{t('board.fit')}</button>
              <button className="tbtn" type="button" onClick={() => arrange('scatter')}>{t('board.scatter')}</button>
              <button className="tbtn" type="button" onClick={() => arrange('reset')}>{t('board.reset')}</button>
              {tour.enabled || authed ? (
                <button className="tbtn tbtn--on" type="button" onClick={replayTour} title={t('board.tourTitle')}>{t('board.tour')}</button>
              ) : null}
              <span className="toolbar__sep" />
              {jumps.map((name) => (
                <button key={name} className="tbtn tbtn--ghost" type="button" onClick={() => jump(name)}>{t(`jump.${name}`)}</button>
              ))}
              {i18n.enabled && i18n.languages.length > 1 ? (
                <>
                  <span className="toolbar__sep" />
                  <div className="langpick" role="group" aria-label={t('board.language')}>
                    {i18n.languages.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        className={`tbtn tbtn--ghost ${option.code === activeLang ? 'is-on' : ''}`}
                        aria-pressed={option.code === activeLang}
                        onClick={() => { setLang(option.code); rememberLanguage(i18n, option.code); }}
                      >
                        {option.code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
              <span className="toolbar__sep" />
              <button className="tbtn tbtn--icon" type="button" aria-label={t('board.zoomOut')} onClick={() => zoomBy(0.8)}>−</button>
              <button className="tbtn tbtn--icon" type="button" aria-label={t('board.zoomIn')} onClick={() => zoomBy(1.25)}>+</button>
            </div>
          </div>
        </>
      ) : null}

      {openEntry ? (
        <Suspense fallback={null}>
        <DossierErrorBoundary key={openEntry.id} onClose={() => setOpenSlug(null)} closeLabel={t('dossier.close')}>
          <DossierPlate
            entry={openEntry}
            articles={entries}
            activeLanguage={activeLang}
            posLabel={`${openIndex + 1} / ${orderedSlugs.length}`}
            prevTitle={prevEntry?.title ?? ''}
            nextTitle={nextEntry?.title ?? ''}
            editing={editing}
            saveState={saveState}
            saveError={saveError}
            onRetrySave={() => { setSaveState('pending'); flushRef.current(); }}
            canTranslate={canTranslate}
            translating={translating}
            onTranslate={() => { void runTranslate({ entryId: openEntry.id, scope: 'refresh', source: activeLang }); }}
            onClose={() => setOpenSlug(null)}
            onPrev={() => { const i = orderedSlugs.indexOf(openEntry.slug); setOpenSlug(orderedSlugs[(i - 1 + orderedSlugs.length) % orderedSlugs.length]); }}
            onNext={() => { const i = orderedSlugs.indexOf(openEntry.slug); setOpenSlug(orderedSlugs[(i + 1) % orderedSlugs.length]); }}
            onOpenArticle={setOpenSlug}
            onChange={changeEntry}
            uploadMedia={uploadMediaFile}
            onUploadError={(reason) => flash(reason instanceof Error ? reason.message : t('msg.uploadFailed'), true)}
            dossier={theme.dossier}
          />
        </DossierErrorBoundary>
        </Suspense>
      ) : null}

      {loginOpen ? (
        <div className="overlay" role="presentation">
          <div className="overlay__scrim" onClick={() => setLoginOpen(false)} />
          <div className="panel panel--login" role="dialog" aria-modal="true" aria-label={t('login.aria')}>
            <div className="panel__eyebrow">{t('login.eyebrow')}</div>
            <div className="panel__title" style={{ whiteSpace: 'pre-line' }}>{t('login.title')}</div>
            <p className="panel__hint">{t('login.hint')}</p>
            <input ref={emailRef} className="field" type="email" placeholder={t('login.email')} autoComplete="username" />
            <input ref={passRef} className="field" type="password" placeholder={t('login.password')} autoComplete="current-password" onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }} />
            <div className="panel__actions">
              <button className="tbtn tbtn--on" type="button" onClick={doLogin}>{t('login.unlock')}</button>
              <button className="tbtn" type="button" onClick={() => setLoginOpen(false)}>{t('login.cancel')}</button>
            </div>
            <div className="panel__err">{loginError}</div>
          </div>
        </div>
      ) : null}

      {themeOpen ? (
        <Suspense fallback={null}><ThemePanel
          theme={theme}
          onChange={commitTheme}
          i18n={i18n}
          onI18nChange={commitI18n}
          onClose={() => setThemeOpen(false)}
        /></Suspense>
      ) : null}
      {tourOpen ? (
        <Suspense fallback={null}><TourPanel
          tour={tour}
          items={tourItems}
          onChange={commitTour}
          onPreview={() => { setTourOpen(false); replayTour(); }}
          onClose={() => setTourOpen(false)}
        /></Suspense>
      ) : null}
      {wordingOpen ? (
        <Suspense fallback={null}><WordingPanel
          overrides={uiOverrides}
          language={activeLang}
          languageLabel={i18n.languages.find((l) => l.code === activeLang)?.label ?? activeLang}
          primary={i18n.primary}
          onChange={commitUi}
          onClose={() => setWordingOpen(false)}
        /></Suspense>
      ) : null}
      {inventoryOpen ? (
        <Suspense fallback={null}><InventoryPanel
          entries={entries}
          board={board}
          remoteDataEnabled={remoteDataEnabled}
          onClose={() => setInventoryOpen(false)}
          onCreated={(entry) => { setEntries((list) => [...list, entry]); }}
          onDeleted={(id) => { setEntries((list) => list.filter((e) => e.id !== id)); }}
          onRestored={(entry) => { setEntries((list) => (list.some((e) => e.id === entry.id) ? list : [...list, entry])); }}
          onMoveEntry={moveEntryGroup}
          onReorderEntries={reorderEntries}
          onBoardChange={commitBoard}
          notify={flash}
        /></Suspense>
      ) : null}

      {overflowGroup ? (
        <Suspense fallback={null}><GroupOverflowPanel
          groupId={overflowGroup}
          label={board.groups.find((g) => g.id === overflowGroup)?.label ?? overflowGroup}
          entries={entries}
          onOpen={setOpenSlug}
          onClose={() => setOverflowGroup(null)}
        /></Suspense>
      ) : null}

      {objectsOpen ? (
        <Suspense fallback={null}>
        <ObjectsPanel
          objects={objects}
          paintMode={paintMode}
          onChange={commitObjects}
          onPaintMode={(mode) => commitWorld({ paint: mode })}
          onClose={() => setObjectsOpen(false)}
        />
        </Suspense>
      ) : null}

      {toast ? <div className={`owner-toast ${toast.error ? 'owner-toast--err' : ''}`}>{toast.text}</div> : null}
      </WorldProvider>
    </UiTextContext>
  );
}
