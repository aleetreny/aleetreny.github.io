import {
  BOARD_STYLE_IDS,
  GRID_MODES,
  WALL_STYLE_IDS,
  type BackdropConfig,
  type BoardStyle,
  type ThemeConfig,
} from '../../lib/board';

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

export function ThemePanel({ theme, onChange, onClose }: ThemePanelProps) {
  const setColor = (token: keyof ThemeConfig['colors'], value: string) =>
    onChange({ ...theme, colors: { ...theme.colors, [token]: value } });
  const setFont = (key: keyof ThemeConfig['fonts'], value: string | number) =>
    onChange({ ...theme, fonts: { ...theme.fonts, [key]: value } });
  const back = theme.backdrop;
  const setBack = <K extends keyof BackdropConfig>(key: K, value: BackdropConfig[K]) =>
    onChange({ ...theme, backdrop: { ...back, [key]: value } });

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label="Edit the appearance">
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
        {back.grid === 'plate' && back.plate ? (
          <NumberRow id="theme-gridscale" label="Pattern scale" value={back.gridScale} min={0.4} max={3} step={0.1} suffix="×" onChange={(v) => setBack('gridScale', v)} />
        ) : null}

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
