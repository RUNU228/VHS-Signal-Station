"use client";

import { useEffect, useMemo, useRef, type MutableRefObject } from "react";

import {
  IDLE_AUDIO_SNAPSHOT,
  analyseFrequencyData,
  createAudioAnalysisState,
  decayAudioAnalysis,
} from "@/lib/audio/analysis";
import type {
  AudioAnalyserBundle,
  AudioAnalysisState,
  AudioReactiveSnapshot,
  AudioVisualizationBus,
  AudioVisualizationFrame,
  AudioVisualizationListener,
  VisualQuality,
} from "@/types/audio";

const DECAY_THRESHOLD = 0.001;
const AUDIBLE_ENERGY_FIELDS = [
  "overallEnergy",
  "peakStrength",
  "transientEnergy",
] as const;

function hasAudibleEnergy(snapshot: AudioReactiveSnapshot): boolean {
  return AUDIBLE_ENERGY_FIELDS.some(
    (field) => snapshot[field] > DECAY_THRESHOLD,
  );
}

function currentQuality(): { quality: VisualQuality; reducedMotion: boolean } {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return { quality: "HIGH", reducedMotion: false };
  }

  const low = window.matchMedia("(max-width: 760px)").matches;
  const medium = window.matchMedia(
    "(min-width: 761px) and (max-width: 1100px)",
  ).matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return {
    quality: low ? "LOW" : medium ? "MEDIUM" : "HIGH",
    reducedMotion,
  };
}

function emptyFrame(snapshot: AudioReactiveSnapshot): AudioVisualizationFrame {
  const { quality, reducedMotion } = currentQuality();
  return {
    snapshot,
    frequencyData: new Uint8Array(0),
    oscilloscopeData: new Float32Array(0),
    leftChannelData: new Float32Array(0),
    rightChannelData: new Float32Array(0),
    sampleRate: 48_000,
    frequencyFftSize: 4_096,
    frameId: 0,
    sourceRevision: 0,
    quality,
    reducedMotion,
  };
}

function arraysFor(
  frame: AudioVisualizationFrame,
  bundle: AudioAnalyserBundle,
): Pick<
  AudioVisualizationFrame,
  "frequencyData" | "oscilloscopeData" | "leftChannelData" | "rightChannelData"
> {
  const timeDomainLength = bundle.oscilloscope.fftSize;
  return {
    frequencyData: frame.frequencyData.length === bundle.frequency.frequencyBinCount
      ? frame.frequencyData
      : new Uint8Array(bundle.frequency.frequencyBinCount),
    oscilloscopeData: frame.oscilloscopeData.length === timeDomainLength
      ? frame.oscilloscopeData
      : new Float32Array(timeDomainLength),
    leftChannelData: frame.leftChannelData.length === bundle.left.fftSize
      ? frame.leftChannelData
      : new Float32Array(bundle.left.fftSize),
    rightChannelData: frame.rightChannelData.length === bundle.right.fftSize
      ? frame.rightChannelData
      : new Float32Array(bundle.right.fftSize),
  };
}

function clearFrameBuffers(frame: AudioVisualizationFrame): void {
  frame.frequencyData.fill(0);
  frame.oscilloscopeData.fill(0);
  frame.leftChannelData.fill(0);
  frame.rightChannelData.fill(0);
}

export function useAudioAnalysis(
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>,
  options: { active: boolean; resetKey: string | null },
): AudioVisualizationBus {
  const initialSnapshot = { ...IDLE_AUDIO_SNAPSHOT };
  const frameRef = useRef<AudioVisualizationFrame>(emptyFrame(initialSnapshot));
  const analysisStateRef = useRef<AudioAnalysisState>(createAudioAnalysisState());
  const listenersRef = useRef(new Set<AudioVisualizationListener>());
  const synchronizeClockRef = useRef<() => void>(() => {});
  const resetKeyRef = useRef(options.resetKey);

  const publish = (frame: AudioVisualizationFrame, time: number) => {
    frameRef.current = frame;
    for (const listener of [...listenersRef.current]) listener(frame, time);
  };

  const bus = useMemo<AudioVisualizationBus>(
    () => ({
      frameRef,
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        synchronizeClockRef.current();
        return () => {
          listenersRef.current.delete(listener);
          synchronizeClockRef.current();
        };
      },
    }),
    [frameRef],
  );

  useEffect(() => {
    if (resetKeyRef.current === options.resetKey) return;

    resetKeyRef.current = options.resetKey;
    analysisStateRef.current = createAudioAnalysisState();
    const previousFrame = frameRef.current;
    clearFrameBuffers(previousFrame);
    const { quality, reducedMotion } = currentQuality();
    publish({
      ...previousFrame,
      snapshot: { ...IDLE_AUDIO_SNAPSHOT },
      frameId: 0,
      sourceRevision: previousFrame.sourceRevision + 1,
      quality,
      reducedMotion,
    }, globalThis.performance?.now() ?? Date.now());
  }, [options.resetKey]);

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return;

    let disposed = false;
    let frame = 0;

    const shouldSchedule = () => {
      const hasAnalyser = options.active && Boolean(analysersRef.current?.frequency);
      return hasAnalyser ||
        hasAudibleEnergy(frameRef.current.snapshot) ||
        listenersRef.current.size > 0;
    };

    const schedule = () => {
      if (disposed || document.hidden || frame !== 0 || !shouldSchedule()) return;
      frame = requestAnimationFrame(sample);
    };

    const synchronizeClock = () => {
      if (shouldSchedule()) {
        schedule();
      } else if (frame !== 0) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    synchronizeClockRef.current = synchronizeClock;

    const sample = (time: number) => {
      frame = 0;
      if (disposed || document.hidden) return;

      const bundle = analysersRef.current;
      const previousFrame = frameRef.current;
      const { quality, reducedMotion } = currentQuality();

      if (options.active && bundle?.frequency) {
        const buffers = arraysFor(previousFrame, bundle);
        bundle.frequency.getByteFrequencyData(buffers.frequencyData);
        bundle.oscilloscope.getFloatTimeDomainData(buffers.oscilloscopeData);
        bundle.left.getFloatTimeDomainData(buffers.leftChannelData);
        bundle.right.getFloatTimeDomainData(buffers.rightChannelData);

        analysisStateRef.current = analyseFrequencyData({
          bins: buffers.frequencyData,
          sampleRate: bundle.context.sampleRate,
          fftSize: bundle.frequency.fftSize,
          nowMs: time,
          state: analysisStateRef.current,
        });
        publish({
          ...previousFrame,
          ...buffers,
          snapshot: analysisStateRef.current.snapshot,
          sampleRate: bundle.context.sampleRate,
          frequencyFftSize: bundle.frequency.fftSize,
          frameId: previousFrame.frameId + 1,
          quality,
          reducedMotion,
        }, time);
      } else {
        clearFrameBuffers(previousFrame);
        analysisStateRef.current = decayAudioAnalysis(analysisStateRef.current, time);
        publish({
          ...previousFrame,
          snapshot: analysisStateRef.current.snapshot,
          frameId: previousFrame.frameId + 1,
          quality,
          reducedMotion,
        }, time);
      }

      synchronizeClock();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (frame !== 0) cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      synchronizeClock();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    synchronizeClock();

    return () => {
      disposed = true;
      synchronizeClockRef.current = () => {};
      document.removeEventListener("visibilitychange", handleVisibility);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [analysersRef, options.active]);

  return bus;
}
