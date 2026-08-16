import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AudioReactiveSnapshot } from "@/types/audio";
import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import { useReactiveStyles } from "./useReactiveStyles";

let frameCallback: FrameRequestCallback | null = null;

const snapshot: AudioReactiveSnapshot = {
  ...IDLE_AUDIO_SNAPSHOT,
  volume: 0.4,
  bass: 0.8,
  lowMid: 0.3,
  mid: 0.5,
  highMid: 0.2,
  treble: 0.6,
  peak: 0.9,
  smoothed: 0.45,
};

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
    const snapshotRef = { current: { ...snapshot, bass: 8, treble: -2 } };
    renderHook(() => useReactiveStyles(targetRef, snapshotRef, true));

    act(() => frameCallback?.(16));

    expect(target.style.getPropertyValue("--audio-volume")).toBe("0.400");
    expect(target.style.getPropertyValue("--audio-bass")).toBe("1.000");
    expect(target.style.getPropertyValue("--audio-treble")).toBe("0.000");
    expect(target.style.getPropertyValue("--audio-smoothed")).toBe("0.450");
    expect(target.dataset.audioActive).toBe("true");
  });

  it("keeps the animation out of React state and cleans up projected values", () => {
    let renders = 0;
    const target = document.createElement("main");
    const targetRef = createRef<HTMLElement>();
    targetRef.current = target;
    const snapshotRef = { current: snapshot };
    const { unmount } = renderHook(() => {
      renders += 1;
      useReactiveStyles(targetRef, snapshotRef, false);
    });

    act(() => frameCallback?.(16));
    expect(renders).toBe(1);
    expect(target.dataset.audioActive).toBe("false");

    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(target.dataset.audioActive).toBeUndefined();
    expect(target.style.getPropertyValue("--audio-volume")).toBe("");
  });
});
