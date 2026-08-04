import type { ContentBlock, EntryType, PortfolioEntry } from '../types/content';

export const BLOCK_TYPES = ['text', 'heading', 'list', 'metric', 'quote', 'image'] as const;
export type EditableBlockType = (typeof BLOCK_TYPES)[number];

export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function normalizeBlockPositions(blocks: ContentBlock[]): ContentBlock[] {
  return blocks.map((block, position) => ({ ...block, position }));
}

export function createBlock(type: EditableBlockType): ContentBlock {
  const propsByType: Record<EditableBlockType, Record<string, unknown>> = {
    text: { text: '' },
    heading: { text: '' },
    list: { items: [''] },
    metric: { label: '', value: '' },
    quote: { text: '', attribution: '' },
    image: { url: '', alt: '', assetId: '' },
  };
  return {
    id: crypto.randomUUID(),
    type,
    position: 0,
    props: propsByType[type],
    layout: { width: 'wide', align: 'start' },
  };
}

export function createEntry(entryType: EntryType = 'project'): PortfolioEntry {
  return {
    id: crypto.randomUUID(),
    version: 0,
    slug: '',
    title: '',
    summary: '',
    entryType,
    status: 'draft',
    publishedAt: null,
    metadata: { topics: [], featured: false },
    blocks: [],
  };
}
