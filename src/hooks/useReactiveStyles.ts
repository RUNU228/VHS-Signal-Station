"use client";

import { useEffect, type MutableRefObject, type RefObject } from "react";

import type { AudioReactiveSnapshot } from "@/types/audio";

const PROJECTIONS = [
  ["volume", "--audio-volume"],
  ["bass", "--audio-bass"],
  ["mid", "--audio-mid"],
  ["treble", "--audio-treble"],
  ["peak", "--audio-peak"],
  ["smoothed", "--audio-smoothed"],
] as const satisfies ReadonlyArray<
  readonly [keyof AudioReactiveSnapshot, `--audio-${string}`]
>;

function formatEnergy(value: number): string {
  const bounded = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return bounded.toFixed(3);
}

export function useReactiveStyles(
  targetRef: RefObject<HTMLElement | null>,
  snapshotRef: MutableRefObject<AudioReactiveSnapshot>,
  active: boolean,
): void {
  useEffect(() => {
    const target = targetRef.current;
    if (!target || typeof requestAnimationFrame === "undefined") return;

    const previous = new Map<string, string>();
    let frame = 0;
    let disposed = false;

    target.dataset.audioActive = String(active);

    const project = () => {
      frame = 0;
      if (disposed) return;

      for (const [key, variable] of PROJECTIONS) {
        const formatted = formatEnergy(snapshotRef.current[key]);
        if (previous.get(variable) === formatted) continue;
        target.style.setProperty(variable, formatted);
        previous.set(variable, formatted);
      }

      const hasEnergy = PROJECTIONS.some(
        ([key]) => snapshotRef.current[key] > 0.0005,
      );
      if (active || hasEnergy) frame = requestAnimationFrame(project);
    };

    frame = requestAnimationFrame(project);

    return () => {
      disposed = true;
      if (frame !== 0) cancelAnimationFrame(frame);
      delete target.dataset.audioActive;
      for (const [, variable] of PROJECTIONS) {
        target.style.removeProperty(variable);
      }
    };
  }, [active, snapshotRef, targetRef]);
}
