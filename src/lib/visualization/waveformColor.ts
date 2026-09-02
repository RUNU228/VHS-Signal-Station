type WaveformColors = {
  history: Float32Array;
  position: number;
  lastTime: number | null;
  sourceRevision: number | null;
  sampleRate: number;
  fftSize: number;
  frequencyPositions: Float32Array;
};

function bounded(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

export function createWaveformColors(length: number): WaveformColors {
  return {
    history: new Float32Array(length), position: 0, lastTime: null,
    sourceRevision: null, sampleRate: 0, fftSize: 0,
    frequencyPositions: new Float32Array(0),
  };
}

// Logarithmic anchors: 80 Hz blue, 1 kHz yellow, 10 kHz red.
function frequencyPosition(hz: number): number {
  return bounded(hz <= 1000
    ? 0.5 * Math.log(Math.max(80, hz) / 80) / Math.log(1000 / 80)
    : 0.5 + 0.5 * Math.log(hz / 1000) / Math.log(10));
}

export function pushWaveformColor(
  state: WaveformColors, bins: Uint8Array, sampleRate: number,
  fftSize: number, time: number, sourceRevision: number,
): number {
  if (state.sourceRevision !== sourceRevision) {
    state.history.fill(0);
    state.position = 0;
    state.lastTime = null;
    state.sourceRevision = sourceRevision;
  }
  if (state.sampleRate !== sampleRate || state.fftSize !== fftSize ||
      state.frequencyPositions.length !== bins.length) {
    state.sampleRate = sampleRate;
    state.fftSize = fftSize;
    state.frequencyPositions = new Float32Array(bins.length);
    if (Number.isFinite(sampleRate) && sampleRate > 0 && Number.isFinite(fftSize) && fftSize > 0) {
      for (let index = 1; index < bins.length; index++) {
        state.frequencyPositions[index] = frequencyPosition(index * sampleRate / fftSize);
      }
    }
  }
  let weight = 0;
  let weightedPosition = 0;
  // Ignore DC; square byte magnitudes to favor strong spectral content.
  for (let index = 1; index < bins.length; index++) {
    const energy = bins[index] * bins[index];
    weight += energy;
    weightedPosition += energy * state.frequencyPositions[index];
  }
  const target = weight > 0 ? bounded(weightedPosition / weight) : 0;
  const now = Number.isFinite(time) ? time : (state.lastTime ?? 0);
  const elapsed = state.lastTime === null ? 0 : Math.max(0, now - state.lastTime);
  state.position = state.lastTime === null ? target
    : bounded(state.position + (target - state.position) * (1 - Math.exp(-elapsed / 65)));
  state.lastTime = Math.max(state.lastTime ?? now, now);
  state.history.copyWithin(0, 1);
  state.history[state.history.length - 1] = state.position;
  return state.position;
}

// A saturated hue path avoids gray/brown RGB blends. Cached once, not per frame.
const PALETTE = Array.from({ length: 1025 }, (_, index) => {
  const position = index / 1024;
  const hue = position <= 0.5 ? 220 - position * 320 : 120 - position * 120;
  return `hsl(${hue} 100% 60%)`;
});
const GLOW_PALETTE = PALETTE.map((color) => color.replace(")", " / 46%)"));

export function waveformColorForPosition(position: number, glow = false): string {
  return (glow ? GLOW_PALETTE : PALETTE)[Math.round(bounded(position) * (PALETTE.length - 1))];
}

export function addWaveformColorStops(
  gradient: Pick<CanvasGradient, "addColorStop">, history: Float32Array,
): void {
  gradient.addColorStop(0, waveformColorForPosition(history[0]));
  for (let index = 1; index < history.length; index++) {
    const previous = bounded(history[index - 1]);
    const current = bounded(history[index]);
    // Canvas interpolates RGB: subdivide large jumps along the vivid hue path.
    const steps = Math.max(1, Math.ceil(Math.abs(current - previous) * 32));
    for (let step = 1; step <= steps; step++) {
      const fraction = step / steps;
      gradient.addColorStop((index - 1 + fraction) / (history.length - 1),
        waveformColorForPosition(previous + (current - previous) * fraction));
    }
  }
}
