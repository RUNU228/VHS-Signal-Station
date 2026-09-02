import { useLanguage } from "@/components/LanguageProvider";
import { selectTrackLabel, tapesLoaded } from "@/lib/i18n";
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
  const { t, language } = useLanguage();
  return (
    <section className="library-section" aria-labelledby="library-title">
      <header className="section-heading">
        <div>
          <p>{t.tracks.subtitle}</p>
          <h2 id="library-title">{t.tracks.title}</h2>
        </div>
        <span className="library-count">{tapesLoaded(tracks.length, language)}</span>
      </header>
      {tracks.length === 0 ? (
        <div className="library-empty">
          <span className="empty-led" aria-hidden="true" />
          <strong>{t.tracks.empty}</strong>
          <p>{t.tracks.help}</p>
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
                  aria-label={selectTrackLabel(track.name, language)}
                  onClick={() => onSelect(index)}
                >
                  <span className="track-index">{(index + 1).toString().padStart(2, "0")}</span>
                  <span className="cassette-mark" aria-hidden="true"><i /><i /></span>
                  <span className="track-copy">
                    <strong>{track.name}</strong>
                    <small>{track.format} / {t.tracks.local}</small>
                  </span>
                  <span className="track-duration">{formatTime(track.duration)}</span>
                  <span className="track-state">
                    {selected ? (playing ? t.player.playing : t.tracks.selected) : t.player.ready}
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
