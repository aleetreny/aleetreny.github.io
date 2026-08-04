export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export function sanitizeFilename(filename: string): string {
  const normalized = filename
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

  return normalized || 'upload';
}

export function isUploadAllowed(contentType: string, byteSize: number): boolean {
  return ALLOWED_IMAGE_TYPES.has(contentType) && byteSize > 0 && byteSize <= MAX_UPLOAD_BYTES;
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
