import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDatabaseClient } from './client.mjs';

const input = process.argv.find((value) => value.startsWith('--input='))?.slice(8);
const ownerId = process.env.OWNER_AUTH_USER_ID;
if (!input) throw new Error('Pass --input=/absolute/or/relative/public-export.json.');
if (!ownerId) throw new Error('OWNER_AUTH_USER_ID is required so imported rows have a local owner.');

const payload = JSON.parse(await readFile(resolve(input), 'utf8'));
if (payload.format !== 'aleetreny-portfolio-public-export' || payload.version !== 1) {
  throw new Error('Unsupported export format or version.');
}

const sql = createDatabaseClient();
try {
  await sql.begin(async (transaction) => {
    for (const asset of payload.assets || []) {
      await transaction`
        insert into public.assets (
          id, owner_id, storage_provider, bucket, object_key, public_url, mime_type, byte_size,
          width, height, alt_text, metadata, is_public
        ) values (
          ${asset.id}, ${ownerId}, ${asset.storage_provider}, ${asset.bucket}, ${asset.object_key},
          ${asset.public_url}, ${asset.mime_type}, ${asset.byte_size}, ${asset.width}, ${asset.height},
          ${asset.alt_text}, ${transaction.json(asset.metadata)}, ${asset.is_public}
        )
        on conflict (id) do update set
          public_url = excluded.public_url,
          alt_text = excluded.alt_text,
          metadata = excluded.metadata,
          deleted_at = null
      `;
    }

    for (const entry of payload.entries || []) {
      await transaction`
        insert into public.content_entries (
          id, owner_id, slug, title, summary, entry_type, status, cover_asset_id,
          metadata, version, published_at
        ) values (
          ${entry.id}, ${ownerId}, ${entry.slug}, ${entry.title}, ${entry.summary}, ${entry.entry_type},
          ${entry.status}, ${entry.cover_asset_id}, ${transaction.json(entry.metadata)}, ${entry.version},
          ${entry.published_at}
        )
        on conflict (id) do update set
          slug = excluded.slug,
          title = excluded.title,
          summary = excluded.summary,
          entry_type = excluded.entry_type,
          status = excluded.status,
          cover_asset_id = excluded.cover_asset_id,
          metadata = excluded.metadata,
          version = excluded.version,
          published_at = excluded.published_at,
          deleted_at = null
      `;
    }

    for (const block of payload.blocks || []) {
      await transaction`
        insert into public.content_blocks (
          id, entry_id, block_type, position, props, layout, version
        ) values (
          ${block.id}, ${block.entry_id}, ${block.block_type}, ${block.position},
          ${transaction.json(block.props)}, ${transaction.json(block.layout)}, ${block.version}
        )
        on conflict (id) do update set
          position = excluded.position,
          props = excluded.props,
          layout = excluded.layout,
          version = excluded.version,
          deleted_at = null
      `;
    }

    for (const setting of payload.settings || []) {
      await transaction`
        insert into public.site_settings (key, value, is_public, updated_by)
        values (${setting.key}, ${transaction.json(setting.value)}, ${setting.is_public}, ${ownerId})
        on conflict (key) do update set value = excluded.value, is_public = excluded.is_public,
          updated_by = excluded.updated_by, updated_at = now()
      `;
    }
  });
  console.log('Public database export imported. Restore storage objects separately before publishing.');
} finally {
  await sql.end();
}
