import { z } from 'zod';

const optionalUrl = z.union([z.literal(''), z.url()]).optional().default('');

const runtimeSchema = z.object({
  VITE_ENABLE_REMOTE_DATA: z.enum(['true', 'false']).or(z.literal('')).optional().default('false'),
  VITE_NEON_AUTH_URL: optionalUrl,
  VITE_NEON_DATA_API_URL: optionalUrl,
  VITE_STORAGE_FUNCTION_URL: optionalUrl,
  VITE_STORAGE_PUBLIC_BASE_URL: optionalUrl,
  // Optional: a Neon Function that holds a translation provider key
  // server-side. Without it the owner's translate action uses the keyless
  // provider straight from the browser.
  VITE_TRANSLATE_FUNCTION_URL: optionalUrl,
});

export type RuntimeConfig = {
  remoteDataEnabled: boolean;
  neonAuthUrl: string;
  neonDataApiUrl: string;
  storageFunctionUrl: string;
  storagePublicBaseUrl: string;
  translateFunctionUrl: string;
};

export function parseRuntimeConfig(input: Record<string, unknown>): RuntimeConfig {
  const parsed = runtimeSchema.parse(input);
  const remoteDataEnabled = parsed.VITE_ENABLE_REMOTE_DATA === 'true';

  if (remoteDataEnabled && (!parsed.VITE_NEON_AUTH_URL || !parsed.VITE_NEON_DATA_API_URL)) {
    throw new Error(
      'VITE_NEON_AUTH_URL and VITE_NEON_DATA_API_URL are required when remote data is enabled.',
    );
  }

  return {
    remoteDataEnabled,
    neonAuthUrl: parsed.VITE_NEON_AUTH_URL,
    neonDataApiUrl: parsed.VITE_NEON_DATA_API_URL,
    storageFunctionUrl: parsed.VITE_STORAGE_FUNCTION_URL,
    storagePublicBaseUrl: parsed.VITE_STORAGE_PUBLIC_BASE_URL,
    translateFunctionUrl: parsed.VITE_TRANSLATE_FUNCTION_URL,
  };
}

export const runtimeConfig = parseRuntimeConfig(import.meta.env);
