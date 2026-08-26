// A passport, with a stamp for every country and a page behind every stamp.
//
// It is not a travel map. A map tells you where somebody has been; a passport
// makes you turn the leaves and find out. Every stamp opens a small card with a
// photograph and something written by hand, and every part of that — the
// countries, the ink, where the stamp sits, the words — is the owner's from
// inside the board.

import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ImageSlot } from '../ImageSlot';
import { ObjectShell } from './ObjectShell';
import { useWorld } from '../../../lib/world/context';
import { IMAGE_CONTENT_TYPES, IMAGE_INPUT_ACCEPT, mediaContentType } from '../../../lib/image-upload';
import {
  clampStampPosition,
  DEFAULT_STAMPS,
  PASSPORT_INKS,
  type PassportStamp,
} from '../../../lib/world/passport';
import { useUiText } from '../ui-text-context';

type StampPosition = { x: number; y: number };

type StampDrag = {
  id: string;
  shape: PassportStamp['shape'];
  rot: number;
  leaf: HTMLDivElement;
  element: HTMLButtonElement;
  pointerId: number;
  leafWidth: number;
  leafHeight: number;
  scale: number;
  startClientX: number;
  startClientY: number;
  startPosition: StampPosition;
  position: StampPosition;
  moved: boolean;
};

/** Read the linear part of an object's transform. The passport lives inside a
 * rotated/scaled desk object, so screen-space pointer movement needs to be
 * mapped back into the leaf before it can update x/y percentages. */
function transformLinearPart(value: string): { a: number; b: number; c: number; d: number } {
  const matrix = value.match(/^matrix\(([^)]+)\)$/)?.[1];
  if (matrix) {
    const [a, b, c, d] = matrix.split(',').map(Number);
    if ([a, b, c, d].every(Number.isFinite)) return { a, b, c, d };
  }
  const matrix3d = value.match(/^matrix3d\(([^)]+)\)$/)?.[1];
  if (matrix3d) {
    const values = matrix3d.split(',').map(Number);
    if (values.length === 16 && [values[0], values[1], values[4], values[5]].every(Number.isFinite)) {
      return { a: values[0], b: values[1], c: values[4], d: values[5] };
    }
  }
  return { a: 1, b: 0, c: 0, d: 1 };
}

function screenDeltaToLeaf(leaf: HTMLDivElement, dx: number, dy: number, scale: number): StampPosition {
  const object = leaf.closest<HTMLElement>('.obj');
  const matrix = object ? transformLinearPart(getComputedStyle(object).transform) : { a: 1, b: 0, c: 0, d: 1 };
  const screenX = dx / (scale || 1);
  const screenY = dy / (scale || 1);
  const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 0.0001) return { x: screenX, y: screenY };
  return {
    x: (matrix.d * screenX - matrix.c * screenY) / determinant,
    y: (-matrix.b * screenX + matrix.a * screenY) / determinant,
  };
}

export function Passport() {
  const t = useUiText();
  const world = useWorld();
  const { passport, savePassport, editing, upload } = world;
  const [open, setOpen] = useState(false);
  const [leaf, setLeaf] = useState(1);
  const [picked, setPicked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<(StampPosition & { id: string }) | null>(null);
  const dragRef = useRef<StampDrag | null>(null);
  const dragMoveHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const dragEndHandlerRef = useRef<((event: PointerEvent) => void) | null>(null);
  const stampClickRef = useRef<{ id: string; wasPicked: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const stamps = passport.length > 0 ? passport : DEFAULT_STAMPS;
  const pages = useMemo(() => Math.max(2, ...stamps.map((s) => s.page)), [stamps]);
  const onLeaf = useCallback((page: number) => stamps.filter((s) => s.page === page), [stamps]);
  const chosen = stamps.find((s) => s.id === picked) ?? null;

  const patch = useCallback((id: string, next: Partial<PassportStamp>) => {
    savePassport(stamps.map((s) => (s.id === id ? { ...s, ...next } : s)));
  }, [savePassport, stamps]);

  const onStampPointerMove = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    if (!drag.moved && Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) <= 3) return;
    drag.moved = true;
    suppressClickRef.current = true;
    const delta = screenDeltaToLeaf(drag.leaf, event.clientX - drag.startClientX, event.clientY - drag.startClientY, drag.scale);
    drag.position = clampStampPosition(
      drag.shape,
      drag.rot,
      drag.startPosition.x + (delta.x / drag.leafWidth) * 100,
      drag.startPosition.y + (delta.y / drag.leafHeight) * 100,
      drag.leafWidth,
      drag.leafHeight,
    );
    setDragPosition({ id: drag.id, ...drag.position });
  }, []);

  const onStampPointerUp = useCallback((event: PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.moved) {
      patch(drag.id, drag.position);
    } else if (event.type !== 'pointercancel') {
      const click = stampClickRef.current;
      setPicked(click?.id === drag.id && click.wasPicked ? null : drag.id);
      // A pointerdown can suppress the browser's follow-up click on some
      // touch implementations. Handle selection here and make a follow-up
      // click harmless when the browser still dispatches one.
      suppressClickRef.current = true;
    }
    const moveHandler = dragMoveHandlerRef.current;
    const endHandler = dragEndHandlerRef.current;
    if (moveHandler) window.removeEventListener('pointermove', moveHandler);
    if (endHandler) {
      window.removeEventListener('pointerup', endHandler);
      window.removeEventListener('pointercancel', endHandler);
    }
    dragMoveHandlerRef.current = null;
    dragEndHandlerRef.current = null;
    drag.element.releasePointerCapture?.(drag.pointerId);
    dragRef.current = null;
    setDragPosition(null);
  }, [patch]);

  const onStampPointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>, stamp: PassportStamp) => {
    if (!editing || event.button !== 0) return;
    const element = event.currentTarget;
    const leafElement = element.closest<HTMLDivElement>('.pass__leaf');
    if (!leafElement) return;
    const leafWidth = leafElement.offsetWidth;
    const leafHeight = leafElement.offsetHeight;
    if (!leafWidth || !leafHeight) return;
    const board = leafElement.closest<HTMLElement>('.desk__board');
    const boardScale = board
      ? board.getBoundingClientRect().width / (board.offsetWidth || 1)
      : leafElement.getBoundingClientRect().width / leafWidth;
    event.preventDefault();
    event.stopPropagation();
    stampClickRef.current = { id: stamp.id, wasPicked: picked === stamp.id };
    suppressClickRef.current = false;
    dragRef.current = {
      id: stamp.id,
      shape: stamp.shape,
      rot: stamp.rot,
      leaf: leafElement,
      element,
      pointerId: event.pointerId,
      leafWidth,
      leafHeight,
      scale: boardScale || 1,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPosition: { x: stamp.x, y: stamp.y },
      position: { x: stamp.x, y: stamp.y },
      moved: false,
    };
    setDragPosition({ id: stamp.id, x: stamp.x, y: stamp.y });
    dragMoveHandlerRef.current = onStampPointerMove;
    dragEndHandlerRef.current = onStampPointerUp;
    window.addEventListener('pointermove', onStampPointerMove);
    window.addEventListener('pointerup', onStampPointerUp);
    window.addEventListener('pointercancel', onStampPointerUp);
    element.setPointerCapture?.(event.pointerId);
  }, [editing, onStampPointerMove, onStampPointerUp, picked]);

  const onStampClick = useCallback((id: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      stampClickRef.current = null;
      return;
    }
    const click = stampClickRef.current;
    stampClickRef.current = null;
    setPicked(click?.id === id && click.wasPicked ? null : id);
  }, []);

  const addStamp = useCallback(() => {
    const made: PassportStamp = {
      id: `stamp-${Date.now().toString(36)}`,
      code: 'XX', place: '', year: '', page: leaf,
      x: 20 + Math.random() * 40, y: 18 + Math.random() * 44, rot: (Math.random() - 0.5) * 40,
      ink: 'violet', shape: 'round', note: '', city: '',
    };
    savePassport([...stamps, made]);
    setPicked(made.id);
  }, [leaf, savePassport, stamps]);

  const pickPhoto = useCallback((file: File) => {
    if (!chosen || busy) return;
    const mimeType = mediaContentType(file);
    if (!mimeType || !IMAGE_CONTENT_TYPES.has(mimeType)) {
      setUploadError(t('world.pass.invalidPhoto'));
      return;
    }
    setUploadError(null);
    setBusy(true);
    const done = (url: string) => { patch(chosen.id, { assetUrl: url }); setBusy(false); };
    if (upload) {
      upload(file).then(done).catch((reason: unknown) => {
        // Keep the friendly fallback for unknown failures, but preserve the
        // actionable validation/auth/storage message from the shared dashboard
        // uploader so an owner can fix the actual cause instead of retrying
        // blindly.
        const detail = reason instanceof Error ? reason.message.trim() : '';
        setUploadError(detail || t('world.pass.uploadFailed'));
        setBusy(false);
      });
      return;
    }
    // No bucket wired up: a data URL still shows the photograph, it simply
    // lives in this settings document rather than in storage.
    const reader = new FileReader();
    reader.onload = () => done(String(reader.result));
    reader.onerror = () => { setUploadError(t('world.pass.uploadFailed')); setBusy(false); };
    reader.readAsDataURL(file);
  }, [busy, chosen, patch, t, upload]);

  return (
    <ObjectShell
      id="passport"
      onActivate={() => setOpen((v) => !v)}
      hint={open ? undefined : t('world.pass.hint')}
      label={t('world.pass.label')}
      className={open ? 'obj--pass-open' : ''}
    >
      {open ? (
        <div className="pass pass--open" data-nodrag>
          <button className="pass__close" type="button" onClick={() => { setOpen(false); setPicked(null); }} aria-label={t('world.pass.close')}>×</button>
          <div className="pass__spread">
            {[leaf, leaf + 1].map((page) => (
              <div className="pass__leaf" key={page}>
                <span className="pass__watermark" aria-hidden="true">✦</span>
                <span className="pass__leafno">{page}</span>
                {onLeaf(page).map((stamp) => (
                  <button
                    key={stamp.id}
                    type="button"
                    className={`pstamp pstamp--${stamp.shape} pstamp--${stamp.ink}${picked === stamp.id ? ' is-open' : ''}${dragPosition?.id === stamp.id ? ' is-dragging' : ''}`}
                    data-nodrag
                    style={{
                      left: `${dragPosition?.id === stamp.id ? dragPosition.x : stamp.x}%`,
                      top: `${dragPosition?.id === stamp.id ? dragPosition.y : stamp.y}%`,
                      transform: `rotate(${stamp.rot}deg)`,
                    }}
                    onPointerDown={(event) => onStampPointerDown(event, stamp)}
                    onClick={() => onStampClick(stamp.id)}
                    title={stamp.place}
                  >
                    <span className="pstamp__code">{stamp.code}</span>
                    <span className="pstamp__place">{stamp.place}</span>
                    <span className="pstamp__year">{stamp.year}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="pass__bar">
            <button type="button" onClick={() => setLeaf((n) => Math.max(1, n - 2))} disabled={leaf <= 1}>‹</button>
            <span>{leaf}–{leaf + 1} / {pages}</span>
            <button type="button" onClick={() => setLeaf((n) => Math.min(pages, n + 2))} disabled={leaf + 1 >= pages}>›</button>
            {editing ? <button type="button" className="pass__add" onClick={addStamp}>+</button> : null}
            {editing ? <span className="pass__drag-hint">{t('world.pass.drag')}</span> : null}
          </div>

          {chosen ? (
            <div className="pass__card mat-paper">
              <button className="pass__cardclose" type="button" onClick={() => setPicked(null)} aria-label={t('world.pass.close')}>×</button>
              <div className="pass__photo">
                <ImageSlot
                  url={chosen.assetUrl}
                  alt={chosen.place}
                  placeholder={t('world.pass.dropPhoto')}
                  editable={editing}
                  busy={busy}
                  accept={IMAGE_INPUT_ACCEPT}
                  onPick={pickPhoto}
                />
                {uploadError ? <span className="pass__photo-error" role="alert">{uploadError}</span> : null}
              </div>
              {editing ? (
                <div className="pass__edit">
                  <div className="pass__row">
                    <input value={chosen.code} maxLength={3} onChange={(e) => patch(chosen.id, { code: e.target.value.toUpperCase() })} aria-label={t('world.pass.code')} />
                    <input value={chosen.place} onChange={(e) => patch(chosen.id, { place: e.target.value })} aria-label={t('world.pass.place')} />
                    <input value={chosen.year} maxLength={9} onChange={(e) => patch(chosen.id, { year: e.target.value })} aria-label={t('world.pass.year')} />
                  </div>
                  <div className="pass__row">
                    <input value={chosen.city ?? ''} placeholder={t('world.pass.city')} onChange={(e) => patch(chosen.id, { city: e.target.value })} aria-label={t('world.pass.city')} />
                    <select value={chosen.shape} onChange={(e) => patch(chosen.id, { shape: e.target.value as PassportStamp['shape'] })} aria-label={t('world.pass.shape')}>
                      {['round', 'rect', 'oval', 'shield'].map((shape) => <option key={shape} value={shape}>{t(`world.pass.shape.${shape}`)}</option>)}
                    </select>
                  </div>
                  <div className="pass__ink-field">
                    <span className="pass__field-label">{t('world.pass.ink')}</span>
                    <div className="pass__ink-picker" role="group" aria-label={t('world.pass.ink')}>
                      {PASSPORT_INKS.map((ink) => (
                        <button
                          key={ink.id}
                          type="button"
                          className={`pass__ink${chosen.ink === ink.id ? ' is-selected' : ''}`}
                          style={{ backgroundColor: ink.hex }}
                          aria-label={t(`world.pass.ink.${ink.id}`)}
                          aria-pressed={chosen.ink === ink.id}
                          title={t(`world.pass.ink.${ink.id}`)}
                          onClick={() => patch(chosen.id, { ink: ink.id })}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="pass__row pass__row--placement">
                    <label>{t('world.pass.page')}<input type="number" min={1} value={chosen.page} onChange={(e) => patch(chosen.id, { page: Math.max(1, Number(e.target.value) || 1) })} /></label>
                    <label>{t('world.pass.rotation')}<input type="number" value={Math.round(chosen.rot)} onChange={(e) => patch(chosen.id, { rot: Number(e.target.value) })} /></label>
                    <span className="pass__placement-note">{t('world.pass.drag')}</span>
                  </div>
                  <textarea
                    value={chosen.note ?? ''}
                    rows={4}
                    placeholder={t('world.pass.note')}
                    onChange={(e) => patch(chosen.id, { note: e.target.value })}
                  />
                  <button className="pass__del" type="button" onClick={() => { savePassport(stamps.filter((s) => s.id !== chosen.id)); setPicked(null); }}>
                    {t('world.pass.remove')}
                  </button>
                </div>
              ) : (
                <div className="pass__read">
                  <h5>{chosen.place || chosen.code}</h5>
                  <p className="pass__meta">{[chosen.city, chosen.year].filter(Boolean).join(' · ')}</p>
                  {chosen.note ? <p className="pass__note">{chosen.note}</p> : <p className="pass__note pass__note--empty">—</p>}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="pass pass--shut">
          <span className="pass__crest" aria-hidden="true">
            <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="15" /><path d="M20 7v26M7 20h26M11 11l18 18M29 11L11 29" /></svg>
          </span>
          <span className="pass__word">PASAPORTE</span>
          <span className="pass__word pass__word--2">PASSPORT</span>
          <span className="pass__chip" aria-hidden="true" />
          <span className="pass__edge" aria-hidden="true" />
        </div>
      )}
    </ObjectShell>
  );
}
