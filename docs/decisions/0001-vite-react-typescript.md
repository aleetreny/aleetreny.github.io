# ADR 0001: Vite, React and TypeScript

- Status: accepted
- Date: 2026-08-04

## Context

GitHub Pages requires static output. The portfolio needs an interactive UI and a
future editor, but no mandatory SSR.

## Options considered

- HTML/JS with no framework: minimal, but the editor and its state would scale
  badly.
- Next.js: a wide ecosystem, but Pages forces a static export and most server
  capabilities go unused.
- Astro: excellent for static content, more complexity once nearly all of the
  editor becomes islands.
- Vite + React + TypeScript.

## Decision and reasons

Use Vite/React/TypeScript: a direct static build, shared typing, simple testing
and natural compatibility with Neon's browser SDK.

## Consequences

There is no SSR and there are no API routes. SEO depends on the base HTML and
metadata plus client-rendered content; the backend must live outside Pages.

## How to change it

Keep `types`, fixtures and the content repository decoupled; move the rendering
to Astro or another generator while keeping the contracts and the Data API.
