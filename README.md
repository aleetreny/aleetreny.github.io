# The working board

A portfolio that is not a page. It is a **board**: one large canvas with paper
cards pinned to a slate hanging on a wall — drawers listing your work, spotlights
for the things worth a whole card, instant photos, sticky notes. Every line on it
opens a full-page dossier. Drag the paper, scroll or pinch to zoom.

**Live example: [aleetreny.github.io](https://aleetreny.github.io)** — Alejandro
Treny's actual portfolio, and the worked example of this template. Fork it, empty
it, and it becomes yours.

![The board](docs/images/board-01-live.jpg)

Two things make it worth forking:

- **Everything is editable from the site itself.** Sign in on your own copy and
  every card, colour, position, photo, dossier and animation is editable in
  place. No code, no CMS, no rebuild.
- **The repository is the source of truth.** A clean machine can clone, install,
  provision, migrate, seed and deploy without recovering anything from a laptop.

> **New here? Read [docs/handbook.md](docs/handbook.md).** It walks the whole
> thing feature by feature, with screenshots, and documents every editable
> setting: what it does, what it accepts, and how to change it.

## Twelve looks, one click

The theme panel ships with complete looks — slate, wall, cards, article and the
whole palette together. Ten of them are built on published colour schemes, using
their real values; four are light boards. A look never touches your text, your
positions or your tour, so trying one on costs nothing.

| | | | |
| --- | --- | --- | --- |
| ![Working slate](docs/images/look-working-slate.jpg) | ![Solarized Light](docs/images/look-solarized-light.jpg) | ![Nord](docs/images/look-nord.jpg) | ![Gruvbox](docs/images/look-gruvbox.jpg) |
| Working slate | Solarized Light ☀ | Nord | Gruvbox |
| ![Dracula](docs/images/look-dracula.jpg) | ![Catppuccin Latte](docs/images/look-catppuccin-latte.jpg) | ![Tokyo Night](docs/images/look-tokyo-night.jpg) | ![Rosé Pine Dawn](docs/images/look-ros-pine-dawn.jpg) |
| Dracula | Catppuccin Latte ☀ | Tokyo Night | Rosé Pine Dawn ☀ |
| ![Everforest](docs/images/look-everforest.jpg) | ![Monokai](docs/images/look-monokai.jpg) | ![Newsprint](docs/images/look-newsprint.jpg) | ![Brutalist](docs/images/look-brutalist.jpg) |
| Everforest | Monokai | Newsprint ☀ | Brutalist |

Underneath them, everything is a control of its own: the slate's own colour and
ink, nine drawn patterns with their ink and strength; card edge, shadow, grain,
padding, what fastens a card to the slate and what it does on hover; and for the
article, its width, measure, body face and size, leading, title size, weight,
case and tracking, opening-line style, drop cap, block numbering, gap, entrance
animation and scrim.

## Two languages, written in one

Write in the language you think in; the other is filled in for you and stored
next to it. Visitors get a switcher and a remembered choice. Machine translation
runs **while you edit, never while a visitor reads**, so the published site has
no runtime dependency on any service — and it is free, with no key needed to
start.

## The first visit

A visitor does not get the board all at once. The slate slams onto the wall, and
then they walk it stop by stop at their own pace while each drawer, photo and
note is stuck on. When the run ends the board is exactly the board that ships —
pan, zoom, drag, dossiers, toolbar.

`Escape` or `skip` leaves at any point, `↻ tour` replays it, and it never runs
under `prefers-reduced-motion: reduce` or in owner mode. Nine route shapes, three
ways to advance, eight camera motions and nine landing animations are all
editable from the tour panel.

## On a phone

Real touch: pinch to zoom, two fingers to pan, double-tap to frame a card. The
canvas is 2540px wide, so below 720px wide — or 460px tall, with the phone on its
side — the tour walks the same route a few pieces at a time with padding a small
screen can afford, the board rests on the first card rather than an illegible
whole, and the toolbar collapses to one scrolling row. Every threshold is
editable.

## How it runs

The public site is a static SPA. The versioned catalogue
(`fixtures/demo-content.json`, generated with `pnpm content:build`) holds the
dossiers, and `fixtures/site-settings.json` holds the board configuration:
`theme`, `board`, `board.layout`, `board.tour` and `site.i18n`.

With `VITE_ENABLE_REMOTE_DATA=false` it runs entirely from those fixtures, with
no database at all. With Neon configured it reads published content and settings,
and falls back to the safe copy if the service does not answer.

**Owner mode** lives at `?owner=1` (or `Shift+E`): it authenticates with Managed
Better Auth and grants editorial permission only if the UUID is in
`app_private.owner_accounts`. Changes persist to Neon —
`content_entries`/`content_blocks` through a transactional RPC with optimistic
locking, and `site_settings` for theme, layout and tour.

## Architecture

- GitHub Pages serves the static build produced by Vite.
- React + TypeScript render the portfolio and owner mode.
- Managed Better Auth issues the session/JWT.
- The Neon Data API queries Postgres and enforces `GRANT` + RLS.
- Neon Object Storage keeps images in the public-read `portfolio-assets` bucket.
- A Neon Function validates the JWT and the allowlist before signing each upload
  or delete; S3 credentials never reach the browser.
- GitHub Actions runs CI, deploys Pages and provisions Neon on demand.

The diagram and the trust boundaries are in [docs/architecture.md](docs/architecture.md).

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite 8, React 19, TypeScript 5.9, mobile-first CSS |
| Validation | Zod, ESLint, Vitest, TypeScript strict |
| Persistence | Neon Postgres, versioned SQL in `db/migrations/` |
| API | Neon Data API with `@neondatabase/neon-js` |
| Authentication | Neon Managed Better Auth + an owner allowlist + RLS |
| Files | Neon Object Storage + AWS S3 SDK + a Hono/Jose signing function |
| Infrastructure | `neon.ts` + the Neon CLI |
| Deployment | GitHub Pages through GitHub Actions |
| Temporary context | Notion, read-only; not a data source or a runtime dependency |

Auth, Data API, Functions and Object Storage are subject to Neon's current state
and limits. Functions and Storage currently need an `aws-us-east-2` project; read
[docs/storage.md](docs/storage.md) before creating one.

## Install from scratch

### Requirements

- Git 2.40 or later.
- Node.js 24 LTS recommended (the project's minimum is 22).
- pnpm 11.9 (`corepack enable && corepack prepare pnpm@11.9.0 --activate`).
- For remote mode: a Neon account with permission to create a project, branch
  and services.

### Clone and install

```bash
git clone git@github.com:aleetreny/aleetreny.github.io.git
cd aleetreny.github.io
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env.local
```

`.env.local` is never committed. To run with no services at all, keep:

```dotenv
VITE_ENABLE_REMOTE_DATA=false
```

### Develop, check and build

```bash
pnpm dev
pnpm check
pnpm build
pnpm preview
```

`pnpm check` validates the portability files and scans for obvious secrets, then
runs lint, typecheck and tests. `pnpm portability:verify` repeats install, tests
and build from a clean local clone of the committed branch.

Open `http://localhost:5173/?owner=1` to unlock the whole editor against local
state — every panel, the tour, photo uploads as data URLs. Nothing is saved, so
nothing can break.

## Make it yours

1. Edit `content/source/desk-data.mjs` — your dossiers, their text and links.
2. Edit `content/source/board-spec.mjs` — your lists, cards, photos, notes and
   the tour route.
3. `pnpm content:build`
4. `pnpm check`

That alone is a deployable portfolio, with no database. Wire up Neon when you
want the site to edit itself. [docs/handbook.md](docs/handbook.md) has the full
walkthrough and the settings encyclopedia.

## Configure Neon

### Create or link the project

1. Create or select a Neon project in `aws-us-east-2` if Object Storage and
   Functions will be used.
2. Install/authenticate the CLI: `pnpm exec neon auth`.
3. Link without committing the context: `pnpm exec neon link --project-id <project-id>`.
4. Create an isolated branch: `pnpm exec neon checkout development` (new branches
   expire after seven days under the `neon.ts` policy).
5. Review the plan: `pnpm neon:plan`.
6. Deploy Auth, Data API, the bucket and the function: `pnpm neon:deploy`.
7. Pull local variables: `pnpm exec neon env pull --file .env.local`.

`neon.ts` marks the default branch as protected. If your Neon plan allows zero
protected branches, set `NEON_PROTECT_DEFAULT_BRANCH=false` deliberately. The
`production` environment must accept only `main`, and the workflow requires
typing `APPLY_PRODUCTION` before applying; drop that exception when the plan is
upgraded. Do not use `--allow-protected` outside the deliberate production flow.

### Apply or restore the schema

With a private `DATABASE_URL` configured:

```bash
pnpm db:migrate
pnpm db:verify
```

A full restore with `psql` instead:

```bash
psql "$DATABASE_URL" -f db/schema.sql
```

The migrations require that `neon deploy` has already created the `anonymous`
and `authenticated` roles and `auth.user_id()`.

### Create the owner

1. Configure trusted domains and email verification in Neon Auth.
2. Create the account through the branch's signup flow.
3. Get the Auth user's UUID.
4. Add it to the allowlist over an administrative connection:

```bash
pnpm db:owner -- --user-id <auth-uuid> --email <address>
```

The email is private metadata and must not go into the repository or GitHub
Variables. An authenticated account that is not on the allowlist keeps public
read access and nothing more.

### Seed data and permissions

```bash
pnpm db:seed
pnpm db:verify
```

After a migration, refresh the schema cache from Neon Console > Data API or
through the Neon API. Then verify:

- anonymous: only published entries, their blocks, public assets and public settings;
- authenticated non-owner: the same reads, no writes;
- allowlisted owner: editorial CRUD and access to versions;
- the `app_private` schema: no permissions for the API roles.

More detail: [docs/authentication.md](docs/authentication.md) and
[docs/data-model.md](docs/data-model.md).

## Image storage

Neon Object Storage keeps files and database on the same branch. `neon.ts`
creates `portfolio-assets` with `public_read`: reads are public, writes need a
credential.

The upload path is:

1. the owner gets a JWT from Neon Auth;
2. it requests `POST /uploads/presign` from the Neon Function;
3. the function validates EdDSA/JWKS, checks `app_private.owner_accounts`, and
   the file's type and size;
4. it returns a five-minute PUT URL;
5. the browser uploads straight to the bucket and persists metadata in `assets`
   through the Data API.

Never put `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in `VITE_*` variables.
To recover files:

```bash
pnpm storage:export -- --output=backups/storage-safe-copy
pnpm storage:import -- --input=backups/storage-safe-copy
```

Backups are written with restrictive local permissions and are git-ignored; keep
them encrypted off this machine. See [docs/storage.md](docs/storage.md).

## Deployment

### GitHub Pages

1. In Settings > Pages, select **GitHub Actions** as the source.
2. Configure the Actions Variables listed below.
3. A push to `main` runs CI/build and `.github/workflows/deploy-pages.yml`
   publishes `dist/`.
4. `workflow_dispatch` re-runs the deploy by hand.

Repository or `github-pages` environment variables (all public):

- `VITE_ENABLE_REMOTE_DATA`
- `VITE_NEON_AUTH_URL`
- `VITE_NEON_DATA_API_URL`
- `VITE_STORAGE_FUNCTION_URL`
- `VITE_STORAGE_PUBLIC_BASE_URL`
- `VITE_TRANSLATE_FUNCTION_URL` (optional; only for a self-hosted translator)

The public Auth/Data API/Storage endpoints and `VITE_ENABLE_REMOTE_DATA=true`
have recovery defaults committed in the workflow; the Variables override them.
No private credential is ever bundled.

The expected domain is `https://aleetreny.github.io/`. There is no custom domain
and no `CNAME` file. If one is added it must also be configured in Settings >
Pages, DNS, Auth trusted origins and `ALLOWED_ORIGINS`.

### Provision Neon from GitHub

The manual workflow `.github/workflows/provision-neon.yml` supports `plan` and
`apply`. Create GitHub Environments `development` and `production` with:

- Secrets: `NEON_API_KEY`, `DATABASE_URL`.
- Variables: `NEON_PROJECT_ID`, `NEON_BRANCH`, `NEON_PROTECT_DEFAULT_BRANCH`,
  `ALLOWED_ORIGINS`.

Run `plan` first. `apply` deploys `neon.ts`, migrates and verifies. Here
`production` accepts only `main` and requires
`production_confirmation=APPLY_PRODUCTION`; add required reviewers if a future
GitHub plan enables them.

### Seed the content into Neon

The manual workflow `.github/workflows/seed-content.yml` loads the versioned
catalogue and board settings into the chosen environment's `DATABASE_URL`
(migrating, seeding and verifying). With `replace_catalogue=true` it moves any
entry outside this catalogue to the recoverable trash, so a first seed can
replace an older catalogue. `production` requires
`production_confirmation=APPLY_PRODUCTION`.

Regenerate the fixtures with `pnpm content:build` before seeding if you have
changed anything under `content/source/`. **A reseed is needed whenever the
fixtures change shape** — a new settings key, a renamed list, a new card field.
Changes made from the site itself never need one; they are already in the
database.

A full seed overwrites every dossier and every settings document from the
versioned copy, which is right for a fresh database and wrong for a live one you
have been writing in. `only_slugs` narrows a run to the dossiers you name —
`lab-kepler,lab-ica` — and then nothing else is written: no other entry, no
theme, no board, no trash sweep. Use it to publish a dossier rewritten in the
repository without putting the rest of the catalogue back to what this
repository last generated. Locally it is `SEED_ONLY=lab-kepler pnpm db:seed`.

If Pages fails, download the Actions logs, re-run `pnpm check && pnpm build` from
a clean clone, and dispatch the workflow again. The full rollback to the previous
site is documented in [docs/recovery.md](docs/recovery.md).

## Backup and import

```bash
# Public content and metadata only; never exports credentials
pnpm db:export -- --output=backups/public.json
OWNER_AUTH_USER_ID=<target-uuid> pnpm db:import -- --input=backups/public.json

# Bucket bytes
pnpm storage:export -- --output=backups/storage
pnpm storage:import -- --input=backups/storage
```

Private content exports are not part of these scripts. Do not use the repository
as a backup store.

## Carrying on

- Feature-by-feature status and completion criteria: [PROJECT_STATUS.md](PROJECT_STATUS.md).
- The full feature and settings reference: [docs/handbook.md](docs/handbook.md).
- Operational handoff to another machine: [docs/handoff.md](docs/handoff.md).
- Recovery and rollback: [docs/recovery.md](docs/recovery.md).

## Notion context

Notion may be consulted temporarily, read-only, to understand design or content
context. It is not synchronised, not a runtime source; no diary fragments are
stored and no writes are made. The exact record is in
[docs/notion-readonly-context.md](docs/notion-readonly-context.md).

## Licence and security

Code under the MIT licence; see [LICENSE](LICENSE) and
[ATTRIBUTIONS.md](ATTRIBUTIONS.md). Reporting and rotation guidance is in
[SECURITY.md](SECURITY.md) and [docs/security.md](docs/security.md).
