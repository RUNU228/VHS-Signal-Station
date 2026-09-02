import { memo } from "react";

import { useLanguage } from "@/components/LanguageProvider";
import type { AudioVisualizationBus } from "@/types/audio";
import { Oscilloscope } from "./Oscilloscope";
import { Spectrogram } from "./Spectrogram";
import { Spectrum } from "./Spectrum";
import { Stereometer } from "./Stereometer";
import { Waveform } from "./Waveform";

type VisualizerRackProps = {
  analysis: AudioVisualizationBus;
  active: boolean;
};

export const VisualizerRack = memo(function VisualizerRack({
  analysis,
  active,
}: VisualizerRackProps) {
  const { t } = useLanguage();
  return (
    <section className="visualizer-section" aria-labelledby="rack-title">
      <header className="section-heading">
        <div>
          <p>{t.visualizers.subtitle}</p>
          <h2 id="rack-title">{t.visualizers.title}</h2>
        </div>
        <div className="rack-telemetry" aria-label={t.visualizers.telemetry}>
          <span>{t.visualizers.modules}</span>
          <span>{t.visualizers.sampleRate}</span>
          <span>{active ? t.visualizers.lock : t.visualizers.standby}</span>
        </div>
      </header>
      <div className="visualizer-rack">
        <Spectrogram analysis={analysis} active={active} />
        <Waveform analysis={analysis} active={active} />
        <Stereometer analysis={analysis} active={active} />
        <Oscilloscope analysis={analysis} active={active} />
        <Spectrum analysis={analysis} active={active} />
      </div>
    </section>
  );
});
