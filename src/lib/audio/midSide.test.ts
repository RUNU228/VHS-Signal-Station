import { describe, expect, it } from "vitest";

import { toMidSide } from "./midSide";

describe("toMidSide", () => {
  it("derives mono and stereo difference channels from left and right", () => {
    const mid = new Float32Array(2);
    const side = new Float32Array(2);

    toMidSide(
      new Float32Array([1, -1]),
      new Float32Array([1, 1]),
      mid,
      side,
    );

    expect([...mid]).toEqual([1, 0]);
    expect([...side]).toEqual([0, -1]);
  });

  it("does not read beyond the shortest supplied buffer", () => {
    const mid = new Float32Array([9, 9]);
    const side = new Float32Array([9, 9]);

    toMidSide(
      new Float32Array([0.5]),
      new Float32Array([0.25, 1]),
      mid,
      side,
    );

    expect([...mid]).toEqual([0.375, 9]);
    expect([...side]).toEqual([0.125, 9]);
  });
});
