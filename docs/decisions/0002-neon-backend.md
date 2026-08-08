# ADR 0002: Neon as the data backend

- Status: accepted
- Date: 2026-08-04

## Context

We need reproducible Postgres, isolated branches, Auth/Data API and versioned
migrations, with no server of our own on Pages.

## Options considered

- full Supabase;
- managed Postgres plus an API of our own;
- content in Git only;
- Neon Postgres + Data API.

## Decision and reasons

Use Neon: a project requirement, standard Postgres, copy-on-write branching, and
Auth and a Data API that integrate from a SPA.

## Consequences

The Data API and Auth are in beta; RLS and `GRANT` are critical. Real data does
not live in Git — only the schema, scripts and fixtures.

## How to change it

Postgres and SQL are portable. Replace the Data API client with an API of our own
and migrate identity/claims while keeping equivalent RLS.
