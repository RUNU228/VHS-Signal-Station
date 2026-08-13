import { Led } from "@/components/ui/Led";
import { Panel } from "@/components/ui/Panel";
import type { AudioEngine } from "@/hooks/useAudioEngine";
import { formatTime } from "@/lib/utils/formatTime";
import { PlayerControls } from "./PlayerControls";
import { SeekBar } from "./SeekBar";
import { VolumeControl } from "./VolumeControl";

export function AudioPlayer({ engine }: { engine: AudioEngine }) {
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
          <p>MASTER TRANSPORT / DECK B</p>
          <h2 id="player-title">VHS AUDIO DECK</h2>
        </div>
        <span className="deck-model">MODEL VS-880 / LOCAL MEDIA</span>
      </header>
      <Panel
        title="TAPE TRANSPORT"
        serial="UNIT 02 / STEREO"
        className="player-panel"
        meta={
          <div className="status-leds">
            <Led label="READY" active={engine.audioReady && !engine.isPlaying} />
            <Led label="PLAY" active={engine.isPlaying} tone="red" />
            <Led label="MUTE" active={engine.isMuted} tone="red" />
            <Led label="END" active={engine.endOfQueue} tone="amber" />
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
              <span>NOW PLAYING</span>
              <strong>{engine.currentTrack?.name ?? "NO TAPE INSERTED"}</strong>
              <div>
                <span>{queueStamp}</span>
                <span>{engine.status}</span>
              </div>
              <b>{formatTime(engine.currentTime)} / {formatTime(engine.duration)}</b>
            </div>
          </div>

          <div className="queue-display">
            <span>QUEUE {queueStamp}</span>
            <strong>UP NEXT</strong>
            <b>{engine.endOfQueue || !engine.nextTrack ? "END OF QUEUE" : engine.nextTrack.name}</b>
            <small>AUTO ADVANCE / LOOP OFF</small>
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
