import { describe, expect, it } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type { AudioReactiveSnapshot } from "@/types/audio";
import { createPeakEffectRecipe } from "./peakEffects";

function snapshot(
  overrides: Partial<AudioReactiveSnapshot> = {},
): AudioReactiveSnapshot {
  return { ...IDLE_AUDIO_SNAPSHOT, ...overrides };
}

describe("createPeakEffectRecipe", () => {
  it("never emits an effect without a confirmed audio peak", () => {
    expect(
      createPeakEffectRecipe(
        snapshot({ peakEventId: 0, peakStrength: 0 }),
        "HIGH",
        false,
      ),
    ).toBeNull();
  });

  it("is deterministic and scales within the specified limits", () => {
    const input = snapshot({
      peakEventId: 7,
      peakSeed: 8_128,
      peakStrength: 1,
      highEnergy: 0.9,
    });
    const first = createPeakEffectRecipe(input, "HIGH", false);
    const second = createPeakEffectRecipe(input, "HIGH", false);

    expect(first).toEqual(second);
    expect(first!.durationMs).toBeGreaterThanOrEqual(30);
    expect(first!.durationMs).toBeLessThanOrEqual(150);
    expect(first!.shakeDurationMs).toBeLessThanOrEqual(120);
    expect(Math.abs(first!.shakeX)).toBeLessThanOrEqual(6);
    expect(Math.abs(first!.shakeY)).toBeLessThanOrEqual(6);
    expect(Math.abs(first!.sliceOffset)).toBeLessThanOrEqual(6);
    expect(first!.noiseOpacity).toBeLessThanOrEqual(0.15);
    expect(first!.burstCount).toBeLessThanOrEqual(50);
  });

  it("keeps moderate peaks to glow or burst recipes", () => {
    const recipes = Array.from({ length: 20 }, (_, index) =>
      createPeakEffectRecipe(
        snapshot({
          peakEventId: index + 1,
          peakSeed: index + 1,
          peakStrength: 0.71,
        }),
        "HIGH",
        false,
      )!,
    );

    expect(recipes.every(({ variant }) => variant === "glow" || variant === "burst")).toBe(true);
    expect(recipes.every(({ shakeX, shakeY, sliceOffset }) => shakeX === 0 && shakeY === 0 && sliceOffset === 0)).toBe(true);
  });

  it("keeps strong non-extreme peaks to one local motion treatment", () => {
    const recipes = Array.from({ length: 20 }, (_, index) =>
      createPeakEffectRecipe(
        snapshot({
          peakEventId: index + 1,
          peakSeed: index + 101,
          peakStrength: 0.8,
        }),
        "HIGH",
        false,
      )!,
    );

    expect(recipes.every(({ variant }) => variant === "shake" || variant === "glitch-band")).toBe(true);
    expect(recipes.every((recipe) => recipe.variant !== "shake" || recipe.sliceOffset === 0)).toBe(true);
    expect(recipes.every((recipe) => recipe.variant !== "glitch-band" || (recipe.shakeX === 0 && recipe.shakeY === 0))).toBe(true);
  });

  it("allows extreme peaks to combine bounded treatments", () => {
    const recipe = createPeakEffectRecipe(
      snapshot({ peakEventId: 11, peakSeed: 444, peakStrength: 0.95 }),
      "HIGH",
      false,
    )!;

    expect(recipe.variant).toBe("combined");
    expect(Math.abs(recipe.shakeX)).toBeGreaterThan(0);
    expect(Math.abs(recipe.sliceOffset)).toBeGreaterThan(0);
  });

  it("preserves color but removes aggressive motion for reduced motion", () => {
    const recipe = createPeakEffectRecipe(
      snapshot({ peakEventId: 1, peakStrength: 1 }),
      "HIGH",
      true,
    )!;

    expect(recipe.shakeX).toBe(0);
    expect(recipe.shakeY).toBe(0);
    expect(recipe.sliceOffset).toBe(0);
    expect(recipe.rgbOffset).toBeGreaterThan(0);
    expect(recipe.flash).toBeLessThanOrEqual(0.08);
  });

  it("reduces expensive particles and displacement at low quality", () => {
    const input = snapshot({
      peakEventId: 8,
      peakSeed: 2_048,
      peakStrength: 1,
      highEnergy: 1,
    });
    const high = createPeakEffectRecipe(input, "HIGH", false)!;
    const low = createPeakEffectRecipe(input, "LOW", false)!;

    expect(low.burstCount).toBeLessThanOrEqual(high.burstCount);
    expect(Math.abs(low.sliceOffset)).toBeLessThanOrEqual(Math.abs(high.sliceOffset));
    expect(low.crackleDensity).toBeLessThanOrEqual(high.crackleDensity);
  });
});
