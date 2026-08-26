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
  ink: PassportInk;
  /** The shape of the stamp. Real passports are not consistent either. */
  shape: PassportStampShape;
  /** The owner's own words. Empty until they write them. */
  note?: string;
  city?: string;
  assetUrl?: string;
};

export type PassportStampShape = 'round' | 'rect' | 'oval' | 'shield';

/** The ink catalogue is intentionally a little excessive: a stamp is one of
 * the few places on the board where a colour choice is part of the content,
 * and a five-item select made every passport look alike. */
export const PASSPORT_INKS = [
  { id: 'violet', hex: '#6a4b8a' },
  { id: 'teal', hex: '#2f6f75' },
  { id: 'rust', hex: '#93472a' },
  { id: 'ink', hex: '#2c3a4c' },
  { id: 'green', hex: '#3e6b3c' },
  { id: 'sapphire', hex: '#315c8c' },
  { id: 'blue', hex: '#3f6fa3' },
  { id: 'cyan', hex: '#2b7f8b' },
  { id: 'indigo', hex: '#4f4aa3' },
  { id: 'plum', hex: '#793b70' },
  { id: 'magenta', hex: '#a64478' },
  { id: 'rose', hex: '#a95664' },
  { id: 'coral', hex: '#bc5a4a' },
  { id: 'orange', hex: '#b56a27' },
  { id: 'ochre', hex: '#a88426' },
  { id: 'olive', hex: '#687438' },
  { id: 'forest', hex: '#315e43' },
  { id: 'mint', hex: '#4e8072' },
] as const;

export type PassportInk = (typeof PASSPORT_INKS)[number]['id'];

/** The CSS dimensions of a stamp, used to keep its rotated bounding box on a
 * leaf while it is being dragged. */
export const PASSPORT_STAMP_SIZES: Record<PassportStampShape, { w: number; h: number }> = {
  round: { w: 52, h: 52 },
  oval: { w: 58, h: 44 },
  rect: { w: 62, h: 40 },
  shield: { w: 50, h: 52 },
};

const INKS = PASSPORT_INKS.map(({ id }) => id);
const SHAPES: PassportStampShape[] = ['round', 'rect', 'oval', 'shield'];

const rounded = (value: number) => Math.round(value * 100) / 100;

/** Clamp a stamp's CSS top-left position, expressed as percentages of a leaf,
 * so the complete stamp — including its rotation — remains visible inside. */
export function clampStampPosition(
  shape: PassportStampShape,
  rot: number,
  x: number,
  y: number,
  leafWidth: number,
  leafHeight: number,
): { x: number; y: number } {
  const width = Number.isFinite(leafWidth) && leafWidth > 0 ? leafWidth : 1;
  const height = Number.isFinite(leafHeight) && leafHeight > 0 ? leafHeight : 1;
  const size = PASSPORT_STAMP_SIZES[shape];
  const radians = (Number.isFinite(rot) ? rot : 0) * Math.PI / 180;
  const rotatedWidth = Math.abs(size.w * Math.cos(radians)) + Math.abs(size.h * Math.sin(radians));
  const rotatedHeight = Math.abs(size.w * Math.sin(radians)) + Math.abs(size.h * Math.cos(radians));
  const minX = Math.max(0, (rotatedWidth - size.w) / 2);
  const minY = Math.max(0, (rotatedHeight - size.h) / 2);
  const maxX = Math.max(minX, width - (rotatedWidth + size.w) / 2);
  const maxY = Math.max(minY, height - (rotatedHeight + size.h) / 2);
  const localX = (Number.isFinite(x) ? x : 20) / 100 * width;
  const localY = (Number.isFinite(y) ? y : 20) / 100 * height;
  return {
    x: rounded(Math.min(maxX, Math.max(minX, localX)) / width * 100),
    y: rounded(Math.min(maxY, Math.max(minY, localY)) / height * 100),
  };
}



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
