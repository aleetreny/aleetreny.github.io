// The board as an app.
//
// On a desktop the portfolio is one canvas you drag around. That gesture has
// no phone equivalent worth having: a 4120px slate on a 390px screen is either
// a mosaic nobody can read or a maze nobody can leave, and every attempt to
// scale it down ends up asking a thumb to do a trackpad's job.
//
// So the phone gets the same board, walked instead of flown over. Thirteen
// screens, one card each, in the order the owner authored the guided tour; a
// thumb-sized "next" at the bottom, a swipe if you prefer, a progress rail you
// can tap to jump, and an index sheet for the whole route. A row opens its
// dossier as a pushed screen with a back button and the hardware back gesture
// wired to it. Nothing zooms, nothing pans, nothing is smaller than a thumb.
//
// Everything the desk holds that a phone cannot use — the thirty-three
// interactive objects, the paint gun, drag, pinch, the editor — stays on the
// desk, and the last screen offers a door to it.
//
// This component is deliberately its own root rather than a branch inside
// DeskBoard: a phone then never downloads the board's camera, world loop or
// editing panels at all (see App.tsx, where the two are lazily split).

import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { PortfolioEntry, StoredPortfolioEntry } from '../../types/content';
import { demoEntries, demoSettings } from '../../content/demo';
import {
  BOARD_TEXTURES,
  dossierOrder,
  parseBoard,
  parseLayout,
  parseTheme,
  slateBackground,
  slateInk,
  themeVars,
  type BoardConfig,
  type ThemeConfig,
} from '../../lib/board';
import {
  DEFAULT_I18N,
  initialLanguage,
  localise,
  parseI18n,
  rememberLanguage,
  type I18nConfig,
} from '../../lib/i18n';
import { buildChapters, splitLabel, withLayout, type MobileChapter } from '../../lib/mobile';
import { parseTour, type TourConfig } from '../../lib/tour';
import { makeUiText, parseUiOverrides } from '../../lib/ui-text';
import { listPublishedEntries, listSiteSettings } from '../../lib/content-repository';
import { UiTextContext } from '../desk/ui-text-context';
import { MobileChapterView } from './MobileChapterView';

// The article is a second screen, and a visitor who never opens one should
// never pay for it. It arrives on idle, so the first tap still opens instantly.
const MobileArticle = lazy(() => import('./MobileArticle').then((m) => ({ default: m.MobileArticle })));

type MobileBoardProps = {
  /** Leave the walk for the full desk board — the objects, the drag, the
   *  editor. Handed down so the switch itself lives in one place. */
  onOpenBoard: () => void;
};

/** How far a thumb has to travel before a swipe counts as turning the page —
 *  a fraction of the screen, or fast enough that distance stops mattering. */
const SWIPE_FRACTION = 0.22;
const SWIPE_VELOCITY = 0.45;
/** Past the first and last screen the track still moves, but grudgingly. */
const RUBBER = 0.32;

export function MobileBoard({ onOpenBoard }: MobileBoardProps) {
  const [rawEntries, setEntries] = useState<StoredPortfolioEntry[]>(demoEntries);
  const [settings, setSettings] = useState<Record<string, unknown>>(demoSettings);

  const theme = useMemo<ThemeConfig>(() => parseTheme(settings.theme), [settings.theme]);
  const i18n = useMemo<I18nConfig>(() => parseI18n(settings['site.i18n'] ?? DEFAULT_I18N), [settings]);
  const [lang, setLang] = useState<string>(() => initialLanguage(parseI18n(demoSettings['site.i18n'] ?? DEFAULT_I18N)));
  const activeLang = i18n.enabled && i18n.languages.some((l) => l.code === lang) ? lang : i18n.primary;
  const uiOverrides = useMemo(() => parseUiOverrides(settings['site.ui']), [settings]);
  const t = useMemo(() => makeUiText(uiOverrides, activeLang, i18n.primary), [uiOverrides, activeLang, i18n.primary]);

  useEffect(() => { document.documentElement.lang = activeLang; }, [activeLang]);

  const board = useMemo<BoardConfig>(() => {
    const parsed = parseBoard(i18n.enabled ? localise(settings.board, activeLang, i18n.primary) : settings.board);
    return withLayout(parsed, parseLayout(settings['board.layout']));
  }, [settings, i18n.enabled, i18n.primary, activeLang]);
  const tour = useMemo<TourConfig>(
    () => parseTour(i18n.enabled ? localise(settings['board.tour'], activeLang, i18n.primary) : settings['board.tour']),
    [settings, i18n.enabled, i18n.primary, activeLang],
  );
  const entries = useMemo<PortfolioEntry[]>(
    () => rawEntries.map((entry) => (i18n.enabled ? localise(entry, activeLang, i18n.primary) : entry) as PortfolioEntry),
    [rawEntries, i18n.enabled, i18n.primary, activeLang],
  );

  const chapters = useMemo<MobileChapter[]>(() => buildChapters(board, tour), [board, tour]);
  const groupLabel = useCallback(
    (id: string | undefined) => board.groups.find((group) => group.id === id)?.label ?? id ?? '',
    [board.groups],
  );

  const [step, setStep] = useState(0);
  const [indexOpen, setIndexOpen] = useState(false);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Clamped on the way out rather than corrected afterwards: a board reloaded
  // from the network can carry a shorter route than the fixture the app opened
  // with, and a reader parked on stop 12 of 13 must not land on nothing.
  const count = chapters.length;
  const index = Math.max(0, Math.min(step, count - 1));

  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  // The gesture handlers read the settled screen without re-binding on every
  // change; it is written in the layout effect below, which is the same commit
  // the track is repainted in.
  const indexRef = useRef(0);

  // ---- data ----------------------------------------------------------------
  useEffect(() => {
    let active = true;
    Promise.all([listPublishedEntries(), listSiteSettings()])
      .then(([nextEntries, nextSettings]) => {
        if (!active) return;
        if (nextEntries.length > 0) setEntries(nextEntries);
        if (nextSettings && Object.keys(nextSettings).length > 0) setSettings(nextSettings);
      })
      // The fixture is a complete board, so a phone with no network still gets
      // the whole walk rather than an error page.
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  // ---- theme ---------------------------------------------------------------
  const texture = BOARD_TEXTURES[theme.boardStyle] ?? BOARD_TEXTURES.slate;
  const cssVars = useMemo(() => ({
    ...themeVars(theme),
    '--board-ink': slateInk(theme.backdrop, texture),
  }), [theme, texture]);
  useLayoutEffect(() => {
    const root = document.documentElement;
    for (const [key, value] of Object.entries(cssVars)) root.style.setProperty(key, value);
    return () => { for (const key of Object.keys(cssVars)) root.style.removeProperty(key); };
  }, [cssVars]);

  // The app stands on the same slate the cards are pinned to, so the walk and
  // the board are visibly the same object.
  const ground = useMemo(() => slateBackground(theme.backdrop, texture), [theme.backdrop, texture]);

  // ---- the walk ------------------------------------------------------------
  /** A jump of more than one screen — a rail tick, an index row — arrives as a
   *  cut rather than a slide. Sliding it whips ten screens past the eye in
   *  four hundred milliseconds, which reads as a glitch, not as travel. */
  const cutRef = useRef(false);
  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(count - 1, next));
    cutRef.current = Math.abs(clamped - indexRef.current) > 1;
    setStep(clamped);
  }, [count]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (openSlug || indexOpen) return;
      if (event.key === 'ArrowRight') goTo(indexRef.current + 1);
      if (event.key === 'ArrowLeft') goTo(indexRef.current - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [goTo, openSlug, indexOpen]);

  // ---- the swipe -----------------------------------------------------------
  //
  // One pointer, one decision. Until the gesture has moved far enough to say
  // whether it is a page turn or a scroll, nothing happens; after that it is
  // one or the other for the rest of the gesture. `touch-action: pan-y` on the
  // page hands vertical scrolling to the browser, so this only ever fights for
  // the horizontal axis.
  const gesture = useRef<{ id: number; x: number; y: number; at: number; axis: '' | 'x' | 'y'; dx: number } | null>(null);
  /** A finished swipe still ends in a `click` on whatever was under the thumb,
   *  and whatever was under the thumb is usually a row that opens an article.
   *  The next press clears it, so a swallowed click can never outlive its
   *  gesture. */
  const swallowClick = useRef(false);

  const paint = useCallback((offset: number) => {
    const track = trackRef.current;
    if (track) track.style.transform = `translate3d(${offset}px, 0, 0)`;
  }, []);

  const onPointerDown = (event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    swallowClick.current = false;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now(), axis: '', dx: 0 };
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    const dx = event.clientX - g.x;
    const dy = event.clientY - g.y;
    if (g.axis === '') {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (g.axis === 'x') {
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    }
    if (g.axis !== 'x') return;
    const width = stageRef.current?.clientWidth ?? 1;
    const at = indexRef.current;
    // Resist past the ends rather than stopping dead: a walk that refuses to
    // move says "broken", a walk that stretches says "this is the last one".
    const resisted = (at === 0 && dx > 0) || (at === count - 1 && dx < 0) ? dx * RUBBER : dx;
    g.dx = dx;
    paint(-at * width + resisted);
  };

  const endGesture = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || g.axis !== 'x') return;
    setDragging(false);
    swallowClick.current = true;
    const width = stageRef.current?.clientWidth ?? 1;
    const elapsed = Math.max(1, performance.now() - g.at);
    const velocity = g.dx / elapsed;
    const far = Math.abs(g.dx) > width * SWIPE_FRACTION;
    const fast = Math.abs(velocity) > SWIPE_VELOCITY;
    if (far || fast) goTo(indexRef.current + (g.dx < 0 ? 1 : -1));
    else paint(-indexRef.current * width);
  };

  // The track is positioned in pixels so a drag can move it by a thumb's worth
  // rather than by whole screens. That means every settled position has to be
  // repainted from here — on arrival, and again whenever the screen changes
  // size under it, which on a phone means every rotation and every time the
  // browser's own chrome slides away.
  useLayoutEffect(() => {
    indexRef.current = index;
    const repaint = () => paint(-index * (stageRef.current?.clientWidth ?? 0));
    const track = trackRef.current;
    if (track && cutRef.current) {
      cutRef.current = false;
      track.style.transition = 'none';
      repaint();
      // Force the new position to be taken before the transition comes back,
      // or the browser folds both changes into one animated step.
      void track.offsetHeight;
      track.style.transition = '';
    } else {
      repaint();
    }
    // Every screen starts at its heading. Resetting the arriving page here —
    // in the commit that moves the track, while it is still off-screen — is
    // the only moment where nothing about it is visible yet; doing it to the
    // departing page instead makes its content jump as it slides away.
    stageRef.current?.querySelectorAll('.m-page')[index]?.scrollTo({ top: 0 });
    window.addEventListener('resize', repaint);
    window.addEventListener('orientationchange', repaint);
    return () => {
      window.removeEventListener('resize', repaint);
      window.removeEventListener('orientationchange', repaint);
    };
  }, [index, paint]);

  // ---- layers, and the phone's own back gesture ----------------------------
  //
  // A dossier and the index sheet are both screens stacked over the walk, and
  // on a phone the way out of a stacked screen is the back gesture. Each one
  // pushes a history entry as it opens — from the handler that opens it, never
  // from an effect, so a double-invoked effect cannot push twice — and one
  // listener takes them all back down. Without this, "back" from the middle of
  // an article leaves the site, which is the most jarring thing a page can do.
  const openSlugRef = useRef<string | null>(null);
  useEffect(() => { openSlugRef.current = openSlug; }, [openSlug]);

  const layer = (name: string) => (window.history.state as { layer?: string } | null)?.layer === name;

  // Contact is a card with outbound links, not a dossier. The filter also
  // keeps a previously seeded contact entry out of article next/previous
  // navigation until the content store is refreshed from this source.
  const articleEntries = useMemo(
    () => entries.filter((entry) => entry.slug !== 'contact'),
    [entries],
  );

  const openArticle = useCallback((slug: string) => {
    if (!articleEntries.some((entry) => entry.slug === slug)) return;
    if (!openSlugRef.current) window.history.pushState({ layer: 'article' }, '');
    setOpenSlug(slug);
  }, [articleEntries]);
  const closeArticle = useCallback(() => {
    if (layer('article')) window.history.back(); else setOpenSlug(null);
  }, []);

  const openIndex = useCallback(() => {
    window.history.pushState({ layer: 'index' }, '');
    setIndexOpen(true);
  }, []);
  const closeIndex = useCallback(() => {
    if (layer('index')) window.history.back(); else setIndexOpen(false);
  }, []);

  useEffect(() => {
    const onPop = () => { setOpenSlug(null); setIndexOpen(false); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const orderedSlugs = useMemo(
    () => dossierOrder(articleEntries, board.groups.map((group) => group.id)),
    [articleEntries, board.groups],
  );
  const openEntry = openSlug ? articleEntries.find((entry) => entry.slug === openSlug) ?? null : null;
  const articleAt = openSlug ? orderedSlugs.indexOf(openSlug) : -1;
  const stepArticle = (delta: number) => {
    if (orderedSlugs.length === 0) return;
    setOpenSlug(orderedSlugs[(articleAt + delta + orderedSlugs.length) % orderedSlugs.length]);
  };
  const titleOf = (slug: string | undefined) => articleEntries.find((entry) => entry.slug === slug)?.title ?? '';

  // ---- chrome --------------------------------------------------------------
  const heading = splitLabel(chapters[index]?.label ?? '');
  // Whoever's board this is, said once, in the corner. The hero card carries
  // the name on two lines because that is how it is set on the slate; a bar is
  // one line.
  const mark = useMemo(() => {
    const hero = board.cards.find((card) => card.type === 'hero');
    return (hero?.name ?? '').replace(/\s+/g, ' ').trim() || t('board.label');
  }, [board.cards, t]);
  const last = index >= count - 1;

  const languageSwitch = i18n.enabled && i18n.languages.length > 1 ? (
    <div className="m-lang" role="group" aria-label={t('board.language')}>
      {i18n.languages.map((option) => (
        <button
          key={option.code}
          type="button"
          className={option.code === activeLang ? 'is-on' : undefined}
          aria-pressed={option.code === activeLang}
          onClick={() => { setLang(option.code); rememberLanguage(i18n, option.code); }}
        >
          {option.code.toUpperCase()}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <UiTextContext value={t}>
      <div className="m-app" style={{ background: ground }} aria-label={t('mobile.aria')}>
        <header className="m-bar">
          <span className="m-bar__mark">{mark}</span>
          <div className="m-bar__right">
            {languageSwitch}
            <button
              className="m-bar__index"
              type="button"
              onClick={openIndex}
              aria-label={t('mobile.indexAria')}
            >
              <span aria-hidden="true">☰</span>
              <span className="m-bar__count">{index + 1}<i>/</i>{count}</span>
            </button>
          </div>
        </header>

        <div className="m-rail" role="group" aria-label={t('mobile.progressAria')}>
          {chapters.map((chapter, i) => (
            <button
              key={chapter.id}
              type="button"
              className={`m-rail__tick${i <= index ? ' is-done' : ''}${i === index ? ' is-on' : ''}`}
              aria-label={`${i + 1}. ${splitLabel(chapter.label).text}`}
              aria-current={i === index ? 'step' : undefined}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        <main
          className={`m-stage${dragging ? ' is-dragging' : ''}`}
          ref={stageRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endGesture}
          onPointerCancel={endGesture}
          onClickCapture={(event) => {
            if (!swallowClick.current) return;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <div className="m-track" ref={trackRef}>
            {chapters.map((chapter, i) => (
              <section
                key={chapter.id}
                className={`m-page${i === index ? ' is-on' : ''}`}
                aria-label={`${i + 1}/${count} · ${splitLabel(chapter.label).text}`}
                aria-hidden={i === index ? undefined : true}
                inert={i === index ? undefined : true}
              >
                <MobileChapterView
                  chapter={chapter}
                  entries={entries}
                  groupLabel={groupLabel}
                  onOpen={openArticle}
                  footer={i === count - 1 ? (
                    <div className="m-outro">
                      <button className="m-outro__btn" type="button" onClick={onOpenBoard}>
                        {t('mobile.openBoard')} <span aria-hidden="true">→</span>
                      </button>
                      <p className="m-outro__hint">{t('mobile.openBoardHint')}</p>
                    </div>
                  ) : undefined}
                />
              </section>
            ))}
          </div>
        </main>

        <nav className="m-foot" aria-label={t('mobile.aria')}>
          <button
            className="m-foot__back"
            type="button"
            onClick={() => goTo(index - 1)}
            disabled={index === 0}
            aria-label={t('mobile.back')}
          >
            <span aria-hidden="true">←</span>
          </button>
          <span className="m-foot__where">
            {heading.number ? <b>{heading.number}</b> : null}
            <span>{heading.text}</span>
          </span>
          <button
            className="m-foot__next"
            type="button"
            onClick={() => (last ? goTo(0) : goTo(index + 1))}
          >
            {last ? t('mobile.startOver') : t('mobile.next')}
            <span aria-hidden="true">{last ? ' ↺' : ' →'}</span>
          </button>
        </nav>

        {indexOpen ? (
          <div className="m-sheetwrap" role="presentation">
            <div className="m-sheetwrap__scrim" onClick={closeIndex} />
            <div className="m-index" role="dialog" aria-modal="true" aria-label={t('mobile.indexAria')}>
              <div className="m-index__grip" aria-hidden="true" />
              <div className="m-index__head">
                <span className="k">{t('mobile.indexAria')}</span>
                <button type="button" onClick={closeIndex}>{t('mobile.close')}</button>
              </div>
              <ul className="m-index__list">
                {chapters.map((chapter, i) => {
                  const parts = splitLabel(chapter.label);
                  return (
                    <li key={chapter.id}>
                      <button
                        type="button"
                        className={i === index ? 'is-on' : undefined}
                        // Opening the index on stop twelve should show stop
                        // twelve, not stop one.
                        ref={i === index ? (node) => { node?.scrollIntoView({ block: 'center' }); } : undefined}
                        onClick={() => { goTo(i); closeIndex(); }}
                      >
                        {/* The owner's own numbering, not a second one laid over
                            it: an unnumbered stop — the cover — gets a mark
                            rather than a number it does not have. */}
                        <span className="m-index__no">{parts.number || '·'}</span>
                        <span className="m-index__label">{parts.text}</span>
                        <span className="m-index__go" aria-hidden="true">›</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button className="m-index__board" type="button" onClick={onOpenBoard}>
                {t('mobile.openBoard')} <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        ) : null}

        {openEntry ? (
          <Suspense fallback={null}>
            <MobileArticle
              key={openEntry.id}
              entry={openEntry}
              articles={articleEntries}
              activeLanguage={activeLang}
              position={`${articleAt + 1} / ${orderedSlugs.length}`}
              fromLabel={heading.text}
              prevTitle={titleOf(orderedSlugs[(articleAt - 1 + orderedSlugs.length) % orderedSlugs.length])}
              nextTitle={titleOf(orderedSlugs[(articleAt + 1) % orderedSlugs.length])}
              dossier={theme.dossier}
              onClose={closeArticle}
              onPrev={() => stepArticle(-1)}
              onNext={() => stepArticle(1)}
              onOpenArticle={setOpenSlug}
            />
          </Suspense>
        ) : null}
      </div>
    </UiTextContext>
  );
}
