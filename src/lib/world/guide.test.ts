// The leaves that ship, measured against the leaf they have to sit on.
//
// The fitter is the only thing standing between a nineteen-hundred-character
// page and a page with its last paragraph cut off. This checks its arithmetic,
// and then checks it against every leaf that actually ships.

/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { STEPS, box, fitFor, rowsNeeded } from './fit';

const dir = resolve('public/guide');
const files = readdirSync(dir).filter((name) => /^\d\d\.json$/.test(name)).sort();
type Leaf = { n: number; lines: string[] };
const pages: Leaf[] = files.flatMap((name) => JSON.parse(readFileSync(resolve(dir, name), 'utf8')).pages);

describe('the fitter', () => {
  it('trades columns for rows as the type grows', () => {
    const big = box(STEPS[0]);
    const small = box(STEPS[STEPS.length - 1]);
    expect(small.cols).toBeGreaterThan(big.cols);
    expect(small.rows).toBeGreaterThan(big.rows);
  });

  it('wraps on words rather than on characters', () => {
    // Three words of four letters: two to a line at width ten, not 12/10.
    expect(rowsNeeded(['aaaa bbbb cccc'], 10)).toBe(2);
    expect(rowsNeeded(['aaaa'], 10)).toBe(1);
    // A word longer than the measure has to break inside itself.
    expect(rowsNeeded(['aaaaaaaaaaaaaaaaaaaaa'], 10)).toBeGreaterThan(1);
  });

  it('charges for the air between paragraphs, but less than a line', () => {
    const one = rowsNeeded(['aaaa'], 40);
    const two = rowsNeeded(['aaaa', 'bbbb'], 40);
    expect(two).toBeGreaterThan(one + 1);
    expect(two).toBeLessThan(one + 2);
  });

  it('sets a short page large and a long one small', () => {
    const short = fitFor(['a short line.']);
    const long = fitFor(Array.from({ length: 40 }, () => 'x'.repeat(70)));
    expect(short).toBe(0);
    expect(long).toBeGreaterThan(short);
  });
});

describe('the leaves that ship', () => {
  it('carries the whole print edition, in order, once', () => {
    expect(pages).toHaveLength(227);
    expect(pages.map((p) => p.n)).toEqual(Array.from({ length: 227 }, (_unused, i) => i + 1));
  });

  it('fits every page on its leaf, at the size the reader will choose', () => {
    const over = pages.filter((page) => {
      const { cols, rows } = box(STEPS[fitFor(page.lines)]);
      return rowsNeeded(page.lines, cols) > rows;
    });
    expect(over.map((p) => p.n)).toEqual([]);
  });

  it('never needs the smallest type it has', () => {
    // If a page ever bottoms out, the leaf is too small or the steps too few —
    // and the last step is the only one that can silently overflow.
    const bottomed = pages.filter((page) => fitFor(page.lines) >= STEPS.length - 1);
    expect(bottomed.map((p) => p.n)).toEqual([]);
  });

  it('has something on page forty-two', () => {
    const answer = pages.find((page) => page.n === 42);
    expect(answer?.lines.join(' ').length).toBeGreaterThan(80);
  });
});
