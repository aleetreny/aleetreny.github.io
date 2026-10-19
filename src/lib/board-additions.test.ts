import { describe, expect, it } from 'vitest';
import { localise } from './i18n';
import { entriesForGroup, parseBoard } from './board';
import { buildChapters } from './mobile';
import { parseTour, splitStops } from './tour';
import { demoEntries, demoSettings } from '../content/demo';
import type { PortfolioEntry } from '../types/content';

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
    expect(merged[0].value.groups[0]).toEqual(original[0].value.groups![0]);
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
    expect(merged[0].value.cards.map((card: { id: string }) => card.id)).toEqual(['kareema-scholarship', 'research']);
    expect(merged[1].value).toEqual(documents[1].value);
  });

  it.each(['es', 'en'])('keeps spatial research order and both letters in one %s desktop/mobile stop', (lang) => {
    const settings = localise(demoSettings, lang, 'es');
    const board = parseBoard(settings.board);
    const tour = parseTour(settings['board.tour']);
    const chapters = buildChapters(board, tour);
    const ids = chapters.map((chapter) => chapter.card.id);
    expect(ids.indexOf('research')).toBe(ids.indexOf('random') + 1);
    expect(ids.indexOf('kareema-scholarship')).toBe(ids.indexOf('pod') + 1);
    const pair = chapters.find((chapter) => chapter.card.id === 'kareema-scholarship');
    expect(pair?.extras.map((card) => card.id)).toEqual(['telefonica-scholarship']);
    expect(ids).not.toContain('telefonica-scholarship');
    expect(ids).not.toContain('science-map-paper');
    const desktopPair = tour.stops.find((stop) => stop.id === 'stop-scholarships');
    expect(desktopPair?.items).toEqual(['kareema-scholarship', 'telefonica-scholarship']);
    expect(splitStops([desktopPair!], 1)).toEqual([desktopPair]);
    expect(board.cards.find((card) => card.id === 'telefonica-scholarship')?.label)
      .toBe(lang === 'es' ? 'Beca de posgrado' : 'Postgraduate scholarship');
    const catalogue = localise(demoEntries, lang, 'es') as PortfolioEntry[];
    const entries = entriesForGroup(catalogue, 'research');
    expect(entries).toHaveLength(4);
    expect(entries.map((entry) => entry.slug)).toEqual(['investigacion-articulo', 'mapping-science', 'investigacion-ade', 'investigacion-economia']);
    expect(catalogue.filter((entry) => entry.slug === 'mapping-science')).toHaveLength(1);
    expect(catalogue.some((entry) => entry.slug === 'investigacion-tfm')).toBe(false);
    expect(entries[1].id).toBe('4339eddf-208b-5edf-a06d-700019dc03c8');
    const urls = entries.flatMap((entry) => entry.blocks.filter((block) => block.type === 'links').flatMap((block) => block.props.items as string[][]).map((pair) => pair[1]));
    for (const file of ['TFG-Economia.pdf', 'TFG-ADE.pdf', 'TFM-UC3M.pdf']) {
      expect(urls).toContain(`https://aleetreny.github.io/trabajos-academicos/${file}`);
    }
    expect(urls).toContain('https://arxiv.org/abs/2610.16639');
    expect(urls).toContain('article:mapping-science');
    expect(urls).toContain('article:investigacion-articulo');
    for (const entry of entries) {
      expect(typeof entry.title).toBe('string');
      expect(entry.blocks.filter((block) => block.type === 'text').length).toBeLessThanOrEqual(3);
    }
    const kareema = board.cards.find((card) => card.id === 'kareema-scholarship');
    expect(`${kareema?.blurb} ${kareema?.note}`).toContain(lang === 'es' ? 'Muy agradecido' : 'MSc Data Science');
    if (lang === 'es') expect(`${kareema?.blurb} ${kareema?.note}`).not.toMatch(/Máster|University College London/);
    expect(board.cards.find((card) => card.id === 'telefonica-scholarship')?.barCaption).toBe('€80,000');
  });

  it('upgrades scholarship copy on an already released live board without changing its layout', () => {
    const input = [
      { key: 'board', value: { cards: [{ id: 'research' }, { id: 'telefonica-scholarship', x: 123 }, { id: 'kareema-scholarship', blurb: { es: 'Máster en Ciencia de Datos y Aprendizaje Automático.', en: 'MSc Data Science & Machine Learning.' }, note: 'University College London · 2026' }] } },
      { key: 'board.tour', value: { stops: [{ id: 'owner-stop' }] } },
    ];
    const output = applyBoardAdditions(input);
    expect(output[0].value.cards[1]).toEqual({ id: 'telefonica-scholarship', x: 123, barCaption: '€80,000' });
    expect(output[0].value.cards[2].blurb.es).toBe('Muy agradecido por este apoyo.');
    expect(output[0].value.cards[2].note).toEqual({ es: '2026', en: 'University College London · 2026' });
    expect(output[1]).toEqual(input[1]);
    expect(applyBoardAdditions(output)).toEqual(output);
  });

  it('replaces only the old paper and loose letter while making room for the folder', () => {
    const input = [
      { key: 'board', value: { size: { width: 4120, height: 2500 }, cards: [{ id: 'science-map-paper' }, { id: 'owner-card' }], groups: [] } },
      { key: 'board.tour', value: { route: 'custom', stops: [{ id: 'stop-telefonica', items: ['telefonica-scholarship'] }, { id: 'stop-science-paper', items: ['science-map-paper'] }, { id: 'owner-stop', items: ['owner-card'] }] } },
      { key: 'board.layout', value: { 'science-map-paper': { x: 940 }, 'owner-card': { x: 42 } } },
      { key: 'board.objects', value: [{ id: 'scholarship', visible: true }, { id: 'passport', x: 1324, y: 2244 }, { id: 'blackhole', x: 2324, y: 1090 }] },
    ];
    const output = applyBoardAdditions(input);
    expect(output[0].value.cards.some((card: { id: string }) => card.id === 'science-map-paper')).toBe(false);
    expect(output[0].value.cards.some((card: { id: string }) => card.id === 'owner-card')).toBe(true);
    expect(output[2].value).toEqual({ 'owner-card': { x: 42 } });
    expect(output[3].value[0].visible).toBe(false);
    expect(output[3].value[1]).toMatchObject({ x: 2680, y: 2250 });
    expect(output[3].value[2]).toEqual({ id: 'blackhole', x: 2324, y: 1090 });
    expect(output[0].value.size.height).toBe(2680);
    expect(applyBoardAdditions(output)).toEqual(output);
  });
});
