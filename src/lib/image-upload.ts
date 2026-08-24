/** Static image formats that can be safely stored and rendered by the board.
 *
 * Some macOS drop targets omit a File MIME type for a photo dragged out of
 * Photos. In that case, the extension is the fallback — never an excuse to
 * accept an arbitrary file. */
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

const TYPE_BY_EXTENSION: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const IMAGE_INPUT_ACCEPT = '.avif,.gif,.heic,.heif,.jpeg,.jpg,.png,.webp,image/avif,image/gif,image/heic,image/heif,image/jpeg,image/png,image/webp';

type ImageFile = Pick<File, 'name' | 'type'>;

/** Return the safe content type to send to storage, or null for an unsupported
 * upload. The explicit allowlist keeps SVG and other active content out. */
export function imageContentType(file: ImageFile): string | null {
  const supplied = file.type.trim().toLowerCase();
  if (IMAGE_CONTENT_TYPES.has(supplied)) return supplied;
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  return extension ? TYPE_BY_EXTENSION[extension] ?? null : null;
}

export function isSupportedImageFile(file: ImageFile): boolean {
  return imageContentType(file) !== null;
}
