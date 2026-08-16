import type { VisualQuality } from "@/types/audio";

export const STEREOMETER_PARTICLE_STRIDE = 7;

const PARTICLE_MIN_ALPHA = 0.1;
const PARTICLE_MAX_ALPHA = 0.92;
const PARTICLE_MIN_SIZE = 0.8;
const PARTICLE_MAX_SIZE = 3.6;
const MAX_FRAME_DELTA_SECONDS = 0.05;
const COHORT_MOTION_RESPONSE = [14, 24, 38] as const;

const CURRENT_X = 0;
const CURRENT_Y = 1;
const TARGET_X = 2;
const TARGET_Y = 3;
const INTENSITY = 4;
const COHORT = 5;
const PHASE = 6;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function particleCountForQuality(quality: VisualQuality): number {
  switch (quality) {
    case "LOW": return 640;
    case "MEDIUM": return 1_280;
    case "HIGH": return 2_400;
  }
}

export function createStereoField(quality: VisualQuality): Float32Array {
  const count = particleCountForQuality(quality);
  const particles = new Float32Array(count * STEREOMETER_PARTICLE_STRIDE);

  for (let particle = 0; particle < count; particle += 1) {
    const offset = particle * STEREOMETER_PARTICLE_STRIDE;
    particles[offset + COHORT] = particle % 3;
    particles[offset + PHASE] = (particle * 0.61803398875) % 1;
  }

  return particles;
}

export function readCohort(particles: Float32Array, particle: number): number {
  return particles[particle * STEREOMETER_PARTICLE_STRIDE + COHORT] ?? 0;
}

export function particleOpacity(value: number): number {
  return PARTICLE_MIN_ALPHA
    + (PARTICLE_MAX_ALPHA - PARTICLE_MIN_ALPHA) * smoothstep(value);
}

export function particleFinalOpacity(intensity: number, phase: number): number {
  const phaseMultiplier = 0.88 + clamp(phase, 0, 1) * 0.12;
  return clamp(
    particleOpacity(intensity) * phaseMultiplier,
    PARTICLE_MIN_ALPHA,
    PARTICLE_MAX_ALPHA,
  );
}

export function particleSize(value: number): number {
  if (value <= 0) return PARTICLE_MIN_SIZE;
  if (value >= 1) return PARTICLE_MAX_SIZE;
  return PARTICLE_MIN_SIZE
    + (PARTICLE_MAX_SIZE - PARTICLE_MIN_SIZE) * smoothstep(value);
}

export function stereoMotionFactor(deltaSeconds: number, cohort = 1): number {
  const safeDelta = Number.isFinite(deltaSeconds)
    ? clamp(deltaSeconds, 0, MAX_FRAME_DELTA_SECONDS)
    : 0;
  const response = COHORT_MOTION_RESPONSE[clamp(Math.round(cohort), 0, 2)];
  return 1 - Math.exp(-safeDelta * response);
}

export function stereoMetrics(
  left: Float32Array,
  right: Float32Array,
): { balance: number; width: number } {
  const sampleCount = Math.min(left.length, right.length);
  if (sampleCount === 0) return { balance: 0, width: 0 };

  let leftTotal = 0;
  let rightTotal = 0;
  let widthTotal = 0;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const leftSample = left[sample];
    const rightSample = right[sample];
    leftTotal += leftSample;
    rightTotal += rightSample;
    widthTotal += Math.abs(leftSample - rightSample);
  }

  return {
    balance: (leftTotal - rightTotal) /
      Math.max(0.0001, Math.abs(leftTotal) + Math.abs(rightTotal)),
    width: widthTotal / sampleCount,
  };
}

export function updateStereoTargets(
  particles: Float32Array,
  left: Float32Array,
  right: Float32Array,
  lowEnergy = 0,
  midEnergy = 0,
  highEnergy = 0,
): boolean {
  const sampleCount = Math.min(left.length, right.length);
  const particleCount = Math.floor(particles.length / STEREOMETER_PARTICLE_STRIDE);
  if (sampleCount === 0 || particleCount === 0) return false;

  const safeLowEnergy = clamp(lowEnergy, 0, 1);
  const safeMidEnergy = clamp(midEnergy, 0, 1);
  const safeHighEnergy = clamp(highEnergy, 0, 1);

  for (let particle = 0; particle < particleCount; particle += 1) {
    const sample = Math.min(
      sampleCount - 1,
      Math.floor((particle * sampleCount) / particleCount),
    );
    const offset = particle * STEREOMETER_PARTICLE_STRIDE;
    const cohort = particles[offset + COHORT] as 0 | 1 | 2;
    const cohortEnergy = cohort === 0
      ? safeLowEnergy
      : cohort === 1 ? safeMidEnergy : safeHighEnergy;
    const travel = 0.72 + cohortEnergy * 0.28;
    const targetX = clamp((left[sample] - right[sample]) * travel, -1, 1);
    const targetY = clamp((left[sample] + right[sample]) * travel, -1, 1);

    particles[offset + TARGET_X] = targetX;
    particles[offset + TARGET_Y] = targetY;
    particles[offset + INTENSITY] = clamp(Math.hypot(targetX, targetY), 0, 1);
  }

  return true;
}

export function initializeStereoField(
  particles: Float32Array,
  left: Float32Array,
  right: Float32Array,
  lowEnergy = 0,
  midEnergy = 0,
  highEnergy = 0,
): boolean {
  if (!updateStereoTargets(particles, left, right, lowEnergy, midEnergy, highEnergy)) {
    return false;
  }

  const particleCount = Math.floor(particles.length / STEREOMETER_PARTICLE_STRIDE);
  for (let particle = 0; particle < particleCount; particle += 1) {
    const offset = particle * STEREOMETER_PARTICLE_STRIDE;
    particles[offset + CURRENT_X] = particles[offset + TARGET_X];
    particles[offset + CURRENT_Y] = particles[offset + TARGET_Y];
  }

  return true;
}
