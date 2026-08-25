// A metal plate, a handful of sand, and a frequency dial.
//
// Bow a plate at one of its resonances and it stops moving as a whole: it
// divides into regions that go up while their neighbours go down, separated by
// lines that do not move at all. Sand thrown on the plate is shaken off the
// moving parts and stays where it lands on the still ones, so the nodal lines
// draw themselves. Chladni did this with a violin bow in 1787; the figures are
// his.
//
// The plate here is square and free at its edges, so the mode shapes are the
// Ritz combinations
//
//     A(x,y) = cos(nπx) cos(mπy) − cos(mπx) cos(nπy)
//
// and the sand is a thousand grains that each walk down the gradient of |A|
// and are kicked in proportion to it. Away from a resonance the plate barely
// moves and nothing happens — which is why sweeping the dial finds figures at
// some frequencies and nothing at all in between.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useDetail, useFrame, useOnScreen } from '../../../lib/world/frame';
import { clamp, mulberry32 } from '../../../lib/world/rng';
import { useUiText } from '../ui-text-context';

const SIZE = 152;
const GRAINS = 1250;
/** The amplitude map is sampled on this grid and interpolated between. */
const N = 72;

/** The resonances this plate has, in the order they arrive. Each is a mode
 *  pair and the frequency the plate sings it at. */
const MODES: Array<{ n: number; m: number; hz: number }> = [
  { n: 1, m: 2, hz: 122 },
  { n: 1, m: 3, hz: 241 },
  { n: 2, m: 3, hz: 396 },
  { n: 1, m: 4, hz: 528 },
  { n: 2, m: 4, hz: 690 },
  { n: 3, m: 4, hz: 874 },
  { n: 1, m: 5, hz: 1046 },
  { n: 3, m: 5, hz: 1290 },
  { n: 4, m: 5, hz: 1518 },
  { n: 2, m: 6, hz: 1742 },
];
const LO = 80;
const HI = 1850;
/** How far off a resonance the plate still answers. */
const BAND = 26;

const maps = new Map<string, Float32Array>();

/** |A| over the plate, once per mode. */
function amplitude(n: number, m: number): Float32Array {
  const key = `${n}:${m}`;
  const cached = maps.get(key);
  if (cached) return cached;
  const field = new Float32Array(N * N);
  for (let j = 0; j < N; j += 1) {
    const y = j / (N - 1);
    for (let i = 0; i < N; i += 1) {
      const x = i / (N - 1);
      const a = Math.cos(n * Math.PI * x) * Math.cos(m * Math.PI * y)
        - Math.cos(m * Math.PI * x) * Math.cos(n * Math.PI * y);
      field[j * N + i] = Math.abs(a);
    }
  }
  maps.set(key, field);
  return field;
}

function sample(field: Float32Array, u: number, v: number): number {
  const x = clamp(u, 0, 0.9999) * (N - 1);
  const y = clamp(v, 0, 0.9999) * (N - 1);
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;
  const i1 = Math.min(N - 1, i + 1);
  const j1 = Math.min(N - 1, j + 1);
  const a = field[j * N + i];
  const b = field[j * N + i1];
  const c = field[j1 * N + i];
  const d = field[j1 * N + i1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function scatter(): Float32Array {
  const rand = mulberry32(1787);
  const grains = new Float32Array(GRAINS * 2);
  for (let i = 0; i < GRAINS; i += 1) {
    grains[i * 2] = 0.06 + rand() * 0.88;
    grains[i * 2 + 1] = 0.06 + rand() * 0.88;
  }
  return grains;
}

export function ChladniPlate() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const grains = useRef<Float32Array | null>(null);
  const stir = useRef(1);
  const [hz, setHz] = useState(396);
  const onScreen = useOnScreen(hostRef);
  const detailed = useDetail(hostRef, 92);

  /** Which resonance the dial is sitting on, and how hard the plate is
   *  answering. Between resonances it is barely moving at all. */
  const tuned = useMemo(() => {
    let best = MODES[0];
    let gap = Infinity;
    for (const mode of MODES) {
      const d = Math.abs(mode.hz - hz);
      if (d < gap) { gap = d; best = mode; }
    }
    // Off a resonance the plate still answers, faintly and without shape —
    // which is what makes tuning *into* a figure feel like tuning. On it, the
    // response is the figure.
    const lock = clamp(1 - gap / BAND, 0, 1);
    return { mode: best, lock, drive: 0.3 + lock * 0.7 };
  }, [hz]);

  // Every change of figure starts by throwing the old one apart.
  useEffect(() => { stir.current = 1; }, [tuned.mode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const list = grains.current;
    if (!canvas || !ctx || !list) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== SIZE * dpr) { canvas.width = SIZE * dpr; canvas.height = SIZE * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // The plate: brushed steel, darkened by being looked at from above.
    const steel = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    steel.addColorStop(0, '#3a4147');
    steel.addColorStop(0.45, '#22282d');
    steel.addColorStop(1, '#141a1e');
    ctx.fillStyle = steel;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = 'rgba(190,208,220,.18)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);
    // The clamp at the centre, which is what picks these modes out of all the
    // others the plate could sing.
    ctx.fillStyle = 'rgba(150,166,176,.5)';
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, 3.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(236,228,203,.92)';
    for (let i = 0; i < GRAINS; i += 1) {
      ctx.fillRect(list[i * 2] * SIZE - 0.6, list[i * 2 + 1] * SIZE - 0.6, 1.3, 1.3);
    }
  }, []);

  useEffect(() => { grains.current ??= scatter(); draw(); }, [draw]);

  useFrame((dt) => {
    const list = (grains.current ??= scatter());
    const step = Math.min(2.2, dt / 16.7);
    const field = amplitude(tuned.mode.n, tuned.mode.m);
    const drive = tuned.drive;
    stir.current = Math.max(0, stir.current - 0.012 * step);
    // While the figure is re-forming the plate throws the sand everywhere; as
    // the transient dies the gradient wins and the lines appear.
    const chaos = (0.006 + stir.current * 0.05) * drive;
    // Only a plate that is actually resonating sorts its sand into lines; off
    // resonance the shaking simply stirs it about.
    const pull = 0.0075 * tuned.lock * (1 - stir.current * 0.55);

    for (let i = 0; i < GRAINS; i += 1) {
      const x = list[i * 2];
      const y = list[i * 2 + 1];
      const a = sample(field, x, y);
      // Downhill on |A|: toward the lines that are not moving.
      const gx = sample(field, x + 0.012, y) - sample(field, x - 0.012, y);
      const gy = sample(field, x, y + 0.012) - sample(field, x, y - 0.012);
      const kick = chaos * (0.25 + a);
      let nx = x - gx * pull * step * 8 + (Math.random() - 0.5) * kick * step;
      let ny = y - gy * pull * step * 8 + (Math.random() - 0.5) * kick * step;
      // A grain shaken off the edge is a grain on the bench, so the plate
      // keeps its sand: the rim turns it back.
      if (nx < 0.012) nx = 0.012 + Math.random() * 0.01;
      if (nx > 0.988) nx = 0.988 - Math.random() * 0.01;
      if (ny < 0.012) ny = 0.012 + Math.random() * 0.01;
      if (ny > 0.988) ny = 0.988 - Math.random() * 0.01;
      list[i * 2] = nx;
      list[i * 2 + 1] = ny;
    }
    draw();
  }, onScreen && detailed && !reduced);

  /** Turned by hand, the way a bench dial is: the pointer's travel turns it,
   *  rather than the pointer's *angle* setting it — on a knob this small an
   *  absolute mapping swings a thousand hertz for a twitch of the wrist. It
   *  clicks into the nearest resonance when let go, which is what the marks
   *  around the rim are. */
  const turn = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();
    const start = { x: event.clientX, y: event.clientY };
    let value = hz;
    const move = (ev: PointerEvent) => {
      const travel = (start.y - ev.clientY) + (ev.clientX - start.x);
      value = clamp(hz + travel * 4, LO, HI);
      setHz(Math.round(value));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      let near = MODES[0];
      let gap = Infinity;
      for (const mode of MODES) {
        const d = Math.abs(mode.hz - value);
        if (d < gap) { gap = d; near = mode; }
      }
      if (gap < 46) setHz(near.hz);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [hz]);

  const angle = ((hz - LO) / (HI - LO)) * 270 - 135;

  return (
    <ObjectShell id="chladni" label={t('world.chladni.label')} hint={t('world.chladni.hint')}>
      <div className="chladni" ref={hostRef}>
        <span className="chladni__frame mat-metal" aria-hidden="true" />
        <canvas ref={canvasRef} data-nodrag style={{ width: SIZE, height: SIZE }} />
        <div className="chladni__panel mat-dark">
          <button
            className="chladni__knob"
            type="button"
            data-nodrag
            onPointerDown={turn}
            aria-label={t('world.chladni.dial')}
            title={t('world.chladni.dial')}
          >
            <span className="chladni__marks" aria-hidden="true">
              {MODES.map((mode) => (
                <i
                  key={mode.hz}
                  className={mode === tuned.mode && tuned.lock > 0.35 ? 'is-on' : undefined}
                  style={{ transform: `rotate(${((mode.hz - LO) / (HI - LO)) * 270 - 135}deg)` }}
                />
              ))}
            </span>
            <span className="chladni__pointer" style={{ transform: `rotate(${angle}deg)` }} aria-hidden="true" />
          </button>
          <span className="chladni__read">
            <b>{hz}</b> Hz
            <em style={{ opacity: 0.25 + tuned.lock * 0.75 }}>
              {tuned.lock > 0.35 ? `${tuned.mode.n},${tuned.mode.m}` : '—'}
            </em>
          </span>
        </div>
      </div>
    </ObjectShell>
  );
}
