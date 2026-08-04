import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDatabaseClient } from './client.mjs';

const sql = createDatabaseClient();
const entries = JSON.parse(await readFile(resolve('fixtures/demo-content.json'), 'utf8'));
const ownerId = process.env.OWNER_AUTH_USER_ID || 'public-demo-fixture';

try {
  await sql.begin(async (transaction) => {
    for (const entry of entries) {
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
          published_at = excluded.published_at
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
            block_type = excluded.block_type,
            position = excluded.position,
            props = excluded.props,
            layout = excluded.layout,
            deleted_at = null
        `;
      }
    }
  });
  console.log(`Seeded ${entries.length} public demo entries.`);
} finally {
  await sql.end();
}
