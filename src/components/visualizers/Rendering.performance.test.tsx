import { render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IDLE_AUDIO_SNAPSHOT } from "@/lib/audio/analysis";
import * as signalTheme from "@/lib/visualization/signalTheme";
import type { AudioVisualizationBus, AudioVisualizationFrame, AudioVisualizationListener } from "@/types/audio";
import { Spectrogram } from "./Spectrogram";
import { Stereometer } from "./Stereometer";
import { Waveform } from "./Waveform";
import { Spectrum } from "./Spectrum";
import { Oscilloscope } from "./Oscilloscope";

function fixture() {
  const frame: AudioVisualizationFrame = {
    snapshot: { ...IDLE_AUDIO_SNAPSHOT, overallEnergy: 0.5 },
    frequencyData: new Uint8Array(2048).fill(200),
    oscilloscopeData: new Float32Array(2048),
    leftChannelData: new Float32Array([0.25, -0.5, 0.75, -1]),
    rightChannelData: new Float32Array([-0.25, 0.5, -0.75, 1]),
    sampleRate: 48000, frequencyFftSize: 4096, frameId: 1,
    sourceRevision: 1, quality: "HIGH", reducedMotion: false,
  };
  let listener: AudioVisualizationListener | undefined;
  const bus: AudioVisualizationBus = {
    frameRef: { current: frame },
    subscribe(callback) { listener = callback; return () => { listener = undefined; }; },
  };
  const context = {
    fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), stroke: vi.fn(), save: vi.fn(), restore: vi.fn(),
    closePath: vi.fn(), fill: vi.fn(), clearRect: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  } as unknown as CanvasRenderingContext2D;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
  return { bus, context, publish: (time: number) => listener?.(frame, time) };
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function trackVisibility() {
  let callback: IntersectionObserverCallback = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(next: IntersectionObserverCallback) { callback = next; }
    observe() {}
    disconnect = disconnect;
  });
  return {
    disconnect,
    set: (isIntersecting: boolean) => callback([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
  };
}

describe("live renderer work budgets", () => {
  it.each([Spectrogram, Waveform, Stereometer, Spectrum, Oscilloscope])(
    "preserves a current paused image after hidden playback (%#)", (Instrument) => {
      const visibility = trackVisibility();
      const { bus, context, publish } = fixture();
      const view = render(<Instrument analysis={bus} active />);
      publish(0);
      visibility.set(false);
      publish(16);
      publish(32);
      vi.mocked(context.fillRect).mockClear();
      view.rerender(<Instrument analysis={bus} active={false} />);
      expect(vi.mocked(context.fillRect).mock.calls.length).toBeGreaterThan(0);
      expect(vi.mocked(context.clearRect).mock.calls.length).toBe(1);
      visibility.set(true);
      expect(vi.mocked(context.clearRect).mock.calls.length).toBe(1);
    },
  );

  it("flushes a hidden spectrogram on pause without appending history twice", () => {
    const visibility = trackVisibility();
    const { bus, context, publish } = fixture();
    const view = render(<Spectrogram analysis={bus} active />);
    publish(0);
    visibility.set(false);
    publish(16);
    publish(32);
    vi.mocked(context.fillRect).mockClear();
    view.rerender(<Spectrogram analysis={bus} active={false} />);
    expect(vi.mocked(context.fillRect).mock.calls.length).toBe(103);
  });

  it.each([Spectrogram, Waveform, Stereometer, Spectrum, Oscilloscope])(
    "suspends off-screen canvas drawing and resumes on return (%#)", (Instrument) => {
      const visibility = trackVisibility();
      const { bus, context, publish } = fixture();
      const { unmount } = render(<Instrument analysis={bus} active />);
      publish(0);
      vi.mocked(context.fillRect).mockClear();
      vi.mocked(context.stroke).mockClear();
      visibility.set(false);
      publish(16);
      publish(32);
      expect(vi.mocked(context.fillRect).mock.calls.length).toBe(0);
      expect(vi.mocked(context.stroke).mock.calls.length).toBe(0);
      visibility.set(true);
      expect(vi.mocked(context.clearRect).mock.calls.length).toBe(1);
      publish(48);
      expect(context.fillRect).toHaveBeenCalled();
      unmount();
      expect(visibility.disconnect).toHaveBeenCalledTimes(1);
    },
  );

  it("keeps all spectrogram history columns while drawing is suspended", () => {
    const visibility = trackVisibility();
    const { bus, context, publish } = fixture();
    render(<Spectrogram analysis={bus} active />);
    publish(0);
    visibility.set(false);
    publish(16);
    publish(32);
    vi.mocked(context.fillRect).mockClear();
    visibility.set(true);
    publish(48);
    expect(context.fillRect).toHaveBeenCalledTimes(137);
  });
  it("reuses identical spectrogram colors while retaining every history cell", () => {
    const { bus, context, publish } = fixture();
    const interpolate = vi.spyOn(signalTheme, "signalColorForLevel");
    render(<Spectrogram analysis={bus} active />);
    publish(16);
    publish(32);
    expect(context.fillRect).toHaveBeenCalledTimes(104);
    expect(interpolate.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it("computes one motion factor per cohort while retaining all 2400 particles", () => {
    const { bus, context, publish } = fixture();
    render(<Stereometer analysis={bus} active />);
    const exponential = vi.spyOn(Math, "exp");
    publish(16);
    expect(context.fillRect).toHaveBeenCalledTimes(2401);
    expect(exponential.mock.calls.length).toBeLessThanOrEqual(3);
  });
});
