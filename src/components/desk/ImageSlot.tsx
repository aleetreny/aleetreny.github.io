import { useRef, useState, type CSSProperties, type DragEvent, type MouseEvent, type PointerEvent } from 'react';
import { isVideoMedia, MEDIA_INPUT_ACCEPT } from '../../lib/image-upload';
import type { MediaFrame } from '../../lib/board';
import { useUiText } from './ui-text-context';

type ImageSlotProps = {
  url?: string;
  mediaType?: string;
  alt?: string;
  placeholder?: string;
  editable?: boolean;
  busy?: boolean;
  onPick?: (file: File) => void | Promise<void>;
  /** Optional because dossier media keeps its natural size. Board photos pass
   * this in to expose a non-destructive crop/reframe control. */
  frame?: MediaFrame;
  onFrameChange?: (frame: MediaFrame | undefined) => void;
};

/** A fillable media frame. Owner can click or drop a photo or video; the
 * parent uploads the original file to Neon Object Storage and persists its URL. */
const FRAME_MIN_SCALE = 1;
const FRAME_MAX_SCALE = 2.5;
const FRAME_STEP = 5;

function bounded(value: number | undefined, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function resolvedFrame(frame: MediaFrame | undefined): Required<MediaFrame> {
  return {
    x: bounded(frame?.x, 50, 0, 100),
    y: bounded(frame?.y, 50, 0, 100),
    scale: bounded(frame?.scale, 1, FRAME_MIN_SCALE, FRAME_MAX_SCALE),
  };
}

export function ImageSlot({ url, mediaType, alt, placeholder, editable = false, busy = false, onPick, frame, onFrameChange }: ImageSlotProps) {
  const t = useUiText();
  const slotText = placeholder ?? t('card.dropMedia');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);
  const [framing, setFraming] = useState(false);
  // Dragging should feel immediate, but it must not generate a database write
  // for every pointer-move event. This preview is committed on pointer-up.
  const [previewFrame, setPreviewFrame] = useState<{ url: string; frame: MediaFrame | undefined } | null>(null);
  const video = isVideoMedia(mediaType, url);
  const canFrame = Boolean(editable && url && !video && onFrameChange);
  const hasPreviewFrame = Boolean(url && previewFrame?.url === url);
  const visibleFrame = hasPreviewFrame ? previewFrame?.frame : frame;
  const currentFrame = resolvedFrame(visibleFrame);
  const frameStyle: CSSProperties | undefined = visibleFrame
    ? {
      objectPosition: `${currentFrame.x}% ${currentFrame.y}%`,
      transform: `scale(${currentFrame.scale})`,
      transformOrigin: `${currentFrame.x}% ${currentFrame.y}%`,
    }
    : undefined;

  function handleFiles(files: FileList | null) {
    const file = files ? Array.from(files)[0] : undefined;
    if (file && onPick) void onPick(file);
  }

  function isFileDrag(event: DragEvent) {
    return Array.from(event.dataTransfer.types).includes('Files')
      || Array.from(event.dataTransfer.items).some((item) => item.kind === 'file');
  }

  function openPicker() {
    if (!busy) inputRef.current?.click();
  }

  function onSlotClick(event: MouseEvent<HTMLDivElement>) {
    // Calling click() on the hidden input dispatches another click event. Keep
    // that event from re-entering the slot handler, which could cancel the
    // native file sheet instead of opening it.
    if (event.target === inputRef.current || framing || (event.target as HTMLElement).closest('[data-slot-control]')) return;
    openPicker();
  }

  function updateFrame(patch: Partial<MediaFrame>) {
    if (!onFrameChange) return;
    const next = { ...currentFrame, ...patch };
    setPreviewFrame({ url: url ?? '', frame: next });
    onFrameChange(next);
  }

  function nudgeFrame(x: number, y: number) {
    // `object-position` moves in the opposite direction to the pixels on
    // screen: a larger focal point shifts the rendered photo left.
    updateFrame({ x: bounded(currentFrame.x - x, 50, 0, 100), y: bounded(currentFrame.y - y, 50, 0, 100) });
  }

  function startFrameDrag(event: PointerEvent<HTMLDivElement>) {
    if (!framing || !canFrame || event.button !== 0 || (event.target as HTMLElement).closest('[data-slot-control]')) return;
    event.preventDefault();
    event.stopPropagation();
    const box = event.currentTarget.getBoundingClientRect();
    const start = currentFrame;
    const startX = event.clientX;
    const startY = event.clientY;
    let latest = start;
    let changed = false;
    const move = (next: globalThis.PointerEvent) => {
      // Moving the photo right should reveal what was on its left, hence the
      // inverse relationship between pointer movement and object-position.
      const x = bounded(start.x - ((next.clientX - startX) / box.width) * 100 / start.scale, 50, 0, 100);
      const y = bounded(start.y - ((next.clientY - startY) / box.height) * 100 / start.scale, 50, 0, 100);
      latest = { ...start, x, y };
      changed = changed || latest.x !== start.x || latest.y !== start.y;
      setPreviewFrame({ url: url ?? '', frame: latest });
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (changed) onFrameChange?.(latest);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  }

  function onDragEnter(event: DragEvent) {
    if (!editable || !isFileDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current += 1;
    setOver(true);
  }

  function onDragOver(event: DragEvent) {
    if (!editable || !isFileDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    setOver(true);
  }

  function onDragLeave(event: DragEvent) {
    if (!editable || !isFileDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setOver(false);
  }

  function onDrop(event: DragEvent) {
    if (!editable) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepth.current = 0;
    setOver(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div
      className={`slot${url ? ' slot--filled' : ''}${editable ? ' slot--editable' : ''}${over ? ' slot--dragover' : ''}`}
      {...(editable ? { 'data-nodrag': '' } : {})}
      onClick={editable ? onSlotClick : undefined}
      onDragEnter={editable ? onDragEnter : undefined}
      onDragOver={editable ? onDragOver : undefined}
      onDragLeave={editable ? onDragLeave : undefined}
      onDrop={editable ? onDrop : undefined}
      onPointerDown={canFrame ? startFrameDrag : undefined}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={editable ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPicker(); } } : undefined}
      aria-busy={busy || undefined}
      aria-label={editable ? t('card.changeMedia', { placeholder: slotText }) : (alt || slotText)}
    >
      {url ? (video
        ? <video src={url} controls playsInline preload="metadata" aria-label={alt || slotText} />
        : <img className={framing ? 'slot__media--framing' : undefined} src={url} alt={alt ?? ''} style={frameStyle} draggable={false} />
      ) : <span className="slot__ph">{slotText}</span>}
      {busy ? <span className="slot__busy" aria-hidden="true" /> : null}
      {canFrame ? (
        <>
          <button
            className="slot__frame-toggle"
            type="button"
            data-slot-control
            data-nodrag
            onClick={() => setFraming((open) => !open)}
            aria-expanded={framing}
            aria-label={t('card.reframeImage')}
          >⌗ <span>{t('card.reframe')}</span></button>
          {framing ? (
            <div className="slot__frame-controls" data-slot-control data-nodrag role="group" aria-label={t('card.reframeImage')}>
              <label>
                <span>{t('card.frameZoom')}</span>
                <input
                  type="range"
                  min={FRAME_MIN_SCALE}
                  max={FRAME_MAX_SCALE}
                  step="0.05"
                  value={currentFrame.scale}
                  onChange={(event) => updateFrame({ scale: Number(event.target.value) })}
                  aria-label={t('card.frameZoom')}
                />
              </label>
              <div className="slot__frame-move">
                <span>{t('card.frameMove')}</span>
                <div>
                  <button type="button" onClick={() => nudgeFrame(0, -FRAME_STEP)} aria-label={t('card.frameUp')}>↑</button>
                  <button type="button" onClick={() => nudgeFrame(-FRAME_STEP, 0)} aria-label={t('card.frameLeft')}>←</button>
                  <button type="button" onClick={() => nudgeFrame(FRAME_STEP, 0)} aria-label={t('card.frameRight')}>→</button>
                  <button type="button" onClick={() => nudgeFrame(0, FRAME_STEP)} aria-label={t('card.frameDown')}>↓</button>
                </div>
              </div>
              <button type="button" className="slot__frame-reset" onClick={() => { setPreviewFrame({ url: url ?? '', frame: undefined }); onFrameChange?.(undefined); }}>{t('card.frameReset')}</button>
            </div>
          ) : null}
        </>
      ) : null}
      {editable ? (
        <input
          ref={inputRef}
          type="file"
          accept={MEDIA_INPUT_ACCEPT}
          style={{ display: 'none' }}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => { handleFiles(event.target.files); event.target.value = ''; }}
        />
      ) : null}
    </div>
  );
}
