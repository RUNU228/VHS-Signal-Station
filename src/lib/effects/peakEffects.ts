import type { AudioReactiveSnapshot, VisualQuality } from "@/types/audio";

export type PeakEffectVariant =
  | "glow"
  | "burst"
  | "shake"
  | "glitch-band"
  | "combined";

export type PeakEffectRecipe = {
  seed: number;
  strength: number;
  durationMs: number;
  shakeDurationMs: number;
  shakeX: number;
  shakeY: number;
  sliceOffset: number;
  rgbOffset: number;
  noiseOpacity: number;
  flash: number;
  crackleDensity: number;
  burstCount: number;
  variant: PeakEffectVariant;
};

const QUALITY_SCALE: Record<VisualQuality, number> = {
  LOW: 0.62,
  MEDIUM: 0.82,
  HIGH: 1,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function xorshift(seed: number): () => number {
  let state = seed >>> 0;
  if (state === 0) state = 0x9e37_79b9;

  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function uint32Seed(peakSeed: number, peakEventId: number): number {
  const source = Number.isFinite(peakSeed) && peakSeed !== 0
    ? Math.abs(peakSeed)
    : Math.abs(peakEventId);
  const whole = Math.trunc(source) >>> 0;
  const fractional = Math.floor((source - Math.trunc(source)) * 0x1_0000_0000) >>> 0;
  return (whole ^ fractional) >>> 0 || (peakEventId >>> 0);
}

export function createPeakEffectRecipe(
  snapshot: AudioReactiveSnapshot,
  quality: VisualQuality,
  reducedMotion: boolean,
): PeakEffectRecipe | null {
  if (snapshot.peakEventId <= 0 || snapshot.peakStrength <= 0) return null;

  const seed = uint32Seed(snapshot.peakSeed, snapshot.peakEventId);
  const random = xorshift(seed);
  const strength = clamp(snapshot.peakStrength, 0, 1);
  const qualityScale = QUALITY_SCALE[quality];
  const durationMs = Math.min(
    150,
    Math.round(30 + random() * 78 + strength * 42),
  );
  const shakeDurationMs = Math.min(
    120,
    Math.max(30, Math.round(durationMs * (0.55 + random() * 0.3))),
  );

  let variant: PeakEffectVariant;
  if (strength < 0.72) {
    variant = random() < 0.5 ? "glow" : "burst";
  } else if (strength < 0.88) {
    variant = random() < 0.5 ? "shake" : "glitch-band";
  } else {
    variant = "combined";
  }

  const signedMotion = (maximum: number) =>
    (random() * 2 - 1) * maximum * strength * qualityScale;
  const usesShake = variant === "shake" || variant === "combined";
  const usesSlice = variant === "glitch-band" || variant === "combined";
  const colorEnergy = clamp(
    snapshot.highEnergy * 0.65 + snapshot.midEnergy * 0.2 + strength * 0.35,
    0,
    1,
  );
  const burstEnabled = variant === "burst" || variant === "combined";

  return {
    seed,
    strength,
    durationMs,
    shakeDurationMs,
    shakeX: reducedMotion || !usesShake ? 0 : clamp(signedMotion(6), -6, 6),
    shakeY: reducedMotion || !usesShake ? 0 : clamp(signedMotion(6), -6, 6),
    sliceOffset: reducedMotion || !usesSlice
      ? 0
      : clamp(signedMotion(6), -6, 6),
    rgbOffset: clamp((1.1 + random() * 2.9) * (0.55 + colorEnergy * 0.45), 0, 4),
    noiseOpacity: clamp(
      (0.025 + random() * 0.055 + strength * 0.07) * qualityScale,
      0,
      0.15,
    ),
    flash: clamp(
      (0.025 + strength * 0.15 + random() * 0.025) * qualityScale,
      0,
      reducedMotion ? 0.08 : 0.2,
    ),
    crackleDensity: clamp(
      (0.15 + strength * 0.65 + random() * 0.2) * qualityScale,
      0,
      1,
    ),
    burstCount: burstEnabled
      ? Math.min(50, Math.round((12 + strength * 30 + random() * 8) * qualityScale * (reducedMotion ? 0.35 : 1)))
      : 0,
    variant,
  };
}
