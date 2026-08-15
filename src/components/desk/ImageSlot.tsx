import { useRef, useState, type DragEvent } from 'react';
import { useUiText } from './ui-text-context';

type ImageSlotProps = {
  url?: string;
  alt?: string;
  placeholder?: string;
  editable?: boolean;
  busy?: boolean;
  onPick?: (file: File) => void;
};

/** A fillable photo frame. Owner can click or drop an image; the parent
 * uploads it to Neon Object Storage and persists the resulting URL. */
export function ImageSlot({ url, alt, placeholder, editable = false, busy = false, onPick }: ImageSlotProps) {
  const t = useUiText();
  const slotText = placeholder ?? t('card.dropPhoto');
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file && onPick) onPick(file);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setOver(false);
    if (editable) handleFiles(event.dataTransfer.files);
  }

  return (
    <div
      className={`slot${url ? ' slot--filled' : ''}${editable ? ' slot--editable' : ''}`}
      {...(editable ? { 'data-nodrag': '' } : {})}
      style={over ? { outlineColor: 'var(--c-signal)' } : undefined}
      onClick={editable ? () => inputRef.current?.click() : undefined}
      onDragOver={editable ? (event) => { event.preventDefault(); setOver(true); } : undefined}
      onDragLeave={editable ? () => setOver(false) : undefined}
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
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(event) => { handleFiles(event.target.files); event.target.value = ''; }}
        />
      ) : null}
    </div>
  );
}
