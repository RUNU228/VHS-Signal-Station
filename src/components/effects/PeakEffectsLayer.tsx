"use client";

import { useEffect, useRef, type RefObject } from "react";

import {
  createPeakEffectRecipe,
  type PeakEffectRecipe,
} from "@/lib/effects/peakEffects";
import {
  createVhsSignalRenderer,
  type VhsSignalRenderer,
} from "@/lib/webgl/vhsSignalRenderer";
import type {
  AudioReactiveSnapshot,
  AudioVisualizationBus,
  VisualQuality,
} from "@/types/audio";

type PeakEffectsLayerProps = {
  analysis: AudioVisualizationBus;
  targetRef: RefObject<HTMLElement | null>;
};

const PEAK_VARIABLES = [
  "--peak-shake-x",
  "--peak-shake-y",
  "--peak-scale",
  "--peak-rgb-offset",
  "--peak-flash",
  "--peak-noise",
] as const;

const QUALITY_DPR_CAP: Record<VisualQuality, number> = {
  LOW: 1.25,
  MEDIUM: 1.5,
  HIGH: 2,
};

function clearPeakVariables(target: HTMLElement): void {
  for (const variable of PEAK_VARIABLES) {
    target.style.removeProperty(variable);
  }
}

function applyPeakVariables(
  target: HTMLElement,
  recipe: PeakEffectRecipe,
  elapsedMs: number,
  reducedMotion: boolean,
): void {
  const progress = Math.min(1, Math.max(0, elapsedMs / recipe.durationMs));
  const envelope = 1 - progress;
  const shakeEnvelope = elapsedMs >= recipe.shakeDurationMs
    ? 0
    : 1 - elapsedMs / recipe.shakeDurationMs;
  const shakeX = reducedMotion ? 0 : recipe.shakeX * shakeEnvelope;
  const shakeY = reducedMotion ? 0 : recipe.shakeY * shakeEnvelope;
  const scale = reducedMotion ? 0 : recipe.strength * 0.006 * shakeEnvelope;

  target.style.setProperty("--peak-shake-x", shakeX === 0 ? "0px" : `${shakeX.toFixed(3)}px`);
  target.style.setProperty("--peak-shake-y", shakeY === 0 ? "0px" : `${shakeY.toFixed(3)}px`);
  target.style.setProperty("--peak-scale", scale === 0 ? "0" : scale.toFixed(4));
  target.style.setProperty("--peak-rgb-offset", `${(recipe.rgbOffset * envelope).toFixed(3)}px`);
  target.style.setProperty("--peak-flash", (recipe.flash * envelope).toFixed(4));
  target.style.setProperty("--peak-noise", (recipe.noiseOpacity * envelope).toFixed(4));
}

function canvasSize(canvas: HTMLCanvasElement): { width: number; height: number } {
  const bounds = canvas.getBoundingClientRect();
  return {
    width: Math.max(1, Math.round(bounds.width || canvas.clientWidth || window.innerWidth || 1)),
    height: Math.max(1, Math.round(bounds.height || canvas.clientHeight || window.innerHeight || 1)),
  };
}

export function PeakEffectsLayer({
  analysis,
  targetRef,
}: PeakEffectsLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const target = targetRef.current;
    if (!canvas || !target) return;

    let renderer: VhsSignalRenderer | null = createVhsSignalRenderer(canvas);
    let rendererHasFrame = false;
    let activeRecipe: PeakEffectRecipe | null = null;
    let activeSnapshot: AudioReactiveSnapshot | null = null;
    let activeQuality = analysis.frameRef.current.quality;
    let activeReducedMotion = analysis.frameRef.current.reducedMotion;
    let activeStartedAt = 0;
    let sourceRevision = analysis.frameRef.current.sourceRevision;
    let peakEventId = analysis.frameRef.current.snapshot.peakEventId;
    let quality = analysis.frameRef.current.quality;
    let disposed = false;

    const resize = () => {
      if (!renderer) return;
      const size = canvasSize(canvas);
      const dpr = Math.min(window.devicePixelRatio || 1, QUALITY_DPR_CAP[quality]);
      renderer.resize(size.width, size.height, dpr);
    };
    resize();

    const clearRenderer = (time: number) => {
      if (!renderer || !rendererHasFrame) return;
      renderer.render(time, null, 1);
      rendererHasFrame = false;
    };

    const unsubscribe = analysis.subscribe((frame, time) => {
      if (frame.quality !== quality) {
        quality = frame.quality;
        resize();
      }

      if (frame.sourceRevision !== sourceRevision) {
        sourceRevision = frame.sourceRevision;
        peakEventId = frame.snapshot.peakEventId;
        activeRecipe = null;
        activeSnapshot = null;
        clearPeakVariables(target);
        clearRenderer(time);
        return;
      }

      if (frame.snapshot.peakEventId !== peakEventId) {
        peakEventId = frame.snapshot.peakEventId;
        activeRecipe = createPeakEffectRecipe(
          frame.snapshot,
          frame.quality,
          frame.reducedMotion,
        );
        activeSnapshot = activeRecipe ? frame.snapshot : null;
        activeQuality = frame.quality;
        activeReducedMotion = frame.reducedMotion;
        activeStartedAt = time;
      }

      if (!activeRecipe) {
        clearPeakVariables(target);
        clearRenderer(time);
        return;
      }

      if (
        activeSnapshot &&
        (frame.quality !== activeQuality || frame.reducedMotion !== activeReducedMotion)
      ) {
        activeQuality = frame.quality;
        activeReducedMotion = frame.reducedMotion;
        activeRecipe = createPeakEffectRecipe(
          activeSnapshot,
          activeQuality,
          activeReducedMotion,
        );
        if (!activeRecipe) {
          activeSnapshot = null;
          clearPeakVariables(target);
          clearRenderer(time);
          return;
        }
      }

      const elapsedMs = Math.max(0, time - activeStartedAt);
      if (elapsedMs >= activeRecipe.durationMs) {
        activeRecipe = null;
        activeSnapshot = null;
        clearPeakVariables(target);
        clearRenderer(time);
        return;
      }

      const progress = elapsedMs / activeRecipe.durationMs;
      applyPeakVariables(target, activeRecipe, elapsedMs, frame.reducedMotion);
      renderer?.render(time, activeRecipe, progress);
      rendererHasFrame = Boolean(renderer);
    });

    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(resize);
    resizeObserver?.observe(target);
    if (!resizeObserver) window.addEventListener("resize", resize);

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      renderer?.dispose();
      renderer = null;
      rendererHasFrame = false;
    };
    const handleContextRestored = () => {
      if (disposed || renderer) return;
      renderer = createVhsSignalRenderer(canvas);
      resize();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      disposed = true;
      unsubscribe();
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      renderer?.dispose();
      renderer = null;
      rendererHasFrame = false;
      activeRecipe = null;
      activeSnapshot = null;
      clearPeakVariables(target);
    };
  }, [analysis, targetRef]);

  return <canvas ref={canvasRef} className="peak-effects-layer" aria-hidden="true" />;
}
