import type { MutableRefObject } from "react";

import type { AudioAnalyserBundle, AudioVisualizationBus } from "@/types/audio";
import { Oscilloscope } from "./Oscilloscope";
import { Spectrogram } from "./Spectrogram";
import { Spectrum } from "./Spectrum";
import { Stereometer } from "./Stereometer";
import { Waveform } from "./Waveform";

type VisualizerRackProps = {
  analysis: AudioVisualizationBus;
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>;
  active: boolean;
};

export function VisualizerRack({
  analysis,
  analysersRef,
  active,
}: VisualizerRackProps) {
  return (
    <section className="visualizer-section" aria-labelledby="rack-title">
      <header className="section-heading">
        <div>
          <p>ANALOG SIGNAL ANALYSIS / RACK A</p>
          <h2 id="rack-title">VISUALIZER RACK</h2>
        </div>
        <div className="rack-telemetry" aria-label="Rack telemetry">
          <span>5 MODULES</span>
          <span>48 KHZ READY</span>
          <span>{active ? "SIGNAL LOCK" : "STANDBY"}</span>
        </div>
      </header>
      <div className="visualizer-rack">
        <Spectrogram analysis={analysis} active={active} />
        <Waveform analysis={analysis} active={active} />
        <Stereometer analysersRef={analysersRef} active={active} />
        <Oscilloscope analysis={analysis} active={active} />
        <Spectrum analysis={analysis} active={active} />
      </div>
    </section>
  );
}
