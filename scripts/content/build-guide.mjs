// Cut the book into leaves the board can serve one handful at a time.
//
// The text itself is not in this repository twice: this reads a local copy of
// the book (the owner's own, passed as an argument or left at
// content/source/guide-pages.json) and writes the only copy that ships —
// public/guide/NN.json, a dozen pages to a file, fetched when the reader
// actually reaches them.
//
// Nothing is laid out here. Fitting a page to the leaf is arithmetic the reader
// does for itself, from src/lib/world/fit.ts, which is where the leaf's real
// measurements live and where they can be tested.

import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve(process.argv[2] ?? 'content/source/guide-pages.json');
const outDir = resolve('public/guide');

/** Pages to a file. Small enough that opening the book costs one small fetch,
 *  large enough that turning a leaf almost never costs another. Must match
 *  CHUNK in src/lib/world/book.ts. */
const CHUNK = 12;

const book = JSON.parse(await readFile(source, 'utf8'));
const pages = book.pages.map((page) => ({
  n: page.page,
  lines: String(page.text)
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean),
}));

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

let bytes = 0;
const chunks = Math.ceil(pages.length / CHUNK);
for (let c = 0; c < chunks; c += 1) {
  const slice = pages.slice(c * CHUNK, c * CHUNK + CHUNK);
  const body = JSON.stringify({ from: slice[0].n, pages: slice });
  await writeFile(resolve(outDir, `${String(c).padStart(2, '0')}.json`), body);
  bytes += body.length;
}

console.log(`Wrote ${chunks} chunks, ${pages.length} pages, ${Math.round(bytes / 1024)} kB total.`);
