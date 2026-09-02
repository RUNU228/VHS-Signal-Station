import { describe, expect, it } from "vitest";
import { createWaveformColors, pushWaveformColor, waveformColorForPosition, addWaveformColorStops } from "./waveformColor";

function tone(hz: number) {
  const bins = new Uint8Array(2400);
  bins[Math.round(hz / 10)] = 255;
  return bins;
}

describe("waveform frequency colors", () => {
  it("uses only endpoints for a constant historical color", () => {
    const stops: Array<[number, string]> = [];
    addWaveformColorStops({ addColorStop: (at, color) => stops.push([at, color]) }, new Float32Array(360).fill(0.5));
    expect(stops).toEqual([[0, "hsl(60 100% 60%)"], [1, "hsl(60 100% 60%)"]]);
  });

  it("retains both boundaries of plateaus around a color transition", () => {
    const stops: Array<[number, string]> = [];
    addWaveformColorStops({ addColorStop: (at, color) => stops.push([at, color]) }, new Float32Array([0, 0, 0, 1, 1, 1]));
    expect(stops[0]).toEqual([0, "hsl(220 100% 60%)"]);
    expect(stops[1]).toEqual([0.4, "hsl(220 100% 60%)"]);
    expect(stops.at(-2)).toEqual([0.6, "hsl(0 100% 60%)"]);
    expect(stops.at(-1)).toEqual([1, "hsl(0 100% 60%)"]);
    expect(stops).toHaveLength(35);
  });
  it("adds vivid intermediate hues even across an abrupt historical color jump", () => {
    const stops: Array<[number, string]> = [];
    addWaveformColorStops({ addColorStop: (at, color) => stops.push([at, color]) }, new Float32Array([0, 1]));
    expect(stops[0]).toEqual([0, "hsl(220 100% 60%)"]);
    expect(stops.at(-1)).toEqual([1, "hsl(0 100% 60%)"]);
    expect(stops.some(([, color]) => color === "hsl(60 100% 60%)")).toBe(true);
    expect(stops.length).toBeGreaterThan(10);
    expect(stops.length).toBeLessThanOrEqual(33);
  });
  it.each([[80, 0], [1000, 0.5], [10000, 1]])("maps %i Hz independently of amplitude", (hz, expected) => {
    const state = createWaveformColors(360);
    expect(pushWaveformColor(state, tone(hz), 48000, 4800, 0, 1)).toBeCloseTo(expected);
  });

  it("keeps the palette vivid and continuous through cyan, yellow and orange", () => {
    expect(waveformColorForPosition(0)).toBe("hsl(220 100% 60%)");
    expect(waveformColorForPosition(0.5)).toBe("hsl(60 100% 60%)");
    expect(waveformColorForPosition(1)).toBe("hsl(0 100% 60%)");
    let previous = 220;
    for (let i = 0; i <= 1000; i++) {
      const color = waveformColorForPosition(i / 1000);
      const hue = Number(color.match(/hsl\(([\d.]+)/)![1]);
      expect(color).toContain("100% 60%");
      expect(previous - hue).toBeGreaterThanOrEqual(0);
      expect(previous - hue).toBeLessThan(1);
      previous = hue;
    }
  });

  it.each([60, 120, 144, 165, 240])("smooths equally over one second at %i Hz", (rate) => {
    const state = createWaveformColors(360);
    pushWaveformColor(state, tone(80), 48000, 4800, 0, 1);
    for (let frame = 1; frame <= rate; frame++) {
      pushWaveformColor(state, tone(10000), 48000, 4800, frame * 1000 / rate, 1);
    }
    expect(state.position).toBeCloseTo(1 - Math.exp(-1000 / 65), 12);
  });

  it("retains past colors and clears them with smoothing on track changes", () => {
    const state = createWaveformColors(4);
    pushWaveformColor(state, tone(1000), 48000, 4800, 0, 1);
    pushWaveformColor(state, tone(10000), 48000, 4800, 65, 1);
    expect(state.history[2]).toBe(0.5);
    expect(state.history[3]).toBeCloseTo(0.81606028);
    pushWaveformColor(state, tone(80), 48000, 4800, 66, 2);
    expect(Array.from(state.history)).toEqual([0, 0, 0, 0]);
  });

  it("handles silence, empty data, invalid metadata and timestamps", () => {
    const state = createWaveformColors(4);
    expect(pushWaveformColor(state, new Uint8Array(), 0, 0, NaN, 1)).toBe(0);
    expect(pushWaveformColor(state, tone(10000), NaN, 4800, 10, 1)).toBe(0);
    pushWaveformColor(state, tone(1000), 48000, 4800, 1000, 1);
    expect(pushWaveformColor(state, new Uint8Array(2400), 48000, 4800, 2000, 1)).toBeCloseTo(0);
    expect(waveformColorForPosition(NaN)).toBe("hsl(220 100% 60%)");
  });

  it("rebuilds the frequency mapping for a changed sample rate or FFT size", () => {
    const state = createWaveformColors(4);
    const bins = tone(1000);
    pushWaveformColor(state, bins, 48000, 4800, 0, 1);
    expect(pushWaveformColor(state, bins, 480000, 4800, 0, 2)).toBe(1);
    expect(pushWaveformColor(state, bins, 48000, 48000, 0, 3)).toBeLessThan(0.1);
  });
});
