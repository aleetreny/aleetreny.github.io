import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDatabaseClient } from './client.mjs';

const sql = createDatabaseClient();
const entries = JSON.parse(await readFile(resolve('fixtures/demo-content.json'), 'utf8'));
const settings = JSON.parse(await readFile(resolve('fixtures/site-settings.json'), 'utf8'));
const ownerId = process.env.OWNER_AUTH_USER_ID || 'public-demo-fixture';
// When true, active entries that are not part of this catalogue are moved to the
// recoverable trash — used to replace an older catalogue on first seed.
const replace = process.env.SEED_REPLACE === 'true';

const keepIds = entries.map((entry) => entry.id);

try {
  await sql.begin(async (transaction) => {
    if (replace) {
      // Free any slug held by a previous catalogue (slug is globally unique) by
      // renaming it and moving the row to the recoverable trash, so this run can
      // insert the new dossiers cleanly. History is preserved, not destroyed.
      await transaction`
        update public.content_entries
        set slug = slug || '-archived-' || replace(id::text, '-', ''),
            deleted_at = now()
        where deleted_at is null
          and not (id = any(${keepIds}::uuid[]))
      `;
      await transaction`
        update public.content_blocks b
        set deleted_at = now()
        where b.deleted_at is null
          and exists (
            select 1 from public.content_entries e
            where e.id = b.entry_id and e.deleted_at is not null
          )
      `;
    }

    for (const entry of entries) {
      await transaction`
        update public.content_blocks
        set deleted_at = now()
        where entry_id = ${entry.id}
          and deleted_at is null
      `;

      await transaction`
        insert into public.content_entries (
          id, owner_id, slug, title, summary, entry_type, status, metadata, published_at
        ) values (
          ${entry.id}, ${ownerId}, ${entry.slug}, ${entry.title}, ${entry.summary},
          ${entry.entryType}, ${entry.status}, ${transaction.json(entry.metadata)}, ${entry.publishedAt}
        )
        on conflict (id) do update set
          slug = excluded.slug,
          title = excluded.title,
          summary = excluded.summary,
          entry_type = excluded.entry_type,
          status = excluded.status,
          metadata = excluded.metadata,
          published_at = excluded.published_at,
          deleted_at = null
      `;

      for (const block of entry.blocks) {
        await transaction`
          insert into public.content_blocks (
            id, entry_id, block_type, position, props, layout
          ) values (
            ${block.id}, ${entry.id}, ${block.type}, ${block.position},
            ${transaction.json(block.props)}, ${transaction.json(block.layout)}
          )
          on conflict (id) do update set
            entry_id = excluded.entry_id,
            block_type = excluded.block_type,
            position = excluded.position,
            props = excluded.props,
            layout = excluded.layout,
            deleted_at = null
        `;
      }
    }

    for (const setting of settings) {
      await transaction`
        insert into public.site_settings (key, value, is_public, updated_by)
        values (${setting.key}, ${transaction.json(setting.value)}, ${setting.is_public ?? true}, ${ownerId})
        on conflict (key) do update set
          value = excluded.value,
          is_public = excluded.is_public,
          updated_by = excluded.updated_by
      `;
    }

  });
  console.log(`Seeded ${entries.length} entries and ${settings.length} settings documents${replace ? ' (catalogue replaced)' : ''}.`);
} finally {
  await sql.end();
}
