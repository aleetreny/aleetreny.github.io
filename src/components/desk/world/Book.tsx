// A book, rather than a modal with a book in it.
//
// Closed it is an object with a spine and a bit of wear. Open it is two leaves
// under a light, and the leaf you are on turns about its own gutter — you can
// take a corner and pull it over, and if you let go halfway it falls back.
// The ribbon remembers where you were for as long as the tab is open.
//
// The text arrives a dozen pages at a time (see lib/world/book.ts), so a leaf
// that has not landed yet shows its rules and fills in when it does. And the
// open spread counter-scales against the camera: the book on the table is
// wherever the table has it, but the book you are reading is always the same
// size on your screen.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame } from '../../../lib/world/frame';
import {
  ANSWER, BOOK_LENGTH, STEPS, bookMarks, bookPage, fetchSpread, type BookPage,
} from '../../../lib/world/book';
import { clamp } from '../../../lib/world/rng';
import { readSession, writeSession } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const KEY = 'board.book.page';
const TURN_MS = 460;
/** The last left-hand leaf. Odd, so the final recto sits alone against the
 *  back endpaper the way it does in a real book. */
const LAST = BOOK_LENGTH % 2 === 1 ? BOOK_LENGTH : BOOK_LENGTH - 1;

type Turn = {
  dir: 1 | -1;
  mode: 'auto' | 'drag';
};

type Drag = {
  dir: 1 | -1;
  distance: number;
  from: number;
  lastX: number;
  lastAt: number;
  pending: number;
  progress: number;
  velocity: number;
  frame: number | null;
};

function turnTransform(dir: 1 | -1, progress: number) {
  const angle = progress * (dir === 1 ? -180 : 180);
  return `rotateY(${angle}deg)`;
}

function turnShadow(progress: number) {
  return Math.sin(progress * Math.PI) * 0.46;
}

export function Book() {
  const t = useUiText();
  const { reduced, scale } = useWorld();
  const [open, setOpen] = useState(false);
  // The left-hand leaf of the current opening. Openings are 1/2, 3/4, ...
  const [leaf, setLeaf] = useState(() => clamp(readSession<number>(KEY, 1) | 0, 1, LAST) | 1);
  const [turning, setTurning] = useState<Turn | null>(null);
  const [marks, setMarks] = useState(false);
  /** Bumped when a file of leaves lands, so the spread redraws. */
  const [arrived, setArrived] = useState(0);
  const turningPageRef = useRef<HTMLDivElement | null>(null);
  const turnShadowRef = useRef<HTMLSpanElement | null>(null);
  const pageAnimationRef = useRef<Animation | null>(null);
  const shadowAnimationRef = useRef<Animation | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const dragCleanupRef = useRef<(() => void) | null>(null);
  const busyRef = useRef(false);
  const spreadRef = useRef<HTMLDivElement | null>(null);
  const zoom = useRef(0);

  useEffect(() => { writeSession(KEY, leaf); }, [leaf]);

  // Fetch what this opening needs, and quietly the file on either side of it.
  useEffect(() => {
    if (!open) return undefined;
    let alive = true;
    fetchSpread(leaf).then(() => { if (alive) setArrived((n) => n + 1); });
    return () => { alive = false; };
  }, [leaf, open]);

  // The camera can be anywhere; the page has to stay readable. One read and, at
  // most, one style write per frame, and only while the book is open.
  useFrame(() => {
    const el = spreadRef.current;
    if (!el) return;
    const want = clamp(1 / (scale() || 1), 0.42, 2.6);
    if (Math.abs(want - zoom.current) < 0.004) return;
    zoom.current = want;
    el.style.setProperty('--book-zoom', want.toFixed(3));
  }, open);

  const go = useCallback((dir: 1 | -1) => {
    setLeaf((current) => clamp(current + dir * 2, 1, LAST));
  }, []);

  const finishTurn = useCallback((dir: 1 | -1) => {
    pageAnimationRef.current = null;
    shadowAnimationRef.current = null;
    busyRef.current = false;
    go(dir);
    setTurning(null);
  }, [go]);

  const cancelTurn = useCallback(() => {
    pageAnimationRef.current = null;
    shadowAnimationRef.current = null;
    busyRef.current = false;
    setTurning(null);
  }, []);

  /** The moving leaf and its cast shadow stay on the compositor. React only
   *  sees the beginning and end of a turn, even under a 120 Hz pointer. */
  const drawTurn = useCallback((dir: 1 | -1, progress: number) => {
    const page = turningPageRef.current;
    const shadow = turnShadowRef.current;
    if (page) page.style.transform = turnTransform(dir, progress);
    if (shadow) shadow.style.opacity = String(turnShadow(progress));
  }, []);

  const animateTurn = useCallback((dir: 1 | -1, from: number, to: 0 | 1) => {
    const page = turningPageRef.current;
    const shadow = turnShadowRef.current;
    if (!page) {
      if (to === 1) finishTurn(dir);
      else cancelTurn();
      return;
    }

    pageAnimationRef.current?.cancel();
    shadowAnimationRef.current?.cancel();

    const distance = Math.abs(to - from);
    if (distance < 0.001) {
      if (to === 1) finishTurn(dir);
      else cancelTurn();
      return;
    }

    const duration = Math.max(120, Math.round(TURN_MS * distance));
    const pageAnimation = page.animate([
      { transform: turnTransform(dir, from) },
      { transform: turnTransform(dir, to) },
    ], {
      duration,
      easing: to === 1 ? 'cubic-bezier(.2,.72,.16,1)' : 'cubic-bezier(.3,.8,.3,1)',
      fill: 'forwards',
    });

    const shadowFrames: Keyframe[] = [{ opacity: turnShadow(from) }];
    const crossesMiddle = (from < 0.5 && to > 0.5) || (from > 0.5 && to < 0.5);
    if (crossesMiddle) {
      shadowFrames.push({
        opacity: 0.46,
        offset: Math.abs((0.5 - from) / (to - from)),
      });
    }
    shadowFrames.push({ opacity: turnShadow(to) });
    const shadowAnimation = shadow?.animate(shadowFrames, { duration, fill: 'forwards' }) ?? null;

    pageAnimationRef.current = pageAnimation;
    shadowAnimationRef.current = shadowAnimation;
    pageAnimation.onfinish = () => {
      if (pageAnimationRef.current !== pageAnimation) return;
      if (to === 1) finishTurn(dir);
      else cancelTurn();
    };
  }, [cancelTurn, finishTurn]);

  const turn = useCallback((dir: 1 | -1) => {
    if (busyRef.current) return;
    if (dir === 1 && leaf >= LAST) return;
    if (dir === -1 && leaf <= 1) return;
    if (reduced) { go(dir); return; }
    busyRef.current = true;
    setMarks(false);
    setTurning({ dir, mode: 'auto' });
  }, [go, leaf, reduced]);

  useLayoutEffect(() => {
    if (turning?.mode !== 'auto') return undefined;
    const frame = requestAnimationFrame(() => animateTurn(turning.dir, 0, 1));
    return () => cancelAnimationFrame(frame);
  }, [animateTurn, turning]);

  /** Taking a corner: the leaf follows the pointer, and it only turns if you
   *  pull it past the gutter. Let go early and it drops back. */
  const grabCorner = useCallback((dir: 1 | -1) => (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (event.button !== 0 || busyRef.current) return;
    if (dir === 1 && leaf >= LAST) return;
    if (dir === -1 && leaf <= 1) return;
    if (reduced) { go(dir); return; }

    busyRef.current = true;
    setMarks(false);
    const now = performance.now();
    const spread = event.currentTarget.closest('.book__spread');
    const spreadBox = spread?.getBoundingClientRect();
    const cornerBox = event.currentTarget.getBoundingClientRect();
    const cornerX = cornerBox.x + cornerBox.width / 2;
    const gutterX = spreadBox ? spreadBox.x + spreadBox.width / 2 : cornerX - dir * 182;
    dragRef.current = {
      dir,
      distance: Math.max(48, Math.abs(cornerX - gutterX)),
      from: event.clientX,
      lastX: event.clientX,
      lastAt: now,
      pending: 0,
      progress: 0,
      velocity: 0,
      frame: null,
    };
    setTurning({ dir, mode: 'drag' });

    const move = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const travel = (drag.from - ev.clientX) * drag.dir;
      drag.pending = Math.max(0, Math.min(1, travel / drag.distance));

      const at = performance.now();
      const elapsed = Math.max(1, at - drag.lastAt);
      const instantVelocity = ((drag.lastX - ev.clientX) * drag.dir) / elapsed;
      drag.velocity = drag.velocity * 0.62 + instantVelocity * 0.38;
      drag.lastX = ev.clientX;
      drag.lastAt = at;

      if (drag.frame === null) {
        drag.frame = requestAnimationFrame(() => {
          const active = dragRef.current;
          if (!active) return;
          active.frame = null;
          active.progress = active.pending;
          drawTurn(active.dir, active.progress);
        });
      }
    };
    const up = () => {
      const drag = dragRef.current;
      dragCleanupRef.current?.();
      dragRef.current = null;
      if (!drag) return;
      if (drag.frame !== null) cancelAnimationFrame(drag.frame);
      drag.progress = drag.pending;
      drawTurn(drag.dir, drag.progress);

      // A short decisive flick is enough; a slow turn crosses the gutter.
      const commit = drag.progress >= 0.42 || drag.velocity > 0.42;
      animateTurn(drag.dir, drag.progress, commit ? 1 : 0);
    };
    const cleanUp = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      dragCleanupRef.current = null;
    };
    dragCleanupRef.current = cleanUp;
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [animateTurn, drawTurn, go, leaf, reduced]);

  const closeBook = useCallback(() => {
    dragCleanupRef.current?.();
    const drag = dragRef.current;
    if (drag?.frame !== null && drag?.frame !== undefined) cancelAnimationFrame(drag.frame);
    dragRef.current = null;
    pageAnimationRef.current?.cancel();
    shadowAnimationRef.current?.cancel();
    pageAnimationRef.current = null;
    shadowAnimationRef.current = null;
    busyRef.current = false;
    setTurning(null);
    setOpen(false);
  }, []);

  useEffect(() => () => {
    dragCleanupRef.current?.();
    const frame = dragRef.current?.frame;
    if (frame !== null && frame !== undefined) cancelAnimationFrame(frame);
    pageAnimationRef.current?.cancel();
    shadowAnimationRef.current?.cancel();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); turn(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); turn(-1); }
      if (event.key === 'Escape') closeBook();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeBook, open, turn]);

  const flipping = turning?.dir === 1;
  // During the turn the destination leaf is already waiting underneath the
  // moving sheet. The page being left is never painted twice.
  const leftPage = turning ? leaf + (turning.dir === 1 ? 0 : -2) : leaf;
  const rightPage = turning ? leaf + (turning.dir === 1 ? 3 : 1) : leaf + 1;
  const jumpTo = useCallback((n: number) => {
    setLeaf(clamp(n % 2 === 0 ? n - 1 : n, 1, LAST));
    setMarks(false);
  }, []);
  // Read once per render so the spread redraws when a file lands.
  void arrived;

  return (
    <ObjectShell
      id="book"
      hint={open ? undefined : t('world.book.hint')}
      onActivate={() => setOpen((v) => !v)}
      label={t('world.book.label')}
      className={open ? 'obj--book-open' : ''}
    >
      {open ? (
        <div className="book book--open" data-nodrag ref={spreadRef}>
          <button className="book__close" type="button" onClick={closeBook} aria-label={t('world.book.close')}>×</button>
          <div className="book__spread" aria-busy={Boolean(turning)}>
            <Leaf n={leftPage} side="left" />
            <Leaf n={rightPage} side="right" />
            <span className="book__gutter" aria-hidden="true" />

            {/* The leaf in flight. Its front is the recto you are leaving and
                its back is the verso you are arriving at, which is what makes
                a page turn read as paper rather than as a slide. */}
            {turning ? (
              <div
                ref={turningPageRef}
                className={`book__turning book__turning--${turning.dir === 1 ? 'fwd' : 'back'}`}
                style={{ transform: turnTransform(turning.dir, 0) }}
                aria-hidden="true"
              >
                <div className="book__turnface book__turnface--front">
                  <Leaf n={flipping ? leaf + 1 : leaf} side={flipping ? 'right' : 'left'} bare />
                </div>
                <div className="book__turnface book__turnface--back">
                  <Leaf n={flipping ? leaf + 2 : leaf - 1} side={flipping ? 'left' : 'right'} bare />
                </div>
              </div>
            ) : null}

            {turning ? (
              <span
                ref={turnShadowRef}
                className={`book__turnshadow book__turnshadow--${turning.dir === 1 ? 'fwd' : 'back'}`}
                aria-hidden="true"
              />
            ) : null}

            {/* The corners you can actually take hold of. */}
            <span className="book__corner book__corner--r" onPointerDown={grabCorner(1)} role="presentation" />
            <span className="book__corner book__corner--l" onPointerDown={grabCorner(-1)} role="presentation" />
          </div>

          <div className="book__bar">
            <button className="book__nav" type="button" onClick={() => turn(-1)} disabled={leaf <= 1 || Boolean(turning)} aria-label={t('world.book.prev')}>‹</button>
            <button className="book__ribbon" type="button" onClick={() => setMarks((v) => !v)} disabled={Boolean(turning)}>
              {leaf}–{Math.min(leaf + 1, BOOK_LENGTH)} / {BOOK_LENGTH}
            </button>
            <button className="book__nav" type="button" onClick={() => turn(1)} disabled={leaf >= LAST || Boolean(turning)} aria-label={t('world.book.next')}>›</button>
          </div>

          {marks ? (
            <ul className="book__marks">
              {bookMarks().map((n) => (
                <li key={n}>
                  <button type="button" onClick={() => jumpTo(n)} disabled={Boolean(turning)}>
                    <span>{n}</span> {t(n === 1 ? 'world.book.start' : n === ANSWER ? 'world.book.answer' : 'world.book.end')}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <div className="book book--shut">
          <span className="book__cover">
            <span className="book__title">THE HITCHHIKER’S GUIDE</span>
            <span className="book__sub">TO THE GALAXY</span>
            <span className="book__panic">DON’T PANIC</span>
          </span>
          <span className="book__edges" aria-hidden="true" />
          <span className="book__spine" aria-hidden="true" />
          <span className="book__tail" aria-hidden="true" />
        </div>
      )}
    </ObjectShell>
  );
}

function Leaf({ n, side, bare = false }: { n: number; side: 'left' | 'right'; bare?: boolean }) {
  const page: BookPage | null = bookPage(n);
  // Past the last folio there is no page: the back endpaper, not a blank one.
  const kind = n < 1 || n > BOOK_LENGTH ? 'end' : n === ANSWER ? 'answer' : page ? 'text' : 'waiting';
  return (
    <div className={`book__leaf book__leaf--${side} book__leaf--${kind}${bare ? ' book__leaf--bare' : ''}`} data-page={n}>
      {page ? (
        <div className="book__body" style={{ fontSize: `${STEPS[page.fit] ?? STEPS[0]}px` }}>
          {page.lines.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      ) : <div className="book__rules" aria-hidden="true" />}
      {kind === 'answer' ? <span className="book__glow" aria-hidden="true" /> : null}
      {kind === 'end' ? null : <span className="book__folio">{n}</span>}
    </div>
  );
}
