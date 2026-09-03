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
- **Any command that writes a commit needs the same four variables**, not just
  `git commit`. `git rebase --continue`, `git rebase`, `git cherry-pick`,
  `git merge` (when it makes a merge commit) and `git commit --amend` all keep
  the original *author* but take the *committer* from git config — which is
  Claude — and GitHub then shows two people on the commit. Prefix them the same
  way:
  ```
  GIT_AUTHOR_NAME="Alejandro Treny Ortega" GIT_AUTHOR_EMAIL="alejandrotreny100@gmail.com" \
  GIT_COMMITTER_NAME="Alejandro Treny Ortega" GIT_COMMITTER_EMAIL="alejandrotreny100@gmail.com" \
  git rebase --continue
  ```
- Before pushing, check both fields, not just the author:
  `git log --format='%h A:%an <%ae> C:%cn <%ce>' -3`. If a commit that is
  already pushed has the wrong committer, fix it with `--amend` under the four
  variables and `git push --force-with-lease`.

## Shipping — merge straight to `main`

The owner does not want work parked on a branch waiting for a pull request.
When a change is finished and checked (`pnpm check` green), merge it to `main`
and push, without asking:

```
git checkout main && git merge --ff-only <branch> && git push -u origin main
```

Keep developing on whatever branch the session was given, so the history stays
readable, but fast-forward `main` onto it as the last step of the task. Pushing
`main` is what triggers `deploy-pages.yml`, so this *is* the deploy — never
push a branch and report the work as live. Do not open a pull request unless
the owner asks for one.

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

## The habitat (branch `night-shift-habitat`)

**Read `docs/superpowers/specs/2026-09-03-habitat-state.md` first.** It is the
handoff: what is being built, the one rule the art runs on (if there is a
reference, it is traced), the measure-then-draw method and its tools in
`tools/roomlab/measure/`, which rooms are done, and every open question. Then
read only the specs it sends you to.
