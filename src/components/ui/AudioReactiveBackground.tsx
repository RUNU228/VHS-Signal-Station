"use client";

import { useCallback, useRef, type MutableRefObject } from "react";

import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import type { AudioReactiveSnapshot } from "@/types/audio";

type AudioReactiveBackgroundProps = {
  reactiveRef: MutableRefObject<AudioReactiveSnapshot>;
  active: boolean;
};

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
  useCanvasSurface(canvasRef);

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
      const drift = time * 0.00004;

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

      const bandCount = active ? 5 : 3;
      for (let band = 0; band < bandCount; band += 1) {
        const baseY = ((band + 1) / (bandCount + 1)) * height;
        const displacement = Math.sin(drift * 20 + band * 1.73) * width * (0.002 + mid * 0.008);
        const bandHeight = Math.max(1, height * (0.003 + mid * 0.004));
        context.fillStyle = `rgba(${band % 2 === 0 ? "196, 154, 82" : "111, 145, 168"}, ${0.012 + mid * 0.035})`;
        context.fillRect(displacement, baseY, width, bandHeight);
      }

      const frameBucket = Math.floor(time / 90);
      const grainCount = Math.min(260, Math.max(50, Math.round((width * height) / 18_000)));
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

  useAnimationFrame(draw);

  return (
    <canvas
      ref={canvasRef}
      className="audio-reactive-background"
      aria-hidden="true"
    />
  );
}
