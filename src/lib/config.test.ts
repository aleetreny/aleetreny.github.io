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

  it('refuses an endpoint that is not a URL', () => {
    expect(() => parseRuntimeConfig({ VITE_STORAGE_FUNCTION_URL: 'not-a-url' })).toThrow(
      /VITE_STORAGE_FUNCTION_URL/,
    );
  });

  it('validates the public habitat runtime independently of remote content mode', () => {
    expect(() => parseRuntimeConfig({ VITE_HABITAT_RUNTIME_URL: 'not-a-url' })).toThrow(
      /VITE_HABITAT_RUNTIME_URL/,
    );
    expect(parseRuntimeConfig({
      VITE_HABITAT_RUNTIME_URL: 'https://habitat.example',
    }).habitatRuntimeUrl).toBe('https://habitat.example');
  });

  it('refuses a remote-data flag that is neither true nor false', () => {
    expect(() => parseRuntimeConfig({ VITE_ENABLE_REMOTE_DATA: 'yes' })).toThrow(
      /VITE_ENABLE_REMOTE_DATA/,
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
