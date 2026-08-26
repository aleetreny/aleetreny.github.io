import { TRANSLATE_PROVIDERS, type I18nConfig, type LanguageOption } from '../../lib/i18n';
import {
  BODY_FACES,
  BOARD_STYLE_IDS,
  CARD_EDGES,
  CARD_FASTENERS,
  CARD_LIFTS,
  DOSSIER_ENTERS,
  DOSSIER_LEDES,
  DOSSIER_TITLE_CASES,
  GRID_MODES,
  PATTERN_STYLES,
  THEME_PRESETS,
  WALL_STYLE_IDS,
  type BackdropConfig,
  type BoardStyle,
  type CardsConfig,
  type DossierConfig,
  type ThemeConfig,
} from '../../lib/board';
import { useUiText } from './ui-text-context';

type ThemePanelProps = {
  theme: ThemeConfig;
  onChange: (next: ThemeConfig) => void;
  i18n: I18nConfig;
  onI18nChange: (next: I18nConfig) => void;
  onClose: () => void;
};

const COLOR_TOKENS: Array<keyof ThemeConfig['colors']> = [
  'accent', 'accent2', 'signal', 'signalSoft', 'lab', 'paper', 'paperWarm',
  'paperCream', 'ink', 'dark', 'slate', 'slateInk', 'darkInk',
];

function NumberRow({ id, label, value, min, max, step = 1, suffix, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <span className="field-pair">
        <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(event) => onChange(Number(event.target.value))} />
        <input
          id={id}
          className="field-num"
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, next)));
          }}
        />
        {suffix ? <span className="field-suffix">{suffix}</span> : null}
      </span>
    </div>
  );
}

export function ThemePanel({ theme, onChange, i18n, onI18nChange, onClose }: ThemePanelProps) {
  const t = useUiText();
  const setColor = (token: keyof ThemeConfig['colors'], value: string) =>
    onChange({ ...theme, colors: { ...theme.colors, [token]: value } });
  const setFont = (key: keyof ThemeConfig['fonts'], value: string | number) =>
    onChange({ ...theme, fonts: { ...theme.fonts, [key]: value } });
  const back = theme.backdrop;
  const setBack = <K extends keyof BackdropConfig>(key: K, value: BackdropConfig[K]) =>
    onChange({ ...theme, backdrop: { ...back, [key]: value } });
  const cards = theme.cards;
  const setCards = <K extends keyof CardsConfig>(key: K, value: CardsConfig[K]) =>
    onChange({ ...theme, cards: { ...cards, [key]: value } });
  const setLang = <K extends keyof I18nConfig>(key: K, value: I18nConfig[K]) => onI18nChange({ ...i18n, [key]: value });
  const setLanguageAt = (index: number, patch: Partial<LanguageOption>) =>
    setLang('languages', i18n.languages.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const doss = theme.dossier;
  const setDoss = <K extends keyof DossierConfig>(key: K, value: DossierConfig[K]) =>
    onChange({ ...theme, dossier: { ...doss, [key]: value } });

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label={t('themepanel.aria')}>
        <div className="panel__eyebrow">{t('themepanel.eyebrow')}</div>
        <div className="panel__title">{t('themepanel.title')}</div>
        <p className="panel__hint">{t('themepanel.hint')}</p>

        <div className="panel__section">{t('themepanel.looks')}</div>
        <div className="panel__note">{t('themepanel.looksHint')}</div>
        <div className="presets">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="presets__btn"
              title={t(`themepanel.preset.${preset.id}.hint`)}
              onClick={() => onChange(preset.patch(theme))}
            >
              {t(`themepanel.preset.${preset.id}.label`)}
            </button>
          ))}
        </div>

        <div className="panel__section">{t('themepanel.board')}</div>
        <div className="field-row">
          <label htmlFor="theme-style">{t('themepanel.texture')}</label>
          <select
            id="theme-style"
            value={theme.boardStyle}
            onChange={(event) => onChange({ ...theme, boardStyle: event.target.value as BoardStyle })}
          >
            {BOARD_STYLE_IDS.map((style) => <option key={style} value={style}>{t(`option.${style}`)}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="theme-chaos">{t('themepanel.cardTilt')}</label>
          <input
            id="theme-chaos"
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={theme.chaos}
            onChange={(event) => onChange({ ...theme, chaos: Number(event.target.value) })}
          />
        </div>
        <div className="field-row">
          <label htmlFor="theme-radius">{t('themepanel.cornerRadius')}</label>
          <input
            id="theme-radius"
            type="range"
            min={0}
            max={20}
            step={1}
            value={theme.cardRadius}
            onChange={(event) => onChange({ ...theme, cardRadius: Number(event.target.value) })}
          />
        </div>
        <div className="field-row">
          <label htmlFor="theme-marginalia">{t('themepanel.stickyNotes')}</label>
          <input
            id="theme-marginalia"
            type="checkbox"
            checked={theme.showMarginalia}
            onChange={(event) => onChange({ ...theme, showMarginalia: event.target.checked })}
          />
        </div>

        <div className="panel__section">{t('themepanel.backdrop')}</div>
        <div className="field-row">
          <label htmlFor="theme-plate">{t('themepanel.hangWall')}</label>
          <input
            id="theme-plate"
            type="checkbox"
            checked={back.plate}
            onChange={(event) => setBack('plate', event.target.checked)}
          />
        </div>
        <div className="panel__note">
          {t(back.plate ? 'themepanel.plateOnHint' : 'themepanel.plateOffHint')}
        </div>
        {back.plate ? (
          <>
            <div className="field-row">
              <label htmlFor="theme-wall">{t('themepanel.wall')}</label>
              <select id="theme-wall" value={back.wall} onChange={(event) => setBack('wall', event.target.value as BackdropConfig['wall'])}>
                {WALL_STYLE_IDS.map((wall) => <option key={wall} value={wall}>{t(`option.${wall}`)}</option>)}
              </select>
            </div>
            {back.wall === 'custom' ? (
              <>
                <div className="field-row">
                  <label htmlFor="theme-wallc1">{t('themepanel.wallCentre')}</label>
                  <input id="theme-wallc1" type="color" value={back.wallColor} onChange={(event) => setBack('wallColor', event.target.value)} />
                </div>
                <div className="field-row">
                  <label htmlFor="theme-wallc2">{t('themepanel.wallEdge')}</label>
                  <input id="theme-wallc2" type="color" value={back.wallColor2} onChange={(event) => setBack('wallColor2', event.target.value)} />
                </div>
              </>
            ) : null}
            <NumberRow id="theme-grain" label={t('themepanel.plasterGrain')} value={back.grain} min={0} max={1} step={0.05} onChange={(v) => setBack('grain', v)} />
            <NumberRow id="theme-vignette" label={t('themepanel.vignette')} value={back.vignette} min={0} max={1} step={0.05} onChange={(v) => setBack('vignette', v)} />
            <NumberRow id="theme-margin" label={t('themepanel.slateMargin')} value={back.plateMargin} min={0} max={220} suffix="px" onChange={(v) => setBack('plateMargin', v)} />
            <NumberRow id="theme-frame" label={t('themepanel.frame')} value={back.frame} min={0} max={40} suffix="px" onChange={(v) => setBack('frame', v)} />
            <NumberRow id="theme-shadow" label={t('themepanel.slateShadow')} value={back.plateShadow} min={0} max={1.6} step={0.05} suffix="×" onChange={(v) => setBack('plateShadow', v)} />
            <div className="field-row">
              <label htmlFor="theme-studs">{t('themepanel.cornerStuds')}</label>
              <input id="theme-studs" type="checkbox" checked={back.studs} onChange={(event) => setBack('studs', event.target.checked)} />
            </div>
            {back.studs ? (
              <>
                <NumberRow id="theme-studsize" label={t('themepanel.studSize')} value={back.studSize} min={6} max={60} suffix="px" onChange={(v) => setBack('studSize', v)} />
                <NumberRow id="theme-studinset" label={t('themepanel.studInset')} value={back.studInset} min={0} max={140} suffix="px" onChange={(v) => setBack('studInset', v)} />
              </>
            ) : null}
          </>
        ) : null}
        <div className="field-row">
          <label htmlFor="theme-grid">{t('themepanel.pattern')}</label>
          <select id="theme-grid" value={back.grid} onChange={(event) => setBack('grid', event.target.value as BackdropConfig['grid'])}>
            {GRID_MODES.map((mode) => <option key={mode} value={mode}>{t(`option.${mode}`)}</option>)}
          </select>
        </div>
        <div className="panel__note">
          {t(back.grid === 'plate' && !back.plate ? 'themepanel.gridFallback' : `themepanel.gridHint.${back.grid}`)}
        </div>
        {back.grid !== 'off' ? (
          <>
            <div className="field-row">
              <label htmlFor="theme-pattern">{t('themepanel.patternStyle')}</label>
              <select id="theme-pattern" value={back.pattern} onChange={(event) => setBack('pattern', event.target.value as BackdropConfig['pattern'])}>
                {PATTERN_STYLES.map((style) => <option key={style} value={style}>{t(`option.${style}`)}</option>)}
              </select>
            </div>
            {back.pattern !== 'texture' && back.pattern !== 'none' ? (
              <>
                <div className="field-row">
                  <label htmlFor="theme-patternink">{t('themepanel.patternInk')}</label>
                  <select id="theme-patternink" value={back.patternInk} onChange={(event) => setBack('patternInk', event.target.value as BackdropConfig['patternInk'])}>
                    {(['auto', 'light', 'dark'] as const).map((ink) => <option key={ink} value={ink}>{t(`option.${ink}`)}</option>)}
                  </select>
                </div>
                <NumberRow id="theme-patternfade" label={t('themepanel.patternStrength')} value={back.patternFade} min={0} max={2} step={0.05} suffix="×" onChange={(v) => setBack('patternFade', v)} />
              </>
            ) : null}
            <NumberRow id="theme-gridscale" label={t('themepanel.patternScale')} value={back.gridScale} min={0.4} max={3} step={0.1} suffix="×" onChange={(v) => setBack('gridScale', v)} />
          </>
        ) : null}

        {back.plate ? (
          <>
            <div className="panel__section">{t('themepanel.slateColour')}</div>
            <div className="panel__note">{t('themepanel.slateColourHint')}</div>
            <div className="field-row">
              <label htmlFor="theme-slate1">{t('themepanel.slateCentre')}</label>
              <input id="theme-slate1" type="color" value={back.slate || '#2e3a38'} onChange={(event) => setBack('slate', event.target.value)} />
            </div>
            <div className="field-row">
              <label htmlFor="theme-slate2">{t('themepanel.slateEdge')}</label>
              <input id="theme-slate2" type="color" value={back.slate2 || back.slate || '#172120'} onChange={(event) => setBack('slate2', event.target.value)} />
            </div>
            <div className="field-row">
              <label htmlFor="theme-slateink">{t('themepanel.slateInk')}</label>
              <input id="theme-slateink" type="color" value={back.slateInk || '#f0ece1'} onChange={(event) => setBack('slateInk', event.target.value)} />
            </div>
            {back.slate || back.slate2 || back.slateInk ? (
              <button className="tbtn" type="button" onClick={() => onChange({ ...theme, backdrop: { ...back, slate: '', slate2: '', slateInk: '' } })}>
                {t('themepanel.resetSlateColour')}
              </button>
            ) : null}
          </>
        ) : null}

        <div className="panel__section">{t('themepanel.cards')}</div>
        <div className="field-row">
          <label htmlFor="card-edge">{t('themepanel.edge')}</label>
          <select id="card-edge" value={cards.edge} onChange={(e) => setCards('edge', e.target.value as CardsConfig['edge'])}>
            {CARD_EDGES.map((edge) => <option key={edge} value={edge}>{t(`option.${edge}`)}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="card-fastener">{t('themepanel.fastenedWith')}</label>
          <select id="card-fastener" value={cards.fastener} onChange={(e) => setCards('fastener', e.target.value as CardsConfig['fastener'])}>
            {CARD_FASTENERS.map((f) => <option key={f} value={f}>{t(`option.${f}`)}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="card-lift">{t('themepanel.onHover')}</label>
          <select id="card-lift" value={cards.lift} onChange={(e) => setCards('lift', e.target.value as CardsConfig['lift'])}>
            {CARD_LIFTS.map((l) => <option key={l} value={l}>{t(`option.${l}`)}</option>)}
          </select>
        </div>
        <NumberRow id="card-shadow" label={t('themepanel.shadow')} value={cards.shadow} min={0} max={2.5} step={0.05} suffix="×" onChange={(v) => setCards('shadow', v)} />
        <NumberRow id="card-grain" label={t('themepanel.paperGrain')} value={cards.grain} min={0} max={1} step={0.05} onChange={(v) => setCards('grain', v)} />
        <NumberRow id="card-pad" label={t('themepanel.innerPadding')} value={cards.padding} min={8} max={48} suffix="px" onChange={(v) => setCards('padding', v)} />
        <NumberRow id="card-rowc" label={t('themepanel.rowTint')} value={cards.rowContrast} min={0} max={1} step={0.05} onChange={(v) => setCards('rowContrast', v)} />
        <NumberRow id="card-rowrule" label={t('themepanel.rowRule')} value={cards.rowRule} min={0} max={10} suffix="px" onChange={(v) => setCards('rowRule', v)} />

        <div className="panel__section">{t('themepanel.articles')}</div>
        <div className="panel__note">{t('themepanel.articlesHint')}</div>
        <NumberRow id="doss-width" label={t('themepanel.plateWidth')} value={doss.width} min={520} max={1800} step={10} suffix="px" onChange={(v) => setDoss('width', v)} />
        <NumberRow id="doss-measure" label={t('themepanel.measure')} value={doss.measure} min={32} max={110} suffix="ch" onChange={(v) => setDoss('measure', v)} />
        <div className="field-row">
          <label htmlFor="doss-face">{t('themepanel.bodyFace')}</label>
          <select id="doss-face" value={doss.bodyFace} onChange={(e) => setDoss('bodyFace', e.target.value as DossierConfig['bodyFace'])}>
            {BODY_FACES.map((f) => <option key={f} value={f}>{t(`option.${f}`)}</option>)}
          </select>
        </div>
        <NumberRow id="doss-size" label={t('themepanel.bodySize')} value={doss.bodySize} min={12} max={26} step={0.5} suffix="px" onChange={(v) => setDoss('bodySize', v)} />
        <NumberRow id="doss-lead" label={t('themepanel.leading')} value={doss.bodyLeading} min={1.2} max={2.2} step={0.02} onChange={(v) => setDoss('bodyLeading', v)} />
        <NumberRow id="doss-title" label={t('themepanel.titleSize')} value={doss.titleSize} min={22} max={90} suffix="px" onChange={(v) => setDoss('titleSize', v)} />
        <NumberRow id="doss-tweight" label={t('themepanel.titleWeight')} value={doss.titleWeight} min={300} max={900} step={100} onChange={(v) => setDoss('titleWeight', v)} />
        <NumberRow id="doss-ttrack" label={t('themepanel.titleTracking')} value={doss.titleTracking} min={-0.08} max={0.2} step={0.005} suffix="em" onChange={(v) => setDoss('titleTracking', v)} />
        <div className="field-row">
          <label htmlFor="doss-tcase">{t('themepanel.titleCase')}</label>
          <select id="doss-tcase" value={doss.titleCase} onChange={(e) => setDoss('titleCase', e.target.value as DossierConfig['titleCase'])}>
            {DOSSIER_TITLE_CASES.map((c) => <option key={c} value={c}>{t(`option.${c}`)}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="doss-lede">{t('themepanel.openingLine')}</label>
          <select id="doss-lede" value={doss.lede} onChange={(e) => setDoss('lede', e.target.value as DossierConfig['lede'])}>
            {DOSSIER_LEDES.map((l) => <option key={l} value={l}>{t(`option.${l}`)}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="doss-dropcap">{t('themepanel.dropCap')}</label>
          <input id="doss-dropcap" type="checkbox" checked={doss.dropCap} onChange={(e) => setDoss('dropCap', e.target.checked)} />
        </div>
        <div className="field-row">
          <label htmlFor="doss-numbered">{t('themepanel.numberBlocks')}</label>
          <input id="doss-numbered" type="checkbox" checked={doss.numbered} onChange={(e) => setDoss('numbered', e.target.checked)} />
        </div>
        <div className="field-row">
          <label htmlFor="doss-centred">{t('themepanel.centreColumn')}</label>
          <input id="doss-centred" type="checkbox" checked={doss.centred} onChange={(e) => setDoss('centred', e.target.checked)} />
        </div>
        <NumberRow id="doss-gap" label={t('themepanel.blockGap')} value={doss.blockGap} min={4} max={56} suffix="px" onChange={(v) => setDoss('blockGap', v)} />
        <div className="field-row">
          <label htmlFor="doss-enter">{t('themepanel.opensWith')}</label>
          <select id="doss-enter" value={doss.enter} onChange={(e) => setDoss('enter', e.target.value as DossierConfig['enter'])}>
            {DOSSIER_ENTERS.map((x) => <option key={x} value={x}>{t(`option.${x}`)}</option>)}
          </select>
        </div>
        <NumberRow id="doss-scrim" label={t('themepanel.scrim')} value={doss.scrim} min={0} max={1} step={0.02} onChange={(v) => setDoss('scrim', v)} />
        <NumberRow id="doss-blur" label={t('themepanel.scrimBlur')} value={doss.scrimBlur} min={0} max={24} suffix="px" onChange={(v) => setDoss('scrimBlur', v)} />

        <div className="panel__section">{t('themepanel.typography')}</div>
        <div className="field-row">
          <label htmlFor="theme-display">{t('themepanel.displayFont')}</label>
          <input id="theme-display" type="text" value={theme.fonts.display} onChange={(event) => setFont('display', event.target.value)} />
        </div>
        <div className="field-row">
          <label htmlFor="theme-mono">{t('themepanel.monoFont')}</label>
          <input id="theme-mono" type="text" value={theme.fonts.mono} onChange={(event) => setFont('mono', event.target.value)} />
        </div>
        <NumberRow id="theme-dweight" label={t('themepanel.displayWeight')} value={theme.fonts.displayWeight} min={300} max={900} step={100} onChange={(v) => setFont('displayWeight', v)} />
        <NumberRow id="theme-tracking" label={t('themepanel.displayTracking')} value={theme.fonts.tracking} min={-0.05} max={0.3} step={0.005} suffix="em" onChange={(v) => setFont('tracking', v)} />
        <div className="field-row">
          <label htmlFor="theme-scale">{t('themepanel.bodyScale')}</label>
          <input id="theme-scale" type="range" min={0.85} max={1.3} step={0.05} value={theme.fonts.scale} onChange={(event) => setFont('scale', Number(event.target.value))} />
        </div>

        <div className="panel__section">{t('themepanel.colours')}</div>
        {COLOR_TOKENS.map((token) => {
          const value = theme.colors[token];
          const label = t(`themepanel.color.${token}`);
          const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
          return (
            <div className="field-row" key={token}>
              <label htmlFor={`theme-${token}`}>{label}</label>
              <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {isHex ? (
                  <input type="color" value={value} onChange={(event) => setColor(token, event.target.value)} aria-label={`${label} picker`} />
                ) : null}
                <input id={`theme-${token}`} type="text" value={value} onChange={(event) => setColor(token, event.target.value)} style={{ width: 160 }} />
              </span>
            </div>
          );
        })}

        <div className="panel__section">{t('themepanel.languages')}</div>
        <div className="field-row">
          <label htmlFor="i18n-on">{t('themepanel.twoLanguages')}</label>
          <input id="i18n-on" type="checkbox" checked={i18n.enabled} onChange={(e) => setLang('enabled', e.target.checked)} />
        </div>
        <div className="panel__note">
          {t(i18n.enabled ? 'themepanel.languagesOnHint' : 'themepanel.languagesOffHint')}
        </div>
        {i18n.enabled ? (
          <>
            <div className="field-row">
              <label htmlFor="i18n-primary">{t('themepanel.youWriteIn')}</label>
              <select id="i18n-primary" value={i18n.primary} onChange={(e) => setLang('primary', e.target.value)}>
                {i18n.languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
            {i18n.languages.map((l, index) => (
              <div className="field-row" key={l.code}>
                <input
                  className="field-num"
                  type="text"
                  value={l.code}
                  aria-label={t('themepanel.languageCode', { index: index + 1 })}
                  onChange={(e) => setLanguageAt(index, { code: e.target.value.trim().toLowerCase() })}
                />
                <span className="field-pair">
                  <input
                    className="field-inline"
                    type="text"
                    value={l.label}
                    aria-label={t('themepanel.languageName', { index: index + 1 })}
                    onChange={(e) => setLanguageAt(index, { label: e.target.value })}
                  />
                  <button
                    className="editdel"
                    type="button"
                    aria-label={t('themepanel.removeLanguage', { label: l.label })}
                    disabled={i18n.languages.length < 2}
                    onClick={() => setLang('languages', i18n.languages.filter((_, i) => i !== index))}
                  >×</button>
                </span>
              </div>
            ))}
            <div className="panel__actions">
              <button
                className="tbtn"
                type="button"
                onClick={() => setLang('languages', [...i18n.languages, { code: `l${i18n.languages.length + 1}`, label: t('themepanel.newLanguage') }])}
              >{t('themepanel.addLanguage')}</button>
            </div>
            <div className="field-row">
              <label htmlFor="i18n-provider">{t('themepanel.translator')}</label>
              <select id="i18n-provider" value={i18n.provider} onChange={(e) => setLang('provider', e.target.value as I18nConfig['provider'])}>
                {TRANSLATE_PROVIDERS.map((x) => <option key={x} value={x}>{t(`option.${x}`)}</option>)}
              </select>
            </div>
            <div className="panel__note">
              {t(`themepanel.providerHint.${i18n.provider}`)}
            </div>
            <div className="field-row">
              <label htmlFor="i18n-auto">{t('themepanel.translateAsWrite')}</label>
              <input id="i18n-auto" type="checkbox" checked={i18n.auto} onChange={(e) => setLang('auto', e.target.checked)} />
            </div>
            <div className="field-row">
              <label htmlFor="i18n-remember">{t('themepanel.rememberChoice')}</label>
              <input id="i18n-remember" type="checkbox" checked={i18n.remember} onChange={(e) => setLang('remember', e.target.checked)} />
            </div>
            <div className="field-row">
              <label htmlFor="i18n-browser">{t('themepanel.followBrowser')}</label>
              <input id="i18n-browser" type="checkbox" checked={i18n.followBrowser} onChange={(e) => setLang('followBrowser', e.target.checked)} />
            </div>
          </>
        ) : null}

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onClose}>{t('themepanel.done')}</button>
        </div>
      </div>
    </div>
  );
}
