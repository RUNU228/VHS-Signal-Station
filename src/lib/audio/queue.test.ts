import { describe, expect, it } from "vitest";

import { getNextIndex, getPreviousIndex } from "./queue";

describe("queue navigation", () => {
  it("restarts a track that has played for more than three seconds", () => {
    expect(getPreviousIndex(2, 4)).toBe(2);
  });

  it("moves backward near the start without underflowing", () => {
    expect(getPreviousIndex(2, 1)).toBe(1);
    expect(getPreviousIndex(0, 0)).toBe(0);
  });

  it("returns the next track until the finite queue ends", () => {
    expect(getNextIndex(1, 3)).toBe(2);
    expect(getNextIndex(2, 3)).toBeNull();
  });
});
