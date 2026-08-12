import { describe, expect, it } from "vitest";

import { frequencyForBin, logFrequencyPosition } from "./frequency";

describe("frequency mapping", () => {
  it("converts an FFT bin to hertz using the current sample rate", () => {
    expect(frequencyForBin(100, 48_000, 4096)).toBeCloseTo(1171.875);
  });

  it("maps the spectrum endpoints to a normalized logarithmic range", () => {
    expect(logFrequencyPosition(100, 100, 5000)).toBe(0);
    expect(logFrequencyPosition(5000, 100, 5000)).toBe(1);
  });

  it("clamps frequencies outside the visible range", () => {
    expect(logFrequencyPosition(50, 100, 5000)).toBe(0);
    expect(logFrequencyPosition(8000, 100, 5000)).toBe(1);
  });
});
