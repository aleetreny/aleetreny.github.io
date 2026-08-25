// The book on the desk, and what is written in it.
//
// The object is a real multi-page book: covers that swing, leaves that turn one
// at a time, a ribbon that remembers where you were. What it *contains* is
// deliberately almost empty, and that is not an oversight.
//
// The Hitchhiker's Guide to the Galaxy is Douglas Adams's, and it is in
// copyright. None of its text is reproduced here and none ever should be. What
// this ships is the binding: a title leaf, a colophon that says as much, a few
// leaves written for this board, and forty-odd ruled blanks waiting for
// whatever the owner has the right to put in them — their own writing, a
// public-domain passage, a quotation short enough to be fair.
//
// Page 42 is left as a number. The joke needs nothing else.

export type BookPage = {
  /** Printed folio. Page one is the first leaf after the cover. */
  n: number;
  kind: 'title' | 'text' | 'colophon' | 'blank' | 'answer' | 'plate';
  heading?: string;
  lines?: string[];
  /** A small mark in the margin: something to find on a leaf that is otherwise
   *  empty. Nothing is announced anywhere. */
  margin?: string;
};

/** How long the book is. The binding does not care; this is just the paper. */
export const BOOK_LENGTH = 64;

const WRITTEN: Record<number, Omit<BookPage, 'n'>> = {
  1: {
    kind: 'title',
    heading: 'THE HITCHHIKER’S GUIDE\nTO THE GALAXY',
    lines: ['a borrowed copy', 'left on the desk'],
  },
  2: {
    kind: 'colophon',
    heading: 'A NOTE ON THIS COPY',
    lines: [
      'The text of the Guide belongs to Douglas Adams',
      'and is not reproduced here.',
      '',
      'These leaves are blank on purpose. What goes on',
      'them is mine to write, or mine to have the right',
      'to quote.',
      '',
      'The binding, however, is real. Turn the corners.',
    ],
  },
  3: {
    kind: 'text',
    heading: 'WHY THIS BOOK',
    lines: [
      'Because a book that tells you not to panic on the',
      'cover is a good piece of engineering.',
      '',
      'Because I read it at fourteen and decided that a',
      'sense of scale and a sense of humour were the same',
      'instrument.',
      '',
      'Because it is the only reference work I know of',
      'that is mostly wrong and still useful.',
    ],
    margin: '☞',
  },
  7: { kind: 'blank', margin: '·' },
  12: {
    kind: 'text',
    heading: 'MARGINALIA',
    lines: [
      'Somebody has written in this copy, in pencil,',
      'in a hand that is probably mine:',
      '',
      '    “the plural of anecdote is not data,”',
      '    “but it is where the data comes from.”',
    ],
  },
  23: { kind: 'blank', margin: '✦' },
  41: { kind: 'blank', margin: '→' },
  42: {
    kind: 'answer',
    heading: '¡La respuesta!',
    lines: [],
  },
  43: { kind: 'blank', margin: '←' },
  57: {
    kind: 'text',
    heading: 'ON TOWELS',
    lines: [
      'A towel is the most massively useful thing an',
      'interstellar hitchhiker can carry — which is a',
      'claim I am not allowed to quote at length, so',
      'here is mine instead:',
      '',
      'A pencil is the most massively useful thing a',
      'data scientist can carry. It cannot be updated',
      'remotely and it never asks for a login.',
    ],
    margin: '✎',
  },
  64: {
    kind: 'colophon',
    heading: 'END OF THE BORROWED COPY',
    lines: ['', 'Close the book. It stays where you left it.'],
  },
};

export function bookPage(n: number): BookPage {
  const written = WRITTEN[n];
  return written ? { n, ...written } : { n, kind: 'blank' };
}

/** The leaves worth jumping to: the ones with something on them. */
export function bookMarks(): Array<{ n: number; label: string }> {
  return Object.entries(WRITTEN)
    .filter(([, page]) => page.kind !== 'blank')
    .map(([n, page]) => ({ n: Number(n), label: (page.heading ?? '').split('\n')[0] }))
    .sort((a, b) => a.n - b.n);
}
