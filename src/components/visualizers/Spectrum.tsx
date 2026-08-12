"use client";

import { useCallback, useRef, type MutableRefObject } from "react";

import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useCanvasSurface } from "@/hooks/useCanvasSurface";
import {
  frequencyForBin,
  logFrequencyPosition,
  SPECTRUM_MAX_FREQUENCY,
  SPECTRUM_MIN_FREQUENCY,
} from "@/lib/audio/frequency";
import {
  signalGlow,
  smoothEnergy,
  smoothSignalColor,
} from "@/lib/visualization/canvas";
import type { AudioAnalyserBundle } from "@/types/audio";
import { VisualizerFrame } from "./VisualizerFrame";

const BAR_COUNT = 42;

export function Spectrum({
  analysersRef,
  active,
}: {
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>;
  active: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const peaksRef = useRef(new Float32Array(BAR_COUNT));
  const colorEnergyRef = useRef(0);
  useCanvasSurface(canvasRef);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const bundle = analysersRef.current;
    const analyser = bundle?.frequency;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !analyser || !bundle) return;
    if (!dataRef.current || dataRef.current.length !== analyser.frequencyBinCount) {
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    }
    const data = dataRef.current;
    analyser.getByteFrequencyData(data);
    const width = canvas.width;
    const height = canvas.height;
    context.fillStyle = "rgba(5, 7, 7, .32)";
    context.fillRect(0, 0, width, height);

    const gap = Math.max(2, width * 0.004);
    const barWidth = Math.max(1, width / BAR_COUNT - gap);
    const levels = new Float32Array(BAR_COUNT);
    let visibleBarCount = 0;
    let meanEnergy = 0;
    for (let bar = 0; bar < BAR_COUNT; bar += 1) {
      const position = bar / (BAR_COUNT - 1);
      const frequency = Math.exp(
        Math.log(SPECTRUM_MIN_FREQUENCY) +
          position *
            (Math.log(SPECTRUM_MAX_FREQUENCY) - Math.log(SPECTRUM_MIN_FREQUENCY)),
      );
      const estimatedBin = Math.round(
        (frequency * analyser.fftSize) / bundle.context.sampleRate,
      );
      const actualFrequency = frequencyForBin(
        estimatedBin,
        bundle.context.sampleRate,
        analyser.fftSize,
      );
      if (
        actualFrequency < SPECTRUM_MIN_FREQUENCY ||
        actualFrequency > SPECTRUM_MAX_FREQUENCY
      ) continue;
      const level = data[Math.min(data.length - 1, estimatedBin)] / 255;
      levels[bar] = level;
      meanEnergy += level;
      visibleBarCount += 1;
    }
    meanEnergy /= Math.max(1, visibleBarCount);
    colorEnergyRef.current = smoothEnergy(colorEnergyRef.current, meanEnergy);
    const glow = signalGlow(colorEnergyRef.current);

    for (let bar = 0; bar < BAR_COUNT; bar += 1) {
      const position = bar / (BAR_COUNT - 1);
      const frequency = Math.exp(
        Math.log(SPECTRUM_MIN_FREQUENCY) +
          position *
            (Math.log(SPECTRUM_MAX_FREQUENCY) - Math.log(SPECTRUM_MIN_FREQUENCY)),
      );
      const estimatedBin = Math.round(
        (frequency * analyser.fftSize) / bundle.context.sampleRate,
      );
      const actualFrequency = frequencyForBin(
        estimatedBin,
        bundle.context.sampleRate,
        analyser.fftSize,
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
      const colorLevel = Math.min(
        1,
        level * 0.72 + colorEnergyRef.current * 0.28,
      );
      context.fillStyle = smoothSignalColor(colorLevel, glow.barAlpha);
      context.fillRect(x, height - barHeight, barWidth, barHeight);

      const peak = Math.max(level, peaksRef.current[bar] - 0.009);
      peaksRef.current[bar] = peak;
      const peakColorLevel = Math.min(
        1,
        peak * 0.72 + colorEnergyRef.current * 0.28,
      );
      context.fillStyle = smoothSignalColor(peakColorLevel, glow.peakAlpha);
      context.fillRect(x, height - peak * height * 0.88 - 3, barWidth, 2);
    }
  }, [analysersRef]);

  useAnimationFrame(draw, active);

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
