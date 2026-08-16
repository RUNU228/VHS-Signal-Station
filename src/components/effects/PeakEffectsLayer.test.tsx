import { act, render } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type {
  AudioVisualizationBus,
  AudioVisualizationFrame,
  AudioVisualizationListener,
} from "@/types/audio";

const rendererSpies = vi.hoisted(() => ({
  create: vi.fn(),
  resize: vi.fn(),
  render: vi.fn(),
  dispose: vi.fn(),
}));

vi.mock("@/lib/webgl/vhsSignalRenderer", () => ({
  createVhsSignalRenderer: rendererSpies.create,
}));

import { PeakEffectsLayer } from "./PeakEffectsLayer";

function frame(
  options: Partial<AudioVisualizationFrame> = {},
): AudioVisualizationFrame {
  return {
    snapshot: { ...IDLE_AUDIO_SNAPSHOT },
    frequencyData: new Uint8Array(),
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

function peakFrame(
  peakEventId: number,
  options: Partial<AudioVisualizationFrame> = {},
): AudioVisualizationFrame {
  return frame({
    ...options,
    snapshot: {
      ...IDLE_AUDIO_SNAPSHOT,
      peakEventId,
      peakSeed: peakEventId * 101,
      peakStrength: 0.96,
      highEnergy: 0.8,
    },
  });
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
    listenerCount: () => listeners.size,
    publish(nextFrame: AudioVisualizationFrame, time: number) {
      analysis.frameRef.current = nextFrame;
      for (const listener of listeners) listener(nextFrame, time);
    },
  };
}

function renderLayer(initialFrame = frame()) {
  const target = document.createElement("main");
  document.body.append(target);
  const targetRef = createRef<HTMLElement>();
  targetRef.current = target;
  const bus = fakeBus(initialFrame);
  const view = render(
    <PeakEffectsLayer analysis={bus.analysis} targetRef={targetRef} />,
  );
  return { ...view, bus, target };
}

describe("PeakEffectsLayer", () => {
  let disconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    disconnect = vi.fn();
    vi.stubGlobal("devicePixelRatio", 3);
    vi.stubGlobal("ResizeObserver", class {
      observe = vi.fn();
      disconnect = disconnect;
      unobserve = vi.fn();
    });
    rendererSpies.create.mockReturnValue({
      resize: rendererSpies.resize,
      render: rendererSpies.render,
      dispose: rendererSpies.dispose,
    });
    vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 240,
    } as DOMRect);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.querySelectorAll("main").forEach((node) => node.remove());
  });

  it("renders one non-interactive progressive-enhancement canvas", () => {
    const { container } = renderLayer();
    const canvas = container.querySelector("canvas.peak-effects-layer");

    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(rendererSpies.create).toHaveBeenCalledTimes(1);
    expect(rendererSpies.resize).toHaveBeenCalledWith(400, 240, 2);
  });

  it("starts only on a new confirmed peak id within the current source revision", () => {
    const { bus, target } = renderLayer();

    act(() => bus.publish(peakFrame(1), 100));
    const firstFlash = target.style.getPropertyValue("--peak-flash");
    expect(firstFlash).not.toBe("");
    expect(rendererSpies.render).toHaveBeenLastCalledWith(100, expect.objectContaining({ seed: 101 }), 0);

    act(() => bus.publish(peakFrame(1), 260));
    expect(target.style.getPropertyValue("--peak-flash")).toBe("");

    act(() => bus.publish(peakFrame(1), 300));
    expect(target.style.getPropertyValue("--peak-flash")).toBe("");
  });

  it("does no GPU work for idle frames", () => {
    const { bus } = renderLayer();

    act(() => bus.publish(frame({ frameId: 1 }), 16));
    act(() => bus.publish(frame({ frameId: 2 }), 32));

    expect(rendererSpies.render).not.toHaveBeenCalled();
  });

  it("clears an active effect if the next id is not a confirmed peak", () => {
    const { bus, target } = renderLayer();
    act(() => bus.publish(peakFrame(1), 100));
    expect(target.style.getPropertyValue("--peak-flash")).not.toBe("");

    act(() => bus.publish(frame({ frameId: 2 }), 110));

    expect(target.style.getPropertyValue("--peak-flash")).toBe("");
    expect(rendererSpies.render).toHaveBeenLastCalledWith(110, null, 1);
  });

  it("clears and ignores a peak carried by a new source revision", () => {
    const { bus, target } = renderLayer();
    act(() => bus.publish(peakFrame(1), 100));
    expect(target.style.getPropertyValue("--peak-noise")).not.toBe("");

    act(() => bus.publish(peakFrame(2, { sourceRevision: 1 }), 110));
    expect(target.style.getPropertyValue("--peak-noise")).toBe("");
    expect(rendererSpies.render).toHaveBeenLastCalledWith(110, null, 1);

    act(() => bus.publish(peakFrame(3, { sourceRevision: 1 }), 120));
    expect(target.style.getPropertyValue("--peak-noise")).not.toBe("");
  });

  it("uses the low-quality DPR cap and removes aggressive reduced-motion variables", () => {
    const { bus, target } = renderLayer(frame({ quality: "LOW" }));
    expect(rendererSpies.resize).toHaveBeenLastCalledWith(400, 240, 1.25);

    act(() => bus.publish(peakFrame(1, { quality: "LOW", reducedMotion: true }), 100));

    expect(target.style.getPropertyValue("--peak-shake-x")).toBe("0px");
    expect(target.style.getPropertyValue("--peak-shake-y")).toBe("0px");
    expect(target.style.getPropertyValue("--peak-scale")).toBe("0");
    expect(Number.parseFloat(target.style.getPropertyValue("--peak-flash"))).toBeLessThanOrEqual(0.08);
  });

  it("keeps the bounded CSS glow when WebGL initialization fails", () => {
    rendererSpies.create.mockReturnValueOnce(null);
    const { bus, target } = renderLayer();

    act(() => bus.publish(peakFrame(1), 100));

    expect(target.style.getPropertyValue("--peak-flash")).not.toBe("");
    expect(target.style.getPropertyValue("--peak-noise")).not.toBe("");
  });

  it("falls back on context loss and recreates the renderer after restoration", () => {
    const firstRenderer = {
      resize: rendererSpies.resize,
      render: rendererSpies.render,
      dispose: rendererSpies.dispose,
    };
    const restoredRenderer = {
      resize: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
    };
    rendererSpies.create
      .mockReturnValueOnce(firstRenderer)
      .mockReturnValueOnce(restoredRenderer);
    const { container } = renderLayer();
    const canvas = container.querySelector("canvas")!;
    const loss = new Event("webglcontextlost", { cancelable: true });

    act(() => canvas.dispatchEvent(loss));
    expect(loss.defaultPrevented).toBe(true);
    expect(rendererSpies.dispose).toHaveBeenCalledTimes(1);

    act(() => canvas.dispatchEvent(new Event("webglcontextrestored")));
    expect(rendererSpies.create).toHaveBeenCalledTimes(2);
    expect(restoredRenderer.resize).toHaveBeenCalledWith(400, 240, 2);
  });

  it("disposes subscriptions, observers, renderer, listeners, and inline variables", () => {
    const { bus, target, unmount } = renderLayer();
    act(() => bus.publish(peakFrame(1), 100));
    expect(bus.listenerCount()).toBe(1);

    unmount();

    expect(bus.listenerCount()).toBe(0);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(rendererSpies.dispose).toHaveBeenCalledTimes(1);
    for (const variable of [
      "--peak-shake-x",
      "--peak-shake-y",
      "--peak-scale",
      "--peak-rgb-offset",
      "--peak-flash",
      "--peak-noise",
    ]) {
      expect(target.style.getPropertyValue(variable)).toBe("");
    }
  });
});
