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

type TourPanelProps = {
  tour: TourConfig;
  /** Every draggable thing on the board, for the stop editor. */
  items: TourItem[];
  onChange: (next: TourConfig) => void;
  onPreview: () => void;
  onClose: () => void;
};

const ROUTE_HINT: Record<(typeof TOUR_ROUTES)[number], string> = {
  custom: 'the stops you write below, in your order',
  lists: 'one stop per drawer list, then the loose pieces',
  columns: 'column by column, left to right',
  rows: 'band by band, top to bottom',
  reading: 'like reading a page: across, then down',
  spiral: 'from the middle of the board outwards',
  clock: 'around the board, starting at twelve',
  random: 'a fresh shuffle every time it plays',
  solo: 'one piece at a time, nothing skipped',
};

function Section({ title }: { title: string }) {
  return <div className="panel__section">{title}</div>;
}

function SelectRow<T extends string>({ id, label, value, options, onChange, hint }: {
  id: string; label: string; value: T; options: readonly T[]; onChange: (value: T) => void; hint?: string;
}) {
  return (
    <>
      <div className="field-row">
        <label htmlFor={id}>{label}</label>
        <select id={id} value={value} onChange={(event) => onChange(event.target.value as T)}>
          {options.map((option) => <option key={option} value={option}>{option}</option>)}
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
          aria-label={`${label} slider`}
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
    { id: `stop-${Date.now().toString(36)}`, label: 'a new stop', items: [] },
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
      <div className="panel panel--theme" role="dialog" aria-modal="true" aria-label="Edit the guided tour">
        <div className="panel__eyebrow">guided tour</div>
        <div className="panel__title">The board tour</div>
        <p className="panel__hint">
          The slate lands on the wall, then the visitor walks the board stop by stop. Everything below is
          live — press preview to watch the run with the current settings.
        </p>

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onPreview}>↻ preview</button>
          <button className="tbtn" type="button" onClick={onClose}>done</button>
        </div>

        <Section title="run" />
        <CheckRow id="tour-enabled" label="Play for visitors" value={tour.enabled} onChange={(v) => set('enabled', v)} />
        <SelectRow
          id="tour-replay"
          label="Show it"
          value={tour.replay}
          options={REPLAY_MODES}
          onChange={(v) => set('replay', v)}
          hint={{ always: 'every single visit', session: 'once per browser session', once: 'once, then never again on this device' }[tour.replay]}
        />
        <SelectRow
          id="tour-advance"
          label="Advance"
          value={tour.advance}
          options={ADVANCE_MODES}
          onChange={(v) => set('advance', v)}
          hint={{
            manual: 'the visitor clicks next (or presses space)',
            auto: 'moves on by itself after the dwell below',
            scroll: 'the wheel steps forward and back instead of zooming',
          }[tour.advance]}
        />
        {tour.advance === 'auto' ? (
          <NumberRow id="tour-dwell" label="Dwell" value={tour.dwell} min={600} max={20000} step={100} suffix="ms" onChange={(v) => set('dwell', v)} />
        ) : null}
        <NumberRow id="tour-speed" label="Speed" value={tour.speed} min={0.3} max={3} step={0.1} suffix="×" onChange={(v) => set('speed', v)} />
        <CheckRow id="tour-loop" label="Loop at the end" value={tour.loop} onChange={(v) => set('loop', v)} />

        {group('route', `route · ${tour.route}`, (
          <>
            <SelectRow
              id="tour-route"
              label="Shape"
              value={tour.route}
              options={TOUR_ROUTES}
              onChange={(v) => set('route', v)}
              hint={ROUTE_HINT[tour.route]}
            />
            {tour.route !== 'custom' && tour.route !== 'solo' ? (
              <NumberRow id="tour-group" label="Pieces per stop" value={tour.groupSize} min={1} max={8} onChange={(v) => set('groupSize', v)} />
            ) : null}
            <CheckRow id="tour-rest" label="Sweep up the leftovers" value={tour.includeRest} onChange={(v) => set('includeRest', v)} />

            {tour.route === 'custom' ? (
              <>
                <div className="panel__note">{tour.stops.length} stops · drag order with the arrows</div>
                <div className="stopeditor">
                  {tour.stops.map((stop, index) => (
                    <div className="stopeditor__stop" key={stop.id}>
                      <div className="field-row" style={{ margin: 0 }}>
                        <span className="stopeditor__n">{index + 1}</span>
                        <input
                          className="field-inline"
                          type="text"
                          value={stop.label}
                          placeholder="stop label"
                          onChange={(event) => patchStop(index, { label: event.target.value })}
                          aria-label={`Stop ${index + 1} heading`}
                        />
                        <button className="editdel" type="button" onClick={() => moveStop(index, -1)} aria-label="Move up">↑</button>
                        <button className="editdel" type="button" onClick={() => moveStop(index, 1)} aria-label="Move down">↓</button>
                        <button className="editdel" type="button" onClick={() => setStops(tour.stops.filter((_, i) => i !== index))} aria-label="Delete stop">×</button>
                      </div>
                      <div className="stopeditor__items">
                        {stop.items.map((id) => (
                          <span className={`stopeditor__chip ${byId.has(id) ? '' : 'is-missing'}`} key={id}>
                            {byId.get(id)?.label ?? id}
                            <button
                              type="button"
                              className="chip__x"
                              onClick={() => patchStop(index, { items: stop.items.filter((other) => other !== id) })}
                              aria-label={`Remove ${id}`}
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
                          aria-label={`Add a piece to stop ${index + 1}`}
                        >
                          <option value="">+ piece</option>
                          {items.filter((item) => !stop.items.includes(item.id)).map((item) => (
                            <option key={item.id} value={item.id}>{item.label}</option>
                          ))}
                        </select>
                      </div>
                      {/* What the stop carries rather than frames. The camera
                          never widens for these, so a loose photo lands beside
                          the card without ever becoming a halt of its own. */}
                      <div className="stopeditor__items stopeditor__items--extra">
                        {(stop.extras ?? []).map((id) => (
                          <span className={`stopeditor__chip stopeditor__chip--extra ${byId.has(id) ? '' : 'is-missing'}`} key={id}>
                            {byId.get(id)?.label ?? id}
                            <button
                              type="button"
                              className="chip__x"
                              onClick={() => patchStop(index, { extras: (stop.extras ?? []).filter((other) => other !== id) })}
                              aria-label={`Remove ${id}`}
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
                          aria-label={`Land a piece at stop ${index + 1} without framing it`}
                        >
                          <option value="">+ lands here</option>
                          {items
                            .filter((item) => !stop.items.includes(item.id) && !(stop.extras ?? []).includes(item.id))
                            .map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="panel__actions">
                  <button className="tbtn" type="button" onClick={addStop}>+ stop</button>
                </div>
              </>
            ) : (
              <>
                <div className="panel__note">{generated.length} stops, rebuilt from the board every run:</div>
                <ol className="stopeditor__preview">
                  {generated.map((stop) => <li key={stop.id}>{stop.label}<span> · {stop.items.length}</span></li>)}
                </ol>
                <div className="panel__actions">
                  <button
                    className="tbtn"
                    type="button"
                    onClick={() => onChange({ ...tour, route: 'custom', stops: generated })}
                  >
                    copy into custom
                  </button>
                </div>
              </>
            )}
          </>
        ))}

        {group('camera', `camera · ${tour.camera.motion}`, (
          <>
            <SelectRow
              id="tour-motion"
              label="Motion"
              value={tour.camera.motion}
              options={CAMERA_MOTIONS}
              onChange={(v) => setCamera('motion', v)}
              hint={{
                glide: 'a straight, eased flight',
                arc: 'lifts over the board on the way',
                swoop: 'pulls back mid-flight, then drops in',
                push: 'slides across first, zooms in after',
                pull: 'zooms out first, slides across after',
                drift: 'constant speed, no ease at all',
                spring: 'overshoots the mark and settles',
                cut: 'no travel — hard cut to the next stop',
              }[tour.camera.motion]}
            />
            <SelectRow id="tour-ease" label="Easing" value={tour.camera.easing} options={EASINGS} onChange={(v) => setCamera('easing', v)} />
            <NumberRow id="tour-first" label="First flight" value={tour.camera.firstDuration} min={0} max={4000} step={10} suffix="ms" onChange={(v) => setCamera('firstDuration', v)} />
            <NumberRow id="tour-dur" label="Later flights" value={tour.camera.duration} min={0} max={4000} step={10} suffix="ms" onChange={(v) => setCamera('duration', v)} />
            {tour.camera.motion === 'arc' ? (
              <NumberRow id="tour-arc" label="Arc height" value={tour.camera.arc} min={0} max={400} suffix="px" onChange={(v) => setCamera('arc', v)} />
            ) : null}
            {tour.camera.motion === 'swoop' ? (
              <NumberRow id="tour-swoop" label="Swoop depth" value={tour.camera.swoop} min={0} max={0.7} step={0.01} onChange={(v) => setCamera('swoop', v)} />
            ) : null}
            <NumberRow id="tour-maxscale" label="Zoom ceiling" value={tour.camera.maxScale} min={0.2} max={2.4} step={0.05} suffix="×" onChange={(v) => setCamera('maxScale', v)} />
            <NumberRow id="tour-inflate" label="Breathing room" value={tour.camera.inflate} min={0} max={400} suffix="px" onChange={(v) => setCamera('inflate', v)} />
            <NumberRow id="tour-padx" label="Pad · sides" value={tour.camera.padX} min={0} max={400} suffix="px" onChange={(v) => setCamera('padX', v)} />
            <NumberRow id="tour-padtop" label="Pad · top" value={tour.camera.padTop} min={0} max={400} suffix="px" onChange={(v) => setCamera('padTop', v)} />
            <NumberRow id="tour-padbottom" label="Pad · bottom" value={tour.camera.padBottom} min={0} max={500} suffix="px" onChange={(v) => setCamera('padBottom', v)} />
          </>
        ))}

        {group('mobile', `phones · ${tour.mobile.enabled ? `${tour.mobile.maxPerStop} per stop` : 'off'}`, (
          <>
            <CheckRow
              id="tour-mobile"
              label="Adapt on small screens"
              value={tour.mobile.enabled}
              onChange={(v) => setMobile('enabled', v)}
            />
            <div className="panel__note">
              The board is 2540px wide, so a phone always sees a detail of it. Below the width
              here the same route is walked a few pieces at a time, with padding a small screen
              can afford — otherwise three cards at once are three cards nobody can read.
            </div>
            {tour.mobile.enabled ? (
              <>
                <NumberRow id="tour-mbreak" label="Applies below" value={tour.mobile.breakpoint} min={320} max={1400} step={10} suffix="px" onChange={(v) => setMobile('breakpoint', v)} />
                <NumberRow id="tour-mmax" label="Pieces per stop" value={tour.mobile.maxPerStop} min={1} max={8} onChange={(v) => setMobile('maxPerStop', v)} />
                <NumberRow id="tour-mscale" label="Zoom ceiling" value={tour.mobile.maxScale} min={0.2} max={2.4} step={0.05} suffix="×" onChange={(v) => setMobile('maxScale', v)} />
                <NumberRow id="tour-minflate" label="Breathing room" value={tour.mobile.inflate} min={0} max={300} suffix="px" onChange={(v) => setMobile('inflate', v)} />
                <NumberRow id="tour-mpadx" label="Pad · sides" value={tour.mobile.padX} min={0} max={200} suffix="px" onChange={(v) => setMobile('padX', v)} />
                <NumberRow id="tour-mpadtop" label="Pad · top" value={tour.mobile.padTop} min={0} max={300} suffix="px" onChange={(v) => setMobile('padTop', v)} />
                <NumberRow id="tour-mpadbottom" label="Pad · bottom" value={tour.mobile.padBottom} min={0} max={400} suffix="px" onChange={(v) => setMobile('padBottom', v)} />
              </>
            ) : null}
          </>
        ))}

        {group('reveal', `pieces · ${tour.reveal.style}`, (
          <>
            <SelectRow
              id="tour-reveal"
              label="Landing"
              value={tour.reveal.style}
              options={REVEAL_STYLES}
              onChange={(v) => setReveal('style', v)}
              hint={{
                stick: 'thrown in from off-slate and pinned',
                drop: 'falls in from above',
                rise: 'comes up from below',
                fade: 'plain fade, nothing moves',
                zoom: 'scales up past the mark and settles',
                flip: 'turns over onto its face',
                swing: 'swings in like it is on a hinge',
                slam: 'lands big and shrinks into place',
                none: 'appears with no animation at all',
              }[tour.reveal.style]}
            />
            <SelectRow id="tour-revealorder" label="Order" value={tour.reveal.order} options={REVEAL_ORDERS} onChange={(v) => setReveal('order', v)} />
            <SelectRow id="tour-revealease" label="Easing" value={tour.reveal.easing} options={EASINGS} onChange={(v) => setReveal('easing', v)} />
            <NumberRow id="tour-revealdur" label="Duration" value={tour.reveal.duration} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setReveal('duration', v)} />
            <NumberRow id="tour-stagger" label="Stagger" value={tour.reveal.stagger} min={0} max={1200} step={10} suffix="ms" onChange={(v) => setReveal('stagger', v)} />
            <NumberRow id="tour-distance" label="Travel" value={tour.reveal.distance} min={0} max={600} suffix="px" onChange={(v) => setReveal('distance', v)} />
            <NumberRow id="tour-blur" label="Motion blur" value={tour.reveal.blur} min={0} max={20} suffix="px" onChange={(v) => setReveal('blur', v)} />
          </>
        ))}

        {group('intro', `slate · ${tour.intro.style}`, (
          <>
            <SelectRow
              id="tour-intro"
              label="Arrival"
              value={tour.intro.style}
              options={INTRO_STYLES}
              onChange={(v) => setIntro('style', v)}
              hint={{
                slam: 'slams onto the wall from above',
                fade: 'fades up out of the wall',
                raise: 'lifts into place from below',
                sweep: 'wipes in from the left edge',
                none: 'already hanging there',
              }[tour.intro.style]}
            />
            <NumberRow id="tour-hold" label="Empty wall" value={tour.intro.hold} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setIntro('hold', v)} />
            <NumberRow id="tour-introdur" label="Duration" value={tour.intro.duration} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setIntro('duration', v)} />
            <NumberRow id="tour-settle" label="Settle" value={tour.intro.settle} min={0} max={3000} step={10} suffix="ms" onChange={(v) => setIntro('settle', v)} />
            <CheckRow id="tour-shake" label="Impact shake" value={tour.intro.shake} onChange={(v) => setIntro('shake', v)} />
            <CheckRow id="tour-dust" label="Dust flash" value={tour.intro.dust} onChange={(v) => setIntro('dust', v)} />
            <CheckRow id="tour-studs" label="Studs pop in" value={tour.intro.studs} onChange={(v) => setIntro('studs', v)} />
            {tour.intro.studs ? (
              <NumberRow id="tour-studstagger" label="Stud stagger" value={tour.intro.studStagger} min={0} max={400} step={5} suffix="ms" onChange={(v) => setIntro('studStagger', v)} />
            ) : null}
          </>
        ))}

        {group('bar', 'tour bar', (
          <>
            <CheckRow id="tour-barshow" label="Show the bar" value={tour.bar.show} onChange={(v) => setBar('show', v)} />
            <SelectRow id="tour-barpos" label="Position" value={tour.bar.position} options={BAR_POSITIONS} onChange={(v) => setBar('position', v)} />
            <CheckRow id="tour-barcounter" label="Stop counter" value={tour.bar.counter} onChange={(v) => setBar('counter', v)} />
            <CheckRow id="tour-barlabel" label="Stop label" value={tour.bar.label} onChange={(v) => setBar('label', v)} />
            <CheckRow id="tour-barprogress" label="Progress bar" value={tour.bar.progress} onChange={(v) => setBar('progress', v)} />
            <CheckRow id="tour-bardots" label="Jump dots" value={tour.bar.dots} onChange={(v) => setBar('dots', v)} />
            <TextRow id="tour-barhint" label="Hint" value={tour.bar.hint} onChange={(v) => setBar('hint', v)} />
            <TextRow id="tour-barnext" label="Next" value={tour.bar.nextLabel} onChange={(v) => setBar('nextLabel', v)} />
            <TextRow id="tour-barfinish" label="Last stop" value={tour.bar.finishLabel} onChange={(v) => setBar('finishLabel', v)} />
            <TextRow id="tour-barback" label="Back" value={tour.bar.backLabel} onChange={(v) => setBar('backLabel', v)} />
            <TextRow id="tour-barskip" label="Skip" value={tour.bar.skipLabel} onChange={(v) => setBar('skipLabel', v)} />
          </>
        ))}

        <div className="panel__actions">
          <button className="tbtn tbtn--on" type="button" onClick={onPreview}>↻ preview</button>
          <button className="tbtn" type="button" onClick={onClose}>done</button>
        </div>
      </div>
    </div>
  );
}
