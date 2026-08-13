import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import { AudioReactiveBackground } from "./AudioReactiveBackground";

const idleRef = { current: { ...IDLE_AUDIO_SNAPSHOT } };

describe("AudioReactiveBackground", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders exactly one non-interactive background canvas", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const { container } = render(
      <AudioReactiveBackground reactiveRef={idleRef} active={false} />,
    );
    const canvases = container.querySelectorAll(
      "canvas.audio-reactive-background",
    );

    expect(canvases).toHaveLength(1);
    expect(canvases[0]).toHaveAttribute("aria-hidden", "true");
  });

  it("keeps the page usable when a 2d context is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    expect(() =>
      render(<AudioReactiveBackground reactiveRef={idleRef} active />),
    ).not.toThrow();
  });
});
