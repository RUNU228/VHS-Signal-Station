"use client";

import { useEffect, useRef } from "react";

import { backgroundPolicy } from "@/lib/visualization/background";
import { createSignalTheme, signalColor } from "@/lib/visualization/signalTheme";
import type {
  AudioVisualizationBus,
  AudioVisualizationFrame,
  VisualQuality,
} from "@/types/audio";

type AudioReactiveBackgroundProps = {
  analysis: AudioVisualizationBus;
  active: boolean;
};

type CanvasQuality = {
  maxDevicePixelRatio: number;
  resolutionScale: number;
};

const RAF_INTERVAL_TOLERANCE = 1.5;

function canvasQuality(quality: VisualQuality): CanvasQuality {
  if (quality === "LOW") {
    return { maxDevicePixelRatio: 1.5, resolutionScale: 0.5 };
  }
  if (quality === "MEDIUM") {
    return { maxDevicePixelRatio: 1.75, resolutionScale: 0.625 };
  }
  return { maxDevicePixelRatio: 2, resolutionScale: 0.75 };
}

function resizeCanvas(canvas: HTMLCanvasElement, quality: VisualQuality): void {
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width || canvas.clientWidth || 640));
  const height = Math.max(1, Math.round(bounds.height || canvas.clientHeight || 260));
  const { maxDevicePixelRatio, resolutionScale } = canvasQuality(quality);
  const dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio);
  canvas.width = Math.max(1, Math.round(width * dpr * resolutionScale));
  canvas.height = Math.max(1, Math.round(height * dpr * resolutionScale));
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

function drawBackground(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  frame: AudioVisualizationFrame,
  time: number,
  points: Float32Array,
): void {
  const { width, height } = canvas;
  const policy = backgroundPolicy(frame);
  const theme = createSignalTheme(frame.snapshot);
  const traceColor = signalColor(theme, Math.min(0.24, policy.opacity * 0.72));
  const phase = time * 0.001 * policy.traceSpeed;

  context.clearRect(0, 0, width, height);
  context.fillStyle = `rgba(5, 7, 7, ${policy.opacity})`;
  context.fillRect(0, 0, width, height);

  const glowRadius = Math.max(width, height) * (0.28 + frame.snapshot.lowEnergy * 0.08);
  drawGlow(
    context,
    width * 0.27,
    height * 0.25,
    glowRadius,
    theme.rgb,
    Math.min(0.13, policy.opacity * 0.38),
  );
  drawGlow(
    context,
    width * 0.74,
    height * 0.7,
    glowRadius * 0.78,
    theme.rgb,
    Math.min(0.09, policy.opacity * 0.26),
  );

  const pointCount = Math.max(32, Math.min(96, Math.floor(width / 12)));
  const frequencyData = frame.frequencyData;
  const shakeX = Math.sin(frame.frameId * 12.9898) * width * policy.shake;
  context.strokeStyle = traceColor;
  context.lineWidth = 1;
  for (let band = 0; band < policy.bandCount; band += 1) {
    const baseY = ((band + 1) / (policy.bandCount + 1)) * height;
    const pointOffset = band * pointCount;
    for (let point = 0; point < pointCount; point += 1) {
      const ratio = point / Math.max(1, pointCount - 1);
      const bin = frequencyData.length === 0
        ? 0
        : frequencyData[Math.min(
          frequencyData.length - 1,
          Math.floor(((band + ratio) / policy.bandCount) * frequencyData.length),
        )] / 255;
      const frequencyLift = (bin - 0.5) * height * policy.traceAmplitude;
      const deformation = Math.sin(ratio * Math.PI * 4 + phase + band) *
        height * policy.deformation;
      const y = baseY + frequencyLift + deformation;
      points[pointOffset + point] = y;
    }

    context.beginPath();
    for (let point = 0; point < pointCount; point += 1) {
      const ratio = point / Math.max(1, pointCount - 1);
      const x = ratio * width + shakeX;
      const y = points[pointOffset + point];
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
  }

  const grainFrame = Math.floor(time / policy.frameInterval);
  context.fillStyle = signalColor(theme, Math.min(0.055, policy.opacity * 0.16));
  for (let index = 0; index < policy.grainCount; index += 1) {
    const x = seededNoise(index, 17, grainFrame) * width;
    const y = seededNoise(index, 43, grainFrame) * height;
    const size = seededNoise(index, 71, grainFrame) > 0.92 ? 2 : 1;
    context.fillRect(x, y, size, size);
  }

  context.fillStyle = `rgba(0, 0, 0, ${0.025 + frame.snapshot.highEnergy * 0.02})`;
  const scanlineGap = Math.max(4, Math.round(height / 220));
  for (let y = grainFrame % scanlineGap; y < height; y += scanlineGap) {
    context.fillRect(0, y, width, 1);
  }
}

export function AudioReactiveBackground({
  analysis,
  active,
}: AudioReactiveBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef(new Float32Array(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let quality = analysis.frameRef.current.quality;
    let lastDraw = Number.NEGATIVE_INFINITY;
    let context: CanvasRenderingContext2D | null | undefined;
    resizeCanvas(canvas, quality);

    const unsubscribe = analysis.subscribe((frame, time) => {
      if (frame.quality !== quality) {
        quality = frame.quality;
        resizeCanvas(canvas, quality);
        lastDraw = Number.NEGATIVE_INFINITY;
      }

      const policy = backgroundPolicy(frame);
      if (time - lastDraw < policy.frameInterval - RAF_INTERVAL_TOLERANCE) return;
      if (context === undefined) context = canvas.getContext("2d");
      if (!context) return;

      const pointCount = Math.max(32, Math.min(96, Math.floor(canvas.width / 12)));
      const requiredPoints = pointCount * policy.bandCount;
      if (pointsRef.current.length < requiredPoints) {
        pointsRef.current = new Float32Array(requiredPoints);
      }
      drawBackground(context, canvas, frame, time, pointsRef.current);
      lastDraw = time;
    });

    const handleResize = () => {
      resizeCanvas(canvas, quality);
      lastDraw = Number.NEGATIVE_INFINITY;
    };
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(handleResize);
    resizeObserver?.observe(canvas);
    if (!resizeObserver) window.addEventListener("resize", handleResize);

    return () => {
      unsubscribe();
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", handleResize);
    };
  }, [analysis]);

  return (
    <canvas
      ref={canvasRef}
      className="audio-reactive-background"
      data-active={active}
      aria-hidden="true"
    />
  );
}
