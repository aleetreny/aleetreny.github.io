import './lib/load-env.mjs';

const mode = process.argv.find((value) => value.startsWith('--mode='))?.slice(7) || 'frontend';
const missing = [];

function requireVariable(name) {
  if (!process.env[name]) missing.push(name);
}

if (mode === 'frontend') {
  if (process.env.VITE_ENABLE_REMOTE_DATA === 'true') {
    requireVariable('VITE_NEON_AUTH_URL');
    requireVariable('VITE_NEON_DATA_API_URL');
  }

  for (const name of ['VITE_NEON_AUTH_URL', 'VITE_NEON_DATA_API_URL', 'VITE_STORAGE_FUNCTION_URL']) {
    const value = process.env[name];
    if (value && new URL(value).protocol !== 'https:') {
      throw new Error(`${name} must use HTTPS outside the local development fallback.`);
    }
  }
} else if (mode === 'database') {
  requireVariable('DATABASE_URL');
} else if (mode === 'provision') {
  for (const name of ['NEON_API_KEY', 'NEON_PROJECT_ID', 'NEON_BRANCH', 'DATABASE_URL']) {
    requireVariable(name);
  }
} else if (mode === 'storage') {
  for (const name of ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_ENDPOINT_URL_S3', 'AWS_REGION']) {
    requireVariable(name);
  }
} else {
  throw new Error(`Unknown validation mode: ${mode}`);
}

if (missing.length) throw new Error(`Missing variables for ${mode}: ${missing.join(', ')}`);
console.log(`Environment validation passed for ${mode}.`);
