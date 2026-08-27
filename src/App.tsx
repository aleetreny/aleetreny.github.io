// Which portfolio this visitor gets.
//
// There are two, and they are not the same program. The desk board is a canvas
// you fly a camera over; the walkthrough is an app you tap through. A phone
// gets the walkthrough, a desk gets the board, and neither downloads the other
// until it is asked for — the two are split at this boundary precisely so the
// phone never pays for the camera, the world loop or the editing panels.
//
// Three things override the screen size, and all three are deliberate:
//
//   ?owner=1 — the editor lives on the desk board, full stop.
//   ?board=1 — the visitor asked for the whole slate from the walkthrough.
//   a resize — a desktop window dragged narrow is a small screen too.

import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { runtimeConfig } from './lib/config';

const DeskBoard = lazy(() => import('./components/DeskBoard').then((m) => ({ default: m.DeskBoard })));
const MobileBoard = lazy(() => import('./components/mobile/MobileBoard').then((m) => ({ default: m.MobileBoard })));

/** Small enough that a 4120px slate is unreadable: a phone held either way up.
 *  The height half is qualified by a coarse pointer so a short desktop window
 *  — a browser next to a terminal — keeps the board it was using. */
const SMALL_SCREEN = '(max-width: 720px), (max-height: 500px) and (pointer: coarse)';

function smallScreen(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(SMALL_SCREEN).matches);
}

function boardRequested(): boolean {
  return new URLSearchParams(window.location.search).get('board') === '1';
}

export default function App() {
  const ownerIntent = new URLSearchParams(window.location.search).get('owner') === '1';
  const [small, setSmall] = useState(smallScreen);
  const [board, setBoard] = useState(boardRequested);

  useEffect(() => {
    const query = window.matchMedia(SMALL_SCREEN);
    const sync = () => setSmall(query.matches);
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // The slate is a place, so it gets an address. Asking for it pushes a history
  // entry, which makes the phone's own back gesture the way out of it — the
  // same contract the pushed article keeps.
  const openBoard = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('board', '1');
    window.history.pushState({ board: true }, '', url);
    setBoard(true);
  }, []);

  useEffect(() => {
    const onPop = () => setBoard(boardRequested());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const walkthrough = small && !ownerIntent && !board;

  return (
    <Suspense fallback={<div className="boot" aria-hidden="true" />}>
      {walkthrough
        ? <MobileBoard onOpenBoard={openBoard} />
        : (
          <DeskBoard
            remoteDataEnabled={runtimeConfig.remoteDataEnabled}
            ownerIntent={ownerIntent}
            skipTour={small && board}
            onLeave={small && board && !ownerIntent ? () => window.history.back() : undefined}
          />
        )}
    </Suspense>
  );
}
