import type { PlaybackStatus } from "@/types/audio";
export type Language = "en" | "ru";
export const languages = [
  { code: "en", label: "English", short: "EN" },
  { code: "ru", label: "Русский", short: "RU" },
] as const;
export const LANGUAGE_STORAGE_KEY = "vhs-language";
export const en = {
  "station": {
    "subtitle": "BROADCAST AUDIO ANALYSIS SYSTEM",
    "systemStatus": "System status",
    "signal": "SIGNAL",
    "online": "ONLINE",
    "idle": "IDLE",
    "audio": "WEB AUDIO / 24-BIT",
    "local": "LOCAL DECK / NO UPLINK",
    "station": "STATION 08-KV",
    "monitor": "MONITOR PATH A+B",
    "queue": "QUEUE",
    "fault": "FAULT",
    "system": "SYSTEM",
    "dismiss": "Dismiss system message",
    "clear": "CLEAR",
    "footer": "VS-880 SIGNAL CONTROL",
    "keys": "SPACE PLAY · ← → SEEK · ↑ ↓ LEVEL · M MUTE · N/P QUEUE",
    "privacy": "NO AUDIO LEAVES THIS BROWSER",
    "language": "Language"
  },
  "player": {
    "subtitle": "MASTER TRANSPORT / DECK B",
    "title": "VHS AUDIO DECK",
    "model": "MODEL VS-880 / LOCAL MEDIA",
    "transport": "TAPE TRANSPORT",
    "unit": "UNIT 02 / STEREO",
    "ready": "READY",
    "play": "PLAY",
    "mute": "MUTE",
    "end": "END",
    "now": "NOW PLAYING",
    "empty": "NO TAPE INSERTED",
    "next": "UP NEXT",
    "queueEnd": "END OF QUEUE",
    "advance": "AUTO ADVANCE / LOOP OFF",
    "controls": "Playback controls",
    "previousLabel": "Previous track",
    "previous": "PREVIOUS",
    "pauseLabel": "Pause",
    "playLabel": "Play",
    "pause": "PAUSE",
    "nextLabel": "Next track",
    "nextButton": "NEXT",
    "currentTime": "CURRENT TIME",
    "totalTime": "TOTAL TIME",
    "position": "Playback position",
    "output": "OUTPUT LEVEL",
    "muted": "MUTED",
    "outputLabel": "Output level",
    "unmuteLabel": "Unmute output",
    "muteLabel": "Mute output",
    "playing": "PLAYING",
    "paused": "PAUSED"
  },
  "tracks": {
    "subtitle": "LOCAL TAPE ARCHIVE / QUEUE C",
    "title": "TRACK LIBRARY",
    "empty": "NO AUDIO LOADED",
    "help": "Insert local WAV or MP3 media using the deck above.",
    "local": "LOCAL SIGNAL",
    "selected": "SELECTED"
  },
  "upload": {
    "reading": "READING TAPE...",
    "input": "LOCAL MEDIA INPUT",
    "release": "RELEASE TO LOAD SIGNAL",
    "drop": "DROP AUDIO TAPE HERE",
    "formats": "WAV / MP3 · MULTI-FILE QUEUE · BROWSER LOCAL",
    "busy": "READING",
    "load": "LOAD AUDIO"
  },
  "visualizers": {
    "subtitle": "ANALOG SIGNAL ANALYSIS / RACK A",
    "title": "VISUALIZER RACK",
    "telemetry": "Rack telemetry",
    "modules": "5 MODULES",
    "sampleRate": "48 KHZ READY",
    "lock": "SIGNAL LOCK",
    "standby": "STANDBY",
    "sync": "SYNC",
    "cal": "CAL / 24",
    "noSignal": "NO SIGNAL",
    "module": "SIGNAL MODULE",
    "waveform": "WAVEFORM",
    "waveSerial": "M/S HISTORY / DUAL",
    "scroll": "6 SEC / SCROLL",
    "side": "CHANNEL 1 — SIDE",
    "mid": "CHANNEL 2 — MID",
    "spectrum": "SPECTRUM",
    "spectrumSerial": "FFT-4096 / LOG",
    "range": "100 HZ — 5 KHZ",
    "scale": "Frequency scale",
    "spectrogram": "SPECTROGRAM",
    "spectrogramSerial": "FFT-4096 / HIST",
    "particles": "PARTICLE FIELD",
    "low": "LOW",
    "high": "HIGH",
    "live": "LIVE →",
    "stereometer": "STEREOMETER",
    "stereoSerial": "SCALED / BIPOLAR",
    "phase": "PHASE FIELD",
    "left": "L",
    "right": "R",
    "width": "MONO / WIDE",
    "oscilloscope": "OSCILLOSCOPE",
    "scopeSerial": "TRIGGER / AUTO",
    "division": "0.5 MS/DIV",
    "channel": "CH A",
    "trigger": "TRIG +"
  }
};
export type Dictionary = typeof en;
const ru: Dictionary = {
  "station": {
    "subtitle": "СИСТЕМА АНАЛИЗА АУДИОСИГНАЛА",
    "systemStatus": "Состояние системы",
    "signal": "СИГНАЛ",
    "online": "АКТИВЕН",
    "idle": "ОЖИДАНИЕ",
    "audio": "WEB AUDIO / 24 БИТ",
    "local": "ЛОКАЛЬНАЯ ДЕКА / БЕЗ ПЕРЕДАЧИ",
    "station": "СТАНЦИЯ 08-KV",
    "monitor": "МОНИТОРИНГ A+B",
    "queue": "ОЧЕРЕДЬ",
    "fault": "ОШИБКА",
    "system": "СИСТЕМА",
    "dismiss": "Закрыть системное сообщение",
    "clear": "ЗАКРЫТЬ",
    "footer": "VS-880 УПРАВЛЕНИЕ СИГНАЛОМ",
    "keys": "ПРОБЕЛ: ПУСК · ← →: ПЕРЕМОТКА · ↑ ↓: ГРОМКОСТЬ · M: БЕЗ ЗВУКА · N/P: ТРЕКИ",
    "privacy": "АУДИО НЕ ПОКИДАЕТ ЭТОТ БРАУЗЕР",
    "language": "Язык"
  },
  "player": {
    "subtitle": "УПРАВЛЕНИЕ ВОСПРОИЗВЕДЕНИЕМ / ДЕКА B",
    "title": "АУДИОДЕКА VHS",
    "model": "МОДЕЛЬ VS-880 / ЛОКАЛЬНЫЕ ФАЙЛЫ",
    "transport": "ВОСПРОИЗВЕДЕНИЕ ЛЕНТЫ",
    "unit": "БЛОК 02 / СТЕРЕО",
    "ready": "ГОТОВО",
    "play": "ПУСК",
    "mute": "БЕЗ ЗВУКА",
    "end": "КОНЕЦ",
    "now": "СЕЙЧАС ИГРАЕТ",
    "empty": "КАССЕТА НЕ ВСТАВЛЕНА",
    "next": "ДАЛЕЕ",
    "queueEnd": "КОНЕЦ ОЧЕРЕДИ",
    "advance": "АВТОПЕРЕХОД / БЕЗ ПОВТОРА",
    "controls": "Управление воспроизведением",
    "previousLabel": "Предыдущий трек",
    "previous": "НАЗАД",
    "pauseLabel": "Пауза",
    "playLabel": "Воспроизвести",
    "pause": "ПАУЗА",
    "nextLabel": "Следующий трек",
    "nextButton": "ДАЛЕЕ",
    "currentTime": "ТЕКУЩЕЕ ВРЕМЯ",
    "totalTime": "ДЛИТЕЛЬНОСТЬ",
    "position": "Позиция воспроизведения",
    "output": "ГРОМКОСТЬ",
    "muted": "БЕЗ ЗВУКА",
    "outputLabel": "Громкость",
    "unmuteLabel": "Включить звук",
    "muteLabel": "Выключить звук",
    "playing": "ВОСПРОИЗВЕДЕНИЕ",
    "paused": "ПАУЗА"
  },
  "tracks": {
    "subtitle": "ЛОКАЛЬНЫЙ АРХИВ / ОЧЕРЕДЬ C",
    "title": "БИБЛИОТЕКА ТРЕКОВ",
    "empty": "АУДИО НЕ ЗАГРУЖЕНО",
    "help": "Загрузите файлы WAV или MP3 с помощью панели выше.",
    "local": "ЛОКАЛЬНЫЙ СИГНАЛ",
    "selected": "ВЫБРАНО"
  },
  "upload": {
    "reading": "ЧТЕНИЕ ЛЕНТЫ...",
    "input": "ЗАГРУЗКА ЛОКАЛЬНЫХ ФАЙЛОВ",
    "release": "ОТПУСТИТЕ ДЛЯ ЗАГРУЗКИ",
    "drop": "ПЕРЕТАЩИТЕ АУДИО СЮДА",
    "formats": "WAV / MP3 · НЕСКОЛЬКО ФАЙЛОВ · В БРАУЗЕРЕ",
    "busy": "ЧТЕНИЕ",
    "load": "ЗАГРУЗИТЬ АУДИО"
  },
  "visualizers": {
    "subtitle": "АНАЛИЗ АНАЛОГОВОГО СИГНАЛА / СТОЙКА A",
    "title": "СТОЙКА ВИЗУАЛИЗАТОРОВ",
    "telemetry": "Телеметрия стойки",
    "modules": "5 МОДУЛЕЙ",
    "sampleRate": "48 КГЦ / ГОТОВО",
    "lock": "СИГНАЛ ЗАХВАЧЕН",
    "standby": "ОЖИДАНИЕ",
    "sync": "СИНХР.",
    "cal": "КАЛИБР. / 24",
    "noSignal": "НЕТ СИГНАЛА",
    "module": "МОДУЛЬ СИГНАЛА",
    "waveform": "ВОЛНОВАЯ ФОРМА",
    "waveSerial": "ИСТОРИЯ M/S / ДВА КАНАЛА",
    "scroll": "6 С / ПРОКРУТКА",
    "side": "КАНАЛ 1 — БОКОВОЙ",
    "mid": "КАНАЛ 2 — ЦЕНТРАЛЬНЫЙ",
    "spectrum": "СПЕКТР",
    "spectrumSerial": "FFT-4096 / ЛОГ.",
    "range": "100 ГЦ — 5 КГЦ",
    "scale": "Шкала частот",
    "spectrogram": "СПЕКТРОГРАММА",
    "spectrogramSerial": "FFT-4096 / ИСТОРИЯ",
    "particles": "ПОЛЕ ЧАСТИЦ",
    "low": "НИЗКИЕ",
    "high": "ВЫСОКИЕ",
    "live": "СЕЙЧАС →",
    "stereometer": "СТЕРЕОМЕТР",
    "stereoSerial": "МАСШТАБ / ДВА ПОЛЮСА",
    "phase": "ФАЗОВОЕ ПОЛЕ",
    "left": "Л",
    "right": "П",
    "width": "МОНО / ШИРОКО",
    "oscilloscope": "ОСЦИЛЛОСКОП",
    "scopeSerial": "ЗАПУСК / АВТО",
    "division": "0.5 МС/ДЕЛ",
    "channel": "КАНАЛ A",
    "trigger": "ЗАПУСК +"
  }
};
export function dictionaryFor(language: Language): Dictionary {
  if (language === "en") return en;
  return Object.fromEntries(
    Object.entries(en).map(([section, entries]) => [
      section,
      { ...entries, ...ru[section as keyof Dictionary] },
    ]),
  ) as Dictionary;
}

export function tapesLoaded(count: number, language: Language): string {
  const stamp = count.toString().padStart(2, "0");
  if (language === "en") {
    return stamp + (count === 1 ? " TAPE LOADED" : " TAPES LOADED");
  }
  const mod10 = count % 10;
  const mod100 = count % 100;
  const noun = mod10 === 1 && mod100 !== 11
    ? "КАССЕТА"
    : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "КАССЕТЫ"
      : "КАССЕТ";
  return "ЗАГРУЖЕНО: " + stamp + " " + noun;
}

export function playbackStatus(status: PlaybackStatus, t: Dictionary): string {
  return {
    "NO SIGNAL": t.visualizers.noSignal,
    READY: t.player.ready,
    PLAYING: t.player.playing,
    PAUSED: t.player.paused,
    END: t.player.end,
  }[status];
}

const russianAudioErrors: Record<string, string> = {
  "UNABLE TO INITIALIZE AUDIO SIGNAL": "НЕ УДАЛОСЬ ИНИЦИАЛИЗИРОВАТЬ АУДИОСИГНАЛ",
  "UNABLE TO PLAY AUDIO SIGNAL": "НЕ УДАЛОСЬ ВОСПРОИЗВЕСТИ АУДИОСИГНАЛ",
  "UNABLE TO READ AUDIO SIGNAL": "НЕ УДАЛОСЬ ПРОЧИТАТЬ АУДИОСИГНАЛ",
};

export function audioError(error: string, language: Language): string {
  return language === "ru"
    ? russianAudioErrors[error] ?? "ОШИБКА АУДИОСИГНАЛА"
    : error;
}

export function unreadableFiles(names: string[], language: Language): string {
  return (language === "ru" ? "НЕ УДАЛОСЬ ПРОЧИТАТЬ: " : "UNABLE TO READ: ") + names.join(", ");
}

export function selectTrackLabel(name: string, language: Language): string {
  return (language === "ru" ? "Выбрать " : "Select ") + name;
}

export function signalDisplayLabel(title: string, language: Language): string {
  return language === "ru" ? title + ": отображение сигнала" : title + " signal display";
}
