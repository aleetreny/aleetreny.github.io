// Build the seed fixtures (public content + site settings) from the canonical
// board sources. Run with `pnpm content:build`. The generated JSON is what the
// offline safe copy renders and what `pnpm db:seed` loads into Neon.
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ITEMS, ORDER } from '../../content/source/desk-data.mjs';
import {
  BOARD, THEME, GROUPS, GROUP_LABELS, GROUP_LABELS_ES, GROUP_ENTRY_TYPE, ENTRY_TYPE_OVERRIDE, TRAVEL_CODES,
  CARDS, POLAROIDS, MARGINALIA, TOUR, I18N,
} from '../../content/source/board-spec.mjs';

const NAMESPACE = '2b6f0cc9-04a1-4b7e-9d2a-7a1d3e5f8c00';

function uuidv5(name) {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(ns).update(name, 'utf8').digest();
  const bytes = hash.subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Map each item to its group + order.
const groupOf = {};
const orderOf = {};
for (const [group, keys] of Object.entries(GROUPS)) {
  keys.forEach((key, index) => { groupOf[key] = group; orderOf[key] = index; });
}

const PUBLISHED_AT = '2026-08-05T00:00:00.000Z';

const entries = ORDER.map((slug) => {
  const item = ITEMS[slug];
  if (!item) throw new Error(`ORDER references missing item: ${slug}`);
  const group = groupOf[slug] ?? 'random';
  const entryType = ENTRY_TYPE_OVERRIDE[slug] ?? GROUP_ENTRY_TYPE[group] ?? 'note';

  const metadata = {
    kicker: item.kicker ?? '',
    when: item.when ?? '',
    where: item.where ?? '',
    group,
    order: orderOf[slug] ?? 0,
  };
  if (TRAVEL_CODES[slug]) metadata.code = TRAVEL_CODES[slug];

  // The dossier body is a plain ordered list of blocks — the same palette the
  // owner edits with. Existing rich fields become their block equivalents.
  const blocks = [];
  const push = (type, props) => {
    blocks.push({ id: uuidv5(`${slug}#${type}#${blocks.length}`), type, position: blocks.length, props, layout: {} });
  };
  const photos = typeof item.photos === 'number' ? item.photos : 0;
  for (let i = 0; i < photos; i += 1) {
    push('image', { url: '', alt: item.where ?? '', caption: (item.where ?? '') + (photos > 1 ? ` · ${i + 1}` : '') });
  }
  if (Array.isArray(item.stats) && item.stats.length) push('metrics', { items: item.stats });
  for (const bullet of item.bullets ?? []) push('text', { text: bullet });
  if (Array.isArray(item.tags) && item.tags.length) push('tags', { items: item.tags });
  if (Array.isArray(item.links) && item.links.length) push('links', { items: item.links });

  return {
    id: uuidv5(slug),
    version: 1,
    slug,
    title: item.title,
    summary: item.lede ?? '',
    entryType,
    status: 'published',
    publishedAt: PUBLISHED_AT,
    metadata,
    blocks,
  };
});

const groups = Object.keys(GROUPS).map((id) => ({
  id,
  label: I18N.enabled && GROUP_LABELS_ES[id]
    ? { en: GROUP_LABELS[id] ?? id, es: GROUP_LABELS_ES[id] }
    : GROUP_LABELS[id] ?? id,
}));

// ---------------------------------------------------------------- languages
//
// The authored content in content/source is written in one language. When the
// board ships bilingual, every prose field is tagged with the language it was
// actually written in, so the owner writing the other language adds to it
// instead of overwriting it. Untagged text would be read as the primary
// language and the original would be lost on the first edit.
//
// The field lists mirror the allowlists in src/lib/i18n.ts. They are duplicated
// because this is a plain script that cannot import TypeScript; if you add a
// prose field to a card or a block, add it in both places.
const CARD_TEXT = [
  'kicker', 'title', 'subtitle', 'intro', 'name', 'hint', 'blurb', 'note',
  'label', 'nextLabel', 'currentTitle', 'currentSub', 'nextTitle', 'nextSub', 'barCaption',
];
const BLOCK_TEXT = ['text', 'caption', 'alt', 'cite', 'label', 'title'];

/** The language a plain string in content/source is written in. A field may
 *  instead be written as `{ es: '…', en: '…' }` when the owner has authored both
 *  by hand — that is the case for anything they would rather not hand to a
 *  machine translator, and it travels through untouched. */
const AUTHORED_IN = 'en';
const isLangMap = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const tag = (value) => (typeof value === 'string' && value.trim() ? { [AUTHORED_IN]: value } : value);

/** The single string a text column — or a board built for one language — needs.
 *  A map is projected through the authoring language, falling back to whichever
 *  language it does carry so a field written only in Spanish is never blank. */
const plain = (value) => (isLangMap(value) ? value[AUTHORED_IN] ?? Object.values(value)[0] ?? '' : value ?? '');

function tagFields(item, fields) {
  const out = { ...item };
  for (const field of fields) if (field in out) out[field] = tag(out[field]);
  return out;
}

function tagBoard(board) {
  return {
    ...board,
    groups: board.groups.map((group) => ({ ...group, label: tag(group.label) })),
    cards: board.cards.map((card) => tagFields(card, CARD_TEXT)),
    polaroids: board.polaroids.map((p) => tagFields(p, ['caption', 'placeholder'])),
    marginalia: board.marginalia.map((n) => tagFields(n, ['text'])),
  };
}

/** `content_entries.title` and `.summary` are text columns, so their languages
 *  live in `metadata.i18n` and the column keeps a plain projection. This mirrors
 *  `dehydrateEntry` in src/lib/entry-storage.ts — keep the two in step. */
function tagEntry(entry) {
  const i18n = {};
  for (const field of ['title', 'summary']) {
    const tagged = tag(entry[field]);
    if (isLangMap(tagged)) i18n[field] = tagged;
  }
  const metadata = tagFields(entry.metadata, ['kicker', 'when', 'where']);
  if (Object.keys(i18n).length > 0) metadata.i18n = i18n;

  return {
    ...entry,
    title: plain(entry.title),
    summary: plain(entry.summary),
    metadata,
    blocks: entry.blocks.map((block) => {
      const props = tagFields(block.props, BLOCK_TEXT);
      if (Array.isArray(block.props.items) && block.props.items.every((x) => typeof x === 'string')) {
        props.items = block.props.items.map(tag);
      }
      return { ...block, props };
    }),
  };
}

/** A fork that ships one language still has to survive a source field the owner
 *  authored in two: keep the authoring language and drop the rest, so no board
 *  ever renders a `{ es, en }` object where a sentence belongs. */
function flattenEntry(entry) {
  return {
    ...entry,
    title: plain(entry.title),
    summary: plain(entry.summary),
    metadata: Object.fromEntries(
      Object.entries(entry.metadata).map(([key, value]) => [key, isLangMap(value) ? plain(value) : value]),
    ),
    blocks: entry.blocks.map((block) => ({
      ...block,
      props: Object.fromEntries(
        Object.entries(block.props).map(([key, value]) => [
          key,
          BLOCK_TEXT.includes(key) && isLangMap(value) ? plain(value) : value,
        ]),
      ),
    })),
  };
}

const bilingual = I18N.enabled === true;
const boardValue = { size: BOARD, groups, cards: CARDS, polaroids: POLAROIDS, marginalia: MARGINALIA };
const publicEntries = entries.map(bilingual ? tagEntry : flattenEntry);

const settings = [
  { key: 'theme', value: THEME, is_public: true },
  { key: 'board', value: bilingual ? tagBoard(boardValue) : boardValue, is_public: true },
  { key: 'board.layout', value: {}, is_public: true },
  { key: 'board.tour', value: TOUR, is_public: true },
  { key: 'site.i18n', value: I18N, is_public: true },
];

const root = resolve('.');
await writeFile(resolve(root, 'fixtures/demo-content.json'), `${JSON.stringify(publicEntries, null, 2)}\n`, 'utf8');
await writeFile(resolve(root, 'fixtures/site-settings.json'), `${JSON.stringify(settings, null, 2)}\n`, 'utf8');

console.log(`Wrote ${entries.length} entries and ${settings.length} settings documents${bilingual ? ` (prose tagged as "${AUTHORED_IN}")` : ''}.`);
