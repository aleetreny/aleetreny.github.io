export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 250 * 1024 * 1024;
/** Retained for callers checking the image limit. */
export const MAX_UPLOAD_BYTES = MAX_IMAGE_UPLOAD_BYTES;

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
]);

export function sanitizeFilename(filename: string): string {
  const normalized = filename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 96);

  return normalized || 'upload';
}

export function isUploadAllowed(contentType: string, byteSize: number): boolean {
  const maxBytes = ALLOWED_IMAGE_TYPES.has(contentType)
    ? MAX_IMAGE_UPLOAD_BYTES
    : ALLOWED_VIDEO_TYPES.has(contentType)
      ? MAX_VIDEO_UPLOAD_BYTES
      : 0;
  return byteSize > 0 && byteSize <= maxBytes;
}

export function isAllowedOrigin(origin: string | undefined, configuredOrigins: string): boolean {
  if (!origin) return true;
  const allowed = configuredOrigins
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin);
}

export function publicObjectUrl(endpoint: string, bucket: string, key: string): string {
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  return `${endpoint.replace(/\/$/, '')}/${encodeURIComponent(bucket)}/${encodedKey}`;
}
