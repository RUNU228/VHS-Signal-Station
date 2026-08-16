"use client";

import { useCallback, useRef } from "react";

import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { useVisualizationFrame } from "@/hooks/useVisualizationFrame";
import { drawScopeGrid, signalGlow } from "@/lib/visualization/canvas";
import {
  localSignalLevel,
  signalColorForLevel,
} from "@/lib/visualization/signalTheme";
import type { AudioVisualizationBus, AudioVisualizationFrame } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

function findZeroCrossing(samples: Float32Array): number {
  const limit = Math.floor(samples.length / 2);
  for (let index = 1; index < limit; index += 1) {
    if (samples[index - 1] <= 0 && samples[index] > 0) return index;
  }
  return 0;
}

function splitOffset(
  point: number,
  visible: number,
  peakStrength: number,
  peakSeed: number,
): number {
  const region = Math.min(2, Math.floor((point / Math.max(1, visible)) * 3));
  const seedDirection = peakSeed < 0.5 ? -1 : 1;
  const regionDirection = region % 2 === 0 ? seedDirection : -seedDirection;
  return regionDirection * 4 * Math.min(1, Math.max(0, peakStrength));
}

export function Oscilloscope({
  analysis,
  active,
}: {
  analysis: AudioVisualizationBus;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRevisionRef = useRef<number | null>(null);
  const peakEventRef = useRef(0);
  const splitFramesRef = useRef(0);
  useCanvasSurface(canvasRef);

  const draw = useCallback((frame: AudioVisualizationFrame) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    if (sourceRevisionRef.current !== frame.sourceRevision) {
      sourceRevisionRef.current = frame.sourceRevision;
      peakEventRef.current = frame.snapshot.peakEventId;
      splitFramesRef.current = 0;
    } else if (peakEventRef.current !== frame.snapshot.peakEventId) {
      peakEventRef.current = frame.snapshot.peakEventId;
      if (frame.snapshot.peakStrength > 0.72) splitFramesRef.current = 3;
    }

    const data = frame.oscilloscopeData;
    const start = findZeroCrossing(data);
    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .25)";
    context.fillRect(0, 0, width, height);
    drawScopeGrid(context, width, height, 8, 4);

    const visible = data.length - start;
    const splitActive = splitFramesRef.current > 0;
    for (let point = 1; point < visible; point += 1) {
      const previousSample = data[start + point - 1];
      const sample = data[start + point];
      const localAmplitude = Math.min(
        1,
        Math.max(Math.abs(previousSample), Math.abs(sample)),
      );
      const colorLevel = localSignalLevel(
        localAmplitude,
        frame.snapshot.overallEnergy,
      );
      const glow = signalGlow(colorLevel);
      const previousOffset = splitActive
        ? splitOffset(
            point - 1,
            visible,
            frame.snapshot.peakStrength,
            frame.snapshot.peakSeed,
          )
        : 0;
      const offset = splitActive
        ? splitOffset(
            point,
            visible,
            frame.snapshot.peakStrength,
            frame.snapshot.peakSeed,
          )
        : 0;
      const previousX =
        ((point - 1) / Math.max(1, visible - 1)) * width + previousOffset;
      const x = (point / Math.max(1, visible - 1)) * width + offset;
      const previousY = height / 2 - previousSample * height * 0.43;
      const y = height / 2 - sample * height * 0.43;

      context.strokeStyle = signalColorForLevel(colorLevel, glow.strokeAlpha);
      context.shadowColor = signalColorForLevel(colorLevel, glow.shadowAlpha);
      context.shadowBlur = Math.min(6, glow.shadowBlur);
      context.lineWidth = 1 + localAmplitude * 1.8;
      context.beginPath();
      context.moveTo(previousX, previousY);
      context.lineTo(x, y);
      context.stroke();
    }
    context.shadowBlur = 0;
    if (splitFramesRef.current > 0) splitFramesRef.current -= 1;
  }, []);

  useVisualizationFrame(analysis, draw, active);

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
