// The passport's stamps, and the pages behind them.
//
// This is content, not furniture, so it is data the owner edits — authored in
// `content/source/board-spec.mjs`, seeded into
// `site_settings['board.passport']` beside the theme and the board, and
// editable from inside the passport itself. What ships is the list of countries
// this passport has actually been through, with the descriptions left empty for
// their owner to write: no generated travel copy, ever.

import siteSettingsFixture from '../../../fixtures/site-settings.json';

export type PassportStamp = {
  id: string;
  /** Two letters, printed in the ring. */
  code: string;
  /** The place, as it should read on the page. */
  place: string;
  year: string;
  /** Which leaf it is on, and where on it. 0–100 of the page, imperfectly. */
  page: number;
  x: number;
  y: number;
  rot: number;
  /** One of the ink colours, so a passport does not read as one rubber stamp. */
  ink: 'violet' | 'teal' | 'rust' | 'ink' | 'green';
  /** The shape of the stamp. Real passports are not consistent either. */
  shape: 'round' | 'rect' | 'oval' | 'shield';
  /** The owner's own words. Empty until they write them. */
  note?: string;
  city?: string;
  assetUrl?: string;
};

const INKS: PassportStamp['ink'][] = ['violet', 'teal', 'rust', 'ink', 'green'];
const SHAPES: PassportStamp['shape'][] = ['round', 'rect', 'oval', 'shield', 'round', 'oval'];



const fixtureStamps = (siteSettingsFixture as Array<{ key: string; value: unknown }>)
  .find((row) => row.key === 'board.passport')?.value;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A stamp normally reaches the parser already localised. When it does not —
 *  the shipped fallback below reads the fixture straight — project it through
 *  the first language it carries rather than dropping the word. */
const str = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value;
  if (isRecord(value)) {
    for (const slot of Object.values(value)) if (typeof slot === 'string' && slot) return slot;
  }
  return fallback;
};
const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);

/** Read a stamps document. Returns exactly what it holds, so an empty document
 *  is an empty passport and not a silent fall back to the shipped one — the
 *  caller decides when to reach for `DEFAULT_STAMPS`. */
export function parseStamps(value: unknown): PassportStamp[] {
  if (!Array.isArray(value)) return [];
  const stamps: PassportStamp[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.code !== 'string') continue;
    stamps.push({
      id: str(raw.id, `stamp-${raw.code.toLowerCase()}-${stamps.length}`),
      code: raw.code.slice(0, 3).toUpperCase(),
      place: str(raw.place),
      year: str(raw.year),
      page: Math.max(1, Math.round(num(raw.page, 1))),
      x: Math.min(88, Math.max(2, num(raw.x, 20))),
      y: Math.min(88, Math.max(2, num(raw.y, 20))),
      rot: Math.min(180, Math.max(-180, num(raw.rot, 0))),
      ink: (INKS as string[]).includes(str(raw.ink)) ? (raw.ink as PassportStamp['ink']) : 'violet',
      shape: (SHAPES as string[]).includes(str(raw.shape)) ? (raw.shape as PassportStamp['shape']) : 'round',
      note: str(raw.note),
      city: str(raw.city),
      assetUrl: str(raw.assetUrl) || undefined,
    });
  }
  return stamps;
}

/** The passport this repository ships. A board with no stamps document of its
 *  own gets this one; anything the owner saves is merged over it by the caller. */
export const DEFAULT_STAMPS: PassportStamp[] = parseStamps(fixtureStamps);

export const PASSPORT_PAGES = Math.max(2, ...DEFAULT_STAMPS.map((stamp) => stamp.page));
