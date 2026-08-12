"use client";

import { useCallback, useRef, type MutableRefObject } from "react";

import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { signalColor } from "@/lib/visualization/canvas";
import type { AudioAnalyserBundle } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

const HISTORY_COLUMNS = 72;
const FREQUENCY_ROWS = 34;

export function Spectrogram({
  analysersRef,
  active,
}: {
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const historyRef = useRef(new Uint8Array(HISTORY_COLUMNS * FREQUENCY_ROWS));
  useCanvasSurface(canvasRef);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analysersRef.current?.frequency;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !analyser) return;

    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    const data = dataRef.current;
    analyser.getByteFrequencyData(data);

    const history = historyRef.current;
    history.copyWithin(0, FREQUENCY_ROWS);
    for (let row = 0; row < FREQUENCY_ROWS; row += 1) {
      const normalized = row / (FREQUENCY_ROWS - 1);
      const bin = Math.min(
        data.length - 1,
        Math.floor(Math.pow(normalized, 1.65) * data.length * 0.52),
      );
      history[(HISTORY_COLUMNS - 1) * FREQUENCY_ROWS + (FREQUENCY_ROWS - 1 - row)] =
        data[bin];
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
        context.fillStyle = signalColor(energy, Math.max(0.12, energy * age));
        context.fillRect(
          column * cellWidth + 1,
          row * cellHeight + 1,
          Math.max(1, cellWidth - 2),
          Math.max(1, cellHeight - 2),
        );
      }
    }
  }, [analysersRef]);

  useAnimationFrame(draw, active);

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
