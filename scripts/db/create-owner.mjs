import { createDatabaseClient } from './client.mjs';

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const authUserId = argument('user-id') || process.env.OWNER_AUTH_USER_ID;
const email = argument('email') || process.env.OWNER_EMAIL || null;

if (!authUserId || !/^[0-9a-f-]{20,}$/i.test(authUserId)) {
  throw new Error('Pass a Neon Auth UUID with --user-id or OWNER_AUTH_USER_ID.');
}

const sql = createDatabaseClient();
try {
  await sql`
    insert into app_private.owner_accounts (auth_user_id, email, enabled)
    values (${authUserId}, ${email}, true)
    on conflict (auth_user_id) do update set email = excluded.email, enabled = true
  `;
  console.log(`Owner allowlist updated for auth user ${authUserId}.`);
} finally {
  await sql.end();
}
