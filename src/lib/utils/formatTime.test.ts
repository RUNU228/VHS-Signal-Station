import { describe, expect, it } from "vitest";

import { formatTime } from "./formatTime";

describe("formatTime", () => {
  it("renders minute timestamps for ordinary tracks", () => {
    expect(formatTime(222)).toBe("03:42");
  });

  it("adds an hours field for long recordings", () => {
    expect(formatTime(3822)).toBe("01:03:42");
  });

  it("normalizes invalid and negative positions", () => {
    expect(formatTime(Number.NaN)).toBe("00:00");
    expect(formatTime(-4)).toBe("00:00");
  });
});
