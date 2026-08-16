import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VhsVisualizerApp } from "./VhsVisualizerApp";

class SilentAudio extends EventTarget {
  src = "";
  currentTime = 0;
  duration = 0;
  volume = 1;
  muted = false;
  preload = "";
  pause() {}
  load() {}
  async play() {}
  removeAttribute() {}
}

describe("VhsVisualizerApp", () => {
  it("renders the workstation hierarchy around one client engine", () => {
    const { container } = render(
      <VhsVisualizerApp
        engineOptions={{
          createAudioElement: () => new SilentAudio() as unknown as HTMLAudioElement,
          createAudioContext: () => null,
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "VHS SIGNAL STATION" })).toBeInTheDocument();
    const rack = screen.getByRole("heading", { level: 2, name: "VISUALIZER RACK" });
    const player = screen.getByRole("heading", { level: 2, name: "VHS AUDIO DECK" });
    const library = screen.getByRole("heading", { level: 2, name: "TRACK LIBRARY" });
    expect(rack.compareDocumentPosition(player) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(player.compareDocumentPosition(library) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("DROP AUDIO TAPE HERE")).toBeInTheDocument();
    const station = container.querySelector("main.station-shell");
    expect(station).toHaveAttribute(
      "data-audio-active",
      "false",
    );
    expect(station).toHaveStyle({ "--signal-strength": "0.000" });
    const background = container.querySelector(
      "canvas.audio-reactive-background",
    );
    const noise = container.querySelector(".vhs-atmosphere");
    expect(background).toBeInTheDocument();
    expect(container.querySelectorAll("canvas.audio-reactive-background")).toHaveLength(1);
    expect(
      background!.compareDocumentPosition(noise!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
