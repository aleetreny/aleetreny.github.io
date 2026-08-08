# Security

## Threat model

The main assets are the owner account, unpublished content, the Postgres data,
administrative credentials, the stored objects and the workflows. The public site
and its Vite variables are treated as observable by anyone.

## Controls

- RLS and `GRANT` in Postgres — never trusting a hidden button;
- a private allowlist, separate from Auth;
- a private schema with no grants to the API roles;
- EdDSA JWTs validated against JWKS, issuer, audience and expiry;
- storage secrets only in the function, CI or locally;
- short, per-object signed URLs;
- exact-origin CORS;
- limited Content-Type and size;
- soft deletion and a prepared history;
- Actions with minimum permissions;
- environments for production approval;
- `.gitignore`, a valueless `.env.example` and the basic `validate:repo` scanner.

## Secrets

Private: `DATABASE_URL`, `NEON_API_KEY`, `AWS_ACCESS_KEY_ID`,
`AWS_SECRET_ACCESS_KEY`. They belong in `.env.local`, Neon-injected env or GitHub
Secrets. The `VITE_*` endpoints, project ID and branch name are public
configuration.

Do not print full variables. In errors, redact hosts when the URL contains
credentials. Backups are not technical secrets, but they can hold personal data
and need encrypting.

## Content

Do not render arbitrary HTML from JSONB. Validate blocks with Zod and let React
escape text. SVG is not an accepted upload, because of active content. Meaningful
images require alt text.

## Supply chain

The lockfile is mandatory, Dependabot runs weekly, CI uses
`pnpm install --frozen-lockfile`, and beta upgrades are reviewed by hand. A Neon
JS/Auth/Data API upgrade requires an end-to-end RLS test.

## Incident response

1. revoke the affected secret/session;
2. disable the owner if appropriate;
3. preserve logs without copying tokens;
4. rotate and update the stores;
5. review access and objects;
6. fix, test and document;
7. if a secret entered Git, treat it as compromised even after removing it from
   the last commit.

## Production checks still pending

A light pen-test of the Data API, a non-owner user test, cross-origin/Safari
cookies, rate limiting on the broker, protection against orphaned objects, and
CSP headers on Pages.
