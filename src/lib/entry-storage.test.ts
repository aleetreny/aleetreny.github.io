import { describe, expect, it } from 'vitest';
import { dehydrateEntry, hydrateEntry, I18N_KEY } from './entry-storage';

type Row = {
  id: string;
  slug: string;
  title: unknown;
  summary: unknown;
  metadata: Record<string, unknown>;
};

const row = (over: Partial<Row> = {}): Row => ({
  id: 'e1',
  slug: 'siemens',
  title: 'Data Scientist',
  summary: 'An opening line.',
  metadata: { kicker: 'Work', group: 'work', order: 0 },
  ...over,
});

describe('reading a row', () => {
  it('leaves a monolingual row exactly as it is', () => {
    const entry = hydrateEntry(row());
    expect(entry.title).toBe('Data Scientist');
    expect(entry.summary).toBe('An opening line.');
    expect(entry.metadata).toEqual({ kicker: 'Work', group: 'work', order: 0 });
  });

  it('puts the languages back on the prose and hides the sidecar', () => {
    const entry = hydrateEntry(row({
      metadata: {
        kicker: 'Work',
        [I18N_KEY]: {
          title: { es: 'Científico de datos', en: 'Data Scientist' },
          summary: { es: 'Una entradilla.' },
        },
      },
    }));
    expect(entry.title).toEqual({ es: 'Científico de datos', en: 'Data Scientist' });
    expect(entry.summary).toEqual({ es: 'Una entradilla.' });
    // Nothing above this boundary should ever see the sidecar.
    expect(entry.metadata).toEqual({ kicker: 'Work' });
  });

  it('keeps the column when the sidecar has nothing to say', () => {
    const entry = hydrateEntry(row({ metadata: { [I18N_KEY]: { title: { es: '  ' } } } }));
    expect(entry.title).toBe('Data Scientist');
  });

  it('ignores a sidecar that is not a language map', () => {
    const entry = hydrateEntry(row({ metadata: { [I18N_KEY]: { title: 'oops' } } }));
    expect(entry.title).toBe('Data Scientist');
  });
});

describe('writing a row', () => {
  it('never sends an object to a text column', () => {
    const stored = dehydrateEntry(row({
      title: { es: 'Científico de datos', en: 'Data Scientist' },
      summary: { es: 'Una entradilla.', en: 'An opening line.' },
    }), 'es');
    // This is the bug that put "[object Object]" on the public board.
    expect(typeof stored.title).toBe('string');
    expect(typeof stored.summary).toBe('string');
    expect(stored.title).toBe('Científico de datos');
    expect(stored.metadata[I18N_KEY]).toEqual({
      title: { es: 'Científico de datos', en: 'Data Scientist' },
      summary: { es: 'Una entradilla.', en: 'An opening line.' },
    });
  });

  it('projects the primary language, and any language rather than nothing', () => {
    expect(dehydrateEntry(row({ title: { es: 'Hola', en: 'Hello' } }), 'en').title).toBe('Hello');
    // The primary has no text of its own: the column must still not be blank,
    // because the database rejects one.
    expect(dehydrateEntry(row({ title: { es: '   ', en: 'Hello' } }), 'es').title).toBe('Hello');
    expect(dehydrateEntry(row({ title: { en: 'Hello' } })).title).toBe('Hello');
  });

  it('adds no sidecar for prose that has only one language', () => {
    const stored = dehydrateEntry(row(), 'es');
    expect(stored.metadata[I18N_KEY]).toBeUndefined();
    expect(stored.metadata).toEqual({ kicker: 'Work', group: 'work', order: 0 });
  });

  it('removes a stale sidecar when the languages are gone', () => {
    const stored = dehydrateEntry(row({
      metadata: { kicker: 'Work', [I18N_KEY]: { title: { es: 'viejo' } } },
    }), 'es');
    expect(stored.metadata[I18N_KEY]).toBeUndefined();
  });
});

describe('a round trip', () => {
  it('gives back exactly what went in', () => {
    const entry = row({
      title: { es: 'Científico de datos', en: 'Data Scientist' },
      summary: { es: 'Una entradilla.', en: 'An opening line.' },
    });
    expect(hydrateEntry(dehydrateEntry(entry, 'es'))).toEqual(entry);
  });

  it('survives a monolingual entry unchanged', () => {
    const entry = row();
    expect(hydrateEntry(dehydrateEntry(entry, 'es'))).toEqual(entry);
  });
});
