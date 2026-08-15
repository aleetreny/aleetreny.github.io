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

type ThemePanelProps = {
  theme: ThemeConfig;
  onChange: (next: ThemeConfig) => void;
  i18n: I18nConfig;
  onI18nChange: (next: I18nConfig) => void;
  onClose: () => void;
};

const COLOR_TOKENS: Array<[keyof ThemeConfig['colors'], string]> = [
  ['accent', 'Accent · rust'],
  ['accent2', 'Accent 2 · blue'],
  ['signal', 'Signal · amber'],
  ['signalSoft', 'Signal soft'],
  ['lab', 'Lab · cool'],
  ['paper', 'Paper'],
  ['paperWarm', 'Paper warm'],
  ['paperCream', 'Paper cream'],
  ['ink', 'Ink'],
  ['dark', 'Dark surface'],
  ['slate', 'Slate surface'],
  ['slateInk', 'Slate ink'],
  ['darkInk', 'Dark ink'],
];

function NumberRow({ id, label, value, min, max, step = 1, suffix, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <span className="field-pair">
        <input type="range" min={min} max={max} step={step} value={value} aria-label={`${label} slider`} onChange={(event) => onChange(Number(event.target.value))} />
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
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label="Edit the appearance">
        <div className="panel__eyebrow">appearance</div>
        <div className="panel__title">Theme &amp; typography</div>
        <p className="panel__hint">Every change previews instantly. Press save to publish it for everyone.</p>

        <div className="panel__section">looks</div>
        <div className="panel__note">
          One click sets texture, wall, cards, article and palette together. It patches the
          theme, so your text, positions and tour are untouched — try one on and change back.
        </div>
        <div className="presets">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="presets__btn"
              title={preset.hint}
              onClick={() => onChange(preset.patch(theme))}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="panel__section">board</div>
        <div className="field-row">
          <label htmlFor="theme-style">Texture</label>
          <select
            id="theme-style"
            value={theme.boardStyle}
            onChange={(event) => onChange({ ...theme, boardStyle: event.target.value as BoardStyle })}
          >
            {BOARD_STYLE_IDS.map((style) => <option key={style} value={style}>{style}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="theme-chaos">Card tilt</label>
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
          <label htmlFor="theme-radius">Corner radius</label>
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
          <label htmlFor="theme-marginalia">Sticky notes</label>
          <input
            id="theme-marginalia"
            type="checkbox"
            checked={theme.showMarginalia}
            onChange={(event) => onChange({ ...theme, showMarginalia: event.target.checked })}
          />
        </div>

        <div className="panel__section">backdrop</div>
        <div className="field-row">
          <label htmlFor="theme-plate">Hang it on a wall</label>
          <input
            id="theme-plate"
            type="checkbox"
            checked={back.plate}
            onChange={(event) => setBack('plate', event.target.checked)}
          />
        </div>
        <div className="panel__note">
          {back.plate
            ? 'The board becomes a finite slate on a wall — this is what the tour slams into place.'
            : 'Off: the texture fills the whole viewport, edge to edge.'}
        </div>
        {back.plate ? (
          <>
            <div className="field-row">
              <label htmlFor="theme-wall">Wall</label>
              <select id="theme-wall" value={back.wall} onChange={(event) => setBack('wall', event.target.value as BackdropConfig['wall'])}>
                {WALL_STYLE_IDS.map((wall) => <option key={wall} value={wall}>{wall}</option>)}
              </select>
            </div>
            {back.wall === 'custom' ? (
              <>
                <div className="field-row">
                  <label htmlFor="theme-wallc1">Wall · centre</label>
                  <input id="theme-wallc1" type="color" value={back.wallColor} onChange={(event) => setBack('wallColor', event.target.value)} />
                </div>
                <div className="field-row">
                  <label htmlFor="theme-wallc2">Wall · edge</label>
                  <input id="theme-wallc2" type="color" value={back.wallColor2} onChange={(event) => setBack('wallColor2', event.target.value)} />
                </div>
              </>
            ) : null}
            <NumberRow id="theme-grain" label="Plaster grain" value={back.grain} min={0} max={1} step={0.05} onChange={(v) => setBack('grain', v)} />
            <NumberRow id="theme-vignette" label="Vignette" value={back.vignette} min={0} max={1} step={0.05} onChange={(v) => setBack('vignette', v)} />
            <NumberRow id="theme-margin" label="Slate margin" value={back.plateMargin} min={0} max={220} suffix="px" onChange={(v) => setBack('plateMargin', v)} />
            <NumberRow id="theme-frame" label="Frame" value={back.frame} min={0} max={40} suffix="px" onChange={(v) => setBack('frame', v)} />
            <NumberRow id="theme-shadow" label="Slate shadow" value={back.plateShadow} min={0} max={1.6} step={0.05} suffix="×" onChange={(v) => setBack('plateShadow', v)} />
            <div className="field-row">
              <label htmlFor="theme-studs">Corner studs</label>
              <input id="theme-studs" type="checkbox" checked={back.studs} onChange={(event) => setBack('studs', event.target.checked)} />
            </div>
            {back.studs ? (
              <>
                <NumberRow id="theme-studsize" label="Stud size" value={back.studSize} min={6} max={60} suffix="px" onChange={(v) => setBack('studSize', v)} />
                <NumberRow id="theme-studinset" label="Stud inset" value={back.studInset} min={0} max={140} suffix="px" onChange={(v) => setBack('studInset', v)} />
              </>
            ) : null}
          </>
        ) : null}
        <div className="field-row">
          <label htmlFor="theme-grid">Pattern</label>
          <select id="theme-grid" value={back.grid} onChange={(event) => setBack('grid', event.target.value as BackdropConfig['grid'])}>
            {GRID_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </div>
        <div className="panel__note">
          {back.grid === 'plate' && !back.plate
            ? 'With no slate to paint on it falls back to the viewport grid.'
            : {
              plate: 'Painted on the slate, so it zooms with the board.',
              viewport: 'Constant on-screen density — a calm fixed backdrop.',
              off: 'No pattern at all.',
            }[back.grid]}
        </div>
        {back.grid !== 'off' ? (
          <>
            <div className="field-row">
              <label htmlFor="theme-pattern">Pattern style</label>
              <select id="theme-pattern" value={back.pattern} onChange={(event) => setBack('pattern', event.target.value as BackdropConfig['pattern'])}>
                {PATTERN_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}
              </select>
            </div>
            {back.pattern !== 'texture' && back.pattern !== 'none' ? (
              <>
                <div className="field-row">
                  <label htmlFor="theme-patternink">Pattern ink</label>
                  <select id="theme-patternink" value={back.patternInk} onChange={(event) => setBack('patternInk', event.target.value as BackdropConfig['patternInk'])}>
                    {(['auto', 'light', 'dark'] as const).map((ink) => <option key={ink} value={ink}>{ink}</option>)}
                  </select>
                </div>
                <NumberRow id="theme-patternfade" label="Pattern strength" value={back.patternFade} min={0} max={2} step={0.05} suffix="×" onChange={(v) => setBack('patternFade', v)} />
              </>
            ) : null}
            <NumberRow id="theme-gridscale" label="Pattern scale" value={back.gridScale} min={0.4} max={3} step={0.1} suffix="×" onChange={(v) => setBack('gridScale', v)} />
          </>
        ) : null}

        {back.plate ? (
          <>
            <div className="panel__section">slate colour</div>
            <div className="panel__note">
              Empty means the board style paints it. Set one and the slate becomes
              any colour you like — that is what makes a pale look possible.
            </div>
            <div className="field-row">
              <label htmlFor="theme-slate1">Slate centre</label>
              <input id="theme-slate1" type="color" value={back.slate || '#2e3a38'} onChange={(event) => setBack('slate', event.target.value)} />
            </div>
            <div className="field-row">
              <label htmlFor="theme-slate2">Slate edge</label>
              <input id="theme-slate2" type="color" value={back.slate2 || back.slate || '#172120'} onChange={(event) => setBack('slate2', event.target.value)} />
            </div>
            <div className="field-row">
              <label htmlFor="theme-slateink">Slate ink</label>
              <input id="theme-slateink" type="color" value={back.slateInk || '#f0ece1'} onChange={(event) => setBack('slateInk', event.target.value)} />
            </div>
            {back.slate || back.slate2 || back.slateInk ? (
              <button className="tbtn" type="button" onClick={() => onChange({ ...theme, backdrop: { ...back, slate: '', slate2: '', slateInk: '' } })}>
                back to the board style’s own colour
              </button>
            ) : null}
          </>
        ) : null}

        <div className="panel__section">cards</div>
        <div className="field-row">
          <label htmlFor="card-edge">Edge</label>
          <select id="card-edge" value={cards.edge} onChange={(e) => setCards('edge', e.target.value as CardsConfig['edge'])}>
            {CARD_EDGES.map((edge) => <option key={edge} value={edge}>{edge}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="card-fastener">Fastened with</label>
          <select id="card-fastener" value={cards.fastener} onChange={(e) => setCards('fastener', e.target.value as CardsConfig['fastener'])}>
            {CARD_FASTENERS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="card-lift">On hover</label>
          <select id="card-lift" value={cards.lift} onChange={(e) => setCards('lift', e.target.value as CardsConfig['lift'])}>
            {CARD_LIFTS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <NumberRow id="card-shadow" label="Shadow" value={cards.shadow} min={0} max={2.5} step={0.05} suffix="×" onChange={(v) => setCards('shadow', v)} />
        <NumberRow id="card-grain" label="Paper grain" value={cards.grain} min={0} max={1} step={0.05} onChange={(v) => setCards('grain', v)} />
        <NumberRow id="card-pad" label="Inner padding" value={cards.padding} min={8} max={48} suffix="px" onChange={(v) => setCards('padding', v)} />
        <NumberRow id="card-rowc" label="Row tint" value={cards.rowContrast} min={0} max={1} step={0.05} onChange={(v) => setCards('rowContrast', v)} />
        <NumberRow id="card-rowrule" label="Row rule" value={cards.rowRule} min={0} max={10} suffix="px" onChange={(v) => setCards('rowRule', v)} />

        <div className="panel__section">articles</div>
        <div className="panel__note">The full-page dossier a card opens into.</div>
        <NumberRow id="doss-width" label="Plate width" value={doss.width} min={520} max={1800} step={10} suffix="px" onChange={(v) => setDoss('width', v)} />
        <NumberRow id="doss-measure" label="Measure" value={doss.measure} min={32} max={110} suffix="ch" onChange={(v) => setDoss('measure', v)} />
        <div className="field-row">
          <label htmlFor="doss-face">Body face</label>
          <select id="doss-face" value={doss.bodyFace} onChange={(e) => setDoss('bodyFace', e.target.value as DossierConfig['bodyFace'])}>
            {BODY_FACES.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <NumberRow id="doss-size" label="Body size" value={doss.bodySize} min={12} max={26} step={0.5} suffix="px" onChange={(v) => setDoss('bodySize', v)} />
        <NumberRow id="doss-lead" label="Leading" value={doss.bodyLeading} min={1.2} max={2.2} step={0.02} onChange={(v) => setDoss('bodyLeading', v)} />
        <NumberRow id="doss-title" label="Title size" value={doss.titleSize} min={22} max={90} suffix="px" onChange={(v) => setDoss('titleSize', v)} />
        <NumberRow id="doss-tweight" label="Title weight" value={doss.titleWeight} min={300} max={900} step={100} onChange={(v) => setDoss('titleWeight', v)} />
        <NumberRow id="doss-ttrack" label="Title tracking" value={doss.titleTracking} min={-0.08} max={0.2} step={0.005} suffix="em" onChange={(v) => setDoss('titleTracking', v)} />
        <div className="field-row">
          <label htmlFor="doss-tcase">Title case</label>
          <select id="doss-tcase" value={doss.titleCase} onChange={(e) => setDoss('titleCase', e.target.value as DossierConfig['titleCase'])}>
            {DOSSIER_TITLE_CASES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="doss-lede">Opening line</label>
          <select id="doss-lede" value={doss.lede} onChange={(e) => setDoss('lede', e.target.value as DossierConfig['lede'])}>
            {DOSSIER_LEDES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="doss-dropcap">Drop cap</label>
          <input id="doss-dropcap" type="checkbox" checked={doss.dropCap} onChange={(e) => setDoss('dropCap', e.target.checked)} />
        </div>
        <div className="field-row">
          <label htmlFor="doss-numbered">Number the blocks</label>
          <input id="doss-numbered" type="checkbox" checked={doss.numbered} onChange={(e) => setDoss('numbered', e.target.checked)} />
        </div>
        <div className="field-row">
          <label htmlFor="doss-centred">Centre the column</label>
          <input id="doss-centred" type="checkbox" checked={doss.centred} onChange={(e) => setDoss('centred', e.target.checked)} />
        </div>
        <NumberRow id="doss-gap" label="Block gap" value={doss.blockGap} min={4} max={56} suffix="px" onChange={(v) => setDoss('blockGap', v)} />
        <div className="field-row">
          <label htmlFor="doss-enter">Opens with</label>
          <select id="doss-enter" value={doss.enter} onChange={(e) => setDoss('enter', e.target.value as DossierConfig['enter'])}>
            {DOSSIER_ENTERS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <NumberRow id="doss-scrim" label="Scrim" value={doss.scrim} min={0} max={1} step={0.02} onChange={(v) => setDoss('scrim', v)} />
        <NumberRow id="doss-blur" label="Scrim blur" value={doss.scrimBlur} min={0} max={24} suffix="px" onChange={(v) => setDoss('scrimBlur', v)} />

        <div className="panel__section">typography</div>
        <div className="field-row">
          <label htmlFor="theme-display">Display font</label>
          <input id="theme-display" type="text" value={theme.fonts.display} onChange={(event) => setFont('display', event.target.value)} />
        </div>
        <div className="field-row">
          <label htmlFor="theme-mono">Mono font</label>
          <input id="theme-mono" type="text" value={theme.fonts.mono} onChange={(event) => setFont('mono', event.target.value)} />
        </div>
        <NumberRow id="theme-dweight" label="Display weight" value={theme.fonts.displayWeight} min={300} max={900} step={100} onChange={(v) => setFont('displayWeight', v)} />
        <NumberRow id="theme-tracking" label="Display tracking" value={theme.fonts.tracking} min={-0.05} max={0.3} step={0.005} suffix="em" onChange={(v) => setFont('tracking', v)} />
        <div className="field-row">
          <label htmlFor="theme-scale">Body scale</label>
          <input id="theme-scale" type="range" min={0.85} max={1.3} step={0.05} value={theme.fonts.scale} onChange={(event) => setFont('scale', Number(event.target.value))} />
        </div>

        <div className="panel__section">colours</div>
        {COLOR_TOKENS.map(([token, label]) => {
          const value = theme.colors[token];
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

        <div className="panel__section">languages</div>
        <div className="field-row">
          <label htmlFor="i18n-on">Two languages</label>
          <input id="i18n-on" type="checkbox" checked={i18n.enabled} onChange={(e) => setLang('enabled', e.target.checked)} />
        </div>
        <div className="panel__note">
          {i18n.enabled
            ? 'Visitors get a switcher; you write in the primary language and fill the rest with ⇄ translate.'
            : 'Off: one language, no switcher — exactly as the board behaves without this.'}
        </div>
        {i18n.enabled ? (
          <>
            <div className="field-row">
              <label htmlFor="i18n-primary">You write in</label>
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
                  aria-label={`Language ${index + 1} code`}
                  onChange={(e) => setLanguageAt(index, { code: e.target.value.trim().toLowerCase() })}
                />
                <span className="field-pair">
                  <input
                    className="field-inline"
                    type="text"
                    value={l.label}
                    aria-label={`Language ${index + 1} name`}
                    onChange={(e) => setLanguageAt(index, { label: e.target.value })}
                  />
                  <button
                    className="editdel"
                    type="button"
                    aria-label={`Remove ${l.label}`}
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
                onClick={() => setLang('languages', [...i18n.languages, { code: `l${i18n.languages.length + 1}`, label: 'New language' }])}
              >+ language</button>
            </div>
            <div className="field-row">
              <label htmlFor="i18n-provider">Translator</label>
              <select id="i18n-provider" value={i18n.provider} onChange={(e) => setLang('provider', e.target.value as I18nConfig['provider'])}>
                {TRANSLATE_PROVIDERS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div className="panel__note">
              {{
                mymemory: 'Free and keyless, straight from your browser. About 5.000 characters a day anonymously, ten times that once you are signed in — it sends your address as its contact.',
                google: 'The keyless endpoint Google Translate\u2019s own web widget calls: better prose and no daily ceiling in practice, but undocumented, so Google can change or close it without notice. Editing only — a visitor never touches it.',
                function: 'Your own Neon Function holds a provider key server-side (DeepL free tier, or a LibreTranslate you host) — see docs/handbook.md.',
                off: 'No machine translation; type each language yourself.',
              }[i18n.provider]}
            </div>
            <div className="field-row">
              <label htmlFor="i18n-auto">Translate as I write</label>
              <input id="i18n-auto" type="checkbox" checked={i18n.auto} onChange={(e) => setLang('auto', e.target.checked)} />
            </div>
            <div className="field-row">
              <label htmlFor="i18n-remember">Remember their choice</label>
              <input id="i18n-remember" type="checkbox" checked={i18n.remember} onChange={(e) => setLang('remember', e.target.checked)} />
            </div>
            <div className="field-row">
              <label htmlFor="i18n-browser">Follow the browser</label>
              <input id="i18n-browser" type="checkbox" checked={i18n.followBrowser} onChange={(e) => setLang('followBrowser', e.target.checked)} />
            </div>
          </>
        ) : null}

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onClose}>done</button>
        </div>
      </div>
    </div>
  );
}
