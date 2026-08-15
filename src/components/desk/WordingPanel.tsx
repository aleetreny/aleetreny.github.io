import { useMemo, useState } from 'react';
import {
  UI_KEYS,
  UI_SECTIONS,
  clearUiLanguage,
  defaultUiText,
  hasUiOverride,
  sectionLabel,
  setUiOverride,
  uiOverrideText,
  type UiOverrides,
} from '../../lib/ui-text';
import { useUiText } from './ui-text-context';

type WordingPanelProps = {
  overrides: UiOverrides;
  /** The language being written, and the one every fallback lands on. */
  language: string;
  languageLabel: string;
  primary: string;
  onChange: (next: UiOverrides) => void;
  onClose: () => void;
};

/** Section a key belongs to: the longest matching prefix, so `card.` does not
 *  swallow `cardmenu.`. */
function sectionOf(key: string): string {
  let best = '';
  for (const section of UI_SECTIONS) {
    if (key.startsWith(section.prefix) && section.prefix.length > best.length) best = section.prefix;
  }
  return best || 'other';
}

/** Every word of chrome, editable per language.
 *
 *  This is the other half of the bilingual board: prose lives in the documents
 *  and is edited in place, but the buttons around it used to be English
 *  literals compiled into the bundle. Here they are data — with a built-in
 *  default underneath, so an empty box means "use the wording that ships"
 *  rather than "show nothing". */
export function WordingPanel({
  overrides, language, languageLabel, primary, onChange, onClose,
}: WordingPanelProps) {
  const t = useUiText();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const bySection = new Map<string, string[]>();
    for (const key of UI_KEYS) {
      if (needle) {
        const haystack = `${key} ${defaultUiText(key, language, primary)} ${uiOverrideText(overrides, key, language)}`;
        if (!haystack.toLowerCase().includes(needle)) continue;
      }
      const section = sectionOf(key);
      const list = bySection.get(section);
      if (list) list.push(key); else bySection.set(section, [key]);
    }
    return [...bySection];
  }, [query, language, primary, overrides]);

  const changed = UI_KEYS.filter((key) => hasUiOverride(overrides, key, language)).length;

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label={t('wording.aria')}>
        <div className="panel__eyebrow">{t('wording.eyebrow')} · {language.toUpperCase()}</div>
        <div className="panel__title">{t('wording.title')}</div>
        <p className="panel__hint">{t('wording.hint', { language: languageLabel })}</p>

        <input
          className="field"
          type="search"
          placeholder={t('wording.search')}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="wording__list">
          {groups.length === 0 ? <div className="panel__note">{t('wording.empty')}</div> : null}
          {groups.map(([prefix, keys]) => (
            <div key={prefix}>
              <div className="panel__section">{sectionLabel(prefix, language)}</div>
              {keys.map((key) => {
                const fallback = defaultUiText(key, language, primary);
                const own = uiOverrideText(overrides, key, language);
                const multiline = fallback.includes('\n') || fallback.length > 64;
                return (
                  <div className="wording__row" key={key}>
                    <label className="wording__key" htmlFor={`ui-${key}`} title={key}>
                      {key}
                      {own.trim() ? <span className="wording__flag">{t('wording.changed')}</span> : null}
                    </label>
                    <span className="wording__field">
                      {multiline ? (
                        <textarea
                          id={`ui-${key}`}
                          rows={2}
                          value={own}
                          placeholder={fallback}
                          onChange={(event) => onChange(setUiOverride(overrides, key, language, event.target.value))}
                        />
                      ) : (
                        <input
                          id={`ui-${key}`}
                          type="text"
                          value={own}
                          placeholder={fallback}
                          onChange={(event) => onChange(setUiOverride(overrides, key, language, event.target.value))}
                        />
                      )}
                      <button
                        className="editdel"
                        type="button"
                        disabled={!own.trim()}
                        title={t('wording.reset')}
                        aria-label={`${t('wording.reset')} ${key}`}
                        onClick={() => onChange(setUiOverride(overrides, key, language, ''))}
                      >×</button>
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="panel__actions">
          <button
            className="tbtn"
            type="button"
            disabled={changed === 0}
            onClick={() => {
              if (window.confirm(t('wording.confirmResetAll', { language: languageLabel }))) {
                onChange(clearUiLanguage(overrides, language));
              }
            }}
          >{t('wording.resetAll')} · {changed}</button>
          <button className="tbtn tbtn--on" type="button" onClick={onClose}>{t('wording.done')}</button>
        </div>
      </div>
    </div>
  );
}
