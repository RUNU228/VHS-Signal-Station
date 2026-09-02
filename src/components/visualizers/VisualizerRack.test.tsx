import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VisualizerRack } from "./VisualizerRack";
import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import type {
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
    subscribe: vi.fn((listener: AudioVisualizationListener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }),
  };

  return {
    analysis,
    listenerCount: () => listeners.size,
    publish(nextFrame = frame, time = 16) {
      analysis.frameRef.current = nextFrame;
      for (const listener of listeners) listener(nextFrame, time);
    },
  };
}

type RecordedGradient = {
  stops: Array<[number, string]>;
  addColorStop: (offset: number, color: string) => void;
};

function canvasContext(
  colors: string[], gradients: RecordedGradient[] = [],
): CanvasRenderingContext2D {
  let fillStyle: string | CanvasGradient | CanvasPattern = "";
  let strokeStyle: string | CanvasGradient | CanvasPattern = "";
  let shadowColor = "";
  return {
    createLinearGradient: () => {
      const stops: Array<[number, string]> = [];
      const gradient = {
        stops,
        addColorStop: (offset: number, color: string) => { stops.push([offset, color]); },
      };
      gradients.push(gradient);
      return gradient;
    },
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

  it("subscribes all five renderers to one bus", () => {
    const { analysis, listenerCount } = fakeBus();
    render(
      <VisualizerRack
        analysis={analysis}
        active
      />,
    );

    expect(analysis.subscribe).toHaveBeenCalledTimes(5);
    expect(listenerCount()).toBe(5);
  });

  it("unsubscribes all five renderers when the rack unmounts", () => {
    const { analysis, listenerCount } = fakeBus();
    const { unmount } = render(
      <VisualizerRack
        analysis={analysis}
        active
      />,
    );

    expect(listenerCount()).toBe(5);

    unmount();
    expect(listenerCount()).toBe(0);
  });

  it("preserves blue, yellow, and red local signal colors in the other instruments", () => {
    const colors: string[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      canvasContext(colors),
    );
    const bus = fakeBus();
    render(
      <VisualizerRack
        analysis={bus.analysis}
        active
      />,
    );

    act(() => bus.publish());

    const channels = colors.map(rgb).filter((value) => value !== null);
    expect(channels.some(([red, green, blue]) => blue > red && blue > green)).toBe(true);
    expect(channels.some(([red, green, blue]) => red > blue * 1.2 && green > blue * 1.2 && Math.abs(red - green) < 30)).toBe(true);
    expect(channels.some(([red, green, blue]) => red > green * 1.5 && red > blue * 1.5)).toBe(true);
  });

  it("retains frequency-colored waveform history across rerenders with one gradient per frame", () => {
    const gradients: RecordedGradient[] = [];
    const context = canvasContext([], gradients);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
    const bus = fakeBus();
    const { container, rerender } = render(<VisualizerRack analysis={bus.analysis} active />);
    const canvas = container.querySelector(".module--waveform canvas");
    expect(canvas).not.toBeNull();

    const midFrame = syntheticFrame();
    midFrame.frequencyFftSize = 4800;
    midFrame.frequencyData = new Uint8Array(2400);
    midFrame.frequencyData[100] = 255; // 1 kHz, yellow.
    act(() => bus.publish(midFrame, 0));
    expect(gradients).toHaveLength(1);
    expect(gradients[0].stops.at(-1)).toEqual([1, "hsl(60 100% 60%)"]);
    expect(gradients[0].stops.some(([, color]) => color.startsWith("hsl(180"))).toBe(true);

    rerender(<VisualizerRack analysis={bus.analysis} active />);
    expect(container.querySelector(".module--waveform canvas")).toBe(canvas);
    expect(bus.analysis.subscribe).toHaveBeenCalledTimes(5);
    expect(bus.listenerCount()).toBe(5);
    expect(gradients).toHaveLength(1);

    const highFrame = { ...midFrame, frequencyData: new Uint8Array(2400), frameId: 2,
      snapshot: { ...midFrame.snapshot, overallEnergy: 0.01 } };
    highFrame.frequencyData[1000] = 255; // 10 kHz, smoothed toward red.
    act(() => bus.publish(highFrame, 65));
    expect(gradients).toHaveLength(2);
    expect(gradients[1].stops).toContainEqual([358 / 359, "hsl(60 100% 60%)"]);
    const newestHue = Number(gradients[1].stops.at(-1)![1].match(/^hsl\(([\d.]+)/)![1]);
    expect(newestHue).toBeGreaterThan(20);
    expect(newestHue).toBeLessThan(25);

    act(() => bus.publish({ ...highFrame, sourceRevision: 2 }, 66));
    expect(gradients).toHaveLength(3);
    expect(gradients[2].stops).toContainEqual([358 / 359, "hsl(220 100% 60%)"]);
    expect(gradients[2].stops.at(-1)).toEqual([1, "hsl(0 100% 60%)"]);
    expect(container.querySelector(".module--waveform canvas")).toBe(canvas);
    expect(bus.listenerCount()).toBe(5);
  });
});
