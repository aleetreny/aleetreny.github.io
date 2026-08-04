import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createDatabaseClient } from './client.mjs';

const sql = createDatabaseClient();
const migrationsDirectory = resolve('db/migrations');

try {
  await sql.unsafe(`
    create schema if not exists app_private;
    revoke all on schema app_private from public;
    create table if not exists app_private.schema_migrations (
      filename text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);
  await sql`select pg_advisory_lock(hashtext('aleetreny_portfolio_migrations'))`;

  const files = (await readdir(migrationsDirectory))
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .sort();

  for (const filename of files) {
    const source = await readFile(resolve(migrationsDirectory, filename), 'utf8');
    const checksum = createHash('sha256').update(source).digest('hex');
    const [existing] = await sql`
      select checksum from app_private.schema_migrations where filename = ${filename}
    `;

    if (existing) {
      if (existing.checksum !== checksum) {
        throw new Error(`Migration ${filename} changed after it was applied.`);
      }
      console.log(`skip  ${filename}`);
      continue;
    }

    await sql.begin(async (transaction) => {
      await transaction.unsafe(source);
      await transaction`
        insert into app_private.schema_migrations (filename, checksum)
        values (${filename}, ${checksum})
      `;
    });
    console.log(`apply ${filename}`);
  }
} finally {
  await sql`select pg_advisory_unlock(hashtext('aleetreny_portfolio_migrations'))`.catch(() => undefined);
  await sql.end();
}
