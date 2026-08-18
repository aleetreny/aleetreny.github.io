import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_I18N,
  boardTextSlots,
  entryTextSlots,
  hasText,
  initialLanguage,
  localise,
  mergeEdit,
  missingAt,
  parseI18n,
  pickText,
  putText,
  readAt,
  setAt,
  writeAt,
} from './i18n';

describe('localised values', () => {
  it('reads a plain string as the primary language', () => {
    expect(pickText('hola', 'en', 'es')).toBe('hola');
    expect(pickText('hola', 'es', 'es')).toBe('hola');
  });

  it('prefers the wanted language, then the primary, then anything', () => {
    const value = { es: 'hola', en: 'hello' };
    expect(pickText(value, 'en', 'es')).toBe('hello');
    expect(pickText(value, 'fr', 'es')).toBe('hola');
    expect(pickText({ fr: 'salut' }, 'en', 'es')).toBe('salut');
    expect(pickText({ es: '  ' }, 'es', 'es')).toBe('');
    expect(pickText(undefined, 'es', 'es')).toBe('');
  });

  it('knows whether a language has text of its own', () => {
    expect(hasText({ es: 'hola' }, 'en', 'es')).toBe(false);
    expect(hasText({ es: 'hola', en: 'hello' }, 'en', 'es')).toBe(true);
    expect(hasText({ es: 'hola', en: '   ' }, 'en', 'es')).toBe(false);
    // A plain string belongs to the primary language and to no other.
    expect(hasText('hola', 'es', 'es')).toBe(true);
    expect(hasText('hola', 'en', 'es')).toBe(false);
  });

  it('stays a plain string until a second language actually needs one', () => {
    expect(putText('hola', 'es', 'adiós', 'es')).toBe('adiós');
    expect(putText('hola', 'en', 'hello', 'es')).toEqual({ es: 'hola', en: 'hello' });
    expect(putText({ es: 'hola' }, 'en', 'hello', 'es')).toEqual({ es: 'hola', en: 'hello' });
    expect(putText(undefined, 'en', 'hello', 'es')).toEqual({ en: 'hello' });
  });
});

describe('localising a document', () => {
  const board = {
    size: { width: 2540, height: 2290 },
    groups: [{ id: 'work', label: { es: 'Trabajo', en: 'Paid work' } }],
    cards: [
      { id: 'hero', type: 'hero', tone: 'paper', name: { es: 'Hola', en: 'Hello' }, x: 1, y: 2 },
      { id: 'now', type: 'now', title: 'sin traducir' },
    ],
    marginalia: [{ id: 'n1', style: 'amber', text: { es: 'Nota', en: 'Note' } }],
  };

  it('resolves every language map and leaves structure alone', () => {
    const en = localise(board, 'en', 'es');
    expect(en.groups[0].label).toBe('Paid work');
    expect(en.cards[0].name).toBe('Hello');
    expect(en.marginalia[0].text).toBe('Note');
    // Structure survives untouched.
    expect(en.cards[0].tone).toBe('paper');
    expect(en.cards[0].x).toBe(1);
    expect(en.size).toEqual({ width: 2540, height: 2290 });
  });

  it('falls back to the primary rather than leaving a hole', () => {
    expect(localise(board, 'en', 'es').cards[1].title).toBe('sin traducir');
  });

  it('never mistakes a content object for a language map', () => {
    // `url`/`alt` are content keys, not language codes.
    const block = { props: { url: 'https://x', alt: 'a photo', caption: { es: 'pie', en: 'caption' } } };
    const en = localise(block, 'en', 'es');
    expect(en.props.url).toBe('https://x');
    expect(en.props.alt).toBe('a photo');
    expect(en.props.caption).toBe('caption');
  });
});

describe('paths', () => {
  const doc = { a: { b: [{ c: 'x' }] } };

  it('reads and replaces at a path', () => {
    expect(readAt(doc, ['a', 'b', 0, 'c'])).toBe('x');
    expect(readAt(doc, ['a', 'nope', 3])).toBeUndefined();
    expect(setAt(doc, ['a', 'b', 0, 'c'], 'y')).toEqual({ a: { b: [{ c: 'y' }] } });
    // The original is untouched.
    expect(doc.a.b[0].c).toBe('x');
  });

  it('writes one language slot at a path', () => {
    const next = writeAt(doc, ['a', 'b', 0, 'c'], 'en', 'ex', 'es');
    expect(readAt(next, ['a', 'b', 0, 'c'])).toEqual({ es: 'x', en: 'ex' });
  });
});

describe('finding prose', () => {
  const board = {
    groups: [{ id: 'work', label: 'Trabajo' }],
    cards: [{ id: 'hero', type: 'hero', tone: 'paper', jump: 'me', name: 'Alejandro', title: 'Hola', layout: 'list' }],
    polaroids: [{ id: 'p1', caption: 'Asunción', assetUrl: 'https://x' }],
    marginalia: [{ id: 'n1', style: 'amber', text: 'Una nota' }],
  };

  it('finds prose and never structure', () => {
    const slots = boardTextSlots(board).map((p) => p.join('.'));
    expect(slots).toContain('groups.0.label');
    expect(slots).toContain('cards.0.name');
    expect(slots).toContain('cards.0.title');
    expect(slots).toContain('polaroids.0.caption');
    expect(slots).toContain('marginalia.0.text');
    // Ids, tones, layouts, jump names and asset URLs must never be translated.
    for (const forbidden of ['cards.0.id', 'cards.0.tone', 'cards.0.jump', 'cards.0.layout', 'groups.0.id', 'polaroids.0.assetUrl', 'marginalia.0.style']) {
      expect(slots, forbidden).not.toContain(forbidden);
    }
  });

  it('finds a dossier title, opening line, metadata and body', () => {
    const entry = {
      title: 'Siemens',
      summary: 'Un resumen',
      entryType: 'experience',
      status: 'published',
      metadata: { kicker: 'Trabajo', when: '2025', where: 'Madrid', group: 'work', order: 0 },
      blocks: [
        { id: 'b1', type: 'text', props: { text: 'Un párrafo' } },
        { id: 'b2', type: 'list', props: { items: ['uno', 'dos'] } },
        { id: 'b3', type: 'image', props: { url: 'https://x', alt: 'foto', caption: 'pie' } },
      ],
    };
    const slots = entryTextSlots(entry).map((p) => p.join('.'));
    expect(slots).toEqual(expect.arrayContaining([
      'title', 'summary', 'metadata.kicker', 'metadata.when', 'metadata.where',
      'blocks.0.props.text', 'blocks.1.props.items.0', 'blocks.1.props.items.1',
      'blocks.2.props.alt', 'blocks.2.props.caption',
    ]));
    // The status, the type, the group key and an image URL are not prose.
    for (const forbidden of ['status', 'entryType', 'metadata.group', 'metadata.order', 'blocks.2.props.url']) {
      expect(slots, forbidden).not.toContain(forbidden);
    }
  });

  it('lists only what the target language is missing', () => {
    const board2 = {
      cards: [
        { id: 'a', title: { es: 'Hola', en: 'Hello' } },
        { id: 'b', title: { es: 'Adiós' } },
        { id: 'c', title: 'Plano' },
        { id: 'd', title: '' },
      ],
    };
    const jobs = missingAt(board2, boardTextSlots(board2), ['es', 'en'], 'en', 'es');
    expect(jobs.map((j) => j.text)).toEqual(['Adiós', 'Plano']);
    expect(jobs.every((j) => j.from === 'es')).toBe(true);
  });

  it('seeds the primary from another language when only that one has text', () => {
    // A board authored in English being brought over to a Spanish primary.
    const board2 = { cards: [{ id: 'a', title: { en: 'Hello' } }, { id: 'b', title: { en: 'Bye', es: 'Adiós' } }] };
    const jobs = missingAt(board2, boardTextSlots(board2), ['es', 'en'], 'es', 'es');
    expect(jobs).toEqual([{ path: ['cards', 0, 'title'], text: 'Hello', from: 'en' }]);
  });

  it('refreshes an article title from the language being edited', () => {
    const entry = {
      title: { es: 'Nuevo título', en: 'Old title' },
      summary: { es: 'Resumen nuevo', en: 'Old summary' },
      metadata: {},
      blocks: [],
    };
    const jobs = missingAt(entry, entryTextSlots(entry), ['es', 'en'], 'en', 'en', 'refresh', 'es');
    expect(jobs).toEqual([
      { path: ['title'], text: 'Nuevo título', from: 'es' },
      { path: ['summary'], text: 'Resumen nuevo', from: 'es' },
    ]);
  });
});

describe('folding an edit back', () => {
  const raw = {
    title: { es: 'Hola', en: 'Hello' },
    summary: { es: 'Resumen' },
    blocks: [{ id: 'b1', type: 'text', props: { text: { es: 'Uno', en: 'One' } } }],
  };

  it('writes only the field that changed, into the language being edited', () => {
    const edited = { ...localise(raw, 'en', 'es'), title: 'Hello there' };
    const merged = mergeEdit(raw, edited, entryTextSlots(edited), 'en', 'es');
    expect(merged.title).toEqual({ es: 'Hola', en: 'Hello there' });
    // The block was not touched, so its languages survive intact.
    expect(readAt(merged, ['blocks', 0, 'props', 'text'])).toEqual({ es: 'Uno', en: 'One' });
  });

  it('never stamps the fallback into an empty language just by looking at it', () => {
    // `summary` has no English, so the English view shows the Spanish. Saving
    // without touching it must not make that Spanish text "the translation".
    const edited = localise(raw, 'en', 'es');
    const merged = mergeEdit(raw, edited, entryTextSlots(edited), 'en', 'es');
    expect(merged.summary).toEqual({ es: 'Resumen' });
  });

  it('keeps a structural change from the edited copy', () => {
    const edited = { ...localise(raw, 'es', 'es'), blocks: [] };
    const merged = mergeEdit(raw, edited, entryTextSlots(edited), 'es', 'es');
    expect(merged.blocks).toEqual([]);
    expect(merged.title).toEqual({ es: 'Hola', en: 'Hello' });
  });
});

describe('the visitor’s language', () => {
  afterEach(() => { vi.unstubAllGlobals(); });

  const config = parseI18n({
    enabled: true,
    primary: 'es',
    languages: [{ code: 'es', label: 'ES' }, { code: 'en', label: 'EN' }],
    followBrowser: true,
  });

  it('is the primary when the feature is off', () => {
    expect(initialLanguage(parseI18n({ enabled: false }))).toBe(DEFAULT_I18N.primary);
  });

  it('prefers a remembered choice', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => 'en', setItem: () => {} } });
    vi.stubGlobal('navigator', { languages: ['es-ES'] });
    expect(initialLanguage(config)).toBe('en');
  });

  it('otherwise follows the browser, then the primary', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem: () => {} } });
    vi.stubGlobal('navigator', { languages: ['en-GB', 'fr'] });
    expect(initialLanguage(config)).toBe('en');
    vi.stubGlobal('navigator', { languages: ['de'] });
    expect(initialLanguage(config)).toBe('es');
  });
});

describe('the i18n document', () => {
  it('falls back to a valid primary when the stored one is gone', () => {
    const parsed = parseI18n({ primary: 'de', languages: [{ code: 'es', label: 'ES' }] });
    expect(parsed.primary).toBe('es');
  });

  it('drops malformed languages and duplicates', () => {
    const parsed = parseI18n({ languages: [{ code: 'es', label: 'ES' }, { code: 'es', label: 'dup' }, { nope: 1 }] });
    expect(parsed.languages).toEqual([{ code: 'es', label: 'ES' }]);
  });

  it('ships the seeded language setup', () => {
    // This board is authored in English and published in both.
    expect(DEFAULT_I18N.enabled).toBe(true);
    expect(DEFAULT_I18N.primary).toBe('en');
    expect(DEFAULT_I18N.languages.map((l) => l.code)).toEqual(['en', 'es']);
    expect(DEFAULT_I18N.followBrowser).toBe(false);
    expect(parseI18n(null)).toEqual(DEFAULT_I18N);
  });

  it('starts in English instead of following a Spanish browser locale', () => {
    vi.stubGlobal('window', { localStorage: { getItem: () => null, setItem: () => {} } });
    vi.stubGlobal('navigator', { languages: ['es-ES'] });
    expect(initialLanguage(DEFAULT_I18N)).toBe('en');
  });

  it('turns off cleanly for a fork that wants one language', () => {
    const off = parseI18n({ enabled: false });
    expect(off.enabled).toBe(false);
    expect(initialLanguage(off)).toBe(off.primary);
  });
});
