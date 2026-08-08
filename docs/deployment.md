# Deployment

## GitHub Pages

Workflow: `.github/workflows/deploy-pages.yml`.

- automatic trigger: a push to `main`;
- manual trigger: Actions > Deploy GitHub Pages > Run workflow;
- build: `pnpm check` and `pnpm build`;
- artifact: `dist/` through `upload-pages-artifact`;
- deploy: the `github-pages` environment with `pages:write` and OIDC identity.

Settings > Pages must have GitHub Actions selected. `dist/` is never committed.

That initial manual selection is required, because switching an existing site
away from the legacy source needs administrative permission. Check the result
with:

```bash
curl -fsSL -H 'Cache-Control: no-cache' https://aleetreny.github.io/index.html \
  | grep -E 'assets/index|src/main'
```

A correct result contains `/assets/index-*.js`. If `/src/main.tsx` appears, Pages
is serving the repository uncompiled and the source has to be fixed first.

## Pages variables

All of them are public, because they are bundled:

- `VITE_ENABLE_REMOTE_DATA=true`
- `VITE_NEON_AUTH_URL`
- `VITE_NEON_DATA_API_URL`
- `VITE_STORAGE_FUNCTION_URL`
- `VITE_STORAGE_PUBLIC_BASE_URL`

The workflow carries the already-verified public production endpoints as a
fallback and enables remote content even if the repository Variables are lost.
The Variables still take priority, so a project migration needs no workflow edit.
If Neon fails at runtime the frontend shows the versioned fixtures automatically;
for a deliberately isolated recovery, set `VITE_ENABLE_REMOTE_DATA=false`.

Never create a `VITE_DATABASE_URL`, `VITE_NEON_API_KEY` or
`VITE_AWS_SECRET_ACCESS_KEY` variable.

## Neon backend

Manual workflow: `.github/workflows/provision-neon.yml`.

Recommended GitHub Environments:

| Environment | Secrets | Variables | Protection |
| --- | --- | --- | --- |
| development | `NEON_API_KEY`, dev branch `DATABASE_URL` | `NEON_PROJECT_ID`, `NEON_BRANCH`, `ALLOWED_ORIGINS` | optional |
| production | `NEON_API_KEY`, production `DATABASE_URL` | the same plus `NEON_PROTECT_DEFAULT_BRANCH` | `main` only + `APPLY_PRODUCTION` |

Run `plan` before `apply`. `apply` deploys `neon.ts`, migrates and verifies. It
does not point at production automatically on every push.

The policy protects the default branch unless the plan allows zero protected
branches. In that case use `NEON_PROTECT_DEFAULT_BRANCH=false`, restrict the
`production` environment to `main`, and require
`production_confirmation=APPLY_PRODUCTION` for `apply`; go back to `true` as soon
as the plan permits. The repository's current GitHub plan offers no required
reviewers, so this compensation is documented and must not be presented as human
approval.

## Seeding content

Manual workflow: `.github/workflows/seed-content.yml`. It applies migrations,
seeds the versioned catalogue and board settings into the chosen environment's
`DATABASE_URL`, and verifies. With `replace_catalogue=true` it moves any entry
outside the catalogue to the recoverable trash. `production` requires
`production_confirmation=APPLY_PRODUCTION`.

Run `pnpm content:build` before seeding if anything under `content/source/`
changed. A reseed is required whenever the fixtures change shape — a new settings
key, a renamed list, a new card field. Edits made from the site itself never need
one.

## Domain

The current domain is `aleetreny.github.io`. There is no `CNAME`. To add a
domain:

1. configure DNS and Settings > Pages;
2. verify HTTPS;
3. add the origin and callbacks to Neon Auth;
4. update `ALLOWED_ORIGINS`;
5. update canonical URLs and metadata;
6. document the DNS rollback.

## Recovering a failed deploy

1. inspect the exact job and keep the relevant URL/log;
2. reproduce from a clean clone with
   `pnpm install --frozen-lockfile && pnpm check && pnpm build`;
3. fix it on a branch, and do not disable checks;
4. re-dispatch manually if the commit already carries the fix;
5. to roll back, revert the commit in Git and deploy again;
6. for a visual emergency, use `backup/static-terminal-2025` as described in
   `docs/recovery.md`.

## Release

Only tag a stable version once CI, Pages, Auth, RLS, Storage and a clean clone
are all verified. Proposed format: `portfolio-v0.1.0`.
