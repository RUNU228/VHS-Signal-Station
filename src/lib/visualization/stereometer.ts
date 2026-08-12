export const STEREOMETER_PARTICLE_COUNT = 2400;
export const STEREOMETER_PARTICLE_STRIDE = 5;

const PARTICLE_MIN_ALPHA = 0.14;
const PARTICLE_MAX_ALPHA = 0.88;
const MOTION_RESPONSE = 28;
const MAX_FRAME_DELTA_SECONDS = 0.05;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function smoothstep(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function particleOpacity(value: number): number {
  return PARTICLE_MIN_ALPHA
    + (PARTICLE_MAX_ALPHA - PARTICLE_MIN_ALPHA) * smoothstep(value);
}

export function stereoMotionFactor(deltaSeconds: number): number {
  const safeDelta = Number.isFinite(deltaSeconds)
    ? clamp(deltaSeconds, 0, MAX_FRAME_DELTA_SECONDS)
    : 0;
  return 1 - Math.exp(-safeDelta * MOTION_RESPONSE);
}

export function updateStereoTargets(
  particles: Float32Array,
  left: Float32Array,
  right: Float32Array,
): boolean {
  const sampleCount = Math.min(left.length, right.length);
  const requiredLength =
    STEREOMETER_PARTICLE_COUNT * STEREOMETER_PARTICLE_STRIDE;
  if (sampleCount === 0 || particles.length < requiredLength) return false;

  for (let particle = 0; particle < STEREOMETER_PARTICLE_COUNT; particle += 1) {
    const sample = Math.min(
      sampleCount - 1,
      Math.floor((particle * sampleCount) / STEREOMETER_PARTICLE_COUNT),
    );
    const targetX = clamp(left[sample] - right[sample], -1, 1);
    const targetY = clamp(left[sample] + right[sample], -1, 1);
    const offset = particle * STEREOMETER_PARTICLE_STRIDE;

    particles[offset + 2] = targetX;
    particles[offset + 3] = targetY;
    particles[offset + 4] = clamp(Math.hypot(targetX, targetY), 0, 1);
  }

  return true;
}

export function initializeStereoField(
  particles: Float32Array,
  left: Float32Array,
  right: Float32Array,
): boolean {
  if (!updateStereoTargets(particles, left, right)) return false;

  for (let particle = 0; particle < STEREOMETER_PARTICLE_COUNT; particle += 1) {
    const offset = particle * STEREOMETER_PARTICLE_STRIDE;
    particles[offset] = particles[offset + 2];
    particles[offset + 1] = particles[offset + 3];
  }

  return true;
}
