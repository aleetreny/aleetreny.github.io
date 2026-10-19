// Additive release content. Shared by fixture generation and the opt-in seed
// mode so a live board keeps every owner edit, including edits to these cards.
import { RESEARCH_GROUP } from './research-work.mjs';

export const ADDED_CARDS = [
  {
    id: 'telefonica-scholarship', type: 'spotlight', presentation: 'letter',
    x: 2780, y: 1964, w: 220, rot: 2,
    tone: 'paperCream', glyph: 'FT',
    title: { es: 'Fundación Telefónica', en: 'Fundación Telefónica' },
    label: { es: 'Beca de posgrado', en: 'Postgraduate scholarship' },
    blurb: { es: 'Beca concedida para mis estudios de posgrado.', en: 'A scholarship awarded for my postgraduate studies.' },
    barCaption: '€80,000',
  },
  {
    id: 'kareema-scholarship', type: 'spotlight', presentation: 'letter',
    x: 2524, y: 1964, w: 220, rot: -2.5, tone: 'paperCream', glyph: 'K',
    title: { es: 'Fundación Kareema', en: 'Fundación Kareema' },
    label: { es: 'Beca a la Excelencia', en: 'Excellence Scholarship' },
    blurb: { es: 'Muy agradecido por este apoyo.', en: 'MSc Data Science & Machine Learning.' },
    barCaption: '€45,000', note: { es: '2026', en: 'University College London · 2026' },
  },
  {
    id: 'research', type: 'drawer', presentation: 'research', group: RESEARCH_GROUP.id,
    kicker: '11',
    x: 1080, y: 2190, w: 470, rot: -1.2, tone: 'paperCream', layout: 'list', maxItems: 4,
    title: { es: 'Trabajos de investigación', en: 'Research work' },
    subtitle: {
      es: 'Dos TFG, un TFM y un paper.',
      en: 'Two undergraduate theses, a master’s thesis and a paper.',
    },
  },
];

const ADDED_STOPS = [
  { after: 'random', stop: { id: 'stop-research', label: { es: '11 · De los TFG al paper', en: '11 · From undergraduate theses to a paper' }, items: ['research'], reveal: { style: 'rise' }, motion: 'glide', motif: 'ink' } },
  { after: 'pod', stop: { id: 'stop-scholarships', label: { es: 'Kareema y Fundación Telefónica', en: 'Kareema and Fundación Telefónica' }, items: ['kareema-scholarship', 'telefonica-scholarship'], keepTogether: true, reveal: { style: 'flip' }, motion: 'glide', motif: 'ink' } },
];

export function applyBoardAdditions(documents) {
  const result = structuredClone(documents);
  const board = result.find((row) => row.key === 'board')?.value;
  const tour = result.find((row) => row.key === 'board.tour')?.value;
  if (!Array.isArray(board?.cards) || !Array.isArray(tour?.stops)) {
    throw new Error('Board additions require board.cards and board.tour.stops.');
  }
  const released = board.cards.some((card) => card.id === 'research') || board.dismissed?.includes('research');
  if (released) return applyReleaseCopy(result);
  board.cards = board.cards.filter((card) => card.id !== 'science-map-paper');
  if (!board.groups) board.groups = [];
  if (!board.groups.some((group) => group.id === RESEARCH_GROUP.id)) board.groups.push(structuredClone(RESEARCH_GROUP));
  board.size = { ...board.size, height: Math.max(board.size?.height ?? 2500, 2680) };
  for (const card of ADDED_CARDS) {
    if (!board.cards.some((existing) => existing.id === card.id) && !board.dismissed?.includes(card.id)) {
      board.cards.push(structuredClone(card));
    }
  }
  const telefonica = board.cards.find((card) => card.id === 'telefonica-scholarship');
  if (telefonica && telefonica.x === 2780 && telefonica.y === 1880) telefonica.y = 1964;
  const layout = result.find((row) => row.key === 'board.layout')?.value;
  if (layout) delete layout['science-map-paper'];
  const objects = result.find((row) => row.key === 'board.objects')?.value;
  if (Array.isArray(objects)) {
    const letter = objects.find((object) => object.id === 'scholarship');
    if (letter) letter.visible = false; // Replaced once by the tourable card.
    const passport = objects.find((object) => object.id === 'passport');
    if (passport?.x === 1324 && passport.y === 2244) { passport.x = 2680; passport.y = 2250; }
  }
  // Automatic routes already include new cards. Keep an owner's route choice.
  if (tour.route === 'custom') {
    tour.stops = tour.stops.filter((stop) => !['stop-telefonica', 'stop-science-paper'].includes(stop.id));
    for (const { after, stop } of ADDED_STOPS) {
      if (tour.stops.some((existing) => existing.items?.includes(stop.items[0]))) continue;
      if (!board.cards.some((card) => card.id === stop.items[0])) continue;
      const anchor = tour.stops.findIndex((existing) => existing.items?.includes(after));
      tour.stops.splice(anchor < 0 ? tour.stops.length : anchor + 1, 0, structuredClone(stop));
    }
  }
  return applyReleaseCopy(result);
}

/** Upgrade only the copy from the previous release, retaining later owner edits. */
function applyReleaseCopy(documents) {
  const cards = documents.find((row) => row.key === 'board')?.value?.cards ?? [];
  const telefonica = cards.find((card) => card.id === 'telefonica-scholarship');
  if (telefonica && !telefonica.barCaption) telefonica.barCaption = '€80,000';
  const kareema = cards.find((card) => card.id === 'kareema-scholarship');
  if (kareema?.blurb?.es === 'Máster en Ciencia de Datos y Aprendizaje Automático.') {
    kareema.blurb.es = 'Muy agradecido por este apoyo.';
  }
  if (kareema?.note === 'University College London · 2026') {
    kareema.note = { es: '2026', en: kareema.note };
  }
  const research = cards.find((card) => card.id === 'research');
  if (research) {
    if (!research.kicker) research.kicker = '11';
    for (const [lang, sentence] of Object.entries({ es: 'Dos TFG, un TFM y un paper.', en: 'Two undergraduate theses, a master’s thesis and a paper.' })) {
      if (research.subtitle?.[lang]?.startsWith(sentence)) research.subtitle[lang] = sentence;
    }
  }
  for (const [id, oldNumber, newNumber] of [['pod', '11', '12'], ['contact', '12', '13']]) {
    const card = cards.find((item) => item.id === id);
    if (card?.kicker && typeof card.kicker === 'object') {
      for (const lang of Object.keys(card.kicker)) card.kicker[lang] = card.kicker[lang].replace(`${oldNumber} —`, `${newNumber} —`);
    }
    const stops = documents.find((row) => row.key === 'board.tour')?.value?.stops ?? [];
    for (const stop of stops.filter((item) => item.items?.includes(id))) {
      if (stop.label && typeof stop.label === 'object') {
        for (const lang of Object.keys(stop.label)) stop.label[lang] = stop.label[lang].replace(`${oldNumber} ·`, `${newNumber} ·`);
      }
    }
  }
  const researchStop = documents.find((row) => row.key === 'board.tour')?.value?.stops?.find((stop) => stop.id === 'stop-research');
  if (researchStop?.label && typeof researchStop.label === 'object') {
    for (const lang of Object.keys(researchStop.label)) {
      if (!/^\d/.test(researchStop.label[lang])) researchStop.label[lang] = `11 · ${researchStop.label[lang]}`;
    }
  }
  return documents;
}
