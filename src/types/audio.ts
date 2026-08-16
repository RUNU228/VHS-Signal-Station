import type { MutableRefObject } from "react";

export type AudioFormat = "WAV" | "MP3";

export type AudioTrack = {
  id: string;
  file: File;
  url: string;
  name: string;
  duration: number;
  format: AudioFormat;
};

export type AudioAnalyserBundle = {
  context: AudioContext;
  frequency: AnalyserNode;
  oscilloscope: AnalyserNode;
  left: AnalyserNode;
  right: AnalyserNode;
};

export type SignalState = "IDLE" | "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export type AudioReactiveSnapshot = {
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  overallEnergy: number;
  bassEnergy: number;
  transientEnergy: number;
  peakStrength: number;
  smoothedEnergy: number;
  stereoBalance: number;
  stereoWidth: number;
  signalState: SignalState;
  peakEventId: number;
  peakSeed: number;
  volume: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  treble: number;
  peak: number;
  smoothed: number;
};

export type AudioAnalysisState = {
  snapshot: AudioReactiveSnapshot;
  previousRawEnergy: number;
  slowEnvelope: number;
  lastPeakAt: number;
};

export type VisualQuality = "LOW" | "MEDIUM" | "HIGH";

export type AudioVisualizationFrame = {
  snapshot: AudioReactiveSnapshot;
  frequencyData: Uint8Array<ArrayBuffer>;
  oscilloscopeData: Float32Array<ArrayBuffer>;
  leftChannelData: Float32Array<ArrayBuffer>;
  rightChannelData: Float32Array<ArrayBuffer>;
  sampleRate: number;
  frequencyFftSize: number;
  frameId: number;
  sourceRevision: number;
  quality: VisualQuality;
  reducedMotion: boolean;
};

export type AudioVisualizationListener = (
  frame: AudioVisualizationFrame,
  time: number,
) => void;

export type AudioVisualizationBus = {
  frameRef: MutableRefObject<AudioVisualizationFrame>;
  snapshotRef: MutableRefObject<AudioReactiveSnapshot>;
  subscribe: (listener: AudioVisualizationListener) => () => void;
};

export type AnalysisInput = {
  bins: Uint8Array;
  sampleRate: number;
  fftSize: number;
  nowMs: number;
  state: AudioAnalysisState;
};

export type PlaybackStatus = "NO SIGNAL" | "READY" | "PLAYING" | "PAUSED" | "END";
