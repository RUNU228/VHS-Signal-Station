# Stereometer Full-Field Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make all 2,400 stereometer particles continuously visible and responsive by updating the entire bipolar field from live stereo samples every animation frame with frame-rate-independent motion.

**Architecture:** Move full-field target generation and motion timing into allocation-free pure helpers in `src/lib/visualization/stereometer.ts`. Simplify the Canvas component to one permanent five-float particle layout—current X/Y, target X/Y, and magnitude—and remove cursor, reveal, and partial-refresh state entirely.

**Tech Stack:** Next.js 16, React 19, TypeScript, Web Audio API, Canvas 2D, Vitest.

## Global Constraints

- Keep exactly 2,400 particles in one reusable typed array.
- Every particle target must be refreshed from current left/right samples on every active animation frame.
- Use `x = clamp(Left - Right, -1, 1)` and `y = clamp(Left + Right, -1, 1)`.
- Every initialized particle must always render at nonzero value-driven opacity; remove reveal, birth, age, lifetime, and fade state.
- Initialize current and target coordinates to identical real-signal positions on the first frame.
- Motion must use one frame-rate-independent exponential factor calculated once per frame.
- Do not use randomness, React particle elements, new dependencies, or per-particle object/array allocations.
- Pausing must preserve the latest Canvas field; resuming must update all live targets without pop-in.
- Git metadata is read-only and the repository is unborn; use `git diff --check` rather than commits.

---

### Task 1: Full-Field Signal and Motion Helpers

**Files:**
- Modify: `src/lib/visualization/stereometer.ts`
- Modify: `src/lib/visualization/stereometer.test.ts`

**Interfaces:**
- Consumes: preallocated particle `Float32Array`, current left/right `Float32Array` samples, animation delta seconds.
- Produces: `STEREOMETER_PARTICLE_STRIDE = 5`, `initializeStereoField(particles, left, right): boolean`, `updateStereoTargets(particles, left, right): boolean`, and `stereoMotionFactor(deltaSeconds: number): number`.
- Particle layout: current X, current Y, target X, target Y, magnitude.

- [ ] **Step 1: Write failing tests for the new five-value field**

Replace reveal/lifetime assertions with:

```ts
it("initializes every current coordinate directly on its real signal target", () => {
  const particles = new Float32Array(STEREOMETER_PARTICLE_COUNT * 5);
  expect(initializeStereoField(
    particles,
    new Float32Array([0.5, -0.25]),
    new Float32Array([0.25, 0.25]),
  )).toBe(true);
  expect(STEREOMETER_PARTICLE_STRIDE).toBe(5);
  for (let particle = 0; particle < STEREOMETER_PARTICLE_COUNT; particle += 1) {
    const offset = particle * STEREOMETER_PARTICLE_STRIDE;
    expect(particles[offset]).toBe(particles[offset + 2]);
    expect(particles[offset + 1]).toBe(particles[offset + 3]);
    expect(particles[offset + 4]).toBeGreaterThanOrEqual(0);
    expect(particles[offset + 4]).toBeLessThanOrEqual(1);
  }
});

it("refreshes every particle target from the current stereo frame", () => {
  const particles = new Float32Array(STEREOMETER_PARTICLE_COUNT * 5);
  initializeStereoField(particles, new Float32Array([0]), new Float32Array([0]));
  expect(updateStereoTargets(
    particles,
    new Float32Array([0.75]),
    new Float32Array([-0.25]),
  )).toBe(true);
  for (let particle = 0; particle < STEREOMETER_PARTICLE_COUNT; particle += 1) {
    const offset = particle * STEREOMETER_PARTICLE_STRIDE;
    expect(particles[offset + 2]).toBe(1);
    expect(particles[offset + 3]).toBe(0.5);
    expect(particles[offset + 4]).toBe(1);
  }
});

it("uses a safe frame-rate-independent motion factor", () => {
  expect(stereoMotionFactor(0)).toBe(0);
  expect(stereoMotionFactor(1 / 120)).toBeGreaterThan(0);
  expect(stereoMotionFactor(1 / 60)).toBeGreaterThan(stereoMotionFactor(1 / 120));
  expect(stereoMotionFactor(10)).toBeLessThanOrEqual(1);
});

it("rejects empty paired input without corrupting the field", () => {
  const particles = new Float32Array(STEREOMETER_PARTICLE_COUNT * 5).fill(0.5);
  expect(updateStereoTargets(particles, new Float32Array(), new Float32Array())).toBe(false);
  expect(particles.every((value) => value === 0.5)).toBe(true);
});
```

- [ ] **Step 2: Run focused tests and verify RED**

```powershell
node node_modules\vitest\vitest.mjs run src\lib\visualization\stereometer.test.ts
```

Expected: FAIL because the five-value layout and new full-field helper exports do not exist.

- [ ] **Step 3: Implement allocation-free full-field helpers**

Set `STEREOMETER_PARTICLE_STRIDE` to `5`. Add a local scalar helper that maps a particle index deterministically to `Math.floor(index * sampleCount / 2400)`, clamps bipolar coordinates, and stores target X/Y and magnitude. `initializeStereoField` calls the target updater and copies every target into current X/Y. `updateStereoTargets` writes all 2,400 targets and returns `false` without modifying the buffer when no paired samples exist. `stereoMotionFactor` clamps delta to `[0, 0.05]` and returns `1 - Math.exp(-delta * 28)` for a responsive, time-based approach.

Remove `particleReveal`, `seedStereoField`, and reveal-related layout code. Preserve `particleOpacity`; remove `smoothStereoPoint` if no remaining callers exist after Task 2.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run the command from Step 2. Expected: all stereometer helper tests pass.

- [ ] **Step 5: Verify task hygiene**

```powershell
git diff --check
```

Expected: no whitespace errors; no commit is possible because Git metadata is read-only.

---

### Task 2: Integrate the Always-Visible Live Field

**Files:**
- Modify: `src/components/visualizers/Stereometer.tsx`
- Test: `src/lib/visualization/stereometer.test.ts`

**Interfaces:**
- Consumes: the five-float particle layout, `initializeStereoField`, `updateStereoTargets`, `stereoMotionFactor`, `particleOpacity`, and `smoothSignalColor`.
- Produces: a Canvas instrument that updates and draws all 2,400 particles on every active frame without reveal state or circular refresh.

- [ ] **Step 1: Replace partial refresh with full-field updates**

Remove `PARTICLES_PER_FRAME`, `PARTICLE_REVEAL_SECONDS`, cursor state, smoothed point refs, and all reveal calculations. On the first analyser frame, call `initializeStereoField`; on every subsequent frame call `updateStereoTargets`. Compute `deltaSeconds` once and `motionEase = stereoMotionFactor(deltaSeconds)` once.

- [ ] **Step 2: Move and render every persistent particle**

In one bounded 2,400-particle loop:

```ts
particles[offset] += (particles[offset + 2] - particles[offset]) * motionEase;
particles[offset + 1] += (particles[offset + 3] - particles[offset + 1]) * motionEase;
const intensity = particles[offset + 4];
const opacity = particleOpacity(intensity);
context.fillStyle = smoothSignalColor(intensity, opacity);
context.fillRect(x - size / 2, y - size / 2, size, size);
```

Never skip an initialized particle. Do not reset any visibility field because the layout no longer contains one.

- [ ] **Step 3: Run complete automated verification**

```powershell
node node_modules\vitest\vitest.mjs run
node node_modules\eslint\bin\eslint.js .
node node_modules\next\dist\bin\next build
```

Expected: all tests pass, ESLint is clean, and Next.js compiles, type-checks, and prerenders `/`.

- [ ] **Step 4: Verify live motion and persistence**

At `http://localhost:3000`, load an asymmetric stereo WAV. Observe the field during changing signal, quiet passages, pause, and resume. Confirm all particles respond immediately and smoothly; none disappear, repopulate in waves, or pop in slot-by-slot; quiet particles remain faintly visible; browser warning/error logs remain empty.

- [ ] **Step 5: Final workspace verification**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and only intentional project changes in the unborn working tree.
