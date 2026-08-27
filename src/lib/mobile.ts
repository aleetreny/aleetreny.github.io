// The board, one screen at a time.
//
// A phone cannot hold a 4120 × 2500 slate. Zoomed out it is a mosaic nobody
// can read; zoomed in it is a maze nobody can navigate. So on a small screen
// the board is not scaled down — it is *walked*, exactly the way the guided
// tour already walks it on a desktop, except the visitor holds the "next"
// button instead of the camera.
//
// That is the whole idea behind this module: the mobile app has no route of
// its own. It reads the same `board.tour` document the desktop tour reads,
// through the same `buildStops`, and turns each stop into one screen. Rename a
// stop, reorder the route or add a card from the tour panel and the phone
// follows, in both languages, with nothing here to keep in sync.
//
// A screen is a card and nothing else. The loose photographs and the pinned
// notes are furniture: on the slate they are what the eye rests on between one
// drawer and the next, but in a single column on a phone they are things to
// scroll past on the way to the work. They stay on the desk.
//
// Everything below is pure. It takes the parsed board and the tour, and
// returns an ordered list of chapters. No React, no DOM, no measurements — so
// the walk itself is testable.

import { buildStops, type TourConfig, type TourItem, type TourStop } from './tour';
import type { BoardCard, BoardConfig, LayoutMap } from './board';

/** Card types that carry nothing a reader could use on a phone: a scrap is a
 *  drawn mark and a stamp is a decoration on the passport. They stay on the
 *  desktop slate, where they are furniture rather than content. */
const SILENT_CARDS = new Set<BoardCard['type']>(['scrap', 'stamp']);

/** One screen of the mobile app. */
export type MobileChapter = {
  /** The tour stop this screen came from. */
  id: string;
  /** The stop's heading, already localised — "01 · Dónde he trabajado". */
  label: string;
  /** The card the screen is built around. */
  card: BoardCard;
  /** Other cards the stop carries, rendered under the one it is about: the
   *  `now` card under the cover, the music player under the podcast. */
  extras: BoardCard[];
};

/** The pieces a generated route is allowed to walk.
 *
 *  Cards only. The desktop tour also routes through photographs and notes, but
 *  a screen here is a card, so a route that stopped on a photograph would
 *  produce a screen with nothing on it. */
function tourPieces(board: BoardConfig): TourItem[] {
  return board.cards.map((card) => ({
    id: card.id, x: card.x, y: card.y, w: card.w, label: card.id, group: card.group,
  }));
}

/** The cards a stop frames, in the order the camera reveals them.
 *
 *  A desktop stop may frame two or three cards at once — there is room for
 *  them side by side. A phone has room for one, so each becomes a screen of
 *  its own under the same heading, and the walk simply takes a tap or two
 *  more. This is the same trade the tour already makes on a narrow viewport
 *  (`splitStops`), applied to the whole app rather than to the camera. */
function framedCards(ids: string[], cards: Map<string, BoardCard>): BoardCard[] {
  const out: BoardCard[] = [];
  for (const id of ids) {
    const card = cards.get(id);
    if (card && !SILENT_CARDS.has(card.type)) out.push(card);
  }
  return out;
}

/** Turn the board and its route into the screens a phone walks through.
 *
 *  `stops` is optional so a caller that has already built the route (the
 *  desktop board does, for its own camera) can hand it over rather than
 *  paying for it twice. */
export function buildChapters(
  board: BoardConfig,
  tour: TourConfig,
  stops?: TourStop[],
): MobileChapter[] {
  const route = stops ?? buildStops(tour, tourPieces(board));
  const cards = new Map(board.cards.map((card) => [card.id, card]));

  const chapters: MobileChapter[] = [];
  const used = new Set<string>();

  for (const stop of route) {
    const framed = framedCards(stop.items, cards).filter((card) => !used.has(card.id));
    // A stop that frames nothing a reader can read — a drawn mark, a
    // photograph — has no screen of its own.
    if (framed.length === 0) continue;

    const made: MobileChapter[] = framed.map((card, index) => {
      used.add(card.id);
      return {
        id: index === 0 ? stop.id : `${stop.id}-${index + 1}`,
        label: stop.label,
        card,
        extras: [],
      };
    });

    // What the stop merely carries rides with its first screen, the same way
    // the tour hands a split stop's extras to the first slice.
    const lead = made[0];
    for (const id of stop.extras ?? []) {
      const extra = cards.get(id);
      if (!extra || SILENT_CARDS.has(extra.type) || used.has(extra.id)) continue;
      used.add(extra.id);
      lead.extras.push(extra);
    }
    chapters.push(...made);
  }

  // A board with no usable route at all — every stop stale, or a board with
  // nothing but scraps on it — still has to open on something.
  if (chapters.length === 0) {
    for (const card of board.cards) {
      if (SILENT_CARDS.has(card.type)) continue;
      chapters.push({ id: card.id, label: '', card, extras: [] });
    }
  }

  return chapters;
}

/** The board with the owner's live drags folded in.
 *
 *  Positions the owner has moved live are stored in `board.layout`, not in the
 *  board document, and a generated route — columns, rows, reading order — is
 *  built from where the cards actually are. Ignoring the overrides would walk
 *  the board in the order it used to be in. */
export function withLayout(board: BoardConfig, layout: LayoutMap): BoardConfig {
  if (Object.keys(layout).length === 0) return board;
  const place = (card: BoardCard): BoardCard => {
    const override = layout[card.id];
    if (!override) return card;
    return { ...card, x: override.x, y: override.y, w: override.w ?? card.w };
  };
  return { ...board, cards: board.cards.map(place) };
}

/** A stop heading like "01 · Dónde he trabajado" carries its own number, and
 *  the app bar prints the position separately. Split them so the heading is
 *  not saying the same thing twice. */
export function splitLabel(label: string): { number: string; text: string } {
  const match = label.match(/^\s*(\d{1,2})\s*[·.—–-]\s*(.+)$/);
  if (!match) return { number: '', text: label.trim() };
  return { number: match[1], text: match[2].trim() };
}
