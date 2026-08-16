import type { AudioVisualizationFrame } from "@/types/audio";

export type BackgroundPolicy = {
  opacity: number;
  traceAmplitude: number;
  traceSpeed: number;
  deformation: number;
  bandCount: number;
  grainCount: number;
  frameInterval: number;
  shake: number;
};

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(
    maximum,
    Math.max(minimum, Number.isFinite(value) ? value : minimum),
  );
}

export function backgroundPolicy(
  frame: AudioVisualizationFrame,
): BackgroundPolicy {
  const { snapshot, quality, reducedMotion } = frame;
  const overallEnergy = clamp(snapshot.overallEnergy);
  const midEnergy = clamp(snapshot.midEnergy);
  const highEnergy = clamp(snapshot.highEnergy);
  const transientEnergy = clamp(snapshot.transientEnergy);
  const peakStrength = clamp(snapshot.peakStrength);
  const opacity = clamp(
    0.04 + overallEnergy * 0.22 + peakStrength * 0.07,
    0.03,
    0.35,
  );
  const frameInterval = reducedMotion
    ? 120
    : quality === "LOW"
      ? 1000 / 30
      : 1000 / 60;
  const bandCount = quality === "HIGH" ? 5 : quality === "MEDIUM" ? 4 : 3;
  const deformation = reducedMotion
    ? 0
    : midEnergy * 0.018 + peakStrength * 0.012;
  const grainBase = quality === "HIGH" ? 220 : quality === "MEDIUM" ? 140 : 70;

  return {
    opacity,
    traceAmplitude: clamp(0.005 + overallEnergy * 0.018 + highEnergy * 0.012, 0.004, 0.04),
    traceSpeed: reducedMotion ? 0.06 : 0.18 + transientEnergy * 0.42,
    deformation,
    bandCount,
    grainCount: Math.round(grainBase * (0.75 + highEnergy * 0.25)),
    frameInterval,
    shake: reducedMotion ? 0 : peakStrength * 0.006,
  };
}
