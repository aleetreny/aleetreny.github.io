import type { TourConfig } from '../../lib/tour';

type TourBarProps = {
  tour: TourConfig;
  /** 1-based; 0 while the slate is still arriving. */
  step: number;
  total: number;
  label: string;
  /** False while the camera is flying or items are landing. */
  waiting: boolean;
  paused: boolean;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onJump: (index: number) => void;
  onTogglePause: () => void;
};

/** The bar that replaces the board toolbar while the tour is running.
 *  Same shell as `.toolbar`, so a theme change restyles both. */
export function TourBar({
  tour, step, total, label, waiting, paused, onNext, onBack, onSkip, onJump, onTogglePause,
}: TourBarProps) {
  if (!tour.bar.show) return null;
  const last = step >= total;
  const shown = Math.max(1, step);
  // The controls are hidden rather than unmounted so the bar does not reflow
  // (and the visitor's pointer does not land on a different button) mid-flight.
  const hide = (visible: boolean) => ({ visibility: visible ? undefined : ('hidden' as const) });

  return (
    <div className={`tourbar tourbar--${tour.bar.position}`}>
      <div className="tourbar__inner">
        {/* Two rows on a phone: the heading needs the full width, and the
            controls need tap targets rather than what is left over. */}
        <div className="tourbar__head">
          {tour.bar.counter ? <span className="tourbar__step">stop {shown} / {total}</span> : null}
          {tour.bar.label ? <span className="tourbar__label">{label}</span> : null}
        </div>
        <div className="tourbar__row">
          {tour.advance === 'auto' ? (
            <button
              className="tbtn tbtn--icon"
              type="button"
              onClick={onTogglePause}
              aria-label={paused ? 'Resume the tour' : 'Pause the tour'}
            >
              {paused ? '▶' : '❚❚'}
            </button>
          ) : null}
          <button className="tbtn" type="button" style={hide(waiting && step > 1)} onClick={onBack}>
            {tour.bar.backLabel}
          </button>
          <button className="tbtn tbtn--on tourbar__next" type="button" style={hide(waiting)} onClick={onNext}>
            {last ? tour.bar.finishLabel : tour.bar.nextLabel}
          </button>
          <button className="tourbar__skip" type="button" onClick={onSkip}>{tour.bar.skipLabel}</button>
        </div>

        {tour.bar.progress || tour.bar.dots || tour.bar.hint ? (
          <div className="tourbar__row tourbar__row--foot">
            {tour.bar.dots ? (
              <div className="tourbar__dots">
                {Array.from({ length: total }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`tourbar__dot ${index < step ? 'is-done' : ''} ${index === step - 1 ? 'is-here' : ''}`}
                    onClick={() => onJump(index)}
                    aria-label={`Go to stop ${index + 1}`}
                    aria-current={index === step - 1 ? 'step' : undefined}
                  />
                ))}
              </div>
            ) : null}
            {tour.bar.progress ? (
              <div className="tourbar__track">
                <div className="tourbar__fill" style={{ width: `${Math.round((step / Math.max(1, total)) * 100)}%` }} />
              </div>
            ) : null}
            {tour.bar.hint ? <span className="tourbar__hint">{tour.bar.hint}</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
