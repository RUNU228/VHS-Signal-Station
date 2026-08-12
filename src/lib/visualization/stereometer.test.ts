import { describe, expect, it } from "vitest";

import {
  initializeStereoField,
  particleOpacity,
  stereoMotionFactor,
  STEREOMETER_PARTICLE_COUNT,
  STEREOMETER_PARTICLE_STRIDE,
  updateStereoTargets,
} from "./stereometer";

describe("stereometer full-field motion", () => {
  it("keeps quiet particles visible and increases opacity with value", () => {
    expect(particleOpacity(0)).toBeGreaterThan(0);
    expect(particleOpacity(0.25)).toBeGreaterThan(particleOpacity(0));
    expect(particleOpacity(0.75)).toBeGreaterThan(particleOpacity(0.25));
    expect(particleOpacity(1)).toBeGreaterThan(particleOpacity(0.75));
  });

  it("initializes every current coordinate directly on its real signal target", () => {
    const particles = new Float32Array(
      STEREOMETER_PARTICLE_COUNT * 5,
    );

    expect(
      initializeStereoField(
        particles,
        new Float32Array([0.5, -0.25]),
        new Float32Array([0.25, 0.25]),
      ),
    ).toBe(true);
    expect(STEREOMETER_PARTICLE_STRIDE).toBe(5);

    for (let particle = 0; particle < STEREOMETER_PARTICLE_COUNT; particle += 1) {
      const offset = particle * STEREOMETER_PARTICLE_STRIDE;
      expect(particles[offset]).toBe(particles[offset + 2]);
      expect(particles[offset + 1]).toBe(particles[offset + 3]);
      expect(particles[offset + 4]).toBeGreaterThanOrEqual(0);
      expect(particles[offset + 4]).toBeLessThanOrEqual(1);
    }
  });

  it("refreshes every particle target from the current stereo frame", () => {
    const particles = new Float32Array(
      STEREOMETER_PARTICLE_COUNT * 5,
    );
    initializeStereoField(
      particles,
      new Float32Array([0]),
      new Float32Array([0]),
    );

    expect(
      updateStereoTargets(
        particles,
        new Float32Array([0.75]),
        new Float32Array([-0.25]),
      ),
    ).toBe(true);

    for (let particle = 0; particle < STEREOMETER_PARTICLE_COUNT; particle += 1) {
      const offset = particle * STEREOMETER_PARTICLE_STRIDE;
      expect(particles[offset + 2]).toBe(1);
      expect(particles[offset + 3]).toBe(0.5);
      expect(particles[offset + 4]).toBe(1);
    }
  });

  it("uses a safe frame-rate-independent motion factor", () => {
    expect(stereoMotionFactor(0)).toBe(0);
    expect(stereoMotionFactor(-1)).toBe(0);
    expect(stereoMotionFactor(1 / 120)).toBeGreaterThan(0);
    expect(stereoMotionFactor(1 / 60)).toBeGreaterThan(
      stereoMotionFactor(1 / 120),
    );
    expect(stereoMotionFactor(10)).toBeLessThanOrEqual(1);
  });

  it("rejects empty paired input without corrupting the field", () => {
    const particles = new Float32Array(
      STEREOMETER_PARTICLE_COUNT * 5,
    ).fill(0.5);

    expect(
      updateStereoTargets(
        particles,
        new Float32Array(),
        new Float32Array(),
      ),
    ).toBe(false);
    expect(particles.every((value) => value === 0.5)).toBe(true);
  });
});
