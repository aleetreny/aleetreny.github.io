// A paint gun lying on the board, and what happens when you pick it up.
//
// Picking it up is the whole trick: the object stops being furniture, the
// cursor becomes a sight, and every other thing on the board becomes something
// that can be hit. Where a shot lands decides what it lands *on* — bare slate
// goes under the paper, a card goes over it, and an object carries its own
// stains around with it for as long as it is on the desk.

import { useCallback, useEffect } from 'react';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { PAINT_COLORS, makeSplat, paintHex } from '../../../lib/world/splats';
import { OBJECT_SPECS, type ObjectKind } from '../../../lib/world/kinds';
import { useUiText } from '../ui-text-context';

export function PaintGun() {
  const t = useUiText();
  const world = useWorld();
  const { tool, hold, paintColor, setPaintColor, addSplat, boardRef } = world;
  const held = tool === 'paint';

  const shootAt = useCallback((clientX: number, clientY: number) => {
    const board = boardRef.current;
    if (!board) return;
    const box = board.getBoundingClientRect();
    const k = box.width / (board.offsetWidth || 1) || 1;
    const x = (clientX - box.left) / k;
    const y = (clientY - box.top) / k;

    // What is under the sight, in the order the eye sees it.
    const stack = document.elementsFromPoint(clientX, clientY) as HTMLElement[];
    const object = stack.find((el) => el.dataset?.obj) as HTMLElement | undefined;
    const card = stack.find((el) => el.dataset?.card) as HTMLElement | undefined;
    const angle = Math.random() * Math.PI * 2;

    if (object?.dataset.obj) {
      const id = object.dataset.obj as ObjectKind;
      const at = world.placeRef.current.get(id);
      const spec = OBJECT_SPECS[id];
      if (at && spec) {
        // Into the object's own frame, so the stain travels with it.
        const rad = (-at.rot * Math.PI) / 180;
        const dx = x - (at.x + (spec.w * at.scale) / 2);
        const dy = y - (at.y + (spec.h * at.scale) / 2);
        const lx = (dx * Math.cos(rad) - dy * Math.sin(rad)) / at.scale + spec.w / 2;
        const ly = (dx * Math.sin(rad) + dy * Math.cos(rad)) / at.scale + spec.h / 2;
        addSplat(makeSplat({ x: lx, y: ly, color: paintColor, on: id, layer: 'object', angle, scale: 0.72 }));
        return;
      }
    }
    addSplat(makeSplat({
      x, y, color: paintColor, on: card?.dataset.card ?? '', layer: card ? 'paper' : 'slate', angle,
    }));
  }, [addSplat, boardRef, paintColor, world.placeRef]);

  useEffect(() => {
    if (!held) return undefined;
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const target = event.target as HTMLElement;
      // The gun's own bar of swatches is not part of the board.
      if (target.closest('.toolbar-tool, .panel, .ownerbar, .toolbar')) return;
      event.preventDefault();
      event.stopPropagation();
      shootAt(event.clientX, event.clientY);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { hold(null); return; }
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const index = PAINT_COLORS.findIndex((c) => c.id === paintColor);
      const step = event.key === 'ArrowRight' ? 1 : -1;
      setPaintColor(PAINT_COLORS[(index + step + PAINT_COLORS.length) % PAINT_COLORS.length].id);
    };
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
    };
  }, [held, hold, paintColor, setPaintColor, shootAt]);

  return (
    <ObjectShell
      id="paintgun"
      fixed={held}
      onActivate={() => hold('paint')}
      hint={held ? undefined : t('world.gun.hint')}
      label={t('world.gun.label')}
      className={held ? 'obj--gun-held' : ''}
    >
      <div className="gun" style={{ '--paint': paintHex(paintColor) } as React.CSSProperties}>
        <svg viewBox="0 0 150 96" aria-hidden="true">
          <defs>
            <linearGradient id="gunbody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#cfd4d2" /><stop offset=".45" stopColor="#7f8785" />
              <stop offset=".62" stopColor="#aeb5b2" /><stop offset="1" stopColor="#5c6462" />
            </linearGradient>
          </defs>
          {/* barrel, body, grip, trigger — a spray gun, not a pistol */}
          <rect x="6" y="30" width="52" height="13" rx="4" fill="url(#gunbody)" />
          <rect x="2" y="32" width="8" height="9" rx="2" fill="#3d4442" />
          <path d="M52 22h44a10 10 0 0 1 10 10v22a10 10 0 0 1-10 10H60z" fill="url(#gunbody)" />
          <path d="M74 62l-8 30h18l10-30z" fill="#4c5452" />
          <path d="M62 60c0 8 4 12 10 12" fill="none" stroke="#2f3634" strokeWidth="4" strokeLinecap="round" />
          {/* the cup of paint on top, in whatever colour is loaded */}
          <path d="M84 6h26a4 4 0 0 1 4 4v14H80V10a4 4 0 0 1 4-4z" fill="var(--paint)" />
          <rect x="80" y="22" width="34" height="5" rx="2" fill="#33393a" />
          <ellipse cx="97" cy="7" rx="15" ry="4" fill="rgba(255,255,255,.35)" />
          <circle cx="112" cy="46" r="4" fill="#2f3634" />
        </svg>
        {held ? <span className="gun__lifted" aria-hidden="true" /> : null}
      </div>
    </ObjectShell>
  );
}
