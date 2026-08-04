import { describe, expect, it } from 'vitest';
import { parseRuntimeConfig } from './config';

describe('parseRuntimeConfig', () => {
  it('uses committed fixtures by default', () => {
    expect(parseRuntimeConfig({}).remoteDataEnabled).toBe(false);
  });

  it('treats an empty Actions variable as local fixture mode', () => {
    expect(parseRuntimeConfig({ VITE_ENABLE_REMOTE_DATA: '' }).remoteDataEnabled).toBe(false);
  });

  it('requires both public Neon endpoints for remote mode', () => {
    expect(() => parseRuntimeConfig({ VITE_ENABLE_REMOTE_DATA: 'true' })).toThrow(
      /VITE_NEON_AUTH_URL/,
    );
  });

  it('accepts a complete public configuration', () => {
    const config = parseRuntimeConfig({
      VITE_ENABLE_REMOTE_DATA: 'true',
      VITE_NEON_AUTH_URL: 'https://example.neonauth.us-east-2.aws.neon.tech/auth',
      VITE_NEON_DATA_API_URL: 'https://example.apirest.us-east-2.aws.neon.tech/rest/v1',
    });
    expect(config.remoteDataEnabled).toBe(true);
  });
});
