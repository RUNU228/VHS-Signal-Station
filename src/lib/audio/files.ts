import type { AudioFormat, AudioTrack } from "@/types/audio";

const AUDIO_EXTENSION = /\.(wav|mp3)$/i;

export type AudioFileEnvironment = {
  createId: () => string;
  createObjectURL: (file: File) => string;
  revokeObjectURL: (url: string) => void;
  readDuration: (url: string) => Promise<number>;
};

export type AudioLoadResult = {
  tracks: AudioTrack[];
  rejected: string[];
};

function readBrowserDuration(url: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";

    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", handleMetadata);
      audio.removeEventListener("error", handleError);
      audio.removeAttribute("src");
      audio.load();
    };
    const handleMetadata = () => {
      const duration = audio.duration;
      cleanup();
      if (Number.isFinite(duration) && duration >= 0) {
        resolve(duration);
      } else {
        reject(new Error("Invalid audio duration"));
      }
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Unable to read audio metadata"));
    };

    audio.addEventListener("loadedmetadata", handleMetadata);
    audio.addEventListener("error", handleError);
    audio.src = url;
  });
}

const browserEnvironment: AudioFileEnvironment = {
  createId: () => crypto.randomUUID(),
  createObjectURL: (file) => URL.createObjectURL(file),
  revokeObjectURL: (url) => URL.revokeObjectURL(url),
  readDuration: readBrowserDuration,
};

export function isSupportedAudioFile(file: File): boolean {
  return AUDIO_EXTENSION.test(file.name);
}

export function stripAudioExtension(name: string): string {
  return name.replace(AUDIO_EXTENSION, "");
}

function formatForFile(file: File): AudioFormat {
  return file.name.toLowerCase().endsWith(".wav") ? "WAV" : "MP3";
}

export async function loadAudioTracks(
  files: Iterable<File>,
  environment: AudioFileEnvironment = browserEnvironment,
): Promise<AudioLoadResult> {
  const tracks: AudioTrack[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    if (!isSupportedAudioFile(file)) {
      rejected.push(file.name);
      continue;
    }

    const id = environment.createId();
    const url = environment.createObjectURL(file);

    try {
      const duration = await environment.readDuration(url);
      tracks.push({
        id,
        file,
        url,
        name: stripAudioExtension(file.name),
        duration,
        format: formatForFile(file),
      });
    } catch {
      environment.revokeObjectURL(url);
      rejected.push(file.name);
    }
  }

  return { tracks, rejected };
}
