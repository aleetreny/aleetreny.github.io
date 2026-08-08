# ADR 0005: A flexible block model

- Status: accepted
- Date: 2026-08-04

## Context

Projects, experience and case studies need different compositions without
migrating columns for every variant.

## Options considered

- full HTML per entry;
- one table per content type;
- a single JSONB document;
- a relational entry plus ordered blocks with typed JSONB.

## Decision and reasons

Separate `content_entries` and `content_blocks`: identity, order and state stay
relational, while properties and layout stay extensible in JSONB.

## Consequences

The frontend needs a registry and per-type validation. JSONB must not become a
schemaless store; versions capture snapshots.

## How to change it

Add columns for frequently queried fields, or migrate specific types with scripts
that transform `props`; keep a read fallback during the transition.
