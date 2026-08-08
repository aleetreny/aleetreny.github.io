# Authentication and authorisation

## The system

Neon's Managed Better Auth, declared with `auth: true` in `neon.ts`. The browser
session uses a secure cookie managed by the SDK; the access JWT identifies the
user to the Data API and to the storage function.

## Repeatable setup

1. `neon deploy` on the right branch.
2. In Neon Auth, add `http://localhost:5173` and `https://aleetreny.github.io`
   as trusted domains (plus a custom domain if one appears).
3. Enable email/password and email verification. Do not enable OAuth providers
   without registering the exact callbacks.
4. Configure the public URLs in `.env.local` / GitHub Variables.
5. Apply the migrations.
6. Create the owner account and allowlist it with `pnpm db:owner`.

## Verified state

The project is `aleetreny-portfolio` (`divine-queen-66854519`). On the isolated
`codex-integration` branch (`br-tiny-art-ayb43loi`) the allowlisted session,
anonymous reads, write rejection for a non-owner account, and the full editorial
cycle were all verified. Auth, Data API, schema and fixtures are also live in
production (`br-blue-dawn-ay0e37ed`).

`allow_localhost` covers local development, and `https://aleetreny.github.io` is
already a trusted origin in integration and production. The CORS header was
validated against both Auth endpoints. Do not document users, passwords, tokens
or the temporary UUIDs from those tests.

## The critical distinction

`authenticated` means "valid JWT", not "administrator". `public.is_owner()` only
returns true when `auth.user_id()` matches an enabled row in
`app_private.owner_accounts`. Every editorial write depends on that function
through RLS.

## The JWT and the storage function

The function requires `Authorization: Bearer <JWT>` and validates:

- the EdDSA algorithm;
- the signature against `NEON_AUTH_JWKS_URL`;
- `issuer` and `audience` matching the origin of `NEON_AUTH_BASE_URL`;
- expiry;
- a present `sub`;
- that `sub` being enabled in the allowlist.

The JWT expires within minutes and is never stored in the repository or in logs.
The UI must request it from the SDK immediately before calling the function.

## Creating, revoking and recovering the owner

```bash
pnpm db:owner -- --user-id <uuid> --email <address>
```

To revoke without losing traceability:

```sql
update app_private.owner_accounts set enabled = false where auth_user_id = '<uuid>';
```

Password recovery happens in Neon Auth. If access is lost entirely, create and
verify a new account on an email you control, add it over an administrative
connection, and disable the previous one.

## Minimum manual verification

- no session: read published content, no drafts, no writes;
- non-allowlisted session: the same;
- allowlisted session: read drafts and write;
- disabled user: loses write access on the next query;
- tampered/expired JWT: the function returns 401;
- non-allowlisted origin: the function returns 403.

Managed Better Auth and the Data API are still in beta; check the official docs
before upgrading `@neondatabase/neon-js`.
