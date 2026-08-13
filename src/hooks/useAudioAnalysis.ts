"use client";

import { useEffect, useRef, type MutableRefObject } from "react";

import {
  IDLE_AUDIO_SNAPSHOT,
  analyseFrequencyData,
} from "@/lib/audio/analysis";
import type {
  AudioAnalyserBundle,
  AudioReactiveSnapshot,
} from "@/types/audio";

const DECAY_THRESHOLD = 0.001;

function hasAudibleEnergy(snapshot: AudioReactiveSnapshot): boolean {
  return Object.values(snapshot).some((value) => value > DECAY_THRESHOLD);
}

export function useAudioAnalysis(
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>,
  active: boolean,
): MutableRefObject<AudioReactiveSnapshot> {
  const snapshotRef = useRef<AudioReactiveSnapshot>({ ...IDLE_AUDIO_SNAPSHOT });
  const binsRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return;

    let disposed = false;
    let frame = 0;

    const schedule = () => {
      if (disposed || document.hidden || frame !== 0) return;
      frame = requestAnimationFrame(sample);
    };

    const sample = () => {
      frame = 0;
      if (disposed || document.hidden) return;

      const bundle = analysersRef.current;
      const analyser = bundle?.frequency;
      if (active && bundle && analyser) {
        if (
          binsRef.current === null ||
          binsRef.current.length !== analyser.frequencyBinCount
        ) {
          binsRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(binsRef.current);
        snapshotRef.current = analyseFrequencyData({
          bins: binsRef.current,
          sampleRate: bundle.context.sampleRate,
          fftSize: analyser.fftSize,
          previous: snapshotRef.current,
        });
      } else if (hasAudibleEnergy(snapshotRef.current)) {
        const fftSize = analyser?.fftSize ?? 4_096;
        const length = analyser?.frequencyBinCount ?? fftSize / 2;
        if (binsRef.current === null || binsRef.current.length !== length) {
          binsRef.current = new Uint8Array(length);
        } else {
          binsRef.current.fill(0);
        }
        snapshotRef.current = analyseFrequencyData({
          bins: binsRef.current,
          sampleRate: bundle?.context.sampleRate ?? 48_000,
          fftSize,
          previous: snapshotRef.current,
        });
        if (!hasAudibleEnergy(snapshotRef.current)) {
          snapshotRef.current = { ...IDLE_AUDIO_SNAPSHOT };
        }
      }

      if (active || hasAudibleEnergy(snapshotRef.current)) schedule();
    };

    const handleVisibility = () => {
      if (document.hidden) {
        if (frame !== 0) cancelAnimationFrame(frame);
        frame = 0;
        return;
      }
      if (active || hasAudibleEnergy(snapshotRef.current)) schedule();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    if (active || hasAudibleEnergy(snapshotRef.current)) schedule();

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [active, analysersRef]);

  return snapshotRef;
}
