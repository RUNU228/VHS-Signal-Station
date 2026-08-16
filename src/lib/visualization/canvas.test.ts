import { describe, expect, it } from "vitest";
import {
  energySignalColor,
  signalColor,
  signalGlow,
  smoothEnergy,
  smoothSignalColor,
} from "./canvas";
import { signalColorForLevel } from "./signalTheme";

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
  });
});

describe("legacy canvas color helpers", () => {
  it("delegate to the continuous signal theme", () => {
    const level = 0.82;
    const alpha = 0.63;
    const expected = signalColorForLevel(level, alpha);

    expect(signalColor(level, alpha)).toBe(expected);
    expect(smoothSignalColor(level, alpha)).toBe(expected);
    expect(energySignalColor(level, alpha)).toBe(expected);
  });
});
