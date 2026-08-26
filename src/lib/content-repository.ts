import { demoEntries, demoSettings } from '../content/demo';
import type {
  ContentBlock,
  DeletedEntrySummary,
  EntryStatus,
  EntryType,
  EntryVersionSummary,
  PortfolioEntry,
  StoredPortfolioEntry,
  StoredAsset,
} from '../types/content';

// The validator is fetched, not bundled.
//
// Every schema in this file guards a write — saving an entry, restoring a
// version, authorising an upload — and a write is something only the owner
// ever does, from a session they had to sign into. Reading the board needs
// none of it, so zod is loaded the first time somebody actually writes rather
// than sitting in front of the first paint for every visitor who will not.
async function storedEntry(data: unknown): Promise<StoredPortfolioEntry> {
  const { portfolioEntrySchema } = await import('../types/content');
  return portfolioEntrySchema.parse(data);
}
import type { Json } from '../types/database';
import { runtimeConfig } from './config';
import { mediaContentType } from './image-upload';
import { dehydrateEntry, hydrateEntry } from './entry-storage';
import { getNeonClient } from './neon';

type EntryRow = {
  id: string;
  version: number;
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

function assembleEntries(entries: EntryRow[], blocks: BlockRow[]): StoredPortfolioEntry[] {
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

  return entries.map((entry) => hydrateEntry({
    id: entry.id,
    version: entry.version,
    slug: entry.slug,
    title: entry.title as StoredPortfolioEntry['title'],
    summary: entry.summary as StoredPortfolioEntry['summary'],
    entryType: entry.entry_type as EntryType,
    status: entry.status,
    publishedAt: entry.published_at,
    metadata: jsonObject(entry.metadata),
    blocks: (blocksByEntry.get(entry.id) ?? []).sort((a, b) => a.position - b.position),
  }));
}

async function fetchEntries(ownerView: boolean): Promise<StoredPortfolioEntry[]> {
  const neonClient = await getNeonClient();
  if (!neonClient) return demoEntries;

  let query = neonClient
    .from('content_entries')
    .select('id,version,slug,title,summary,entry_type,status,metadata,published_at')
    .is('deleted_at', null);

  if (ownerView) {
    query = query.order('updated_at', { ascending: false });
  } else {
    query = query
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false });
  }

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

export function listPublishedEntries(): Promise<StoredPortfolioEntry[]> {
  return fetchEntries(false);
}

type SettingRow = { key: string; value: Json };

/** Public read of every published settings document (theme, board, layout). */
export async function listSiteSettings(): Promise<Record<string, unknown>> {
  const neonClient = await getNeonClient();
  if (!neonClient) return demoSettings;
  const { data, error } = await neonClient.from('site_settings').select('key,value');
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  const map: Record<string, unknown> = {};
  for (const row of (data ?? []) as SettingRow[]) map[row.key] = row.value;
  return map;
}

async function getOwnerUserId(): Promise<string> {
  const neonClient = await getAuthorizedOwnerClient();
  const result = await neonClient.auth.getSession();
  const session = result.data?.session as
    | { user?: { id?: string }; userId?: string }
    | undefined;
  return session?.user?.id ?? session?.userId ?? 'owner';
}

/** Owner upsert of a single settings document (theme / board / board.layout). */
export async function saveSiteSetting(key: string, value: unknown, isPublic = true): Promise<void> {
  const neonClient = await getAuthorizedOwnerClient();
  const updatedBy = await getOwnerUserId();
  const { error } = await neonClient
    .from('site_settings')
    .upsert({ key, value: value as Json, is_public: isPublic, updated_by: updatedBy }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
}

export function listOwnerEntries(): Promise<StoredPortfolioEntry[]> {
  return fetchEntries(true);
}

/** The version counter one entry is on right now.
 *
 *  `save_content_entry` takes the expected version and refuses a write that
 *  does not match. When the browser's idea of that number falls behind — a
 *  second tab, a save whose answer never arrived — the owner's text is still
 *  the newest thing in play, so the editor reads the counter back and writes
 *  once more instead of discarding what they typed. Returns null when the row
 *  cannot be read, which the caller treats as "leave the conflict standing". */
export async function getEntryVersion(entryId: string): Promise<number | null> {
  const neonClient = await getNeonClient();
  if (!neonClient) return null;
  const { data, error } = await neonClient
    .from('content_entries')
    .select('version')
    .eq('id', entryId)
    .limit(1);
  if (error) return null;
  const row = (data ?? [])[0] as { version?: unknown } | undefined;
  return typeof row?.version === 'number' ? row.version : null;
}

export async function listDeletedEntries(): Promise<DeletedEntrySummary[]> {
  const neonClient = await getNeonClient();
  if (!neonClient) return [];
  const { data, error } = await neonClient
    .from('content_entries')
    .select('id,version,slug,title,entry_type,status,deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((entry) => ({
    id: entry.id,
    version: entry.version,
    slug: entry.slug,
    title: entry.title,
    entryType: entry.entry_type as EntryType,
    status: entry.status as EntryStatus,
    deletedAt: entry.deleted_at as string,
  }));
}

export async function signInOwner(email: string, password: string): Promise<void> {
  const neonClient = await getNeonClient();
  if (!neonClient) throw new Error('Neon is not configured in this environment.');
  const result = await neonClient.auth.signIn.email({ email, password });
  if (result.error) throw new Error(result.error.message);
}

export async function signUpOwner(name: string, email: string, password: string): Promise<string> {
  const neonClient = await getNeonClient();
  if (!neonClient) throw new Error('Neon is not configured in this environment.');
  const result = await neonClient.auth.signUp.email({ name, email, password });
  if (result.error) throw new Error(result.error.message);
  const userId = result.data?.user.id;
  if (!userId) throw new Error('Neon created the account but returned no identifier.');
  return userId;
}

export async function signOutOwner(): Promise<void> {
  const neonClient = await getNeonClient();
  if (!neonClient) return;
  const result = await neonClient.auth.signOut();
  if (result.error) throw new Error(result.error.message);
}

export async function hasOwnerSession(): Promise<boolean> {
  const neonClient = await getNeonClient();
  if (!neonClient) return false;
  const result = await neonClient.auth.getSession();
  return Boolean(result.data?.session);
}

/** The signed-in owner's address is only used as MyMemory's contact parameter.
 * It raises that provider's daily quota from the anonymous allowance; it is
 * never saved in site settings or rendered on the board. */
export async function getCurrentOwnerEmail(): Promise<string | undefined> {
  const neonClient = await getNeonClient();
  if (!neonClient) return undefined;

  const result = await neonClient.auth.getSession();
  const data = result.data as { user?: { email?: unknown }; session?: { user?: { email?: unknown } } } | undefined;
  // Better Auth returns the user alongside the session. The nested fallback
  // keeps this compatible with adapters that attach it to the session itself.
  const email = data?.user?.email ?? data?.session?.user?.email;
  return typeof email === 'string' && email.trim() ? email.trim() : undefined;
}

export async function isCurrentUserOwner(): Promise<boolean> {
  const neonClient = await getNeonClient();
  if (!neonClient) return false;

  // Better Auth persists the fresh session before every Data API request sees
  // its token. Confirm the owner role twice (or retry a briefly stale result)
  // so the first inventory queries cannot accidentally run as anonymous.
  const retryDelays = [0, 80, 180, 360];
  let ownerConfirmedOnce = false;

  for (const delay of retryDelays) {
    if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));
    await neonClient.auth.getSession();
    const { data, error } = await neonClient.rpc('is_owner');
    if (error) throw new Error(error.message);

    if (data === true) {
      if (ownerConfirmedOnce || delay > 0) return true;
      ownerConfirmedOnce = true;
      continue;
    }
  }

  return false;
}

async function getAuthorizedOwnerClient() {
  const neonClient = await getNeonClient();
  if (!neonClient) throw new Error('Neon is not configured in this environment.');
  if (!(await isCurrentUserOwner())) {
    throw new Error('The editing session has expired. Sign in again.');
  }
  return neonClient;
}

export async function saveContentEntry(
  entry: StoredPortfolioEntry,
  reason = 'editor save',
  primaryLanguage?: string,
): Promise<StoredPortfolioEntry> {
  const neonClient = await getAuthorizedOwnerClient();

  // `title` and `summary` are text columns, so the languages go to the sidecar
  // before this leaves the browser. Sending a map instead would store the JSON
  // source: `save_content_entry` reads them with `->>`.
  const { blocks, ...entryFields } = dehydrateEntry(entry, primaryLanguage);
  const { data, error } = await neonClient.rpc('save_content_entry', {
    p_entry_id: entry.id,
    p_expected_version: entry.version,
    p_entry: entryFields as Json,
    p_blocks: blocks as Json,
    p_reason: reason,
  });
  if (error) {
    const prefix = error.code === '40001' ? 'Edit conflict: reload before saving. ' : '';
    throw new Error(`${prefix}${error.message}`);
  }
  return hydrateEntry(await storedEntry(data));
}

export async function deleteContentEntry(entry: Pick<PortfolioEntry, 'id' | 'version'>): Promise<void> {
  const neonClient = await getAuthorizedOwnerClient();
  const { error } = await neonClient.rpc('soft_delete_content_entry', {
    p_entry_id: entry.id,
    p_expected_version: entry.version,
  });
  if (error) throw new Error(error.message);
}

export async function restoreDeletedContentEntry(
  entry: Pick<DeletedEntrySummary, 'id' | 'version'>,
): Promise<StoredPortfolioEntry> {
  const neonClient = await getAuthorizedOwnerClient();
  const { data, error } = await neonClient.rpc('restore_deleted_content_entry', {
    p_entry_id: entry.id,
    p_expected_version: entry.version,
  });
  if (error) throw new Error(error.message);
  return hydrateEntry(await storedEntry(data));
}

export async function listEntryVersions(entryId: string): Promise<EntryVersionSummary[]> {
  const neonClient = await getAuthorizedOwnerClient();
  const { data, error } = await neonClient
    .from('entry_versions')
    .select('id,version,reason,created_at')
    .eq('entry_id', entryId)
    .order('version', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    version: row.version,
    reason: row.reason,
    createdAt: row.created_at,
  }));
}

export async function restoreEntryVersion(
  entryId: string,
  version: number,
  expectedVersion: number,
): Promise<StoredPortfolioEntry> {
  const neonClient = await getAuthorizedOwnerClient();
  const { data, error } = await neonClient.rpc('restore_content_entry_version', {
    p_entry_id: entryId,
    p_version: version,
    p_expected_version: expectedVersion,
  });
  if (error) throw new Error(error.message);
  return hydrateEntry(await storedEntry(data));
}

async function parsePresign(data: unknown) {
  const { z } = await import('zod');
  return z.object({
    bucket: z.string().min(1),
    key: z.string().min(1),
    uploadUrl: z.url(),
    publicUrl: z.url(),
  }).parse(data);
}

async function getOwnerToken(): Promise<string> {
  const neonClient = await getAuthorizedOwnerClient();
  const result = await neonClient.auth.getSession();
  if (result.error || !result.data?.session.token) {
    throw new Error('The session has expired. Sign in again.');
  }
  return result.data.session.token;
}

/** Upload the original file bytes directly to object storage. No client-side
 * conversion or recompression is performed, including for video. */
export async function uploadMedia(file: File, altText: string): Promise<StoredAsset> {
  if (!runtimeConfig.storageFunctionUrl) {
    throw new Error('VITE_STORAGE_FUNCTION_URL is not configured.');
  }

  const contentType = mediaContentType(file);
  if (!contentType) {
    throw new Error('Solo se pueden subir imágenes AVIF, GIF, HEIC, HEIF, JPEG, PNG o WebP, o vídeos MP4, MOV, M4V y WebM.');
  }

  // A few drag sources (notably Photos on macOS) hand the browser a File
  // without a name. The bytes and MIME type are still valid, so give the
  // broker a safe extension instead of letting its filename schema reject the
  // upload before it reaches storage.
  const filename = file.name.trim() || `upload.${contentType.slice(contentType.indexOf('/') + 1).replace('jpeg', 'jpg')}`;

  const token = await getOwnerToken();
  const presignResponse = await fetch(`${runtimeConfig.storageFunctionUrl}/uploads/presign`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, contentType, byteSize: file.size }),
  });
  if (!presignResponse.ok) {
    const body = (await presignResponse.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? 'No se pudo autorizar la subida.');
  }
  const presign = await parsePresign(await presignResponse.json());

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error('Storage rejected the upload.');

  const neonClient = await getNeonClient();
  if (!neonClient) throw new Error('Neon is not configured in this environment.');
  const { data, error } = await neonClient.rpc('register_uploaded_asset', {
    p_bucket: presign.bucket,
    p_object_key: presign.key,
    p_public_url: presign.publicUrl,
    p_mime_type: contentType,
    p_byte_size: file.size,
    p_alt_text: altText,
  });
  if (error) throw new Error(error.message);

  return {
    id: data.id,
    bucket: data.bucket,
    objectKey: data.object_key,
    publicUrl: data.public_url ?? presign.publicUrl,
    mimeType: data.mime_type,
    byteSize: data.byte_size,
    altText: data.alt_text,
  };
}
