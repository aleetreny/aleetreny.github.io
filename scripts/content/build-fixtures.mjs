// Build the seed fixtures (public content + site settings) from the canonical
// board sources. Run with `pnpm content:build`. The generated JSON is what the
// offline safe copy renders and what `pnpm db:seed` loads into Neon.
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ITEMS, ORDER } from '../../content/source/desk-data.mjs';
import {
  BOARD, THEME, GROUPS, GROUP_LABELS, GROUP_ENTRY_TYPE, ENTRY_TYPE_OVERRIDE, TRAVEL_CODES,
  CARDS, POLAROIDS, MARGINALIA, TOUR,
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

const groups = Object.keys(GROUPS).map((id) => ({ id, label: GROUP_LABELS[id] ?? id }));

const settings = [
  { key: 'theme', value: THEME, is_public: true },
  { key: 'board', value: { size: BOARD, groups, cards: CARDS, polaroids: POLAROIDS, marginalia: MARGINALIA }, is_public: true },
  { key: 'board.layout', value: {}, is_public: true },
  { key: 'board.tour', value: TOUR, is_public: true },
];

const root = resolve('.');
await writeFile(resolve(root, 'fixtures/demo-content.json'), `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
await writeFile(resolve(root, 'fixtures/site-settings.json'), `${JSON.stringify(settings, null, 2)}\n`, 'utf8');

console.log(`Wrote ${entries.length} entries and ${settings.length} settings documents.`);
