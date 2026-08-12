import { formatTime } from "@/lib/utils/formatTime";
import type { AudioTrack } from "@/types/audio";

type TrackLibraryProps = {
  tracks: AudioTrack[];
  currentTrackIndex: number | null;
  isPlaying: boolean;
  onSelect: (index: number) => void;
};

export function TrackLibrary({
  tracks,
  currentTrackIndex,
  isPlaying,
  onSelect,
}: TrackLibraryProps) {
  return (
    <section className="library-section" aria-labelledby="library-title">
      <header className="section-heading">
        <div>
          <p>LOCAL TAPE ARCHIVE / QUEUE C</p>
          <h2 id="library-title">TRACK LIBRARY</h2>
        </div>
        <span className="library-count">{tracks.length.toString().padStart(2, "0")} TAPES LOADED</span>
      </header>
      {tracks.length === 0 ? (
        <div className="library-empty">
          <span className="empty-led" aria-hidden="true" />
          <strong>NO AUDIO LOADED</strong>
          <p>Insert local WAV or MP3 media using the deck above.</p>
        </div>
      ) : (
        <ol className="track-list">
          {tracks.map((track, index) => {
            const selected = currentTrackIndex === index;
            const playing = selected && isPlaying;
            return (
              <li key={track.id}>
                <button
                  type="button"
                  className="track-row"
                  data-selected={selected}
                  data-playing={playing}
                  aria-current={selected ? "true" : undefined}
                  aria-label={`Select ${track.name}`}
                  onClick={() => onSelect(index)}
                >
                  <span className="track-index">{(index + 1).toString().padStart(2, "0")}</span>
                  <span className="cassette-mark" aria-hidden="true"><i /><i /></span>
                  <span className="track-copy">
                    <strong>{track.name}</strong>
                    <small>{track.format} / LOCAL SIGNAL</small>
                  </span>
                  <span className="track-duration">{formatTime(track.duration)}</span>
                  <span className="track-state">
                    {selected ? (playing ? "PLAYING" : "SELECTED") : "READY"}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
