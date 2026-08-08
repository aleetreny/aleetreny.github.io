# ADR 0008: GitHub Pages as a static boundary

- Status: accepted
- Date: 2026-08-04

## Context

The User Pages domain and repository must be the deployment source, and the local
machine is temporary.

## Options considered

- deploying files by hand;
- Vercel/Netlify as the primary host;
- Pages from a `gh-pages` branch;
- Pages with a GitHub Actions artifact.

## Decision and reasons

Actions builds and publishes `dist` to Pages on a push to `main`, with a manual
run available. The build is never committed.

## Consequences

Nothing server-side can live on the same origin; Auth, API and Storage are
external. Vite variables are public. Deep SPA routes are avoided by using an
owner query parameter.

## How to change it

Another host can consume the same build. If SSR is adopted, create a separate
backend and host, keep Pages as a fallback, or document the retirement and the
DNS change.
