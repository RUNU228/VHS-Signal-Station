import type {
  AnalysisInput,
  AudioAnalysisState,
  AudioReactiveSnapshot,
  SignalState,
} from "@/types/audio";

const LOW_BAND = [20, 250] as const;
const MID_BAND = [250, 4_000] as const;
const HIGH_BAND = [4_000, 20_000] as const;
const PEAK_COOLDOWN_MS = 140;
const PEAK_ENERGY_THRESHOLD = 0.68;
const TRANSIENT_THRESHOLD = 0.075;

type FrequencyBand = readonly [fromHz: number, toHz: number];

type LegacyAnalysisInput = {
  bins: Uint8Array;
  sampleRate: number;
  fftSize: number;
  previous: AudioReactiveSnapshot;
};

type AudioAnalysisResult = AudioAnalysisState & AudioReactiveSnapshot;

export const IDLE_AUDIO_SNAPSHOT: Readonly<AudioReactiveSnapshot> = Object.freeze({
  lowEnergy: 0,
  midEnergy: 0,
  highEnergy: 0,
  overallEnergy: 0,
  bassEnergy: 0,
  transientEnergy: 0,
  peakStrength: 0,
  smoothedEnergy: 0,
  stereoBalance: 0,
  stereoWidth: 0,
  signalState: "IDLE",
  peakEventId: 0,
  peakSeed: 0,
});

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function clampSigned(value: number): number {
  return Math.min(1, Math.max(-1, Number.isFinite(value) ? value : 0));
}

function smooth(previous: number, target: number, attack: number, release: number): number {
  const safePrevious = clamp01(previous);
  const safeTarget = clamp01(target);
  const amount = safeTarget > safePrevious ? attack : release;
  return clamp01(safePrevious + (safeTarget - safePrevious) * amount);
}

function binRange(
  bins: Uint8Array,
  sampleRate: number,
  fftSize: number,
  [fromHz, toHz]: FrequencyBand,
): readonly [start: number, end: number] {
  const start = Math.max(0, Math.floor((fromHz * fftSize) / sampleRate));
  const end = Math.min(
    bins.length,
    Math.max(start + 1, Math.ceil((toHz * fftSize) / sampleRate)),
  );
  return [Math.min(start, bins.length), end];
}

function rms(
  bins: Uint8Array,
  sampleRate: number,
  fftSize: number,
  band: FrequencyBand,
): number {
  const [start, end] = binRange(bins, sampleRate, fftSize, band);
  if (end <= start) return 0;

  let sumSquares = 0;
  for (let index = start; index < end; index += 1) {
    const value = bins[index] / 255;
    sumSquares += value * value;
  }
  return clamp01(Math.sqrt(sumSquares / (end - start)));
}

function peakSeedFor(eventId: number): number {
  return (eventId * 0.61803398875) % 1;
}

function asResult(state: AudioAnalysisState): AudioAnalysisResult {
  return { ...state.snapshot, ...state };
}

function stateFromLegacySnapshot(previous: AudioReactiveSnapshot): AudioAnalysisState {
  if (
    "snapshot" in previous &&
    "previousRawEnergy" in previous &&
    "slowEnvelope" in previous &&
    "lastPeakAt" in previous
  ) {
    return previous as AudioAnalysisResult;
  }

  return {
    snapshot: previous,
    previousRawEnergy: previous.overallEnergy,
    slowEnvelope: previous.smoothedEnergy,
    lastPeakAt: Number.NEGATIVE_INFINITY,
  };
}

export function createAudioAnalysisState(): AudioAnalysisState {
  return {
    snapshot: { ...IDLE_AUDIO_SNAPSHOT },
    previousRawEnergy: 0,
    slowEnvelope: 0,
    lastPeakAt: Number.NEGATIVE_INFINITY,
  };
}

export function classifySignalState(
  energy: number,
  previous: SignalState,
): SignalState {
  const value = clamp01(energy);
  if (previous === "EXTREME" && value >= 0.80) return "EXTREME";
  if (previous === "HIGH" && value >= 0.64) return "HIGH";
  if (previous === "MEDIUM" && value >= 0.31) return "MEDIUM";
  if (value >= 0.85) return "EXTREME";
  if (value >= 0.70) return "HIGH";
  if (value >= 0.35) return "MEDIUM";
  if (value >= 0.10) return "LOW";
  return "IDLE";
}

export function analyseFrequencyData(input: AnalysisInput): AudioAnalysisResult;
export function analyseFrequencyData(input: LegacyAnalysisInput): AudioAnalysisResult;
export function analyseFrequencyData(input: AnalysisInput | LegacyAnalysisInput): AudioAnalysisResult {
  const { bins, sampleRate, fftSize } = input;
  const state = "state" in input
    ? input.state
    : stateFromLegacySnapshot(input.previous);
  const nowMs = "nowMs" in input
    ? input.nowMs
    : globalThis.performance?.now() ?? Date.now();

  if (bins.length === 0 || sampleRate <= 0 || fftSize <= 0) {
    return asResult(createAudioAnalysisState());
  }

  const rawLow = clamp01(rms(bins, sampleRate, fftSize, LOW_BAND) * 1.6);
  const rawMid = clamp01(rms(bins, sampleRate, fftSize, MID_BAND) * 1.6);
  const rawHigh = clamp01(rms(bins, sampleRate, fftSize, HIGH_BAND) * 1.6);
  const weighted = rawLow * 0.4 + rawMid * 0.35 + rawHigh * 0.25;
  const rawOverall = clamp01(Math.max(
    weighted,
    rawLow * 0.72,
    rawMid * 0.68,
    rawHigh * 0.62,
  ));
  const rise = Math.max(0, rawOverall - state.previousRawEnergy);
  const envelopeDelta = Math.max(0, rawOverall - state.slowEnvelope);
  const transientEnergy = clamp01(rise * 2.4 + envelopeDelta * 1.2);
  const eligible =
    nowMs - state.lastPeakAt >= PEAK_COOLDOWN_MS &&
    rawOverall >= PEAK_ENERGY_THRESHOLD &&
    transientEnergy >= TRANSIENT_THRESHOLD;
  const peakStrength = eligible
    ? clamp01(rawOverall * 0.55 + transientEnergy * 0.45)
    : smooth(state.snapshot.peakStrength, 0, 1, 0.22);
  const peakEventId = eligible
    ? state.snapshot.peakEventId + 1
    : state.snapshot.peakEventId;

  const lowEnergy = smooth(state.snapshot.lowEnergy, rawLow, 0.32, 0.075);
  const midEnergy = smooth(state.snapshot.midEnergy, rawMid, 0.32, 0.075);
  const highEnergy = smooth(state.snapshot.highEnergy, rawHigh, 0.32, 0.075);
  const overallEnergy = smooth(state.snapshot.overallEnergy, rawOverall, 0.32, 0.075);
  const smoothedEnergy = smooth(
    state.snapshot.smoothedEnergy,
    rawOverall,
    0.18,
    0.045,
  );
  const slowEnvelope = smooth(state.slowEnvelope, rawOverall, 0.04, 0.04);

  return asResult({
    snapshot: {
      lowEnergy,
      midEnergy,
      highEnergy,
      overallEnergy,
      bassEnergy: lowEnergy,
      transientEnergy,
      peakStrength,
      smoothedEnergy,
      stereoBalance: clampSigned(state.snapshot.stereoBalance),
      stereoWidth: clamp01(state.snapshot.stereoWidth),
      signalState: classifySignalState(overallEnergy, state.snapshot.signalState),
      peakEventId,
      peakSeed: eligible ? peakSeedFor(peakEventId) : state.snapshot.peakSeed,
    },
    previousRawEnergy: rawOverall,
    slowEnvelope: eligible ? rawOverall : slowEnvelope,
    lastPeakAt: eligible ? nowMs : state.lastPeakAt,
  });
}

export function decayAudioAnalysis(
  state: AudioAnalysisState,
  nowMs: number,
): AudioAnalysisResult {
  const snapshot = state.snapshot;
  const peakStrength = nowMs - state.lastPeakAt >= PEAK_COOLDOWN_MS
    ? 0
    : smooth(snapshot.peakStrength, 0, 1, 0.22);
  const lowEnergy = smooth(snapshot.lowEnergy, 0, 0.32, 0.075);
  const midEnergy = smooth(snapshot.midEnergy, 0, 0.32, 0.075);
  const highEnergy = smooth(snapshot.highEnergy, 0, 0.32, 0.075);
  const overallEnergy = smooth(snapshot.overallEnergy, 0, 0.32, 0.075);
  const smoothedEnergy = smooth(snapshot.smoothedEnergy, 0, 0.18, 0.045);

  return asResult({
    snapshot: {
      lowEnergy,
      midEnergy,
      highEnergy,
      overallEnergy,
      bassEnergy: lowEnergy,
      transientEnergy: 0,
      peakStrength,
      smoothedEnergy,
      stereoBalance: clampSigned(snapshot.stereoBalance),
      stereoWidth: clamp01(snapshot.stereoWidth),
      signalState: classifySignalState(overallEnergy, snapshot.signalState),
      peakEventId: snapshot.peakEventId,
      peakSeed: snapshot.peakSeed,
    },
    previousRawEnergy: 0,
    slowEnvelope: smooth(state.slowEnvelope, 0, 0.04, 0.04),
    lastPeakAt: state.lastPeakAt,
  });
}
