import { describe, expect, it } from "vitest";

import {
  createStereoField,
  particleCountForQuality,
  particleFinalOpacity,
  particleOpacity,
  particleSize,
  readCohort,
  stereoMetrics,
  stereoMotionFactor,
  STEREOMETER_PARTICLE_STRIDE,
  updateStereoTargets,
} from "./stereometer";

describe("adaptive stereometer field", () => {
  it("scales density without changing analysis", () => {
    expect(particleCountForQuality("LOW")).toBe(640);
    expect(particleCountForQuality("MEDIUM")).toBe(1_280);
    expect(particleCountForQuality("HIGH")).toBe(2_400);
  });

  it("assigns deterministic low, mid, and high cohorts", () => {
    const field = createStereoField("LOW");
    expect(readCohort(field, 0)).toBe(0);
    expect(readCohort(field, 1)).toBe(1);
    expect(readCohort(field, 2)).toBe(2);
    expect(readCohort(field, 3)).toBe(0);
  });

  it("keeps mono centered and wide stereo spread outward", () => {
    const mono = stereoMetrics(new Float32Array([0.5]), new Float32Array([0.5]));
    const wide = stereoMetrics(new Float32Array([0.5]), new Float32Array([-0.5]));
    expect(Math.abs(mono.balance)).toBeLessThan(0.01);
    expect(wide.width).toBeGreaterThan(mono.width);
  });

  it("maps each cohort with its matching band energy", () => {
    const field = createStereoField("LOW");

    expect(
      updateStereoTargets(
        field,
        new Float32Array([0.5]),
        new Float32Array([-0.5]),
        0,
        0.5,
        1,
      ),
    ).toBe(true);

    expect(field[2]).toBeCloseTo(0.72);
    expect(field[STEREOMETER_PARTICLE_STRIDE + 2]).toBeCloseTo(0.86);
    expect(field[STEREOMETER_PARTICLE_STRIDE * 2 + 2]).toBe(1);
  });

  it("keeps particle opacity and size inside the sharp rendering bounds", () => {
    expect(particleOpacity(0)).toBe(0.1);
    expect(particleOpacity(1)).toBe(0.92);
    expect(particleSize(0)).toBe(0.8);
    expect(particleSize(1)).toBe(3.6);
  });

  it("keeps phase-modulated rendered opacity inside the sharp bounds", () => {
    expect(particleFinalOpacity(0, 0)).toBe(0.1);
    expect(particleFinalOpacity(1, 1)).toBe(0.92);

    const phaseZero = particleFinalOpacity(0.5, 0);
    const phaseMid = particleFinalOpacity(0.5, 0.5);
    const phaseOne = particleFinalOpacity(0.5, 1);
    expect(phaseZero).toBeGreaterThanOrEqual(0.1);
    expect(phaseMid).toBeGreaterThan(phaseZero);
    expect(phaseOne).toBeGreaterThan(phaseMid);
    expect(phaseOne).toBeLessThanOrEqual(0.92);
  });

  it("uses faster motion for high cohorts without exceeding one", () => {
    const low = stereoMotionFactor(1 / 60, 0);
    const mid = stereoMotionFactor(1 / 60, 1);
    const high = stereoMotionFactor(1 / 60, 2);
    expect(low).toBeGreaterThan(0);
    expect(mid).toBeGreaterThan(low);
    expect(high).toBeGreaterThan(mid);
    expect(stereoMotionFactor(10, 2)).toBeLessThanOrEqual(1);
  });
});
