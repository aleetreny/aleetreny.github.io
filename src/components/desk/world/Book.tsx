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

import { useCallback, useEffect, useRef, useState } from 'react';
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
/** The last left-hand leaf. Odd, so the final recto sits alone against the
 *  back endpaper the way it does in a real book. */
const LAST = BOOK_LENGTH % 2 === 1 ? BOOK_LENGTH : BOOK_LENGTH - 1;

export function Book() {
  const t = useUiText();
  const { reduced, scale } = useWorld();
  const [open, setOpen] = useState(false);
  // The left-hand leaf of the current opening. Openings are 1/2, 3/4, ...
  const [leaf, setLeaf] = useState(() => clamp(readSession<number>(KEY, 1) | 0, 1, LAST) | 1);
  const [turning, setTurning] = useState<{ dir: 1 | -1; t: number } | null>(null);
  const [marks, setMarks] = useState(false);
  /** Bumped when a file of leaves lands, so the spread redraws. */
  const [arrived, setArrived] = useState(0);
  const dragRef = useRef<{ from: number; dir: 1 | -1 } | null>(null);
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

  const turn = useCallback((dir: 1 | -1) => {
    if (turning) return;
    if (dir === 1 && leaf >= LAST) return;
    if (dir === -1 && leaf <= 1) return;
    if (reduced) { go(dir); return; }
    setTurning({ dir, t: 0 });
    const started = performance.now();
    const step = () => {
      const k = Math.min(1, (performance.now() - started) / 620);
      setTurning({ dir, t: k });
      if (k < 1) { requestAnimationFrame(step); return; }
      setTurning(null);
      go(dir);
    };
    requestAnimationFrame(step);
  }, [go, leaf, reduced, turning]);

  /** Taking a corner: the leaf follows the pointer, and it only turns if you
   *  pull it past the gutter. Let go early and it drops back. */
  const grabCorner = useCallback((dir: 1 | -1) => (event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (turning) return;
    if (dir === 1 && leaf >= LAST) return;
    if (dir === -1 && leaf <= 1) return;
    dragRef.current = { from: event.clientX, dir };
    const width = 150;
    const move = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const travel = (drag.from - ev.clientX) * drag.dir;
      setTurning({ dir: drag.dir, t: Math.max(0, Math.min(1, travel / width)) });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const drag = dragRef.current;
      dragRef.current = null;
      setTurning((current) => {
        if (!current || !drag) return null;
        if (current.t > 0.45) { window.setTimeout(() => go(drag.dir), 0); }
        return null;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [go, leaf, turning]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') { event.preventDefault(); turn(1); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); turn(-1); }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, turn]);

  const angle = turning ? turning.t * 180 : 0;
  const flipping = turning?.dir === 1;
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
          <button className="book__close" type="button" onClick={() => setOpen(false)} aria-label={t('world.book.close')}>×</button>
          <div className="book__spread">
            <Leaf n={leaf} side="left" />
            <Leaf n={leaf + 1} side="right" />
            <span className="book__gutter" aria-hidden="true" />

            {/* The leaf in flight. Its front is the recto you are leaving and
                its back is the verso you are arriving at, which is what makes
                a page turn read as paper rather than as a slide. */}
            {turning ? (
              <div
                className={`book__turning book__turning--${turning.dir === 1 ? 'fwd' : 'back'}`}
                style={{ transform: `rotateY(${turning.dir === 1 ? -angle : angle - 180}deg)` }}
              >
                <div className="book__turnface book__turnface--front">
                  <Leaf n={flipping ? leaf + 1 : leaf - 1} side="right" bare />
                </div>
                <div className="book__turnface book__turnface--back">
                  <Leaf n={flipping ? leaf + 2 : leaf} side="left" bare />
                </div>
              </div>
            ) : null}

            {/* The corners you can actually take hold of. */}
            <span className="book__corner book__corner--r" onPointerDown={grabCorner(1)} role="presentation" />
            <span className="book__corner book__corner--l" onPointerDown={grabCorner(-1)} role="presentation" />
          </div>

          <div className="book__bar">
            <button className="book__nav" type="button" onClick={() => turn(-1)} disabled={leaf <= 1} aria-label={t('world.book.prev')}>‹</button>
            <button className="book__ribbon" type="button" onClick={() => setMarks((v) => !v)}>
              {leaf}–{Math.min(leaf + 1, BOOK_LENGTH)} / {BOOK_LENGTH}
            </button>
            <button className="book__nav" type="button" onClick={() => turn(1)} disabled={leaf >= LAST} aria-label={t('world.book.next')}>›</button>
          </div>

          {marks ? (
            <ul className="book__marks">
              {bookMarks().map((n) => (
                <li key={n}>
                  <button type="button" onClick={() => jumpTo(n)}>
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
    <div className={`book__leaf book__leaf--${side} book__leaf--${kind}${bare ? ' book__leaf--bare' : ''}`}>
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
