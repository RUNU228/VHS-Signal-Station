"use client";

import { useEffect, type RefObject } from "react";

import { createSignalTheme, signalColor } from "@/lib/visualization/signalTheme";
import type { AudioReactiveSnapshot, AudioVisualizationBus } from "@/types/audio";

const ENERGY_PROJECTIONS = [
  ["overallEnergy", "--audio-volume"],
  ["lowEnergy", "--audio-bass"],
  ["midEnergy", "--audio-mid"],
  ["highEnergy", "--audio-treble"],
  ["peakStrength", "--audio-peak"],
  ["smoothedEnergy", "--audio-smoothed"],
  ["overallEnergy", "--signal-strength"],
  ["peakStrength", "--peak-strength"],
  ["smoothedEnergy", "--background-reactivity"],
  ["lowEnergy", "--audio-low"],
  ["highEnergy", "--audio-high"],
] as const satisfies ReadonlyArray<
  readonly [keyof AudioReactiveSnapshot, `--${string}`]
>;

function formatEnergy(value: number): string {
  const bounded = Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  return bounded.toFixed(3);
}

export function useReactiveStyles(
  targetRef: RefObject<HTMLElement | null>,
  bus: AudioVisualizationBus,
  active: boolean,
): void {
  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const previous = new Map<string, string>();
    target.dataset.audioActive = String(active);

    const setVariable = (variable: string, value: string) => {
      if (previous.get(variable) === value) return;
      target.style.setProperty(variable, value);
      previous.set(variable, value);
    };
    const project = (snapshot: AudioReactiveSnapshot) => {
      for (const [key, variable] of ENERGY_PROJECTIONS) {
        setVariable(variable, formatEnergy(snapshot[key]));
      }
      const theme = createSignalTheme(snapshot);
      setVariable("--signal-color", signalColor(theme));
      setVariable("--signal-glow", formatEnergy(theme.glow));
    };

    project(bus.frameRef.current.snapshot);
    const unsubscribe = bus.subscribe((frame) => project(frame.snapshot));

    return () => {
      unsubscribe();
      delete target.dataset.audioActive;
      for (const [, variable] of ENERGY_PROJECTIONS) {
        target.style.removeProperty(variable);
      }
      target.style.removeProperty("--signal-color");
      target.style.removeProperty("--signal-glow");
    };
  }, [active, bus, targetRef]);
}
