import { describe, expect, it } from 'vitest';
import { localise } from './i18n';
import { parseBoard } from './board';
import { buildChapters } from './mobile';
import { parseTour } from './tour';
import { demoSettings } from '../content/demo';

// Release content is deliberately shared with the plain Node seed scripts.
const source = '../../content/source/board-additions.mjs';
const { applyBoardAdditions } = await import(source);

describe('additive board release', () => {
  it('keeps live owner content, positions, groups and tour choices intact on repeated seeds', () => {
    const documents = [
      { key: 'board', value: { cards: [{ id: 'owner-card', title: 'Owner edit', x: 17 }], groups: [{ id: 'owner-list' }], polaroids: [{ id: 'photo' }], dismissed: [] } },
      { key: 'board.tour', value: { route: 'custom', speed: 1.7, stops: [{ id: 'owner-stop', items: ['owner-card'], label: 'Custom stop' }] } },
      { key: 'theme', value: { ownerColor: '#123456' } },
    ];
    const original = structuredClone(documents);
    const merged = applyBoardAdditions(documents);
    expect(documents).toEqual(original);
    expect(merged[0].value.cards[0]).toEqual(original[0].value.cards![0]);
    expect(merged[0].value.groups).toEqual(original[0].value.groups);
    expect(merged[0].value.polaroids).toEqual(original[0].value.polaroids);
    expect(merged[1].value.stops[0]).toEqual(original[1].value.stops![0]);
    expect(merged[1].value.speed).toBe(1.7);
    expect(merged[2]).toEqual(original[2]);
    merged[0].value.cards.find((card: { id: string }) => card.id === 'telefonica-scholarship').title = 'Later owner edit';
    expect(applyBoardAdditions(merged)).toEqual(merged);
  });

  it('respects removed cards and automatic routes', () => {
    const documents = [
      { key: 'board', value: { cards: [], dismissed: ['telefonica-scholarship'] } },
      { key: 'board.tour', value: { route: 'columns', stops: [] } },
    ];
    const merged = applyBoardAdditions(documents);
    expect(merged[0].value.cards.map((card: { id: string }) => card.id)).toEqual(['science-map-paper']);
    expect(merged[1].value).toEqual(documents[1].value);
  });

  it.each(['es', 'en'])('includes the scholarship and paper in the %s desktop/mobile route', (lang) => {
    const settings = localise(demoSettings, lang, 'es');
    const board = parseBoard(settings.board);
    const tour = parseTour(settings['board.tour']);
    const chapters = buildChapters(board, tour);
    const ids = chapters.map((chapter) => chapter.card.id);
    expect(ids.indexOf('telefonica-scholarship')).toBe(ids.indexOf('edu') + 1);
    expect(ids.indexOf('science-map-paper')).toBe(ids.indexOf('repos') + 1);
    expect(board.cards.find((card) => card.id === 'telefonica-scholarship')?.label)
      .toBe(lang === 'es' ? 'Beca de posgrado' : 'Postgraduate scholarship');
    const paper = board.cards.find((card) => card.id === 'science-map-paper');
    expect(paper?.footerLink).toEqual([lang === 'es' ? 'Leer el paper →' : 'Read the paper →', 'https://arxiv.org/abs/2610.16639']);
  });
});
