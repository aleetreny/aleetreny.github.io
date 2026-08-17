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
5. [Looks: changing everything at once](#5-looks-changing-everything-at-once)
6. [Two languages, one board](#6-two-languages-one-board)
7. [Settings encyclopedia](#7-settings-encyclopedia)
   · [theme](#71-theme) · [board](#72-board) · [board.layout](#73-boardlayout) · [board.tour](#74-boardtour) · [site.i18n](#75-sitei18n)
8. [Dossiers and blocks](#8-dossiers-and-blocks)
9. [Where everything lives](#9-where-everything-lives)
10. [Making it yours](#10-making-it-yours)
11. [Keyboard, pointer and touch reference](#11-keyboard-pointer-and-touch-reference)
12. [Accessibility](#12-accessibility)

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

![The board, live](images/board-01-live.jpg)

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
| Move a card | unlock `🔒 positions`, then drag it | unlock `🔒 positions`, then drag it |

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

| | |
| --- | --- |
| ![An empty wall](images/tour-01-empty-wall.jpg) | ![The slate has landed](images/tour-02-slate-landed.jpg) |
| **1.** An empty wall, for a third of a second. | **2.** The slate slams on; the studs pop in. |
| ![The first stop](images/tour-03-first-stop.jpg) | ![Mid-run](images/tour-04-mid-run.jpg) |
| **3.** The camera flies to the first stop and the pieces are stuck on. | **4.** Every stop adds to what is already there. |

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

| | | |
| --- | --- | --- |
| ![The tour on a phone](images/phone-01-tour.jpg) | ![The board on a phone](images/phone-02-board.jpg) | ![An article on a phone](images/phone-03-article.jpg) |

The board is 2540px wide, so a phone is always looking at a detail of it.
Below 720px wide **or** 460px tall — a phone on its side is just as cramped, only
in the other direction — the tour walks the same route a few pieces at a time,
with padding a small screen can afford. That takes a stop from about 0.22× to
0.55× on a 390px phone. Every threshold is editable.

---

## 4 · Owner mode

![The owner bar](images/owner-01-bar.jpg)

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
| `🔒 positions` | Locks every card, photo and note in place. It starts locked; press it deliberately to enable dragging. |
| `add: drawer / spotlight / photo / note` | Drops a new piece at the centre of the view. |
| `aspecto` / `theme` | [Appearance panel](#51-theme). |
| `visita` / `tour` | [Guided tour panel](#54-boardtour). |
| `artículos` / `entries` | [Inventory panel](#inventory). |
| `textos` / `wording` | [Interface wording panel](#interface-wording). |
| `⏏` | Sign out. |

The bar itself, like the rest of the chrome, is written in the language you are
writing in — and every word of it is editable. See
[interface wording](#interface-wording).

### Editing on the board

With edit mode on:

- **Text.** Every kicker, title, subtitle, blurb, caption, note and hero role
  badge is editable in place. Hero badges can also be added and removed. Click
  it, type, click away. It saves on blur, debounced.
- **What typing does.** Every editable field behaves the same way, on the board
  and in an article:

  | Key | What happens |
  | --- | --- |
  | `Enter` in a paragraph, a heading or a bullet | Splits it in two: a second block, or a second bullet, with the caret already in it. |
  | `Enter` in a callout, a quote, a title or an opening line | A line break inside the same field. |
  | `Enter` in a date, a place, a kicker, a tag or a citation | Confirms and leaves the field. |
  | `Shift` + `Enter` | Always a line break, never a split. |
  | `Escape` | Leaves the field, keeping what you typed. |
  | Paste | Arrives as plain text; the source's fonts, colours and markup are dropped. |

  Line breaks you type are kept and published. An empty field shows a greyed
  prompt of what belongs in it, so it is still there to click on.
- **Card statistics.** The large number/value pairs on a drawer are editable;
  add a statistic with `+ stat` or remove one with its `×` control.
- **Position.** Positions start locked. Press `🔒 positions` in the owner bar
  to unlock dragging, then drag any piece. The position, tilt and width are
  stored as an override in `board.layout`, leaving the authored values intact —
  `reset` drops the overrides.
![The per-card menu](images/owner-02-card-menu.jpg)

- **Per-card settings.** The `⚙` on each card opens its menu: tone, custom
  background and ink, which list a drawer shows, its row layout, its row cap,
  which dossier a spotlight opens, and delete. The menu counter-scales with the
  zoom, so it stays usable however far out you are.
- **Article blocks.** The left rail stays visible in editing mode without
  covering the text. Drag its `⠿` handle onto another block to reorder and use
  `×` to remove it. Blocks use the same left-aligned, medium-width layout by
  default, so the article keeps one consistent reading column. While dragging,
  hovering near the sheet's top or bottom edge scrolls the article for you.
  Select words in a paragraph, heading, callout, quote or bullet point to reveal
  its inline link editor. It can point to another published dossier or an
  external web address; click an existing link while editing to update or
  remove it.
- **Photos.** Click a photo slot to upload. In production it goes to Neon Object
  Storage through a signing Function; offline it becomes a data URL.
- **Knowing it saved.** An open article shows `guardando…` while a save is in
  flight and `guardado` once the database has it. If a save fails it says
  `sin guardar` and offers `reintentar`; what you typed stays in the queue until
  it goes through, and closing the tab with something still queued asks first.
- **Tool chips.** The chip row under a drawer is editable — add, rename, remove,
  or add the row to a drawer that has none.

### Inventory

![The inventory panel](images/panel-06-inventory.jpg)

The `entries` panel is the one place that is not on the board:

- **Create** a dossier in any list.
- **Lists**: rename, create, delete. Deleting a list moves its dossiers to
  another one rather than losing them, and asks first.
- **Move** any dossier between lists.
- **Delete** to a recoverable trash, and **restore** from it.

Nothing is ever hard-deleted. Entries, blocks and assets all use `deleted_at`,
and every save snapshots the previous version into `entry_versions`.

### Interface wording

Article prose lives in the documents and is edited in place. The words *around*
it — `artículos`, `encajar`, `cerrar · esc`, `añadir bloque`, every placeholder,
every toast — come from a catalogue with a built-in Spanish and English default,
and the `textos` panel lets you rewrite any of them.

- Each language keeps its own wording. Renaming a button in Spanish leaves the
  English board on its built-in English.
- An empty box means "use the built-in text", which is what the greyed prompt
  in each field shows you. `×` puts a single label back; the button at the foot
  puts the whole language back.
- Overrides live in `site_settings['site.ui']` as `key → { es, en }`. The key
  is shown above each box, so it is searchable and diffable.
- A key with no wording of its own falls back to the primary language and then
  to the built-in default, so a third language added later is never blank.

Reseeding does not touch it: `pnpm db:seed` upserts the keys the fixtures carry
and `site.ui` is not one of them.

---

## 5 · Looks: changing everything at once

**Where:** owner bar → `theme` → the row of buttons at the top.

One click sets the slate, the wall, the cards, the article **and the whole
palette** together. A look patches the theme — it never touches your text, your
card positions or your tour — so trying one on and going back costs nothing.
Each look fully owns every surface it describes, so applying it twice, or after
another one, always lands in exactly the same place. Only your fonts survive,
because a typeface is a personal choice.

Ten of the twelve are built on published colour schemes you may already know
from your editor, using their real values. Four are light boards.

| | |
| --- | --- |
| ![Working slate](images/look-working-slate.jpg) | ![Solarized Light](images/look-solarized-light.jpg) |
| **Working slate** — the original: a green-grey slate on a plaster wall, straight paper, hard shadows. | **Solarized Light** ☀ — Ethan Schoonover's daylight palette: base3 paper, cyan-blue ink, a calm serif article. |
| ![Nord](images/look-nord.jpg) | ![Gruvbox](images/look-gruvbox.jpg) |
| **Nord** — the arctic palette: polar-night slate, frost blues, snow-storm paper, a technical mono article. | **Gruvbox** — retro groove: charcoal slate, cream paper, burnt orange, taped photos and a drop cap. |
| ![Dracula](images/look-dracula.jpg) | ![Catppuccin Latte](images/look-catppuccin-latte.jpg) |
| **Dracula** — the purple classic: near-black slate, violet and pink, rounded cards that glow. | **Catppuccin Latte** ☀ — the soft light one: pale lavender-grey, rounded paper, a centred article, no rules. |
| ![Tokyo Night](images/look-tokyo-night.jpg) | ![Rosé Pine Dawn](images/look-ros-pine-dawn.jpg) |
| **Tokyo Night** — deep indigo, neon blue and violet, a starfield slate, numbered mono blocks. | **Rosé Pine Dawn** ☀ — the light rosé: blush paper, muted plum ink, pinned photos and a drop cap. |
| ![Everforest](images/look-everforest.jpg) | ![Monokai](images/look-monokai.jpg) |
| **Everforest** — soft forest greens on warm cream, a woven slate, stapled paper, a plain calm article. | **Monokai** — the editor classic: olive-black slate, hot pink and lime, heavy edges, upper-case titles. |
| ![Newsprint](images/look-newsprint.jpg) | ![Brutalist](images/look-brutalist.jpg) |
| **Newsprint** ☀ — bone paper wall to wall, no slate at all, inked rules, numbered blocks, a drop cap. | **Brutalist** — no shadow, heavy black edges, a red accent, everything flat and loud. |

☀ = a light board.

A look is a starting point, not a cage. Apply the closest one and then change
whatever you like underneath — every field it set is a field you can set.

### Why a light board is possible at all

The slate used to be one of seven fixed textures with its colour baked in, so
every look was some shade of dark. Two things changed that, and both are yours
to edit:

- **The slate is a colour.** `backdrop.slate` / `slate2` / `slateInk` — leave
  them empty and the board style paints the slate as it always did; set them and
  the slate is whatever you want. The ink picks itself by contrast unless you
  choose one.
- **The pattern is drawn, not baked.** `backdrop.pattern` gives you `dots`,
  `grid`, `graph`, `rules`, `weave`, `stars` and `diagonal` on top of `texture`
  (the board style's own) and `none`. It is drawn in `patternInk`, which follows
  the slate's brightness by default — so a grid stays visible on cream as well
  as on charcoal — at whatever strength `patternFade` says.

Both live in the theme panel, under **slate colour**:

![The slate colour controls](images/panel-07-slate-colour.jpg)

### The same article, four looks

The dossier follows the look too. This is one entry — same title, same opening
line, same blocks — under four of them. Nothing but `theme` changed between
these shots:

| | | | |
| --- | --- | --- | --- |
| ![Default article](images/article-01-default.jpg) | ![Newsprint article](images/article-02-newsprint.jpg) | ![Brutalist article](images/article-03-brutalist.jpg) | ![Catppuccin Latte article](images/article-04-sunbleached.jpg) |
| **Working slate** — a display face, an italic opening line, a 60-character measure. | **Newsprint** — upper-case title, a drop cap, numbered blocks, no scrim blur. | **Brutalist** — a 58px title, monospace body, a hard cut instead of an animation. | **Catppuccin Latte** — a centred column on white, a large plain lede, a soft scrim. |

### Building your own look

Everything a preset sets is in [`theme`](#71-theme). To design one from scratch:

1. **Start with the room.** `backdrop` → wall, and whether there is a slate at
   all. This is the single biggest decision; a board with no slate reads
   completely differently from one with a framed one.
2. **Then the paper.** `cards` → edge, shadow, grain, fastener. A borderless
   card with a soft shadow and a piece of tape is a photograph; a heavy-edged
   card with no shadow is a poster.
3. **Then the article.** `dossier` → measure and body size first, because those
   decide how it reads, then the title.
4. **Colour last.** The palette sits on top of a structure that already works.

![Cards and articles in the theme panel](images/panel-02-cards-and-articles.jpg)

---

## 6 · Two languages, one board

**Where:** owner bar → `theme` → **languages**, then the `ES` / `EN` buttons and
`⇄ translate` that appear in the owner bar.

Write in the language you think in. The other one is filled in for you, stored
next to it, and served as a static string like everything else.

![Languages in the theme panel](images/panel-03-languages.jpg)

### How it works

Any editable text becomes either a plain string or a small map — `{"es": "…",
"en": "…"}` — in the same document it always lived in. There is no second table
and no second site.

- **Visitors** get a switcher in the toolbar. Their choice is remembered, and a
  first-time visitor is offered the language their browser asks for.
- **You** get the same switcher in the owner bar, marking which language you are
  *writing*. Type in `ES` and only the Spanish changes; the English is untouched.
- **Empty is never blank.** A field with no translation yet falls back to the
  language that has one, so a half-translated board always reads.

| | |
| --- | --- |
| ![The owner's language switch](images/lang-01-owner-switch.jpg) | ![The visitor's language switch](images/lang-02-visitor-switch.jpg) |
| Writing in Spanish, with `⇄ translate` alongside. | What a visitor gets, bottom right of the toolbar. |

### Translating

There are two buttons, and the difference matters.

| Where | What it does |
| --- | --- |
| `⇄ traducir este artículo`, in an open article's bar | Fills the empty translations of *that article only*. |
| `⇄ traducir todo`, in the owner bar | Fills the empty translations of the whole board and every article. |

Hold **`Alt`** (or `Shift`) while pressing either one to *refresh* instead of
fill: text that already has a translation is translated again from the source
language. That is the way to push a rewritten Spanish paragraph into the
English — without it, a slot that already has something is left alone for ever.

Direction is decided per field, not fixed: whichever language has the text is
the source. A board already written in English can be seeded into Spanish, and
from then on your Spanish drives the English.

With **translate as I write** on, the article you are writing has its empty
slots filled by itself a few seconds after you stop typing. Deliberately narrow:
one article, empty slots only, never a refresh — a background pass that rewrote
text you had already corrected would be a worse bargain than doing nothing.

**Translation happens while you edit, never while a visitor reads.** The result
is stored, so the published site has no runtime dependency on any service. If a
translation service is down it costs you a button press, not your site.

#### When it runs out

The free translators have limits, and the board is honest about which one it
hit. Work is committed in small batches as it goes, so a run that stops half way
keeps everything it had already translated — press the button again later and it
picks up where it left off. If the day's allowance is spent you are told that in
so many words, rather than being shown a network error.

The whole seeded board is roughly 9.000 characters. MyMemory allows about 5.000
a day anonymously and ten times that once it knows who is asking, which is why
the board sends your account address as its contact parameter. Translating one
article at a time keeps you comfortably inside it.

### Choosing a translator

| Provider | What it needs | When to use it |
| --- | --- | --- |
| `mymemory` | Nothing to configure | The default. Keyless, called from the browser only while the signed-in owner edits. ~5.000 characters a day anonymously, ~50.000 with your address attached. It takes 500 characters per call, so long prose is split on sentence boundaries and rejoined. |
| `google` | Nothing to configure | The keyless endpoint Google Translate's own web widget calls. Noticeably better prose, a whole paragraph per call, no daily ceiling in practice — but undocumented, so Google can change or close it at any time, and a shared or datacentre IP address gets rate-limited quickly. A good second option, not a foundation. |
| `function` | A Neon Function and a provider key | Guaranteed prose or higher volume. See below. |
| `off` | — | You want to type both languages yourself. |

All three keyless routes are free and none of them is ever touched by a visitor.

#### A note on quality

MyMemory answers with the best entry in a crowd-sourced translation *memory*,
which is not the same thing as its machine translation — and a loose fuzzy match
on somebody else's sentence often outranks the real one. Asked for *"Hola mundo,
esto es una prueba"* it answers *"hello this is a test 123"*, while the machine
translation sitting further down the same response says *"Hello world, this is a
test"*. The board reads the machine entry, accepts a memory entry only when it
is the very same sentence, and falls back to the headline answer last. If your
translations used to come back subtly wrong, that was why.

#### Wiring up your own translator

The keyless routes are good, not guaranteed. For DeepL's free tier (500k
characters a month) or a self-hosted LibreTranslate, the key must stay
server-side — so it goes in a Neon Function beside the storage broker, which
already validates the owner's JWT.

1. Add a `POST /translate` route to the project's Function that accepts
   `{ texts: string[], from: string, to: string }` and answers
   `{ texts: string[] }`, in the same order and length.
2. Have it validate the `Authorization: Bearer <JWT>` exactly the way the upload
   route does, so only you can spend the quota.
3. Keep the provider key in the Function's environment, never in a `VITE_*`
   variable.
4. Set `VITE_TRANSLATE_FUNCTION_URL` to the Function's base URL.
5. Switch the translator to `function` in the theme panel.

### What is translated, and what is not

Translated: every card's kicker, title, subtitle, intro, name, hint, blurb and
note; drawer list names; photo captions and placeholders; sticky notes; a
dossier's title, opening line, kicker, date and place; and every prose block —
paragraphs, headings, quotes, list items, captions and alt text.

Also translated, separately and by hand rather than by machine: the interface's
own words — see [interface wording](#interface-wording).

Not translated, deliberately: ids, tone and layout names, list keys, URLs,
dates you typed as numbers, and the paired arrays — a card's `stats`, `links`,
`grid` and tool chips. Those hold structure as often as prose, and guessing
wrong would break the board rather than mistranslate it. Write those in whichever
language you prefer, or leave them as figures.

### Turning it off

A fork that wants one language switches **two languages** off in the theme
panel. The switcher disappears, nothing localises, and the board behaves exactly
as it does without the feature.

---

## 7 · Settings encyclopedia

Five documents in the `site_settings` table hold everything. They are plain
JSONB, public to read, owner-only to write. Every field below is editable from
the site; the seeded values come from `content/source/board-spec.mjs`.

A stored document is always **merged over the defaults**, field by field, so a
partial or older document keeps working and never blanks the board.

**Three ways to change any of them**, in the order you will actually use them:

1. **From the site.** Sign in, open the panel named under each section below,
   change the control. It previews instantly and saves itself. This is the
   normal way, and it needs no reseed.
2. **From the source, before you seed.** Edit `content/source/board-spec.mjs`,
   run `pnpm content:build`, then run the `seed-content.yml` workflow. Use this
   for a fresh fork or to reset a live board to a known state — it overwrites
   what is in the database.
3. **Straight in the database.** `update site_settings set value = … where key =
   …`. The escape hatch; nothing validates it but the app's own parser, which
   will drop anything it does not recognise rather than break.

### 7.1 · `theme`

Appearance. **Panel:** owner bar → `theme`.

![The theme panel](images/panel-01-theme.jpg)

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
| `grid` | `plate` `viewport` `off` | `plate` | Where the pattern is painted. `plate` scales with the zoom; `viewport` keeps a constant on-screen density; `off` is bare. |
| `gridScale` | 0.4 – 3 × | 1 | Multiplies the pattern size. |
| `slate` / `slate2` | hex or empty | empty | The slate's own colour, centre and edge. Empty means the board style paints it, exactly as before these existed. |
| `slateInk` | hex or empty | empty | What is written on the slate. Empty picks near-black or near-white by contrast. |
| `pattern` | `texture` `none` `dots` `grid` `graph` `rules` `weave` `stars` `diagonal` | `texture` | What is drawn on the slate. `texture` keeps the board style's own pattern; the rest are drawn in the pattern ink. |
| `patternInk` | `auto` `light` `dark` | `auto` | Light or dark pattern lines. `auto` follows the slate's brightness, which is what keeps a grid visible on a cream board. |
| `patternFade` | 0 – 2 × | 1 | How strongly the pattern reads. 0 is invisible. |

With `plate: false` the wall, grain, vignette and studs stop rendering, and
`grid: plate` falls back to `viewport` — there is no slate to paint on.

**To make a light board by hand:** set `slate` to something pale (say
`#fdf6e3`), leave `slateInk` empty so the writing turns dark by itself, pick a
`wall` that is not darker than the slate, and drop `vignette` to about `0.2`.
The slate's inner shadow lightens automatically once the slate is pale, so it
does not come out grey at the edges.

#### Cards

How a card is built as an object.

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `edge` | `hairline` `none` `heavy` `double` `dashed` `inked` | `hairline` | The border on every card surface. `inked` picks up the card's own ink colour. |
| `shadow` | 0 – 2.5 × | 1 | Multiplier on the drop shadow. 0 flattens the board completely. |
| `grain` | 0 – 1 | 0 | Paper grain over the surface. |
| `padding` | 8 – 48 px | 22 | Space inside a card. |
| `fastener` | `none` `tape` `pin` `clip` `staple` | `none` | What holds the card to the slate. Drawn in CSS, never on the hero. |
| `lift` | `none` `raise` `straighten` `tilt` `glow` | `none` | What a card does under the pointer. `straighten` rotates a tilted card upright. |
| `rowContrast` | 0 – 1 | 0.5 | How strongly a drawer row is tinted against its card. |
| `rowRule` | 0 – 10 px | 3 | The accent rule down the left of a row. 0 removes it. |

**To make the board feel like pinned photographs:** `edge: none`,
`shadow: 0.8`, `grain: 0.4`, `fastener: tape`, `lift: raise`.
**To make it feel like a printed page:** `edge: inked`, `shadow: 0.25`,
`fastener: none`, `rowRule: 0`.

#### Articles

The full-page dossier a card opens into. Measure and body size decide how it
reads; change those before anything else.

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `width` | 520 – 1400 px | 860 | The plate's width. |
| `measure` | 32 – 110 ch | 60 | Reading measure. Around 60–70 is comfortable; below 45 feels like a poem. |
| `bodyFace` | `display` `mono` | `display` | Body copy family. `mono` reads as technical. |
| `bodySize` | 12 – 26 px | 16.5 | Body size, before `fonts.scale`. |
| `bodyLeading` | 1.2 – 2.2 | 1.66 | Line height. |
| `titleSize` | 22 – 90 px | 46 | Title size ceiling; it still shrinks on a narrow screen. |
| `titleWeight` | 300 – 900 | 800 | Title weight. |
| `titleCase` | `none` `upper` `lower` | `none` | Forces the case of titles and headings. |
| `titleTracking` | -0.08 – 0.2 em | -0.03 | Title letter-spacing. Negative tightens. |
| `lede` | `italic` `plain` `large` `kicker` | `italic` | The opening line. `kicker` turns it into small uppercase mono. |
| `dropCap` | bool | false | A raised initial on the first paragraph. |
| `numbered` | bool | false | An ordinal in the margin of every prose block. |
| `centred` | bool | false | Centres the column instead of running it flush left. |
| `blockGap` | 4 – 56 px | 18 | Space between blocks. |
| `enter` | `plate` `fade` `rise` `sheet` `none` | `plate` | How the plate arrives. `sheet` wipes down like paper being laid out. |
| `scrim` | 0 – 1 | 0.78 | How dark the board goes behind it. |
| `scrimBlur` | 0 – 24 px | 5 | Blur on the board behind it. 0 keeps it sharp. |

**For a long read:** `measure: 66`, `bodySize: 17.5`, `bodyLeading: 1.75`,
`dropCap: true`, `lede: large`.
**For a technical note:** `bodyFace: mono`, `bodySize: 14.5`, `numbered: true`,
`lede: kicker`, `enter: rise`.

#### Typography

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `fonts.display` | any CSS stack | Bricolage Grotesque | Headline family. |
| `fonts.mono` | any CSS stack | IBM Plex Mono | Body and UI family. |
| `fonts.scale` | 0.85 – 1.3 | 1 | Multiplies body copy across board and dossiers. |
| `fonts.displayWeight` | 300 – 900 | 700 | Weight of every display headline on the board. |
| `fonts.tracking` | -0.05 – 0.3 em | 0 | Added to every display letter-spacing. Positive opens headlines right up. |

**To use a different typeface:** add its `<link>` to `index.html`, then put its
family name at the front of the stack — `"'Playfair Display', Georgia, serif"`.
Keep a real fallback at the end so the board never waits on a network font.

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

### 7.2 · `board`

Structure and content of the cover. **Edited:** on the board itself, plus the
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

### 7.3 · `board.layout`

Position overrides, written every time you drag something:
`{ [id]: { x, y, rot, w? } }`. The authored `x/y/rot/w` in `board` stay
untouched, so `reset` in the toolbar restores them by clearing this document.

### 7.4 · `board.tour`

The guided run. **Panel:** owner bar → `tour`. Only the authored route is
seeded; every behavioural default lives in `src/lib/tour.ts`, so a document that
carries just the stops still resolves to a complete configuration.

![The tour panel](images/panel-04-tour.jpg)

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

![The tour panel's camera group](images/panel-05-tour-camera.jpg)

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

### 7.5 · `site.i18n`

Languages. **Panel:** owner bar → `theme` → **languages**. See
[chapter 6](#6-two-languages-one-board) for how it behaves.

| Field | Values | Default | What it does |
| --- | --- | --- | --- |
| `enabled` | bool | true | Off means one language and no switcher, exactly as the board behaves without this. |
| `primary` | a language code | `en` | The language you author in. Everything falls back to it. |
| `languages` | `[{ code, label }]` | English, Español | Every language offered, in switcher order. Add or remove rows in the panel. |
| `auto` | bool | true | Translate a dossier's empty languages shortly after you stop typing. |
| `provider` | `mymemory` `function` `off` | `mymemory` | Where translations come from. |
| `remember` | bool | true | Keep the visitor's choice in their browser. |
| `followBrowser` | bool | false | Offer the language their browser asks for on a first visit. |

**To add a third language:** open the panel, press `+ language`, set its code
(`fr`) and name (`Français`), then press `⇄ traducir todo`. Nothing else changes
— the switcher, the fallbacks and the translator all work off this list. The
interface's own wording has no built-in French, so it falls back to the primary
language until you fill it in from the `textos` panel.

### 7.6 · `site.ui`

Interface wording. **Panel:** owner bar → `textos`. See
[interface wording](#interface-wording).

A flat map of `key → { es, en, … }`. Every key has a built-in default, so the
document is empty on a fresh install and holds only what you have changed.

```json
{ "owner.entries": { "es": "dossiers" }, "board.fit": { "es": "ajustar" } }
```

| Rule | Why |
| --- | --- |
| A language slot is read only for its own language. | Renaming a button in Spanish must not put the Spanish word on the English board. |
| An empty or missing slot falls through to the built-in wording. | The interface can never be blanked by a stray edit. |
| A plain string instead of a map applies to every language. | Only reachable by hand-editing the JSON; the panel always writes a map. |
| The seed never writes this key. | `pnpm db:seed` upserts the keys the fixtures carry, and this is not one of them, so reseeding leaves your wording alone. |

---

## 8 · Dossiers and blocks

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

### Links inside prose

While editing, select the exact words in a paragraph, heading, callout, quote
or bullet point. A small editor appears below that text: choose **another article** to
open a published dossier inside the portfolio, or **external website** and
enter its address. Selecting an existing link opens the same editor so it can
be changed or removed. Links are stored as safe text ranges rather than HTML,
and each language keeps its own ranges because a translation can change word
positions.

Saving is transactional with optimistic locking: the entry's `version` is
checked, the previous state is snapshotted into `entry_versions`, and a
concurrent edit is rejected rather than silently overwriting.

---

## 9 · Where everything lives

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

## 10 · Making it yours

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

## 11 · Keyboard, pointer and touch reference

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

## 12 · Accessibility

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
