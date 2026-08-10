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

export const BLOCK_PALETTE: Array<{ type: DossierBlockType; label: string; hint: string }> = [
  { type: 'heading', label: 'Heading', hint: 'A section title' },
  { type: 'text', label: 'Paragraph', hint: 'A block of prose' },
  { type: 'callout', label: 'Callout', hint: 'A highlighted note' },
  { type: 'quote', label: 'Quote', hint: 'A pulled quotation' },
  { type: 'list', label: 'List', hint: 'Bulleted points' },
  { type: 'metrics', label: 'Numbers', hint: 'Value + label figures' },
  { type: 'image', label: 'Image', hint: 'A photo slot' },
  { type: 'links', label: 'Links', hint: 'External links' },
  { type: 'tags', label: 'Tags', hint: 'Filed-under keywords' },
  { type: 'divider', label: 'Divider', hint: 'A thin rule' },
];

export const BLOCK_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_PALETTE.map((entry) => [entry.type, entry.label]),
);

function defaultProps(type: DossierBlockType): Record<string, unknown> {
  switch (type) {
    case 'heading': return { text: 'Section' };
    case 'text': return { text: 'Write something here.' };
    case 'callout': return { text: 'Something worth highlighting.' };
    case 'quote': return { text: 'A line worth quoting.', cite: '' };
    case 'list': return { items: ['First point'] };
    case 'metrics': return { items: [['0', 'label']] };
    case 'image': return { url: '', alt: '', caption: '' };
    case 'links': return { items: [['Label', 'https://']] };
    case 'tags': return { items: ['tag'] };
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
