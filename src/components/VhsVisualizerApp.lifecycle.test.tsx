import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { VhsVisualizerApp } from "./VhsVisualizerApp";

class Media extends EventTarget {
  currentTime = 0;
  duration = 90;
  volume = 1;
  muted = false;
  preload = "";
  src = "";
  load() {}
  pause() { this.dispatchEvent(new Event("pause")); }
  async play() { this.dispatchEvent(new Event("play")); }
  removeAttribute() { this.src = ""; }
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("releases an unfinished metadata read and its blob URL when the station closes", async () => {
  const metadata = new Media();
  const revoke = vi.fn();
  vi.stubGlobal("Audio", class { constructor() { return metadata; } });
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL() { return "blob:pending"; }
    static revokeObjectURL = revoke;
  });
  const { container, unmount } = render(<VhsVisualizerApp engineOptions={{
    createAudioElement: () => new Media() as unknown as HTMLAudioElement,
    createAudioContext: () => null,
  }} />);
  fireEvent.change(container.querySelector('input[type="file"]')!, {
    target: { files: [new File([], "pending.wav", { type: "audio/wav" })] },
  });
  expect(metadata.src).toBe("blob:pending");
  await act(async () => unmount());
  expect(metadata.src).toBe("");
  expect(revoke).toHaveBeenCalledExactlyOnceWith("blob:pending");
});

it("keeps one keyboard subscription and uses the latest playback position", async () => {
  const media = new Media();
  const add = vi.spyOn(window, "addEventListener");
  const { container } = render(<VhsVisualizerApp engineOptions={{
    createAudioElement: () => media as unknown as HTMLAudioElement,
    createAudioContext: () => null,
  }} />);
  const subscriptions = () => add.mock.calls.filter(([type]) => type === "keydown").length;
  const initialSubscriptions = subscriptions();
  act(() => { media.currentTime = 20; media.dispatchEvent(new Event("timeupdate")); });
  act(() => { media.currentTime = 30; media.dispatchEvent(new Event("timeupdate")); });
  expect(subscriptions()).toBe(initialSubscriptions);
  // Establish a duration using the existing media event, then seek from the latest time.
  act(() => media.dispatchEvent(new Event("durationchange")));
  fireEvent.keyDown(container.querySelector("main")!, { key: "ArrowRight" });
  expect(media.currentTime).toBe(35);
});
