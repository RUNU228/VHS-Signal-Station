# Waveform Color and Persistent Stereometer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add continuously interpolated signal colors to the Waveform and Stereometer while replacing age-expiring stereometer points with one persistent 2,400-particle bipolar field.

**Architecture:** Extend the focused Canvas helpers with a shared continuous color interpolator and persistent-particle math. Keep React out of the frame loop: `Waveform` will ease two numeric color levels in refs, while `Stereometer` will seed and refresh one reusable typed-array ring from real left/right samples.

**Tech Stack:** Next.js 16, React 19, TypeScript, Web Audio API, Canvas 2D, Vitest.

## Global Constraints

- Keep the existing Side/Mid formulas and scrolling histories unchanged.
- Use exactly 2,400 stereometer particles in one bounded typed array.
- Every coordinate, intensity, opacity, and color must derive from real audio samples.
- Low-value initialized particles must remain subtly visible; higher values become smoothly more opaque.
- Particles never expire by age and remain until their ring-buffer slot is replaced.
- Do not introduce random motion, React particle elements, dependencies, or per-frame array allocations.
- Git metadata is read-only and the repository has no commits; use `git diff --check` checkpoints instead of commit operations.

---

### Task 1: Continuous Signal Color

**Files:**
- Create: `src/lib/visualization/canvas.test.ts`
- Modify: `src/lib/visualization/canvas.ts`

**Interfaces:**
- Consumes: normalized signal level `number` and optional alpha `number`.
- Produces: `smoothSignalColor(level: number, alpha?: number): string` returning a clamped continuous `rgba(...)` color.

- [ ] **Step 1: Write the failing color interpolation tests**

```ts
import { describe, expect, it } from "vitest";
import { smoothSignalColor } from "./canvas";

describe("smoothSignalColor", () => {
  it("interpolates continuously through the analog signal palette", () => {
    expect(smoothSignalColor(0, 0.5)).toBe("rgba(111, 145, 168, 0.5)");
    expect(smoothSignalColor(0.5, 0.5)).toBe("rgba(196, 154, 82, 0.5)");
    expect(smoothSignalColor(1, 0.5)).toBe("rgba(168, 77, 67, 0.5)");
    expect(smoothSignalColor(0.25, 0.5)).not.toBe(smoothSignalColor(0, 0.5));
  });

  it("clamps values outside the supported range", () => {
    expect(smoothSignalColor(-1)).toBe(smoothSignalColor(0));
    expect(smoothSignalColor(2)).toBe(smoothSignalColor(1));
  });
});
```

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
node node_modules\vitest\vitest.mjs run src\lib\visualization\canvas.test.ts
```

Expected: FAIL because `smoothSignalColor` is not exported.

- [ ] **Step 3: Implement continuous palette interpolation**

Add two helpers to `canvas.ts`: a local `smoothstep` and local RGB interpolation. Use the existing palette as three stops at normalized levels `0`, `0.5`, and `1`. Clamp level and alpha, smooth the local interpolation factor, round RGB channels, and return `rgba(r, g, b, alpha)`.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run the command from Step 2. Expected: 2 tests pass.

- [ ] **Step 5: Check the task diff**

```powershell
git diff --check
```

Expected: no whitespace errors. A commit is unavailable because `.git` is read-only.

---

### Task 2: Persistent Bipolar Particle Math

**Files:**
- Modify: `src/lib/visualization/stereometer.test.ts`
- Modify: `src/lib/visualization/stereometer.ts`

**Interfaces:**
- Consumes: real left/right `Float32Array` samples and a preallocated particle `Float32Array`.
- Produces: `STEREOMETER_PARTICLE_COUNT = 2400`, `STEREOMETER_PARTICLE_STRIDE = 6`, `particleOpacity(value: number): number`, `particleReveal(progress: number): number`, and `seedStereoField(particles, left, right): StereoPoint`.
- Particle fields: current X, current Y, target X, target Y, reveal progress, bipolar magnitude.

- [ ] **Step 1: Replace age-decay tests with failing persistence tests**

```ts
import {
  STEREOMETER_PARTICLE_COUNT,
  STEREOMETER_PARTICLE_STRIDE,
  particleOpacity,
  particleReveal,
  seedStereoField,
} from "./stereometer";

it("keeps quiet particles visible and increases opacity with value", () => {
  expect(particleOpacity(0)).toBeGreaterThan(0);
  expect(particleOpacity(0.25)).toBeGreaterThan(particleOpacity(0));
  expect(particleOpacity(0.75)).toBeGreaterThan(particleOpacity(0.25));
  expect(particleOpacity(1)).toBeGreaterThan(particleOpacity(0.75));
});

it("reveals particles once without a fade-out phase", () => {
  expect(particleReveal(0)).toBe(0);
  expect(particleReveal(0.5)).toBeGreaterThan(0);
  expect(particleReveal(1)).toBe(1);
  expect(particleReveal(4)).toBe(1);
});

it("seeds the full fixed field from real bipolar samples", () => {
  const particles = new Float32Array(
    STEREOMETER_PARTICLE_COUNT * STEREOMETER_PARTICLE_STRIDE,
  );
  seedStereoField(
    particles,
    new Float32Array([0.5, -0.25]),
    new Float32Array([0.25, 0.25]),
  );
  expect(STEREOMETER_PARTICLE_COUNT).toBe(2400);
  expect(particles.some((value) => value !== 0)).toBe(true);
});
```

- [ ] **Step 2: Run stereometer tests and verify RED**

```powershell
node node_modules\vitest\vitest.mjs run src\lib\visualization\stereometer.test.ts
```

Expected: FAIL because persistent opacity, reveal, seeding, and fixed-count exports do not yet exist.

- [ ] **Step 3: Implement fixed-field helpers**

In `stereometer.ts`:

- export the count and stride constants;
- map clamped magnitude through smoothstep from minimum alpha `0.14` to maximum alpha `0.88`;
- make `particleReveal` a one-way smoothstep from `0` to `1` with no decay;
- seed all 2,400 slots by cycling over the supplied samples, calculating bipolar X/Y, smoothing sequential coordinates, setting current and target coordinates, setting reveal to zero, and storing `clamp(hypot(x, y), 0, 1)`.

- [ ] **Step 4: Run focused stereometer tests and verify GREEN**

Run the command from Step 2. Expected: all stereometer helper tests pass.

- [ ] **Step 5: Check the task diff**

```powershell
git diff --check
```

Expected: no whitespace errors. A commit is unavailable because `.git` is read-only.

---

### Task 3: Integrate Persistent Rendering

**Files:**
- Modify: `src/components/visualizers/Waveform.tsx`
- Modify: `src/components/visualizers/Stereometer.tsx`
- Test: `src/lib/visualization/canvas.test.ts`
- Test: `src/lib/visualization/stereometer.test.ts`

**Interfaces:**
- Consumes: `smoothSignalColor`, fixed-field stereometer constants/helpers, live analyzer samples, existing animation frame timing.
- Produces: independent smoothly colored Side/Mid history envelopes and a persistent 2,400-particle Canvas field.

- [ ] **Step 1: Integrate Waveform color easing**

Add `colorLevelsRef = useRef([0, 0])`. For each Side/Mid trace, move its stored level toward the current history peak using asymmetric easing (`0.09` while rising, `0.035` while falling). Replace each `signalColor` call in the Waveform with `smoothSignalColor(easedLevel, alpha)` so fill, outline, RMS, and glow share one continuously changing hue.

- [ ] **Step 2: Integrate the persistent particle buffer**

In `Stereometer.tsx`:

- import the 2,400 count, stride, opacity, reveal, seed, and continuous color helpers;
- add `initializedRef` and seed the full typed array on the first active analyser frame;
- keep refreshing 24 circular slots per frame from real left/right samples;
- increment each slot's reveal value toward `1`, never expire or skip a seeded particle by age;
- render alpha as `particleOpacity(magnitude) * particleReveal(reveal)`;
- render color with `smoothSignalColor(magnitude, alpha)`;
- retain coordinate easing toward each slot's real-signal target.

- [ ] **Step 3: Run the full automated suite**

```powershell
node node_modules\vitest\vitest.mjs run
```

Expected: all existing and new tests pass.

- [ ] **Step 4: Run static and production verification**

```powershell
node node_modules\eslint\bin\eslint.js .
node node_modules\next\dist\bin\next build
```

Expected: ESLint exits cleanly; Next.js compiles, type-checks, and prerenders `/` successfully.

- [ ] **Step 5: Verify live behavior in the browser**

Load asymmetric stereo WAV audio at `http://localhost:3000`. Confirm the Side and Mid histories transition continuously, the stereometer shows a dense field immediately, low-value points remain faint, high-value points become more opaque and warmer, the field does not decay away, and browser error/warning logs remain empty.

- [ ] **Step 6: Final workspace check**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only intentional project changes and documentation are present.
