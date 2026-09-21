# Portfolio releases

The portfolio is independently deployable from this repository. The original Night Shift board mode stays here. No external agent runtime or debate application participates in its navigation, build, content storage or deployment.

## Source changes

1. Work in this repository only; follow the owner commit identity in `AGENTS.md`.
2. Run `pnpm check` and `pnpm build` for a completed change. Add relevant browser verification for changed interactions.
3. Save verified logical changes as incremental commits. Fast-forward `main` if working on a branch and push `main`.
4. Wait for `.github/workflows/deploy-pages.yml` to succeed. It publishes the Vite `dist/` artifact through GitHub Pages.
5. Verify the public site at [aleetreny.github.io](https://aleetreny.github.io/).

GitHub Pages must use **GitHub Actions**, not the `/docs` folder. The documentation and screenshots in this repository are reading material, not the production build. The existing manual workflow can retry a deployment without editing source.

## Content changes

Published dossiers and board settings are stored in this project's Neon database. Owner-mode changes take effect through its Data API, authentication and storage services; they need no code commit or Pages build. Versioned fixtures are a portable fallback and are generated from `content/source`.

A documentation or frontend release does not require reseeding Neon. Use the dedicated provisioning or seed workflows only when an intentional infrastructure/content change requires them, with their documented development and production checks. Preserve production content and private backups.

## Private files

Never commit `.env` files, `.neon` context, database/storage backups, tokens or machine-specific launch settings. `.claude/` is ignored because it contains personal executable paths. Credentials for unrelated projects do not belong in this repository or its GitHub environments.
