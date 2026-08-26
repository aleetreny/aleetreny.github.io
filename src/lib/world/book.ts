// The book on the desk, and how its pages get here.
//
// The object is a real multi-page book: covers that swing, leaves that turn one
// at a time, a ribbon that remembers where you were. What it contains is the
// owner's own copy of the Guide, laid out at build time by
// scripts/content/build-guide.mjs and shipped as static leaves under
// public/guide — a dozen pages to a file.
//
// Nothing of it is bundled. Opening the book fetches the one file holding the
// leaf you are on, and turning towards the end of that file quietly fetches the
// next one, so a visitor who never opens the book pays nothing at all and a
// visitor who reads it pays about six kilobytes a dozen pages.
//
// Folios are the print edition's, not a reflow's: every page is measured
// against the leaf (see fit.ts) and set in the largest of six type sizes it
// fits in. Page 42 is therefore page 42, which is the entire reason for the
// trouble.

export type BookPage = {
  /** Printed folio. */
  n: number;
  /** Index into STEPS: the type size this page is set in, worked out once,
   *  the first time the page is asked for. */
  fit: number;
  lines: string[];
};

import { fitFor } from './fit';

export { STEPS } from './fit';

export const BOOK_LENGTH = 227;
/** Pages to a file. Must match CHUNK in scripts/content/build-guide.mjs. */
const CHUNK = 12;
/** The one page that is not like the others. */
export const ANSWER = 42;

type Raw = { n: number; lines: string[] };
type Chunk = { from: number; pages: Raw[] };

const leaves = new Map<number, BookPage>();
const asked = new Map<number, Promise<void>>();

function chunkOf(page: number): number {
  return Math.floor((page - 1) / CHUNK);
}

function url(chunk: number): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base}guide/${String(chunk).padStart(2, '0')}.json`;
}

/** Fetch the file holding this page, once. Repeated calls while it is in
 *  flight share the one request; a failed file may be asked for again. */
export function fetchAround(page: number): Promise<void> {
  if (page < 1 || page > BOOK_LENGTH) return Promise.resolve();
  const chunk = chunkOf(page);
  const already = asked.get(chunk);
  if (already) return already;
  const run = fetch(url(chunk))
    .then((response) => {
      if (!response.ok) throw new Error(`guide chunk ${chunk}: ${response.status}`);
      return response.json() as Promise<Chunk>;
    })
    .then((body) => {
      for (const leaf of body.pages ?? []) {
        if (typeof leaf?.n !== 'number' || !Array.isArray(leaf.lines)) continue;
        const lines = leaf.lines.map(String);
        leaves.set(leaf.n, { n: leaf.n, fit: fitFor(lines), lines });
      }
    })
    .catch(() => {
      // A leaf that did not arrive is a leaf you can ask for again by turning
      // back to it; it is not a broken book.
      asked.delete(chunk);
    });
  asked.set(chunk, run);
  return run;
}

/** Everything the open spread needs, and the file after it if the reader is
 *  close enough to the edge of this one to be about to want it. */
export function fetchSpread(leaf: number): Promise<unknown> {
  const jobs = [fetchAround(leaf), fetchAround(leaf + 1)];
  const ahead = leaf + 4;
  if (ahead <= BOOK_LENGTH && chunkOf(ahead) !== chunkOf(leaf)) jobs.push(fetchAround(ahead));
  const behind = leaf - 2;
  if (behind >= 1 && chunkOf(behind) !== chunkOf(leaf)) jobs.push(fetchAround(behind));
  return Promise.all(jobs);
}

/** What is on a page right now. Null while its file is still coming, which the
 *  leaf draws as ruled blanks rather than as an error. */
export function bookPage(n: number): BookPage | null {
  if (n < 1 || n > BOOK_LENGTH) return null;
  return leaves.get(n) ?? null;
}

export function hasPage(n: number): boolean {
  return leaves.has(n);
}

/** The three places worth going straight to. */
export function bookMarks(): number[] {
  return [1, ANSWER, BOOK_LENGTH];
}
