# Recovery

## Full rebuild

1. clone GitHub and select the stable branch/tag;
2. install Node/pnpm and run `pnpm install --frozen-lockfile`;
3. copy `.env.example` to `.env.local`;
4. create/link a compatible Neon project;
5. create an isolated branch;
6. run `neon config plan` and `neon deploy`;
7. configure `DATABASE_URL` and run `pnpm db:migrate`;
8. create and allowlist the owner;
9. import the public DB and objects if backups exist;
10. `pnpm db:verify`, `pnpm check`, `pnpm build`;
11. configure GitHub Variables/Secrets and Pages;
12. verify login, RLS, upload and the public page before production.

## Restore the schema without a migration history

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

Afterwards register/reconcile `app_private.schema_migrations`, preferably on a
fresh database. Do not mark migrations by hand on an existing database without
verifying checksums.

## Recover data

- a recent mistake in Neon: branch from an earlier point, or instant-restore
  within the plan's window;
- logical export: `pnpm db:import` with the target owner;
- objects: `pnpm storage:import`, then reconcile `assets.public_url`;
- personal data: use an approved private backup, never the Git fixtures.

## Go back to the previous site

The terminal version is preserved in:

- the remote branch `backup/static-terminal-2025`;
- the snapshot `legacy/terminal-portfolio/index.html`;
- the original commit `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c`.

Safe rollback: branch from the backup, open and review the change towards `main`,
or temporarily switch the Pages source. Do not delete history. Check that the
backup does not depend on local assets (it used external CDNs, as before).

## Auth / Data API failure

Temporarily turn off `VITE_ENABLE_REMOTE_DATA` and deploy the fixtures only if
showing the safe copy is acceptable; this recovers no drafts and enables no
editing. Investigate branch URLs, trusted origins, roles, schema cache and RLS.

## Storage failure

Text content keeps working if image URLs are not essential. Do not expose
credentials as a shortcut. Restore on a branch, verify the objects, then change
URLs and configuration.

## Recovery evidence

Record the date, commit, Neon branch, backup used, commands and verifications in
an issue or operational document with no secrets in it, and update
`docs/handoff.md`.
