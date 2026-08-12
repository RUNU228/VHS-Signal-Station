import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { VisualizerRack } from "./VisualizerRack";
import type { AudioAnalyserBundle } from "@/types/audio";

describe("VisualizerRack", () => {
  it("keeps all five instruments visible while there is no signal", () => {
    render(
      <VisualizerRack
        analysersRef={createRef<AudioAnalyserBundle | null>()}
        active={false}
      />,
    );

    for (const title of [
      "SPECTROGRAM",
      "WAVEFORM",
      "STEREOMETER",
      "OSCILLOSCOPE",
      "SPECTRUM",
    ]) {
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    }
    expect(screen.getAllByText("NO SIGNAL")).toHaveLength(5);
    expect(screen.getByText("CHANNEL 1 — SIDE")).toBeInTheDocument();
    expect(screen.getByText("CHANNEL 2 — MID")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("5K")).toBeInTheDocument();
  });
});
