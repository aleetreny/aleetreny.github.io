# Content editor

## Scope

Owner mode lives at `/?owner=1`. It recovers an existing session or shows the
login, then requires `public.is_owner()` to confirm the allowlist before reading
drafts or writing anything.

Editing happens in two places. Almost everything is **on the board itself**: see
[`handbook.md`](handbook.md) for the full walkthrough of inline text, drag,
per-card settings, photos and the theme and tour panels. The **inventory panel**
covers what has no place on the board:

- the entry inventory and creating new entries;
- title, slug, summary, type, status and presentation metadata;
- which list an entry belongs to, and its order within it;
- the recoverable trash and restoring from it.

Inside a dossier the owner edits the kicker, dates, title, opening line and the
whole block body.

## The block contract

Every block keeps a UUID, a type, a position, `props` and `layout`. Positions are
normalised before persisting. The public renderer falls back to plain text for an
unknown type and never interprets arbitrary HTML.

The palette is `heading`, `text`, `callout`, `quote`, `list`, `metrics`, `image`,
`links`, `tags` and `divider`.

## Transactional saving

`public.save_content_entry` does all of this in one transaction:

1. check ownership;
2. validate the expected version;
3. snapshot the version being left behind;
4. insert or update the entry;
5. temporarily deactivate blocks so swaps do not violate the unique index;
6. upsert and reorder the blocks;
7. soft-delete removed blocks;
8. bump the version and return the canonical document.

The client validates the document with Zod and turns a `40001` conflict into a
"reload before saving" instruction. Board and panel edits are debounced and saved
automatically; publishing an entry stays an explicit choice through its status.

## Images

The block asks `POST /uploads/presign` for a signed URL with the ephemeral Neon
Auth JWT, does the `PUT` directly, then registers metadata through
`public.register_uploaded_asset`. That function re-checks ownership, prefix,
bucket, MIME and size; the browser never receives bucket credentials.

## History

Before every update, restore or soft delete, an immutable snapshot is written to
`entry_versions`. Restoring a version or recovering from the trash first keeps a
full snapshot and then creates a new version; history is never rewritten.

## Infrastructure tests completed

- a real session and JWT propagation;
- RLS as a visitor, an authenticated non-owner and the owner;
- optimistic conflict;
- persisted reordering;
- upload, read, export, delete and import of a file;
- version restore, soft delete and recovery from the trash.

Automatic reconciliation of orphaned objects is still technical debt: if the PUT
succeeds and the SQL registration fails, manual maintenance is needed.
