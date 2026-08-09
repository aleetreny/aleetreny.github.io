import { isLanguageMap, type Localised } from './i18n';

/** The boundary between a dossier as the database stores it and as the app
 *  holds it.
 *
 *  `content_entries.title` and `.summary` are `text` columns: a bilingual title
 *  cannot live in one. Writing `{ es: '…', en: '…' }` straight into `text`
 *  stringifies it to `[object Object]`, and `save_content_entry` — which reads
 *  `p_entry ->> 'title'` — would store the JSON source instead.
 *
 *  So the languages travel in `metadata`, which is already `jsonb` and already
 *  round-trips untouched through the save function, the version snapshots and
 *  restore. The text column keeps a plain projection: the not-blank constraint,
 *  the trash list and any SQL that reads a title all keep working.
 *
 *  Everything above this boundary sees one shape — prose is `Localised` — and
 *  everything below sees plain text plus a sidecar. */

/** Where the languages live inside `metadata`. */
export const I18N_KEY = 'i18n';

/** The prose fields stored in `text` columns rather than in `jsonb`. */
const SIDECAR_FIELDS = ['title', 'summary'] as const;
type SidecarField = (typeof SIDECAR_FIELDS)[number];

type StoredShape = {
  title: unknown;
  summary: unknown;
  metadata: Record<string, unknown>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The plain text a `text` column gets when the value is a language map: the
 *  first language that actually says something. Callers may name a preferred
 *  language — the primary one — and it wins when it has text of its own. */
function project(value: unknown, prefer?: string): string {
  if (typeof value === 'string') return value;
  if (!isLanguageMap(value)) return '';
  if (prefer && value[prefer]?.trim()) return value[prefer];
  for (const text of Object.values(value)) if (text.trim()) return text;
  return '';
}

function sidecarOf(metadata: unknown): Record<string, unknown> {
  if (!isRecord(metadata)) return {};
  const bag = metadata[I18N_KEY];
  return isRecord(bag) ? bag : {};
}

/** Database row → the shape the app works in: prose carries every language. */
export function hydrateEntry<T extends StoredShape>(row: T): T {
  const sidecar = sidecarOf(row.metadata);
  if (Object.keys(sidecar).length === 0) return row;

  const metadata = { ...row.metadata };
  delete metadata[I18N_KEY];
  const out = { ...row, metadata } as T & Record<SidecarField, Localised>;

  for (const field of SIDECAR_FIELDS) {
    const map = sidecar[field];
    // A sidecar with nothing to say must never blank a column that has text.
    if (!isLanguageMap(map) || !Object.values(map).some((text) => text.trim())) continue;
    out[field] = map;
  }
  return out;
}

/** The app's shape → what the database can hold: a plain projection in the
 *  column and every language beside it. `prefer` is the primary language, so
 *  the column reads in the language the board is authored in. */
export function dehydrateEntry<T extends StoredShape>(entry: T, prefer?: string): T {
  const sidecar: Record<string, unknown> = {};
  const columns: Partial<Record<SidecarField, string>> = {};

  for (const field of SIDECAR_FIELDS) {
    const value = entry[field];
    columns[field] = project(value, prefer);
    if (isLanguageMap(value)) sidecar[field] = value;
  }

  const metadata = { ...entry.metadata };
  // Dropping the last language map removes the sidecar rather than leaving an
  // empty object behind, so turning the feature off leaves clean rows.
  if (Object.keys(sidecar).length > 0) metadata[I18N_KEY] = sidecar;
  else delete metadata[I18N_KEY];

  return { ...entry, ...columns, metadata } as T;
}
