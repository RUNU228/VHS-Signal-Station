"use client";

import { useCallback, useRef } from "react";

import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import { useVisualizationFrame } from "@/hooks/useVisualizationFrame";
import {
  frequencyForBin,
  logFrequencyPosition,
  SPECTRUM_MAX_FREQUENCY,
  SPECTRUM_MIN_FREQUENCY,
} from "@/lib/audio/frequency";
import { signalGlow } from "@/lib/visualization/canvas";
import {
  localSignalLevel,
  signalColorForLevel,
} from "@/lib/visualization/signalTheme";
import type { AudioVisualizationBus, AudioVisualizationFrame } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

const BAR_COUNT = 42;

export function Spectrum({
  analysis,
  active,
}: {
  analysis: AudioVisualizationBus;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const levelsRef = useRef(new Float32Array(BAR_COUNT));
  const peaksRef = useRef(new Float32Array(BAR_COUNT));
  const sourceRevisionRef = useRef<number | null>(null);
  useCanvasSurface(canvasRef);

  const draw = useCallback((frame: AudioVisualizationFrame) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    if (sourceRevisionRef.current !== frame.sourceRevision) {
      sourceRevisionRef.current = frame.sourceRevision;
      peaksRef.current.fill(0);
    }

    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .32)";
    context.fillRect(0, 0, width, height);
    if (frame.frequencyData.length === 0) return;

    const gap = Math.max(2, width * 0.004);
    const barWidth = Math.max(1, width / BAR_COUNT - gap);
    const levels = levelsRef.current;
    levels.fill(0);

    for (let bar = 0; bar < BAR_COUNT; bar += 1) {
      const position = bar / (BAR_COUNT - 1);
      const frequency = Math.exp(
        Math.log(SPECTRUM_MIN_FREQUENCY) +
          position *
            (Math.log(SPECTRUM_MAX_FREQUENCY) - Math.log(SPECTRUM_MIN_FREQUENCY)),
      );
      const estimatedBin = Math.round(
        (frequency * frame.frequencyFftSize) / frame.sampleRate,
      );
      const actualFrequency = frequencyForBin(
        estimatedBin,
        frame.sampleRate,
        frame.frequencyFftSize,
      );
      if (
        actualFrequency < SPECTRUM_MIN_FREQUENCY ||
        actualFrequency > SPECTRUM_MAX_FREQUENCY
      ) continue;
      levels[bar] = frame.frequencyData[
        Math.min(frame.frequencyData.length - 1, estimatedBin)
      ] / 255;
    }

    for (let bar = 0; bar < BAR_COUNT; bar += 1) {
      const position = bar / (BAR_COUNT - 1);
      const frequency = Math.exp(
        Math.log(SPECTRUM_MIN_FREQUENCY) +
          position *
            (Math.log(SPECTRUM_MAX_FREQUENCY) - Math.log(SPECTRUM_MIN_FREQUENCY)),
      );
      const estimatedBin = Math.round(
        (frequency * frame.frequencyFftSize) / frame.sampleRate,
      );
      const actualFrequency = frequencyForBin(
        estimatedBin,
        frame.sampleRate,
        frame.frequencyFftSize,
      );
      if (
        actualFrequency < SPECTRUM_MIN_FREQUENCY ||
        actualFrequency > SPECTRUM_MAX_FREQUENCY
      ) continue;

      const level = levels[bar];
      const x = logFrequencyPosition(
        frequency,
        SPECTRUM_MIN_FREQUENCY,
        SPECTRUM_MAX_FREQUENCY,
      ) * (width - barWidth);
      const barHeight = Math.max(1, level * height * 0.88);
      const colorLevel = localSignalLevel(level, frame.snapshot.overallEnergy);
      context.fillStyle = signalColorForLevel(
        colorLevel,
        signalGlow(colorLevel).barAlpha,
      );
      context.fillRect(x, height - barHeight, barWidth, barHeight);

      const peak = Math.max(level, peaksRef.current[bar] - 0.009);
      peaksRef.current[bar] = peak;
      const peakColorLevel = localSignalLevel(peak, frame.snapshot.overallEnergy);
      context.fillStyle = signalColorForLevel(
        peakColorLevel,
        signalGlow(peakColorLevel).peakAlpha,
      );
      context.fillRect(x, height - peak * height * 0.88 - 3, barWidth, 2);
    }
  }, []);

  useVisualizationFrame(analysis, draw, active);

  return (
    <VisualizerFrame
      title="SPECTRUM"
      serial="FFT-4096 / LOG"
      canvasRef={canvasRef}
      active={active}
      className="module--spectrum"
      meta={<span>100 HZ — 5 KHZ</span>}
    >
      <div className="frequency-scale" aria-label="Frequency scale">
        {[
          ["100", 0],
          ["200", 0.18],
          ["500", 0.41],
          ["1K", 0.59],
          ["2K", 0.77],
          ["5K", 1],
        ].map(([label, position]) => (
          <span key={label} style={{ left: `${Number(position) * 100}%` }}>
            {label}
          </span>
        ))}
      </div>
    </VisualizerFrame>
  );
}
