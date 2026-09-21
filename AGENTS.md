# Instructions for coding agents working in this repository

## Commit authorship — mandatory

The repository owner (Alejandro Treny) must be the sole author and committer on
every commit pushed to this repository. Automated agents must never appear as
committers, authors, or co-authors in the GitHub history.

- Author and commit every commit as `Alejandro Treny Ortega
  <alejandrotreny100@gmail.com>` (the identity already used in this repository's
  human commits — confirm with `git log --format='%an <%ae>'` if unsure).
- Set the identity per commit via environment variables; never edit Git config:
  ```sh
  GIT_AUTHOR_NAME="Alejandro Treny Ortega" GIT_AUTHOR_EMAIL="alejandrotreny100@gmail.com" \
  GIT_COMMITTER_NAME="Alejandro Treny Ortega" GIT_COMMITTER_EMAIL="alejandrotreny100@gmail.com" \
  git commit -m "..."
  ```
- Do not add automated-agent co-author trailers or session metadata to commit
  messages. This repository explicitly opts out of automated attribution.
- Apply the same four environment variables to every command that writes a
  commit, not only `git commit`. This includes `git rebase --continue`,
  `git rebase`, `git cherry-pick`, `git merge` when it creates a merge commit,
  and `git commit --amend`. Those commands can otherwise take the committer
  identity from Git config.
- Before pushing, check both identities with
  `git log --format='%h A:%an <%ae> C:%cn <%ce>' -3`. If a commit already pushed
  has the wrong committer, amend it with the four variables above and use
  `git push --force-with-lease`.

## Incremental commits

The owner authorizes saving completed, checked changes in incremental commits.
Keep each commit focused, preserve the sole-owner identity above, and do not
leave finished work accumulated as uncommitted changes.

## Shipping — merge straight to `main`

The owner does not want work parked on a branch waiting for a pull request.
When a change is finished and `pnpm check` passes, merge it into `main` and push
without asking:

```sh
git checkout main && git merge --ff-only <branch> && git push -u origin main
```

Continue developing on the branch provided to the session so the history stays
readable, but fast-forward `main` onto it as the final step. Pushing `main`
triggers `deploy-pages.yml`; pushing only a branch does not publish the work.
Do not open a pull request unless the owner asks for one.

## Content and board settings

- The board's content (dossiers) and appearance (theme, cards, lists, layout)
  are generated from `content/source/*.mjs` into `fixtures/demo-content.json`
  and `fixtures/site-settings.json` via `pnpm content:build`. Regenerate the
  fixtures after editing those sources.
- Production data lives in Neon (`site_settings` for theme, board, and layout;
  `content_entries` and `content_blocks` for dossiers). After a change that
  alters fixture shape, reseed through the `seed-content.yml` GitHub Actions
  workflow: development first, then production with
  `production_confirmation=APPLY_PRODUCTION`.
- Lists (drawer groups) are dynamic and owner-editable at runtime through the
  board's Inventory panel. Do not hardcode a fixed set of group IDs in new code.
