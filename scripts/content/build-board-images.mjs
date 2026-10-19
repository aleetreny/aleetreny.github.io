// Run explicitly after changing fixture photos. Normal builds use the checked-in
// derivatives, so deploying Pages never depends on storage being available.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const settings = JSON.parse(await readFile(new URL('../../fixtures/site-settings.json', import.meta.url), 'utf8'));
const board = settings.find((row) => row.key === 'board')?.value;
if (!Array.isArray(board?.polaroids)) throw new Error('Board fixture has no polaroids.');
const urls = [...new Set(board.polaroids
  .filter((photo) => photo.assetUrl && /^image\/(jpeg|png|webp|avif)$/.test(photo.assetMediaType ?? ''))
  .map((photo) => photo.assetUrl))];
const directory = new URL('../../public/images/board/', import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = {};
let originalBytes = 0;
let displayBytes = 0;

for (const url of urls) {
  const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!response.ok) throw new Error(`Photo download returned HTTP ${response.status}: ${url}`);
  const original = Buffer.from(await response.arrayBuffer());
  originalBytes += original.byteLength;
  const hash = createHash('sha256').update(original).digest('hex').slice(0, 16);
  const variants = [];
  for (const width of [640, 1280]) {
    const filename = `${hash}-${width}.webp`;
    const info = await sharp(original).autoOrient()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(new URL(filename, directory).pathname);
    variants.push({ path: `images/board/${filename}`, width: info.width, height: info.height, bytes: info.size });
    if (width === 1280) displayBytes += info.size;
  }
  manifest[url] = { originalBytes: original.byteLength, variants };
  console.log(`${url.split('/').at(-1)}: ${original.byteLength} → ${variants[1].bytes} bytes`);
}

await writeFile(new URL('../../src/content/board-images.json', import.meta.url), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`${urls.length} photos: ${originalBytes} → ${displayBytes} bytes at 1280px (${(100 * (1 - displayBytes / originalBytes)).toFixed(1)}% smaller).`);
