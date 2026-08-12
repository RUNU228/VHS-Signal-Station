import { describe, expect, it } from "vitest";
import { smoothEnergy, smoothSignalColor } from "./canvas";

describe("smoothEnergy", () => {
  it("uses faster attack and slower release for visual energy", () => {
    expect(smoothEnergy(0, 1)).toBeCloseTo(0.18);
    expect(smoothEnergy(1, 0)).toBeCloseTo(0.94);
  });
});

describe("smoothSignalColor", () => {
  it("keeps adjacent palette samples continuous", () => {
    expect(smoothSignalColor(0.49)).not.toBe(smoothSignalColor(0.51));
    expect(smoothSignalColor(0.49)).toMatch(/^rgba\(/);
  });

  it("interpolates continuously through the analog signal palette", () => {
    expect(smoothSignalColor(0, 0.5)).toBe("rgba(111, 145, 168, 0.5)");
    expect(smoothSignalColor(0.5, 0.5)).toBe("rgba(196, 154, 82, 0.5)");
    expect(smoothSignalColor(1, 0.5)).toBe("rgba(168, 77, 67, 0.5)");
    expect(smoothSignalColor(0.25, 0.5)).not.toBe(smoothSignalColor(0, 0.5));
  });

  it("clamps values outside the supported range", () => {
    expect(smoothSignalColor(-1)).toBe(smoothSignalColor(0));
    expect(smoothSignalColor(2)).toBe(smoothSignalColor(1));
    expect(smoothSignalColor(0.5, -1)).toBe("rgba(196, 154, 82, 0)");
    expect(smoothSignalColor(0.5, 2)).toBe("rgba(196, 154, 82, 1)");
  });
});
