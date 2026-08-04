import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createDatabaseClient } from './client.mjs';

const requestedOutput = process.argv.find((value) => value.startsWith('--output='))?.slice(9);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const output = resolve(requestedOutput || `backups/public-export-${timestamp}.json`);
const sql = createDatabaseClient();

try {
  const entries = await sql`
    select id, slug, title, summary, entry_type, status, cover_asset_id, metadata, version, published_at
    from public.content_entries
    where status = 'published' and deleted_at is null
    order by published_at desc
  `;
  const blocks = await sql`
    select b.id, b.entry_id, b.block_type, b.position, b.props, b.layout, b.version
    from public.content_blocks b
    join public.content_entries e on e.id = b.entry_id
    where e.status = 'published' and e.deleted_at is null and b.deleted_at is null
    order by b.entry_id, b.position
  `;
  const assets = await sql`
    select id, storage_provider, bucket, object_key, public_url, mime_type, byte_size,
           width, height, alt_text, metadata, is_public
    from public.assets
    where is_public = true and deleted_at is null
    order by created_at
  `;
  const settings = await sql`
    select key, value, is_public from public.site_settings where is_public = true order by key
  `;

  const payload = {
    format: 'aleetreny-portfolio-public-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries,
    blocks,
    assets,
    settings,
  };
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
  console.log(`Public export written to ${output}. Treat it as data, review it, and do not commit it.`);
} finally {
  await sql.end();
}
