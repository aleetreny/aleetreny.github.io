import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PortfolioEntry } from '../types/content';
import { demoEntries, demoSettings } from '../content/demo';
import {
  BOARD_TEXTURES,
  GROUP_SEQUENCE,
  dossierOrder,
  parseBoard,
  parseLayout,
  parseTheme,
  themeVars,
  type BoardCard,
  type BoardConfig,
  type CardTone,
  type LayoutMap,
  type LayoutOverride,
  type Marginal,
  type Polaroid,
  type ThemeConfig,
} from '../lib/board';
import {
  hasOwnerSession,
  isCurrentUserOwner,
  listPublishedEntries,
  listSiteSettings,
  saveContentEntry,
  saveSiteSetting,
  signInOwner,
  signOutOwner,
  uploadImage,
} from '../lib/content-repository';
import { BoardCardView } from './desk/BoardCards';
import { DossierPlate } from './desk/DossierPlate';
import { ImageSlot } from './desk/ImageSlot';
import { ThemePanel } from './desk/ThemePanel';
import { InventoryPanel } from './desk/InventoryPanel';

type DeskBoardProps = {
  remoteDataEnabled: boolean;
  ownerIntent: boolean;
};

type Geom = { x: number; y: number; rot: number; w: number };

const JUMPS: Array<[string, string]> = [
  ['who', 'me'], ['work', 'work'], ['study', 'edu'], ['giving', 'vol'],
  ['prizes', 'hack'], ['code', 'repos'], ['lab', 'lab'], ['world', 'travel'],
  ['odd', 'random'], ['reach', 'contact'],
];

const TONES: CardTone[] = ['paper', 'paperWarm', 'paperCream', 'dark', 'slate', 'amber'];
const DRAWER_LAYOUTS = ['list', 'compact', 'grid', 'notes', 'atlas'] as const;

export function DeskBoard({ remoteDataEnabled, ownerIntent }: DeskBoardProps) {
  const [entries, setEntries] = useState<PortfolioEntry[]>(demoEntries);
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
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [cardMenu, setCardMenu] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [polBusy, setPolBusy] = useState<string | null>(null);

  const theme = useMemo<ThemeConfig>(() => parseTheme(settings.theme), [settings.theme]);
  const board = useMemo<BoardConfig>(() => parseBoard(settings.board), [settings.board]);
  const layout = useMemo<LayoutMap>(() => parseLayout(settings['board.layout']), [settings]);

  const viewportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const view = useRef({ x: 0, y: 0, s: 1 });
  const didDrag = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);
  const zTop = useRef(50);
  const openSlugRef = useRef<string | null>(null);
  const authedRef = useRef(false);

  const texture = BOARD_TEXTURES[theme.boardStyle] ?? BOARD_TEXTURES.slate;
  const orderedSlugs = useMemo(() => dossierOrder(entries), [entries]);
  const openEntry = openSlug ? entries.find((entry) => entry.slug === openSlug) ?? null : null;

  useEffect(() => { openSlugRef.current = openSlug; }, [openSlug]);
  useEffect(() => { authedRef.current = authed; }, [authed]);

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
        const detail = reason instanceof Error ? reason.message : 'contenido remoto no disponible';
        setError(`Contenido remoto no disponible; mostrando la copia segura. ${detail}`);
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

  // ---- imperative view ------------------------------------------------------
  const paint = useCallback((animate: boolean) => {
    const boardEl = boardRef.current;
    const gridEl = gridRef.current;
    const v = view.current;
    if (boardEl) {
      boardEl.style.transition = animate ? 'transform .6s cubic-bezier(.22,.9,.2,1)' : 'none';
      boardEl.style.transform = `translate(${v.x}px, ${v.y}px) scale(${v.s})`;
    }
    if (gridEl) {
      // Constant on-screen density: the grid keeps the same cell size no matter
      // the zoom (only its offset follows the pan), so zooming out never turns
      // the dot pattern into grain. It reads as a calm fixed backdrop.
      const sizes = texture.size.split(',').map((piece) => piece.trim().split(' ').map((n) => parseFloat(n)));
      gridEl.style.backgroundImage = texture.img;
      gridEl.style.backgroundSize = sizes.map(([w, h]) => `${w}px ${h}px`).join(', ');
      gridEl.style.backgroundPosition = sizes.map(() => `${v.x}px ${v.y}px`).join(', ');
    }
  }, [texture]);

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

  const centerNode = useCallback((node: HTMLElement) => {
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const cx = parseFloat(node.style.left || '0') + node.offsetWidth / 2;
    const cy = parseFloat(node.style.top || '0') + node.offsetHeight / 2;
    const s = Math.min(1, (rect.height - 150) / Math.max(node.offsetHeight, 1));
    view.current = { s, x: rect.width / 2 - cx * s, y: (rect.height - 60) / 2 - cy * s };
    paint(true);
  }, [paint]);

  const jump = useCallback((name: string) => {
    const node = boardRef.current?.querySelector<HTMLElement>(`[data-jump="${name}"]`);
    if (node) centerNode(node);
  }, [centerNode]);

  useEffect(() => { paint(false); }, [paint, layout]);
  useEffect(() => { fitAll(true); }, [fitAll]);
  useEffect(() => {
    const onResize = () => fitAll(true);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [fitAll]);

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
      saveSiteSetting(key, value).catch((reason: unknown) => flash(reason instanceof Error ? reason.message : 'No se pudo guardar.', true));
    }, delay);
  }, [flash, remoteDataEnabled]);

  const commitTheme = useCallback((next: ThemeConfig) => { setSettings((s) => ({ ...s, theme: next })); saveSetting('theme', next); }, [saveSetting]);
  const commitBoard = useCallback((next: BoardConfig) => { setSettings((s) => ({ ...s, board: next })); saveSetting('board', next); }, [saveSetting]);
  const commitLayout = useCallback((next: LayoutMap) => { setSettings((s) => ({ ...s, 'board.layout': next })); saveSetting('board.layout', next, 150); }, [saveSetting]);

  const savingRef = useRef(false);
  const pendingEntry = useRef<PortfolioEntry | null>(null);
  const entryTimer = useRef<number>(0);
  const flushRef = useRef<() => void>(() => {});
  const flushEntry = useCallback(() => {
    if (!remoteDataEnabled) { pendingEntry.current = null; return; } // local preview
    if (savingRef.current || !pendingEntry.current) return;
    const entry = pendingEntry.current;
    pendingEntry.current = null;
    savingRef.current = true;
    saveContentEntry(entry, 'inline edit')
      .then((saved) => { setEntries((list) => list.map((item) => (item.id === saved.id ? { ...item, version: saved.version } : item))); })
      .catch((reason: unknown) => { flash(reason instanceof Error ? reason.message : 'No se pudo guardar el texto.', true); })
      .finally(() => { savingRef.current = false; if (pendingEntry.current) entryTimer.current = window.setTimeout(() => flushRef.current(), 60); });
  }, [flash, remoteDataEnabled]);
  useEffect(() => { flushRef.current = flushEntry; }, [flushEntry]);

  const changeEntry = useCallback((next: PortfolioEntry) => {
    setEntries((list) => list.map((item) => (item.id === next.id ? next : item)));
    pendingEntry.current = next;
    window.clearTimeout(entryTimer.current);
    entryTimer.current = window.setTimeout(flushEntry, 500);
  }, [flushEntry]);

  const editCard = useCallback((cardId: string, patch: Partial<BoardCard>) => {
    commitBoard({ ...board, cards: board.cards.map((card) => (card.id === cardId ? { ...card, ...patch } : card)) });
  }, [board, commitBoard]);

  // Photo upload: Neon Object Storage in production, an in-browser data URL in
  // local preview so the whole flow is testable offline.
  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    if (!remoteDataEnabled) {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
        reader.readAsDataURL(file);
      });
    }
    const asset = await uploadImage(file, file.name);
    return asset.publicUrl;
  }, [remoteDataEnabled]);

  const pickPolaroidPhoto = useCallback((polaroidId: string, file: File) => {
    setPolBusy(polaroidId);
    uploadPhoto(file)
      .then((url) => { commitBoard({ ...board, polaroids: board.polaroids.map((p) => (p.id === polaroidId ? { ...p, assetUrl: url } : p)) }); })
      .catch((reason: unknown) => flash(reason instanceof Error ? reason.message : 'No se pudo subir la foto.', true))
      .finally(() => setPolBusy(null));
  }, [board, commitBoard, flash, uploadPhoto]);

  // ---- board card management ------------------------------------------------
  const viewCenterWorld = useCallback(() => {
    const vp = viewportRef.current;
    const v = view.current;
    if (!vp) return { x: 200, y: 200 };
    const rect = vp.getBoundingClientRect();
    return { x: Math.round((rect.width / 2 - v.x) / v.s - 150), y: Math.round((rect.height / 2 - v.y) / v.s - 90) };
  }, []);

  const addCard = useCallback((type: 'drawer' | 'spotlight') => {
    const at = viewCenterWorld();
    const id = crypto.randomUUID();
    const card: BoardCard = type === 'drawer'
      ? { id, type: 'drawer', x: at.x, y: at.y, rot: 0, w: 440, tone: 'paper', kicker: 'new drawer', title: 'New drawer', group: 'random', layout: 'compact' }
      : { id, type: 'spotlight', x: at.x, y: at.y, rot: 0, w: 400, tone: 'paperWarm', kicker: 'spotlight', title: 'New\nspotlight', blurb: 'Say what this is.', open: entries[0]?.slug };
    commitBoard({ ...board, cards: [...board.cards, card] });
    setCardMenu(id);
  }, [board, commitBoard, entries, viewCenterWorld]);

  const addPolaroid = useCallback(() => {
    const at = viewCenterWorld();
    const polaroid: Polaroid = { id: crypto.randomUUID(), x: at.x, y: at.y, rot: 0, w: 280, h: 220, caption: 'Caption', placeholder: 'drop a photo' };
    commitBoard({ ...board, polaroids: [...board.polaroids, polaroid] });
  }, [board, commitBoard, viewCenterWorld]);

  const addNote = useCallback(() => {
    const at = viewCenterWorld();
    const note: Marginal = { id: crypto.randomUUID(), x: at.x, y: at.y, rot: 0, w: 250, style: 'amber', text: 'A new note.' };
    commitBoard({ ...board, marginalia: [...board.marginalia, note] });
  }, [board, commitBoard, viewCenterWorld]);

  const removeCard = useCallback((id: string) => { commitBoard({ ...board, cards: board.cards.filter((c) => c.id !== id) }); setCardMenu(null); }, [board, commitBoard]);
  const removePolaroid = useCallback((id: string) => { commitBoard({ ...board, polaroids: board.polaroids.filter((p) => p.id !== id) }); }, [board, commitBoard]);
  const removeNote = useCallback((id: string) => { commitBoard({ ...board, marginalia: board.marginalia.filter((n) => n.id !== id) }); }, [board, commitBoard]);
  const editPolaroid = useCallback((id: string, patch: Partial<Polaroid>) => { commitBoard({ ...board, polaroids: board.polaroids.map((p) => (p.id === id ? { ...p, ...patch } : p)) }); }, [board, commitBoard]);
  const editNote = useCallback((id: string, patch: Partial<Marginal>) => { commitBoard({ ...board, marginalia: board.marginalia.map((n) => (n.id === id ? { ...n, ...patch } : n)) }); }, [board, commitBoard]);

  // ---- pointer / wheel ------------------------------------------------------
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return undefined;

    const onWheel = (event: WheelEvent) => {
      if (openSlugRef.current) return;
      event.preventDefault();
      const rect = vp.getBoundingClientRect();
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-event.deltaY * 0.0016), false);
    };

    const isInteractive = (el: HTMLElement | null) =>
      !!el && !!el.closest('[data-nodrag], a, button, input, select, textarea');

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || openSlugRef.current) return;
      const target = event.target as HTMLElement;
      if (isInteractive(target) || target.isContentEditable) return;
      didDrag.current = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const card = target.closest<HTMLElement>('[data-card]');

      if (card) {
        card.style.zIndex = String(++zTop.current);
        const rot = parseFloat(card.dataset.rot || '0');
        const ox = parseFloat(card.style.left || '0');
        const oy = parseFloat(card.style.top || '0');
        card.style.transition = 'none';
        const move = (ev: PointerEvent) => {
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
          if (didDrag.current) {
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
    return () => {
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('click', onClick);
      vp.removeEventListener('dblclick', onDblClick);
    };
  }, [zoomAt, paint, centerNode, fitAll, commitLayout, layout]);

  // ---- keyboard -------------------------------------------------------------
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (typing) { if (event.key === 'Escape') target?.blur(); return; }
      if (loginOpen || themeOpen || inventoryOpen) { if (event.key === 'Escape') { setLoginOpen(false); setThemeOpen(false); setInventoryOpen(false); } return; }
      const current = openSlugRef.current;
      if (current) {
        if (event.key === 'Escape') setOpenSlug(null);
        if (event.key === 'ArrowRight') { const i = orderedSlugs.indexOf(current); if (i >= 0) setOpenSlug(orderedSlugs[(i + 1) % orderedSlugs.length]); }
        if (event.key === 'ArrowLeft') { const i = orderedSlugs.indexOf(current); if (i >= 0) setOpenSlug(orderedSlugs[(i - 1 + orderedSlugs.length) % orderedSlugs.length]); }
        return;
      }
      if (event.key === 'f') fitAll();
      if (event.key === 'E' && event.shiftKey && !authedRef.current) setLoginOpen(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fitAll, orderedSlugs, loginOpen, themeOpen, inventoryOpen]);

  // ---- arrange --------------------------------------------------------------
  const draggableIds = useMemo(() => [
    ...board.cards.map((c) => c.id),
    ...board.polaroids.map((p) => p.id),
    ...(theme.showMarginalia ? board.marginalia.map((n) => n.id) : []),
  ], [board, theme.showMarginalia]);

  const arrange = useCallback((mode: 'tidy' | 'scatter' | 'reset') => {
    const apply = (next: LayoutMap) => { if (authedRef.current) commitLayout(next); else setSettings((s) => ({ ...s, 'board.layout': next })); };
    if (mode === 'reset') { apply({}); return; }
    const boardEl = boardRef.current;
    if (!boardEl) return;
    const next: LayoutMap = {};
    if (mode === 'tidy') {
      const colW = 640;
      const gap = 40;
      const cols = Math.max(1, Math.floor((board.size.width - 100) / colW));
      const heights = new Array<number>(cols).fill(80);
      for (const id of draggableIds) {
        const node = boardEl.querySelector<HTMLElement>(`[data-card="${id}"]`);
        if (!node) continue;
        let k = 0;
        for (let j = 1; j < cols; j += 1) if (heights[j] < heights[k]) k = j;
        next[id] = { x: 80 + k * colW, y: heights[k], rot: 0 };
        heights[k] += node.offsetHeight + gap;
      }
    } else {
      for (const id of draggableIds) {
        const node = boardEl.querySelector<HTMLElement>(`[data-card="${id}"]`);
        if (!node) continue;
        next[id] = {
          x: 50 + Math.random() * Math.max(50, board.size.width - node.offsetWidth - 100),
          y: 50 + Math.random() * Math.max(50, board.size.height - node.offsetHeight - 100),
          rot: Number((Math.random() * 12 - 6).toFixed(2)),
        };
      }
    }
    apply(next);
  }, [board.size.height, board.size.width, commitLayout, draggableIds]);

  // ---- auth -----------------------------------------------------------------
  const doLogin = useCallback(() => {
    setLoginError('');
    const email = emailRef.current?.value ?? '';
    const password = passRef.current?.value ?? '';
    signInOwner(email, password)
      .then(() => isCurrentUserOwner())
      .then((owner) => {
        if (!owner) { setLoginError('Cuenta válida, pero no es la propietaria.'); return; }
        setAuthed(true);
        setEditing(true);
        setLoginOpen(false);
      })
      .catch((reason: unknown) => setLoginError(reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.'));
  }, []);

  const doLogout = useCallback(() => {
    signOutOwner().catch(() => undefined).finally(() => { setAuthed(false); setEditing(false); });
  }, []);

  // ---- render ---------------------------------------------------------------
  const openIndex = openSlug ? orderedSlugs.indexOf(openSlug) : -1;
  const prevEntry = openIndex >= 0 ? entries.find((e) => e.slug === orderedSlugs[(openIndex - 1 + orderedSlugs.length) % orderedSlugs.length]) : null;
  const nextEntry = openIndex >= 0 ? entries.find((e) => e.slug === orderedSlugs[(openIndex + 1) % orderedSlugs.length]) : null;
  const viewportStyle = { ...themeVars(theme), background: texture.vp, '--board-ink': texture.ink } as React.CSSProperties;

  return (
    <>
      <div className="desk" ref={viewportRef} style={viewportStyle} aria-label="Working board — Alejandro Treny">
        <div className="desk__grid" ref={gridRef} aria-hidden="true" />
        <div className="desk__board" ref={boardRef} style={{ width: board.size.width, height: board.size.height }}>
          {board.cards.map((card, index) => {
            const geom = cardGeom(card);
            return (
              <div
                key={card.id}
                className="card"
                data-card={card.id}
                data-jump={card.jump}
                data-rot={geom.rot}
                style={{ left: geom.x, top: geom.y, width: geom.w, transform: `rotate(${geom.rot}deg)`, zIndex: 10 + index, animation: 'drop .7s cubic-bezier(.2,.9,.2,1) both', animationDelay: `${0.02 + index * 0.05}s` }}
              >
                {editing ? (
                  <div className="card-ctrl" data-nodrag>
                    <button className="card-ctrl__gear" type="button" onClick={() => setCardMenu((v) => (v === card.id ? null : card.id))} aria-label="Ajustes de tarjeta">⚙</button>
                    {cardMenu === card.id ? (
                      <div className="card-ctrl__menu">
                        {card.type !== 'hero' ? (
                          <label>tone
                            <select value={card.tone ?? 'paper'} onChange={(e) => editCard(card.id, { tone: e.target.value as CardTone })}>
                              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </label>
                        ) : null}
                        {card.type === 'drawer' ? (
                          <>
                            <label>list
                              <select value={card.group ?? 'random'} onChange={(e) => editCard(card.id, { group: e.target.value })}>
                                {GROUP_SEQUENCE.map((g) => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </label>
                            <label>layout
                              <select value={card.layout ?? 'list'} onChange={(e) => editCard(card.id, { layout: e.target.value as BoardCard['layout'] })}>
                                {DRAWER_LAYOUTS.map((l) => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </label>
                          </>
                        ) : null}
                        {card.type === 'spotlight' ? (
                          <label>opens
                            <select value={card.open ?? ''} onChange={(e) => editCard(card.id, { open: e.target.value })}>
                              <option value="">—</option>
                              {entries.map((entry) => <option key={entry.id} value={entry.slug}>{entry.title}</option>)}
                            </select>
                          </label>
                        ) : null}
                        <button className="card-ctrl__del" type="button" onClick={() => removeCard(card.id)}>delete card</button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <BoardCardView card={card} entries={entries} editing={editing} onCardEdit={editCard} />
              </div>
            );
          })}

          {board.polaroids.map((p, index) => {
            const geom = polGeom(p);
            return (
              <div key={p.id} className="polaroid" data-card={p.id} data-rot={geom.rot} style={{ left: geom.x, top: geom.y, width: geom.w, transform: `rotate(${geom.rot}deg)`, zIndex: 40 + index }}>
                {editing ? <span className="item-grip" aria-hidden="true">⠿ drag</span> : null}
                {editing ? <button className="item-del" type="button" data-nodrag onClick={() => removePolaroid(p.id)} aria-label="Eliminar polaroid">✕</button> : null}
                <div className="polaroid__frame">
                  {p.tape ? <div className="polaroid__tape" /> : null}
                  <div style={{ position: 'relative', width: '100%', height: p.h }}>
                    <ImageSlot url={p.assetUrl} alt={p.caption} placeholder={p.placeholder ?? 'drop a photo'} editable={editing} busy={polBusy === p.id} onPick={(file) => pickPolaroidPhoto(p.id, file)} />
                  </div>
                  <div
                    className="polaroid__cap"
                    {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => editPolaroid(p.id, { caption: (e.currentTarget.textContent ?? '').trim() }) } : {})}
                  >{p.caption}</div>
                </div>
              </div>
            );
          })}

          {theme.showMarginalia && board.marginalia.map((n, index) => {
            const geom = noteGeom(n);
            return (
              <div key={n.id} className={`note note--${n.style}`} data-card={n.id} data-rot={geom.rot} style={{ left: geom.x, top: geom.y, width: geom.w, transform: `rotate(${geom.rot}deg)`, zIndex: 60 + index }}>
                {editing ? <span className="item-grip" aria-hidden="true">⠿ drag</span> : null}
                {editing ? (
                  <div className="note-ctrl" data-nodrag>
                    <button className="note-ctrl__style" type="button" onClick={() => editNote(n.id, { style: n.style === 'amber' ? 'paper-dashed' : 'amber' })} aria-label="Cambiar estilo">◑</button>
                    <button className="item-del item-del--inline" type="button" onClick={() => removeNote(n.id)} aria-label="Eliminar nota">✕</button>
                  </div>
                ) : null}
                <div
                  className="note__body"
                  {...(editing ? { contentEditable: true, suppressContentEditableWarning: true, 'data-nodrag': '', onBlur: (e: { currentTarget: HTMLElement }) => editNote(n.id, { text: (e.currentTarget.textContent ?? '').trim() }) } : {})}
                >{n.text}</div>
              </div>
            );
          })}
        </div>
      </div>

      {error ? <div className="board-error" role="alert">{error}</div> : null}

      <div className="stamp stamp--tl">A. Treny · working board</div>

      {/* Board-level chrome (owner bar, sign-in, top-right hint, bottom
          toolbar) is hidden while a dossier is open: it floats above the
          dossier plate (higher z-index than the modal) and would otherwise
          overlap its own header/controls. The dossier has everything it
          needs (close/prev/next, editing flag, inline block editor). */}
      {!openEntry ? (
        <>
          <div className="stamp stamp--tr">click any line to open its page<br />drag the paper · scroll to zoom</div>

          {authed ? (
            <div className="ownerbar">
              <button className={`tbtn ${editing ? 'tbtn--on' : ''}`} type="button" onClick={() => setEditing((v) => !v)}>{editing ? 'editing · on' : 'edit mode'}</button>
              {editing ? (
                <>
                  <span className="ownerbar__add">add:</span>
                  <button className="tbtn" type="button" onClick={() => addCard('drawer')}>drawer</button>
                  <button className="tbtn" type="button" onClick={() => addCard('spotlight')}>spotlight</button>
                  <button className="tbtn" type="button" onClick={addPolaroid}>photo</button>
                  <button className="tbtn" type="button" onClick={addNote}>note</button>
                </>
              ) : null}
              <button className="tbtn" type="button" onClick={() => setThemeOpen(true)}>theme</button>
              <button className="tbtn" type="button" onClick={() => setInventoryOpen(true)}>entries</button>
              {localEdit ? <span className="ownerbar__badge" title="Vista previa local — los cambios no se guardan">preview</span> : <button className="tbtn tbtn--ghost" type="button" onClick={doLogout} title="sign out">⏏</button>}
            </div>
          ) : (
            <button className="signin" type="button" onClick={() => setLoginOpen(true)}>⌗ sign in</button>
          )}

          <div className="toolbar">
            <div className="toolbar__inner">
              <span className="toolbar__label">the board</span>
              <button className="tbtn" type="button" onClick={() => fitAll()}>fit</button>
              <button className="tbtn" type="button" onClick={() => arrange('tidy')}>tidy</button>
              <button className="tbtn" type="button" onClick={() => arrange('scatter')}>scatter</button>
              <button className="tbtn" type="button" onClick={() => arrange('reset')}>reset</button>
              <span className="toolbar__sep" />
              {JUMPS.map(([label, name]) => (
                <button key={name} className="tbtn tbtn--ghost" type="button" onClick={() => jump(name)}>{label}</button>
              ))}
              <span className="toolbar__sep" />
              <button className="tbtn tbtn--icon" type="button" aria-label="Alejar" onClick={() => zoomBy(0.8)}>−</button>
              <button className="tbtn tbtn--icon" type="button" aria-label="Acercar" onClick={() => zoomBy(1.25)}>+</button>
            </div>
          </div>
        </>
      ) : null}

      {openEntry ? (
        <DossierPlate
          entry={openEntry}
          posLabel={`${openIndex + 1} / ${orderedSlugs.length}`}
          prevTitle={prevEntry?.title ?? ''}
          nextTitle={nextEntry?.title ?? ''}
          editing={editing}
          onClose={() => setOpenSlug(null)}
          onPrev={() => { const i = orderedSlugs.indexOf(openEntry.slug); setOpenSlug(orderedSlugs[(i - 1 + orderedSlugs.length) % orderedSlugs.length]); }}
          onNext={() => { const i = orderedSlugs.indexOf(openEntry.slug); setOpenSlug(orderedSlugs[(i + 1) % orderedSlugs.length]); }}
          onChange={changeEntry}
          uploadPhoto={uploadPhoto}
        />
      ) : null}

      {loginOpen ? (
        <div className="overlay" role="presentation">
          <div className="overlay__scrim" onClick={() => setLoginOpen(false)} />
          <div className="panel panel--login" role="dialog" aria-modal="true" aria-label="Acceso propietario">
            <div className="panel__eyebrow">owner access</div>
            <div className="panel__title">Sign in to edit<br />the board</div>
            <p className="panel__hint">Unlocks inline editing of every card and page, plus draggable layout, colours, fonts and photos — all saved to your Neon database.</p>
            <input ref={emailRef} className="field" type="email" placeholder="email" autoComplete="username" />
            <input ref={passRef} className="field" type="password" placeholder="password" autoComplete="current-password" onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }} />
            <div className="panel__actions">
              <button className="tbtn tbtn--on" type="button" onClick={doLogin}>unlock</button>
              <button className="tbtn" type="button" onClick={() => setLoginOpen(false)}>cancel</button>
            </div>
            <div className="panel__err">{loginError}</div>
          </div>
        </div>
      ) : null}

      {themeOpen ? <ThemePanel theme={theme} onChange={commitTheme} onClose={() => setThemeOpen(false)} /> : null}
      {inventoryOpen ? (
        <InventoryPanel
          entries={entries}
          remoteDataEnabled={remoteDataEnabled}
          onClose={() => setInventoryOpen(false)}
          onCreated={(entry) => { setEntries((list) => [...list, entry]); }}
          onDeleted={(id) => { setEntries((list) => list.filter((e) => e.id !== id)); }}
          onRestored={(entry) => { setEntries((list) => (list.some((e) => e.id === entry.id) ? list : [...list, entry])); }}
          notify={flash}
        />
      ) : null}

      {toast ? <div className={`owner-toast ${toast.error ? 'owner-toast--err' : ''}`}>{toast.text}</div> : null}
    </>
  );
}
