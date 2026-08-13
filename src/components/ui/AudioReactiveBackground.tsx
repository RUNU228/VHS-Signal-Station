"use client";

import { useCallback, useEffect, useRef, type MutableRefObject } from "react";

import type { AudioReactiveSnapshot } from "@/types/audio";

type AudioReactiveBackgroundProps = {
  reactiveRef: MutableRefObject<AudioReactiveSnapshot>;
  active: boolean;
};

type BackgroundQuality = {
  mobile: boolean;
  reducedMotion: boolean;
  frameInterval: number;
  maxDevicePixelRatio: number;
  resolutionScale: number;
  bandCount: number;
  grainScale: number;
};

const DEFAULT_QUALITY: BackgroundQuality = {
  mobile: false,
  reducedMotion: false,
  frameInterval: 1000 / 60,
  maxDevicePixelRatio: 2,
  resolutionScale: 0.75,
  bandCount: 5,
  grainScale: 1,
};

function qualityFor(mobile: boolean, reducedMotion: boolean): BackgroundQuality {
  return {
    mobile,
    reducedMotion,
    frameInterval: mobile ? 1000 / 30 : 1000 / 60,
    maxDevicePixelRatio: mobile ? 1.5 : 2,
    resolutionScale: mobile ? 0.5 : 0.75,
    bandCount: mobile ? 3 : 5,
    grainScale: mobile ? 0.5 : 1,
  };
}

function resizeCanvas(canvas: HTMLCanvasElement, quality: BackgroundQuality): void {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width || canvas.clientWidth || 640));
  const height = Math.max(1, Math.round(bounds.height || canvas.clientHeight || 260));
  const dpr = Math.min(window.devicePixelRatio || 1, quality.maxDevicePixelRatio);
  canvas.width = Math.max(1, Math.round(width * dpr * quality.resolutionScale));
  canvas.height = Math.max(1, Math.round(height * dpr * quality.resolutionScale));
}

function seededNoise(x: number, y: number, frame: number): number {
  let value = Math.imul(x + 1, 374_761_393);
  value = Math.imul(value ^ (y + 1), 668_265_263);
  value = Math.imul(value ^ (frame + 1), 1_274_126_177);
  value ^= value >>> 13;
  return ((value >>> 0) % 10_000) / 10_000;
}

function drawGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: readonly [number, number, number],
  alpha: number,
): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color.join(", ")}, ${alpha})`);
  gradient.addColorStop(1, `rgba(${color.join(", ")}, 0)`);
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export function AudioReactiveBackground({
  reactiveRef,
  active,
}: AudioReactiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qualityRef = useRef<BackgroundQuality>(DEFAULT_QUALITY);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;

      const { width, height } = canvas;
      const snapshot = reactiveRef.current;
      const volume = active ? snapshot.volume : 0;
      const bass = active ? snapshot.bass : 0;
      const mid = active ? (snapshot.lowMid + snapshot.mid + snapshot.highMid) / 3 : 0;
      const treble = active ? snapshot.treble : 0;
      const smoothed = active ? snapshot.smoothed : 0;
      const quality = qualityRef.current;
      const drift = quality.reducedMotion ? 0 : time * 0.00004;

      context.clearRect(0, 0, width, height);
      context.fillStyle = `rgba(5, 7, 7, ${0.018 + volume * 0.018})`;
      context.fillRect(0, 0, width, height);

      const primaryRadius = Math.max(width, height) * (0.34 + bass * 0.08);
      drawGlow(
        context,
        width * (0.26 + Math.sin(drift * 7) * 0.035),
        height * (0.24 + Math.cos(drift * 5) * 0.045),
        primaryRadius,
        [168, 77, 67],
        Math.min(0.12, 0.018 + smoothed * 0.1),
      );
      drawGlow(
        context,
        width * (0.75 + Math.cos(drift * 4) * 0.04),
        height * (0.68 + Math.sin(drift * 6) * 0.04),
        primaryRadius * 0.82,
        [111, 145, 168],
        Math.min(0.09, 0.015 + volume * 0.07),
      );

      const bandCount = active ? quality.bandCount : Math.min(3, quality.bandCount);
      for (let band = 0; band < bandCount; band += 1) {
        const baseY = ((band + 1) / (bandCount + 1)) * height;
        const displacement = Math.sin(drift * 20 + band * 1.73) * width * (0.002 + mid * 0.008);
        const bandHeight = Math.max(1, height * (0.003 + mid * 0.004));
        context.fillStyle = `rgba(${band % 2 === 0 ? "196, 154, 82" : "111, 145, 168"}, ${0.012 + mid * 0.035})`;
        context.fillRect(displacement, baseY, width, bandHeight);
      }

      const frameBucket = Math.floor(time / 90);
      const grainCount = Math.round(
        Math.min(260, Math.max(50, (width * height) / 18_000)) *
          quality.grainScale,
      );
      context.fillStyle = `rgba(230, 215, 163, ${0.018 + treble * 0.045})`;
      for (let index = 0; index < grainCount; index += 1) {
        const x = seededNoise(index, 17, frameBucket) * width;
        const y = seededNoise(index, 43, frameBucket) * height;
        const size = seededNoise(index, 71, frameBucket) > 0.88 ? 2 : 1;
        context.fillRect(x, y, size, size);
      }

      context.fillStyle = `rgba(0, 0, 0, ${0.035 + treble * 0.018})`;
      const scanlineGap = Math.max(4, Math.round(height / 220));
      for (let y = frameBucket % scanlineGap; y < height; y += scanlineGap) {
        context.fillRect(0, y, width, 1);
      }
    },
    [active, reactiveRef],
  );

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return;

    const mobileQuery = window.matchMedia?.("(max-width: 760px)") ?? null;
    const motionQuery =
      window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;
    let disposed = false;
    let frame = 0;
    let lastDraw = Number.NEGATIVE_INFINITY;

    const cancel = () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
    };

    const schedule = () => {
      if (disposed || document.hidden || frame !== 0) return;
      frame = requestAnimationFrame(loop);
    };

    const loop = (time: number) => {
      frame = 0;
      if (disposed || document.hidden) return;
      const quality = qualityRef.current;
      if (
        quality.reducedMotion ||
        time - lastDraw >= quality.frameInterval
      ) {
        draw(time);
        lastDraw = time;
      }
      if (!quality.reducedMotion) schedule();
    };

    const restart = () => {
      cancel();
      qualityRef.current = qualityFor(
        mobileQuery?.matches ?? window.innerWidth <= 760,
        motionQuery?.matches ?? false,
      );
      if (canvasRef.current) resizeCanvas(canvasRef.current, qualityRef.current);
      lastDraw = Number.NEGATIVE_INFINITY;
      schedule();
    };

    const handleVisibility = () => {
      if (document.hidden) cancel();
      else restart();
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      resizeCanvas(canvas, qualityRef.current);
      if (qualityRef.current.reducedMotion) {
        cancel();
        lastDraw = Number.NEGATIVE_INFINITY;
        schedule();
      }
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(handleResize);

    mobileQuery?.addEventListener("change", restart);
    motionQuery?.addEventListener("change", restart);
    document.addEventListener("visibilitychange", handleVisibility);
    if (canvasRef.current) resizeObserver?.observe(canvasRef.current);
    if (!resizeObserver) window.addEventListener("resize", handleResize);
    restart();

    return () => {
      disposed = true;
      cancel();
      resizeObserver?.disconnect();
      mobileQuery?.removeEventListener("change", restart);
      motionQuery?.removeEventListener("change", restart);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (!resizeObserver) window.removeEventListener("resize", handleResize);
    };
  }, [active, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="audio-reactive-background"
      aria-hidden="true"
    />
  );
}
