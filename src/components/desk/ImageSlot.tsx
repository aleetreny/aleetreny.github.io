import { useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { isVideoMedia, MEDIA_INPUT_ACCEPT } from '../../lib/image-upload';
import { useUiText } from './ui-text-context';

type ImageSlotProps = {
  url?: string;
  mediaType?: string;
  alt?: string;
  placeholder?: string;
  editable?: boolean;
  busy?: boolean;
  onPick?: (file: File) => void | Promise<void>;
};

/** A fillable media frame. Owner can click or drop a photo or video; the
 * parent uploads the original file to Neon Object Storage and persists its URL. */
export function ImageSlot({ url, mediaType, alt, placeholder, editable = false, busy = false, onPick }: ImageSlotProps) {
  const t = useUiText();
  const slotText = placeholder ?? t('card.dropMedia');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);

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
    if (event.target === inputRef.current) return;
    openPicker();
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
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={editable ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openPicker(); } } : undefined}
      aria-busy={busy || undefined}
      aria-label={editable ? t('card.changeMedia', { placeholder: slotText }) : (alt || slotText)}
    >
      {url ? (isVideoMedia(mediaType, url)
        ? <video src={url} controls playsInline preload="metadata" aria-label={alt || slotText} />
        : <img src={url} alt={alt ?? ''} />
      ) : <span className="slot__ph">{slotText}</span>}
      {busy ? <span className="slot__busy" aria-hidden="true" /> : null}
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
