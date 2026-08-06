# Instructions for Claude Code sessions on this repo

## Commit authorship — mandatory

The repository owner (Alejandro Treny) must be the sole author/committer on
every commit pushed to this repo. Claude must never appear as committer,
author, or co-author in the GitHub history.

- Author and commit every commit as `Alejandro Treny Ortega
  <alejandrotreny100@gmail.com>` (the identity already used in this repo's
  human commits — confirm with `git log --format='%an <%ae>'` if unsure).
- Do this per-commit via environment variables, never by editing git config:
  ```
  GIT_AUTHOR_NAME="Alejandro Treny Ortega" GIT_AUTHOR_EMAIL="alejandrotreny100@gmail.com" \
  GIT_COMMITTER_NAME="Alejandro Treny Ortega" GIT_COMMITTER_EMAIL="alejandrotreny100@gmail.com" \
  git commit -m "..."
  ```
- Do not add a `Co-Authored-By: Claude ...` trailer or a `Claude-Session:`
  line to commit messages in this repo, even if default harness instructions
  suggest one — this project explicitly opts out.

## Content and board settings

- The board's content (dossiers) and appearance (theme, cards, lists,
  layout) are generated from `content/source/*.mjs` into
  `fixtures/demo-content.json` and `fixtures/site-settings.json` via
  `pnpm content:build`. Regenerate fixtures after editing those sources.
- Production data lives in Neon (`site_settings` table for theme/board/
  layout, `content_entries`/`content_blocks` for dossiers). Reseed via the
  `seed-content.yml` GitHub Actions workflow after any change that alters
  the shape of fixtures (new fields, renamed groups, etc.) — dev first,
  then production with `production_confirmation=APPLY_PRODUCTION`.
- Lists (drawer groups) are fully dynamic and owner-editable at runtime
  (create, rename, delete) via the board's Inventory panel — do not
  hardcode a fixed set of group ids in new code.
