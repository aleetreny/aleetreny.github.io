import '../lib/load-env.mjs';
import postgres from 'postgres';

export function createDatabaseClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required. Copy .env.example to .env.local and set a private value.');
  }

  return postgres(databaseUrl, {
    max: 1,
    prepare: false,
    connect_timeout: 15,
  });
}
