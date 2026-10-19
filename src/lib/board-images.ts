import manifest from '../content/board-images.json';

type BoardImage = { originalBytes: number; variants: { path: string; width: number; height: number; bytes: number }[] };

/** Exact URL matching is intentional: an owner replacing a photo must never
 * receive a derivative of the previous upload. Live database URLs stay intact. */
export function boardImageSources(url: string, baseUrl = import.meta.env.BASE_URL) {
  const image = (manifest as Record<string, BoardImage>)[url];
  if (!image) return undefined;
  const variants = image.variants;
  const largest = variants[variants.length - 1];
  return {
    src: `${baseUrl}${variants[0].path}`,
    srcSet: variants.map((variant) => `${baseUrl}${variant.path} ${variant.width}w`).join(', '),
    // A photograph can fill most of the viewport during a tour camera stop.
    sizes: '(max-width: 720px) 100vw, 640px',
    width: largest.width,
    height: largest.height,
  };
}
