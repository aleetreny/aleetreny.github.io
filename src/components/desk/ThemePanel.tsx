import { BOARD_STYLE_IDS, type BoardStyle, type ThemeConfig } from '../../lib/board';

type ThemePanelProps = {
  theme: ThemeConfig;
  onChange: (next: ThemeConfig) => void;
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

export function ThemePanel({ theme, onChange, onClose }: ThemePanelProps) {
  const setColor = (token: keyof ThemeConfig['colors'], value: string) =>
    onChange({ ...theme, colors: { ...theme.colors, [token]: value } });
  const setFont = (key: keyof ThemeConfig['fonts'], value: string | number) =>
    onChange({ ...theme, fonts: { ...theme.fonts, [key]: value } });

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label="Editar apariencia">
        <div className="panel__eyebrow">appearance</div>
        <div className="panel__title">Theme &amp; typography</div>
        <p className="panel__hint">Every change previews instantly. Press save to publish it for everyone.</p>

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

        <div className="panel__section">typography</div>
        <div className="field-row">
          <label htmlFor="theme-display">Display font</label>
          <input id="theme-display" type="text" value={theme.fonts.display} onChange={(event) => setFont('display', event.target.value)} />
        </div>
        <div className="field-row">
          <label htmlFor="theme-mono">Mono font</label>
          <input id="theme-mono" type="text" value={theme.fonts.mono} onChange={(event) => setFont('mono', event.target.value)} />
        </div>
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

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onClose}>done</button>
        </div>
      </div>
    </div>
  );
}
