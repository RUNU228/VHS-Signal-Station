"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";

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

function emptyFrame(snapshot: AudioReactiveSnapshot): AudioVisualizationFrame {
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
    quality: "HIGH",
    reducedMotion: false,
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
  const [initial] = useState(() => {
    const state = createAudioAnalysisState();
    return { state, frame: emptyFrame(state.snapshot) };
  });
  const frameRef = useRef<AudioVisualizationFrame>(initial.frame);
  const analysisStateRef = useRef<AudioAnalysisState>(initial.state);
  const qualityRef = useRef<{ quality: VisualQuality; reducedMotion: boolean }>({
    quality: "HIGH",
    reducedMotion: false,
  });
  const listenersRef = useRef(new Set<AudioVisualizationListener>());
  const synchronizeClockRef = useRef<() => void>(() => {});
  const resetKeyRef = useRef(options.resetKey);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const low = window.matchMedia("(max-width: 760px)");
    const medium = window.matchMedia("(min-width: 761px) and (max-width: 1100px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateQuality = () => {
      qualityRef.current = {
        quality: low.matches ? "LOW" : medium.matches ? "MEDIUM" : "HIGH",
        reducedMotion: reduced.matches,
      };
      Object.assign(frameRef.current, qualityRef.current);
    };
    updateQuality();
    const queries = [low, medium, reduced];
    for (const query of queries) query.addEventListener("change", updateQuality);
    return () => {
      for (const query of queries) query.removeEventListener("change", updateQuality);
    };
  }, []);

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
    const { quality, reducedMotion } = qualityRef.current;
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
      const { quality, reducedMotion } = qualityRef.current;

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
