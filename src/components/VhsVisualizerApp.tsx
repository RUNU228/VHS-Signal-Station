"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { TrackLibrary } from "@/components/audio/TrackLibrary";
import { TrackUploader } from "@/components/audio/TrackUploader";
import { AudioReactiveBackground } from "@/components/ui/AudioReactiveBackground";
import { VhsNoise } from "@/components/ui/VhsNoise";
import { VisualizerRack } from "@/components/visualizers/VisualizerRack";
import { useAudioEngine, type AudioEngineOptions } from "@/hooks/useAudioEngine";
import { useAudioAnalysis } from "@/hooks/useAudioAnalysis";
import { useReactiveStyles } from "@/hooks/useReactiveStyles";
import { loadAudioTracks } from "@/lib/audio/files";
import { commandForKey, isEditableTarget } from "@/lib/audio/keyboard";

export function VhsVisualizerApp({ engineOptions }: { engineOptions?: AudioEngineOptions }) {
  const engine = useAudioEngine(engineOptions);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const appendTracks = engine.appendTracks;

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    setLoading(true);
    setNotice("READING TAPE...");
    const result = await loadAudioTracks(files);
    appendTracks(result.tracks);
    if (result.rejected.length > 0) {
      setNotice(`UNABLE TO READ: ${result.rejected.join(", ")}`);
    } else {
      setNotice(`${result.tracks.length.toString().padStart(2, "0")} TAPE${result.tracks.length === 1 ? "" : "S"} LOADED`);
    }
    setLoading(false);
  }, [appendTracks]);

  const { currentTime, volume, togglePlayback, seek, setVolume, toggleMute, next, previous } = engine;
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
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
    };
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [currentTime, next, previous, seek, setVolume, toggleMute, togglePlayback, volume]);

  const signalActive = engine.isPlaying;
  const stationRef = useRef<HTMLElement>(null);
  const analysis = useAudioAnalysis(engine.analysersRef, {
    active: signalActive,
    resetKey: engine.currentTrack?.id ?? null,
  });
  useReactiveStyles(stationRef, analysis, signalActive);
  const message = engine.error ?? notice;

  return (
    <main ref={stationRef} className="station-shell">
      <AudioReactiveBackground analysis={analysis} active={signalActive} />
      <VhsNoise />
      <header className="station-header">
        <div className="station-brand">
          <span className="brand-mark" aria-hidden="true">VS</span>
          <div>
            <p>BROADCAST AUDIO ANALYSIS SYSTEM</p>
            <h1>VHS SIGNAL STATION</h1>
          </div>
        </div>
        <div className="station-status" aria-label="System status">
          <span><i data-active={signalActive} /> SIGNAL {signalActive ? "ONLINE" : "IDLE"}</span>
          <span>WEB AUDIO / 24-BIT</span>
          <span>LOCAL DECK / NO UPLINK</span>
        </div>
      </header>
      <div className="station-dateline">
        <span>STATION 08-KV</span>
        <span>MONITOR PATH A+B</span>
        <span>QUEUE {engine.tracks.length.toString().padStart(2, "0")}</span>
      </div>

      {message ? (
        <div className="system-message" role={engine.error ? "alert" : "status"}>
          <span>{engine.error ? "FAULT" : "SYSTEM"}</span>
          <strong>{message}</strong>
          <button type="button" aria-label="Dismiss system message" onClick={() => { engine.clearError(); setNotice(null); }}>
            CLEAR
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
        <span>VS-880 SIGNAL CONTROL</span>
        <span>SPACE PLAY · ← → SEEK · ↑ ↓ LEVEL · M MUTE · N/P QUEUE</span>
        <span>NO AUDIO LEAVES THIS BROWSER</span>
      </footer>
    </main>
  );
}
