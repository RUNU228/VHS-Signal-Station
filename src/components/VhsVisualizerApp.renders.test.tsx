import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const renders = vi.hoisted(() => ({ rack: 0, library: 0, uploader: 0 }));
// Count reads made by the real components during render, without replacing them.
vi.mock("@/components/LanguageProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/LanguageProvider")>();
  return {
    ...actual,
    useLanguage: () => {
      const value = actual.useLanguage();
      const t = new Proxy(value.t, {
        get(target, key: keyof typeof value.t) {
          const section = target[key];
          if (key !== "visualizers" && key !== "tracks" && key !== "upload") return section;
          return new Proxy(section, {
            get(sectionTarget, field) {
              if (key === "visualizers" && field === "title") renders.rack++;
              if (key === "tracks" && field === "title") renders.library++;
              if (key === "upload" && field === "input") renders.uploader++;
              return Reflect.get(sectionTarget, field);
            },
          });
        },
      });
      return { ...value, t };
    },
  };
});

import { VhsVisualizerApp } from "./VhsVisualizerApp";

class Media extends EventTarget {
  currentTime = 0; duration = 120; volume = 1; muted = false; preload = ""; src = "";
  pause() {} load() {} async play() {} removeAttribute() {}
}

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  renders.rack = renders.library = renders.uploader = 0;
});

it("isolates the rack, library, and uploader from time updates while keeping time and language live", () => {
  const media = new Media();
  render(<VhsVisualizerApp engineOptions={{
    createAudioElement: () => media as unknown as HTMLAudioElement,
    createAudioContext: () => null,
  }} />);
  const initial = { ...renders };
  for (const currentTime of [10, 20, 30]) {
    act(() => { media.currentTime = currentTime; media.dispatchEvent(new Event("timeupdate")); });
  }
  expect(screen.getAllByText("00:30").length).toBeGreaterThan(0);
  expect(renders).toEqual(initial);
  fireEvent.click(screen.getByRole("button", { name: "Русский" }));
  expect(screen.getByRole("heading", { name: "БИБЛИОТЕКА ТРЕКОВ" })).toBeInTheDocument();
  expect(renders.rack).toBeGreaterThan(initial.rack);
  expect(renders.library).toBeGreaterThan(initial.library);
  expect(renders.uploader).toBeGreaterThan(initial.uploader);
});
