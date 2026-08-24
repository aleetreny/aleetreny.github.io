import { createClient } from '@neondatabase/neon-js';
import { runtimeConfig } from './config';
import type { Database } from '../types/database';

async function createConfiguredClient() {
  return createClient<Database>({
      auth: {
        url: runtimeConfig.neonAuthUrl,
        allowAnonymous: true,
      },
      dataApi: {
        url: runtimeConfig.neonDataApiUrl,
      },
    });
}

let clientPromise: ReturnType<typeof createConfiguredClient> | undefined;

export function getNeonClient() {
  if (!runtimeConfig.remoteDataEnabled) return Promise.resolve(null);
  clientPromise ??= createConfiguredClient();
  return clientPromise;
}
