import { useEffect, useId, useRef, type KeyboardEvent, type PointerEvent } from 'react';

type ConfirmDialogProps = {
  busy?: boolean;
  confirmLabel: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  tone?: 'default' | 'danger';
};

export function ConfirmDialog({
  busy = false,
  confirmLabel,
  description,
  onCancel,
  onConfirm,
  title,
  tone = 'default',
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    cancelRef.current?.focus();
    return () => returnFocusRef.current?.focus();
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && !busy) {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== 'Tab') return;

    const first = cancelRef.current;
    const last = confirmRef.current;
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleBackdrop(event: PointerEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && !busy) onCancel();
  }

  return (
    <div
      className="confirm-dialog__backdrop"
      onKeyDown={handleKeyDown}
      onPointerDown={handleBackdrop}
      role="presentation"
    >
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="confirm-dialog"
        role="dialog"
      >
        <p className="eyebrow">Confirmación</p>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="confirm-dialog__actions">
          <button
            className="button button--secondary"
            disabled={busy}
            onClick={onCancel}
            ref={cancelRef}
            type="button"
          >
            Cancelar
          </button>
          <button
            className={tone === 'danger' ? 'button button--danger-filled' : 'button'}
            disabled={busy}
            onClick={onConfirm}
            ref={confirmRef}
            type="button"
          >
            {busy ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
