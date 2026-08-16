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

type PeakEffectBudget = {
  shake: number;
  slice: number;
  rgb: number;
  noise: number;
  flash: number;
  crackle: number;
  burst: number;
};

const VARIANT_BUDGETS: Record<PeakEffectVariant, PeakEffectBudget> = {
  glow: {
    shake: 0,
    slice: 0,
    rgb: 0,
    noise: 0,
    flash: 0.55,
    crackle: 0,
    burst: 0,
  },
  burst: {
    shake: 0,
    slice: 0,
    rgb: 0,
    noise: 0,
    flash: 0,
    crackle: 0,
    burst: 1,
  },
  shake: {
    shake: 1,
    slice: 0,
    rgb: 0,
    noise: 0,
    flash: 0,
    crackle: 0,
    burst: 0,
  },
  "glitch-band": {
    shake: 0,
    slice: 1,
    rgb: 1,
    noise: 0,
    flash: 0,
    crackle: 0,
    burst: 0,
  },
  combined: {
    shake: 1,
    slice: 1,
    rgb: 1,
    noise: 1,
    flash: 1,
    crackle: 1,
    burst: 1,
  },
};

const REDUCED_MOTION_BUDGET: PeakEffectBudget = {
  shake: 0,
  slice: 0,
  rgb: 0,
  noise: 0,
  flash: 0.25,
  crackle: 0,
  burst: 0,
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

  const renderedVariant = reducedMotion ? "glow" : variant;
  const budget = reducedMotion
    ? REDUCED_MOTION_BUDGET
    : VARIANT_BUDGETS[renderedVariant];

  const signedMotion = (maximum: number) =>
    (random() * 2 - 1) * maximum * strength * qualityScale;
  const colorEnergy = clamp(
    snapshot.highEnergy * 0.65 + snapshot.midEnergy * 0.2 + strength * 0.35,
    0,
    1,
  );
  const shakeX = budget.shake === 0 ? 0 : clamp(signedMotion(6), -6, 6);
  const shakeY = budget.shake === 0 ? 0 : clamp(signedMotion(6), -6, 6);
  const sliceOffset = budget.slice === 0 ? 0 : clamp(signedMotion(6), -6, 6);
  const rgbOffset = clamp(
    (1.1 + random() * 2.9) * (0.55 + colorEnergy * 0.45),
    0,
    4,
  );
  const noiseOpacity = clamp(
    (0.025 + random() * 0.055 + strength * 0.07) * qualityScale,
    0,
    0.15,
  );
  const flash = clamp(
    (0.025 + strength * 0.15 + random() * 0.025) * qualityScale,
    0,
    0.2,
  );
  const crackleDensity = clamp(
    (0.15 + strength * 0.65 + random() * 0.2) * qualityScale,
    0,
    1,
  );
  const burstCount = Math.min(
    50,
    Math.round((12 + strength * 30 + random() * 8) * qualityScale),
  );

  return {
    seed,
    strength,
    durationMs,
    shakeDurationMs,
    shakeX: shakeX * budget.shake,
    shakeY: shakeY * budget.shake,
    sliceOffset: sliceOffset * budget.slice,
    rgbOffset: rgbOffset * budget.rgb,
    noiseOpacity: noiseOpacity * budget.noise,
    flash: flash * budget.flash,
    crackleDensity: crackleDensity * budget.crackle,
    burstCount: Math.round(burstCount * budget.burst),
    variant: renderedVariant,
  };
}
