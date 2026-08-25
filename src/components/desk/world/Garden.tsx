// A tray of soil that other people planted.
//
// One plant each, and it grows on the wall clock: leave, come back on Thursday,
// and it has got on with it. What is in the tray is whatever the visitors have
// put there, so over a long enough stretch the tray stops being mine.

import { useCallback, useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { SPECIES, ago, growthOf, speciesOf } from '../../../lib/world/garden';
import { WATER_INTERVAL_MS, gardenPlot, myPlant, plantSeed, waterPlant, type Plant } from '../../../lib/world/remote';
import { useUiText } from '../ui-text-context';

export function Garden() {
  const t = useUiText();
  const { reduced } = useWorld();
  const [plot, setPlot] = useState<Plant[]>([]);
  const [mine, setMine] = useState<Plant | null>(null);
  const [picking, setPicking] = useState(false);
  const [pouring, setPouring] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const canRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let alive = true;
    void Promise.all([gardenPlot(), myPlant()]).then(([all, own]) => {
      if (!alive) return;
      setPlot(all);
      setMine(own);
    }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // A plant does not need sixty frames a second. It needs a minute. The clock
  // is state rather than a call in the render, so the tray is a pure function
  // of when it last ticked.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const sow = useCallback((id: string) => {
    setPicking(false);
    void plantSeed(id).then((plant) => {
      setMine(plant);
      setPlot((current) => (current.some((p) => p.id === plant.id) ? current : [...current, plant]));
    }).catch(() => undefined);
  }, []);

  const water = useCallback(() => {
    if (!mine || pouring) return;
    setPouring(true);
    const el = canRef.current;
    const finish = () => {
      setPouring(false);
      void waterPlant().then((plant) => {
        if (!plant) return;
        setMine(plant);
        setPlot((current) => current.map((p) => (p.id === plant.id ? plant : p)));
      }).catch(() => undefined);
    };
    if (!el || reduced) { finish(); return; }
    el.animate([
      { transform: 'rotate(0deg) translate(0,0)' },
      { transform: 'rotate(-46deg) translate(-16px,-6px)', offset: 0.28 },
      { transform: 'rotate(-46deg) translate(-16px,-6px)', offset: 0.72 },
      { transform: 'rotate(0deg) translate(0,0)' },
    ], { duration: 1500, easing: 'ease-in-out', fill: 'none' })
      .addEventListener('finish', finish, { once: true });
  }, [mine, pouring, reduced]);

  const dry = mine ? now - new Date(mine.wateredAt).getTime() : 0;
  const canWater = Boolean(mine) && dry >= WATER_INTERVAL_MS;
  const shown = plot.slice(-14);

  return (
    <ObjectShell id="garden" label={t('world.garden.label')} hint={mine ? undefined : t('world.garden.hint')}>
      <div className="garden">
        <div className="garden__tray">
          <span className="garden__soil" aria-hidden="true" />
          <span className="garden__rim" aria-hidden="true" />
          <div className="garden__plants" data-nodrag>
            {shown.map((plant, index) => (
              <Sprout
                key={plant.id}
                plant={plant}
                mine={plant.id === mine?.id}
                slot={index}
                total={Math.max(1, shown.length)}
                now={now}
              />
            ))}
          </div>
          {shown.length === 0 ? <span className="garden__empty">{t('world.garden.empty')}</span> : null}
        </div>

        <button
          ref={canRef}
          className={`garden__can${canWater ? ' is-ready' : ''}`}
          type="button"
          data-nodrag
          disabled={!canWater}
          onClick={water}
          aria-label={t('world.garden.water')}
          title={mine ? t('world.garden.watered', { when: ago(mine.wateredAt, now) }) : ''}
        >
          <svg viewBox="0 0 46 38" aria-hidden="true">
            <path d="M12 12h20a4 4 0 0 1 4 4v14a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4z" fill="#8d979a" />
            <path d="M12 18L2 8v-2l11 8z" fill="#788285" />
            <path d="M32 16l10-6 3 3-11 7z" fill="#788285" />
            <path d="M16 12c0-4 3-6 7-6s7 2 7 6" fill="none" stroke="#6b7477" strokeWidth="2.4" />
            <rect x="14" y="16" width="18" height="3" rx="1.5" fill="rgba(255,255,255,.28)" />
          </svg>
          {pouring ? <span className="garden__pour" aria-hidden="true"><i /><i /><i /></span> : null}
        </button>

        {!mine ? (
          <button className="garden__sow" type="button" data-nodrag onClick={() => setPicking((v) => !v)}>
            {t('world.garden.plant')}
          </button>
        ) : (
          <span className="garden__mine" data-nodrag>
            {t('world.garden.yours', { name: speciesOf(mine.species).label.en })}
          </span>
        )}

        {picking ? (
          <div className="garden__seeds" data-nodrag>
            {SPECIES.map((species) => (
              <button key={species.id} type="button" onClick={() => sow(species.id)} title={species.label.en}>
                <span className="garden__seed" style={{ background: species.fruit }} />
                {species.label.en}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </ObjectShell>
  );
}

/** One plant, drawn at whatever stage the clock says it has reached. */
function Sprout({ plant, mine, slot, total, now }: {
  plant: Plant; mine: boolean; slot: number; total: number; now: number;
}) {
  const species = speciesOf(plant.species);
  const growth = growthOf(species, plant.plantedAt, plant.wateredAt, now);
  const x = ((slot + 0.5) / total) * 100;
  const height = 8 + growth.stage * 42;
  const thirsty = growth.parched > species.thirst * 0.6;

  return (
    <span
      className={`sprout${mine ? ' sprout--mine' : ''}${thirsty ? ' sprout--dry' : ''}`}
      style={{ left: `${x}%`, height }}
      title={`${species.label.en} · ${ago(plant.plantedAt, now)}`}
    >
      {!growth.up ? (
        <span className="sprout__mound" aria-hidden="true" />
      ) : (
        <svg viewBox="0 0 30 60" preserveAspectRatio="none" aria-hidden="true">
          <path d={`M15 60V${60 - 46 * growth.stage - 6}`} stroke={species.leaf} strokeWidth="2.4" fill="none" strokeLinecap="round" />
          {growth.stage > 0.18 ? <path d={`M15 ${52 - 20 * growth.stage}c-9-4-12-1-13 4 6 4 11 1 13-4z`} fill={species.leaf2} /> : null}
          {growth.stage > 0.34 ? <path d={`M15 ${44 - 22 * growth.stage}c9-4 12-1 13 4-6 4-11 1-13-4z`} fill={species.leaf} /> : null}
          {species.form === 'root' && growth.stage > 0.5
            ? <path d={`M15 60v-6l-4-2 4-10 4 10-4 2z`} fill={species.fruit} opacity=".85" /> : null}
          {growth.ripe && species.form !== 'root'
            ? <circle cx={species.form === 'tall' ? 15 : 19} cy={species.form === 'tall' ? 8 : 26} r={species.form === 'tall' ? 6.5 : 4} fill={species.fruit} /> : null}
          {growth.ripe && species.form === 'tall'
            ? Array.from({ length: 8 }, (_, i) => {
              const a = (i / 8) * Math.PI * 2;
              return <ellipse key={i} cx={15 + Math.cos(a) * 8} cy={8 + Math.sin(a) * 8} rx="3.4" ry="2" fill="#f0c94c" transform={`rotate(${(a * 180) / Math.PI} ${15 + Math.cos(a) * 8} ${8 + Math.sin(a) * 8})`} />;
            }) : null}
        </svg>
      )}
    </span>
  );
}
