# Storage

## Provider and limits

The provider is Neon Object Storage: S3-compatible and branchable alongside
Postgres. Bucket: `portfolio-assets`, access `public_read`. As things stand,
Storage and Functions are beta and require `aws-us-east-2`.

If the existing Neon project is not in that region, do not move production
blindly: open an ADR replacing the provider, or create a compatible project and
plan the migration.

## Creation

`neon.ts` declares the bucket and the function. Run:

```bash
pnpm exec neon link --project-id <id>
pnpm neon:plan
pnpm neon:deploy
pnpm exec neon env pull --file .env.local
```

The function automatically receives `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `DATABASE_URL`,
`NEON_AUTH_BASE_URL` and `NEON_AUTH_JWKS_URL`. `ALLOWED_ORIGINS` and
`STORAGE_BUCKET` are injected from `neon.ts`.

## Object layout

```text
portfolio-assets/
└── <auth-user-id>/
    └── <uuid>-<normalised-filename>
```

Keys chosen entirely by the client are not accepted. The function builds the
prefix and UUID, and allows only AVIF, GIF, HEIC, HEIF, JPEG, PNG and WebP up
to 10 MiB, plus MP4, MOV/QuickTime, M4V and WebM video up to 250 MiB. Uploads
use the original file bytes; the editor does not convert or recompress media.

## Access policies

- read: public by URL for published assets;
- upload: a five-minute signed PUT URL, allowlisted owner only;
- delete: through the function, only under the same `sub`'s prefix;
- S3 credentials: server/operator only, never the frontend;
- function CORS: exact origins from `ALLOWED_ORIGINS`.

Object Storage uses an access level, not arbitrary S3 bucket policies. Verify the
state from the Neon Console after `deploy`.

## Upload flow

`POST /uploads/presign` takes `filename`, `contentType` and `byteSize`. After a
successful PUT, the editor calls `public.register_uploaded_asset` to record the
URL, key, MIME, bytes and alt text. The function re-checks owner, bucket, prefix,
type and size. If that second operation fails the object is orphaned; a future
maintenance task must compare bucket and table before deleting anything.

To verify the real cycle on an isolated branch, load that branch's variables
locally, set `STORAGE_FUNCTION_URL` and run:

```bash
pnpm storage:verify-live
```

The script creates a synthetic account with a random password, allowlists it
temporarily, signs and uploads `public/og.jpg`, checks the public read, registers
metadata through the Data API, runs the real export and import scripts, deletes
the object through the Function, and removes the account, allowlist row, table
row and temporary backup in a `finally` block. It prints no credentials and
leaves no demo data in Auth, Postgres or the bucket.

For safety it refuses the `production` branch unless the operator explicitly sets
`STORAGE_VERIFY_ALLOW_PRODUCTION=true` after reviewing the plan and accepting the
synthetic cleanup.

## Backup and restore

```bash
pnpm storage:export -- --output=backups/storage-YYYYMMDD
pnpm storage:import -- --input=backups/storage-YYYYMMDD
```

The manifest keeps key, type and metadata; the bytes use hashed names to avoid
path traversal. The destination comes from local variables, so it can be restored
onto another branch or project. Afterwards, import the DB metadata and update
URLs if the endpoint changed.

Backups can contain personal information: encrypt them, limit access, and never
commit them.

## Rotation

Neon-injected credentials follow the branch. For manual credentials: create the
new one, update the secret store, verify, then revoke the old one. Never rely on
beta expiry alone.
