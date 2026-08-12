"use client";

import { useCallback, useRef, type MutableRefObject } from "react";

import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { toMidSide } from "@/lib/audio/midSide";
import { smoothSignalColor } from "@/lib/visualization/canvas";
import {
  measureWaveformColumn,
  pushWaveformColumn,
  type WaveformHistory,
} from "@/lib/visualization/waveform";
import type { AudioAnalyserBundle } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

type WaveBuffers = {
  left: Float32Array<ArrayBuffer>;
  right: Float32Array<ArrayBuffer>;
  mid: Float32Array<ArrayBuffer>;
  side: Float32Array<ArrayBuffer>;
};

const HISTORY_COLUMNS = 360;

type ChannelHistory = {
  mid: WaveformHistory;
  side: WaveformHistory;
};

function createHistory(): WaveformHistory {
  return {
    negative: new Float32Array(HISTORY_COLUMNS),
    positive: new Float32Array(HISTORY_COLUMNS),
    rms: new Float32Array(HISTORY_COLUMNS),
  };
}

export function Waveform({
  analysersRef,
  active,
}: {
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buffersRef = useRef<WaveBuffers | null>(null);
  const historyRef = useRef<ChannelHistory>({
    mid: createHistory(),
    side: createHistory(),
  });
  const colorLevelsRef = useRef([0, 0]);
  useCanvasSurface(canvasRef);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const bundle = analysersRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !bundle) return;
    const size = bundle.left.fftSize;
    if (!buffersRef.current || buffersRef.current.left.length !== size) {
      buffersRef.current = {
        left: new Float32Array(size),
        right: new Float32Array(size),
        mid: new Float32Array(size),
        side: new Float32Array(size),
      };
    }
    const buffers = buffersRef.current;
    bundle.left.getFloatTimeDomainData(buffers.left);
    bundle.right.getFloatTimeDomainData(buffers.right);
    toMidSide(buffers.left, buffers.right, buffers.mid, buffers.side);

    pushWaveformColumn(historyRef.current.side, measureWaveformColumn(buffers.side));
    pushWaveformColumn(historyRef.current.mid, measureWaveformColumn(buffers.mid));

    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .48)";
    context.fillRect(0, 0, width, height);

    for (let traceIndex = 0; traceIndex < 2; traceIndex += 1) {
      const history = traceIndex === 0
        ? historyRef.current.side
        : historyRef.current.mid;
      const center = height * (traceIndex === 0 ? 0.27 : 0.73);
      context.strokeStyle = "rgba(111, 145, 168, .18)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, center);
      context.lineTo(width, center);
      context.stroke();

      let peak = 0;
      for (let index = 0; index < HISTORY_COLUMNS; index += 1) {
        peak = Math.max(peak, history.positive[index], -history.negative[index]);
      }
      const previousColorLevel = colorLevelsRef.current[traceIndex];
      const colorEase = peak > previousColorLevel ? 0.09 : 0.035;
      const colorLevel = previousColorLevel + (peak - previousColorLevel) * colorEase;
      colorLevelsRef.current[traceIndex] = colorLevel;

      const amplitude = height * 0.19;
      context.fillStyle = smoothSignalColor(colorLevel, 0.16);
      context.strokeStyle = smoothSignalColor(colorLevel, 0.9);
      context.shadowColor = smoothSignalColor(colorLevel, 0.46);
      context.shadowBlur = 4;
      context.lineWidth = Math.max(1, canvas.width / 1100);
      context.beginPath();
      for (let index = 0; index < HISTORY_COLUMNS; index += 1) {
        const x = (index / (HISTORY_COLUMNS - 1)) * width;
        const y = center - history.positive[index] * amplitude;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      for (let index = HISTORY_COLUMNS - 1; index >= 0; index -= 1) {
        const x = (index / (HISTORY_COLUMNS - 1)) * width;
        context.lineTo(x, center - history.negative[index] * amplitude);
      }
      context.closePath();
      context.fill();
      context.stroke();

      context.strokeStyle = smoothSignalColor(colorLevel, 0.58);
      context.lineWidth = Math.max(1, canvas.width / 1400);
      context.beginPath();
      for (let index = 0; index < HISTORY_COLUMNS; index += 1) {
        const x = (index / (HISTORY_COLUMNS - 1)) * width;
        const y = center - history.rms[index] * amplitude * 0.72;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.stroke();
      context.shadowBlur = 0;
    }
  }, [analysersRef]);

  useAnimationFrame(draw, active);

  return (
    <VisualizerFrame
      title="WAVEFORM"
      serial="M/S HISTORY / DUAL"
      canvasRef={canvasRef}
      active={active}
      className="module--waveform"
      meta={<span>6 SEC / SCROLL</span>}
    >
      <span className="channel-label channel-label--one">CHANNEL 1 — SIDE</span>
      <span className="channel-label channel-label--two">CHANNEL 2 — MID</span>
    </VisualizerFrame>
  );
}
