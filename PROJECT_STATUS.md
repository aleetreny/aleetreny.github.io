# Project status

Updated: 2026-08-27. Branch: `main`. Release: `portfolio-v2.0.1`.

## v2.0.0 release (2026-08-26)

- the live passport is now the versioned source: sixty real stamps over fifteen
  leaves, with its Spanish writing preserved and a hand-reviewed English slot
  beside every place, city and note;
- the remaining owner panels and desk-object labels now use the central ES/EN
  catalogue, including dynamically generated presets, routes, traits, species,
  shapes and all eighteen passport inks;
- the first visit has a DOM-level world gate, so a lazy object cannot flash for
  a frame; only the thirteen guided cards appear during the walk;
- the ending is a distinct `outro`: first the camera fits the complete slate,
  then paper settles and all thirty-three objects arrive on staggered meteor
  paths using compositor-only Web Animations;
- desktop and 390×844 mobile runs were inspected in a real browser, the thirteen
  stops were counted one by one, and the Spanish/English passport was walked to
  leaf fifteen;
- the backwards book turn no longer leaves the previous leaf over the new one.

## The desk: thirty-three objects on the same slate (2026-08)

The board's first layer is a portfolio and stays one. The second is furniture:
thirty-three things lying on the slate that do something when you touch them — a
book whose leaves turn, a coin that is not fair, a Gray–Scott dish, a slime
mould that grows a network between the food you drop, a passport with a stamp
per country, a camera that photographs the board it is standing on, a black hole
with a real gravitational lens in it, and a garden the visitors plant.

The whole design is one decision: **an object is furniture, a card is content.**
A card is written, translated, seeded, versioned and read; an object is a thing
on a table. They share a slate, a camera and a light source, and nothing else.
The full proposal, the maths behind each simulation and the performance strategy
are in [docs/desk-objects.md](docs/desk-objects.md).

What holds them together (`src/lib/world/`):

- **one animation loop** for everything, which starts on the first subscriber
  and stops dead on the last — measured at zero frames a second with the board
  panned away from every object;
- **one physics integrator**, with traits (`draggable`, `physics`, `gravity`,
  `blackhole`, `paintable`, `capture`, `heavy`) instead of types, which is what
  lets the paint gun stain the passport and the coin be thrown into the hole
  without any of the three knowing the others exist;
- **positions on a ref, not in React state** — a physics step at sixty frames a
  second is not a render, and the camera and the tour already work this way;
- **`IntersectionObserver` on every heavy object**, so a simulation that is not
  on screen is not running;
- **`React.lazy` for the ten canvas objects**, so the board is complete and
  usable before any of them arrive.

What visitors leave behind goes to Postgres when there is one and to their own
browser when there is not, so every object works with no services at all.
`db/migrations/0008_visitor_world.sql` adds four tables under one rule: an
anonymous visitor may add their own row and read nothing that identifies anybody
else. Where they genuinely need to read something back — their own plant, the
state of the plot, the running tally of the vote — they go through a
`security definer` function that returns exactly that, rather than a table grant
that would have to be fenced in afterwards. One plant per visitor and a
four-hour watering interval are enforced in the database, not hoped for in the
client.

The board itself was laid out again for this: nothing overlaps, the twelve
numbered cards reach all four sides, and the loose things are spread across the
slate rather than heaped at one end. The slate is 730px wider to make room,
which costs the opening view nothing on any screen wider than it is tall.

The guided tour changed at the same time. It used to halt twenty-two times,
several of them on a loose photo, which is a halt on nothing. It now halts
thirteen times — the title and the twelve numbered cards. Everything else stays
behind the world gate until the final pull-back, then paper settles and the
objects cross the slate on staggered meteor paths.

## Writing articles: wording, typing and translation (2026-08)

The board was being used in earnest to write Spanish articles, which surfaced
four things.

- **Type went soft past about 1.5× zoom.** `.desk__board` declared
  `will-change: transform` permanently, which pins it into a composited layer
  rasterised once and then stretched by the GPU — so zooming magnified the
  bitmap instead of redrawing the text. The hint is now applied for the duration
  of a gesture and dropped once the view settles, so the browser re-rasterises at
  the scale the owner stopped at. `text-rendering: geometricPrecision` on the
  board and the article keeps outlines from being hinted for one size only.
- **The chrome was English and not editable.** `entries`, `fit`, `close · esc`,
  `+ point`, `N entries` and about 190 other strings were literals in the
  components. They now come from `src/lib/ui-text.ts`, which ships a Spanish and
  an English default for every key, and the `textos` panel overrides any of them
  per language into `site_settings['site.ui']`. An override is read only for its
  own language, and an empty one falls through to the built-in text, so the
  interface can never be blanked. The seed never writes the key, so reseeding
  leaves the owner's wording alone.
- **Typing lost and duplicated text.** A bare `contentEditable` read back with
  `textContent`: `Enter` inserted a `<div>` that concatenated two lines with no
  separator, that `<div>` was a node React could not remove so the commit's
  re-render showed the last line twice, and pastes brought their markup along.
  Every field now goes through `useEditable`: insertions are intercepted at
  `beforeinput`, the element holds text nodes only, a drift check remounts a
  field whose DOM stops matching the model, and empty fields carry a placeholder
  so they are still clickable. `Enter` splits a paragraph or a bullet into a new
  one, `Shift`+`Enter` breaks the line.
- **Saving dropped edits.** One pending slot meant a second entry edited while
  the first was in flight replaced it; and the queued payload carried the version
  from edit time, which was already stale if a save had completed in between —
  the rejected write took the text with it. There is now a queue keyed by entry,
  the version is stamped from the last one the server acknowledged, a conflict
  re-reads the counter and writes again instead of discarding, nothing leaves the
  queue until the server takes it, and the article shows `guardando…` /
  `guardado` / `sin guardar · reintentar`.

### Why translation did not work

Investigated end to end against the live services. Five separate causes, all
fixed:

1. **Quality.** MyMemory's `responseData.translatedText` is the best entry in a
   crowd-sourced *memory*, not its machine translation, and a loose fuzzy match
   frequently outranks the real one — *"Hola mundo, esto es una prueba"* came
   back as *"hello this is a test 123"*. The machine entry sits in `matches`;
   that is what is read now, with an exact memory match second and the headline
   answer last.
2. **Scope.** Every press translated the whole board — 144 fields, ~9.000
   characters on the seeded content alone — against a free allowance of ~5.000 a
   day anonymously. The default scope is now the open article; the whole board is
   a separate, deliberate button.
3. **All-or-nothing.** Results lived in a local variable that the throw skipped
   past, so a run that got nine tenths of the way through saved nothing. Work is
   committed in batches of six as it goes.
4. **Concurrent edits were overwritten.** The finished run called `setEntries`
   with a list captured before the first request, silently discarding anything
   typed during it — with `translate as I write` on, a real risk every ninety
   seconds. Every merge now happens against the live state.
5. **Edits never reached the other language.** Only empty slots were filled, so
   rewriting the Spanish left the English on its first translation for ever, and
   the board answered "nothing left to translate". `Alt`+press refreshes.

Plus: a retry ladder for throttling, a spent daily allowance reported as such
rather than as a network error, MyMemory's contact address wired in for its ten
times larger quota, and line breaks translated line by line instead of collapsed.
A third provider is offered — the keyless endpoint Google Translate's own widget
calls, better prose and no practical ceiling, but undocumented and quick to
rate-limit a shared address, so it is a choice and never the default. The
`function` route with a server-side DeepL or LibreTranslate key remains the
answer for guaranteed volume.

No reseed is required for any of this: `site.ui` is optional and absent from the
fixtures, and no stored shape changed.

## The board as a template (2026-08)

The repository is now usable as a template: fork it, replace
`content/source/*.mjs`, and it is your portfolio. The published site is the
worked example. [`docs/handbook.md`](docs/handbook.md) documents every feature
and every editable setting.

## Guided tour and editable backdrop (2026-08)

- The board stopped being the viewport and became a **finite slate hanging on a
  wall**: `.desk__plate` with a frame, four corner studs, plaster grain and a
  vignette. With `theme.backdrop.plate = false` it returns exactly to the
  previous edge-to-edge board, so nothing was lost.
- A **guided tour** in `src/components/DeskBoard.tsx` (phases `pre` → `tour` →
  `live`): the slate slams onto the wall and the visitor walks it stop by stop
  while each piece is stuck on. The pure logic lives in `src/lib/tour.ts`
  (routes, cameras, reveals, easing curves) and the bar in
  `src/components/desk/TourBar.tsx`.
- Everything is editable live from the tour panel
  (`src/components/desk/TourPanel.tsx`), stored in `site_settings['board.tour']`:
  nine route shapes, three ways to advance, eight camera motions over nine
  curves, nine landing animations with order and stagger, five slate arrivals,
  and the whole bar with its labels. The stop editor creates, renames, reorders,
  deletes and composes stops piece by piece.
- The backdrop is edited from the theme panel: seven walls plus a two-colour
  custom one, grain, vignette, margin, frame, shadow, studs, and the slate's
  pattern (`plate`, `viewport` or none) with its scale.
- Fixes the tour exposed: drawer row caps with `+ N more` (`work` 4, `edu` 4,
  `lab` 6, `vol` 4, `hack` 4, `repos` 5, `travel` 8, `random` 5) and three
  positions (`travel`, `contact`, `note-1`) that removed a card collision.
- Accessibility: `prefers-reduced-motion: reduce` means no tour and a complete
  board; the bar is real Tab-reachable buttons; `Escape` always exits; nothing
  depends on the tour to be reachable.

## The phone walkthrough (2026-08)

A 4120px slate on a 390px screen is either a mosaic nobody can read or a maze
nobody can leave. Every fix under [Mobile](#mobile-2026-08) below made the board
*less bad* on a phone; none of them made it good, because the thing being fixed
was a canvas, and a canvas is not a phone interface. So a phone now gets a
different program: the same board, walked.

- **The route is the tour.** `src/lib/mobile.ts` reads `board.tour` through the
  same `buildStops` the desktop camera uses and turns each stop into one screen:
  its heading, the card it frames, and any other card it carries — the player
  under the podcast. Pure, and covered by `src/lib/mobile.test.ts`.
- **A screen is a card, and one short list says which cards.** Scraps and
  stamps are drawn marks; the `now` card repeats the top of the work drawer two
  screens later and the cover reads better as the name alone. The instant
  photographs and the pinned notes are what the eye rests on between one drawer
  and the next on a slate, not something to scroll past in a column. None of it
  is drawn, a generated route never stops on any of it, and all of it is still
  on the full slate, one tap from the last screen.
- **Nothing to maintain twice.** Rename a stop, reorder the walk or add a card
  from the tour panel and the phone follows, in both languages. The sheets are
  the board's own `.card__surface--*` tones and the article is the board's own
  `db-*` typography, so a look picked in the theme panel recolours both.
- **Navigation a thumb already knows.** A 46px `next`, a swipe with velocity and
  rubber-banding at the ends, a progress rail whose ticks are jumps, and an
  index sheet that opens on the screen you are standing on. A jump of more than
  one screen cuts instead of sliding. A dossier is a pushed screen, and the
  phone's own back gesture closes it — as it does the index sheet.
- **What it costs.** The walkthrough is 20 kB (6 kB gzipped) against the board's
  103 kB, and the two are separate lazy chunks chosen in `App.tsx`, so a phone
  never downloads the camera, the world loop or the editing panels. Photographs
  load for the screen on show and its two neighbours; the music player mounts
  only on the screen it belongs to.
- **The door back.** The last screen and the index sheet both open the whole
  slate at `?board=1`, with a return chip and the back gesture; it arrives
  without replaying the tour the visitor has just walked by hand (`skipTour`).
  `?owner=1` always gets the board, because that is where the editor lives.
- **Verified in a browser**, not in a mental model: all thirteen screens at
  390×844 and 375×667, the 320px case, landscape at 844×390, both languages, the
  index sheet, the pushed article, the history stack after every open and close,
  and the desktop board re-checked for regressions.

## Mobile (2026-08)

The board is drawn on a 2540px canvas, so a phone always sees a detail of it.
These are the phone behaviours of the **board itself**; since the walkthrough
above, they apply to a visitor who deliberately asks for the full slate.

- Touch gestures that did not exist before: pinch to zoom (anchored between the
  fingers), two fingers to pan, double-tap to frame a card or return to the
  overview. A pinch never opens a dossier and never moves a card.
- The tour adapts below 720px wide **or** 460px tall (a phone on its side is just
  as cramped): one piece per stop with phone padding, which multiplies each
  stop's scale by about 2.5× (0.22 → 0.55 on a 390px iPhone).
- The resting view (on load and when the tour ends) frames the first card instead
  of a whole board illegible at 12%; `fit` still gives the overview.
- `centerNode` now fits by width as well as height — a 620px card ran off the
  sides of a phone.
- The toolbar drops from four rows (133px, 16% of the screen) to a single
  scrolling row of 48px with a faded edge; the owner bar no longer sits
  off-screen; the tour bar splits its heading and controls across two rows with
  40px tap targets.
- All of it is editable from the tour panel's `phones` group.

## Contrast, controls and framing (2026-08)

- Native controls on the dark panels declare `color-scheme: dark` and carry an
  opaque ground, so a `<select>` popup is no longer white-on-white. Every
  `<option>` is coloured explicitly for engines that style the popup from the
  control.
- Every control and every piece of chrome text was audited against WCAG AA in a
  real browser. Findings fixed: the `×` delete marks on dark panels (2.9:1), the
  tour bar hint (3.2:1), the photo-slot placeholder (3.2:1), the dossier position
  counter (4:1) and its photo captions (4.3:1). A 16px delete target in the
  dossier grew to 22px, and 26px on a coarse pointer.
- The owner's per-card controls counter-scale with the zoom, so a gear that
  rendered 6px tall at a fitted board is 24px again.
- Tour stops are framed closer: a smaller inflation and a higher zoom ceiling
  take stop one from 0.82× to 1.17× on a desktop, and from 0.55× to 0.57–0.87×
  on a phone.
- Every visible string, `aria-label` and error message has a Spanish and an
  English default, with owner overrides kept separate per language.

## Looks, article design and two languages (2026-08)

- **Twelve complete looks** in the theme panel — Working slate, Solarized Light,
  Nord, Gruvbox, Dracula, Catppuccin Latte, Tokyo Night, Rosé Pine Dawn,
  Everforest, Monokai, Newsprint and Brutalist. Ten are built on the published
  colour schemes they are named after, using their real values, and four are
  light boards. Each fully owns backdrop, cards, article and palette, so applying
  one is deterministic; none of them touch content, positions or the tour.
- The slate stopped being a fixed texture: `backdrop.slate`/`slate2`/`slateInk`
  colour it, and `pattern` draws one of nine patterns in an ink that follows the
  slate's brightness, so a grid survives on cream as well as on charcoal. Leaving
  the fields empty keeps the board style's own painting, so nothing shipped moved.
- Fixed with the light boards: the hero block hardcoded a cream, so its opening
  paragraph and hint were invisible on any pale slate. Everything painted on the
  slate now mixes towards `--board-ink`; text on the slate clears WCAG AA in all
  twelve looks.
- Fixed: `content_entries.title`/`.summary` are text columns, so the bilingual
  language maps were being stringified into them — every dossier on the public
  board was titled `[object Object]`. The languages now travel in `metadata.i18n`
  (jsonb, which already round-trips through `save_content_entry`) and the column
  keeps a plain projection. `src/lib/entry-storage.ts` is the only place the
  stored and app shapes meet.
- **Cards** gained an edge (six kinds), shadow, paper grain, padding, a fastener
  (tape, pin, clip, staple) and a hover behaviour (raise, straighten, tilt,
  glow), plus row tint and rule thickness.
- **Articles** gained width, measure, body face, size and leading, title size,
  weight, case and tracking, four opening-line styles, a drop cap, block
  numbering, a centred column, block gap, five entrance animations, and scrim
  darkness and blur.
- Display type gained a weight and a tracking control.
- Theme variables moved to the document element, so the dossier, the panels and
  the toolbars all follow the theme — previously only the board did.
- **Two languages** (`site.i18n`): prose becomes a per-language map in the same
  document, resolved once before render so no component knows a second language
  exists. Visitors get a remembered switcher that follows their browser on a
  first visit; the owner picks the language they are writing in and each one
  keeps its own text. Empty slots fall back rather than blanking.
- **Free machine translation at authoring time**, keyless by default
  (MyMemory, straight from the browser) with an optional Neon Function proxy for
  a server-side key. It fills in either direction, so a board written in English
  seeds the Spanish and Spanish drives the English from then on. Nothing about
  the published site depends on a translation service.
- The seeded content is tagged as English at build time, so writing Spanish over
  it adds a language instead of destroying the original.
- The content schema now accepts a language map for prose; `StoredPortfolioEntry`
  and `PortfolioEntry` name the two shapes and the localise step is the single
  place they meet.

## Done and verified

- a full-screen public board with pan, zoom, pinch, keyboard, visible controls, a
  jump index and per-section centring;
- a documented adult visual direction: a slate on a wall, straight dossiers, hard
  shadows, editorial typography and signal amber;
- verifiable public entries grouped into nine owner-editable lists;
- expanded dossiers with organisation, period, blocks, topics and public links;
- owner mode with the same visual identity, session recovery, inventory,
  creation, editing, states, trash and history;
- ten block types, accessible reordering and alternative buttons;
- transactional saving, optimistic locking, snapshots, restore and soft delete;
- Neon Auth, Data API, Postgres, RLS, Object Storage and Function deployed on
  `production` and `codex-integration`;
- the real owner account created and enabled in `app_private.owner_accounts`
  without sharing a password;
- the catalogue synchronised on both Neon branches, reseeded on `development` and
  then `production` after the looks and language work so that `site.i18n` exists,
  `theme` carries `cards` and `dossier`, and the seeded prose is language-tagged;
- the desk deployed: `0008_visitor_world.sql` applied and `board`, `board.layout`,
  `board.tour`, `board.objects`, `board.passport` and `board.world` seeded on both
  Neon branches, with the anonymous role's privileges verified against the policy
  they were written for;
- GitHub Environments `development` and `production` with `DATABASE_URL`,
  `NEON_API_KEY` and four public Variables;
- GitHub Pages configured with GitHub Actions and the rollback preserved in
  `backup/static-terminal-2025`;
- desktop and mobile audits driven in a real browser: the tour walked with
  keyboard and touch, back/jump/skip/loop/auto/scroll, every touch gesture, and a
  regression pass over dossiers, drag, `+ N more`, jumps, scatter/reset and
  reduced motion, with no console errors;
- local checks: repository scan, lint, types, 245 tests and build;
- documentation for the handbook, architecture, data, authentication, editor,
  storage, deployment, security, recovery, handoff and the desk objects;
- every one of the thirty-three objects driven by hand in a real browser: picked
  up, opened, drawn in, shot at, photographed, thrown into the black hole and
  recovered, with the guided tour rewalked end to end and no console errors.

## Partially implemented

| Item | State | Files | Dependency | Completion criterion |
| --- | --- | --- | --- | --- |
| Public content | Seeded in Neon | `fixtures/demo-content.json`, `scripts/db/seed.mjs` | the owner's later subjective review | text and links approved or adjusted from the editor |
| The book's pages | Binding complete, leaves deliberately blank | `src/lib/world/book.ts` | the owner's own or licensed text | leaves filled with writing there is a right to publish |

## Pending

No mandatory implementation, deployment, portability or QA work remains.
Subjective approval of the wording is an editorial review, not a technical
blocker, as is filling the book's remaining leaves.

The desk v2 shipped on 2026-08-26 in one pass: merged to `main`, CI green, Pages
deployed, then `seed-content.yml` run against `development` and `production`
with `only_settings=board,board.layout,board.tour,board.objects,board.passport,
board.world`. A targeted run applies the migrations first and touches no
dossier and no trash, which is why the 51 published entries and the 55 already
in the trash came through untouched. Verified afterwards on both branches:
`0008_visitor_world.sql` recorded, board at 4120×2500, 33 objects, 60 stamps,
thirteen tour stops, and the anonymous role holding `INSERT` on the notes and
the answers, `SELECT` on the questions, and nothing at all on the garden or the
votes — those are reached only through their `security definer` functions.

## Blocked

No active external or technical blockers.

## Optional

- a custom domain;
- Google/GitHub OAuth;
- privacy-respecting analytics;
- per-PR previews with TTL Neon branches;
- CSP/reporting and advanced rate limiting;
- automatic reconciliation of orphaned objects.

## Technical debt

- `@neondatabase/neon-js`, Auth, Data API, Storage and Functions are still beta;
- `src/types/database.ts` is manual and must be reconciled after migrations;
- there is no automatic retention policy for `entry_versions`;
- the Neon plan cannot protect the production branch, compensated by an
  environment limited to `main` plus `APPLY_PRODUCTION`;
- the repository's GitHub plan offers no required environment reviewers;
- board layout uses explicit positions: a new card needs design and a responsive
  check. The arrangement is now solved rather than eyeballed — see the layout
  pass described in `docs/desk-objects.md` — but adding a piece still means
  finding it a gap by hand;
- `src/types/database.ts` gained five tables and six functions for the visitor
  world, and is still written by hand.

## Do not break

- GitHub Pages must never receive secrets;
- authenticated is not the owner;
- RLS stays forced on every exposed table;
- `app_private` is never exposed to the Data API;
- upload URLs expire and only the Function knows the S3 credentials;
- applied migrations are immutable;
- `backup/static-terminal-2025` preserves the way back;
- Notion stays read-only and outside the runtime and the repository;
- private repositories are not described in the public portfolio.
