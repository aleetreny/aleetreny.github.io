// Bilingual content.
//
// The owner writes in their own language and the other version is filled in by
// a translator at authoring time, not at runtime — so a visitor never waits on
// a translation service and a service outage cannot blank the site.
//
// Any text the owner can edit is a `Localised`: either a plain string (which is
// what every document looked like before this existed, and still may) or a map
// of language code to string. `pickText` resolves one; `putText` writes one
// language slot without disturbing the others.

import siteSettingsFixture from '../../fixtures/site-settings.json';

/** A string, or the same string in several languages. */
export type Localised = string | Record<string, string>;

export type LanguageOption = { code: string; label: string };

export const TRANSLATE_PROVIDERS = ['mymemory', 'google', 'function', 'off'] as const;
export type TranslateProvider = (typeof TRANSLATE_PROVIDERS)[number];

export type I18nConfig = {
  /** Off means one language and no switcher — the board behaves as it always did. */
  enabled: boolean;
  /** The language the owner authors in. Everything falls back to it. */
  primary: string;
  /** Every language offered, primary included, in switcher order. */
  languages: LanguageOption[];
  /** Translate a field into the other languages when the owner leaves it. */
  auto: boolean;
  /** Where translations come from. `off` disables the buttons entirely. */
  provider: TranslateProvider;
  /** Remember the visitor's choice instead of guessing every visit. */
  remember: boolean;
  /** Offer the language the browser asks for, when it is one we have. */
  followBrowser: boolean;
};

const BASE_I18N: I18nConfig = {
  enabled: false,
  primary: 'en',
  languages: [{ code: 'en', label: 'English' }, { code: 'es', label: 'Español' }],
  auto: true,
  provider: 'mymemory',
  remember: true,
  followBrowser: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseLanguages(value: unknown, fallback: LanguageOption[]): LanguageOption[] {
  if (!Array.isArray(value)) return fallback;
  const out: LanguageOption[] = [];
  for (const raw of value) {
    if (!isRecord(raw) || typeof raw.code !== 'string' || !raw.code.trim()) continue;
    const code = raw.code.trim();
    if (out.some((item) => item.code === code)) continue;
    out.push({ code, label: typeof raw.label === 'string' && raw.label ? raw.label : code });
  }
  return out.length > 0 ? out : fallback;
}

export function parseI18n(value: unknown, base: I18nConfig = DEFAULT_I18N): I18nConfig {
  if (!isRecord(value)) return base;
  const languages = parseLanguages(value.languages, base.languages);
  const primary = typeof value.primary === 'string' && languages.some((l) => l.code === value.primary)
    ? value.primary
    : languages[0].code;
  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : base.enabled,
    primary,
    languages,
    auto: typeof value.auto === 'boolean' ? value.auto : base.auto,
    provider: (TRANSLATE_PROVIDERS as readonly string[]).includes(value.provider as string)
      ? (value.provider as TranslateProvider)
      : base.provider,
    remember: typeof value.remember === 'boolean' ? value.remember : base.remember,
    followBrowser: typeof value.followBrowser === 'boolean' ? value.followBrowser : base.followBrowser,
  };
}

const fixtureI18n = (siteSettingsFixture as Array<{ key: string; value: unknown }>)
  .find((row) => row.key === 'site.i18n')?.value;

export const DEFAULT_I18N: I18nConfig = parseI18n(fixtureI18n, BASE_I18N);

// ---------------------------------------------------------------- resolving

/** Read one language out of a localised value.
 *
 *  A plain string is the primary language by definition — that is what every
 *  document written before this feature contains. An empty slot falls back to
 *  the primary, then to any language that has something, so a half-translated
 *  board never shows a hole. */
export function pickText(value: unknown, lang: string, primary = lang): string {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return '';
  const wanted = value[lang];
  if (typeof wanted === 'string' && wanted.trim()) return wanted;
  const base = value[primary];
  if (typeof base === 'string' && base.trim()) return base;
  for (const candidate of Object.values(value)) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return '';
}

/** Is this value carrying text for `lang` of its own? */
export function hasText(value: unknown, lang: string, primary = lang): boolean {
  if (typeof value === 'string') return lang === primary && value.trim().length > 0;
  if (!isRecord(value)) return false;
  const slot = value[lang];
  return typeof slot === 'string' && slot.trim().length > 0;
}

/** Write one language slot, keeping every other language intact.
 *
 *  Writing the primary language of a plain string keeps it a plain string while
 *  it is the only language in play, so a single-language board never grows
 *  language maps it does not need. */
export function putText(value: unknown, lang: string, next: string, primary = lang): Localised {
  if (typeof value === 'string' || value === undefined || value === null) {
    if (lang === primary) return next;
    const from = typeof value === 'string' ? value : '';
    return from ? { [primary]: from, [lang]: next } : { [lang]: next };
  }
  if (!isRecord(value)) return next;
  return { ...(value as Record<string, string>), [lang]: next };
}

/** Every language slot that carries something, for the translator to read. */
export function textEntries(value: unknown): Array<[string, string]> {
  if (typeof value === 'string') return [];
  if (!isRecord(value)) return [];
  return Object.entries(value).filter((pair): pair is [string, string] => typeof pair[1] === 'string');
}

// ---------------------------------------------------------------- documents

/** Walk any JSON document, resolving every localised value it contains.
 *
 *  Rendering code stays monolingual: DeskBoard resolves the board and the open
 *  entry once per language change and everything below sees plain strings. */
export function localise<T>(document: T, lang: string, primary: string): T {
  return walk(document, lang, primary) as T;
}

/** A language map is an object whose every value is a string and whose every
 *  key looks like a language code. That is narrow enough that ordinary content
 *  objects — `{ url, alt, caption }` — are never mistaken for one. */
export function isLanguageMap(value: unknown): value is Record<string, string> {
  if (!isRecord(value)) return false;
  const keys = Object.keys(value);
  if (keys.length === 0) return false;
  return keys.every((key) => /^[a-z]{2}(-[a-zA-Z0-9]{2,8})?$/.test(key) && typeof value[key] === 'string');
}

function walk(value: unknown, lang: string, primary: string): unknown {
  if (Array.isArray(value)) return value.map((item) => walk(item, lang, primary));
  if (!isRecord(value)) return value;
  if (isLanguageMap(value)) return pickText(value, lang, primary);
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) out[key] = walk(item, lang, primary);
  return out;
}

export type Path = Array<string | number>;

/** Read whatever sits at a path, localised or not. */
export function readAt(document: unknown, path: Path): unknown {
  let cursor: unknown = document;
  for (const step of path) {
    if (cursor === null || cursor === undefined) return undefined;
    cursor = (cursor as Record<string | number, unknown>)[step];
  }
  return cursor;
}

/** Write one language slot at a path, leaving every other language and every
 *  sibling field alone. The leaf goes through `putText`, so a plain string
 *  becomes a language map only when it has to. */
export function writeAt<T>(document: T, path: Path, lang: string, text: string, primary: string): T {
  if (path.length === 0) return putText(document, lang, text, primary) as unknown as T;
  const [head, ...rest] = path;
  if (Array.isArray(document)) {
    const copy = [...(document as unknown[])];
    copy[head as number] = writeAt(copy[head as number], rest, lang, text, primary);
    return copy as unknown as T;
  }
  const source = (document ?? {}) as Record<string, unknown>;
  return { ...source, [head]: writeAt(source[head as string], rest, lang, text, primary) } as T;
}

/** Replace whatever sits at a path, wholesale. */
export function setAt<T>(document: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  if (Array.isArray(document)) {
    const copy = [...(document as unknown[])];
    copy[head as number] = setAt(copy[head as number], rest, value);
    return copy as unknown as T;
  }
  const source = (document ?? {}) as Record<string, unknown>;
  return { ...source, [head]: setAt(source[head as string], rest, value) } as T;
}

/** Fold an edit made against the localised view back into the raw document.
 *
 *  `edited` carries the structure — new blocks, reorders, deletions — while
 *  `raw` carries the languages. Every prose slot is restored from `raw`, so the
 *  flattening that produced the view is undone; the one being edited is then
 *  written into the active language.
 *
 *  A slot only counts as edited when its text differs from what the reader was
 *  shown, so simply opening a half-translated dossier never stamps the fallback
 *  text into the empty language. */
export function mergeEdit<T>(raw: unknown, edited: T, slots: Path[], lang: string, primary: string): T {
  let out = edited;
  for (const path of slots) {
    const editedText = readAt(edited, path);
    if (typeof editedText !== 'string') continue;
    const rawValue = readAt(raw, path);
    if (rawValue === undefined) continue; // a slot `edited` grew on its own
    out = setAt(
      out,
      path,
      editedText === pickText(rawValue, lang, primary)
        ? rawValue
        : putText(rawValue, lang, editedText, primary),
    );
  }
  return out;
}

// ---------------------------------------------------------------- what is prose
//
// Only these carry prose. Everything else in a board document is structure —
// ids, tones, layouts, group keys — and translating it would break the board.
// An allowlist is the only safe way to tell the two apart.

const CARD_TEXT = [
  'kicker', 'title', 'subtitle', 'intro', 'name', 'hint', 'blurb', 'note',
  'label', 'nextLabel', 'currentTitle', 'currentSub', 'nextTitle', 'nextSub',
  'barCaption',
] as const;

const BLOCK_TEXT = ['text', 'caption', 'alt', 'cite', 'label', 'title'] as const;
/** Block props that are plain arrays of prose. */
const BLOCK_TEXT_LIST = ['items'] as const;

const ENTRY_META_TEXT = ['kicker', 'when', 'where'] as const;

function pushIfText(out: Path[], document: unknown, path: Path): void {
  const value = readAt(document, path);
  if (typeof value === 'string' && value.trim()) { out.push(path); return; }
  if (isRecord(value) && isLanguageMap(value)) out.push(path);
}

/** Every prose slot in the board document. */
export function boardTextSlots(board: unknown): Path[] {
  const out: Path[] = [];
  if (!isRecord(board)) return out;
  const groups = Array.isArray(board.groups) ? board.groups : [];
  groups.forEach((_, i) => pushIfText(out, board, ['groups', i, 'label']));
  const cards = Array.isArray(board.cards) ? board.cards : [];
  cards.forEach((_, i) => { for (const key of CARD_TEXT) pushIfText(out, board, ['cards', i, key]); });
  const polaroids = Array.isArray(board.polaroids) ? board.polaroids : [];
  polaroids.forEach((_, i) => { for (const key of ['caption', 'placeholder']) pushIfText(out, board, ['polaroids', i, key]); });
  const notes = Array.isArray(board.marginalia) ? board.marginalia : [];
  notes.forEach((_, i) => pushIfText(out, board, ['marginalia', i, 'text']));
  return out;
}

/** Every prose slot in one dossier, title and body included. */
export function entryTextSlots(entry: unknown): Path[] {
  const out: Path[] = [];
  if (!isRecord(entry)) return out;
  pushIfText(out, entry, ['title']);
  pushIfText(out, entry, ['summary']);
  for (const key of ENTRY_META_TEXT) pushIfText(out, entry, ['metadata', key]);
  const blocks = Array.isArray(entry.blocks) ? entry.blocks : [];
  blocks.forEach((block, i) => {
    if (!isRecord(block)) return;
    for (const key of BLOCK_TEXT) pushIfText(out, entry, ['blocks', i, 'props', key]);
    for (const key of BLOCK_TEXT_LIST) {
      const list = readAt(entry, ['blocks', i, 'props', key]);
      if (!Array.isArray(list)) continue;
      list.forEach((_, j) => pushIfText(out, entry, ['blocks', i, 'props', key, j]));
    }
  });
  return out;
}

export type TranslateJob = { path: Path; text: string; from: string };

/** `fill` only writes languages that have nothing — the safe default, and what
 *  a background pass must always do.
 *  `refresh` also rewrites languages that already carry a translation, which is
 *  the only way an edit to the source language ever reaches the other one. */
export type TranslateScope = 'fill' | 'refresh';

/** The slots `to` still needs, each with the language to translate it from.
 *
 *  Direction is decided per slot rather than fixed: the primary language wins
 *  when it has the text, and otherwise whichever language does. That is what
 *  lets a board authored in one language be seeded into the other, in either
 *  direction, without a second button. */
export function missingAt(
  document: unknown,
  slots: Path[],
  languages: string[],
  to: string,
  primary: string,
  scope: TranslateScope = 'fill',
): TranslateJob[] {
  const order = [primary, ...languages.filter((code) => code !== primary && code !== to)];
  const out: TranslateJob[] = [];
  for (const path of slots) {
    const value = readAt(document, path);
    if (scope === 'fill' && hasText(value, to, primary)) continue;
    const from = order.find((code) => hasText(value, code, primary));
    if (!from) continue;
    // A plain string is the primary language by definition, so refreshing it
    // into itself would only overwrite the source with a round trip.
    if (from === to) continue;
    const text = pickText(value, from, from);
    if (!text.trim()) continue;
    out.push({ path, text, from });
  }
  return out;
}

// ---------------------------------------------------------------- the visitor

const LANG_KEY = 'board.lang';

/** Which language to open in: the visitor's remembered choice, then what their
 *  browser asks for, then the primary. */
export function initialLanguage(config: I18nConfig): string {
  if (!config.enabled) return config.primary;
  const codes = config.languages.map((l) => l.code);
  if (config.remember) {
    try {
      const stored = window.localStorage.getItem(LANG_KEY);
      if (stored && codes.includes(stored)) return stored;
    } catch { /* a blocked storage jar just means we guess again */ }
  }
  if (config.followBrowser && typeof navigator !== 'undefined') {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const short = String(tag).slice(0, 2).toLowerCase();
      const hit = codes.find((code) => code.slice(0, 2).toLowerCase() === short);
      if (hit) return hit;
    }
  }
  return config.primary;
}

export function rememberLanguage(config: I18nConfig, lang: string): void {
  if (!config.remember) return;
  try {
    window.localStorage.setItem(LANG_KEY, lang);
  } catch { /* not worth failing an edit over */ }
}
