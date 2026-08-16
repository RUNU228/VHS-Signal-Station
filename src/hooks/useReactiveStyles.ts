"use client";

import { useEffect, type RefObject } from "react";

import { createSignalTheme, signalColor } from "@/lib/visualization/signalTheme";
import type { AudioReactiveSnapshot, AudioVisualizationBus } from "@/types/audio";

const LEGACY_PROJECTIONS = [
  ["volume", "--audio-volume"],
  ["bass", "--audio-bass"],
  ["mid", "--audio-mid"],
  ["treble", "--audio-treble"],
  ["peak", "--audio-peak"],
  ["smoothed", "--audio-smoothed"],
] as const satisfies ReadonlyArray<
  readonly [keyof AudioReactiveSnapshot, `--audio-${string}`]
>;

const SHARED_PROJECTIONS = [
  ["overallEnergy", "--signal-strength"],
  ["peakStrength", "--peak-strength"],
  ["smoothedEnergy", "--background-reactivity"],
  ["lowEnergy", "--audio-low"],
  ["midEnergy", "--audio-mid"],
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

    const project = (snapshot: AudioReactiveSnapshot) => {
      const theme = createSignalTheme(snapshot);
      const projections: readonly (readonly [string, string])[] = [
        ...LEGACY_PROJECTIONS.map(([key, variable]) => [
          variable,
          formatEnergy(snapshot[key]),
        ] as const),
        ...SHARED_PROJECTIONS.map(([key, variable]) => [
          variable,
          formatEnergy(snapshot[key]),
        ] as const),
        ["--signal-color", signalColor(theme)],
        ["--signal-glow", formatEnergy(theme.glow)],
      ];

      for (const [variable, value] of projections) {
        if (previous.get(variable) === value) continue;
        target.style.setProperty(variable, value);
        previous.set(variable, value);
      }
    };

    project(bus.frameRef.current.snapshot);
    const unsubscribe = bus.subscribe((frame) => project(frame.snapshot));

    return () => {
      unsubscribe();
      delete target.dataset.audioActive;
      for (const [, variable] of LEGACY_PROJECTIONS) target.style.removeProperty(variable);
      for (const [, variable] of SHARED_PROJECTIONS) target.style.removeProperty(variable);
      target.style.removeProperty("--signal-color");
      target.style.removeProperty("--signal-glow");
    };
  }, [active, bus, targetRef]);
}
