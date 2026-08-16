import { describe, expect, it } from "vitest";

import {
  nextOscilloscopePeakFrame,
  oscilloscopePointPolicy,
  oscilloscopeSegmentCount,
  type OscilloscopePeakFrame,
} from "./Oscilloscope";

const idlePeakFrame: OscilloscopePeakFrame = {
  peakEventId: 0,
  remainingFrames: 0,
  peakStrength: 0,
  peakSeed: 0,
};

describe("oscilloscope segment policy", () => {
  it("disconnects fragment boundaries for exactly three strong-peak frames", () => {
    const event = { peakEventId: 1, peakStrength: 0.9, peakSeed: 0.25 };
    const first = nextOscilloscopePeakFrame(idlePeakFrame, event);
    const second = nextOscilloscopePeakFrame(first, event);
    const third = nextOscilloscopePeakFrame(second, event);
    const fourth = nextOscilloscopePeakFrame(third, event);

    expect([
      first.remainingFrames > 0,
      second.remainingFrames > 0,
      third.remainingFrames > 0,
      fourth.remainingFrames > 0,
    ]).toEqual([true, true, true, false]);

    const activeBoundaries = Array.from({ length: 11 }, (_, index) => index + 1)
      .filter((point) => !oscilloscopePointPolicy(point, 12, first).connectPrevious);
    const inactiveBoundaries = Array.from({ length: 11 }, (_, index) => index + 1)
      .filter((point) => !oscilloscopePointPolicy(point, 12, fourth).connectPrevious);

    expect(activeBoundaries).toEqual([4, 8]);
    expect(inactiveBoundaries).toEqual([]);
  });

  it("keeps every fragment offset within four times the peak strength", () => {
    const frame = nextOscilloscopePeakFrame(idlePeakFrame, {
      peakEventId: 2,
      peakStrength: 0.8,
      peakSeed: 0.75,
    });

    for (let point = 0; point < 64; point += 1) {
      expect(Math.abs(oscilloscopePointPolicy(point, 64, frame).offset))
        .toBeLessThanOrEqual(3.2);
    }
  });

  it("caps drawn segments at the canvas pixel width", () => {
    expect(oscilloscopeSegmentCount(4_096, 640)).toBe(640);
    expect(oscilloscopeSegmentCount(10, 640)).toBe(9);
  });
});
