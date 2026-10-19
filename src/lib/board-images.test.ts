import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ImageSlot } from '../components/desk/ImageSlot';
import manifest from '../content/board-images.json';
import { demoSettings } from '../content/demo';
import { parseBoard } from './board';
import { boardImageSources } from './board-images';

describe('board photo delivery', () => {
  it('serves every seeded board photograph from Pages with responsive sizes', () => {
    const photos = parseBoard(demoSettings.board).polaroids.filter((photo) => photo.assetUrl);
    expect(photos.length).toBeGreaterThan(0);
    for (const photo of photos) {
      const sources = boardImageSources(photo.assetUrl!, '/portfolio/');
      expect(sources?.src).toMatch(/^\/portfolio\/images\/board\/[a-f0-9]+-640\.webp$/);
      expect(sources?.srcSet).toContain('640w, /portfolio/images/board/');
      expect(sources?.srcSet).toMatch(/-1280\.webp \d+w$/);
      expect(sources?.width).toBeLessThanOrEqual(1280);
      expect(sources?.width).toBeGreaterThan(640);
      expect(sources?.srcSet).not.toContain('https://');
    }
  });

  it('preserves new uploads and unrelated URLs instead of substituting stale photos', () => {
    const original = Object.keys(manifest)[0];
    expect(boardImageSources(`${original}?replaced=1`)).toBeUndefined();
    expect(boardImageSources('https://other.example/photo.jpg')).toBeUndefined();
    expect(boardImageSources('data:image/jpeg;base64,AAAA')).toBeUndefined();
    expect(boardImageSources(original, '/')).toBeDefined();
  });

  it('renders tour photos eagerly using local variants while preserving videos', () => {
    const url = Object.keys(manifest)[0];
    const photo = renderToStaticMarkup(createElement(ImageSlot, { url, alt: 'Board photograph' }));
    expect(photo).toContain('src="/images/board/');
    expect(photo).toContain('srcSet="/images/board/');
    expect(photo).toContain('loading="eager"');
    expect(photo).toContain('decoding="async"');
    expect(photo).not.toContain(url);
    const video = renderToStaticMarkup(createElement(ImageSlot, { url, mediaType: 'video/mp4' }));
    expect(video).toContain(`<video src="${url}"`);
    expect(video).not.toContain('srcSet');
  });

  it('ships decodable, metadata-free variants with at least 80% less total data', async () => {
    let originalBytes = 0;
    let largestBytes = 0;
    for (const image of Object.values(manifest)) {
      originalBytes += image.originalBytes;
      for (const variant of image.variants) {
        const path = new URL(`../../public/${variant.path}`, import.meta.url);
        const metadata = await sharp(await readFile(path)).metadata();
        expect(metadata.format).toBe('webp');
        expect(metadata.width).toBe(variant.width);
        expect(metadata.height).toBe(variant.height);
        expect(metadata.exif).toBeUndefined();
        expect((await stat(path)).size).toBe(variant.bytes);
      }
      largestBytes += image.variants.at(-1)!.bytes;
    }
    expect(largestBytes).toBeLessThan(originalBytes * 0.2);
  });
});
