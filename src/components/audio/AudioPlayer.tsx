import { useLanguage } from "@/components/LanguageProvider";
import { playbackStatus } from "@/lib/i18n";
import { Led } from "@/components/ui/Led";
import { Panel } from "@/components/ui/Panel";
import type { AudioEngine } from "@/hooks/useAudioEngine";
import { formatTime } from "@/lib/utils/formatTime";
import { PlayerControls } from "./PlayerControls";
import { SeekBar } from "./SeekBar";
import { VolumeControl } from "./VolumeControl";

export function AudioPlayer({ engine }: { engine: AudioEngine }) {
  const { t } = useLanguage();
  const disabled = !engine.currentTrack;
  const index = engine.currentTrackIndex === null ? 0 : engine.currentTrackIndex + 1;
  const queueStamp = `${index.toString().padStart(2, "0")} / ${engine.tracks.length
    .toString()
    .padStart(2, "0")}`;

  return (
    <section
      className="player-section"
      aria-labelledby="player-title"
      data-playing={engine.isPlaying}
    >
      <header className="section-heading">
        <div>
          <p>{t.player.subtitle}</p>
          <h2 id="player-title">{t.player.title}</h2>
        </div>
        <span className="deck-model">{t.player.model}</span>
      </header>
      <Panel
        title={t.player.transport}
        serial={t.player.unit}
        className="player-panel"
        meta={
          <div className="status-leds">
            <Led label={t.player.ready} active={engine.audioReady && !engine.isPlaying} />
            <Led label={t.player.play} active={engine.isPlaying} tone="red" />
            <Led label={t.player.mute} active={engine.isMuted} tone="red" />
            <Led label={t.player.end} active={engine.endOfQueue} tone="amber" />
          </div>
        }
      >
        <div className="player-grid">
          <div className="tape-bay" data-playing={engine.isPlaying}>
            <div className="tape-window" aria-hidden="true">
              <span className="reel reel--left" />
              <span className="tape-strip" />
              <span className="reel reel--right" />
            </div>
            <div className="now-playing-display">
              <span>{t.player.now}</span>
              <strong>{engine.currentTrack?.name ?? t.player.empty}</strong>
              <div>
                <span>{queueStamp}</span>
                <span>{playbackStatus(engine.status, t)}</span>
              </div>
              <b>{formatTime(engine.currentTime)} / {formatTime(engine.duration)}</b>
            </div>
          </div>

          <div className="queue-display">
            <span>{t.station.queue} {queueStamp}</span>
            <strong>{t.player.next}</strong>
            <b>{engine.endOfQueue || !engine.nextTrack ? t.player.queueEnd : engine.nextTrack.name}</b>
            <small>{t.player.advance}</small>
          </div>

          <PlayerControls
            disabled={disabled}
            isPlaying={engine.isPlaying}
            onPrevious={engine.previous}
            onToggle={() => void engine.togglePlayback()}
            onNext={engine.next}
          />
          <SeekBar
            currentTime={engine.currentTime}
            duration={engine.duration}
            disabled={disabled}
            onSeek={engine.seek}
          />
          <VolumeControl
            volume={engine.volume}
            muted={engine.isMuted}
            disabled={disabled}
            onVolume={engine.setVolume}
            onMute={engine.toggleMute}
          />
        </div>
      </Panel>
    </section>
  );
}
