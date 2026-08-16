"use client";

import { useCallback, useRef } from "react";

import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { useVisualizationFrame } from "@/hooks/useVisualizationFrame";
import { signalColorForLevel } from "@/lib/visualization/signalTheme";
import type { AudioVisualizationBus, AudioVisualizationFrame } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

const HISTORY_COLUMNS = 72;
const FREQUENCY_ROWS = 34;

export function Spectrogram({
  analysis,
  active,
}: {
  analysis: AudioVisualizationBus;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef(new Uint8Array(HISTORY_COLUMNS * FREQUENCY_ROWS));
  const sourceRevisionRef = useRef<number | null>(null);
  useCanvasSurface(canvasRef);

  const draw = useCallback((frame: AudioVisualizationFrame) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const history = historyRef.current;
    if (sourceRevisionRef.current !== frame.sourceRevision) {
      sourceRevisionRef.current = frame.sourceRevision;
      history.fill(0);
    }

    const data = frame.frequencyData;
    history.copyWithin(0, FREQUENCY_ROWS);
    const newestColumn = (HISTORY_COLUMNS - 1) * FREQUENCY_ROWS;
    history.fill(0, newestColumn);
    if (data.length > 0) {
      for (let row = 0; row < FREQUENCY_ROWS; row += 1) {
        const normalized = row / (FREQUENCY_ROWS - 1);
        const bin = Math.min(
          data.length - 1,
          Math.floor(Math.pow(normalized, 1.65) * data.length * 0.52),
        );
        history[newestColumn + FREQUENCY_ROWS - 1 - row] = data[bin];
      }
    }

    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "#050707";
    context.fillRect(0, 0, width, height);
    const cellWidth = width / HISTORY_COLUMNS;
    const cellHeight = height / FREQUENCY_ROWS;

    for (let column = 0; column < HISTORY_COLUMNS; column += 1) {
      for (let row = 0; row < FREQUENCY_ROWS; row += 1) {
        const energy = history[column * FREQUENCY_ROWS + row] / 255;
        if (energy < 0.055) continue;
        const age = 0.42 + (column / HISTORY_COLUMNS) * 0.58;
        context.fillStyle = signalColorForLevel(
          energy,
          Math.max(0.08, energy * age),
        );
        context.fillRect(
          column * cellWidth + 1,
          row * cellHeight + 1,
          Math.max(1, cellWidth - 2),
          Math.max(1, cellHeight - 2),
        );
      }
    }
  }, []);

  useVisualizationFrame(analysis, draw, active);

  return (
    <VisualizerFrame
      title="SPECTROGRAM"
      serial="FFT-4096 / HIST"
      canvasRef={canvasRef}
      active={active}
      className="module--spectrogram"
      meta={<span>PARTICLE FIELD</span>}
    >
      <span className="screen-label screen-label--tl">LOW</span>
      <span className="screen-label screen-label--bl">HIGH</span>
      <span className="screen-label screen-label--br">LIVE →</span>
    </VisualizerFrame>
  );
}
