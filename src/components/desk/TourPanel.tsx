import { useMemo, useState, type ReactNode } from 'react';
import {
  ADVANCE_MODES,
  BAR_POSITIONS,
  CAMERA_MOTIONS,
  EASINGS,
  INTRO_STYLES,
  REPLAY_MODES,
  REVEAL_ORDERS,
  REVEAL_STYLES,
  TOUR_ROUTES,
  buildStops,
  type TourConfig,
  type TourItem,
  type TourStop,
} from '../../lib/tour';
import { useUiText } from './ui-text-context';

type TourPanelProps = {
  tour: TourConfig;
  /** Every draggable thing on the board, for the stop editor. */
  items: TourItem[];
  onChange: (next: TourConfig) => void;
  onPreview: () => void;
  onClose: () => void;
};

function Section({ title }: { title: string }) {
  return <div className="panel__section">{title}</div>;
}

function SelectRow<T extends string>({ id, label, value, options, onChange, hint }: {
  id: string; label: string; value: T; options: readonly T[]; onChange: (value: T) => void; hint?: string;
}) {
  const t = useUiText();
  return (
    <>
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>
          {options.map((option) => <option key={option} value={option}>{t(`option.${option}`)}</option>)}
        </select>
      </div>
      {hint ? <div className="panel__note">{hint}</div> : null}
    </>
  );
}

function NumberRow({ id, label, value, min, max, step = 1, suffix, onChange }: {
  id: string; label: string; value: number; min: number; max: number; step?: number; suffix?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <span className="field-pair">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={label}
        />
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

function CheckRow({ id, label, value, onChange }: {
  id: string; label: string; value: boolean; onChange: (value: boolean) => void;
}) {
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
    </div>
  );
}

function TextRow({ id, label, value, onChange }: {
  id: string; label: string; value: string; onChange: (value: string) => void;
}) {
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <input id={id} className="field-inline" type="text" value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

export function TourPanel({ tour, items, onChange, onPreview, onClose }: TourPanelProps) {
  const t = useUiText();
  const [openGroup, setOpenGroup] = useState<string>('route');
  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const generated = useMemo(
    () => (tour.route === 'custom' ? [] : buildStops(tour, items)),
    [tour, items],
  );

  const set = <K extends keyof TourConfig>(key: K, value: TourConfig[K]) => onChange({ ...tour, [key]: value });
  const setCamera = <K extends keyof TourConfig['camera']>(key: K, value: TourConfig['camera'][K]) =>
    onChange({ ...tour, camera: { ...tour.camera, [key]: value } });
  const setMobile = <K extends keyof TourConfig['mobile']>(key: K, value: TourConfig['mobile'][K]) =>
    onChange({ ...tour, mobile: { ...tour.mobile, [key]: value } });
  const setReveal = <K extends keyof TourConfig['reveal']>(key: K, value: TourConfig['reveal'][K]) =>
    onChange({ ...tour, reveal: { ...tour.reveal, [key]: value } });
  const setIntro = <K extends keyof TourConfig['intro']>(key: K, value: TourConfig['intro'][K]) =>
    onChange({ ...tour, intro: { ...tour.intro, [key]: value } });
  const setBar = <K extends keyof TourConfig['bar']>(key: K, value: TourConfig['bar'][K]) =>
    onChange({ ...tour, bar: { ...tour.bar, [key]: value } });

  const setStops = (stops: TourStop[]) => set('stops', stops);
  const patchStop = (index: number, patch: Partial<TourStop>) =>
    setStops(tour.stops.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)));

  const addStop = () => setStops([
    ...tour.stops,
    { id: `stop-${Date.now().toString(36)}`, label: t('tourpanel.newStopLabel'), items: [] },
  ]);

  const moveStop = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= tour.stops.length) return;
    const next = [...tour.stops];
    [next[index], next[target]] = [next[target], next[index]];
    setStops(next);
  };

  const group = (id: string, title: string, body: ReactNode) => (
    <>
      <button
        className={`panel__fold ${openGroup === id ? 'is-open' : ''}`}
        type="button"
        onClick={() => setOpenGroup((current) => (current === id ? '' : id))}
        aria-expanded={openGroup === id}
      >
        {title}<span aria-hidden="true">{openGroup === id ? '−' : '+'}</span>
      </button>
      {openGroup === id ? <div className="panel__foldbody">{body}</div> : null}
    </>
  );

  return (
    <div className="overlay" role="presentation">
      <div className="overlay__scrim" onClick={onClose} />
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label={t('tourpanel.aria')}>
        <div className="panel__eyebrow">{t('tourpanel.eyebrow')}</div>
        <div className="panel__title">{t('tourpanel.title')}</div>
        <p className="panel__hint">{t('tourpanel.hint')}</p>

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onPreview}>↻ {t('tourpanel.preview')}</button>
          <button className="tbtn" type="button" onClick={onClose}>{t('tourpanel.done')}</button>
        </div>

        <Section title={t('tourpanel.run')} />
        <CheckRow id="tour-enabled" label={t('tourpanel.playVisitors')} value={tour.enabled} onChange={(v) => set('enabled', v)} />
        <SelectRow
          id="tour-replay"
          label={t('tourpanel.showIt')}
          value={tour.replay}
          options={REPLAY_MODES}
          onChange={(v) => set('replay', v)}
          hint={t(`tourpanel.replayHint.${tour.replay}`)}
        />
        <SelectRow
          id="tour-advance"
          label={t('tourpanel.advance')}
          value={tour.advance}
          options={ADVANCE_MODES}
          onChange={(v) => set('advance', v)}
          hint={t(`tourpanel.advanceHint.${tour.advance}`)}
        />
        {tour.advance === 'auto' ? (
          <NumberRow id="tour-dwell" label={t('tourpanel.dwell')} value={tour.dwell} min={600} max={20000} step={100} suffix="ms" onChange={(v) => set('dwell', v)} />
        ) : null}
        <NumberRow id="tour-speed" label={t('tourpanel.speed')} value={tour.speed} min={0.3} max={3} step={0.1} suffix="×" onChange={(v) => set('speed', v)} />
        <CheckRow id="tour-loop" label={t('tourpanel.loop')} value={tour.loop} onChange={(v) => set('loop', v)} />

        {group('route', `${t('tourpanel.route')} · ${t(`option.${tour.route}`)}`, (
          <>
            <SelectRow
              id="tour-route"
              label={t('tourpanel.shape')}
              value={tour.route}
              options={TOUR_ROUTES}
              onChange={(v) => set('route', v)}
              hint={t(`tourpanel.routeHint.${tour.route}`)}
            />
            {tour.route !== 'custom' && tour.route !== 'solo' ? (
              <NumberRow id="tour-group" label={t('tourpanel.piecesPerStop')} value={tour.groupSize} min={1} max={8} onChange={(v) => set('groupSize', v)} />
            ) : null}
            <CheckRow id="tour-rest" label={t('tourpanel.leftovers')} value={tour.includeRest} onChange={(v) => set('includeRest', v)} />

            {tour.route === 'custom' ? (
              <>
                <div className="panel__note">{t('tourpanel.stopsCount', { count: tour.stops.length })}</div>
                <div className="stopeditor">
                  {tour.stops.map((stop, index) => (
                    <div className="stopeditor__stop" key={stop.id}>
                      <div className="field-row" style={{ margin: 0 }}>
                        <span className="stopeditor__n">{index + 1}</span>
                        <input
                          className="field-inline"
                          type="text"
                          value={stop.label}
                          placeholder={t('tourpanel.stopLabel')}
                          onChange={(event) => patchStop(index, { label: event.target.value })}
                          aria-label={t('tourpanel.stopHeading', { index: index + 1 })}
                        />
                        <button className="editdel" type="button" onClick={() => moveStop(index, -1)} aria-label={t('tourpanel.moveUp')}>↑</button>
                        <button className="editdel" type="button" onClick={() => moveStop(index, 1)} aria-label={t('tourpanel.moveDown')}>↓</button>
                        <button className="editdel" type="button" onClick={() => setStops(tour.stops.filter((_, i) => i !== index))} aria-label={t('tourpanel.deleteStop')}>×</button>
                      </div>
                      <div className="stopeditor__items">
                        {stop.items.map((id) => (
                          <span className={`stopeditor__chip ${byId.has(id) ? '' : 'is-missing'}`} key={id}>
                            {byId.get(id)?.label ?? id}
                            <button
                              type="button"
                              className="chip__x"
                              onClick={() => patchStop(index, { items: stop.items.filter((other) => other !== id) })}
                              aria-label={t('tourpanel.removePiece', { id })}
                            >×</button>
                          </span>
                        ))}
                        <select
                          className="stopeditor__add"
                          value=""
                          onChange={(event) => {
                            if (!event.target.value) return;
                            patchStop(index, { items: [...stop.items, event.target.value] });
                          }}
                          aria-label={t('tourpanel.addPieceToStop', { index: index + 1 })}
                        >
                          <option value="">{t('tourpanel.addPiece')}</option>
                          {items.filter((item) => !stop.items.includes(item.id)).map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                      {/* Associated pieces are edited here but held until the
                          final overview; they never interrupt the 13 halts. */}
                      <div className="stopeditor__items stopeditor__items--extra">
                        {(stop.extras ?? []).map((id) => (
                          <span className={`stopeditor__chip stopeditor__chip--extra ${byId.has(id) ? '' : 'is-missing'}`} key={id}>
                            {byId.get(id)?.label ?? id}
                            <button
                              type="button"
                              className="chip__x"
                              onClick={() => patchStop(index, { extras: (stop.extras ?? []).filter((other) => other !== id) })}
                              aria-label={t('tourpanel.removePiece', { id })}
                            >×</button>
                          </span>
                        ))}
                        <select
                          className="stopeditor__add"
                          value=""
                          onChange={(event) => {
                            if (!event.target.value) return;
                            patchStop(index, { extras: [...(stop.extras ?? []), event.target.value] });
                          }}
                          aria-label={t('tourpanel.landPieceAtStop', { index: index + 1 })}
                        >
                          <option value="">{t('tourpanel.landPiece')}</option>
                          {items
                            .filter((item) => !stop.items.includes(item.id) && !(stop.extras ?? []).includes(item.id))
                            .map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="panel__actions">
                  <button className="tbtn" type="button" onClick={addStop}>{t('tourpanel.addStop')}</button>
                </div>
              </>
            ) : (
              <>
                <div className="panel__note">{t('tourpanel.generatedStops', { count: generated.length })}</div>
                <ol className="stopeditor__preview">
                  {generated.map((stop) => <li key={stop.id}>{stop.label}<span> · {stop.items.length}</span></li>)}
                </ol>
                <div className="panel__actions">
                  <button
                    className="tbtn"
                    type="button"
                    onClick={() => onChange({ ...tour, route: 'custom', stops: generated })}
                  >
                    {t('tourpanel.copyCustom')}
                  </button>
                </div>
              </>
            )}
          </>
        ))}

        {group('camera', `${t('tourpanel.camera')} · ${t(`option.${tour.camera.motion}`)}`, (
          <>
            <SelectRow
              id="tour-motion"
              label={t('tourpanel.motion')}
              value={tour.camera.motion}
              options={CAMERA_MOTIONS}
              onChange={(v) => setCamera('motion', v)}
              hint={t(`tourpanel.motionHint.${tour.camera.motion}`)}
            />
            <SelectRow id="tour-ease" label={t('tourpanel.easing')} value={tour.camera.easing} options={EASINGS} onChange={(v) => setCamera('easing', v)} />
            <NumberRow id="tour-first" label={t('tourpanel.firstFlight')} value={tour.camera.firstDuration} min={0} max={4000} step={10} suffix="ms" onChange={(v) => setCamera('firstDuration', v)} />
            <NumberRow id="tour-dur" label={t('tourpanel.laterFlights')} value={tour.camera.duration} min={0} max={4000} step={10} suffix="ms" onChange={(v) => setCamera('duration', v)} />
            {tour.camera.motion === 'arc' ? (
              <NumberRow id="tour-arc" label={t('tourpanel.arcHeight')} value={tour.camera.arc} min={0} max={400} suffix="px" onChange={(v) => setCamera('arc', v)} />
            ) : null}
            {tour.camera.motion === 'swoop' ? (
              <NumberRow id="tour-swoop" label={t('tourpanel.swoopDepth')} value={tour.camera.swoop} min={0} max={0.7} step={0.01} onChange={(v) => setCamera('swoop', v)} />
            ) : null}
            <NumberRow id="tour-maxscale" label={t('tourpanel.zoomCeiling')} value={tour.camera.maxScale} min={0.2} max={2.4} step={0.05} suffix="×" onChange={(v) => setCamera('maxScale', v)} />
            <NumberRow id="tour-inflate" label={t('tourpanel.breathingRoom')} value={tour.camera.inflate} min={0} max={400} suffix="px" onChange={(v) => setCamera('inflate', v)} />
            <NumberRow id="tour-padx" label={t('tourpanel.padSides')} value={tour.camera.padX} min={0} max={400} suffix="px" onChange={(v) => setCamera('padX', v)} />
            <NumberRow id="tour-padtop" label={t('tourpanel.padTop')} value={tour.camera.padTop} min={0} max={400} suffix="px" onChange={(v) => setCamera('padTop', v)} />
            <NumberRow id="tour-padbottom" label={t('tourpanel.padBottom')} value={tour.camera.padBottom} min={0} max={500} suffix="px" onChange={(v) => setCamera('padBottom', v)} />
          </>
        ))}

        {group('mobile', `${t('tourpanel.phones')} · ${tour.mobile.enabled ? t('tourpanel.perStop', { count: tour.mobile.maxPerStop }) : t('tourpanel.off')}`, (
          <>
            <CheckRow
              id="tour-mobile"
              label={t('tourpanel.adaptSmall')}
              value={tour.mobile.enabled}
              onChange={(v) => setMobile('enabled', v)}
            />
            <div className="panel__note">{t('tourpanel.mobileHint')}</div>
            {tour.mobile.enabled ? (
              <>
                <NumberRow id="tour-mbreak" label={t('tourpanel.appliesBelow')} value={tour.mobile.breakpoint} min={320} max={1400} step={10} suffix="px" onChange={(v) => setMobile('breakpoint', v)} />
                <NumberRow id="tour-mmax" label={t('tourpanel.piecesPerStop')} value={tour.mobile.maxPerStop} min={1} max={8} onChange={(v) => setMobile('maxPerStop', v)} />
                <NumberRow id="tour-mscale" label={t('tourpanel.zoomCeiling')} value={tour.mobile.maxScale} min={0.2} max={2.4} step={0.05} suffix="×" onChange={(v) => setMobile('maxScale', v)} />
                <NumberRow id="tour-minflate" label={t('tourpanel.breathingRoom')} value={tour.mobile.inflate} min={0} max={300} suffix="px" onChange={(v) => setMobile('inflate', v)} />
                <NumberRow id="tour-mpadx" label={t('tourpanel.padSides')} value={tour.mobile.padX} min={0} max={200} suffix="px" onChange={(v) => setMobile('padX', v)} />
                <NumberRow id="tour-mpadtop" label={t('tourpanel.padTop')} value={tour.mobile.padTop} min={0} max={300} suffix="px" onChange={(v) => setMobile('padTop', v)} />
                <NumberRow id="tour-mpadbottom" label={t('tourpanel.padBottom')} value={tour.mobile.padBottom} min={0} max={400} suffix="px" onChange={(v) => setMobile('padBottom', v)} />
              </>
            ) : null}
          </>
        ))}

        {group('reveal', `${t('tourpanel.pieces')} · ${t(`option.${tour.reveal.style}`)}`, (
          <>
            <SelectRow
              id="tour-reveal"
              label={t('tourpanel.landing')}
              value={tour.reveal.style}
              options={REVEAL_STYLES}
              onChange={(v) => setReveal('style', v)}
              hint={t(`tourpanel.revealHint.${tour.reveal.style}`)}
            />
            <SelectRow id="tour-revealorder" label={t('tourpanel.order')} value={tour.reveal.order} options={REVEAL_ORDERS} onChange={(v) => setReveal('order', v)} />
            <SelectRow id="tour-revealease" label={t('tourpanel.easing')} value={tour.reveal.easing} options={EASINGS} onChange={(v) => setReveal('easing', v)} />
            <NumberRow id="tour-revealdur" label={t('tourpanel.duration')} value={tour.reveal.duration} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setReveal('duration', v)} />
            <NumberRow id="tour-stagger" label={t('tourpanel.stagger')} value={tour.reveal.stagger} min={0} max={1200} step={10} suffix="ms" onChange={(v) => setReveal('stagger', v)} />
            <NumberRow id="tour-distance" label={t('tourpanel.travel')} value={tour.reveal.distance} min={0} max={600} suffix="px" onChange={(v) => setReveal('distance', v)} />
            <NumberRow id="tour-blur" label={t('tourpanel.motionBlur')} value={tour.reveal.blur} min={0} max={20} suffix="px" onChange={(v) => setReveal('blur', v)} />
          </>
        ))}

        {group('intro', `${t('tourpanel.slate')} · ${t(`option.${tour.intro.style}`)}`, (
          <>
            <SelectRow
              id="tour-intro"
              label={t('tourpanel.arrival')}
              value={tour.intro.style}
              options={INTRO_STYLES}
              onChange={(v) => setIntro('style', v)}
              hint={t(`tourpanel.introHint.${tour.intro.style}`)}
            />
            <NumberRow id="tour-hold" label={t('tourpanel.emptyWall')} value={tour.intro.hold} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setIntro('hold', v)} />
            <NumberRow id="tour-introdur" label={t('tourpanel.duration')} value={tour.intro.duration} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setIntro('duration', v)} />
            <NumberRow id="tour-settle" label={t('tourpanel.settle')} value={tour.intro.settle} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setIntro('settle', v)} />
            <CheckRow id="tour-shake" label={t('tourpanel.impactShake')} value={tour.intro.shake} onChange={(v) => setIntro('shake', v)} />
            <CheckRow id="tour-dust" label={t('tourpanel.dustFlash')} value={tour.intro.dust} onChange={(v) => setIntro('dust', v)} />
            <CheckRow id="tour-studs" label={t('tourpanel.studsPop')} value={tour.intro.studs} onChange={(v) => setIntro('studs', v)} />
            {tour.intro.studs ? (
              <NumberRow id="tour-studstagger" label={t('tourpanel.studStagger')} value={tour.intro.studStagger} min={0} max={400} step={5} suffix="ms" onChange={(v) => setIntro('studStagger', v)} />
            ) : null}
          </>
        ))}

        {group('bar', t('tourpanel.tourBar'), (
          <>
            <CheckRow id="tour-barshow" label={t('tourpanel.showBar')} value={tour.bar.show} onChange={(v) => setBar('show', v)} />
            <SelectRow id="tour-barpos" label={t('tourpanel.position')} value={tour.bar.position} options={BAR_POSITIONS} onChange={(v) => setBar('position', v)} />
            <CheckRow id="tour-barcounter" label={t('tourpanel.stopCounter')} value={tour.bar.counter} onChange={(v) => setBar('counter', v)} />
            <CheckRow id="tour-barlabel" label={t('tourpanel.stopLabel')} value={tour.bar.label} onChange={(v) => setBar('label', v)} />
            <CheckRow id="tour-barprogress" label={t('tourpanel.progressBar')} value={tour.bar.progress} onChange={(v) => setBar('progress', v)} />
            <CheckRow id="tour-bardots" label={t('tourpanel.jumpDots')} value={tour.bar.dots} onChange={(v) => setBar('dots', v)} />
            <TextRow id="tour-barhint" label={t('tourpanel.hintField')} value={tour.bar.hint} onChange={(v) => setBar('hint', v)} />
            <TextRow id="tour-barnext" label={t('tourpanel.next')} value={tour.bar.nextLabel} onChange={(v) => setBar('nextLabel', v)} />
            <TextRow id="tour-barfinish" label={t('tourpanel.lastStop')} value={tour.bar.finishLabel} onChange={(v) => setBar('finishLabel', v)} />
            <TextRow id="tour-barback" label={t('tourpanel.back')} value={tour.bar.backLabel} onChange={(v) => setBar('backLabel', v)} />
            <TextRow id="tour-barskip" label={t('tourpanel.skip')} value={tour.bar.skipLabel} onChange={(v) => setBar('skipLabel', v)} />
          </>
        ))}

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onPreview}>↻ {t('tourpanel.preview')}</button>
          <button className="tbtn" type="button" onClick={onClose}>{t('tourpanel.done')}</button>
        </div>
      </div>
    </div>
  );
}
