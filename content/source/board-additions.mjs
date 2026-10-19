// Additive release content. Shared by fixture generation and the opt-in seed
// mode so a live board keeps every owner edit, including edits to these cards.
export const ADDED_CARDS = [
  {
    id: 'telefonica-scholarship', type: 'spotlight', presentation: 'letter',
    x: 2780, y: 1880, w: 220, rot: 2,
    tone: 'paperCream', glyph: 'FT',
    title: { es: 'Fundación Telefónica', en: 'Fundación Telefónica' },
    label: { es: 'Beca de posgrado', en: 'Postgraduate scholarship' },
    blurb: { es: 'Beca concedida para mis estudios de posgrado.', en: 'A scholarship awarded for my postgraduate studies.' },
  },
  {
    id: 'science-map-paper', type: 'spotlight', presentation: 'abstract',
    x: 940, y: 1625, w: 280, rot: 1.5, tone: 'paper',
    title: { es: '¿Cambia el mapa de la ciencia?', en: 'Does the map of science change?' },
    blurb: {
      es: '10 modelos y 500.000 artículos: mapas globales parecidos, vecinos locales distintos.',
      en: '10 models, 500,000 papers: similar global maps, different local neighbours.',
    },
    barCaption: { es: 'Preprint · arXiv · octubre 2026', en: 'Preprint · arXiv · October 2026' },
    footerLink: [{ es: 'Leer el paper →', en: 'Read the paper →' }, 'https://arxiv.org/abs/2610.16639'],
  },
];

const ADDED_STOPS = [
  { after: 'edu', stop: { id: 'stop-telefonica', label: { es: 'Beca Fundación Telefónica', en: 'Fundación Telefónica scholarship' }, items: ['telefonica-scholarship'], reveal: { style: 'flip' }, motion: 'glide', motif: 'ink' } },
  { after: 'repos', stop: { id: 'stop-science-paper', label: { es: 'Mi paper en arXiv', en: 'My paper on arXiv' }, items: ['science-map-paper'], reveal: { style: 'rise' }, motion: 'glide', motif: 'ink' } },
];

export function applyBoardAdditions(documents) {
  const result = structuredClone(documents);
  const board = result.find((row) => row.key === 'board')?.value;
  const tour = result.find((row) => row.key === 'board.tour')?.value;
  if (!Array.isArray(board?.cards) || !Array.isArray(tour?.stops)) {
    throw new Error('Board additions require board.cards and board.tour.stops.');
  }
  for (const card of ADDED_CARDS) {
    if (!board.cards.some((existing) => existing.id === card.id) && !board.dismissed?.includes(card.id)) {
      board.cards.push(structuredClone(card));
    }
  }
  // Automatic routes already include new cards. Keep an owner's route choice.
  if (tour.route === 'custom') {
    for (const { after, stop } of ADDED_STOPS) {
      if (tour.stops.some((existing) => existing.items?.includes(stop.items[0]))) continue;
      if (!board.cards.some((card) => card.id === stop.items[0])) continue;
      const anchor = tour.stops.findIndex((existing) => existing.items?.includes(after));
      tour.stops.splice(anchor < 0 ? tour.stops.length : anchor + 1, 0, structuredClone(stop));
    }
  }
  return result;
}
