import { describe, expect, it } from 'vitest';
import { buildChapters, splitLabel } from './mobile';
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

  it('carries the stop’s other cards under the one it is about', () => {
    const chapters = buildChapters(
      board({ cards: [card('hero', { type: 'hero' }), card('now', { type: 'now' })] }),
      customTour([{ id: 'a', label: 'Who I am', items: ['hero'], extras: ['now'] }]),
    );
    expect(chapters).toHaveLength(1);
    expect(chapters[0].extras.map((extra) => extra.id)).toEqual(['now']);
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

  it('keeps the photographs and notes a stop carries', () => {
    const chapters = buildChapters(
      board({ cards: [card('work')], polaroids: [photo('p1')], marginalia: [note('n1')] }),
      customTour([{ id: 'a', label: 'Work', items: ['work'], extras: ['p1', 'n1'] }]),
    );
    expect(chapters[0].photos.map((item) => item.id)).toEqual(['p1']);
    expect(chapters[0].note?.id).toBe('n1');
  });

  it('files a photograph the route never mentions with the nearest card', () => {
    const chapters = buildChapters(
      board({
        cards: [card('work', { x: 0, y: 0 }), card('edu', { x: 3000, y: 0 })],
        polaroids: [photo('near-edu', 3100, 40)],
      }),
      customTour([
        { id: 'a', label: 'Work', items: ['work'] },
        { id: 'b', label: 'Study', items: ['edu'] },
      ]),
    );
    expect(chapters[0].photos).toHaveLength(0);
    expect(chapters[1].photos.map((item) => item.id)).toEqual(['near-edu']);
  });

  it('gives a screen at most one loose note', () => {
    const chapters = buildChapters(
      board({ cards: [card('work')], marginalia: [note('n1', 10, 10), note('n2', 20, 20)] }),
      customTour([{ id: 'a', label: 'Work', items: ['work'] }]),
    );
    expect(chapters[0].note?.id).toBe('n1');
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

  it('walks the board this repository ships', () => {
    const shipped = parseBoard(undefined);
    const chapters = buildChapters(shipped, parseTour(undefined));
    expect(chapters.length).toBeGreaterThan(4);
    // Every readable card on the slate reaches a screen, and none twice.
    const seen = chapters.map((chapter) => chapter.card.id);
    expect(new Set(seen).size).toBe(seen.length);
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
