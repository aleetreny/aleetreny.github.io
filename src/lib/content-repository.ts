import { demoEntries } from '../content/demo';
import type { ContentBlock, EntryStatus, EntryType, PortfolioEntry } from '../types/content';
import type { Json } from '../types/database';
import { getNeonClient } from './neon';

type EntryRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  entry_type: string;
  status: EntryStatus;
  metadata: Json;
  published_at: string | null;
};

type BlockRow = {
  id: string;
  entry_id: string;
  block_type: string;
  position: number;
  props: Json;
  layout: Json;
};

function jsonObject(value: Json): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function assembleEntries(entries: EntryRow[], blocks: BlockRow[]): PortfolioEntry[] {
  const blocksByEntry = new Map<string, ContentBlock[]>();

  for (const block of blocks) {
    const current = blocksByEntry.get(block.entry_id) ?? [];
    current.push({
      id: block.id,
      type: block.block_type,
      position: block.position,
      props: jsonObject(block.props),
      layout: jsonObject(block.layout),
    });
    blocksByEntry.set(block.entry_id, current);
  }

  return entries.map((entry) => ({
    id: entry.id,
    slug: entry.slug,
    title: entry.title,
    summary: entry.summary,
    entryType: entry.entry_type as EntryType,
    status: entry.status,
    publishedAt: entry.published_at,
    metadata: jsonObject(entry.metadata),
    blocks: (blocksByEntry.get(entry.id) ?? []).sort((a, b) => a.position - b.position),
  }));
}

async function fetchEntries(ownerView: boolean): Promise<PortfolioEntry[]> {
  const neonClient = await getNeonClient();
  if (!neonClient) return demoEntries;

  let query = neonClient
    .from('content_entries')
    .select('id,slug,title,summary,entry_type,status,metadata,published_at')
    .is('deleted_at', null)
    .order('published_at', { ascending: false, nullsFirst: false });

  if (!ownerView) query = query.eq('status', 'published');

  const { data: entryData, error: entryError } = await query;
  if (entryError) throw new Error(`Could not load entries: ${entryError.message}`);

  const entries = (entryData ?? []) as EntryRow[];
  if (entries.length === 0) return [];

  const { data: blockData, error: blockError } = await neonClient
    .from('content_blocks')
    .select('id,entry_id,block_type,position,props,layout')
    .in(
      'entry_id',
      entries.map((entry) => entry.id),
    )
    .is('deleted_at', null)
    .order('position');

  if (blockError) throw new Error(`Could not load blocks: ${blockError.message}`);
  return assembleEntries(entries, (blockData ?? []) as BlockRow[]);
}

export function listPublishedEntries(): Promise<PortfolioEntry[]> {
  return fetchEntries(false);
}

export function listOwnerEntries(): Promise<PortfolioEntry[]> {
  return fetchEntries(true);
}

export async function signInOwner(email: string, password: string): Promise<void> {
  const neonClient = await getNeonClient();
  if (!neonClient) throw new Error('Neon is not configured in this environment.');
  const result = await neonClient.auth.signIn.email({ email, password });
  if (result.error) throw new Error(result.error.message);
}

export async function signOutOwner(): Promise<void> {
  const neonClient = await getNeonClient();
  if (!neonClient) return;
  const result = await neonClient.auth.signOut();
  if (result.error) throw new Error(result.error.message);
}

export async function isCurrentUserOwner(): Promise<boolean> {
  const neonClient = await getNeonClient();
  if (!neonClient) return false;
  const { data, error } = await neonClient.rpc('is_owner');
  if (error) throw new Error(error.message);
  return data === true;
}
