// Everything loose on the slate, and the rules they share.
//
// This component owns three things a single object cannot: the paint that has
// landed on the board itself, the keyboard (the arrows change the paint, ESC
// puts a tool down, and typing 42 anywhere does what typing 42 should do), and
// the two moments when the whole world moves at once — the alignment, and the
// gravity going off.

import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OBJECT_SPECS, hasTrait, type DeskObject, type ObjectKind } from '../../../lib/world/kinds';
import { useWorld } from '../../../lib/world/context';
import { PAINT_COLORS, paintHex } from '../../../lib/world/splats';
import { SplatMark } from './SplatMarks';
import { useUiText } from '../ui-text-context';
import { useWorldKeys } from './useWorldKeys';

import { Coin } from './Coin';
import { DecisionDie } from './DecisionDie';
import { Calculator } from './Calculator';
import { DoNotPress } from './DoNotPress';
import { Book } from './Book';
import { Scholarship } from './Scholarship';
import { NotePad } from './NotePad';
import { PaintGun } from './PaintGun';
import { Hourglass } from './Hourglass';
import { LorenzCup } from './LorenzCup';
import { ScopeField, Telescope } from './Telescope';
import { Passport } from './Passport';
import { PolaroidCamera } from './PolaroidCamera';
import { Flower } from './Flower';
import { Garden } from './Garden';
import { Dilemma } from './Dilemma';
import { CuriosityMachine } from './CuriosityMachine';
import { Photos } from './Photos';

// The heavy ones: a canvas each, and a simulation behind it. They arrive after
// the board is already usable, and they only run while they are on screen.
const Petri = lazy(() => import('./Petri').then((m) => ({ default: m.Petri })));
const Physarum = lazy(() => import('./Physarum').then((m) => ({ default: m.Physarum })));
const PcaLamp = lazy(() => import('./PcaLamp').then((m) => ({ default: m.PcaLamp })));
const BlackHole = lazy(() => import('./BlackHole').then((m) => ({ default: m.BlackHole })));
const LifeGrid = lazy(() => import('./LifeGrid').then((m) => ({ default: m.LifeGrid })));
const Regression = lazy(() => import('./Regression').then((m) => ({ default: m.Regression })));
const RandomWalk = lazy(() => import('./RandomWalk').then((m) => ({ default: m.RandomWalk })));
const Arcade = lazy(() => import('./Arcade').then((m) => ({ default: m.Arcade })));

export type WorldLayerProps = {
  objects: DeskObject[];
  boardSize: { width: number; height: number };
  entries: Array<{ slug: string; title: string }>;
  onOpenEntry: (slug: string) => void;
};

export function WorldLayer({ objects, boardSize, entries, onOpenEntry }: WorldLayerProps) {
  const world = useWorld();
  const { splats, nodes, placeRef, reduced, swallowed } = world;
  const [spin, setSpin] = useState(0);
  const [alarm, setAlarm] = useState(false);
  useWorldKeys();

  const visible = useMemo(() => objects.filter((o) => o.visible), [objects]);

  // ---- the third press: something turns -------------------------------------
  useEffect(() => {
    if (spin === 0 || reduced) return;
    const pool = visible.filter((o) => hasTrait(o.id, 'physics') && !swallowed.includes(o.id));
    const victim = pool[Math.floor(Math.random() * pool.length)];
    const el = victim ? nodes.current.get(victim.id) : null;
    const at = victim ? placeRef.current.get(victim.id) : null;
    if (!el || !at) return;
    el.animate([
      { transform: `rotate(${at.rot}deg) scale(${at.scale})` },
      { transform: `rotate(${at.rot + 720}deg) scale(${at.scale})` },
    ], { duration: 1700, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'none' });
  }, [nodes, placeRef, reduced, spin, swallowed, visible]);

  const slateSplats = splats.filter((s) => s.layer === 'slate');
  const paperSplats = splats.filter((s) => s.layer === 'paper');

  const render = useCallback((object: DeskObject) => {
    switch (object.id) {
      case 'coin': return <Coin key="coin" />;
      case 'die': return <DecisionDie key="die" entries={entries} onOpenEntry={onOpenEntry} />;
      case 'calculator': return <Calculator key="calculator" onAnswer={world.fireAnswer} />;
      case 'donotpress': return (
        <DoNotPress
          key="donotpress"
          onAlarm={() => { setAlarm(true); window.setTimeout(() => setAlarm(false), 2600); }}
          onSpin={() => setSpin((n) => n + 1)}
        />
      );
      case 'book': return <Book key="book" />;
      case 'scholarship': return <Scholarship key="scholarship" />;
      case 'notepad': return <NotePad key="notepad" />;
      case 'paintgun': return <PaintGun key="paintgun" />;
      case 'hourglass': return <Hourglass key="hourglass" />;
      case 'lorenz': return <LorenzCup key="lorenz" />;
      case 'telescope': return <Telescope key="telescope" />;
      case 'passport': return <Passport key="passport" />;
      case 'camera': return <PolaroidCamera key="camera" />;
      case 'flower': return <Flower key="flower" />;
      case 'garden': return <Garden key="garden" />;
      case 'dilemma': return <Dilemma key="dilemma" />;
      case 'curiosity': return <CuriosityMachine key="curiosity" />;
      case 'petri': return <Petri key="petri" />;
      case 'physarum': return <Physarum key="physarum" />;
      case 'pcalamp': return <PcaLamp key="pcalamp" />;
      case 'blackhole': return <BlackHole key="blackhole" boardSize={boardSize} />;
      case 'life': return <LifeGrid key="life" onGlider={world.fireAnswer} />;
      case 'regression': return <Regression key="regression" />;
      case 'randomwalk': return <RandomWalk key="randomwalk" />;
      case 'arcade': return <Arcade key="arcade" />;
      default: return null;
    }
  }, [boardSize, entries, onOpenEntry, world.fireAnswer]);

  return (
    <>
      <div className="world-paint world-paint--slate" aria-hidden="true">
        {slateSplats.map((splat) => <SplatMark key={splat.id} splat={splat} />)}
      </div>

      <Suspense fallback={null}>
        {visible.map(render)}
      </Suspense>

      <Photos />

      <div className="world-paint world-paint--paper" aria-hidden="true">
        {paperSplats.map((splat) => <SplatMark key={splat.id} splat={splat} />)}
      </div>

      {alarm ? <div className="world-alarm" aria-hidden="true" /> : null}
    </>
  );
}

/** The board-level chrome a held tool needs: an aiming cursor, the colour it is
 *  loaded with, and the one line of instruction that only exists while you are
 *  holding something. Rendered outside the camera, so it stays screen-sized. */
export function WorldOverlay({ boardSize }: { boardSize: { width: number; height: number } }) {
  const t = useUiText();
  const world = useWorld();
  const { tool, paintColor, hold, zeroG, setZeroG, swallowed, restoreWorld, clearSplats } = world;
  const reticleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tool || tool === 'scope') return undefined;
    const move = (event: PointerEvent) => {
      const el = reticleRef.current;
      if (el) el.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;
    };
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, [tool]);

  useEffect(() => {
    if (!tool) return undefined;
    document.body.classList.add('has-tool');
    return () => document.body.classList.remove('has-tool');
  }, [tool]);

  const colour = paintHex(paintColor);
  const swallowedCount = swallowed.length;

  return (
    <>
      {/* Everything here is screen furniture rather than board furniture, and
          it has to live outside the camera: a transformed ancestor becomes the
          containing block for `position: fixed`, so an eyepiece rendered inside
          the board would be pinned to the slate and zoom with it. */}
      <ScopeField boardSize={boardSize} />

      {tool && tool !== 'scope' ? (
        <div className={`reticle reticle--${tool}`} ref={reticleRef} aria-hidden="true">
          <svg viewBox="-30 -30 60 60">
            <circle r="22" className="reticle__ring" />
            <circle r="3" className="reticle__dot" style={tool === 'paint' ? { fill: colour } : undefined} />
            <path d="M-28 0h13M15 0h13M0 -28v13M0 15v13" className="reticle__cross" />
          </svg>
        </div>
      ) : null}

      {tool ? (
        <div className="toolbar-tool" role="status">
          <span className="toolbar-tool__name">{t(`world.tool.${tool}`)}</span>
          {tool === 'paint' ? (
            <span className="toolbar-tool__swatches">
              {PAINT_COLORS.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`toolbar-tool__swatch${entry.id === paintColor ? ' is-on' : ''}`}
                  style={{ background: entry.hex }}
                  aria-label={entry.id}
                  onClick={() => world.setPaintColor(entry.id)}
                />
              ))}
            </span>
          ) : null}
          <span className="toolbar-tool__hint">{t(`world.tool.${tool}.hint`)}</span>
          {tool === 'paint' ? (
            <button className="toolbar-tool__drop" type="button" onClick={clearSplats}>{t('world.tool.paint.clear')}</button>
          ) : null}
          {/* The way out, spelled out. A bare "esc" is a keycap, not a sentence:
              a visitor holding a paint gun needs to be told, in words, that the
              key puts it down — and to be able to click the same thing. */}
          <button className="toolbar-tool__drop toolbar-tool__drop--esc" type="button" onClick={() => hold(null)}>
            <kbd>esc</kbd> {t('world.tool.drop')}
          </button>
        </div>
      ) : null}

      {zeroG ? (
        <button className="world-flag" type="button" onClick={() => setZeroG(false)}>
          {t('world.zeroG')}<span> · esc</span>
        </button>
      ) : null}

      {swallowedCount > 0 ? (
        <button className="world-flag world-flag--lost" type="button" onClick={restoreWorld}>
          {t('world.lost', { n: swallowedCount })}
        </button>
      ) : null}
    </>
  );
}

export { OBJECT_SPECS };
export type { ObjectKind };
