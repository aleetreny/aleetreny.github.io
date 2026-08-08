# The working board — handbook

Everything this template is, everything it does, and every knob you can turn
without opening an editor.

The live site at [aleetreny.github.io](https://aleetreny.github.io) is Alejandro
Treny's actual portfolio. It is also the worked example of this template: what
you see there is what a filled-in board looks like. Fork it, empty it, and it
becomes yours.

**Contents**

1. [What this is](#1-what-this-is)
2. [The visitor's board](#2-the-visitors-board)
3. [The guided tour](#3-the-guided-tour)
4. [Owner mode](#4-owner-mode)
5. [Settings encyclopedia](#5-settings-encyclopedia)
   · [theme](#51-theme) · [board](#52-board) · [board.layout](#53-boardlayout) · [board.tour](#54-boardtour)
6. [Dossiers and blocks](#6-dossiers-and-blocks)
7. [Where everything lives](#7-where-everything-lives)
8. [Making it yours](#8-making-it-yours)
9. [Keyboard, pointer and touch reference](#9-keyboard-pointer-and-touch-reference)
10. [Accessibility](#10-accessibility)

---

## 1 · What this is

A portfolio that is not a page. It is a **board**: one large canvas — 2540 × 2290
by default — with paper cards pinned to it. Drawers list your work, spotlights
feature one thing, instant photos and sticky notes fill the gaps. Clicking any
line opens a full-page **dossier**.

Three ideas hold it together.

- **The board is the index, not the summary.** Nothing is hidden behind a "read
  more" that never gets read. Every line on the board opens to a full page.
- **Everything is editable from the site itself.** Sign in on your own portfolio
  and every card, colour, position, photo and animation is editable in place. No
  code, no CMS, no rebuild.
- **The repository is the source of truth.** A clean machine can clone, install,
  provision, migrate, seed and deploy without recovering anything from a laptop.

### The stack

| Layer | What runs |
| --- | --- |
| Hosting | GitHub Pages, static build from Vite |
| App | React 19 + TypeScript |
| Auth | Neon Managed Better Auth (owner only) |
| Data | Neon Postgres via the Data API, with row-level security |
| Files | Neon Object Storage, through a signing Function |
| Fallback | Versioned JSON fixtures in the repo |

With `VITE_ENABLE_REMOTE_DATA=false` the whole site runs from the fixtures, with
no database at all. That is the offline safe copy, and it is also how you develop.

---

## 2 · The visitor's board

### The surface

The board is a finite **slate** hanging on a **wall**. Both are editable (see
[backdrop](#backdrop)). Turn the slate off and the texture fills the viewport
edge to edge, which is how the board looked before the slate existed.

### Moving around

| Action | Mouse / trackpad | Touch |
| --- | --- | --- |
| Pan | drag the board | one finger |
| Zoom | scroll wheel | pinch |
| Frame one card | double-click it | double-tap it |
| Zoom out to everything | double-click empty board, or `fit` | double-tap empty board, or `fit` |
| Move a card | drag it | drag it |

Zoom is clamped to 0.14×–2.4×. A pinch is anchored to the point between your
fingers, so it zooms and pans in one gesture. A pinch never lands as a click and
never moves a card, even if it started on one.

### The pieces

| Piece | What it does |
| --- | --- |
| **Hero** | Your name, tags and opening lines. No paper surface — it sits directly on the slate. |
| **Now** | What you are doing and what is next. Two clickable lines, each opening a dossier. |
| **Drawer** | A list card bound to one **list** (see [groups](#groups)). Every row opens its dossier. |
| **Spotlight** | One thing, given the whole card: a title, a blurb, optional stat grid, waveform or bar chart. |
| **Contact** | A links card. |
| **Instant photo** | A polaroid with a fillable photo slot and a caption. |
| **Sticky note** | A small marginal note, toggled by the theme. |

### Row caps and the overflow panel

A drawer with a `maxItems` cap shows that many rows and collapses the rest into
a `+ N more` row. Clicking it opens the full list in a panel. The header keeps
showing the **real** total (`21 entries`), so nothing is silently hidden.

### The toolbar

| Button | What it does |
| --- | --- |
| `fit` | Frame the whole board. |
| `scatter` | Throw every piece to a random position and tilt. |
| `reset` | Drop all position overrides, back to the authored layout. |
| `↻ tour` | Replay the guided tour from stop one. |
| jump list | Fly to a named card. The names come from each card's `jump` field. |
| `−` / `+` | Zoom out and in from the centre. |

On a phone the toolbar becomes a single horizontally scrolling row.

### Dossiers

Clicking a row, a spotlight or a `now` line opens its dossier: a full-page plate
with the entry's kicker, dates, title, opening line and body blocks. Arrow keys
page through every dossier on the board in list order; `Escape` closes.

---

## 3 · The guided tour

A first-time visitor does not get the whole board at once. The slate slams onto
the wall, and then they walk it stop by stop at their own pace while each piece
is stuck on. When the run ends the board is exactly the board that ships.

**The visitor is always in control.** `next` / `space` / `→` advances, `back` /
`←` steps back, `skip` / `Escape` leaves at any point. Panning and zooming inside
a stop is intended and never ends the run.

The tour is skipped entirely when the visitor prefers reduced motion, and when
you are signed in as owner — the editor must not fight an animation. You can
always replay it with `↻ tour` or the tour panel's **preview**.

Every number and every choice below is editable; see [board.tour](#54-boardtour).

### Route shapes

The route decides which pieces are shown together and in what order.

| Shape | Walk |
| --- | --- |
| `custom` | The stops you wrote, in your order. This is what ships. |
| `lists` | One stop per drawer list, then whatever is loose. |
| `columns` | Column by column, left to right, top to bottom inside each. |
| `rows` | Band by band, top to bottom, left to right inside each. |
| `reading` | Like reading a page: across, then down. |
| `spiral` | Ring by ring from the middle of the board outwards. |
| `clock` | Around the board, starting at twelve. |
| `random` | A fresh shuffle every time it plays. |
| `solo` | One piece per stop, nothing skipped. |

Every generated shape is rebuilt from the live board each run, so a card you add
later is never stranded. With **sweep up the leftovers** on, anything the route
missed gets a final stop of its own.

### Ways to advance

| Mode | Behaviour |
| --- | --- |
| `manual` | The visitor clicks `next` or presses space. |
| `auto` | Moves on by itself after the dwell. A pause button appears in the bar. |
| `scroll` | The wheel steps forward and back instead of zooming. |

### Camera motions

| Motion | Flight |
| --- | --- |
| `glide` | A straight, eased flight. |
| `arc` | Lifts over the board on the way across. |
| `swoop` | Pulls back mid-flight, then drops into the next stop. |
| `push` | Slides across first, zooms in after. |
| `pull` | Zooms out first, slides across after. |
| `drift` | Constant speed, no ease at all. |
| `spring` | Overshoots the mark and settles back. |
| `cut` | No travel — a hard cut. |

The camera interpolates the *framed centre point*, not the raw offset, so a
mid-flight zoom keeps the same thing in frame.

Nine easing curves are available for the flight: `inOutCubic` (the default),
`outSoft`, `inOutQuint`, `inOutSine`, `outCubic`, `outExpo`, `outBack`,
`inOutBack`, `linear`.

### How pieces land

| Style | Landing |
| --- | --- |
| `stick` | Thrown in from off-slate and pinned. The default. |
| `drop` | Falls in from above. |
| `rise` | Comes up from below. |
| `fade` | Plain fade, nothing moves. |
| `zoom` | Scales up past the mark and settles. |
| `flip` | Turns over onto its face. |
| `swing` | Swings in like it is on a hinge. |
| `slam` | Lands big and shrinks into place. |
| `none` | Appears with no animation. |

Within a stop, pieces land in `sequence`, `reverse`, `random` or all `together`.

### How the slate arrives

`slam` (from above, with shake, dust and studs), `fade`, `raise` (from below),
`sweep` (a wipe from the left), or `none`. The impact shake, the dust flash and
the corner studs popping in are three independent switches, so any arrival can
have any of them.

### On phones

The board is 2540px wide, so a phone is always looking at a detail of it.
Below 720px wide **or** 460px tall — a phone on its side is just as cramped, only
in the other direction — the tour walks the same route a few pieces at a time,
with padding a small screen can afford. That takes a stop from about 0.22× to
0.55× on a 390px phone. Every threshold is editable.

---

## 4 · Owner mode

### Getting in

Add `?owner=1` to the URL, or press `Shift+E` on the board. Sign in with the
account whose UUID is in `app_private.owner_accounts`. Nothing else in the
database will accept your writes — row-level security enforces it server-side,
not in the browser.

On a build without remote data, `?owner=1` unlocks the entire editor against
local state so you can try everything offline. A `preview` badge marks it, and
nothing is saved.

### The owner bar

| Button | Opens |
| --- | --- |
| `edit mode` | Toggles inline editing on the whole board. |
| `add: drawer / spotlight / photo / note` | Drops a new piece at the centre of the view. |
| `theme` | [Appearance panel](#51-theme). |
| `tour` | [Guided tour panel](#54-boardtour). |
| `entries` | [Inventory panel](#inventory). |
| `⏏` | Sign out. |

### Editing on the board

With edit mode on:

- **Text.** Every kicker, title, subtitle, blurb, caption and note is editable in
  place. Click it, type, click away. It saves on blur, debounced.
- **Position.** Drag any piece. The position, tilt and width are stored as an
  override in `board.layout`, leaving the authored values intact — `reset` drops
  the overrides.
- **Per-card settings.** The `⚙` on each card opens its menu: tone, custom
  background and ink, which list a drawer shows, its row layout, its row cap,
  which dossier a spotlight opens, and delete. The menu counter-scales with the
  zoom, so it stays usable however far out you are.
- **Photos.** Click a photo slot to upload. In production it goes to Neon Object
  Storage through a signing Function; offline it becomes a data URL.
- **Tool chips.** The chip row under a drawer is editable — add, rename, remove,
  or add the row to a drawer that has none.

### Inventory

The `entries` panel is the one place that is not on the board:

- **Create** a dossier in any list.
- **Lists**: rename, create, delete. Deleting a list moves its dossiers to
  another one rather than losing them, and asks first.
- **Move** any dossier between lists.
- **Delete** to a recoverable trash, and **restore** from it.

Nothing is ever hard-deleted. Entries, blocks and assets all use `deleted_at`,
and every save snapshots the previous version into `entry_versions`.

---

## 5 · Settings encyclopedia

Four documents in the `site_settings` table hold everything. They are plain
JSONB, public to read, owner-only to write. Every field below is editable from
the site; the seeded values come from `content/source/board-spec.mjs`.

A stored document is always **merged over the defaults**, field by field, so a
partial or older document keeps working and never blanks the board.

### 5.1 · `theme`

Appearance. Edited from the **theme** panel.

#### Board

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `boardStyle` | `blueprint` `cork` `graphite` `slate` `paper` `midnight` `sunset` | `slate` | The slate's texture and pattern. |
| `chaos` | 0 – 2 | 1 | Multiplies every card's tilt. 0 lays everything straight. |
| `showMarginalia` | bool | true | Whether sticky notes render at all. |
| `cardRadius` | 0 – 20 px | 0 | Corner rounding on every surface. |

#### Backdrop

Everything behind the cards.

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `plate` | bool | true | On: a finite slate on a wall. Off: the texture fills the viewport, edge to edge. |
| `wall` | `plaster` `concrete` `studio` `ink` `warm` `moss` `void` `custom` | `plaster` | The room the slate hangs in. |
| `wallColor` / `wallColor2` | hex | `#232629` / `#0a0b0d` | Centre and edge of the `custom` wall. |
| `grain` | 0 – 1 | 0.5 | Plaster grain over the wall. |
| `vignette` | 0 – 1 | 0.55 | Corner darkening over the wall. |
| `plateMargin` | 0 – 220 px | 58 | How far the slate reaches past the board box. |
| `frame` | 0 – 40 px | 10 | Inset frame thickness on the slate. |
| `plateShadow` | 0 – 1.6 × | 1 | Multiplier on the slate's drop shadow. |
| `studs` | bool | true | The four corner studs. |
| `studSize` | 6 – 60 px | 22 | Stud size. |
| `studInset` | 0 – 140 px | 34 | How far outside the board box they sit. |
| `grid` | `plate` `viewport` `off` | `plate` | Where the texture pattern is painted. `plate` scales with the zoom; `viewport` keeps a constant on-screen density; `off` is bare. |
| `gridScale` | 0.4 – 3 × | 1 | Multiplies the pattern size on the slate. |

With `plate: false` the wall, grain, vignette and studs stop rendering, and
`grid: plate` falls back to `viewport` — there is no slate to paint on.

#### Typography

| Field | Default | What it does |
| --- | --- | --- |
| `fonts.display` | Bricolage Grotesque | Headline family. Any CSS font stack. |
| `fonts.mono` | IBM Plex Mono | Body and UI family. |
| `fonts.scale` | 0.85 – 1.3 | Multiplies body copy across board and dossiers. |

Both families are plain CSS font stacks, so swapping in a webfont is one string
plus a `<link>` in `index.html`.

#### Colours

Thirteen tokens, each a hex or any CSS colour. They become CSS custom properties
on the viewport, so changing one restyles every surface that uses it.

| Token | Used by |
| --- | --- |
| `accent` | Links, drawer row rules, statistics, the more-row |
| `accent2` | The odd-one-out marks |
| `signal` | Amber: the `now` card, hackathons, the tour's next button and progress |
| `signalSoft` | Eyebrows, tour labels, owner marks |
| `lab` | The lab bench drawer's cool accent and its sweep |
| `paper` / `paperWarm` / `paperCream` | The three paper card surfaces and the dossier |
| `ink` | Text on paper |
| `dark` / `darkInk` | The dark card surface and its text |
| `slate` / `slateInk` | The slate card surface and its text |

### 5.2 · `board`

Structure and content of the cover. Edited on the board itself, plus the
inventory panel for lists.

| Field | What it is |
| --- | --- |
| `size` | `{ width, height }` of the canvas in board pixels. Default 2540 × 2290. |
| `groups` | The lists: `{ id, label }`. Fully dynamic — create, rename, delete at runtime. |
| `cards` | Every card on the board. |
| `polaroids` | Instant photos. |
| `marginalia` | Sticky notes. |

#### Groups

A **list** is a drawer's content. Each dossier carries a `group` in its metadata,
and a drawer card shows one group. Lists are owner-editable at runtime and
nothing in the code hardcodes a fixed set.

#### Card fields

Common to every card:

| Field | What it does |
| --- | --- |
| `id` | Stable identifier. Used by layout overrides and tour stops. |
| `type` | `hero` `now` `drawer` `spotlight` `contact` |
| `x` `y` | Position in board pixels. |
| `rot` | Tilt in degrees, multiplied by the theme's `chaos`. |
| `w` | Width in board pixels. |
| `jump` | Name for the toolbar's jump button. |
| `tone` | `paper` `paperWarm` `paperCream` `dark` `slate` `amber` `custom` |
| `bg` `ink` | Only for `tone: custom`. |
| `kicker` | The small uppercase line above the title. |
| `title` | The card's headline. `\n` breaks the line. |

Per type:

| Type | Extra fields |
| --- | --- |
| `hero` | `name`, `tags` (strings or `{label, accent}`), `intro`, `hint` |
| `now` | `label`, `current`, `currentTitle`, `currentSub`, `nextLabel`, `next`, `nextTitle`, `nextSub` |
| `drawer` | `group`, `layout` (`list` `compact` `grid` `notes` `atlas`), `maxItems`, `subtitle`, `intro`, `stats`, `tech`, `sweep`, `footer`, `footerLink` |
| `spotlight` | `open` (the dossier slug), `blurb`, `grid`, `waveform`, `bars`, `barCaption`, `ruled`, `footer` |
| `contact` | `links` (`[label, url]` pairs), `note` |

Drawer row layouts:

| Layout | Row shape |
| --- | --- |
| `list` | Title left, where · when right. |
| `compact` | Title, with the meta line stacked under it. |
| `grid` | Two columns, title over its first tag. |
| `notes` | Title over the entry's opening line. |
| `atlas` | A code column, the title, then the date. |

#### Instant photos

`id`, `x`, `y`, `rot`, `w`, `h`, `caption`, `placeholder` (the empty-slot text),
`tape` (the strip of tape on top), `assetUrl` (filled by uploading).

#### Sticky notes

`id`, `x`, `y`, `rot`, `w`, `style` (`amber` or `paper-dashed`), `text`.

### 5.3 · `board.layout`

Position overrides, written every time you drag something:
`{ [id]: { x, y, rot, w? } }`. The authored `x/y/rot/w` in `board` stay
untouched, so `reset` in the toolbar restores them by clearing this document.

### 5.4 · `board.tour`

The guided run. Edited from the **tour** panel. Only the authored route is
seeded; every behavioural default lives in `src/lib/tour.ts`, so a document that
carries just the stops still resolves to a complete configuration.

#### Run

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `enabled` | bool | true | Whether visitors get the tour at all. |
| `replay` | `always` `session` `once` | `always` | Every visit, once per browser session, or once ever on that device. |
| `advance` | `manual` `auto` `scroll` | `manual` | Who decides when to move on. |
| `dwell` | 600 – 20000 ms | 3200 | How long `auto` holds a stop. |
| `speed` | 0.3 – 3 × | 1 | Divides every duration in the run. |
| `loop` | bool | false | Restart after the last stop instead of ending. |

#### Route

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `route` | see [route shapes](#route-shapes) | `custom` | How the stops are laid out. |
| `groupSize` | 1 – 8 | 2 | Pieces per stop, for generated routes. |
| `includeRest` | bool | true | Append a final stop with whatever the route missed. |
| `stops` | `[{ id, label, items[] }]` | the 8 authored stops | The hand-written route. |

The stop editor creates, renames, reorders and deletes stops, and composes each
one piece by piece. Any generated route can be frozen into `custom` with **copy
into custom**, and then hand-edited.

#### Camera

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `motion` | see [camera motions](#camera-motions) | `glide` | The flight between stops. |
| `easing` | nine curves | `inOutCubic` | The curve the flight runs on. |
| `firstDuration` | 0 – 6000 ms | 950 | The first flight, which starts from the fitted board. |
| `duration` | 0 – 6000 ms | 760 | Every later flight. |
| `maxScale` | 0.2 – 2.4 × | 1.35 | How far in a stop is allowed to go. |
| `inflate` | 0 – 400 px | 38 | Breathing room around the stop's pieces. |
| `padX` | 0 – 400 px | 44 | Viewport padding at the sides. |
| `padTop` | 0 – 400 px | 58 | Viewport padding at the top. |
| `padBottom` | 0 – 500 px | 150 | Viewport padding at the bottom — this is what clears the tour bar. |
| `arc` | 0 – 400 px | 90 | Lift height, for `arc` only. |
| `swoop` | 0 – 0.7 | 0.28 | Mid-flight pull-back depth, for `swoop` only. |

Lower `inflate` and `padX`, or raise `maxScale`, to frame stops closer.

#### Phones

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `enabled` | bool | true | Whether the small-screen overrides apply. |
| `breakpoint` | 320 – 1400 px | 720 | Applies at or below this viewport width. |
| `shortSide` | 0 – 1000 px | 460 | And at or below this viewport height, for landscape phones. |
| `maxPerStop` | 1 – 8 | 1 | Longest a stop may be before it is split into consecutive sub-stops under the same heading. |
| `maxScale` | 0.2 – 2.4 × | 1.35 | Zoom ceiling on a phone. |
| `inflate` | 0 – 300 px | 12 | Breathing room on a phone. |
| `padX` / `padTop` / `padBottom` | px | 10 / 44 / 138 | Phone padding. |

#### Pieces

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `style` | see [how pieces land](#how-pieces-land) | `stick` | The landing animation. |
| `order` | `sequence` `reverse` `random` `together` | `sequence` | Order within a stop. |
| `easing` | nine curves | `outSoft` | The landing curve. |
| `duration` | 0 – 4000 ms | 560 | How long one piece takes to land. |
| `stagger` | 0 – 1500 ms | 150 | Gap between pieces in a stop. |
| `distance` | 0 – 600 px | 190 | Travel distance for the styles that fly in. |
| `blur` | 0 – 20 px | 4 | Motion blur. 0 turns it off. |

#### Slate

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `style` | `slam` `fade` `raise` `sweep` `none` | `slam` | How the slate arrives. |
| `hold` | 0 – 3000 ms | 340 | Empty-wall beat before it arrives. |
| `duration` | 0 – 4000 ms | 640 | The arrival itself. |
| `settle` | 0 – 3000 ms | 420 | Beat between landing and the first stop. |
| `shake` | bool | true | Impact shake of the whole viewport. |
| `dust` | bool | true | The dust flash. |
| `studs` | bool | true | Studs pop in one by one. |
| `studStagger` | 0 – 400 ms | 55 | Gap between studs. |

#### Tour bar

| Field | Default | What it does |
| --- | --- | --- |
| `show` | true | Whether the bar renders at all. |
| `position` | `bottom` | `bottom` or `top`. |
| `counter` | true | The `stop N / M` counter. |
| `label` | true | The stop heading. |
| `progress` | true | The progress track. |
| `dots` | false | One clickable dot per stop, to jump straight to one. |
| `hint` | `space / → next · drag & zoom anytime` | The hint line. Free text. |
| `nextLabel` `finishLabel` `backLabel` `skipLabel` | `next →`, `open the board →`, `← back`, `skip` | Every button's text. Free text. |

---

## 6 · Dossiers and blocks

A dossier is one `content_entries` row plus its ordered `content_blocks`.

| Field | What it is |
| --- | --- |
| `slug` | The stable identifier. Cards point at it. |
| `title` | The dossier headline. |
| `summary` | The opening line, set in italics under the title. |
| `entryType` | `project` `case-study` `experience` `education` `note` `custom` |
| `status` | `draft` or `published`. Only published entries are public. |
| `metadata.kicker` | The small line above the title. |
| `metadata.when` / `.where` | The date and place, shown as breadcrumbs and in drawer rows. |
| `metadata.group` | Which list it belongs to. |
| `metadata.order` | Its position within that list. |
| `metadata.code` | The short code an `atlas` drawer shows. |

### Block palette

Blocks are a flat ordered list, added, reordered and removed from inside the
dossier while editing.

| Block | What it renders |
| --- | --- |
| `heading` | A section title. |
| `text` | A paragraph. |
| `callout` | A highlighted note with an amber rule. |
| `quote` | A pulled quotation with an optional citation. |
| `list` | Bulleted points. |
| `metrics` | Value + label figures on a ruled band. |
| `image` | A photo slot with a caption. |
| `links` | External links. |
| `tags` | Filed-under keywords. |
| `divider` | A thin rule. |

Saving is transactional with optimistic locking: the entry's `version` is
checked, the previous state is snapshotted into `entry_versions`, and a
concurrent edit is rejected rather than silently overwriting.

---

## 7 · Where everything lives

```
content/source/          the authored board: theme, cards, lists, dossiers, tour route
  board-spec.mjs         theme, backdrop, cards, photos, notes, tour stops
  desk-data.mjs          every dossier's text
scripts/content/         pnpm content:build → fixtures
fixtures/                generated JSON: the offline copy and the seed payload
  demo-content.json      dossiers and their blocks
  site-settings.json     theme, board, board.layout, board.tour
src/
  components/DeskBoard.tsx      the board, the camera, the tour state machine
  components/desk/              cards, dossier, panels, tour bar
  lib/board.ts                  theme + board parsing, textures, walls
  lib/tour.ts                   routes, camera motions, reveals, easings
  lib/content-repository.ts     every read and write against Neon
  styles/global.css             the whole visual system
db/migrations/           schema, RLS policies, editor functions
docs/                    this handbook and the operational docs
```

The rule: **content and appearance are authored in `content/source/`**, compiled
to `fixtures/` with `pnpm content:build`, and seeded into Neon. After that, the
site edits itself, and `content/source/` only matters for a clean re-seed.

---

## 8 · Making it yours

### Run it locally, with no database

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173/?owner=1`. The whole editor is unlocked against
local state — every panel, every control, the tour, photo uploads as data URLs.
Nothing is saved, so you can break anything.

### Replace the content

1. Edit `content/source/desk-data.mjs` — your dossiers, their text and links.
2. Edit `content/source/board-spec.mjs` — your lists, cards, photos, notes, and
   the tour route.
3. `pnpm content:build`
4. `pnpm check` (lint, types, tests)

The offline site now shows your board. That alone is a deployable portfolio.

### Wire up Neon, so the site can edit itself

1. Provision with the `provision-neon.yml` workflow (or `pnpm neon:deploy`).
2. `pnpm db:migrate`, then create your owner account with `pnpm db:owner` and
   add its UUID to `app_private.owner_accounts`.
3. Run `seed-content.yml` for `development`, check it, then for `production`
   with `production_confirmation=APPLY_PRODUCTION`.
4. Set `VITE_ENABLE_REMOTE_DATA=true` plus the Neon URLs.

See [`docs/deployment.md`](deployment.md) for the full path, and
[`docs/authentication.md`](authentication.md) for how ownership is enforced.

### When a reseed is needed

Any change that alters the **shape** of the fixtures — a new settings key, a
renamed list, a new card field — needs the seed workflow run again, development
first. Changes you make from the site itself never need it: they are already in
the database.

### Deploying

Pushing to `main` builds and publishes to GitHub Pages. The workflow carries the
public Neon endpoints as defaults, so Pages stays recoverable even if repository
variables are lost.

---

## 9 · Keyboard, pointer and touch reference

### On the board

| Key | Action |
| --- | --- |
| `f` | Fit the whole board |
| `Shift+E` | Open the owner sign-in |
| `Escape` | Close whatever is open |

### During the tour

| Key | Action |
| --- | --- |
| `space` `enter` `→` `↓` | Next stop |
| `←` `↑` | Previous stop |
| `Escape` | End the tour and fit the board |

### In a dossier

| Key | Action |
| --- | --- |
| `→` | Next dossier |
| `←` | Previous dossier |
| `Escape` | Close |

Dossier keys take priority over tour keys, and typing in a field takes priority
over both.

### Pointer and touch

| Gesture | Action |
| --- | --- |
| Drag empty board / one finger | Pan |
| Wheel / pinch | Zoom |
| Double-click / double-tap a card | Frame that card |
| Double-click / double-tap the board | Fit everything |
| Drag a card | Move it (owner) |
| Two fingers | Pan and zoom together |

---

## 10 · Accessibility

- **Reduced motion.** `prefers-reduced-motion: reduce` skips the tour entirely —
  the board appears complete and still — and quiets the board's decorative loops.
- **Nothing depends on the tour.** Every stop's cards are on the board
  afterwards, and the toolbar's jump list reaches every section.
- **Real controls.** The tour bar, the toolbar and every panel are real
  `<button>`, `<select>` and `<input>` elements, reachable by Tab, with a visible
  amber focus ring. `Escape` always exits.
- **Contrast.** Every control and every piece of body text on the board's own
  chrome is checked against WCAG AA (4.5:1 for body, 3:1 for large text). Native
  controls declare `color-scheme: dark`, so browser-drawn widgets — select
  popups, spinners, scrollbars — are drawn dark rather than light-on-light.
- **Tap targets.** On a coarse pointer, controls grow to at least 36–40px. The
  owner's per-card controls counter-scale with the zoom so they never shrink
  below a usable size.
- **Labels.** Every icon-only button carries an `aria-label`; panels are
  `role="dialog"` with `aria-modal`; the tour bar's dots expose `aria-current`.
