"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";

import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { TrackLibrary } from "@/components/audio/TrackLibrary";
import { TrackUploader } from "@/components/audio/TrackUploader";
import { PeakEffectsLayer } from "@/components/effects/PeakEffectsLayer";
import { AudioReactiveBackground } from "@/components/ui/AudioReactiveBackground";
import { VhsNoise } from "@/components/ui/VhsNoise";
import { VisualizerRack } from "@/components/visualizers/VisualizerRack";
import { useAudioEngine, type AudioEngineOptions } from "@/hooks/useAudioEngine";
import { useAudioAnalysis } from "@/hooks/useAudioAnalysis";
import { useReactiveStyles } from "@/hooks/useReactiveStyles";
import { loadAudioTracks } from "@/lib/audio/files";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { audioError, tapesLoaded, unreadableFiles } from "@/lib/i18n";
import { commandForKey, isEditableTarget } from "@/lib/audio/keyboard";

export function VhsVisualizerApp({ engineOptions }: { engineOptions?: AudioEngineOptions }) {
  return (
    <LanguageProvider>
      <Station engineOptions={engineOptions} />
    </LanguageProvider>
  );
}

type Notice =
  | { kind: "reading" }
  | { kind: "loaded"; count: number }
  | { kind: "rejected"; names: string[] };

function Station({ engineOptions }: { engineOptions?: AudioEngineOptions }) {
  const { t, language } = useLanguage();
  const engine = useAudioEngine(engineOptions);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const appendTracks = engine.appendTracks;
  const pendingUploadsRef = useRef(new Set<AbortController>());

  useEffect(() => {
    const pending = pendingUploadsRef.current;
    return () => {
      for (const controller of pending) controller.abort();
      pending.clear();
    };
  }, []);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    const controller = new AbortController();
    const pending = pendingUploadsRef.current;
    pending.add(controller);
    setLoading(true);
    setNotice({ kind: "reading" });
    try {
      const result = await loadAudioTracks(files, undefined, controller.signal);
      if (controller.signal.aborted) {
        for (const track of result.tracks) URL.revokeObjectURL(track.url);
        return;
      }
      appendTracks(result.tracks);
      if (result.rejected.length > 0) {
        setNotice({ kind: "rejected", names: result.rejected });
      } else {
        setNotice({ kind: "loaded", count: result.tracks.length });
      }
    } finally {
      pending.delete(controller);
      if (!controller.signal.aborted) setLoading(pending.size > 0);
    }
  }, [appendTracks]);

  const { currentTime, volume, togglePlayback, seek, setVolume, toggleMute, next, previous } = engine;
  const onKeyboard = useEffectEvent((event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      const command = commandForKey(event.key);
      if (!command) return;
      event.preventDefault();
      switch (command) {
        case "toggle": void togglePlayback(); break;
        case "seek-backward": seek(currentTime - 5); break;
        case "seek-forward": seek(currentTime + 5); break;
        case "volume-up": setVolume(volume + 0.05); break;
        case "volume-down": setVolume(volume - 0.05); break;
        case "mute": toggleMute(); break;
        case "next": next(); break;
        case "previous": previous(); break;
      }
  });
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => onKeyboard(event);
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, []);

  const signalActive = engine.isPlaying;
  const stationRef = useRef<HTMLElement>(null);
  const analysis = useAudioAnalysis(engine.analysersRef, {
    active: signalActive,
    resetKey: engine.currentTrack?.id ?? null,
  });
  useReactiveStyles(stationRef, analysis, signalActive);
  const message = engine.error
    ? audioError(engine.error, language)
    : !notice
      ? null
      : notice.kind === "reading"
        ? t.upload.reading
        : notice.kind === "loaded"
          ? tapesLoaded(notice.count, language)
          : unreadableFiles(notice.names, language);

  return (
    <main ref={stationRef} className="station-shell">
      <AudioReactiveBackground analysis={analysis} active={signalActive} />
      <PeakEffectsLayer analysis={analysis} targetRef={stationRef} />
      <VhsNoise />
      <header className="station-header">
        <div className="station-brand">
          <span className="brand-mark" aria-hidden="true">VS</span>
          <div>
            <p>{t.station.subtitle}</p>
            <h1>VHS SIGNAL STATION</h1>
          </div>
        </div>
        <div className="station-tools">
          <LanguageSwitcher />
          <div className="station-status" aria-label={t.station.systemStatus}>
            <span><i data-active={signalActive} /> {t.station.signal} {signalActive ? t.station.online : t.station.idle}</span>
            <span>{t.station.audio}</span>
            <span>{t.station.local}</span>
          </div>
        </div>
      </header>
      <div className="station-dateline">
        <span>{t.station.station}</span>
        <span>{t.station.monitor}</span>
        <span>{t.station.queue} {engine.tracks.length.toString().padStart(2, "0")}</span>
      </div>

      {message ? (
        <div className="system-message" role={engine.error ? "alert" : "status"}>
          <span>{engine.error ? t.station.fault : t.station.system}</span>
          <strong>{message}</strong>
          <button type="button" aria-label={t.station.dismiss} onClick={() => { engine.clearError(); setNotice(null); }}>
            {t.station.clear}
          </button>
        </div>
      ) : null}

      <VisualizerRack
        analysis={analysis}
        active={signalActive}
      />
      <AudioPlayer engine={engine} />
      <TrackUploader onFiles={(files) => void handleFiles(files)} loading={loading} />
      <TrackLibrary
        tracks={engine.tracks}
        currentTrackIndex={engine.currentTrackIndex}
        isPlaying={engine.isPlaying}
        onSelect={engine.selectTrack}
      />
      <footer className="station-footer">
        <span>{t.station.footer}</span>
        <span>{t.station.keys}</span>
        <span>{t.station.privacy}</span>
      </footer>
    </main>
  );
}
