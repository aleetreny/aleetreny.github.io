import { describe, expect, it } from 'vitest';
import {
  MAX_UPLOAD_BYTES,
  isAllowedOrigin,
  isUploadAllowed,
  publicObjectUrl,
  sanitizeFilename,
} from './storage-policy';

describe('storage policy', () => {
  it('normalizes filenames and rejects unsafe content', () => {
    expect(sanitizeFilename('../../Foto Málaga 01.PNG')).toBe('foto-malaga-01.png');
    expect(sanitizeFilename('../..')).toBe('upload');
    expect(isUploadAllowed('image/png', MAX_UPLOAD_BYTES)).toBe(true);
    expect(isUploadAllowed('image/svg+xml', 100)).toBe(false);
    expect(isUploadAllowed('image/png', MAX_UPLOAD_BYTES + 1)).toBe(false);
  });

  it('uses an exact CORS allowlist', () => {
    expect(isAllowedOrigin('https://aleetreny.github.io', 'https://aleetreny.github.io')).toBe(true);
    expect(isAllowedOrigin('https://evil.example', 'https://aleetreny.github.io')).toBe(false);
  });

  it('encodes every public object path segment', () => {
    expect(publicObjectUrl('https://storage.example/', 'assets', 'owner/a b.png')).toBe(
      'https://storage.example/assets/owner/a%20b.png',
    );
  });
});
