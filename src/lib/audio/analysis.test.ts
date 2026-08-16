import { describe, expect, it } from "vitest";

import type { AnalysisInput, AudioAnalysisState, AudioReactiveSnapshot } from "@/types/audio";
import {
  analyseFrequencyData,
  classifySignalState,
  createAudioAnalysisState,
  decayAudioAnalysis,
  IDLE_AUDIO_SNAPSHOT,
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

function frameFor(
  bins: Uint8Array,
  nowMs: number,
  state = createAudioAnalysisState(),
): AnalysisInput {
  return { bins, sampleRate: SAMPLE_RATE, fftSize: FFT_SIZE, nowMs, state };
}

function stateWith(
  values: Partial<AudioReactiveSnapshot>,
): AudioAnalysisState {
  const state = createAudioAnalysisState();
  return { ...state, snapshot: { ...state.snapshot, ...values } };
}

describe("analyseFrequencyData", () => {
  it("exposes only the required shared snapshot fields", () => {
    expect(IDLE_AUDIO_SNAPSHOT).toEqual({
      lowEnergy: 0,
      midEnergy: 0,
      highEnergy: 0,
      overallEnergy: 0,
      bassEnergy: 0,
      transientEnergy: 0,
      peakStrength: 0,
      smoothedEnergy: 0,
      stereoBalance: 0,
      stereoWidth: 0,
      signalState: "IDLE",
      peakEventId: 0,
      peakSeed: 0,
    });
  });

  it("returns exact idle values for silent input", () => {
    expect(analyseFrequencyData(frameFor(new Uint8Array(BIN_COUNT), 16)).snapshot).toEqual(
      IDLE_AUDIO_SNAPSHOT,
    );
  });

  it("isolates the required low, mid, and high ranges", () => {
    const low = analyseFrequencyData(frameFor(binsForRange(30, 220), 16));
    const mid = analyseFrequencyData(frameFor(binsForRange(300, 3_500), 16));
    const high = analyseFrequencyData(frameFor(binsForRange(5_000, 18_000), 16));
    expect(low.snapshot.lowEnergy).toBeGreaterThan(low.snapshot.midEnergy);
    expect(mid.snapshot.midEnergy).toBeGreaterThan(mid.snapshot.highEnergy);
    expect(high.snapshot.highEnergy).toBeGreaterThan(high.snapshot.lowEnergy);
  });

  it("keeps public numeric energy fields normalized", () => {
    const analysis = analyseFrequencyData(
      frameFor(new Uint8Array(BIN_COUNT).fill(255), 100),
    );
    const { signalState, peakEventId, peakSeed, ...energies } = analysis.snapshot;
    expect(signalState).toBe("LOW");
    expect(peakEventId).toBe(1);
    expect(peakSeed).toBeGreaterThan(0);
    for (const energy of Object.values(energies)) {
      expect(energy).toBeGreaterThanOrEqual(0);
      expect(energy).toBeLessThanOrEqual(1);
    }
  });

  it("distinguishes a sudden peak from sustained loud audio", () => {
    const loud = new Uint8Array(BIN_COUNT).fill(255);
    const attacked = analyseFrequencyData(frameFor(loud, 100));
    const sustained = analyseFrequencyData({
      bins: loud,
      sampleRate: SAMPLE_RATE,
      fftSize: FFT_SIZE,
      nowMs: 220,
      state: attacked,
    });
    expect(attacked.snapshot.transientEnergy).toBeGreaterThan(
      sustained.snapshot.transientEnergy,
    );
    expect(attacked.snapshot.peakEventId).toBe(1);
    expect(sustained.snapshot.peakEventId).toBe(1);
  });

  it("uses hysteresis when leaving HIGH", () => {
    const state = stateWith({ overallEnergy: 0.71, signalState: "HIGH" });
    expect(classifySignalState(0.66, "HIGH")).toBe("HIGH");
    expect(classifySignalState(0.63, "HIGH")).toBe("MEDIUM");
    expect(decayAudioAnalysis(state, 400).snapshot.peakStrength).toBe(0);
  });

  it("smooths attack faster than release and resets invalid frames", () => {
    const attacked = analyseFrequencyData(
      frameFor(new Uint8Array(BIN_COUNT).fill(255), 200),
    );
    const released = analyseFrequencyData(frameFor(new Uint8Array(BIN_COUNT), 216, attacked));
    const invalid = analyseFrequencyData({
      ...frameFor(new Uint8Array(), 232, released),
      sampleRate: 0,
    });

    expect(attacked.snapshot.overallEnergy).toBeCloseTo(0.32);
    expect(released.snapshot.overallEnergy).toBeGreaterThan(
      attacked.snapshot.overallEnergy * 0.9,
    );
    expect(invalid.snapshot).toEqual(IDLE_AUDIO_SNAPSHOT);
  });
});
