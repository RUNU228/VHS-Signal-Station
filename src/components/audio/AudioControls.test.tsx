import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { AudioPlayer } from "./AudioPlayer";
import { TrackLibrary } from "./TrackLibrary";
import { TrackUploader } from "./TrackUploader";
import type { AudioEngine } from "@/hooks/useAudioEngine";
import type { AudioAnalyserBundle, AudioTrack } from "@/types/audio";

const sampleTrack: AudioTrack = {
  id: "return",
  file: new File([], "THE RETURN.mp3", { type: "audio/mpeg" }),
  url: "blob:return",
  name: "THE RETURN",
  duration: 257,
  format: "MP3",
};

function engine(overrides: Partial<AudioEngine> = {}): AudioEngine {
  return {
    tracks: [],
    currentTrackIndex: null,
    currentTrack: null,
    nextTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.72,
    isMuted: false,
    audioReady: false,
    endOfQueue: false,
    status: "NO SIGNAL",
    error: null,
    analysersRef: createRef<AudioAnalyserBundle | null>(),
    appendTracks: vi.fn(),
    selectTrack: vi.fn(),
    togglePlayback: vi.fn().mockResolvedValue(undefined),
    previous: vi.fn(),
    next: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    clearError: vi.fn(),
    ...overrides,
  };
}

describe("AudioPlayer", () => {
  it("leaves transport controls visible but disabled without audio", () => {
    render(<AudioPlayer engine={engine()} />);
    expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous track" })).toBeDisabled();
    expect(screen.getByText("NO TAPE INSERTED")).toBeInTheDocument();
  });

  it("shows real queue information and routes custom controls", () => {
    const togglePlayback = vi.fn().mockResolvedValue(undefined);
    const seek = vi.fn();
    const setVolume = vi.fn();
    const toggleMute = vi.fn();
    render(
      <AudioPlayer
        engine={engine({
          tracks: [sampleTrack],
          currentTrackIndex: 0,
          currentTrack: sampleTrack,
          currentTime: 88,
          duration: 257,
          audioReady: true,
          status: "PAUSED",
          endOfQueue: true,
          togglePlayback,
          seek,
          setVolume,
          toggleMute,
        })}
      />,
    );

    expect(screen.getByText("THE RETURN")).toBeInTheDocument();
    expect(screen.getByText("01:28 / 04:17")).toBeInTheDocument();
    expect(screen.getByText("QUEUE 01 / 01")).toBeInTheDocument();
    expect(screen.getByText("END OF QUEUE")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mute output" })).toBeVisible();
    expect(screen.getByRole("slider", { name: "Playback position" })).toBeVisible();
    expect(screen.getByRole("slider", { name: "Output level" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.change(screen.getByRole("slider", { name: "Playback position" }), {
      target: { value: "120" },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Output level" }), {
      target: { value: "45" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Mute output" }));
    expect(togglePlayback).toHaveBeenCalledOnce();
    expect(seek).toHaveBeenCalledWith(120);
    expect(setVolume).toHaveBeenCalledWith(0.45);
    expect(toggleMute).toHaveBeenCalledOnce();
  });
});

describe("TrackUploader and TrackLibrary", () => {
  it("accepts multiple WAV/MP3 files from the picker and drop surface", () => {
    const onFiles = vi.fn();
    const { container } = render(<TrackUploader onFiles={onFiles} loading={false} />);
    const input = container.querySelector("input[type='file']");
    expect(input).toHaveAttribute("accept", ".wav,.mp3,audio/wav,audio/mpeg");
    expect(input).toHaveAttribute("multiple");

    const file = new File([], "signal.wav", { type: "audio/wav" });
    fireEvent.drop(screen.getByText("DROP AUDIO TAPE HERE"), {
      dataTransfer: { files: [file] },
    });
    expect(onFiles).toHaveBeenCalledWith([file]);
  });

  it("shows an actionable empty library and exposes selected rows", () => {
    const selectTrack = vi.fn();
    const { rerender } = render(
      <TrackLibrary tracks={[]} currentTrackIndex={null} isPlaying={false} onSelect={selectTrack} />,
    );
    expect(screen.getByText("NO AUDIO LOADED")).toBeInTheDocument();

    rerender(
      <TrackLibrary
        tracks={[sampleTrack]}
        currentTrackIndex={0}
        isPlaying={true}
        onSelect={selectTrack}
      />,
    );
    const row = screen.getByRole("button", { name: /select the return/i });
    expect(row).toHaveAttribute("aria-current", "true");
    expect(screen.getByText("PLAYING")).toBeInTheDocument();
    fireEvent.click(row);
    expect(selectTrack).toHaveBeenCalledWith(0);
  });
});
