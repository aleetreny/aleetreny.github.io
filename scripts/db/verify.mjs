import { createDatabaseClient } from './client.mjs';

const sql = createDatabaseClient();
const expectedTables = ['assets', 'content_blocks', 'content_entries', 'entry_versions', 'site_settings'];

try {
  const tables = await sql`
    select c.relname as name, c.relrowsecurity as rls
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname in ${sql(expectedTables)}
    order by c.relname
  `;
  const policies = await sql`
    select tablename, count(*)::int as count
    from pg_policies
    where schemaname = 'public'
    group by tablename
  `;
  const [ownerFunction] = await sql`
    select to_regprocedure('public.is_owner()') is not null as present
  `;
  const roles = await sql`
    select rolname from pg_roles where rolname in ('anonymous', 'authenticated') order by rolname
  `;
  const indexes = await sql`
    select count(*)::int as count
    from pg_indexes
    where schemaname = 'public'
      and indexname in (
        'content_entries_public_feed_idx',
        'content_blocks_active_position_unique',
        'assets_public_idx'
      )
  `;

  const missingTables = expectedTables.filter((name) => !tables.some((table) => table.name === name));
  const withoutRls = tables.filter((table) => !table.rls).map((table) => table.name);
  if (missingTables.length || withoutRls.length || !ownerFunction.present || roles.length !== 2 || indexes[0].count !== 3) {
    throw new Error(
      JSON.stringify({ missingTables, withoutRls, ownerFunction, roles, indexes }, null, 2),
    );
  }

  console.log(JSON.stringify({ tables, policies, roles, indexes: indexes[0].count }, null, 2));
  console.log('Database permissions and schema checks passed.');
} finally {
  await sql.end();
}
