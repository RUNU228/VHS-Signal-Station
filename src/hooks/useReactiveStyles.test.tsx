import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AudioReactiveSnapshot, AudioVisualizationBus } from "@/types/audio";
import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import { useReactiveStyles } from "./useReactiveStyles";

let frameCallback: FrameRequestCallback | null = null;

const snapshot: AudioReactiveSnapshot = {
  ...IDLE_AUDIO_SNAPSHOT,
  lowEnergy: 0.2,
  midEnergy: 0.5,
  highEnergy: 0.6,
  overallEnergy: 0.4,
  peakStrength: 0.9,
  smoothedEnergy: 0.45,
};

function fakeBus(current = snapshot): AudioVisualizationBus {
  return {
    frameRef: {
      current: {
        snapshot: current,
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
  };
}

describe("useReactiveStyles", () => {
  beforeEach(() => {
    frameCallback = null;
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        frameCallback = callback;
        return 1;
      }),
    );
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => vi.unstubAllGlobals());

  it("writes bounded audio variables directly to the station root", () => {
    const target = document.createElement("main");
    const targetRef = { current: target };
    const bus = fakeBus({ ...snapshot, lowEnergy: 8, highEnergy: -2 });
    renderHook(() => useReactiveStyles(targetRef, bus, true));

    act(() => frameCallback?.(16));

    expect(target.style.getPropertyValue("--audio-volume")).toBe("0.400");
    expect(target.style.getPropertyValue("--audio-bass")).toBe("1.000");
    expect(target.style.getPropertyValue("--audio-treble")).toBe("0.000");
    expect(target.style.getPropertyValue("--audio-smoothed")).toBe("0.450");
    expect(target.style.getPropertyValue("--signal-strength")).toBe("0.400");
    expect(target.style.getPropertyValue("--peak-strength")).toBe("0.900");
    expect(target.style.getPropertyValue("--background-reactivity")).toBe("0.450");
    expect(target.style.getPropertyValue("--audio-low")).toBe("1.000");
    expect(target.style.getPropertyValue("--audio-high")).toBe("0.000");
    expect(target.style.getPropertyValue("--signal-color")).toMatch(/^rgba\(/);
    expect(target.dataset.audioActive).toBe("true");
  });

  it("keeps the animation out of React state and cleans up projected values", () => {
    let renders = 0;
    const target = document.createElement("main");
    const targetRef = createRef<HTMLElement>();
    targetRef.current = target;
    const unsubscribe = vi.fn();
    const bus = fakeBus();
    bus.subscribe = vi.fn(() => unsubscribe);
    const { unmount } = renderHook(() => {
      renders += 1;
      useReactiveStyles(targetRef, bus, false);
    });

    expect(renders).toBe(1);
    expect(target.dataset.audioActive).toBe("false");

    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(target.dataset.audioActive).toBeUndefined();
    expect(target.style.getPropertyValue("--audio-volume")).toBe("");
  });
});
