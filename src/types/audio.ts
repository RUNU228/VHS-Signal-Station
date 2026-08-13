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

export type AudioReactiveSnapshot = {
  volume: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  treble: number;
  peak: number;
  smoothed: number;
};

export type PlaybackStatus = "NO SIGNAL" | "READY" | "PLAYING" | "PAUSED" | "END";
