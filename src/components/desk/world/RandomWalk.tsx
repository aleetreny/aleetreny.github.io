// A pencil that draws a random walk on a sheet of paper.
//
// Gaussian steps with a drift, laid down at drawing speed, so the trace appears
// the way a pen would lay it down rather than arriving finished. Three controls,
// all of them small, none of them explained.

import { useCallback, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useFrame, useOnScreen } from '../../../lib/world/frame';
import { useUiText } from '../ui-text-context';

const W = 172;
const H = 118;

export function RandomWalk() {
  const t = useUiText();
  const { reduced } = useWorld();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pencilRef = useRef<HTMLSpanElement | null>(null);
  const at = useRef({ x: W / 2, y: H / 2, steps: 0 });
  const [running, setRunning] = useState(false);
  const [drift, setDrift] = useState(0);
  const [sigma, setSigma] = useState(1.6);
  const [dials, setDials] = useState(false);
  const onScreen = useOnScreen(hostRef);

  const ctxOf = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== W * dpr) {
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    return ctx;
  }, []);

  const clear = useCallback(() => {
    const ctx = ctxOf();
    at.current = { x: W / 2, y: H / 2, steps: 0 };
    setRunning(false);
    if (ctx) ctx.clearRect(0, 0, W, H);
  }, [ctxOf]);

  useFrame(() => {
    const ctx = ctxOf();
    if (!ctx) return;
    ctx.lineWidth = 0.8;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(38,42,48,.78)';
    for (let i = 0; i < 4; i += 1) {
      // Box-Muller, so the steps are genuinely normal rather than uniform.
      const u = Math.max(1e-9, Math.random());
      const v = Math.random();
      const r = Math.sqrt(-2 * Math.log(u));
      const dx = r * Math.cos(2 * Math.PI * v) * sigma + drift;
      const dy = r * Math.sin(2 * Math.PI * v) * sigma;
      const nx = at.current.x + dx;
      const ny = at.current.y + dy;
      ctx.beginPath();
      ctx.moveTo(at.current.x, at.current.y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      at.current = {
        // Off the paper is off the paper: it comes back in rather than being
        // lost, which keeps the drawing on the sheet it is drawn on.
        x: nx < 2 || nx > W - 2 ? Math.max(2, Math.min(W - 2, nx)) : nx,
        y: ny < 2 || ny > H - 2 ? Math.max(2, Math.min(H - 2, ny)) : ny,
        steps: at.current.steps + 1,
      };
    }
    const pencil = pencilRef.current;
    if (pencil) pencil.style.transform = `translate(${at.current.x - 6}px, ${at.current.y - 74}px) rotate(-38deg)`;
  }, running && onScreen && !reduced);

  return (
    <ObjectShell id="randomwalk" label={t('world.walk.label')} hint={t('world.walk.hint')}>
      <div className="walk mat-paper" ref={hostRef}>
        <span className="walk__clip" aria-hidden="true" />
        <canvas ref={canvasRef} data-nodrag style={{ width: W, height: H }} />
        <span className="walk__pencil" ref={pencilRef} aria-hidden="true">
          <svg viewBox="0 0 12 74"><path d="M5 0h4l1 8v58l-3 8-3-8V8z" fill="#d8a13c" /><path d="M3 66h6l-3 8z" fill="#e8d3ae" /><path d="M4.4 71.4h3.2L6 74z" fill="#2a2622" /><rect x="3" y="58" width="6" height="4" fill="#b8b2a4" /></svg>
        </span>
        <div className="walk__bar" data-nodrag>
          <button type="button" onClick={() => setRunning((v) => !v)}>{running ? 'stop' : 'start'}</button>
          <button type="button" onClick={clear}>clear</button>
          <button type="button" className="walk__more" onClick={() => setDials((v) => !v)} aria-label={t('world.walk.dials')}>⋯</button>
        </div>
        {dials ? (
          <div className="walk__dials" data-nodrag>
            <label>drift<input type="range" min={-1.2} max={1.2} step={0.05} value={drift} onChange={(e) => setDrift(Number(e.target.value))} /></label>
            <label>σ<input type="range" min={0.3} max={4} step={0.1} value={sigma} onChange={(e) => setSigma(Number(e.target.value))} /></label>
          </div>
        ) : null}
      </div>
    </ObjectShell>
  );
}
