import { describe, expect, it } from "vitest";
import { signalGlow, smoothEnergy, smoothSignalColor } from "./canvas";

describe("smoothEnergy", () => {
  it("uses faster attack and slower release for visual energy", () => {
    expect(smoothEnergy(0, 1)).toBeCloseTo(0.18);
    expect(smoothEnergy(1, 0)).toBeCloseTo(0.94);
  });
});

describe("signalGlow", () => {
  it("makes low visual energy darker and less glowy than high energy", () => {
    const low = signalGlow(0);
    const high = signalGlow(1);

    expect(low.barAlpha).toBeLessThan(high.barAlpha);
    expect(low.peakAlpha).toBeLessThan(high.peakAlpha);
    expect(low.strokeAlpha).toBeLessThan(high.strokeAlpha);
    expect(low.shadowAlpha).toBeLessThan(high.shadowAlpha);
    expect(low.shadowBlur).toBeLessThan(high.shadowBlur);
  });

  it("clamps glow factors to controlled bounds", () => {
    expect(signalGlow(-1)).toEqual(signalGlow(0));
    expect(signalGlow(2)).toEqual(signalGlow(1));

    const maximum = signalGlow(1);
    expect(maximum.barAlpha).toBeLessThanOrEqual(0.9);
    expect(maximum.peakAlpha).toBeLessThanOrEqual(0.95);
    expect(maximum.strokeAlpha).toBeLessThanOrEqual(0.96);
    expect(maximum.shadowAlpha).toBeLessThanOrEqual(0.7);
    expect(maximum.shadowBlur).toBeLessThanOrEqual(5);
  });

  it("changes glow factors continuously between adjacent energy samples", () => {
    const lower = signalGlow(0.49);
    const higher = signalGlow(0.51);

    expect(lower.barAlpha).toBeLessThan(higher.barAlpha);
    expect(lower.peakAlpha).toBeLessThan(higher.peakAlpha);
    expect(lower.strokeAlpha).toBeLessThan(higher.strokeAlpha);
    expect(lower.shadowAlpha).toBeLessThan(higher.shadowAlpha);
    expect(lower.shadowBlur).toBeLessThan(higher.shadowBlur);
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
