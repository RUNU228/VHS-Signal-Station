import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VhsVisualizerApp } from "./VhsVisualizerApp";
class SilentAudio extends EventTarget {
  src = ""; currentTime = 0; duration = 0; volume = 1; muted = false; preload = "";
  pause() {} load() {} async play() {} removeAttribute() {}
}
const audio = new SilentAudio();
const options = { createAudioElement: () => audio as unknown as HTMLAudioElement, createAudioContext: () => null };
describe("interface language", () => {
  beforeEach(() => { localStorage.clear(); vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null); });
  afterEach(() => vi.restoreAllMocks());
  it("defaults to English and switches every section without remounting canvases", () => {
    const { container } = render(<VhsVisualizerApp engineOptions={options} />);
    expect(screen.getByRole("heading", { name: "TRACK LIBRARY" })).toBeVisible();
    const canvases = [...container.querySelectorAll("canvas")];
    fireEvent.click(screen.getByRole("button", { name: "Русский" }));
    expect(screen.getByRole("heading", { name: "БИБЛИОТЕКА ТРЕКОВ" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Воспроизвести" })).toBeDisabled();
    expect(document.documentElement.lang).toBe("ru");
    expect([...container.querySelectorAll("canvas")]).toEqual(canvases);
  });
  it("persists Russian across remounts and English after switching back", () => {
    const first = render(<VhsVisualizerApp engineOptions={options} />);
    fireEvent.click(screen.getByRole("button", { name: "Русский" })); first.unmount();
    const second = render(<VhsVisualizerApp engineOptions={options} />);
    expect(screen.getByRole("button", { name: "Русский" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "English" })); second.unmount();
    render(<VhsVisualizerApp engineOptions={options} />);
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
  });
  it("ignores malformed preferences and still switches when storage is blocked", () => {
    localStorage.setItem("vhs-language", "{broken");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    render(<VhsVisualizerApp engineOptions={options} />);
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Русский" }));
    expect(screen.getByRole("heading", { name: "БИБЛИОТЕКА ТРЕКОВ" })).toBeVisible();
  });
});
