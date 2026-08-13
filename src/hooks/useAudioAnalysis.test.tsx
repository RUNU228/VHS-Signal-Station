import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type { AudioAnalyserBundle } from "@/types/audio";
import { useAudioAnalysis } from "./useAudioAnalysis";

let nextFrame = 1;
let frames = new Map<number, FrameRequestCallback>();

function runNextFrame(time = 16): void {
  const entry = frames.entries().next().value as
    | [number, FrameRequestCallback]
    | undefined;
  if (!entry) throw new Error("No animation frame was scheduled");
  frames.delete(entry[0]);
  entry[1](time);
}

function analyserBundle(fill = 255): AudioAnalyserBundle {
  const frequency = {
    frequencyBinCount: 2_048,
    fftSize: 4_096,
    getByteFrequencyData: vi.fn((target: Uint8Array) => target.fill(fill)),
  } as unknown as AnalyserNode;
  return {
    context: { sampleRate: 48_000 } as AudioContext,
    frequency,
    oscilloscope: {} as AnalyserNode,
    left: {} as AnalyserNode,
    right: {} as AnalyserNode,
  };
}

describe("useAudioAnalysis", () => {
  beforeEach(() => {
    nextFrame = 1;
    frames = new Map();
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn((callback: FrameRequestCallback) => {
        const id = nextFrame;
        nextFrame += 1;
        frames.set(id, callback);
        return id;
      }),
    );
    vi.stubGlobal(
      "cancelAnimationFrame",
      vi.fn((id: number) => {
        frames.delete(id);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("samples into one stable ref without causing a React render loop", () => {
    const analysersRef = { current: analyserBundle() };
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useAudioAnalysis(analysersRef, true);
    });
    const stableRef = result.current;

    act(() => runNextFrame());

    expect(result.current).toBe(stableRef);
    expect(result.current.current.bass).toBeGreaterThan(0);
    expect(renders).toBe(1);
  });

  it("cancels the active loop and decays smoothly when playback stops", () => {
    const analysersRef = { current: analyserBundle() };
    const { result, rerender } = renderHook(
      ({ active }) => useAudioAnalysis(analysersRef, active),
      { initialProps: { active: true } },
    );
    act(() => runNextFrame());
    const playingVolume = result.current.current.volume;

    rerender({ active: false });
    expect(cancelAnimationFrame).toHaveBeenCalled();
    act(() => runNextFrame(32));

    expect(result.current.current.volume).toBeLessThan(playingVolume);
    expect(result.current.current.volume).toBeGreaterThan(0);
  });

  it("leaves the idle snapshot intact when no analyser is available", () => {
    const analysersRef = createRef<AudioAnalyserBundle | null>();
    const { result } = renderHook(() => useAudioAnalysis(analysersRef, true));

    act(() => runNextFrame());

    expect(result.current.current).toEqual(IDLE_AUDIO_SNAPSHOT);
  });

  it("pauses sampling while the document is hidden and resumes when visible", () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const analysersRef = { current: analyserBundle() };
    renderHook(() => useAudioAnalysis(analysersRef, true));

    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(frames).toHaveLength(0);

    hidden = false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(frames).toHaveLength(1);
  });
});
