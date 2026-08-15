import type { ContentBlock } from '../types/content';

// The full-but-simple palette of blocks a dossier can be built from. Every
// dossier is just an ordered list of these — nothing is fixed, everything can
// be added, reordered and removed from the owner editor.
export type DossierBlockType =
  | 'heading'
  | 'text'
  | 'callout'
  | 'quote'
  | 'list'
  | 'metrics'
  | 'image'
  | 'links'
  | 'tags'
  | 'divider';

/** The palette's order. Its words live in the wording catalogue under
 *  `block.<type>` and `block.<type>.hint`, so the buttons speak the language
 *  the owner is writing in and stay editable. */
export const BLOCK_TYPES: DossierBlockType[] = [
  'heading', 'text', 'callout', 'quote', 'list', 'metrics', 'image', 'links', 'tags', 'divider',
];

/** A new block starts empty rather than pre-filled with sample prose.
 *
 *  It used to arrive carrying "Write something here." — English text that then
 *  had to be selected and deleted, and that a translation pass would happily
 *  copy into the other language as if it were real content. An empty block
 *  shows its placeholder instead: nothing to delete, nothing to translate, and
 *  no half-written sentence can reach the published board. */
function defaultProps(type: DossierBlockType): Record<string, unknown> {
  switch (type) {
    case 'heading': return { text: '' };
    case 'text': return { text: '' };
    case 'callout': return { text: '' };
    case 'quote': return { text: '', cite: '' };
    case 'list': return { items: [''] };
    case 'metrics': return { items: [['', '']] };
    case 'image': return { url: '', alt: '', caption: '' };
    case 'links': return { items: [['', '']] };
    case 'tags': return { items: [''] };
    case 'divider': return {};
    default: return {};
  }
}

export function newBlock(type: DossierBlockType, position: number): ContentBlock {
  return {
    id: crypto.randomUUID(),
    type,
    position,
    props: defaultProps(type),
    layout: {},
  };
}

/** Move one identified item immediately before or after another one. Positions
 * are intentionally left to the caller, since the same helper also serves UI
 * collections that do not carry a `position` field. */
export function reorderById<T extends { id: string }>(items: T[], sourceId: string, targetId: string, after = false): T[] {
  if (sourceId === targetId) return items;
  const sourceIndex = items.findIndex((item) => item.id === sourceId);
  const targetIndex = items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return items;

  const next = [...items];
  const [source] = next.splice(sourceIndex, 1);
  const target = next.findIndex((item) => item.id === targetId);
  next.splice(target + (after ? 1 : 0), 0, source);
  return next;
}

/** Read a string prop safely. */
export function propString(block: ContentBlock, key: string): string {
  const value = block.props[key];
  return typeof value === 'string' ? value : '';
}

/** Read a string[] prop safely. */
export function propStringList(block: ContentBlock, key: string): string[] {
  const value = block.props[key];
  return Array.isArray(value) ? value.map((item) => (typeof item === 'string' ? item : String(item))) : [];
}

/** Read a [string,string][] prop safely (metrics / links). */
export function propPairList(block: ContentBlock, key: string): Array<[string, string]> {
  const value = block.props[key];
  if (!Array.isArray(value)) return [];
  return value
    .filter((pair): pair is unknown[] => Array.isArray(pair))
    .map((pair) => [String(pair[0] ?? ''), String(pair[1] ?? '')] as [string, string]);
}
