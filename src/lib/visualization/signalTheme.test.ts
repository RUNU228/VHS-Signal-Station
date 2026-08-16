import { createAudioAnalysisState } from "@/lib/audio/analysis";
import type { AudioReactiveSnapshot } from "@/types/audio";
import { describe, expect, it } from "vitest";
import {
  createSignalTheme,
  signalColor,
  signalColorForLevel,
} from "./signalTheme";

function snapshot(
  values: Partial<AudioReactiveSnapshot>,
): AudioReactiveSnapshot {
  return { ...createAudioAnalysisState().snapshot, ...values };
}

function parse(color: string): [number, number, number, number] {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length !== 4) throw new Error(color);
  return channels as [number, number, number, number];
}

function channelDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  return Math.max(...left.slice(0, 3).map((value, index) => Math.abs(value - right[index])));
}

describe("signal theme", () => {
  it("travels continuously from blue through yellow and orange to red", () => {
    expect(signalColorForLevel(0)).toBe("rgba(53, 69, 82, 1)");
    expect(signalColorForLevel(0.65)).toBe("rgba(230, 215, 163, 1)");
    expect(signalColorForLevel(1)).toBe("rgba(211, 79, 67, 1)");
    for (let sample = 1; sample <= 1_000; sample += 1) {
      const previous = parse(signalColorForLevel((sample - 1) / 1_000));
      const current = parse(signalColorForLevel(sample / 1_000));
      expect(channelDistance(previous, current)).toBeLessThan(3);
    }
  });

  it("keeps frequency bias bounded by overall intensity", () => {
    const bass = createSignalTheme(snapshot({ overallEnergy: 0.6, lowEnergy: 1 }));
    const highs = createSignalTheme(snapshot({ overallEnergy: 0.6, highEnergy: 1 }));
    expect(bass.rgb[2]).toBeGreaterThan(highs.rgb[2]);
    expect(highs.rgb[0]).toBeGreaterThan(bass.rgb[0]);
    expect(Math.abs(bass.brightness - highs.brightness)).toBeLessThanOrEqual(0.08);
  });

  it("derives increasing brightness and glow from overall energy", () => {
    const low = createSignalTheme(snapshot({ overallEnergy: 0 }));
    const middle = createSignalTheme(snapshot({ overallEnergy: 0.5 }));
    const high = createSignalTheme(snapshot({ overallEnergy: 1 }));

    expect(low.brightness).toBeLessThan(middle.brightness);
    expect(middle.brightness).toBeLessThan(high.brightness);
    expect(low.glow).toBeLessThan(middle.glow);
    expect(middle.glow).toBeLessThan(high.glow);
    expect(high.brightness).toBe(1);
    expect(high.glow).toBe(1);
  });

  it("formats a theme color with clamped opacity", () => {
    const theme = createSignalTheme(snapshot({ overallEnergy: 0.65 }));
    expect(signalColor(theme, -1)).toMatch(/, 0\)$/);
    expect(signalColor(theme, 2)).toMatch(/, 1\)$/);
  });
});
