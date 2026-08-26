import { describe, expect, it } from 'vitest';
import { IMAGE_INPUT_ACCEPT, MAX_VIDEO_UPLOAD_BYTES, isSupportedMediaFile, isVideoMedia, maxUploadBytesForMediaType, mediaContentType } from './image-upload';

describe('media upload type detection', () => {
  it('accepts HEIC from Photos and a HEIF extension with no browser MIME type', () => {
    expect(mediaContentType({ name: 'IMG_0254.HEIC', type: 'image/heic' })).toBe('image/heic');
    expect(mediaContentType({ name: 'invernadero.heif', type: '' })).toBe('image/heif');
  });

  it('accepts the supported video formats and detects legacy video URLs', () => {
    expect(mediaContentType({ name: 'semillero.mov', type: '' })).toBe('video/quicktime');
    expect(mediaContentType({ name: 'riego.mp4', type: 'video/mp4' })).toBe('video/mp4');
    expect(isVideoMedia(undefined, 'https://assets.example/riego.webm?version=1')).toBe(true);
    expect(maxUploadBytesForMediaType('video/quicktime')).toBe(MAX_VIDEO_UPLOAD_BYTES);
  });

  it('keeps the upload allowlist explicit', () => {
    expect(isSupportedMediaFile({ name: 'document.svg', type: 'image/svg+xml' })).toBe(false);
    expect(isSupportedMediaFile({ name: 'document.pdf', type: 'application/pdf' })).toBe(false);
  });

  it('keeps passport pickers limited to supported image formats', () => {
    expect(IMAGE_INPUT_ACCEPT).toContain('.heic');
    expect(IMAGE_INPUT_ACCEPT).toContain('image/jpeg');
    expect(IMAGE_INPUT_ACCEPT).not.toContain('video/mp4');
  });
});
