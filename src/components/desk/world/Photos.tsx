// The prints, once they are out of the camera.
//
// Each one draws itself once, from the rectangle of board it caught, and then
// it is a piece of paper: it can be picked up, moved, left on top of something
// else, and shot at.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorld } from '../../../lib/world/context';
import { renderRegion } from '../../../lib/world/capture';
import { useUiText } from '../ui-text-context';
import { SplatMark } from './SplatMarks';

export function Photos() {
  const { photos } = useWorld();
  if (photos.length === 0) return null;
  return <>{photos.map((photo) => <Print key={photo.id} id={photo.id} />)}</>;
}

function Print({ id }: { id: string }) {
  const t = useUiText();
  const world = useWorld();
  const { photos, boardRef, dropPhoto, bump, scale, splats, reduced } = world;
  const photo = photos.find((p) => p.id === id);
  const ref = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [developed, setDeveloped] = useState(reduced ? 1 : 0);

  // One draw, at the instant the shutter fired. Late is better than never here:
  // a frame's delay lets the print land before the board is read.
  useEffect(() => {
    if (!photo) return undefined;
    const timer = window.setTimeout(() => {
      const board = boardRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!board || !canvas || !ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = photo.w - 18;
      const h = photo.h - 34;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderRegion(ctx, board, photo.rect, { w, h });
    }, 30);
    return () => window.clearTimeout(timer);
  }, [boardRef, photo]);

  useEffect(() => {
    if (reduced) return undefined;
    const started = performance.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (performance.now() - started) / 4200);
      setDeveloped(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const el = ref.current;
    if (!el || !photo) return;
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    event.stopPropagation();
    const start = { x: event.clientX, y: event.clientY };
    const from = { x: parseFloat(el.style.left || '0'), y: parseFloat(el.style.top || '0') };
    bump(el);
    const move = (ev: PointerEvent) => {
      const k = 1 / (scale() || 1);
      el.style.left = `${from.x + (ev.clientX - start.x) * k}px`;
      el.style.top = `${from.y + (ev.clientY - start.y) * k}px`;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }, [bump, photo, scale]);

  if (!photo) return null;
  const mine = splats.filter((s) => s.on === photo.id && s.layer === 'object');

  return (
    <div
      ref={ref}
      className="print"
      data-obj={photo.id}
      data-nodrag
      data-rot={photo.rot}
      style={{
        left: photo.x, top: photo.y, width: photo.w, height: photo.h,
        transform: `rotate(${photo.rot}deg)`, zIndex: 620,
      }}
      onPointerDown={onPointerDown}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <div className="print__frame">
        <div className="print__window">
          <canvas ref={canvasRef} style={{ width: photo.w - 18, height: photo.h - 34, opacity: developed }} />
          {/* The chemistry: white, then a cyan ghost, then the picture. */}
          <span
            className="print__develop"
            style={{ opacity: 1 - developed, background: developed < 0.4 ? '#f6f4ee' : 'rgba(120,170,190,.5)' }}
            aria-hidden="true"
          />
        </div>
        <span className="print__cap">{new Date(photo.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <button className="print__x" type="button" onClick={() => dropPhoto(photo.id)} aria-label={t('world.cam.discard')}>×</button>
      {mine.length > 0 ? <div className="obj__paint">{mine.map((splat) => <SplatMark key={splat.id} splat={splat} />)}</div> : null}
    </div>
  );
}
