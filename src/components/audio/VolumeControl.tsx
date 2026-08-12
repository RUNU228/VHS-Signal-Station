type VolumeControlProps = {
  volume: number;
  muted: boolean;
  disabled: boolean;
  onVolume: (volume: number) => void;
  onMute: () => void;
};

export function VolumeControl({
  volume,
  muted,
  disabled,
  onVolume,
  onMute,
}: VolumeControlProps) {
  const percentage = Math.round(volume * 100);
  return (
    <div className="volume-module">
      <div className="volume-readout">
        <span>OUTPUT LEVEL</span>
        <strong>{muted ? "MUTED" : `${percentage}%`}</strong>
      </div>
      <div className="range-housing" style={{ "--range-value": `${percentage}%` } as React.CSSProperties}>
        <input
          type="range"
          min={0}
          max={100}
          value={percentage}
          onChange={(event) => onVolume(Number(event.currentTarget.value) / 100)}
          disabled={disabled}
          aria-label="Output level"
        />
      </div>
      <button
        type="button"
        className="mute-button"
        onClick={onMute}
        disabled={disabled}
        aria-label={muted ? "Unmute output" : "Mute output"}
        aria-pressed={muted}
      >
        MUTE
      </button>
    </div>
  );
}
