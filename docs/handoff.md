# Handoff between machines

Updated: 2026-08-26 (Europe/Madrid).

## Stable point and branches

- repository: `aleetreny/aleetreny.github.io`;
- deployment branch: `main`;
- remote backup of the previous site: `backup/static-terminal-2025`;
- original rollback commit: `df975cda5ff8b2390a0ad72e316ecda5eb9fcf9c`;
- last remote commit before the redesign: `c5b48c82bb57f2133f5678391359924f62bf253c`;
- stable tag from the earlier phase: `portfolio-v0.2.0`;
- current release: `portfolio-v2.0.0`.

GitHub Pages must keep **Settings > Pages > Source: GitHub Actions**.

## Current functional state

The frontend is a **working board**: a finite slate hanging on a wall, with paper
cards pinned to it, pan/zoom/pinch/keyboard, dossiers, and a guided tour that
walks a first-time visitor through it stop by stop.
[`docs/handbook.md`](handbook.md) is the complete feature and settings reference;
[`docs/design-direction.md`](design-direction.md) holds the visual rules.

Owner mode at `/?owner=1` uses the same aesthetic and edits everything in place:
inline text on every card and dossier, drag positioning, per-card settings, the
theme and backdrop panel, the guided tour panel, photo uploads, the inventory
with dynamic lists, and a recoverable trash.

The real owner account exists and is allowlisted. Its password, email and session
were never committed or documented. The provisioning Secrets live in GitHub's
encrypted environments.

The catalogue lives in the fixtures and in both Neon branches. The seed first
deactivates the fixture's previous blocks and updates `entry_id` during the
upsert, so it is idempotent even when the composition changes.

## First commands on another machine

```bash
git clone git@github.com:aleetreny/aleetreny.github.io.git
cd aleetreny.github.io
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
pnpm check
pnpm build
pnpm dev
```

To continue a published branch other than `main`, run `git switch <branch>` after
cloning. Do not recover files from the previous machine.

## Neon

- project: `divine-queen-66854519`, region `aws-us-east-2`, database `neondb`;
- production: `production` / `br-blue-dawn-ay0e37ed`;
- integration: `codex-integration` / `br-tiny-art-ayb43loi`;
- Auth, Data API, migrations 0001–0004, Storage, Function and the
  `portfolio-assets` bucket are live on both;
- the RLS matrix and the full Storage cycle were verified previously;
- production uses `NEON_PROTECT_DEFAULT_BRANCH=false` because of a plan
  limitation; the workflow restricts production to `main` and requires
  `APPLY_PRODUCTION` to apply.

On another machine, repeat `pnpm exec neon auth`. Never copy tokens, connection
strings, passwords or sessions into chat or into the repository.

## GitHub Actions

Environments:

- `development`: Secrets `NEON_API_KEY`, `DATABASE_URL`; Variables
  `NEON_PROJECT_ID`, `NEON_BRANCH`, `NEON_PROTECT_DEFAULT_BRANCH`,
  `ALLOWED_ORIGINS`;
- `production`: the same names, restricted to `main`.

`provision-neon.yml` uses `pnpm exec neon`. Run `plan` first; `apply` on
production requires the documented literal confirmation. `deploy-pages.yml`
builds and publishes without depending on any particular machine.
`seed-content.yml` loads the catalogue and settings into a chosen environment.

## Concrete next steps

1. clone `main` and run the commands above;
2. review the text, order and emphasis subjectively from `/?owner=1` with the
   real account;
3. create a branch for any new change, and use an isolated Neon branch before
   touching the schema;
4. run `pnpm check`, `pnpm build` and `pnpm portability:verify` before publishing
   again;
5. repeat the public and administrative audit if interaction, linked content or
   authentication changes;
6. run `seed-content.yml` (development, then production) after any change that
   alters the **shape** of the fixtures.

## Known errors and limitations

- Neon JS/Auth/Data API/Storage/Functions are in beta.
- Storage/Functions require `aws-us-east-2` in this architecture.
- A successful PUT followed by a SQL failure can leave an orphaned object.
- Pages can be switched back to a branch source by manual configuration; check
  that the public `index.html` references `/assets/index-*.js`, never
  `/src/main.tsx`.
- Card positions are deliberately explicit; adding to the board means checking
  the composition and mobile again.
- The public catalogue was written from public sources; the owner should review
  any professional nuance they would phrase differently.

## Decisions still open

- final wording and catalogue order;
- the storage provider, if Neon beta/region stops fitting;
- a domain and an OAuth provider;
- the retention/versioning policy;
- a future filterable view alongside the canvas, as long as it does not remove
  the board's identity.

## Sensitive points

Do not move secrets into `VITE_*`; do not grant writes on authentication alone;
do not expose `app_private`; do not disable RLS; do not delete the terminal
backup; do not edit applied migrations; do not make private repository details
public; do not promote to production without a plan and a confirmation.
