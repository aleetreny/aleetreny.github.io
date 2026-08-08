# ADR 0003: Managed Better Auth + allowlist

- Status: accepted
- Date: 2026-08-04

## Context

The portfolio has a single owner, but the provider allows general signup by
default. Authentication alone must not grant administration.

## Options considered

- an embedded/client-only password (insecure);
- external OAuth;
- self-hosted Better Auth;
- Managed Better Auth with a Postgres allowlist.

## Decision and reasons

Managed Better Auth issues the session/JWT and `app_private.owner_accounts`
decides authorisation. RLS consults `auth.user_id()`.

## Consequences

Auth must be provisioned before migrating, and cross-origin cookies need
verifying. Non-allowlisted accounts read public content and nothing more.

## How to change it

Configure an external IdP in the Data API and adapt the JWKS/`sub` verification;
keep the allowlist as the stable boundary.
