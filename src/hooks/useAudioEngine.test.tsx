import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAudioEngine } from "./useAudioEngine";
import type { AudioTrack } from "@/types/audio";

class FakeAudio extends EventTarget {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  muted = false;
  preload = "";
  paused = true;
  playCalls = 0;

  load() {
    this.dispatchEvent(new Event("loadedmetadata"));
  }

  async play() {
    this.playCalls += 1;
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  }

  pause() {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  }

  removeAttribute(name: string) {
    if (name === "src") this.src = "";
  }
}

function track(id: string, duration = 20): AudioTrack {
  return {
    id,
    file: new File([], `${id}.mp3`, { type: "audio/mpeg" }),
    url: `blob:${id}`,
    name: id.toUpperCase(),
    duration,
    format: "MP3",
  };
}

describe("useAudioEngine", () => {
  it("loads the first appended track into the sole media element", async () => {
    const audio = new FakeAudio();
    const { result } = renderHook(() =>
      useAudioEngine({
        createAudioElement: () => audio as unknown as HTMLAudioElement,
        createAudioContext: () => null,
      }),
    );

    act(() => result.current.appendTracks([track("one"), track("two")]));

    await waitFor(() => expect(result.current.currentTrackIndex).toBe(0));
    expect(audio.src).toBe("blob:one");
    expect(audio.playCalls).toBe(0);
  });

  it("keeps manual selection paused or playing to match the prior state", async () => {
    const audio = new FakeAudio();
    const { result } = renderHook(() =>
      useAudioEngine({
        createAudioElement: () => audio as unknown as HTMLAudioElement,
        createAudioContext: () => null,
      }),
    );
    act(() => result.current.appendTracks([track("one"), track("two")]));
    await waitFor(() => expect(audio.src).toBe("blob:one"));

    act(() => result.current.selectTrack(1));
    await waitFor(() => expect(audio.src).toBe("blob:two"));
    expect(audio.playCalls).toBe(0);

    await act(async () => result.current.togglePlayback());
    act(() => result.current.selectTrack(0));

    await waitFor(() => expect(audio.src).toBe("blob:one"));
    expect(audio.playCalls).toBe(2);
  });

  it("appends tracks without interrupting current playback or position", async () => {
    const audio = new FakeAudio();
    const { result } = renderHook(() =>
      useAudioEngine({
        createAudioElement: () => audio as unknown as HTMLAudioElement,
        createAudioContext: () => null,
      }),
    );
    act(() => result.current.appendTracks([track("one")]));
    await waitFor(() => expect(audio.src).toBe("blob:one"));
    await act(async () => result.current.togglePlayback());
    audio.currentTime = 7;
    audio.dispatchEvent(new Event("timeupdate"));

    act(() => result.current.appendTracks([track("two")]));

    expect(audio.src).toBe("blob:one");
    expect(audio.currentTime).toBe(7);
    expect(result.current.isPlaying).toBe(true);
  });

  it("advances automatically and stops on the final queue item", async () => {
    const audio = new FakeAudio();
    const { result } = renderHook(() =>
      useAudioEngine({
        createAudioElement: () => audio as unknown as HTMLAudioElement,
        createAudioContext: () => null,
      }),
    );
    act(() => result.current.appendTracks([track("one", 10), track("two", 30)]));
    await waitFor(() => expect(audio.src).toBe("blob:one"));
    await act(async () => result.current.togglePlayback());

    act(() => audio.dispatchEvent(new Event("ended")));
    await waitFor(() => expect(audio.src).toBe("blob:two"));
    expect(result.current.currentTrackIndex).toBe(1);
    await waitFor(() => expect(result.current.isPlaying).toBe(true));

    audio.currentTime = 30;
    act(() => audio.dispatchEvent(new Event("ended")));

    await waitFor(() => expect(result.current.endOfQueue).toBe(true));
    expect(result.current.currentTrackIndex).toBe(1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentTime).toBe(30);
  });

  it("rewinds and clears queue completion when the user manually replays the final track", async () => {
    const audio = new FakeAudio();
    const { result } = renderHook(() =>
      useAudioEngine({
        createAudioElement: () => audio as unknown as HTMLAudioElement,
        createAudioContext: () => null,
      }),
    );
    act(() => result.current.appendTracks([track("final", 20)]));
    await waitFor(() => expect(audio.src).toBe("blob:final"));
    await act(async () => result.current.togglePlayback());
    audio.currentTime = 20;
    act(() => audio.dispatchEvent(new Event("ended")));
    await waitFor(() => expect(result.current.endOfQueue).toBe(true));

    await act(async () => result.current.togglePlayback());

    expect(audio.currentTime).toBe(0);
    expect(result.current.currentTime).toBe(0);
    expect(result.current.endOfQueue).toBe(false);
    expect(result.current.isPlaying).toBe(true);
  });
});
