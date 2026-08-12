export const SPECTRUM_MIN_FREQUENCY = 100;
export const SPECTRUM_MAX_FREQUENCY = 5000;

export function frequencyForBin(
  bin: number,
  sampleRate: number,
  fftSize: number,
): number {
  return (bin * sampleRate) / fftSize;
}

export function logFrequencyPosition(
  frequency: number,
  minimum: number,
  maximum: number,
): number {
  const safeFrequency = Math.min(Math.max(frequency, minimum), maximum);
  const range = Math.log(maximum) - Math.log(minimum);

  if (!Number.isFinite(range) || range <= 0) {
    return 0;
  }

  return (Math.log(safeFrequency) - Math.log(minimum)) / range;
}
