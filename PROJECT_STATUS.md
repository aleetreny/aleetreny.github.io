# Project status

Updated: 2026-08-08. Branch: `main`.

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

## Mobile (2026-08)

The board is drawn on a 2540px canvas, so a phone always sees a detail of it.

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
- Every visible string, `aria-label` and error message is in English.

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
- the catalogue synchronised on both Neon branches;
- GitHub Environments `development` and `production` with `DATABASE_URL`,
  `NEON_API_KEY` and four public Variables;
- GitHub Pages configured with GitHub Actions and the rollback preserved in
  `backup/static-terminal-2025`;
- desktop and mobile audits driven in a real browser: the tour walked with
  keyboard and touch, back/jump/skip/loop/auto/scroll, every touch gesture, and a
  regression pass over dossiers, drag, `+ N more`, jumps, scatter/reset and
  reduced motion, with no console errors;
- local checks: repository scan, lint, types, 65 tests and build;
- documentation for the handbook, architecture, data, authentication, editor,
  storage, deployment, security, recovery and handoff.

## Partially implemented

| Item | State | Files | Dependency | Completion criterion |
| --- | --- | --- | --- | --- |
| Public content | Seeded in Neon | `fixtures/demo-content.json`, `scripts/db/seed.mjs` | the owner's later subjective review | text and links approved or adjusted from the editor |

## Pending

No mandatory implementation, deployment, portability or QA work remains for this
phase. Subjective approval of the wording is an editorial review, not a technical
blocker.

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
  check.

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
