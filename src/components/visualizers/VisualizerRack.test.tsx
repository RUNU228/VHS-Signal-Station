import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VisualizerRack } from "./VisualizerRack";
import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type {
  AudioAnalyserBundle,
  AudioVisualizationBus,
  AudioVisualizationFrame,
  AudioVisualizationListener,
} from "@/types/audio";

function syntheticFrame(): AudioVisualizationFrame {
  return {
    snapshot: {
      ...IDLE_AUDIO_SNAPSHOT,
      overallEnergy: 0.5,
      peakEventId: 1,
      peakStrength: 0.9,
      peakSeed: 0.25,
    },
    frequencyData: new Uint8Array([24, 128, 255, 128, 24, 255]),
    oscilloscopeData: new Float32Array([0, 0, 0.5, -0.5, 1, -1]),
    leftChannelData: new Float32Array([0, 0.5, 1, -1]),
    rightChannelData: new Float32Array([0, -0.5, -1, 1]),
    sampleRate: 48_000,
    frequencyFftSize: 64,
    frameId: 1,
    sourceRevision: 1,
    quality: "HIGH",
    reducedMotion: false,
  };
}

function fakeBus() {
  const listeners = new Set<AudioVisualizationListener>();
  const frame = syntheticFrame();
  const analysis: AudioVisualizationBus = {
    frameRef: { current: frame },
    snapshotRef: { current: frame.snapshot },
    subscribe: vi.fn((listener: AudioVisualizationListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };

  return {
    analysis,
    publish(nextFrame = frame, time = 16) {
      analysis.frameRef.current = nextFrame;
      for (const listener of listeners) listener(nextFrame, time);
    },
  };
}

function canvasContext(colors: string[]): CanvasRenderingContext2D {
  let fillStyle: string | CanvasGradient | CanvasPattern = "";
  let strokeStyle: string | CanvasGradient | CanvasPattern = "";
  let shadowColor = "";
  return {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn(),
    get fillStyle() { return fillStyle; },
    set fillStyle(value) {
      fillStyle = value;
      if (typeof value === "string") colors.push(value);
    },
    get strokeStyle() { return strokeStyle; },
    set strokeStyle(value) {
      strokeStyle = value;
      if (typeof value === "string") colors.push(value);
    },
    get shadowColor() { return shadowColor; },
    set shadowColor(value) {
      shadowColor = value;
      colors.push(value);
    },
    lineWidth: 1,
    shadowBlur: 0,
  } as unknown as CanvasRenderingContext2D;
}

function rgb(color: string): readonly number[] | null {
  const values = color.match(/^rgba\(([\d.]+), ([\d.]+), ([\d.]+),/);
  return values ? values.slice(1).map(Number) : null;
}

describe("VisualizerRack", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps all five instruments visible while there is no signal", () => {
    const { analysis } = fakeBus();
    render(
      <VisualizerRack
        analysis={analysis}
        analysersRef={createRef<AudioAnalyserBundle | null>()}
        active={false}
      />,
    );

    for (const title of [
      "SPECTROGRAM",
      "WAVEFORM",
      "STEREOMETER",
      "OSCILLOSCOPE",
      "SPECTRUM",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByText("NO SIGNAL")).toHaveLength(5);
    expect(screen.getByText("CHANNEL 1 — SIDE")).toBeInTheDocument();
    expect(screen.getByText("CHANNEL 2 — MID")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("5K")).toBeInTheDocument();
  });

  it("marks each live instrument frame for subtle shared reactions", () => {
    const { analysis } = fakeBus();
    const { container } = render(
      <VisualizerRack
        analysis={analysis}
        analysersRef={createRef<AudioAnalyserBundle | null>()}
        active
      />,
    );

    const panels = container.querySelectorAll(
      ".visualizer-rack .equipment-panel",
    );
    expect(panels).toHaveLength(5);
    for (const panel of panels) {
      expect(panel).toHaveAttribute("data-reactive", "true");
    }
  });

  it("subscribes the four migrated renderers to one bus", () => {
    const { analysis } = fakeBus();
    render(
      <VisualizerRack
        analysis={analysis}
        analysersRef={createRef<AudioAnalyserBundle | null>()}
        active
      />,
    );

    expect(analysis.subscribe).toHaveBeenCalledTimes(4);
  });

  it("draws blue, yellow, and red local signal colors from one published frame", () => {
    const colors: string[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      canvasContext(colors),
    );
    const bus = fakeBus();
    render(
      <VisualizerRack
        analysis={bus.analysis}
        analysersRef={createRef<AudioAnalyserBundle | null>()}
        active
      />,
    );

    act(() => bus.publish());

    const channels = colors.map(rgb).filter((value) => value !== null);
    expect(channels.some(([red, green, blue]) => blue > red && blue > green)).toBe(true);
    expect(channels.some(([red, green, blue]) => red > blue * 1.2 && green > blue * 1.2 && Math.abs(red - green) < 30)).toBe(true);
    expect(channels.some(([red, green, blue]) => red > green * 1.5 && red > blue * 1.5)).toBe(true);
  });
});
