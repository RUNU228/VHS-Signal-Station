import { describe, expect, it } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type { AudioVisualizationFrame } from "@/types/audio";
import { backgroundPolicy } from "./background";

function frame(
  snapshot: Partial<AudioVisualizationFrame["snapshot"]> = {},
  options: Partial<Pick<AudioVisualizationFrame, "quality" | "reducedMotion">> = {},
): AudioVisualizationFrame {
  return {
    snapshot: { ...IDLE_AUDIO_SNAPSHOT, ...snapshot },
    frequencyData: new Uint8Array(),
    oscilloscopeData: new Float32Array(),
    leftChannelData: new Float32Array(),
    rightChannelData: new Float32Array(),
    sampleRate: 48_000,
    frequencyFftSize: 4_096,
    frameId: 0,
    sourceRevision: 0,
    quality: options.quality ?? "HIGH",
    reducedMotion: options.reducedMotion ?? false,
  };
}

describe("backgroundPolicy", () => {
  it("keeps idle and extreme opacity inside readability bounds", () => {
    const idle = backgroundPolicy(frame({ overallEnergy: 0 }));
    const extreme = backgroundPolicy(
      frame({ overallEnergy: 1, peakStrength: 1 }),
    );

    expect(idle.opacity).toBeGreaterThanOrEqual(0.03);
    expect(idle.opacity).toBeLessThanOrEqual(0.08);
    expect(extreme.opacity).toBeLessThanOrEqual(0.35);
  });

  it("suppresses rapid movement for reduced motion", () => {
    const policy = backgroundPolicy(
      frame({ overallEnergy: 1 }, { reducedMotion: true }),
    );

    expect(policy.shake).toBe(0);
    expect(policy.traceSpeed).toBeLessThanOrEqual(0.08);
    expect(policy.frameInterval).toBeGreaterThanOrEqual(100);
  });

  it("scales detail and cadence down with shared frame quality", () => {
    const high = backgroundPolicy(frame({}, { quality: "HIGH" }));
    const low = backgroundPolicy(frame({}, { quality: "LOW" }));

    expect(high.bandCount).toBe(5);
    expect(low.bandCount).toBe(3);
    expect(low.grainCount).toBeLessThan(high.grainCount);
    expect(low.frameInterval).toBeCloseTo(1000 / 30);
  });
});
