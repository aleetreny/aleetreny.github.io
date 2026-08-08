# Architecture

## Goal

Keep the public portfolio fast and static, with an owner area able to edit
content without hosting secrets on GitHub Pages. GitHub holds everything
reproducible; Neon holds the real data and files.

```mermaid
flowchart LR
  V["Visitor"] --> P["GitHub Pages\nReact + Vite"]
  O["Owner"] --> P
  P --> A["Neon Managed Better Auth"]
  P --> D["Neon Data API"]
  D --> R["Neon Postgres\nGRANT + RLS"]
  P --> F["Neon Function\nstorage broker"]
  F --> A
  F --> R
  F --> S["Neon Object Storage\nportfolio-assets"]
  P --> S
  G["GitHub Actions"] --> P
  G --> N["neon.ts + migrations"]
  N --> A
  N --> D
  N --> R
  N --> F
  N --> S
```

## Responsibilities

- **GitHub Pages:** serves `dist/` and nothing else; it runs no backend and
  stores no secrets.
- **Frontend:** presents the content as a pan/zoom board with expandable
  dossiers; renders fixtures when there is no backend and, with Neon, queries
  content and manages the session.
- **Auth:** creates sessions/JWTs. Being authenticated is not being the owner.
- **Data API:** turns SDK queries into Postgres operations and picks the role
  from the JWT.
- **Postgres:** is the authority on permissions, through roles, the allowlist
  and RLS.
- **Storage broker:** verifies the EdDSA/JWKS JWT and the allowlist, limits
  formats and size, and signs short-lived S3 operations.
- **Object Storage:** holds the bytes; `assets` holds identity, paths and
  metadata.
- **Actions:** validates every change, deploys Pages and offers controlled Neon
  provisioning.

## Flows

### Public read

The anonymous client gets an anonymous token from Neon; the Data API uses the
`anonymous` role. Policies expose `published`, non-deleted entries, their blocks
and public settings. Published image URLs travel inside the blocks; the `assets`
table is not exposed to visitors.

### Owner

Better Auth creates the session. `public.is_owner()` matches `auth.user_id()`
against `app_private.owner_accounts`. Only then does RLS allow CRUD. An account
registered outside the allowlist cannot write.

### Images

S3 credentials exist only inside the Neon Function. The browser receives a PUT
URL scoped to one object, one Content-Type and five minutes. Reads are public
because the portfolio is public; moving to a private bucket would require signed
GET URLs.

## GitHub Pages compatibility

No server routes and no SSR. Owner mode is `/?owner=1`, so a reload does not
depend on a 404 fallback. Vite uses base `/` because the repository is a User
Page (`aleetreny.github.io`).

## Degradation

If Neon is not configured the build is still valid and uses
`fixtures/demo-content.json`; owner mode explains what is missing. If Neon fails
in production the UI shows an error and does not silently swap real data for
fixtures.

## Sources of truth

- code/configuration: GitHub;
- schema: `db/migrations/`;
- Neon infrastructure: `neon.ts` + secure variables;
- real data: Neon Postgres;
- bytes: Neon Object Storage;
- project state: `PROJECT_STATUS.md` and `docs/handoff.md`.
