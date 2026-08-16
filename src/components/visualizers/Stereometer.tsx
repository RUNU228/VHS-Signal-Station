"use client";

import { useCallback, useRef } from "react";

import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { useVisualizationFrame } from "@/hooks/useVisualizationFrame";
import { drawScopeGrid, smoothSignalColor } from "@/lib/visualization/canvas";
import {
  createStereoField,
  initializeStereoField,
  particleFinalOpacity,
  particleSize,
  stereoMotionFactor,
  STEREOMETER_PARTICLE_STRIDE,
  updateStereoTargets,
} from "@/lib/visualization/stereometer";
import type {
  AudioVisualizationBus,
  AudioVisualizationFrame,
  VisualQuality,
} from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

export function Stereometer({
  analysis,
  active,
}: {
  analysis: AudioVisualizationBus;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Float32Array | null>(null);
  const qualityRef = useRef<VisualQuality | null>(null);
  const sourceRevisionRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  useCanvasSurface(canvasRef);

  const draw = useCallback((frame: AudioVisualizationFrame, time: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const { snapshot } = frame;
    const resetField = particlesRef.current === null ||
      qualityRef.current !== frame.quality ||
      sourceRevisionRef.current !== frame.sourceRevision;
    let particles = particlesRef.current;
    if (resetField || particles === null) {
      particles = createStereoField(frame.quality);
      particlesRef.current = particles;
      qualityRef.current = frame.quality;
      sourceRevisionRef.current = frame.sourceRevision;
      initializeStereoField(
        particles,
        frame.leftChannelData,
        frame.rightChannelData,
        snapshot.lowEnergy,
        snapshot.midEnergy,
        snapshot.highEnergy,
      );
    } else {
      updateStereoTargets(
        particles,
        frame.leftChannelData,
        frame.rightChannelData,
        snapshot.lowEnergy,
        snapshot.midEnergy,
        snapshot.highEnergy,
      );
    }

    const previousTime = lastFrameTimeRef.current;
    const deltaSeconds = previousTime === null
      ? 1 / 60
      : Math.min(0.05, Math.max(0, (time - previousTime) / 1000));
    lastFrameTimeRef.current = time;

    const width = canvas.width;
    const height = canvas.height;
    const clearAlpha = 0.32 + Math.min(1, Math.max(0, snapshot.overallEnergy)) * 0.2;
    context.fillStyle = `rgba(5, 7, 7, ${clearAlpha})`;
    context.fillRect(0, 0, width, height);
    drawScopeGrid(context, width, height, 4, 4);
    context.strokeStyle = "rgba(230, 215, 163, .14)";
    context.beginPath();
    context.moveTo(width / 2, 0);
    context.lineTo(width / 2, height);
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.moveTo(0, height);
    context.lineTo(width, 0);
    context.moveTo(0, 0);
    context.lineTo(width, height);
    context.stroke();

    const peakExpansion = 1 + Math.min(1, snapshot.peakStrength) * 0.35;
    context.fillStyle = smoothSignalColor(snapshot.overallEnergy);
    context.shadowBlur = snapshot.peakStrength > 0.8
      ? Math.min(2, (snapshot.peakStrength - 0.8) * 10)
      : 0;
    context.shadowColor = context.fillStyle as string;

    const particleCount = particles.length / STEREOMETER_PARTICLE_STRIDE;
    for (let particle = 0; particle < particleCount; particle += 1) {
      const offset = particle * STEREOMETER_PARTICLE_STRIDE;
      const motionEase = stereoMotionFactor(deltaSeconds, particles[offset + 5]);
      particles[offset] += (particles[offset + 2] - particles[offset]) * motionEase;
      particles[offset + 1] += (particles[offset + 3] - particles[offset + 1]) * motionEase;
      const intensity = particles[offset + 4];
      const opacity = particleFinalOpacity(intensity, particles[offset + 6]);
      const x = width / 2 + particles[offset] * width * 0.42;
      const y = height / 2 - particles[offset + 1] * height * 0.42;
      const size = particleSize(intensity) * peakExpansion;
      context.globalAlpha = opacity;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }, []);

  useVisualizationFrame(analysis, draw, active);

  return (
    <VisualizerFrame
      title="STEREOMETER"
      serial="SCALED / BIPOLAR"
      canvasRef={canvasRef}
      active={active}
      className="module--stereometer"
      meta={<span>PHASE FIELD</span>}
    >
      <span className="screen-label screen-label--tl">L</span>
      <span className="screen-label screen-label--tr">R</span>
      <span className="screen-label screen-label--bc">MONO / WIDE</span>
    </VisualizerFrame>
  );
}
