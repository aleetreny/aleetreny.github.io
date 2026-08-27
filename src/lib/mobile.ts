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
// Everything below is pure. It takes the parsed board, the localised entries
// and the tour, and returns an ordered list of chapters. No React, no DOM, no
// measurements — so the walk itself is testable.

import { buildStops, type TourConfig, type TourItem, type TourStop } from './tour';
import type { BoardCard, BoardConfig, LayoutMap, Marginal, Polaroid } from './board';

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
  /** Anything else the stop carries that is worth rendering under it: the
   *  `now` card under the cover, the music player under the podcast. */
  extras: BoardCard[];
  /** Instant photos pinned to this stop, in board order. */
  photos: Polaroid[];
  /** One loose note, if the board has one near this stop's card. */
  note: Marginal | null;
};

function centre(card: Pick<BoardCard, 'x' | 'y' | 'w'>): { x: number; y: number } {
  return { x: card.x + card.w / 2, y: card.y };
}

/** The tour reads a flat list of pieces; it does not care what kind each one
 *  is. Cards, photos and notes all go in, so a stop can name any of them. */
function tourPieces(board: BoardConfig): TourItem[] {
  return [
    ...board.cards.map((card) => ({ id: card.id, x: card.x, y: card.y, w: card.w, label: card.id, group: card.group })),
    ...board.polaroids.map((photo) => ({ id: photo.id, x: photo.x, y: photo.y, w: photo.w, label: photo.id })),
    ...board.marginalia.map((note) => ({ id: note.id, x: note.x, y: note.y, w: note.w, label: note.id })),
  ];
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

/** Attach the pieces the route never mentions to the nearest chapter.
 *
 *  A hand-authored route lists the pieces worth stopping at, not every scrap
 *  of paper on the slate. Photos and notes left over would simply vanish from
 *  the phone, which is the one thing this redesign must not do: the board's
 *  asides are half its character. Nearest-card wins, so a note pinned beside
 *  the languages sticker turns up on the languages screen, exactly where a
 *  visitor standing at the slate would read it. */
function nearestChapter<T extends { x: number; y: number; w: number }>(
  piece: T,
  chapters: MobileChapter[],
): MobileChapter | null {
  let best: MobileChapter | null = null;
  let bestDistance = Infinity;
  const from = centre(piece);
  for (const chapter of chapters) {
    const to = centre(chapter.card);
    const distance = Math.hypot(from.x - to.x, from.y - to.y);
    if (distance < bestDistance) { bestDistance = distance; best = chapter; }
  }
  return best;
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
  const photos = new Map(board.polaroids.map((photo) => [photo.id, photo]));
  const notes = new Map(board.marginalia.map((note) => [note.id, note]));

  const chapters: MobileChapter[] = [];
  const usedCards = new Set<string>();
  const usedPhotos = new Set<string>();
  const usedNotes = new Set<string>();

  for (const stop of route) {
    const framed = framedCards(stop.items, cards).filter((card) => !usedCards.has(card.id));
    // A stop that frames nothing but scraps and a photo has no screen of its
    // own; its photo is picked up below by whichever chapter is nearest.
    if (framed.length === 0) continue;

    const made: MobileChapter[] = framed.map((card, index) => {
      usedCards.add(card.id);
      return {
        id: index === 0 ? stop.id : `${stop.id}-${index + 1}`,
        label: stop.label,
        card,
        extras: [],
        photos: [],
        note: null,
      };
    });

    // What the stop merely carries rides with its first screen, the same way
    // the tour hands a split stop's extras to the first slice.
    const lead = made[0];
    for (const id of stop.extras ?? []) {
      const extra = cards.get(id);
      if (extra && !SILENT_CARDS.has(extra.type) && !usedCards.has(extra.id)) {
        usedCards.add(extra.id);
        lead.extras.push(extra);
        continue;
      }
      const photo = photos.get(id);
      if (photo && !usedPhotos.has(id)) { usedPhotos.add(id); lead.photos.push(photo); continue; }
      const note = notes.get(id);
      if (note && !usedNotes.has(id)) { usedNotes.add(id); lead.note ??= note; }
    }
    chapters.push(...made);
  }

  // A board with no usable route at all — every stop stale, or a board with
  // nothing but scraps on it — still has to open on something.
  if (chapters.length === 0) {
    for (const card of board.cards) {
      if (SILENT_CARDS.has(card.type)) continue;
      chapters.push({ id: card.id, label: '', card, extras: [], photos: [], note: null });
    }
  }

  for (const photo of board.polaroids) {
    if (usedPhotos.has(photo.id)) continue;
    nearestChapter(photo, chapters)?.photos.push(photo);
  }
  for (const note of board.marginalia) {
    if (usedNotes.has(note.id)) continue;
    const home = nearestChapter(note, chapters);
    if (home && !home.note) home.note = note;
  }

  return chapters;
}

/** The board with the owner's live drags folded in.
 *
 *  Positions the owner has moved live are stored in `board.layout`, not in the
 *  board document, and the phone reads positions for exactly one purpose:
 *  deciding which screen an unrouted photograph or note belongs to. Ignoring
 *  the overrides would file a note by where it used to be. */
export function withLayout(board: BoardConfig, layout: LayoutMap): BoardConfig {
  if (Object.keys(layout).length === 0) return board;
  const place = <T extends { id: string; x: number; y: number; w: number }>(piece: T): T => {
    const override = layout[piece.id];
    if (!override) return piece;
    return { ...piece, x: override.x, y: override.y, w: override.w ?? piece.w };
  };
  return {
    ...board,
    cards: board.cards.map(place),
    polaroids: board.polaroids.map(place),
    marginalia: board.marginalia.map(place),
  };
}

/** The entries a chapter opens into, so the shell can show a count without
 *  knowing what a drawer is. */
export function chapterGroup(chapter: MobileChapter): string {
  return chapter.card.type === 'drawer' ? chapter.card.group ?? '' : '';
}

/** The dossier a chapter's card opens directly, if it opens one. Spotlights,
 *  stickers and the contact card each stand for a single article. */
export function chapterArticle(chapter: MobileChapter): string {
  return chapter.card.open ?? '';
}

/** A stop heading like "01 · Dónde he trabajado" carries its own number, and
 *  the app bar prints the position separately. Split them so the heading is
 *  not saying the same thing twice. */
export function splitLabel(label: string): { number: string; text: string } {
  const match = label.match(/^\s*(\d{1,2})\s*[·.—–-]\s*(.+)$/);
  if (!match) return { number: '', text: label.trim() };
  return { number: match[1], text: match[2].trim() };
}
