import type { AudioReactiveSnapshot } from "@/types/audio";

export type SignalRgb = readonly [number, number, number];

export type SignalTheme = {
  rgb: SignalRgb;
  brightness: number;
  saturation: number;
  glow: number;
};

const STOPS = [
  { at: 0, rgb: [53, 69, 82] },
  { at: 0.65, rgb: [230, 215, 163] },
  { at: 0.82, rgb: [228, 166, 90] },
  { at: 1, rgb: [211, 79, 67] },
] as const satisfies readonly { at: number; rgb: SignalRgb }[];

function clamp(value: number, minimum = 0, maximum = 1): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}

export function localSignalLevel(
  localLevel: number,
  overallEnergy: number,
): number {
  return clamp(localLevel * 0.82 + overallEnergy * 0.18);
}

function smoothstep(value: number): number {
  const amount = clamp(value);
  return amount * amount * (3 - 2 * amount);
}

function interpolate(start: SignalRgb, end: SignalRgb, amount: number): SignalRgb {
  return [
    start[0] + (end[0] - start[0]) * amount,
    start[1] + (end[1] - start[1]) * amount,
    start[2] + (end[2] - start[2]) * amount,
  ];
}

function colorForLevel(level: number): SignalRgb {
  const value = clamp(level);
  const stopIndex = STOPS.findIndex((stop) => value <= stop.at);
  const end = STOPS[stopIndex === -1 ? STOPS.length - 1 : stopIndex];
  const start = STOPS[Math.max(0, STOPS.indexOf(end) - 1)];
  const range = end.at - start.at;
  const localValue = range === 0 ? 0 : (value - start.at) / range;

  return interpolate(start.rgb, end.rgb, smoothstep(localValue));
}

function formatChannel(value: number): string {
  return String(Math.round(clamp(value, 0, 255) * 100) / 100);
}

function formatColor(rgb: SignalRgb, alpha: number): string {
  return `rgba(${rgb.map(formatChannel).join(", ")}, ${clamp(alpha)})`;
}

export function signalColorForLevel(level: number, alpha = 1): string {
  return formatColor(colorForLevel(level), alpha);
}

export function createSignalTheme(snapshot: AudioReactiveSnapshot): SignalTheme {
  const overallEnergy = clamp(snapshot.overallEnergy);
  const bandBias = clamp(
    (clamp(snapshot.lowEnergy) - clamp(snapshot.highEnergy)) * 12,
    -12,
    12,
  );
  const rgb = colorForLevel(overallEnergy);

  return {
    rgb: [
      clamp(rgb[0] - bandBias, 0, 255),
      rgb[1],
      clamp(rgb[2] + bandBias, 0, 255),
    ],
    brightness: 0.42 + overallEnergy * 0.58,
    saturation: 0.48 + overallEnergy * 0.52,
    glow: overallEnergy ** 1.35,
  };
}

export function signalColor(theme: SignalTheme, alpha = 1): string {
  return formatColor(theme.rgb, alpha);
}
