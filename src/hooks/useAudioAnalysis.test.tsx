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

function analyserBundle(
  frequencyFrames: number | readonly Uint8Array[] = 255,
): AudioAnalyserBundle {
  let frequencyFrame = 0;
  const frequency = {
    frequencyBinCount: 2_048,
    fftSize: 4_096,
    getByteFrequencyData: vi.fn((target: Uint8Array) => {
      if (typeof frequencyFrames === "number") {
        target.fill(frequencyFrames);
        return;
      }

      const source = frequencyFrames[
        Math.min(frequencyFrame, frequencyFrames.length - 1)
      ];
      frequencyFrame += 1;
      target.set(source);
    }),
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

function frequencyBins(
  baseline: number,
  ranges: readonly (readonly [start: number, end: number, value: number])[] = [],
): Uint8Array {
  const bins = new Uint8Array(2_048).fill(baseline);
  for (const [start, end, value] of ranges) bins.fill(value, start, end);
  return bins;
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
    vi.restoreAllMocks();
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
    expect(result.current.frameRef.current.snapshot.bassEnergy).toBeGreaterThan(0);
    expect(Object.keys(result.current).sort()).toEqual(["frameRef", "subscribe"]);
    expect(renders).toBe(1);
  });

  it("cancels the active loop and decays smoothly when playback stops", () => {
    const analysersRef = { current: analyserBundle() };
    const { result, rerender } = renderHook(
      ({ active }) => useAudioAnalysis(analysersRef, { active, resetKey: "track-a" }),
      { initialProps: { active: true } },
    );
    act(() => runNextFrame());
    const playingEnergy = result.current.frameRef.current.snapshot.overallEnergy;

    rerender({ active: false });
    expect(cancelAnimationFrame).toHaveBeenCalled();
    act(() => runNextFrame(32));

    expect(result.current.frameRef.current.snapshot.overallEnergy).toBeLessThan(playingEnergy);
    expect(result.current.frameRef.current.snapshot.overallEnergy).toBeGreaterThan(0);
  });

  it("leaves the idle snapshot intact when no analyser is available", () => {
    const analysersRef = createRef<AudioAnalyserBundle | null>();
    const { result } = renderHook(() =>
      useAudioAnalysis(analysersRef, { active: true, resetKey: null }),
    );

    expect(result.current.frameRef.current.snapshot).toEqual(IDLE_AUDIO_SNAPSHOT);
    expect(frames).toHaveLength(0);
  });

  it("wakes and sustains the idle clock while a subscriber is active", () => {
    const analysersRef = createRef<AudioAnalyserBundle | null>();
    const listener = vi.fn();
    const { result } = renderHook(() =>
      useAudioAnalysis(analysersRef, { active: true, resetKey: null }),
    );

    expect(frames).toHaveLength(0);
    const unsubscribe = result.current.subscribe(listener);
    expect(frames).toHaveLength(1);

    act(() => runNextFrame(16));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(1);
    unsubscribe();
  });

  it("stops the idle clock when its final subscriber unsubscribes", () => {
    const analysersRef = createRef<AudioAnalyserBundle | null>();
    const { result } = renderHook(() =>
      useAudioAnalysis(analysersRef, { active: true, resetKey: null }),
    );

    const unsubscribe = result.current.subscribe(vi.fn());
    expect(frames).toHaveLength(1);
    unsubscribe();

    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(0);
  });

  it("does not schedule frames for peak metadata after energy has decayed", () => {
    const analysersRef = createRef<AudioAnalyserBundle | null>();
    const { result, rerender } = renderHook(
      ({ active }) => useAudioAnalysis(analysersRef, { active, resetKey: "track-a" }),
      { initialProps: { active: false } },
    );

    result.current.frameRef.current.snapshot = {
      ...IDLE_AUDIO_SNAPSHOT,
      peakEventId: 1,
      peakSeed: 0.618,
    };
    rerender({ active: true });

    expect(frames).toHaveLength(0);
  });

  it("cancels the sole root frame while hidden and resumes with exactly one frame", () => {
    let hidden = false;
    vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
    const analysersRef = { current: analyserBundle() };
    const { unmount } = renderHook(() =>
      useAudioAnalysis(analysersRef, { active: true, resetKey: "track-a" }),
    );

    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(1);

    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(0);

    hidden = false;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    expect(frames).toHaveLength(1);

    unmount();
    expect(cancelAnimationFrame).toHaveBeenCalledTimes(2);
    expect(frames).toHaveLength(0);
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

  it("publishes deterministic snapshots for representative synthetic signal profiles", () => {
    const quiet = frequencyBins(8);
    const normal = frequencyBins(100);
    const bassHeavy = frequencyBins(24, [[3, 22, 240]]);
    const highHeavy = frequencyBins(24, [[342, 1_707, 240]]);
    const loud = frequencyBins(220);
    const clipped = frequencyBins(255);

    const sample = (frequencyFrames: readonly Uint8Array[]) => {
      const analysersRef = { current: analyserBundle(frequencyFrames) };
      const { result, unmount } = renderHook(() =>
        useAudioAnalysis(analysersRef, { active: true, resetKey: "profile" }),
      );
      const snapshots = frequencyFrames.map((_, index) => {
        act(() => runNextFrame((index + 1) * 160));
        return { ...result.current.frameRef.current.snapshot };
      });
      unmount();
      return snapshots;
    };

    const first = {
      quiet: sample([quiet])[0],
      normal: sample([normal])[0],
      bassHeavy: sample([bassHeavy])[0],
      highHeavy: sample([highHeavy])[0],
      sustainedLoud: sample([loud, loud]),
      sharpTransient: sample([quiet, clipped]),
      clipped: sample([clipped])[0],
    };
    const second = {
      quiet: sample([quiet])[0],
      normal: sample([normal])[0],
      bassHeavy: sample([bassHeavy])[0],
      highHeavy: sample([highHeavy])[0],
      sustainedLoud: sample([loud, loud]),
      sharpTransient: sample([quiet, clipped]),
      clipped: sample([clipped])[0],
    };

    expect(second).toEqual(first);
    expect(first.quiet.signalState).toBe("IDLE");
    expect(first.normal.overallEnergy).toBeGreaterThan(first.quiet.overallEnergy);
    expect(first.normal.peakEventId).toBe(0);
    expect(first.bassHeavy.lowEnergy).toBeGreaterThan(first.bassHeavy.midEnergy);
    expect(first.bassHeavy.lowEnergy).toBeGreaterThan(first.bassHeavy.highEnergy);
    expect(first.highHeavy.highEnergy).toBeGreaterThan(first.highHeavy.lowEnergy);
    expect(first.highHeavy.highEnergy).toBeGreaterThan(first.highHeavy.midEnergy);
    expect(first.sustainedLoud[0].peakEventId).toBe(1);
    expect(first.sustainedLoud[1].peakEventId).toBe(1);
    expect(first.sustainedLoud[1].transientEnergy).toBeLessThan(
      first.sustainedLoud[0].transientEnergy,
    );
    expect(first.sharpTransient[1].peakStrength).toBeGreaterThan(0);
    expect(first.sharpTransient[1].transientEnergy).toBeGreaterThan(
      first.sustainedLoud[1].transientEnergy,
    );
    const { signalState, peakEventId, peakSeed, ...clippedNumericFields } = first.clipped;
    expect(signalState).not.toBe("IDLE");
    expect(peakEventId).toBe(1);
    expect(peakSeed).toBeGreaterThan(0);
    for (const value of Object.values(clippedNumericFields)) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(-1);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});
