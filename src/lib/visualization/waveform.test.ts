import { describe, expect, it } from "vitest";

import { measureWaveformColumn, pushWaveformColumn } from "./waveform";

describe("waveform history", () => {
  it("measures the positive, negative, and RMS amplitude of real samples", () => {
    const column = measureWaveformColumn(new Float32Array([-0.8, -0.25, 0.5, 0.2]));
    expect(column.negative).toBeCloseTo(-0.8);
    expect(column.positive).toBeCloseTo(0.5);
    expect(column.rms).toBeCloseTo(Math.sqrt(0.248125));
  });

  it("scrolls old measurements left and appends the newest column", () => {
    const positive = new Float32Array([0.1, 0.2, 0.3]);
    const negative = new Float32Array([-0.1, -0.2, -0.3]);
    const rms = new Float32Array([0.05, 0.1, 0.15]);

    pushWaveformColumn({ positive, negative, rms }, { positive: 0.9, negative: -0.7, rms: 0.6 });

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
  });
});
