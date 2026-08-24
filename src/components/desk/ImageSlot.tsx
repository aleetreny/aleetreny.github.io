import { useRef, useState, type DragEvent } from 'react';
import { IMAGE_INPUT_ACCEPT, isSupportedImageFile } from '../../lib/image-upload';
import { useUiText } from './ui-text-context';

type ImageSlotProps = {
  url?: string;
  alt?: string;
  placeholder?: string;
  editable?: boolean;
  busy?: boolean;
  onPick?: (file: File) => void | Promise<void>;
};

/** A fillable photo frame. Owner can click or drop an image; the parent
 * uploads it to Neon Object Storage and persists the resulting URL. */
export function ImageSlot({ url, alt, placeholder, editable = false, busy = false, onPick }: ImageSlotProps) {
  const t = useUiText();
  const slotText = placeholder ?? t('card.dropPhoto');
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [over, setOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files ? Array.from(files).find(isSupportedImageFile) : undefined;
    if (file && onPick) onPick(file);
  }

  function isFileDrag(event: DragEvent) {
    return Array.from(event.dataTransfer.types).includes('Files');
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
      onClick={editable ? () => inputRef.current?.click() : undefined}
      onDragEnter={editable ? onDragEnter : undefined}
      onDragOver={editable ? onDragOver : undefined}
      onDragLeave={editable ? onDragLeave : undefined}
      onDrop={editable ? onDrop : undefined}
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onKeyDown={editable ? (event) => { if (event.key === 'Enter') inputRef.current?.click(); } : undefined}
      aria-label={editable ? t('card.changePhoto', { placeholder: slotText }) : (alt || slotText)}
    >
      {url ? <img src={url} alt={alt ?? ''} /> : <span className="slot__ph">{slotText}</span>}
      {busy ? <span className="slot__busy" aria-hidden="true" /> : null}
      {editable ? (
        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_INPUT_ACCEPT}
          style={{ display: 'none' }}
          onChange={(event) => { handleFiles(event.target.files); event.target.value = ''; }}
        />
      ) : null}
    </div>
  );
}
