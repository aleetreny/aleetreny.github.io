# ADR 0004: Neon Object Storage and a broker

- Status: accepted, with beta risk
- Date: 2026-08-04

## Context

GitHub Pages cannot sign uploads or hold credentials. Assets must be public and
recoverable.

## Options considered

- Cloudflare R2 + a Worker;
- Cloudinary;
- assets always in Git;
- Neon Object Storage + a Neon Function.

## Decision and reasons

Use Neon's Storage and Function: one declarative backend, branches coherent with
the database, and standard S3. The broker validates the JWT and the owner, then
signs the PUT.

## Consequences

Beta, and `aws-us-east-2`; public read by URL; operations and backups use
server-side credentials. Orphaned objects still need reconciling.

## How to change it

Keep the `assets` table and the broker's contract. Implement equivalent endpoints
over R2/S3, copy the objects, update provider and URLs, and open a migration ADR.
