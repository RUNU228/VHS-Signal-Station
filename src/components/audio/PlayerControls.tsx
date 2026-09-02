import { useLanguage } from "@/components/LanguageProvider";
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
  const { t } = useLanguage();
  return (
    <div className="transport-controls" aria-label={t.player.controls}>
      <button
        type="button"
        className="hardware-button"
        aria-label={t.player.previousLabel}
        onClick={onPrevious}
        disabled={disabled}
      >
        <span aria-hidden="true">◀│</span>
        {t.player.previous}
      </button>
      <button
        type="button"
        className="hardware-button hardware-button--primary"
        aria-label={isPlaying ? t.player.pauseLabel : t.player.playLabel}
        onClick={onToggle}
        disabled={disabled}
      >
        <span className="transport-symbol" aria-hidden="true">
          {isPlaying ? "Ⅱ" : "▶"}
        </span>
        {isPlaying ? t.player.pause : t.player.play}
      </button>
      <button
        type="button"
        className="hardware-button"
        aria-label={t.player.nextLabel}
        onClick={onNext}
        disabled={disabled}
      >
        <span aria-hidden="true">│▶</span>
        {t.player.nextButton}
      </button>
    </div>
  );
}
