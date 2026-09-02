"use client";

import { useLanguage } from "@/components/LanguageProvider";

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
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Float32Array | null>(null);
  const qualityRef = useRef<VisualQuality | null>(null);
  const sourceRevisionRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const visibleRef = useCanvasSurface(canvasRef, { active });

  const draw = useCallback((frame: AudioVisualizationFrame, time: number, renderOnly = false) => {
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
    } else if (!renderOnly) {
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
    if (!renderOnly) lastFrameTimeRef.current = time;

    const width = canvas.width;
    const height = canvas.height;
    const visible = visibleRef.current || renderOnly;
    if (renderOnly) context.clearRect(0, 0, width, height);
    if (visible) {
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

      context.fillStyle = smoothSignalColor(snapshot.overallEnergy);
      context.shadowBlur = snapshot.peakStrength > 0.8
        ? Math.min(2, (snapshot.peakStrength - 0.8) * 10)
        : 0;
      context.shadowColor = context.fillStyle as string;
    }

    const peakExpansion = 1 + Math.min(1, snapshot.peakStrength) * 0.35;
    const particleCount = particles.length / STEREOMETER_PARTICLE_STRIDE;
    const lowMotion = stereoMotionFactor(deltaSeconds, 0);
    const midMotion = stereoMotionFactor(deltaSeconds, 1);
    const highMotion = stereoMotionFactor(deltaSeconds, 2);
    for (let particle = 0; particle < particleCount; particle += 1) {
      const offset = particle * STEREOMETER_PARTICLE_STRIDE;
      const cohort = particles[offset + 5];
      const motionEase = cohort === 0 ? lowMotion : cohort === 1 ? midMotion : highMotion;
      if (!renderOnly) {
        particles[offset] += (particles[offset + 2] - particles[offset]) * motionEase;
        particles[offset + 1] += (particles[offset + 3] - particles[offset + 1]) * motionEase;
      }
      if (!visible) continue;
      const intensity = particles[offset + 4];
      const opacity = particleFinalOpacity(intensity, particles[offset + 6]);
      const x = width / 2 + particles[offset] * width * 0.42;
      const y = height / 2 - particles[offset + 1] * height * 0.42;
      const size = particleSize(intensity) * peakExpansion;
      context.globalAlpha = opacity;
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
    if (visible) {
      context.globalAlpha = 1;
      context.shadowBlur = 0;
    }
  }, [visibleRef]);

  useVisualizationFrame(analysis, draw, active, visibleRef);

  return (
    <VisualizerFrame
      title={t.visualizers.stereometer}
      serial={t.visualizers.stereoSerial}
      canvasRef={canvasRef}
      active={active}
      className="module--stereometer"
      meta={<span>{t.visualizers.phase}</span>}
    >
      <span className="screen-label screen-label--tl">{t.visualizers.left}</span>
      <span className="screen-label screen-label--tr">{t.visualizers.right}</span>
      <span className="screen-label screen-label--bc">{t.visualizers.width}</span>
    </VisualizerFrame>
  );
}
