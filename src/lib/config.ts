// What the build was configured with, read once.
//
// This module runs before anything else in the app — the repository, the
// board, the world all reach for it on their first line — so it is written by
// hand rather than with a schema library. Six environment variables and two
// rules do not need two hundred kilobytes of validator sitting in front of the
// first paint, and the rules are worth reading in full:
//
//   · a URL is either empty or a real absolute URL, and nothing else,
//   · remote data cannot be switched on without both public Neon endpoints.
//
// A build that gets either wrong fails here, loudly, exactly as before.

export type RuntimeConfig = {
  remoteDataEnabled: boolean;
  neonAuthUrl: string;
  neonDataApiUrl: string;
  storageFunctionUrl: string;
  storagePublicBaseUrl: string;
  translateFunctionUrl: string;
};

/** An optional endpoint: absent, empty, or a URL the browser can actually
 *  resolve. A typo'd endpoint is a broken deploy that fails silently at the
 *  first fetch, so it is rejected here instead. */
function optionalUrl(input: Record<string, unknown>, key: string): string {
  const value = input[key];
  if (value === undefined || value === null || value === '') return '';
  if (typeof value !== 'string') throw new Error(`${key} must be a string.`);
  try {
    void new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL.`);
  }
  return value;
}

export function parseRuntimeConfig(input: Record<string, unknown>): RuntimeConfig {
  const flag = input.VITE_ENABLE_REMOTE_DATA;
  if (flag !== undefined && flag !== null && flag !== '' && flag !== 'true' && flag !== 'false') {
    throw new Error("VITE_ENABLE_REMOTE_DATA must be 'true' or 'false'.");
  }
  const remoteDataEnabled = flag === 'true';

  const neonAuthUrl = optionalUrl(input, 'VITE_NEON_AUTH_URL');
  const neonDataApiUrl = optionalUrl(input, 'VITE_NEON_DATA_API_URL');
  if (remoteDataEnabled && (!neonAuthUrl || !neonDataApiUrl)) {
    throw new Error(
      'VITE_NEON_AUTH_URL and VITE_NEON_DATA_API_URL are required when remote data is enabled.',
    );
  }

  return {
    remoteDataEnabled,
    neonAuthUrl,
    neonDataApiUrl,
    storageFunctionUrl: optionalUrl(input, 'VITE_STORAGE_FUNCTION_URL'),
    storagePublicBaseUrl: optionalUrl(input, 'VITE_STORAGE_PUBLIC_BASE_URL'),
    // Optional: a Neon Function that holds a translation provider key
    // server-side. Without it the owner's translate action uses the keyless
    // provider straight from the browser.
    translateFunctionUrl: optionalUrl(input, 'VITE_TRANSLATE_FUNCTION_URL'),
  };
}

export const runtimeConfig = parseRuntimeConfig(import.meta.env);
