// A camera, and photographs of the board it is standing on.
//
// Pick it up, point it at anything, and what comes out is a real picture of
// that rectangle of slate — the cards that were there, at the angle they were
// at, with whatever the simulations happened to be doing at that instant. It
// develops the way film develops: white, then a ghost, then the picture.

import { useCallback, useEffect, useRef } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { useUiText } from '../ui-text-context';

/** What the viewfinder takes in, in board units. */
export const SHOT = { w: 620, h: 470 };

export function PolaroidCamera() {
  const t = useUiText();
  const world = useWorld();
  const { tool, hold, boardRef, addPhoto } = world;
  const held = tool === 'camera';
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const shoot = useCallback((clientX: number, clientY: number) => {
    const board = boardRef.current;
    if (!board) return;
    const box = board.getBoundingClientRect();
    const k = box.width / (board.offsetWidth || 1) || 1;
    const cx = (clientX - box.left) / k;
    const cy = (clientY - box.top) / k;
    const rect = { x: cx - SHOT.w / 2, y: cy - SHOT.h / 2, w: SHOT.w, h: SHOT.h };
    // The print lands just under where the camera is standing, face down, and
    // gets on with developing.
    const at = world.placeRef.current.get('camera');
    addPhoto({
      id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
      x: (at?.x ?? cx) + 12 + Math.random() * 40,
      y: (at?.y ?? cy) + 116 + Math.random() * 40,
      rot: (Math.random() - 0.5) * 16,
      w: 190,
      h: 150,
      rect,
      at: Date.now(),
    });
    const body = bodyRef.current;
    if (body) {
      body.animate([
        { transform: 'translateY(0) scale(1)' },
        { transform: 'translateY(2px) scale(.985)', offset: 0.2 },
        { transform: 'translateY(0) scale(1)' },
      ], { duration: 260, easing: 'ease-out', fill: 'none' });
    }
  }, [addPhoto, boardRef, world.placeRef]);

  useEffect(() => {
    if (!held) return undefined;
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      if (target.closest('.toolbar-tool, .panel, .ownerbar, .toolbar')) return;
      event.preventDefault();
      event.stopPropagation();
      shoot(event.clientX, event.clientY);
      // A camera press arms one exposure. Dropping the tool after the shutter
      // prevents a second click from silently producing another print.
      hold(null);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') hold(null); };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [held, hold, shoot]);

  return (
    <ObjectShell
      id="camera"
      fixed={held}
      onActivate={() => hold('camera')}
      hint={held ? undefined : t('world.cam.hint')}
      label={t('world.cam.label')}
      className={held ? 'obj--cam-held' : ''}
    >
      <div className="cam" ref={bodyRef}>
        <svg viewBox="0 0 140 124" aria-hidden="true">
          <defs>
            <linearGradient id="cambody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#f3efe6" /><stop offset=".5" stopColor="#ddd7c9" />
              <stop offset=".51" stopColor="#2b3036" /><stop offset="1" stopColor="#171a1e" />
            </linearGradient>
          </defs>
          <rect x="8" y="14" width="124" height="92" rx="10" fill="url(#cambody)" />
          <rect x="8" y="60" width="124" height="10" rx="3" fill="#c1362f" />
          <rect x="8" y="70" width="124" height="4" fill="#3d6ea8" />
          <circle cx="70" cy="46" r="25" fill="#101418" />
          <circle cx="70" cy="46" r="18" fill="#1b2833" />
          <circle cx="70" cy="46" r="11" fill="#0a1016" />
          <circle cx="64" cy="40" r="4.5" fill="rgba(190,220,240,.55)" />
          <circle cx="112" cy="30" r="7" fill="#f0e6c8" />
          <rect x="20" y="24" width="18" height="12" rx="3" fill="#2a2f34" />
          <rect x="24" y="88" width="92" height="12" rx="3" fill="#0e1216" />
          <rect x="30" y="91" width="80" height="6" rx="2" fill="#f7f4ec" />
        </svg>
      </div>
    </ObjectShell>
  );
}
