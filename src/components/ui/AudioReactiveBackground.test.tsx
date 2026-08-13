import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import { AudioReactiveBackground } from "./AudioReactiveBackground";

const idleRef = { current: { ...IDLE_AUDIO_SNAPSHOT } };
let scheduledFrames: FrameRequestCallback[] = [];
let resizeCallbacks: ResizeObserverCallback[] = [];

describe("AudioReactiveBackground", () => {
  beforeEach(() => {
    scheduledFrames = [];
    resizeCallbacks = [];
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        scheduledFrames.push(callback);
        return scheduledFrames.length;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback);
        }
        observe() {}
        disconnect() {}
        unobserve() {}
      },
    );
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

  it("draws only one scheduled frame when reduced motion is requested", () => {
    vi.mocked(matchMedia).mockImplementation((query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(<AudioReactiveBackground reactiveRef={idleRef} active />);

    expect(scheduledFrames).toHaveLength(1);
    scheduledFrames[0](16);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it("keeps the reduced mobile resolution after a canvas resize", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    vi.mocked(matchMedia).mockImplementation((query: string) => ({
      matches: query === "(max-width: 760px)",
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 200,
    } as DOMRect);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const { container } = render(
      <AudioReactiveBackground reactiveRef={idleRef} active />,
    );
    const canvas = container.querySelector("canvas")!;
    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(150);

    for (const callback of resizeCallbacks) {
      callback([], {} as ResizeObserver);
    }

    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(150);
  });
});
