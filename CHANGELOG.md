# Changelog

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
