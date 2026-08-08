# Data model

## Tables

### `app_private.owner_accounts`

The allowlist, not exposed by the Data API. `auth_user_id` logically references
`neon_auth.user.id`; there is no FK across managed schemas, so migrations stay
decoupled from Auth internals. `enabled` allows revoking without deleting
history.

### `content_entries`

The main editorial unit: `slug`, title, summary, type, status, cover asset, JSONB
metadata, version and dates. Valid statuses:

- `draft`: owner only;
- `published`: publicly visible, and requires `published_at`;
- `archived`: owner only until restored or soft-deleted.

Types: `project`, `case-study`, `experience`, `education`, `note`, `custom`.
They are `text` with a `CHECK`, which is easier to migrate than a Postgres enum.

The board renderer uses these documented JSONB keys, all optional and all
editable from owner mode:

- `group`: which list the entry belongs to, matching an id in `board.groups`;
- `order`: its position within that list;
- `kicker`: the small line above the dossier title;
- `when` and `where`: the period and place, shown in drawer rows and breadcrumbs;
- `code`: the short code an `atlas` drawer shows in its first column;
- `tags`: a list of keywords.

An entry with no `group` falls back to a default list, so nothing disappears.

### `content_blocks`

Blocks ordered by `position` within an entry. `block_type` selects the renderer;
`props` holds the content and `layout` the visual decisions. Both must be JSONB
objects. A partial index prevents two active blocks sharing a position.

```json
{
  "block_type": "text",
  "props": { "text": "..." },
  "layout": { "width": "wide", "align": "start" }
}
```

```json
{
  "block_type": "image",
  "props": { "url": "...", "alt": "...", "caption": "..." },
  "layout": {}
}
```

### `assets`

Metadata for each object: provider, bucket, key, public URL, MIME, bytes,
dimensions, alt text, JSONB and a public flag. The bytes do not live in Postgres.

### `entry_versions`

Immutable JSONB snapshots keyed by `(entry_id, version)`, with a reason and an
author. `save_content_entry`, `soft_delete_content_entry`,
`restore_content_entry_version` and `restore_deleted_content_entry` each keep a
complete version before leaving a state. Restoring from the trash recovers the
entry and its blocks from the last deletion snapshot and advances the optimistic
version.

### `site_settings`

Key/JSONB configuration. Only rows with `is_public` are readable by visitors; the
rest are owner-only. The four documents this project uses are `theme`, `board`,
`board.layout` and `board.tour` — every field is catalogued in
[`handbook.md`](handbook.md).

## Relationships

- an entry has zero or many blocks;
- an entry may reference a cover asset;
- an entry has zero or many versions;
- assets and entries store `owner_id` for traceability, even though the current
  policy is single-owner.

## Soft deletion

`content_entries`, `content_blocks` and `assets` use `deleted_at`. Public
policies exclude deleted rows. Physical deletion should only run during
maintenance/retention, after checking references and backups.

## Indexes

- public feed by `published_at desc`;
- owner inventory by `(owner_id, status, updated_at)`;
- active blocks by `(entry_id, position)`;
- a partial unique block position;
- public and per-owner assets;
- versions by entry/version descending.

## Versioning

`version` starts at 1; the editor uses 0 only for a new entry that has not been
persisted. The save operation:

1. reads the current version;
2. inserts the previous snapshot into `entry_versions`;
3. locks the row and compares the expected version;
4. increments the version;
5. returns a canonical document. Conflicts surface in the UI and never silently
   overwrite.

## RLS

The policies live in `0002_data_api_permissions.sql`. They are permissive per
operation: limited public reads, and an `owner_all` policy for allowlisted
authenticated users. The `app_private` schema grants no usage to API roles.

## TypeScript types

`src/types/database.ts` mirrors the contract the app consumes. On 2026-08-04 its
five tables and six functions were reconciled against production's
`information_schema`. The current Neon CLI does not generate Data API types, so
the contract is maintained by hand: after every migration, reconcile it again and
review the diff. Never accept a change that relaxes `status`, RLS or nullability
without an ADR or a migration.
