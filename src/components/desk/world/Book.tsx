// A book, rather than a modal with a book in it.
//
// Closed it is an object with a spine and a bit of wear. Open it is two leaves
// under a light, and the leaf you are on turns about its own gutter — you can
// take a corner and pull it over, and if you let go halfway it falls back.
// The ribbon remembers where you were for as long as the tab is open.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { BOOK_LENGTH, bookMarks, bookPage, type BookPage } from '../../../lib/world/book';
import { readSession, writeSession } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const KEY = 'board.book.page';

export function Book({ onAnswer }: { onAnswer: () => void }) {
  const t = useUiText();
  const { reduced } = useWorld();
  const [open, setOpen] = useState(false);
  // The left-hand leaf of the current opening. Openings are 1/2, 3/4, ...
  const [leaf, setLeaf] = useState(() => readSession<number>(KEY, 1));
  const [turning, setTurning] = useState<{ dir: 1 | -1; t: number } | null>(null);
  const [marks, setMarks] = useState(false);
  const dragRef = useRef<{ from: number; dir: 1 | -1 } | null>(null);

  useEffect(() => { writeSession(KEY, leaf); }, [leaf]);

  // Reaching the forty-second leaf is one of the ways in.
  useEffect(() => {
    if (open && (leaf === 42 || leaf + 1 === 42)) onAnswer();
  }, [leaf, onAnswer, open]);

  const go = useCallback((dir: 1 | -1) => {
    setLeaf((current) => {
      const next = current + dir * 2;
      return Math.max(1, Math.min(BOOK_LENGTH - 1, next));
    });
  }, []);

  const turn = useCallback((dir: 1 | -1) => {
    if (turning) return;
    if (dir === 1 && leaf + 1 >= BOOK_LENGTH) return;
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
  }, [go, turning]);

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

  return (
    <ObjectShell
      id="book"
      hint={open ? undefined : t('world.book.hint')}
      onActivate={() => setOpen((v) => !v)}
      label={t('world.book.label')}
      className={open ? 'obj--book-open' : ''}
    >
      {open ? (
        <div className="book book--open" data-nodrag>
          <button className="book__close" type="button" onClick={() => setOpen(false)} aria-label={t('world.book.close')}>×</button>
          <div className="book__spread">
            <Leaf page={bookPage(leaf)} side="left" />
            <Leaf page={bookPage(leaf + 1)} side="right" />
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
                  <Leaf page={bookPage(flipping ? leaf + 1 : leaf - 1)} side="right" bare />
                </div>
                <div className="book__turnface book__turnface--back">
                  <Leaf page={bookPage(flipping ? leaf + 2 : leaf)} side="left" bare />
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
              {leaf}–{leaf + 1} / {BOOK_LENGTH}
            </button>
            <button className="book__nav" type="button" onClick={() => turn(1)} disabled={leaf + 1 >= BOOK_LENGTH} aria-label={t('world.book.next')}>›</button>
          </div>

          {marks ? (
            <ul className="book__marks">
              {bookMarks().map((mark) => (
                <li key={mark.n}>
                  <button type="button" onClick={() => { setLeaf(mark.n % 2 === 0 ? mark.n - 1 : mark.n); setMarks(false); }}>
                    <span>{mark.n}</span> {mark.label.split('\n')[0]}
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

function Leaf({ page, side, bare = false }: { page: BookPage; side: 'left' | 'right'; bare?: boolean }) {
  return (
    <div className={`book__leaf book__leaf--${side} book__leaf--${page.kind}${bare ? ' book__leaf--bare' : ''}`}>
      {page.heading ? (
        <h4 className="book__heading">{page.heading.split('\n').map((line, i) => <span key={i}>{line}</span>)}</h4>
      ) : null}
      {page.lines
        ? <div className="book__body">{page.lines.map((line, i) => <p key={i}>{line || ' '}</p>)}</div>
        : <div className="book__rules" aria-hidden="true" />}
      {page.margin ? <span className="book__margin" aria-hidden="true">{page.margin}</span> : null}
      <span className="book__folio">{page.n}</span>
    </div>
  );
}
