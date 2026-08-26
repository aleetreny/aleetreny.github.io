/** Media formats that can be safely stored and rendered by the board.
 *
 * Some macOS drop targets omit a File MIME type for a photo or video dragged
 * out of Photos. In that case, the extension is the fallback — never an
 * excuse to accept an arbitrary file. */
export const IMAGE_CONTENT_TYPES = new Set([
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

export const VIDEO_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-m4v',
]);

export const MAX_IMAGE_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 250 * 1024 * 1024;

const TYPE_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  m4v: 'video/x-m4v',
  mov: 'video/quicktime',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

export const MEDIA_INPUT_ACCEPT = '.avif,.gif,.heic,.heif,.jpeg,.jpg,.png,.webp,.m4v,.mov,.mp4,.webm,image/avif,image/gif,image/heic,image/heif,image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,video/x-m4v';

/** The passport takes photographs only. Keep its picker aligned with the
 * dashboard's supported image formats, including the HEIC files Photos often
 * exposes without a useful MIME type. */
export const IMAGE_INPUT_ACCEPT = '.avif,.gif,.heic,.heif,.jpeg,.jpg,.png,.webp,image/avif,image/gif,image/heic,image/heif,image/jpeg,image/png,image/webp';

type MediaFile = Pick<File, 'name' | 'type'>;

/** Return the safe content type to send to storage, or null for an unsupported
 * upload. The explicit allowlist keeps SVG and other active content out. */
export function mediaContentType(file: MediaFile): string | null {
  const supplied = file.type.trim().toLowerCase();
  if (IMAGE_CONTENT_TYPES.has(supplied) || VIDEO_CONTENT_TYPES.has(supplied)) return supplied;
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension ? TYPE_BY_EXTENSION[extension] ?? null : null;
}

export function isSupportedMediaFile(file: MediaFile): boolean {
  return mediaContentType(file) !== null;
}

export function maxUploadBytesForMediaType(mediaType: string): number | null {
  if (IMAGE_CONTENT_TYPES.has(mediaType)) return MAX_IMAGE_UPLOAD_BYTES;
  if (VIDEO_CONTENT_TYPES.has(mediaType)) return MAX_VIDEO_UPLOAD_BYTES;
  return null;
}

/** Identify videos using metadata for new uploads, with an extension fallback
 * so older stored MP4/MOV/WebM assets render correctly too. */
export function isVideoMedia(mediaType?: string, url?: string): boolean {
  if (mediaType && VIDEO_CONTENT_TYPES.has(mediaType.trim().toLowerCase())) return true;
  if (!url) return false;
  const extension = url.split(/[?#]/, 1)[0].toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return Boolean(extension && VIDEO_CONTENT_TYPES.has(TYPE_BY_EXTENSION[extension] ?? ''));
}
