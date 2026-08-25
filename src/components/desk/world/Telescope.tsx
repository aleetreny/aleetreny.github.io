// A telescope, and what you can see through it.
//
// Take the eyepiece and a circular field opens under the pointer. Inside it the
// board is magnified — really magnified, the same drawing the Polaroid makes,
// at four times the size — and past the edge of the slate there is a sky.
//
// Saturn is out there somewhere. Nobody is told where.

import { useEffect, useRef, useState } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { addFrame } from '../../../lib/world/frame';
import { drawStars, renderRegion } from '../../../lib/world/capture';
import { readLocal, writeLocal } from '../../../lib/world/visitor';
import { useUiText } from '../ui-text-context';

const FIELD = 300;
const MAG = 3.4;
const FOUND_KEY = 'board.saturn';

/** Where the planet is, in board units. Off the right-hand edge and well below
 *  the desk — you have to sweep the empty sky to find it. */
const SATURN = { x: 4460, y: 1980, r: 92 };

export function Telescope() {
  const t = useUiText();
  const world = useWorld();
  const { tool, hold } = world;
  const held = tool === 'scope';

  return (
    <ObjectShell
      id="telescope"
      fixed={held}
      onActivate={() => hold('scope')}
      hint={held ? undefined : t('world.scope.hint')}
      label={t('world.scope.label')}
    >
      <div className={`scope${held ? ' scope--held' : ''}`}>
        <svg viewBox="0 0 150 180" aria-hidden="true">
          <defs>
            <linearGradient id="scopetube" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#3c4d5c" /><stop offset=".34" stopColor="#93a7b6" />
              <stop offset=".58" stopColor="#5c6f7e" /><stop offset="1" stopColor="#2b3742" />
            </linearGradient>
          </defs>
          {/* tripod */}
          <path d="M75 118 L44 174 M75 118 L106 174 M75 118 L75 168" stroke="#5a4632" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="75" cy="118" r="8" fill="#3b2f22" />
          {/* tube, on its mount, pointed up and to the right */}
          <g transform="rotate(-28 75 96)">
            <rect x="16" y="76" width="112" height="34" rx="15" fill="url(#scopetube)" />
            <rect x="112" y="72" width="26" height="42" rx="9" fill="#2b3742" />
            <circle cx="130" cy="93" r="15" fill="#0d1620" />
            <circle cx="127" cy="89" r="5" fill="rgba(180,215,240,.5)" />
            <rect x="10" y="82" width="16" height="22" rx="6" fill="#1f2830" />
            <rect x="44" y="70" width="10" height="46" rx="3" fill="rgba(255,255,255,.16)" />
            {/* the finder */}
            <rect x="58" y="58" width="40" height="12" rx="5" fill="#3d4a55" />
          </g>
        </svg>
      </div>
    </ObjectShell>
  );
}

/** What you see through it.
 *
 *  Rendered outside the camera on purpose: the board carries a transform, and a
 *  transformed ancestor becomes the containing block for anything positioned
 *  `fixed` inside it — the eyepiece would have been pinned to the slate and
 *  scaled with it instead of following the pointer across the screen. */
export function ScopeField({ boardSize }: { boardSize: { width: number; height: number } }) {
  const t = useUiText();
  const world = useWorld();
  const { tool, hold, boardRef, fireAnswer } = world;
  const held = tool === 'scope';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [found, setFound] = useState(() => readLocal<boolean>(FOUND_KEY, false));
  const [sighted, setSighted] = useState(false);

  useEffect(() => {
    if (!held) return undefined;
    const move = (event: PointerEvent) => { pointer.current = { x: event.clientX, y: event.clientY }; };
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') hold(null); };
    const dismiss = (event: PointerEvent) => {
      if (event.button === 0) hold(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('keydown', key);
    window.addEventListener('pointerdown', dismiss, true);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('keydown', key);
      window.removeEventListener('pointerdown', dismiss, true);
    };
  }, [held, hold]);

  useEffect(() => {
    if (!held) return undefined;
    return addFrame(() => {
      const board = boardRef.current;
      const canvas = canvasRef.current;
      const field = fieldRef.current;
      const ctx = canvas?.getContext('2d');
      if (!board || !canvas || !ctx || !field) return;

      field.style.transform = `translate(${pointer.current.x - FIELD / 2}px, ${pointer.current.y - FIELD / 2}px)`;

      const box = board.getBoundingClientRect();
      const k = box.width / (board.offsetWidth || 1) || 1;
      const bx = (pointer.current.x - box.left) / k;
      const by = (pointer.current.y - box.top) / k;
      const span = FIELD / (k * MAG);
      const rect = { x: bx - span / 2, y: by - span / 2, w: span, h: span };

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== FIELD * dpr) { canvas.width = FIELD * dpr; canvas.height = FIELD * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const offBoard = bx < -40 || by < -40 || bx > boardSize.width + 40 || by > boardSize.height + 40;
      if (offBoard) {
        drawStars(ctx, rect, { w: FIELD, h: FIELD });
        drawSaturn(ctx, rect, FIELD);
      } else {
        renderRegion(ctx, board, rect, { w: FIELD, h: FIELD });
      }

      // Chromatic edge and falloff: a cheap lens, which is the right kind.
      const fade = ctx.createRadialGradient(FIELD / 2, FIELD / 2, FIELD * 0.28, FIELD / 2, FIELD / 2, FIELD / 2);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(1, 'rgba(0,0,0,.55)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, FIELD, FIELD);

      const near = Math.hypot(bx - SATURN.x, by - SATURN.y) < SATURN.r * 1.6;
      setSighted(near);
      if (near && !found) {
        setFound(true);
        writeLocal(FOUND_KEY, true);
        fireAnswer();
      }
    });
  }, [boardSize.height, boardSize.width, boardRef, fireAnswer, found, held]);

  if (!held) return null;

  return (
    <div className="scopefield" ref={fieldRef} aria-hidden="true">
      <canvas ref={canvasRef} width={FIELD} height={FIELD} style={{ width: FIELD, height: FIELD }} />
      <span className="scopefield__cross" />
      <span className="scopefield__ring" />
      {sighted ? <span className="scopefield__note">{t('world.scope.saturn')}</span> : null}
    </div>
  );
}

/** A ringed planet, if the field happens to contain one. */
function drawSaturn(ctx: CanvasRenderingContext2D, rect: { x: number; y: number; w: number; h: number }, out: number) {
  const k = out / rect.w;
  const cx = (SATURN.x - rect.x) * k;
  const cy = (SATURN.y - rect.y) * k;
  const r = SATURN.r * k * 0.34;
  if (cx < -r * 4 || cy < -r * 4 || cx > out + r * 4 || cy > out + r * 4) return;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.34);

  // The far half of the rings passes behind the body, so they are drawn in
  // three passes: back, planet, front.
  const ring = (r0: number, r1: number, alpha: number, half: 'back' | 'front') => {
    ctx.save();
    ctx.beginPath();
    if (half === 'back') ctx.rect(-r * 6, -r * 6, r * 12, r * 6);
    else ctx.rect(-r * 6, 0, r * 12, r * 6);
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(0, 0, r * r1, r * r1 * 0.28, 0, 0, Math.PI * 2);
    ctx.ellipse(0, 0, r * r0, r * r0 * 0.28, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(226,206,168,${alpha})`;
    ctx.fill('evenodd');
    ctx.restore();
  };

  ring(1.42, 2.05, 0.5, 'back');
  ring(2.14, 2.42, 0.3, 'back');

  const body = ctx.createLinearGradient(-r, -r, r, r);
  body.addColorStop(0, '#f0dcae');
  body.addColorStop(0.45, '#d9bd85');
  body.addColorStop(0.72, '#a98a58');
  body.addColorStop(1, '#5d4a30');
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();
  // Bands.
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.22;
  for (let i = -3; i <= 3; i += 1) {
    ctx.fillStyle = i % 2 ? '#8a6f45' : '#f4e6c2';
    ctx.fillRect(-r, i * r * 0.24 - r * 0.06, r * 2, r * 0.13);
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  ring(1.42, 2.05, 0.72, 'front');
  ring(2.14, 2.42, 0.42, 'front');
  ctx.restore();
}
