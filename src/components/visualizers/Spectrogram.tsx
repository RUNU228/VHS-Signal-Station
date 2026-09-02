"use client";

import { useLanguage } from "@/components/LanguageProvider";

import { useCallback, useRef } from "react";

import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { useVisualizationFrame } from "@/hooks/useVisualizationFrame";
import { createSpectrogramColors, SPECTROGRAM_COLUMNS, SPECTROGRAM_ROWS } from "@/lib/visualization/spectrogram";
import type { AudioVisualizationBus, AudioVisualizationFrame } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

const HISTORY_COLUMNS = SPECTROGRAM_COLUMNS;
const FREQUENCY_ROWS = SPECTROGRAM_ROWS;

export function Spectrogram({
  analysis,
  active,
}: {
  analysis: AudioVisualizationBus;
  active: boolean;
}) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<Uint8Array | null>(null);
  const colorsRef = useRef<ReturnType<typeof createSpectrogramColors> | null>(null);
  const binsRef = useRef<{ length: number; indices: Uint32Array } | null>(null);
  const sourceRevisionRef = useRef<number | null>(null);
  const visibleRef = useCanvasSurface(canvasRef, { active });

  const draw = useCallback((frame: AudioVisualizationFrame, _time: number, renderOnly = false) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const history = historyRef.current ??= new Uint8Array(HISTORY_COLUMNS * FREQUENCY_ROWS);
    const colorFor = colorsRef.current ??= createSpectrogramColors();
    if (sourceRevisionRef.current !== frame.sourceRevision) {
      sourceRevisionRef.current = frame.sourceRevision;
      history.fill(0);
    }

    const data = frame.frequencyData;
    if (!renderOnly) {
      history.copyWithin(0, FREQUENCY_ROWS);
      const newestColumn = (HISTORY_COLUMNS - 1) * FREQUENCY_ROWS;
      history.fill(0, newestColumn);
      if (data.length > 0) {
        if (binsRef.current?.length !== data.length) {
          const indices = new Uint32Array(FREQUENCY_ROWS);
          for (let row = 0; row < FREQUENCY_ROWS; row += 1) {
            indices[row] = Math.min(data.length - 1,
              Math.floor(Math.pow(row / (FREQUENCY_ROWS - 1), 1.65) * data.length * 0.52));
          }
          binsRef.current = { length: data.length, indices };
        }
        const bins = binsRef.current.indices;
        for (let row = 0; row < FREQUENCY_ROWS; row += 1) {
          history[newestColumn + FREQUENCY_ROWS - 1 - row] = data[bins[row]];
        }
      }
    }
    if (!visibleRef.current && !renderOnly) return;
    const width = canvas.width;
    const height = canvas.height;
    if (renderOnly) context.clearRect(0, 0, width, height);
    context.fillStyle = "#050707";
    context.fillRect(0, 0, width, height);
    const cellWidth = width / HISTORY_COLUMNS;
    const cellHeight = height / FREQUENCY_ROWS;

    for (let column = 0; column < HISTORY_COLUMNS; column += 1) {
      for (let row = 0; row < FREQUENCY_ROWS; row += 1) {
        const amplitude = history[column * FREQUENCY_ROWS + row];
        if (amplitude < 15) continue;
        context.fillStyle = colorFor(amplitude, column);
        context.fillRect(
          column * cellWidth + 1,
          row * cellHeight + 1,
          Math.max(1, cellWidth - 2),
          Math.max(1, cellHeight - 2),
        );
      }
    }
  }, [visibleRef]);

  useVisualizationFrame(analysis, draw, active, visibleRef);

  return (
    <VisualizerFrame
      title={t.visualizers.spectrogram}
      serial={t.visualizers.spectrogramSerial}
      canvasRef={canvasRef}
      active={active}
      className="module--spectrogram"
      meta={<span>{t.visualizers.particles}</span>}
    >
      <span className="screen-label screen-label--tl">{t.visualizers.low}</span>
      <span className="screen-label screen-label--bl">{t.visualizers.high}</span>
      <span className="screen-label screen-label--br">{t.visualizers.live}</span>
    </VisualizerFrame>
  );
}
