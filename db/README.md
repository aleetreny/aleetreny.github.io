# Database

`db/migrations/` is the ordered source of truth. `db/schema.sql` restores the
schema with `psql`; the scripts in `scripts/db/` apply and record migrations
without needing `psql`.

The required order:

1. deploy `neon.ts` to create Auth, the Data API and the `anonymous` /
   `authenticated` roles;
2. run `pnpm db:migrate` with a private `DATABASE_URL`;
3. create the user in Neon Auth and run
   `pnpm db:owner -- --user-id <uuid> --email <address>`;
4. optionally run `pnpm db:seed`;
5. run `pnpm db:verify` and refresh the Data API's schema cache.

The migrations contain no project IDs, credentials or personal data.
