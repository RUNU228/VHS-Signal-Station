"use client";

import { useLanguage } from "@/components/LanguageProvider";

import { useCallback, useRef } from "react";

import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { useVisualizationFrame } from "@/hooks/useVisualizationFrame";
import { toMidSide } from "@/lib/audio/midSide";
import {
  createWaveformColors,
  addWaveformColorStops,
  pushWaveformColor,
  waveformColorForPosition,
} from "@/lib/visualization/waveformColor";
import {
  clearWaveformHistory,
  createWaveformHistory,
  measureWaveformColumn,
  pushWaveformColumn,
  type WaveformHistory,
} from "@/lib/visualization/waveform";
import type { AudioVisualizationBus, AudioVisualizationFrame } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

type WaveBuffers = {
  mid: Float32Array<ArrayBuffer>;
  side: Float32Array<ArrayBuffer>;
};

const HISTORY_COLUMNS = 360;
const HISTORY_SEGMENT_LENGTH = 6;

type ChannelHistory = {
  mid: WaveformHistory;
  side: WaveformHistory;
};

export function Waveform({
  analysis,
  active,
}: {
  analysis: AudioVisualizationBus;
  active: boolean;
}) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buffersRef = useRef<WaveBuffers | null>(null);
  const historyRef = useRef<ChannelHistory | null>(null);
  const colorsRef = useRef<ReturnType<typeof createWaveformColors> | null>(null);
  const sourceRevisionRef = useRef<number | null>(null);
  useCanvasSurface(canvasRef);

  const draw = useCallback((frame: AudioVisualizationFrame, time: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const histories = historyRef.current ??= {
      mid: createWaveformHistory(HISTORY_COLUMNS),
      side: createWaveformHistory(HISTORY_COLUMNS),
    };
    const colors = colorsRef.current ??= createWaveformColors(HISTORY_COLUMNS);
    pushWaveformColor(colors, frame.frequencyData, frame.sampleRate,
      frame.frequencyFftSize, time, frame.sourceRevision);

    if (sourceRevisionRef.current !== frame.sourceRevision) {
      sourceRevisionRef.current = frame.sourceRevision;
      clearWaveformHistory(histories.side);
      clearWaveformHistory(histories.mid);
    }

    const size = Math.min(
      frame.leftChannelData.length,
      frame.rightChannelData.length,
    );
    if (!buffersRef.current || buffersRef.current.mid.length !== size) {
      buffersRef.current = {
        mid: new Float32Array(size),
        side: new Float32Array(size),
      };
    }
    const buffers = buffersRef.current;
    toMidSide(
      frame.leftChannelData,
      frame.rightChannelData,
      buffers.mid,
      buffers.side,
    );

    pushWaveformColumn(
      histories.side,
      measureWaveformColumn(buffers.side),
    );
    pushWaveformColumn(
      histories.mid,
      measureWaveformColumn(buffers.mid),
    );

    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .48)";
    context.fillRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, width, 0);
    addWaveformColorStops(gradient, colors.history);

    for (let traceIndex = 0; traceIndex < 2; traceIndex += 1) {
      const history = traceIndex === 0
        ? histories.side
        : histories.mid;
      const center = height * (traceIndex === 0 ? 0.27 : 0.73);
      context.strokeStyle = "rgba(111, 145, 168, .18)";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(0, center);
      context.lineTo(width, center);
      context.stroke();

      const amplitude = height * 0.19;
      for (
        let start = 0;
        start < HISTORY_COLUMNS - 1;
        start += HISTORY_SEGMENT_LENGTH
      ) {
        const end = Math.min(
          HISTORY_COLUMNS - 1,
          start + HISTORY_SEGMENT_LENGTH,
        );
        context.fillStyle = gradient;
        context.globalAlpha = 0.16;
        context.beginPath();
        for (let index = start; index <= end; index += 1) {
          const x = (index / (HISTORY_COLUMNS - 1)) * width;
          const y = center - history.positive[index] * amplitude;
          if (index === start) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        for (let index = end; index >= start; index -= 1) {
          const x = (index / (HISTORY_COLUMNS - 1)) * width;
          context.lineTo(x, center - history.negative[index] * amplitude);
        }
        context.closePath();
        context.fill();

        context.strokeStyle = gradient;
        context.globalAlpha = 0.9;
        context.shadowColor = waveformColorForPosition(
          colors.history[Math.floor((start + end) / 2)], true,
        );
        context.shadowBlur = 4;
        context.lineWidth = Math.max(1, canvas.width / 1100);
        context.beginPath();
        for (let index = start; index <= end; index += 1) {
          const x = (index / (HISTORY_COLUMNS - 1)) * width;
          const y = center - history.positive[index] * amplitude;
          if (index === start) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        for (let index = start; index <= end; index += 1) {
          const x = (index / (HISTORY_COLUMNS - 1)) * width;
          const y = center - history.negative[index] * amplitude;
          if (index === start) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();

        context.strokeStyle = gradient;
        context.globalAlpha = 0.58;
        context.lineWidth = Math.max(1, canvas.width / 1400);
        context.beginPath();
        for (let index = start; index <= end; index += 1) {
          const x = (index / (HISTORY_COLUMNS - 1)) * width;
          const y = center - history.rms[index] * amplitude * 0.72;
          if (index === start) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
        context.globalAlpha = 1;
      }
      context.shadowBlur = 0;
    }
  }, []);

  useVisualizationFrame(analysis, draw, active);

  return (
    <VisualizerFrame
      title={t.visualizers.waveform}
      serial={t.visualizers.waveSerial}
      canvasRef={canvasRef}
      active={active}
      className="module--waveform"
      meta={<span>{t.visualizers.scroll}</span>}
    >
      <span className="channel-label channel-label--one">{t.visualizers.side}</span>
      <span className="channel-label channel-label--two">{t.visualizers.mid}</span>
    </VisualizerFrame>
  );
}
