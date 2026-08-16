import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type {
  AudioVisualizationBus,
  AudioVisualizationListener,
} from "@/types/audio";
import { useVisualizationFrame } from "./useVisualizationFrame";

function fakeBus(overrides: Partial<AudioVisualizationBus> = {}): AudioVisualizationBus {
  return {
    frameRef: {
      current: {
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
      },
    },
    subscribe: vi.fn(() => vi.fn()),
    ...overrides,
  };
}

describe("useVisualizationFrame", () => {
  afterEach(() => vi.restoreAllMocks());

  it("subscribes once, uses the latest callback, and unsubscribes", () => {
    const unsubscribe = vi.fn();
    let subscribed: AudioVisualizationListener = () => {
      throw new Error("Renderer did not subscribe");
    };
    const subscribe = vi.fn((listener: AudioVisualizationListener) => {
      subscribed = listener;
      return unsubscribe;
    });
    const bus = fakeBus({ subscribe });
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ draw }) => useVisualizationFrame(bus, draw, true),
      { initialProps: { draw: first } },
    );

    rerender({ draw: second });

    expect(subscribe).toHaveBeenCalledTimes(1);
    const publishedFrame = bus.frameRef.current;
    subscribed(publishedFrame, 42);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(publishedFrame, 42);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("does not subscribe inactive renderers", () => {
    const subscribe = vi.fn(() => vi.fn());
    const bus = fakeBus({ subscribe });
    renderHook(() => useVisualizationFrame(bus, vi.fn(), false));

    expect(subscribe).not.toHaveBeenCalled();
  });
});
