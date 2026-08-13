import type { AudioReactiveSnapshot } from "@/types/audio";

export const IDLE_AUDIO_SNAPSHOT: Readonly<AudioReactiveSnapshot> = Object.freeze({
  volume: 0,
  bass: 0,
  lowMid: 0,
  mid: 0,
  highMid: 0,
  treble: 0,
  peak: 0,
  smoothed: 0,
});

export type AnalysisInput = {
  bins: Uint8Array;
  sampleRate: number;
  fftSize: number;
  previous: Readonly<AudioReactiveSnapshot>;
};

type FrequencyBand = readonly [fromHz: number, toHz: number];

const BANDS = {
  bass: [20, 250],
  lowMid: [250, 500],
  mid: [500, 2_000],
  highMid: [2_000, 6_000],
  treble: [6_000, 20_000],
} as const satisfies Record<
  "bass" | "lowMid" | "mid" | "highMid" | "treble",
  FrequencyBand
>;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function smooth(previous: number, target: number, attack: number, release: number): number {
  const safePrevious = clamp01(previous);
  const safeTarget = clamp01(target);
  const amount = safeTarget > safePrevious ? attack : release;
  return clamp01(safePrevious + (safeTarget - safePrevious) * amount);
}

function binRange(
  bins: Uint8Array,
  sampleRate: number,
  fftSize: number,
  [fromHz, toHz]: FrequencyBand,
): readonly [start: number, end: number] {
  const start = Math.max(0, Math.floor((fromHz * fftSize) / sampleRate));
  const end = Math.min(
    bins.length,
    Math.max(start + 1, Math.ceil((toHz * fftSize) / sampleRate)),
  );
  return [Math.min(start, bins.length), end];
}

function rms(
  bins: Uint8Array,
  sampleRate: number,
  fftSize: number,
  band: FrequencyBand,
): number {
  const [start, end] = binRange(bins, sampleRate, fftSize, band);
  if (end <= start) return 0;
  let sumSquares = 0;
  for (let index = start; index < end; index += 1) {
    const value = bins[index] / 255;
    sumSquares += value * value;
  }
  return clamp01(Math.sqrt(sumSquares / (end - start)));
}

function maxInBand(
  bins: Uint8Array,
  sampleRate: number,
  fftSize: number,
  band: FrequencyBand,
): number {
  const [start, end] = binRange(bins, sampleRate, fftSize, band);
  let maximum = 0;
  for (let index = start; index < end; index += 1) {
    maximum = Math.max(maximum, bins[index] / 255);
  }
  return clamp01(maximum);
}

export function analyseFrequencyData({
  bins,
  sampleRate,
  fftSize,
  previous,
}: AnalysisInput): AudioReactiveSnapshot {
  if (bins.length === 0 || sampleRate <= 0 || fftSize <= 0) {
    return { ...IDLE_AUDIO_SNAPSHOT };
  }

  const rawVolume = rms(bins, sampleRate, fftSize, [20, 20_000]);
  const volume = smooth(previous.volume, rawVolume, 0.24, 0.07);
  const bass = smooth(previous.bass, rms(bins, sampleRate, fftSize, BANDS.bass), 0.24, 0.07);
  const lowMid = smooth(previous.lowMid, rms(bins, sampleRate, fftSize, BANDS.lowMid), 0.24, 0.07);
  const mid = smooth(previous.mid, rms(bins, sampleRate, fftSize, BANDS.mid), 0.24, 0.07);
  const highMid = smooth(previous.highMid, rms(bins, sampleRate, fftSize, BANDS.highMid), 0.24, 0.07);
  const treble = smooth(previous.treble, rms(bins, sampleRate, fftSize, BANDS.treble), 0.24, 0.07);
  const maximum = smooth(
    previous.peak,
    maxInBand(bins, sampleRate, fftSize, [20, 20_000]),
    0.24,
    0.07,
  );
  const positiveRise = Math.max(0, volume - previous.volume);
  const peak = clamp01(Math.max(maximum, positiveRise));
  const smoothed = smooth(previous.smoothed, rawVolume, 0.16, 0.045);

  return { volume, bass, lowMid, mid, highMid, treble, peak, smoothed };
}
