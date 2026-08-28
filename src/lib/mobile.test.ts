import { describe, expect, it } from 'vitest';
import { buildChapters, mobileArticleSlug, splitLabel, withLayout } from './mobile';
import { parseBoard, type BoardCard, type BoardConfig, type Marginal, type Polaroid } from './board';
import { parseTour, type TourConfig } from './tour';

function card(id: string, extra: Partial<BoardCard> = {}): BoardCard {
  return { id, type: 'drawer', x: 0, y: 0, rot: 0, w: 400, ...extra };
}

function photo(id: string, x = 0, y = 0): Polaroid {
  return { id, x, y, rot: 0, w: 260, h: 200, caption: '' };
}

function note(id: string, x = 0, y = 0): Marginal {
  return { id, x, y, rot: 0, w: 200, style: 'amber', text: 'aside' };
}

function board(patch: Partial<BoardConfig> = {}): BoardConfig {
  return {
    size: { width: 4000, height: 2400 },
    groups: [],
    cards: [],
    polaroids: [],
    marginalia: [],
    dismissed: [],
    ...patch,
  };
}

function customTour(stops: TourConfig['stops']): TourConfig {
  return parseTour({ route: 'custom', stops });
}

describe('the walk a phone takes', () => {
  it('makes one screen per stop, led by the stop’s first readable card', () => {
    const chapters = buildChapters(
      board({ cards: [card('hero', { type: 'hero' }), card('work'), card('scrap-a', { type: 'scrap' })] }),
      customTour([
        { id: 'a', label: 'Who I am', items: ['hero'] },
        { id: 'b', label: '01 · Work', items: ['scrap-a', 'work'] },
      ]),
    );
    expect(chapters.map((chapter) => chapter.card.id)).toEqual(['hero', 'work']);
    expect(chapters.map((chapter) => chapter.label)).toEqual(['Who I am', '01 · Work']);
  });

  it('splits a stop that frames two cards into two screens under one heading', () => {
    const chapters = buildChapters(
      board({ cards: [card('work'), card('edu')] }),
      customTour([{ id: 'a', label: '01 · Both', items: ['work', 'edu'] }]),
    );
    expect(chapters.map((chapter) => chapter.card.id)).toEqual(['work', 'edu']);
    expect(chapters.map((chapter) => chapter.label)).toEqual(['01 · Both', '01 · Both']);
    expect(chapters.map((chapter) => chapter.id)).toEqual(['a', 'a-2']);
  });

  it('leaves Spotify players on the desktop slate', () => {
    const chapters = buildChapters(
      board({ cards: [card('pod', { type: 'spotlight' }), card('track', { type: 'spotify' })] }),
      customTour([{ id: 'a', label: 'On the air', items: ['pod'], extras: ['track'] }]),
    );
    expect(chapters).toHaveLength(1);
    expect(chapters[0].extras).toEqual([]);
  });

  it('does not open dossiers for cards that are complete on their own', () => {
    expect(mobileArticleSlug(card('langs', { type: 'sticker', open: 'languages' }))).toBeUndefined();
    expect(mobileArticleSlug(card('contact', { type: 'contact', open: 'contact' }))).toBeUndefined();
    expect(mobileArticleSlug(card('pod', { type: 'spotlight', open: 'podcast' }))).toBe('podcast');
  });

  // The cover is the name and nothing else; "currently" repeats the top of the
  // work drawer two screens later, and stays on the slate.
  it('leaves the currently card on the slate', () => {
    const chapters = buildChapters(
      board({ cards: [card('hero', { type: 'hero' }), card('now', { type: 'now' })] }),
      customTour([
        { id: 'a', label: 'Who I am', items: ['hero'], extras: ['now'] },
        { id: 'b', label: 'Now', items: ['now'] },
      ]),
    );
    expect(chapters.map((chapter) => chapter.card.id)).toEqual(['hero']);
    expect(chapters[0].extras).toEqual([]);
  });

  it('never repeats a card that two stops both name', () => {
    const chapters = buildChapters(
      board({ cards: [card('work'), card('edu')] }),
      customTour([
        { id: 'a', label: 'One', items: ['work'], extras: ['edu'] },
        { id: 'b', label: 'Two', items: ['edu'] },
      ]),
    );
    expect(chapters).toHaveLength(1);
    expect(chapters[0].extras.map((extra) => extra.id)).toEqual(['edu']);
  });

  it('drops a stop that frames nothing but drawn marks', () => {
    const chapters = buildChapters(
      board({ cards: [card('work'), card('scrap-a', { type: 'scrap' })] }),
      customTour([
        { id: 'a', label: 'Work', items: ['work'] },
        { id: 'b', label: 'A mark', items: ['scrap-a'] },
      ]),
    );
    expect(chapters.map((chapter) => chapter.id)).toEqual(['a']);
  });

  // A screen is a card. The board's furniture stays on the desk, whether the
  // route names it or not.
  it('leaves the photographs and notes a stop carries on the slate', () => {
    const chapters = buildChapters(
      board({ cards: [card('work')], polaroids: [photo('p1')], marginalia: [note('n1')] }),
      customTour([{ id: 'a', label: 'Work', items: ['work'], extras: ['p1', 'n1'] }]),
    );
    expect(chapters).toHaveLength(1);
    expect(chapters[0].extras).toEqual([]);
    expect(Object.keys(chapters[0])).toEqual(['id', 'label', 'card', 'extras']);
  });

  it('never routes a generated walk through a photograph', () => {
    const chapters = buildChapters(
      board({ cards: [card('work', { x: 0 })], polaroids: [photo('p1', 900)], marginalia: [note('n1', 1800)] }),
      parseTour({ route: 'reading', groupSize: 1 }),
    );
    expect(chapters.map((chapter) => chapter.card.id)).toEqual(['work']);
  });

  it('still opens on something when the whole route is stale', () => {
    const chapters = buildChapters(
      board({ cards: [card('work'), card('edu')] }),
      customTour([{ id: 'a', label: 'Gone', items: ['deleted-card'] }]),
    );
    expect(chapters.map((chapter) => chapter.card.id)).toEqual(['work', 'edu']);
  });

  it('walks a generated route when the owner has not authored one', () => {
    const chapters = buildChapters(
      board({ cards: [card('b', { x: 900, y: 0 }), card('a', { x: 0, y: 0 })] }),
      parseTour({ route: 'reading', groupSize: 1 }),
    );
    expect(chapters.map((chapter) => chapter.card.id)).toEqual(['a', 'b']);
  });

  it('walks a generated route in the order the cards were last dragged to', () => {
    const shifted = withLayout(
      board({ cards: [card('a', { x: 0, y: 0 }), card('b', { x: 900, y: 0 })] }),
      { a: { x: 1800, y: 0, rot: 0 } },
    );
    const chapters = buildChapters(shifted, parseTour({ route: 'reading', groupSize: 1 }));
    expect(chapters.map((chapter) => chapter.card.id)).toEqual(['b', 'a']);
  });

  it('walks the board this repository ships', () => {
    const shipped = parseBoard(undefined);
    const chapters = buildChapters(shipped, parseTour(undefined));
    expect(chapters.length).toBeGreaterThan(4);
    // Every readable card on the slate reaches a screen, and none twice.
    const seen = chapters.map((chapter) => chapter.card.id);
    expect(new Set(seen).size).toBe(seen.length);
    // And nothing the walk does not draw reaches one.
    const drawn = chapters.flatMap((chapter) => [chapter.card, ...chapter.extras]);
    expect(drawn.every((piece) => !['scrap', 'stamp', 'now', 'spotify'].includes(piece.type))).toBe(true);
  });
});

describe('stop headings', () => {
  it('splits the number the owner wrote away from the words', () => {
    expect(splitLabel('01 · Dónde he trabajado')).toEqual({ number: '01', text: 'Dónde he trabajado' });
    expect(splitLabel('12 — Where to find me')).toEqual({ number: '12', text: 'Where to find me' });
  });

  it('leaves a heading with no number alone', () => {
    expect(splitLabel('Quién soy')).toEqual({ number: '', text: 'Quién soy' });
  });
});
