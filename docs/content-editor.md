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
`links`, `tags` and `divider`. Its labels and hints come from the wording
catalogue (`block.<type>`), so they follow the language being written.

A new block arrives **empty**, showing a placeholder rather than sample prose. A
block that arrived pre-filled with "Write something here." had to be selected and
deleted before it could be used, and a translation pass would happily copy that
sentence into the other language as if it were real content.

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

The client validates the document with Zod. Board and panel edits are debounced
and saved automatically; publishing an entry stays an explicit choice through its
status.

### The client's save queue

`DeskBoard` keeps a queue keyed by entry id rather than a single pending slot,
and stamps the version from the last one the server acknowledged rather than
from the edit that produced the payload. Both are corrections of real data loss:

- one slot meant a second entry edited while the first was in flight replaced it,
  so a pass that touched several dossiers persisted the first and the last only;
- a version taken at edit time was already stale if a save had completed in
  between, and the payload was cleared *before* the request, so the rejected
  write took the owner's text with it.

Nothing leaves the queue until the server has taken it. A `40001` conflict is not
surfaced as "reload before saving" any more: the text in hand is the newest thing
in play, so the client reads the row's current version back with `getEntryVersion`
and writes once more. A conflict that survives that leaves the payload queued and
the article shows `sin guardar` with a retry. The queue is flushed on
`beforeunload` and on `visibilitychange`, and a non-empty queue asks the browser
to confirm before the tab closes.

### The editable fields

Every field the owner types into — on a card, in an article, in a caption — goes
through `useEditable` (`src/components/desk/EditableText.tsx`). It exists because
a bare `contentEditable` read back with `textContent` loses and duplicates text:

- `Enter` made the browser insert a `<div>`, and `textContent` concatenated the
  two lines with no separator, so a line break silently destroyed a word
  boundary;
- that `<div>` is a node React never created and therefore cannot remove, so the
  commit's re-render left it in place and the paragraph showed its last line
  twice;
- a paste brought the source document's markup in with it.

So every insertion is intercepted at `beforeinput` and re-applied as plain text
or as an explicit line break, the element holds text nodes only, and a drift
check remounts a field whose DOM stops matching the model. `readEditable`
reconstructs `\n` from any element break that still gets through.

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
