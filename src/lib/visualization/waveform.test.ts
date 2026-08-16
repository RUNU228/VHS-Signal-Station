import { describe, expect, it } from "vitest";

import {
  clearWaveformHistory,
  createWaveformHistory,
  measureWaveformColumn,
  pushWaveformColumn,
} from "./waveform";

describe("waveform history", () => {
  it("measures the positive, negative, and RMS amplitude of real samples", () => {
    const column = measureWaveformColumn(new Float32Array([-0.8, -0.25, 0.5, 0.2]));
    expect(column.negative).toBeCloseTo(-0.8);
    expect(column.positive).toBeCloseTo(0.5);
    expect(column.rms).toBeCloseTo(Math.sqrt(0.248125));
  });

  it("preserves local energy for per-column color", () => {
    const column = measureWaveformColumn(new Float32Array([-0.2, 0.8, 0.1]));
    expect(column.localEnergy).toBeCloseTo(0.8);
  });

  it("scrolls old measurements left and appends the newest column", () => {
    const positive = new Float32Array([0.1, 0.2, 0.3]);
    const negative = new Float32Array([-0.1, -0.2, -0.3]);
    const rms = new Float32Array([0.05, 0.1, 0.15]);
    const localEnergy = new Float32Array([0.1, 0.2, 0.3]);

    pushWaveformColumn(
      { positive, negative, rms, localEnergy },
      { positive: 0.9, negative: -0.7, rms: 0.6, localEnergy: 0.9 },
    );

    expect([...positive]).toEqual([
      expect.closeTo(0.2),
      expect.closeTo(0.3),
      expect.closeTo(0.9),
    ]);
    expect([...negative]).toEqual([
      expect.closeTo(-0.2),
      expect.closeTo(-0.3),
      expect.closeTo(-0.7),
    ]);
    expect([...rms]).toEqual([
      expect.closeTo(0.1),
      expect.closeTo(0.15),
      expect.closeTo(0.6),
    ]);
    expect([...localEnergy]).toEqual([
      expect.closeTo(0.2),
      expect.closeTo(0.3),
      expect.closeTo(0.9),
    ]);
  });

  it("clears history on a track frame reset", () => {
    const history = createWaveformHistory(4);
    history.negative.fill(-0.8);
    history.positive.fill(0.8);
    history.rms.fill(0.6);
    history.localEnergy.fill(0.8);

    clearWaveformHistory(history);

    expect(history.negative).toEqual(new Float32Array(4));
    expect(history.positive).toEqual(new Float32Array(4));
    expect(history.rms).toEqual(new Float32Array(4));
    expect(history.localEnergy).toEqual(new Float32Array(4));
  });
});
