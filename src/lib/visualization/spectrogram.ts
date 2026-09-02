import { signalColorForLevel } from "./signalTheme";

export const SPECTROGRAM_COLUMNS = 72;
export const SPECTROGRAM_ROWS = 34;

const COLUMN_AGES = Array.from({ length: SPECTROGRAM_COLUMNS },
  (_, column) => 0.42 + (column / SPECTROGRAM_COLUMNS) * 0.58);

// Byte amplitudes and history ages have a finite domain. Cache exact colors,
// on demand, for the lifetime of one renderer (at most 72 * 256 strings).
export function createSpectrogramColors(): (amplitude: number, column: number) => string {
  const colors: Array<string | undefined> = new Array(SPECTROGRAM_COLUMNS * 256);
  return (amplitude, column) => {
    const key = column * 256 + amplitude;
    const energy = amplitude / 255;
    return colors[key] ??= signalColorForLevel(energy, Math.max(0.08, energy * COLUMN_AGES[column]));
  };
}
