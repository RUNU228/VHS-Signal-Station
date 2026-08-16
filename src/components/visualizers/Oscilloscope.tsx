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

export type OscilloscopePeakFrame = {
  peakEventId: number;
  remainingFrames: number;
  peakStrength: number;
  peakSeed: number;
};

type OscilloscopePeakEvent = Omit<OscilloscopePeakFrame, "remainingFrames">;

export function nextOscilloscopePeakFrame(
  previous: OscilloscopePeakFrame,
  event: OscilloscopePeakEvent,
): OscilloscopePeakFrame {
  if (previous.peakEventId !== event.peakEventId) {
    const peakStrength = Math.min(1, Math.max(0, event.peakStrength));
    return {
      peakEventId: event.peakEventId,
      remainingFrames: peakStrength > 0.72 ? 3 : 0,
      peakStrength,
      peakSeed: event.peakSeed,
    };
  }

  return {
    ...previous,
    remainingFrames: Math.max(0, previous.remainingFrames - 1),
  };
}

export function oscilloscopeSegmentCount(
  visibleSampleCount: number,
  canvasWidth: number,
): number {
  return Math.min(
    Math.max(0, visibleSampleCount - 1),
    Math.max(0, Math.floor(canvasWidth)),
  );
}

export function oscilloscopePointPolicy(
  point: number,
  pointCount: number,
  peakFrame: OscilloscopePeakFrame,
): { connectPrevious: boolean; offset: number } {
  const safePointCount = Math.max(1, pointCount);
  const fragment = Math.min(2, Math.floor((point / safePointCount) * 3));
  const previousFragment = Math.min(
    2,
    Math.floor(((point - 1) / safePointCount) * 3),
  );
  const active = peakFrame.remainingFrames > 0;
  const seedDirection = peakFrame.peakSeed < 0.5 ? -1 : 1;
  const regionDirection = fragment % 2 === 0 ? seedDirection : -seedDirection;
  return {
    connectPrevious:
      point > 0 && (!active || fragment === previousFragment),
    offset: active ? regionDirection * 4 * peakFrame.peakStrength : 0,
  };
}

const OSCILLOSCOPE_STYLE_BUCKET_COUNT = 12;

type OscilloscopeStyle = {
  strokeStyle: string;
  shadowColor: string;
  shadowBlur: number;
  lineWidth: number;
};

export function Oscilloscope({
  analysis,
  active,
}: {
  analysis: AudioVisualizationBus;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceRevisionRef = useRef<number | null>(null);
  const peakFrameRef = useRef<OscilloscopePeakFrame>({
    peakEventId: 0,
    remainingFrames: 0,
    peakStrength: 0,
    peakSeed: 0,
  });
  const stylesRef = useRef<OscilloscopeStyle[]>(
    Array.from({ length: OSCILLOSCOPE_STYLE_BUCKET_COUNT }, () => ({
      strokeStyle: "",
      shadowColor: "",
      shadowBlur: 0,
      lineWidth: 1,
    })),
  );
  useCanvasSurface(canvasRef);

  const draw = useCallback((frame: AudioVisualizationFrame) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    if (sourceRevisionRef.current !== frame.sourceRevision) {
      sourceRevisionRef.current = frame.sourceRevision;
      peakFrameRef.current = {
        peakEventId: frame.snapshot.peakEventId,
        remainingFrames: 0,
        peakStrength: 0,
        peakSeed: 0,
      };
    } else {
      peakFrameRef.current = nextOscilloscopePeakFrame(peakFrameRef.current, {
        peakEventId: frame.snapshot.peakEventId,
        peakStrength: frame.snapshot.peakStrength,
        peakSeed: frame.snapshot.peakSeed,
      });
    }

    const data = frame.oscilloscopeData;
    const start = findZeroCrossing(data);
    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .25)";
    context.fillRect(0, 0, width, height);
    drawScopeGrid(context, width, height, 8, 4);

    const visible = data.length - start;
    const segmentCount = oscilloscopeSegmentCount(visible, width);
    const pointCount = segmentCount + 1;
    const styles = stylesRef.current;
    for (let bucket = 0; bucket < styles.length; bucket += 1) {
      const localAmplitude = bucket / (styles.length - 1);
      const colorLevel = localSignalLevel(
        localAmplitude,
        frame.snapshot.overallEnergy,
      );
      const glow = signalGlow(colorLevel);
      styles[bucket].strokeStyle = signalColorForLevel(
        colorLevel,
        glow.strokeAlpha,
      );
      styles[bucket].shadowColor = signalColorForLevel(
        colorLevel,
        glow.shadowAlpha,
      );
      styles[bucket].shadowBlur = Math.min(6, glow.shadowBlur);
      styles[bucket].lineWidth = 1 + localAmplitude * 1.8;
    }

    for (let point = 1; point <= segmentCount; point += 1) {
      const previousIndex = Math.round(
        ((point - 1) / segmentCount) * (visible - 1),
      );
      const index = Math.round((point / segmentCount) * (visible - 1));
      const previousSample = data[start + previousIndex];
      const sample = data[start + index];
      let localAmplitude = 0;
      for (let sampleIndex = previousIndex; sampleIndex <= index; sampleIndex += 1) {
        localAmplitude = Math.max(
          localAmplitude,
          Math.min(1, Math.abs(data[start + sampleIndex])),
        );
      }
      const style = styles[
        Math.min(
          styles.length - 1,
          Math.round(localAmplitude * (styles.length - 1)),
        )
      ];
      const previousPolicy = oscilloscopePointPolicy(
        point - 1,
        pointCount,
        peakFrameRef.current,
      );
      const policy = oscilloscopePointPolicy(
        point,
        pointCount,
        peakFrameRef.current,
      );
      if (!policy.connectPrevious) continue;

      const previousX =
        ((point - 1) / segmentCount) * width + previousPolicy.offset;
      const x = (point / segmentCount) * width + policy.offset;
      const previousY = height / 2 - previousSample * height * 0.43;
      const y = height / 2 - sample * height * 0.43;

      context.strokeStyle = style.strokeStyle;
      context.shadowColor = style.shadowColor;
      context.shadowBlur = style.shadowBlur;
      context.lineWidth = style.lineWidth;
      context.beginPath();
      context.moveTo(previousX, previousY);
      context.lineTo(x, y);
      context.stroke();
    }
    context.shadowBlur = 0;
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
