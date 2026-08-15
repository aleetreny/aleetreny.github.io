import { describe, expect, it } from 'vitest';
import {
  UI_KEYS,
  UI_SECTIONS,
  clearUiLanguage,
  defaultUiText,
  fillVars,
  hasUiOverride,
  makeUiText,
  parseUiOverrides,
  setUiOverride,
  uiOverrideText,
} from './ui-text';

describe('interface wording', () => {
  it('ships a Spanish and an English default for every key', () => {
    expect(UI_KEYS.length).toBeGreaterThan(100);
    for (const key of UI_KEYS) {
      expect(defaultUiText(key, 'es'), `es: ${key}`).not.toBe('');
      expect(defaultUiText(key, 'en'), `en: ${key}`).not.toBe('');
    }
  });

  it('files every key under exactly one section', () => {
    for (const key of UI_KEYS) {
      const matches = UI_SECTIONS.filter((section) => key.startsWith(section.prefix));
      expect(matches.length, `${key} has no section`).toBeGreaterThan(0);
    }
  });

  it('reads the built-in wording when nothing is overridden', () => {
    const t = makeUiText({}, 'es', 'es');
    expect(t('owner.entries')).toBe('artículos');
    expect(makeUiText({}, 'en', 'es')('owner.entries')).toBe('entries');
  });

  it('prefers the owner override, per language', () => {
    const overrides = setUiOverride({}, 'owner.entries', 'es', 'dossiers');
    expect(makeUiText(overrides, 'es', 'es')('owner.entries')).toBe('dossiers');
    // The other language is untouched and still built in.
    expect(makeUiText(overrides, 'en', 'es')('owner.entries')).toBe('entries');
  });

  it('falls back to the primary language, then to the built-in text', () => {
    // A third language with no built-in wording of its own.
    const t = makeUiText({}, 'fr', 'es');
    expect(t('owner.entries')).toBe('artículos');
    // And an unknown key never renders blank.
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('drops an override when the owner empties the box', () => {
    const written = setUiOverride({}, 'board.fit', 'es', 'ajustar');
    expect(hasUiOverride(written, 'board.fit', 'es')).toBe(true);
    const cleared = setUiOverride(written, 'board.fit', 'es', '   ');
    expect(hasUiOverride(cleared, 'board.fit', 'es')).toBe(false);
    expect(makeUiText(cleared, 'es', 'es')('board.fit')).toBe('encajar');
  });

  it('keeps the other language when one is reset wholesale', () => {
    let overrides = setUiOverride({}, 'board.fit', 'es', 'ajustar');
    overrides = setUiOverride(overrides, 'board.fit', 'en', 'frame');
    const cleared = clearUiLanguage(overrides, 'es');
    expect(uiOverrideText(cleared, 'board.fit', 'es')).toBe('');
    expect(uiOverrideText(cleared, 'board.fit', 'en')).toBe('frame');
  });

  it('fills the slots a label declares and leaves unknown ones alone', () => {
    expect(fillVars('{count} artículos', { count: 3 })).toBe('3 artículos');
    expect(fillVars('{missing} cosas', {})).toBe('{missing} cosas');
    expect(makeUiText({}, 'es', 'es')('card.more', { count: 4 })).toBe('+ 4 más');
  });

  it('reads stored overrides defensively', () => {
    expect(parseUiOverrides(null)).toEqual({});
    expect(parseUiOverrides({ 'a.b': 42, 'c.d': { es: 'sí', en: 7 } })).toEqual({ 'c.d': { es: 'sí' } });
    expect(parseUiOverrides({ 'e.f': 'plain' })).toEqual({ 'e.f': 'plain' });
  });

  it('never lets an override blank the interface', () => {
    // A stored empty string is treated as "no override", not as "say nothing".
    const t = makeUiText({ 'board.fit': { es: '' } }, 'es', 'es');
    expect(t('board.fit')).toBe('encajar');
  });
});
