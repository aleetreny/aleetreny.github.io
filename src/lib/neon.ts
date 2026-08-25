import { runtimeConfig } from './config';
import type { Database } from '../types/database';

// The SDK is fetched, not bundled.
//
// `@neondatabase/neon-js` drags in the whole auth stack — a GoTrue client, a
// WebAuthn module, a validator — and none of it is needed to paint a board:
// the slate, the cards and the dossiers all come up from the safe copy that
// ships with the app, and the live data arrives afterwards to replace it.
// Importing it here rather than at the top of the file is what keeps roughly
// half the first download out of the way of the first frame.
async function createConfiguredClient() {
  const { createClient } = await import('@neondatabase/neon-js');
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
