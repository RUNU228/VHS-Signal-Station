"use client";

import { useCallback, useRef, type MutableRefObject } from "react";

import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { drawScopeGrid, smoothSignalColor } from "@/lib/visualization/canvas";
import {
  initializeStereoField,
  particleOpacity,
  stereoMotionFactor,
  STEREOMETER_PARTICLE_COUNT,
  STEREOMETER_PARTICLE_STRIDE,
  updateStereoTargets,
} from "@/lib/visualization/stereometer";
import type { AudioAnalyserBundle } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

type StereoBuffers = {
  left: Float32Array<ArrayBuffer>;
  right: Float32Array<ArrayBuffer>;
};

export function Stereometer({
  analysersRef,
  active,
}: {
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buffersRef = useRef<StereoBuffers | null>(null);
  const particlesRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const initializedRef = useRef(false);
  const lastFrameTimeRef = useRef<number | null>(null);
  useCanvasSurface(canvasRef);

  const draw = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const bundle = analysersRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !bundle) return;
    const size = bundle.left.fftSize;
    if (!buffersRef.current || buffersRef.current.left.length !== size) {
      buffersRef.current = {
        left: new Float32Array(size),
        right: new Float32Array(size),
      };
    }
    const buffers = buffersRef.current;
    bundle.left.getFloatTimeDomainData(buffers.left);
    bundle.right.getFloatTimeDomainData(buffers.right);

    const particles = particlesRef.current ??= new Float32Array(
      STEREOMETER_PARTICLE_COUNT * STEREOMETER_PARTICLE_STRIDE,
    );
    if (!initializedRef.current) {
      initializedRef.current = initializeStereoField(
        particles,
        buffers.left,
        buffers.right,
      );
    } else {
      updateStereoTargets(particles, buffers.left, buffers.right);
    }

    const previousTime = lastFrameTimeRef.current;
    const deltaSeconds = previousTime === null
      ? 1 / 60
      : Math.min(0.05, Math.max(0, (time - previousTime) / 1000));
    lastFrameTimeRef.current = time;

    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .18)";
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

    const motionEase = stereoMotionFactor(deltaSeconds);
    for (let particle = 0; particle < STEREOMETER_PARTICLE_COUNT; particle += 1) {
      const offset = particle * STEREOMETER_PARTICLE_STRIDE;
      particles[offset] += (particles[offset + 2] - particles[offset]) * motionEase;
      particles[offset + 1] += (particles[offset + 3] - particles[offset + 1]) * motionEase;
      const intensity = particles[offset + 4];
      const opacity = particleOpacity(intensity);
      const x = width / 2 + particles[offset] * width * 0.42;
      const y = height / 2 - particles[offset + 1] * height * 0.42;
      const size = Math.max(1.2, width / 380) * (0.75 + intensity * 0.55);
      context.fillStyle = smoothSignalColor(intensity, opacity);
      context.fillRect(x - size / 2, y - size / 2, size, size);
    }
  }, [analysersRef]);

  useAnimationFrame(draw, active);

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
