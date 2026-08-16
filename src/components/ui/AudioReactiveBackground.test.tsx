import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type {
  AudioVisualizationBus,
  AudioVisualizationFrame,
  AudioVisualizationListener,
} from "@/types/audio";
import { AudioReactiveBackground } from "./AudioReactiveBackground";

let resizeCallbacks: ResizeObserverCallback[] = [];

function frame(
  options: Partial<AudioVisualizationFrame> = {},
): AudioVisualizationFrame {
  return {
    snapshot: { ...IDLE_AUDIO_SNAPSHOT },
    frequencyData: new Uint8Array([0, 32, 96, 160, 224, 255]),
    oscilloscopeData: new Float32Array(),
    leftChannelData: new Float32Array(),
    rightChannelData: new Float32Array(),
    sampleRate: 48_000,
    frequencyFftSize: 4_096,
    frameId: 0,
    sourceRevision: 0,
    quality: "HIGH",
    reducedMotion: false,
    ...options,
  };
}

function fakeBus(initialFrame = frame()) {
  const listeners = new Set<AudioVisualizationListener>();
  const analysis: AudioVisualizationBus = {
    frameRef: { current: initialFrame },
    subscribe: vi.fn((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };

  return {
    analysis,
    publish(nextFrame = initialFrame, time = 16) {
      analysis.frameRef.current = nextFrame;
      for (const listener of listeners) listener(nextFrame, time);
    },
  };
}

function canvasContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() } as unknown as CanvasGradient;
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    stroke: vi.fn(),
    fillStyle: "",
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: "",
  } as unknown as CanvasRenderingContext2D;
}

describe("AudioReactiveBackground", () => {
  beforeEach(() => {
    resizeCallbacks = [];
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
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
      <AudioReactiveBackground analysis={fakeBus().analysis} active={false} />,
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
      render(<AudioReactiveBackground analysis={fakeBus().analysis} active />),
    ).not.toThrow();
  });

  it("draws persistent idle frames from the shared bus without a private RAF", () => {
    const context = canvasContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const bus = fakeBus();

    render(<AudioReactiveBackground analysis={bus.analysis} active={false} />);
    act(() => bus.publish(frame(), 0));

    expect(bus.analysis.subscribe).toHaveBeenCalledTimes(1);
    expect(context.clearRect).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("keeps low-quality drawing close to 30 frames per second", () => {
    const context = canvasContext();
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const lowFrame = frame({ quality: "LOW" });
    const bus = fakeBus(lowFrame);
    render(<AudioReactiveBackground analysis={bus.analysis} active />);

    for (const time of [0, 16, 32, 48, 64]) {
      act(() => bus.publish(lowFrame, time));
    }

    expect(context.clearRect).toHaveBeenCalledTimes(3);
  });

  it("keeps the reduced low-quality resolution after a canvas resize", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 200,
    } as DOMRect);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);

    const { container } = render(
      <AudioReactiveBackground
        analysis={fakeBus(frame({ quality: "LOW" })).analysis}
        active
      />,
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
