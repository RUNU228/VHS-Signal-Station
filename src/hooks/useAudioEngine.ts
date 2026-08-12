"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import { getNextIndex, getPreviousIndex } from "@/lib/audio/queue";
import type {
  AudioAnalyserBundle,
  AudioTrack,
  PlaybackStatus,
} from "@/types/audio";

export type AudioEngineOptions = {
  createAudioElement?: () => HTMLAudioElement;
  createAudioContext?: () => AudioContext | null;
};

export type AudioEngine = {
  tracks: AudioTrack[];
  currentTrackIndex: number | null;
  currentTrack: AudioTrack | null;
  nextTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  audioReady: boolean;
  endOfQueue: boolean;
  status: PlaybackStatus;
  error: string | null;
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>;
  appendTracks: (tracks: AudioTrack[]) => void;
  selectTrack: (index: number) => void;
  togglePlayback: () => Promise<void>;
  previous: () => void;
  next: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  clearError: () => void;
};

const defaultOptions: Required<AudioEngineOptions> = {
  createAudioElement: () => new Audio(),
  createAudioContext: () => {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    return AudioContextConstructor ? new AudioContextConstructor() : null;
  },
};

export function useAudioEngine(options: AudioEngineOptions = {}): AudioEngine {
  const optionsRef = useRef({ ...defaultOptions, ...options });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analysersRef = useRef<AudioAnalyserBundle | null>(null);
  const tracksRef = useRef<AudioTrack[]>([]);
  const currentIndexRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const volumeRef = useRef(0.72);
  const mutedRef = useRef(false);
  const loadTrackRef = useRef<
    (index: number, shouldPlay: boolean, source?: AudioTrack[]) => void
  >(() => undefined);

  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.72);
  const [isMuted, setIsMuted] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [endOfQueue, setEndOfQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPlayingState = useCallback((value: boolean) => {
    isPlayingRef.current = value;
    setIsPlaying(value);
  }, []);

  const ensureAudioGraph = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || analysersRef.current) return;

    try {
      const context = optionsRef.current.createAudioContext();
      if (!context) return;

      const source = context.createMediaElementSource(audio);
      const gain = context.createGain();
      const frequency = context.createAnalyser();
      const oscilloscope = context.createAnalyser();
      const splitter = context.createChannelSplitter(2);
      const left = context.createAnalyser();
      const right = context.createAnalyser();

      frequency.fftSize = 4096;
      frequency.smoothingTimeConstant = 0.72;
      oscilloscope.fftSize = 2048;
      left.fftSize = 2048;
      right.fftSize = 2048;

      source.connect(gain);
      gain.connect(context.destination);
      source.connect(frequency);
      source.connect(oscilloscope);
      source.connect(splitter);
      splitter.connect(left, 0);
      splitter.connect(right, 1);

      gain.gain.value = mutedRef.current ? 0 : volumeRef.current;
      audioContextRef.current = context;
      gainRef.current = gain;
      analysersRef.current = { context, frequency, oscilloscope, left, right };

      if (context.state === "suspended") {
        await context.resume();
      }
    } catch {
      setError("UNABLE TO INITIALIZE AUDIO SIGNAL");
    }
  }, []);

  const playMedia = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || currentIndexRef.current === null) return;

    await ensureAudioGraph();
    const context = audioContextRef.current;
    if (context?.state === "suspended") {
      await context.resume();
    }

    try {
      await audio.play();
    } catch {
      setPlayingState(false);
      setError("UNABLE TO PLAY AUDIO SIGNAL");
    }
  }, [ensureAudioGraph, setPlayingState]);

  const loadTrack = useCallback(
    (index: number, shouldPlay: boolean, source = tracksRef.current) => {
      const track = source[index];
      const audio = audioRef.current;
      if (!track || !audio) return;

      audio.pause();
      currentIndexRef.current = index;
      currentTimeRef.current = 0;
      durationRef.current = track.duration;
      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setDuration(track.duration);
      setAudioReady(true);
      setEndOfQueue(false);
      setError(null);

      audio.src = track.url;
      audio.currentTime = 0;
      audio.load();

      if (shouldPlay) {
        void playMedia();
      } else {
        setPlayingState(false);
      }
    },
    [playMedia, setPlayingState],
  );

  useEffect(() => {
    loadTrackRef.current = loadTrack;
  }, [loadTrack]);

  useEffect(() => {
    const audio = optionsRef.current.createAudioElement();
    audio.preload = "metadata";
    audio.volume = volumeRef.current;
    audio.muted = mutedRef.current;
    audioRef.current = audio;

    const handleTime = () => {
      currentTimeRef.current = audio.currentTime;
      setCurrentTime(audio.currentTime);
    };
    const handleDuration = () => {
      const trackIndex = currentIndexRef.current;
      const fallback = trackIndex === null ? 0 : tracksRef.current[trackIndex]?.duration ?? 0;
      const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : fallback;
      durationRef.current = nextDuration;
      setDuration(nextDuration);
      setAudioReady(trackIndex !== null);
    };
    const handlePlay = () => setPlayingState(true);
    const handlePause = () => setPlayingState(false);
    const handleError = () => setError("UNABLE TO READ AUDIO SIGNAL");
    const handleEnded = () => {
      const index = currentIndexRef.current;
      if (index === null) return;
      const nextIndex = getNextIndex(index, tracksRef.current.length);
      if (nextIndex !== null) {
        loadTrackRef.current(nextIndex, true);
        return;
      }

      const finalDuration = durationRef.current || tracksRef.current[index]?.duration || 0;
      currentTimeRef.current = finalDuration;
      setCurrentTime(finalDuration);
      setEndOfQueue(true);
      setPlayingState(false);
      audio.pause();
    };

    audio.addEventListener("timeupdate", handleTime);
    audio.addEventListener("durationchange", handleDuration);
    audio.addEventListener("loadedmetadata", handleDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTime);
      audio.removeEventListener("durationchange", handleDuration);
      audio.removeEventListener("loadedmetadata", handleDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      void audioContextRef.current?.close();
      audioRef.current = null;
      audioContextRef.current = null;
      gainRef.current = null;
      analysersRef.current = null;
      if (typeof URL.revokeObjectURL === "function") {
        for (const track of tracksRef.current) {
          URL.revokeObjectURL(track.url);
        }
      }
    };
  }, [setPlayingState]);

  const appendTracks = useCallback(
    (newTracks: AudioTrack[]) => {
      if (newTracks.length === 0) return;
      const wasEmpty = tracksRef.current.length === 0;
      const nextTracks = [...tracksRef.current, ...newTracks];
      tracksRef.current = nextTracks;
      setTracks(nextTracks);
      if (wasEmpty) {
        loadTrack(0, false, nextTracks);
      }
    },
    [loadTrack],
  );

  const selectTrack = useCallback(
    (index: number) => {
      loadTrack(index, isPlayingRef.current);
    },
    [loadTrack],
  );

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.min(Math.max(time, 0), durationRef.current);
    audio.currentTime = clamped;
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    if (clamped < durationRef.current) setEndOfQueue(false);
  }, []);

  const togglePlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || currentIndexRef.current === null) return;
    if (isPlayingRef.current) {
      audio.pause();
      return;
    }
    if (
      durationRef.current > 0 &&
      currentTimeRef.current >= durationRef.current - 0.05
    ) {
      seek(0);
      setEndOfQueue(false);
    }
    await playMedia();
  }, [playMedia, seek]);

  const previous = useCallback(() => {
    const index = currentIndexRef.current;
    if (index === null) return;
    const previousIndex = getPreviousIndex(index, currentTimeRef.current);
    if (previousIndex === index) {
      seek(0);
      return;
    }
    loadTrack(previousIndex, isPlayingRef.current);
  }, [loadTrack, seek]);

  const next = useCallback(() => {
    const index = currentIndexRef.current;
    if (index === null) return;
    const nextIndex = getNextIndex(index, tracksRef.current.length);
    if (nextIndex === null) {
      setEndOfQueue(true);
      return;
    }
    loadTrack(nextIndex, isPlayingRef.current);
  }, [loadTrack]);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(Math.max(value, 0), 1);
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (audioRef.current) audioRef.current.volume = clamped;
    if (gainRef.current && !mutedRef.current) gainRef.current.gain.value = clamped;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((muted) => {
      const nextMuted = !muted;
      mutedRef.current = nextMuted;
      if (audioRef.current) audioRef.current.muted = nextMuted;
      if (gainRef.current) {
        gainRef.current.gain.value = nextMuted ? 0 : volumeRef.current;
      }
      return nextMuted;
    });
  }, []);

  const currentTrack = useMemo(
    () => (currentTrackIndex === null ? null : tracks[currentTrackIndex] ?? null),
    [currentTrackIndex, tracks],
  );
  const nextTrack = useMemo(
    () =>
      currentTrackIndex === null
        ? null
        : tracks[currentTrackIndex + 1] ?? null,
    [currentTrackIndex, tracks],
  );
  const status: PlaybackStatus = !currentTrack
    ? "NO SIGNAL"
    : endOfQueue
      ? "END"
      : isPlaying
        ? "PLAYING"
        : currentTime > 0
          ? "PAUSED"
          : "READY";

  return {
    tracks,
    currentTrackIndex,
    currentTrack,
    nextTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    audioReady,
    endOfQueue,
    status,
    error,
    analysersRef,
    appendTracks,
    selectTrack,
    togglePlayback,
    previous,
    next,
    seek,
    setVolume,
    toggleMute,
    clearError: () => setError(null),
  };
}
