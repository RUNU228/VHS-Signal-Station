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
    oscilloscope: {
      fftSize: 4_096,
      getFloatTimeDomainData: vi.fn((target: Float32Array) => target.fill(0.25)),
    } as unknown as AnalyserNode,
    left: {
      fftSize: 4_096,
      getFloatTimeDomainData: vi.fn((target: Float32Array) => target.fill(0.5)),
    } as unknown as AnalyserNode,
    right: {
      fftSize: 4_096,
      getFloatTimeDomainData: vi.fn((target: Float32Array) => target.fill(-0.5)),
    } as unknown as AnalyserNode,
  };
}

function spiedBundle(fill = 255) {
  const bundle = analyserBundle(fill);
  return {
    analysersRef: { current: bundle },
    frequency: bundle.frequency,
    oscilloscope: bundle.oscilloscope,
    left: bundle.left,
    right: bundle.right,
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

  it("samples every analyser once and publishes one shared frame", () => {
    const { analysersRef, frequency, oscilloscope, left, right } = spiedBundle();
    const listener = vi.fn();
    const { result } = renderHook(() =>
      useAudioAnalysis(analysersRef, { active: true, resetKey: "track-a" }),
    );
    const unsubscribe = result.current.subscribe(listener);

    act(() => runNextFrame(16));

    expect(frequency.getByteFrequencyData).toHaveBeenCalledTimes(1);
    expect(oscilloscope.getFloatTimeDomainData).toHaveBeenCalledTimes(1);
    expect(left.getFloatTimeDomainData).toHaveBeenCalledTimes(1);
    expect(right.getFloatTimeDomainData).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(result.current.frameRef.current, 16);
    unsubscribe();
  });

  it("samples into one stable bus without causing a React render loop", () => {
    const analysersRef = { current: analyserBundle() };
    let renders = 0;
    const { result } = renderHook(() => {
      renders += 1;
      return useAudioAnalysis(analysersRef, { active: true, resetKey: "track-a" });
    });
    const stableBus = result.current;

    act(() => runNextFrame());

    expect(result.current).toBe(stableBus);
    expect(result.current.frameRef.current.snapshot.bass).toBeGreaterThan(0);
    expect(renders).toBe(1);
  });

  it("cancels the active loop and decays smoothly when playback stops", () => {
    const analysersRef = { current: analyserBundle() };
    const { result, rerender } = renderHook(
      ({ active }) => useAudioAnalysis(analysersRef, { active, resetKey: "track-a" }),
      { initialProps: { active: true } },
    );
    act(() => runNextFrame());
    const playingVolume = result.current.snapshotRef.current.volume;

    rerender({ active: false });
    expect(cancelAnimationFrame).toHaveBeenCalled();
    act(() => runNextFrame(32));

    expect(result.current.snapshotRef.current.volume).toBeLessThan(playingVolume);
    expect(result.current.snapshotRef.current.volume).toBeGreaterThan(0);
  });

  it("leaves the idle snapshot intact when no analyser is available", () => {
    const analysersRef = createRef<AudioAnalyserBundle | null>();
    const { result } = renderHook(() =>
      useAudioAnalysis(analysersRef, { active: true, resetKey: null }),
    );

    expect(result.current.snapshotRef.current).toEqual(IDLE_AUDIO_SNAPSHOT);
    expect(frames).toHaveLength(0);
  });

  it("does not schedule frames for peak metadata after energy has decayed", () => {
    const analysersRef = createRef<AudioAnalyserBundle | null>();
    const { result, rerender } = renderHook(
      ({ active }) => useAudioAnalysis(analysersRef, { active, resetKey: "track-a" }),
      { initialProps: { active: false } },
    );

    result.current.snapshotRef.current = {
      ...IDLE_AUDIO_SNAPSHOT,
      peakEventId: 1,
      peakSeed: 0.618,
    };
    rerender({ active: true });

    expect(frames).toHaveLength(0);
  });

  it("pauses sampling while the document is hidden and resumes when visible", () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const analysersRef = { current: analyserBundle() };
    renderHook(() => useAudioAnalysis(analysersRef, { active: true, resetKey: "track-a" }));

    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(frames).toHaveLength(0);

    hidden = false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(frames).toHaveLength(1);
  });

  it("clears buffers and peak state when resetKey changes", () => {
    const { analysersRef } = spiedBundle();
    const { result, rerender } = renderHook(
      ({ resetKey }) => useAudioAnalysis(analysersRef, { active: true, resetKey }),
      { initialProps: { resetKey: "track-a" } },
    );

    act(() => runNextFrame(16));
    rerender({ resetKey: "track-b" });

    expect(result.current.frameRef.current.snapshot.peakEventId).toBe(0);
    expect(result.current.frameRef.current.frequencyData.every((value) => value === 0)).toBe(true);
    expect(result.current.frameRef.current.sourceRevision).toBe(1);
  });
});
