import { describe, expect, it } from "vitest";

import {
  IDLE_AUDIO_SNAPSHOT,
  analyseFrequencyData,
} from "./analysis";

const SAMPLE_RATE = 48_000;
const FFT_SIZE = 4_096;
const BIN_COUNT = FFT_SIZE / 2;

function binsForRange(fromHz: number, toHz: number, value = 255): Uint8Array {
  const bins = new Uint8Array(BIN_COUNT);
  const from = Math.max(0, Math.floor((fromHz * FFT_SIZE) / SAMPLE_RATE));
  const to = Math.min(bins.length, Math.ceil((toHz * FFT_SIZE) / SAMPLE_RATE));
  bins.fill(value, from, Math.max(from + 1, to));
  return bins;
}

describe("analyseFrequencyData", () => {
  it("returns exact idle values for silent input", () => {
    expect(
      analyseFrequencyData({
        bins: new Uint8Array(BIN_COUNT),
        sampleRate: SAMPLE_RATE,
        fftSize: FFT_SIZE,
        previous: IDLE_AUDIO_SNAPSHOT,
      }),
    ).toEqual(IDLE_AUDIO_SNAPSHOT);
  });

  it("isolates bass energy and keeps every output normalized", () => {
    const value = analyseFrequencyData({
      bins: binsForRange(30, 220),
      sampleRate: SAMPLE_RATE,
      fftSize: FFT_SIZE,
      previous: IDLE_AUDIO_SNAPSHOT,
    });

    expect(value.bass).toBeGreaterThan(value.mid);
    expect(value.bass).toBeGreaterThan(value.treble);
    for (const energy of Object.values(value)) {
      expect(energy).toBeGreaterThanOrEqual(0);
      expect(energy).toBeLessThanOrEqual(1);
    }
  });

  it("maps each frequency range to its corresponding band", () => {
    const cases = [
      ["lowMid", 250, 500],
      ["mid", 500, 2_000],
      ["highMid", 2_000, 6_000],
      ["treble", 6_000, 20_000],
    ] as const;

    for (const [band, fromHz, toHz] of cases) {
      const value = analyseFrequencyData({
        bins: binsForRange(fromHz, toHz),
        sampleRate: SAMPLE_RATE,
        fftSize: FFT_SIZE,
        previous: IDLE_AUDIO_SNAPSHOT,
      });
      expect(value[band], band).toBeGreaterThan(0.2);
    }
  });

  it("uses a faster attack than release and preserves transient peaks", () => {
    const loud = new Uint8Array(BIN_COUNT).fill(255);
    const attacked = analyseFrequencyData({
      bins: loud,
      sampleRate: SAMPLE_RATE,
      fftSize: FFT_SIZE,
      previous: IDLE_AUDIO_SNAPSHOT,
    });
    const released = analyseFrequencyData({
      bins: new Uint8Array(BIN_COUNT),
      sampleRate: SAMPLE_RATE,
      fftSize: FFT_SIZE,
      previous: attacked,
    });

    expect(attacked.volume).toBeCloseTo(0.24);
    expect(attacked.smoothed).toBeCloseTo(0.16);
    expect(attacked.peak).toBeGreaterThanOrEqual(attacked.volume);
    expect(released.volume).toBeGreaterThan(attacked.volume * 0.8);
    expect(released.smoothed).toBeGreaterThan(attacked.smoothed * 0.9);
  });
});
