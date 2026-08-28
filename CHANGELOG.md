# Changelog

## Unreleased

### Added

- **A phone gets an app, not a smaller board.** Below 720px wide — or 500px tall
  with a coarse pointer — the site loads a walkthrough of the same board: one
  card per screen, in the order the guided tour is authored in, with a
  thumb-sized `next`, a swipe, a tappable progress rail and an index sheet.
  Tapping a line pushes its dossier over the walk, and the phone's own back
  gesture closes it.
- The route is not new content: `src/lib/mobile.ts` reads `board.tour` through
  the same `buildStops` the desktop camera uses, so renaming a stop, reordering
  the walk or adding a card from the tour panel moves the phone with it, in both
  languages. A screen is a card and nothing else — the instant photographs, the
  pinned notes and the "currently" card stay on the slate.
- A door to the full slate from the last screen and from the index sheet, at
  `?board=1`, with a return chip and a working back gesture. It arrives without
  replaying the tour the visitor has just walked by hand.
- `mobile.*` wording, Spanish and English, in the central catalogue and editable
  from the wording panel like everything else.

### Changed

- The desk board and the walkthrough are separate lazy chunks chosen in
  `App.tsx`, so a phone no longer downloads the camera, the world loop or the
  editing panels: 20 kB against 103 kB.
- The page is served `viewport-fit=cover`, and every band of board chrome
  anchored to a screen edge now adds the display cut-out back through
  `--sa-*`.

## [2.0.1] — 2026-08-26

- Prevent remote settings that arrive during the first visit from resetting the
  guided camera to the full-board overview. The tour now owns the camera until
  its outro, so Pages frames every card exactly like the local build.

## [2.0.0] — 2026-08-26

### Added

- Sixty versioned passport stamps across fifteen leaves, with faithful Spanish
  and English writing for every place, city and personal note.
- Complete bilingual chrome for the theme, tour and objects editors, the desk
  objects, generated options, errors and accessibility labels.
- A final tour `outro`: the camera frames the complete board before loose paper
  settles and thirty-three objects arrive on deterministic meteor paths.
- Fresh desktop and mobile screenshots plus runtime assertions for the first
  visit, final overview and English passport.

### Fixed

- Lazy world chunks are now hidden by a rendered gate, preventing the one-frame
  object flash seen by first-time guests.
- Tour stops reveal only the title and twelve authored cards; photos, notes and
  objects remain held until the overview.
- Staggered arrivals hold their first keyframe during each delay, so an object
  cannot appear at rest before its meteor flight begins.
- Backwards page turns in the book no longer leave text from the previous leaf
  over the destination page.
- Editing tour structure preserves both stored language variants instead of
  overwriting them with the currently selected language.

### Quality

- The animation path uses opacity, translate, scale and rotate through one-shot
  Web Animations; it introduces no React work per frame and respects reduced
  motion.
- Dynamic i18n coverage is enforced for theme presets, routes, object kinds and
  traits, plant species, passport inks and stamp shapes.
- Verified with repository validation, ESLint, strict TypeScript, 245 Vitest
  tests, a production build and real-browser desktop/mobile walkthroughs.

## [0.2.0]

Earlier stable working-board release. The preserved tag is
`portfolio-v0.2.0`.
