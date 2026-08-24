import { describe, expect, it } from 'vitest';
import { imageContentType, isSupportedImageFile } from './image-upload';

describe('image upload type detection', () => {
  it('accepts HEIC from Photos and a HEIF extension with no browser MIME type', () => {
    expect(imageContentType({ name: 'IMG_0254.HEIC', type: 'image/heic' })).toBe('image/heic');
    expect(imageContentType({ name: 'invernadero.heif', type: '' })).toBe('image/heif');
  });

  it('keeps the upload allowlist restricted to static image formats', () => {
    expect(isSupportedImageFile({ name: 'document.svg', type: 'image/svg+xml' })).toBe(false);
    expect(isSupportedImageFile({ name: 'document.pdf', type: 'application/pdf' })).toBe(false);
  });
});
