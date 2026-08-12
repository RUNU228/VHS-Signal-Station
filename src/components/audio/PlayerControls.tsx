type PlayerControlsProps = {
  disabled: boolean;
  isPlaying: boolean;
  onPrevious: () => void;
  onToggle: () => void;
  onNext: () => void;
};

export function PlayerControls({
  disabled,
  isPlaying,
  onPrevious,
  onToggle,
  onNext,
}: PlayerControlsProps) {
  return (
    <div className="transport-controls" aria-label="Playback controls">
      <button
        type="button"
        className="hardware-button"
        aria-label="Previous track"
        onClick={onPrevious}
        disabled={disabled}
      >
        <span aria-hidden="true">◀│</span>
        PREVIOUS
      </button>
      <button
        type="button"
        className="hardware-button hardware-button--primary"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={onToggle}
        disabled={disabled}
      >
        <span className="transport-symbol" aria-hidden="true">
          {isPlaying ? "Ⅱ" : "▶"}
        </span>
        {isPlaying ? "PAUSE" : "PLAY"}
      </button>
      <button
        type="button"
        className="hardware-button"
        aria-label="Next track"
        onClick={onNext}
        disabled={disabled}
      >
        <span aria-hidden="true">│▶</span>
        NEXT
      </button>
    </div>
  );
}
