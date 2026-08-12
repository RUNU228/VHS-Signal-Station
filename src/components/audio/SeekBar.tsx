import { formatTime } from "@/lib/utils/formatTime";

type SeekBarProps = {
  currentTime: number;
  duration: number;
  disabled: boolean;
  onSeek: (time: number) => void;
};

export function SeekBar({ currentTime, duration, disabled, onSeek }: SeekBarProps) {
  const maximum = Math.max(duration, 0);
  const value = Math.min(currentTime, maximum);
  const progress = maximum > 0 ? (value / maximum) * 100 : 0;
  return (
    <div className="seek-module">
      <div className="seek-readout">
        <span>CURRENT TIME</span>
        <strong>{formatTime(currentTime)}</strong>
        <span className="seek-readout__end">TOTAL TIME</span>
        <strong>{formatTime(duration)}</strong>
      </div>
      <div className="range-housing" style={{ "--range-value": `${progress}%` } as React.CSSProperties}>
        <input
          type="range"
          min={0}
          max={maximum}
          step={0.01}
          value={value}
          onChange={(event) => onSeek(Number(event.currentTarget.value))}
          disabled={disabled}
          aria-label="Playback position"
        />
      </div>
    </div>
  );
}
