import { describe, expect, it } from "vitest";
import { toMidSide } from "@/lib/audio/midSide";
import { measureStereoWaveform, measureWaveformColumn } from "./waveform";

describe("direct stereo waveform measurement", () => {
  it("retains distinct mid/side extrema and RMS", () => {
    const columns = measureStereoWaveform(new Float32Array([1, -1, 0.5, -0.5]), new Float32Array([1, 1, -0.5, -0.5]));
    expect(columns.mid).toEqual({ positive: 1, negative: -0.5, rms: Math.sqrt(1.25 / 4), localEnergy: 1 });
    expect(columns.side).toEqual({ positive: 0.5, negative: -1, rms: Math.sqrt(1.25 / 4), localEnergy: 1 });
  });

  it("matches the former Float32 conversion pipeline including rounding and unequal channels", () => {
    const left = Float32Array.from({ length: 4096 }, (_, i) => Math.sin(i * 0.13) * 0.731);
    const right = Float32Array.from({ length: 3001 }, (_, i) => Math.cos(i * 0.27) * 0.419);
    const mid = new Float32Array(right.length);
    const side = new Float32Array(right.length);
    toMidSide(left, right, mid, side);
    expect(measureStereoWaveform(left, right)).toEqual({ mid: measureWaveformColumn(mid), side: measureWaveformColumn(side) });
  });

  it("returns a flat column when either channel has no samples", () => {
    const flat = { positive: 0, negative: 0, rms: 0, localEnergy: 0 };
    expect(measureStereoWaveform(new Float32Array(), new Float32Array([1]))).toEqual({ mid: flat, side: flat });
  });
});
