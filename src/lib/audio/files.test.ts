import { describe, expect, it, vi } from "vitest";

import {
  isSupportedAudioFile,
  loadAudioTracks,
  stripAudioExtension,
  type AudioFileEnvironment,
} from "./files";

function createEnvironment(
  durations: Record<string, number | Error>,
): AudioFileEnvironment {
  let id = 0;
  return {
    createId: () => `track-${(id += 1)}`,
    createObjectURL: (file) => `blob:${file.name}`,
    revokeObjectURL: vi.fn(),
    readDuration: async (url) => {
      const result = durations[url];
      if (result instanceof Error) {
        throw result;
      }
      return result;
    },
  };
}

describe("audio file loading", () => {
  it("accepts WAV and MP3 extensions without case sensitivity", () => {
    expect(
      isSupportedAudioFile(new File([], "tape.WAV", { type: "audio/wav" })),
    ).toBe(true);
    expect(
      isSupportedAudioFile(new File([], "mix.mp3", { type: "audio/mpeg" })),
    ).toBe(true);
    expect(
      isSupportedAudioFile(new File([], "notes.txt", { type: "text/plain" })),
    ).toBe(false);
  });

  it("removes only a terminal supported audio extension", () => {
    expect(stripAudioExtension("THE RETURN.mp3")).toBe("THE RETURN");
    expect(stripAudioExtension("archive.wav.demo")).toBe("archive.wav.demo");
  });

  it("keeps valid tracks ordered while reporting invalid and corrupt files", async () => {
    const environment = createEnvironment({
      "blob:first.mp3": 42,
      "blob:broken.wav": new Error("corrupt"),
      "blob:first-copy.mp3": 84,
    });
    const files = [
      new File([], "first.mp3", { type: "audio/mpeg" }),
      new File([], "notes.txt", { type: "text/plain" }),
      new File([], "broken.wav", { type: "audio/wav" }),
      new File([], "first-copy.mp3", { type: "audio/mpeg" }),
    ];

    const result = await loadAudioTracks(files, environment);

    expect(result.tracks.map(({ id, name, duration }) => ({ id, name, duration })))
      .toEqual([
        { id: "track-1", name: "first", duration: 42 },
        { id: "track-3", name: "first-copy", duration: 84 },
      ]);
    expect(result.rejected).toEqual(["notes.txt", "broken.wav"]);
    expect(environment.revokeObjectURL).toHaveBeenCalledWith("blob:broken.wav");
  });

  it("assigns independent IDs when the same file is loaded twice", async () => {
    const environment = createEnvironment({ "blob:loop.mp3": 12 });
    const duplicate = new File([], "loop.mp3", { type: "audio/mpeg" });

    const result = await loadAudioTracks([duplicate, duplicate], environment);

    expect(result.tracks.map((track) => track.id)).toEqual([
      "track-1",
      "track-2",
    ]);
  });
});
