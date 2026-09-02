import { describe, expect, it } from "vitest";
import { signalColorForLevel } from "./signalTheme";
import { createSpectrogramColors } from "./spectrogram";

describe("spectrogram cached colors", () => {
  it("preserves the exact previous RGBA output for every byte and history age", () => {
    const colorFor = createSpectrogramColors();
    for (let column = 0; column < 72; column++) {
      for (let byte = 0; byte < 256; byte++) {
        const energy = byte / 255;
        const expected = signalColorForLevel(energy, Math.max(0.08, energy * (0.42 + column / 72 * 0.58)));
        expect(colorFor(byte, column)).toBe(expected);
        expect(colorFor(byte, column)).toBe(expected);
      }
    }
  });
});
