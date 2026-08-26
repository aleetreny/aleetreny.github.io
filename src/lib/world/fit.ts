// How much of a page will sit on a leaf.
//
// The book's leaf is a fixed box; its pages are not a fixed length. Rather than
// reflow the text — which would slide the folios out of step with the print
// edition, and page 42 is the whole point — every page is set in the largest of
// six type sizes it fits in.
//
// The measurement is honest because the face is monospaced: IBM Plex Mono
// advances exactly six tenths of an em, so a column count is a character count
// and the arithmetic here is the arithmetic the browser will do.

/** The leaf, in board units, inside its padding and clear of the folio.
 *  Measured off the real element; kept in step with `.book__leaf` in
 *  global.css — if that box changes, this must, and guide.test.ts is what
 *  notices when it has not. */
export const LEAF = { w: 317, h: 386 };
const ADVANCE = 0.6;
const LEADING = 1.45;
/** The air between two paragraphs, in lines. Matches `.book__body p + p`. */
const PARA_GAP = 0.5 / LEADING;

/** Point sizes, largest first. A page takes the first one it fits in. */
export const STEPS = [9, 8.4, 7.8, 7.2, 6.6, 6] as const;

export function box(size: number): { cols: number; rows: number } {
  return {
    cols: Math.max(8, Math.floor(LEAF.w / (size * ADVANCE)) - 1),
    rows: Math.max(4, Math.floor(LEAF.h / (size * LEADING)) - 1),
  };
}

/** How many lines this page takes at a given measure, wrapping on words the
 *  way the browser does, and paying for the air between paragraphs. */
export function rowsNeeded(paras: readonly string[], cols: number): number {
  let rows = 0;
  for (const para of paras) {
    let used = 0;
    for (const word of para.split(/\s+/)) {
      if (!word) continue;
      const need = used === 0 ? word.length : used + 1 + word.length;
      if (need <= cols) { used = need; continue; }
      rows += Math.max(1, Math.ceil(used / cols));
      // A word longer than the measure has to break inside itself.
      used = word.length;
    }
    rows += Math.max(1, Math.ceil(used / cols));
  }
  return rows + Math.max(0, paras.length - 1) * PARA_GAP;
}

/** The index into STEPS of the largest size this page can be set in. */
export function fitFor(paras: readonly string[]): number {
  for (let i = 0; i < STEPS.length; i += 1) {
    const { cols, rows } = box(STEPS[i]);
    if (rowsNeeded(paras, cols) <= rows) return i;
  }
  return STEPS.length - 1;
}
