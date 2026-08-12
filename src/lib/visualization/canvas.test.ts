import { describe, expect, it } from "vitest";
import {
  energySignalColor,
  signalGlow,
  smoothEnergy,
  smoothSignalColor,
} from "./canvas";

const CANVAS_BACKGROUND = [5, 7, 7] as const;
const DENSE_MONOTONICITY_LEVELS = [
  ...Array.from({ length: 10_001 }, (_, sample) => sample / 10_000),
  0.00373,
  0.00374,
].sort((left, right) => left - right);

function parseRgba(color: string): [number, number, number, number] {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length !== 4) {
    throw new Error(`Expected an rgba color, received ${color}`);
  }
  return channels as [number, number, number, number];
}

function linearizeSrgb(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.04045
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function compositedRelativeLuminance(color: string): number {
  const [red, green, blue, alpha] = parseRgba(color);
  const composite = [red, green, blue].map(
    (channel, index) => channel * alpha + CANVAS_BACKGROUND[index] * (1 - alpha),
  );
  const [compositeRed, compositeGreen, compositeBlue] = composite.map(linearizeSrgb);

  return (
    compositeRed * 0.2126 +
    compositeGreen * 0.7152 +
    compositeBlue * 0.0722
  );
}

function expectNondecreasingLuminance(alphaForLevel: (level: number) => number) {
  let previous = -Infinity;

  for (const level of DENSE_MONOTONICITY_LEVELS) {
    const luminance = compositedRelativeLuminance(
      energySignalColor(level, alphaForLevel(level)),
    );
    expect(
      luminance,
      `expected luminance at ${level} not to be below the previous sample`,
    ).toBeGreaterThanOrEqual(previous - 1e-10);
    previous = luminance;
  }
}

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

describe("energySignalColor", () => {
  it("keeps every palette stop channel nondecreasing", () => {
    const stops = [0, 0.5, 0.75, 1].map((level) =>
      parseRgba(energySignalColor(level)).slice(0, 3),
    );

    for (let stop = 1; stop < stops.length; stop += 1) {
      for (let channel = 0; channel < 3; channel += 1) {
        expect(stops[stop][channel]).toBeGreaterThanOrEqual(
          stops[stop - 1][channel],
        );
      }
    }
  });

  it("does not reverse an RGB channel around the prior rounding regression", () => {
    const lower = parseRgba(energySignalColor(0.00373)).slice(0, 3);
    const higher = parseRgba(energySignalColor(0.00374)).slice(0, 3);

    for (let channel = 0; channel < 3; channel += 1) {
      expect(higher[channel]).toBeGreaterThanOrEqual(lower[channel]);
    }
  });

  it("does not dim production marks around the prior rounding regression", () => {
    for (const alphaForLevel of [
      (level: number) => signalGlow(level).barAlpha,
      (level: number) => signalGlow(level).peakAlpha,
      (level: number) => signalGlow(level).strokeAlpha,
    ]) {
      const lower = compositedRelativeLuminance(
        energySignalColor(0.00373, alphaForLevel(0.00373)),
      );
      const higher = compositedRelativeLuminance(
        energySignalColor(0.00374, alphaForLevel(0.00374)),
      );

      expect(higher).toBeGreaterThanOrEqual(lower);
    }
  });

  it("keeps every RGB channel nondecreasing across dense energy samples", () => {
    let previous = parseRgba(energySignalColor(0)).slice(0, 3);

    for (const level of DENSE_MONOTONICITY_LEVELS.slice(1)) {
      const current = parseRgba(energySignalColor(level)).slice(0, 3);

      for (let channel = 0; channel < 3; channel += 1) {
        expect(
          current[channel],
          `expected channel ${channel} at ${level} not to be below the previous sample`,
        ).toBeGreaterThanOrEqual(previous[channel]);
      }
      previous = current;
    }
  });

  it("increases composited Spectrum mark luminance from low to high energy", () => {
    for (const alphaForLevel of [
      (level: number) => signalGlow(level).barAlpha,
      (level: number) => signalGlow(level).peakAlpha,
    ]) {
      const luminance = [0, 0.5, 1].map((level) =>
        compositedRelativeLuminance(
          energySignalColor(level, alphaForLevel(level)),
        ),
      );

      expect(luminance[0]).toBeLessThan(luminance[1]);
      expect(luminance[1]).toBeLessThan(luminance[2]);
    }
  });

  it("increases composited Oscilloscope stroke luminance from low to high energy", () => {
    const luminance = [0, 0.5, 1].map((level) =>
      compositedRelativeLuminance(
        energySignalColor(level, signalGlow(level).strokeAlpha),
      ),
    );

    expect(luminance[0]).toBeLessThan(luminance[1]);
    expect(luminance[1]).toBeLessThan(luminance[2]);
  });

  it("does not dim Spectrum bars or peaks across dense energy samples", () => {
    expectNondecreasingLuminance((level) => signalGlow(level).barAlpha);
    expectNondecreasingLuminance((level) => signalGlow(level).peakAlpha);
  });

  it("does not dim the Oscilloscope stroke across dense energy samples", () => {
    expectNondecreasingLuminance((level) => signalGlow(level).strokeAlpha);
  });

  it("keeps adjacent energy colors continuous and clamps inputs", () => {
    const lower = parseRgba(energySignalColor(0.49, 0.85));
    const higher = parseRgba(energySignalColor(0.51, 0.85));

    for (let index = 0; index < 3; index += 1) {
      expect(Math.abs(lower[index] - higher[index])).toBeLessThan(10);
    }
    expect(energySignalColor(-1, 0.7)).toBe(energySignalColor(0, 0.7));
    expect(energySignalColor(2, 0.7)).toBe(energySignalColor(1, 0.7));
    expect(parseRgba(energySignalColor(0.5, -1))[3]).toBe(0);
    expect(parseRgba(energySignalColor(0.5, 2))[3]).toBe(1);
  });

  it("formats interpolated RGB channels to two decimal places", () => {
    expect(energySignalColor(0.125, 0.5)).toMatch(
      /^rgba\(\d+(?:\.\d{1,2})?, \d+(?:\.\d{1,2})?, \d+(?:\.\d{1,2})?, 0.5\)$/,
    );
  });
});

describe("smoothSignalColor", () => {
  it("preserves legacy integer serialization at intermediate levels", () => {
    expect(smoothSignalColor(0.125, 0.5)).toBe(
      "rgba(124, 146, 155, 0.5)",
    );
    expect(smoothSignalColor(0.25, 0.5)).toBe(
      "rgba(154, 150, 125, 0.5)",
    );
    expect(smoothSignalColor(0.75, 0.5)).toBe(
      "rgba(182, 116, 75, 0.5)",
    );
  });

  it("keeps adjacent palette samples visually continuous", () => {
    const lower = parseRgba(smoothSignalColor(0.49));
    const higher = parseRgba(smoothSignalColor(0.51));

    for (let channel = 0; channel < 3; channel += 1) {
      expect(Math.abs(lower[channel] - higher[channel])).toBeLessThanOrEqual(1);
    }
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
