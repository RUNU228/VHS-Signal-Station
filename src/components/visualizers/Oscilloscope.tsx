"use client";

import { useCallback, useRef, type MutableRefObject } from "react";

import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import {
  drawScopeGrid,
  signalGlow,
  smoothEnergy,
  smoothSignalColor,
} from "@/lib/visualization/canvas";
import type { AudioAnalyserBundle } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

function findZeroCrossing(samples: Float32Array): number {
  const limit = Math.floor(samples.length / 2);
  for (let index = 1; index < limit; index += 1) {
    if (samples[index - 1] <= 0 && samples[index] > 0) return index;
  }
  return 0;
}

export function Oscilloscope({
  analysersRef,
  active,
}: {
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const colorEnergyRef = useRef(0);
  useCanvasSurface(canvasRef);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analysersRef.current?.oscilloscope;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !analyser) return;
    if (!dataRef.current || dataRef.current.length !== analyser.fftSize) {
      dataRef.current = new Float32Array(analyser.fftSize);
    }
    const data = dataRef.current;
    analyser.getFloatTimeDomainData(data);
    const start = findZeroCrossing(data);
    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .25)";
    context.fillRect(0, 0, width, height);
    drawScopeGrid(context, width, height, 8, 4);

    let peak = 0;
    for (let index = 0; index < data.length; index += 1) {
      peak = Math.max(peak, Math.abs(data[index]));
    }
    colorEnergyRef.current = smoothEnergy(colorEnergyRef.current, peak);
    const glow = signalGlow(colorEnergyRef.current);
    context.strokeStyle = smoothSignalColor(colorEnergyRef.current, glow.strokeAlpha);
    context.shadowColor = smoothSignalColor(colorEnergyRef.current, glow.shadowAlpha);
    context.shadowBlur = glow.shadowBlur;
    context.lineWidth = Math.max(1, width / 650);
    context.beginPath();
    const visible = data.length - start;
    for (let point = 0; point < visible; point += 1) {
      const sample = data[start + point];
      const x = (point / Math.max(1, visible - 1)) * width;
      const y = height / 2 - sample * height * 0.43;
      if (point === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();
    context.shadowBlur = 0;
  }, [analysersRef]);

  useAnimationFrame(draw, active);

  return (
    <VisualizerFrame
      title="OSCILLOSCOPE"
      serial="TRIGGER / AUTO"
      canvasRef={canvasRef}
      active={active}
      className="module--oscilloscope"
      meta={<span>0.5 MS/DIV</span>}
    >
      <span className="screen-label screen-label--tl">CH A</span>
      <span className="screen-label screen-label--br">TRIG +</span>
    </VisualizerFrame>
  );
}
