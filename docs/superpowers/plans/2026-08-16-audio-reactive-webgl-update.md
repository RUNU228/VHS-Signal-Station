# Audio-Reactive WebGL Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing VHS Signal Station communicate weak, medium, strong, and extreme audio through one shared signal frame, continuous blue-to-yellow-to-red color, sharper stereo particles, a persistent reactive background, and short strength-scaled WebGL VHS peak effects.

**Architecture:** Keep the five existing Canvas 2D visualizers and the current Web Audio graph. A root-owned mutable analysis bus samples every analyser once per shared `requestAnimationFrame`, publishes reusable buffers and normalized metrics to subscribers without React render churn, and resets on track changes. Native WebGL provides a transparent progressive-enhancement layer for procedural peak artifacts while CSS variables provide bounded physical responses and preserve critical UI above the effect layer.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript 5, Web Audio API, Canvas 2D, native WebGL, CSS custom properties, Vitest 4.1, React Testing Library, pnpm 11.16.

## Global Constraints

- Preserve audio upload, MP3 playback, WAV playback, track switching, playback controls, the five-module rack, responsive layout, existing animation, and existing VHS styling.
- Keep low, mid, and high analysis ranges approximately `20–250 Hz`, `250 Hz–4 kHz`, and `4–20 kHz`.
- Keep public rendering values normalized to `0.0–1.0`; clamp values before using them as colors, opacity, scale, or shader uniforms.
- Use continuous `Blue → Yellow → Orange → Red` interpolation; do not introduce hard visual color switches.
- Target `60 FPS` on modern desktop systems; use mutable refs, reusable typed arrays, Canvas, WebGL, and one shared animation clock instead of React state per frame.
- Use peak cooldowns within the specification's `50–250 ms` range and keep glitch durations within `30–150 ms` and shake durations within `40–120 ms`.
- Keep whole-interface shake at or below `6 px`; ordinary strong peaks use local visualizer effects and reserve global response for extreme peaks.
- Keep the peak noise overlay at or below `0.15` opacity and the background visualizer at or below approximately `0.35` during a temporary extreme peak.
- Mobile reduces visual complexity only; it must use the same audio analysis.
- `prefers-reduced-motion` disables shake and aggressive glitch movement while preserving color-based signal information.
- Do not add a WebGL framework or another runtime dependency.
- Read the applicable local Next.js 16 guide in `node_modules/next/dist/docs/` before changing a Next.js convention; the relevant client-boundary and Vitest guides were identified during design discovery.

---

## File Structure

### Audio foundation

- `src/types/audio.ts`: public signal, frame, quality, and bus interfaces.
- `src/lib/audio/analysis.ts`: band aggregation, smoothing, hysteresis, stereo metrics, transient detection, cooldown, decay, and reset state.
- `src/lib/audio/analysis.test.ts`: deterministic quiet, band-isolation, sustained-loud, transient, cooldown, state, decay, and reset tests.
- `src/hooks/useAudioAnalysis.ts`: reusable analyser buffers, root animation clock, frame publication, visibility handling, and track reset.
- `src/hooks/useAudioAnalysis.test.tsx`: one-read-per-frame, stable bus, subscriber, reset, hidden-tab, and cleanup contracts.
- `src/hooks/useVisualizationFrame.ts`: subscriber lifecycle hook used by every renderer.
- `src/hooks/useVisualizationFrame.test.tsx`: callback replacement, active-state, and unsubscribe tests.

### Shared visual language

- `src/lib/visualization/signalTheme.ts`: continuous palette, band bias, brightness, saturation, glow, and CSS serialization.
- `src/lib/visualization/signalTheme.test.ts`: endpoint, continuity, bounds, frequency-bias, and readability tests.
- `src/hooks/useReactiveStyles.ts`: root CSS projections from the shared frame.
- `src/hooks/useReactiveStyles.test.tsx`: bounded variables, signal color, effect cleanup, and no-render-churn tests.

### Existing visualizers

- `src/components/visualizers/VisualizerRack.tsx`: pass one `AudioVisualizationBus` to all modules.
- `src/components/visualizers/VisualizerRack.test.tsx`: preserve five modules and verify shared-bus subscription wiring.
- `src/components/visualizers/Spectrum.tsx`: use shared frequency data and local per-bar color/peak response.
- `src/components/visualizers/Spectrogram.tsx`: use shared frequency history with continuous color and age fade.
- `src/components/visualizers/Oscilloscope.tsx`: use shared time-domain data with local amplitude styling and transient fragmentation.
- `src/components/visualizers/Waveform.tsx`: use shared left/right data and local historical color.
- `src/components/visualizers/Stereometer.tsx`: use shared stereo buffers, quality, bands, and peak response.
- `src/lib/visualization/stereometer.ts`: adaptive particle storage, stereo targets, cohorts, motion, trail, size, and opacity policies.
- `src/lib/visualization/stereometer.test.ts`: density, stereo, cohort, motion, size, trail, and bounds tests.

### Background and peak effects

- `src/lib/visualization/background.ts`: pure background opacity, trace, deformation, and cadence policy.
- `src/lib/visualization/background.test.ts`: idle/high/extreme, mobile, and reduced-motion bounds.
- `src/components/ui/AudioReactiveBackground.tsx`: shared-frame subscriber and persistent Canvas trace.
- `src/components/ui/AudioReactiveBackground.test.tsx`: single Canvas, shared-clock, quality, and fallback tests.
- `src/lib/effects/peakEffects.ts`: deterministic recipe selection, durations, shake, particle/noise/glitch limits, and reduced-motion policy.
- `src/lib/effects/peakEffects.test.ts`: no-audio, determinism, escalation, cooldown-facing recipe, and accessibility tests.
- `src/lib/webgl/vhsSignalRenderer.ts`: shader source, program setup, blend/resize/render lifecycle, context-loss-safe disposal.
- `src/lib/webgl/vhsSignalRenderer.test.ts`: unsupported context, compile failure, uniform bounds, resize, and disposal tests.
- `src/components/effects/PeakEffectsLayer.tsx`: subscribe to peak events, apply CSS variables, drive WebGL, and clean up.
- `src/components/effects/PeakEffectsLayer.test.tsx`: transparent Canvas, deterministic peak handling, reduced motion, fallback, and cleanup.

### Integration and verification

- `src/components/VhsVisualizerApp.tsx`: create the bus with the current track reset key and mount layers in the approved order.
- `src/components/VhsVisualizerApp.test.tsx`: layer order, stable fallback, and reset-key integration.
- `src/app/globals.css`: layer ordering, signal variables, local/global shake, peak glow, mobile quality, and reduced-motion rules.
- `src/app/globals.test.ts`: bounded CSS contracts and layer/readability assertions.
- `docs/superpowers/reports/2026-08-16-audio-reactive-webgl-verification.md`: final automated and live-check evidence.

---

### Task 1: Shared Signal Analysis and Peak State

**Files:**
- Modify: `src/types/audio.ts`
- Modify: `src/lib/audio/analysis.ts`
- Modify: `src/lib/audio/analysis.test.ts`
- Modify: `src/hooks/useReactiveStyles.test.tsx`

**Interfaces:**
- Produces: `SignalState`, `AudioReactiveSnapshot`, `AudioAnalysisState`, `AnalysisInput`, `createAudioAnalysisState()`, `classifySignalState()`, `analyseFrequencyData(input)`, and `decayAudioAnalysis(state, nowMs)`.
- Consumers in later tasks receive public energy fields named `lowEnergy`, `midEnergy`, `highEnergy`, `overallEnergy`, `bassEnergy`, `transientEnergy`, `peakStrength`, and `smoothedEnergy`.

- [ ] **Step 1: Replace the legacy analysis tests with failing public-contract tests**

Add typed test helpers and cases with these assertions:

```ts
const silence = new Uint8Array(BIN_COUNT);
const loud = new Uint8Array(BIN_COUNT).fill(255);

function frameFor(
  bins: Uint8Array,
  nowMs: number,
  state = createAudioAnalysisState(),
): AnalysisInput {
  return { bins, sampleRate: SAMPLE_RATE, fftSize: FFT_SIZE, nowMs, state };
}

function stateWith(
  values: Partial<AudioReactiveSnapshot>,
): AudioAnalysisState {
  const state = createAudioAnalysisState();
  return { ...state, snapshot: { ...state.snapshot, ...values } };
}

it("isolates the required low, mid, and high ranges", () => {
  const low = analyseFrequencyData(frameFor(binsForRange(30, 220), 16));
  const mid = analyseFrequencyData(frameFor(binsForRange(300, 3_500), 16));
  const high = analyseFrequencyData(frameFor(binsForRange(5_000, 18_000), 16));
  expect(low.snapshot.lowEnergy).toBeGreaterThan(low.snapshot.midEnergy);
  expect(mid.snapshot.midEnergy).toBeGreaterThan(mid.snapshot.highEnergy);
  expect(high.snapshot.highEnergy).toBeGreaterThan(high.snapshot.lowEnergy);
});

it("distinguishes a sudden peak from sustained loud audio", () => {
  const attacked = analyseFrequencyData(frameFor(loud, 100));
  const sustained = analyseFrequencyData({
    bins: loud,
    sampleRate: SAMPLE_RATE,
    fftSize: FFT_SIZE,
    nowMs: 220,
    state: attacked,
  });
  expect(attacked.snapshot.transientEnergy).toBeGreaterThan(
    sustained.snapshot.transientEnergy,
  );
  expect(attacked.snapshot.peakEventId).toBe(1);
  expect(sustained.snapshot.peakEventId).toBe(1);
});

it("uses hysteresis when leaving HIGH", () => {
  const state = stateWith({ overallEnergy: 0.71, signalState: "HIGH" });
  expect(classifySignalState(0.66, "HIGH")).toBe("HIGH");
  expect(classifySignalState(0.63, "HIGH")).toBe("MEDIUM");
  expect(decayAudioAnalysis(state, 400).snapshot.peakStrength).toBe(0);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails on missing contracts**

Run: `pnpm exec vitest run src/lib/audio/analysis.test.ts`

Expected: FAIL because the required state factory, expanded fields, and transient/cooldown behavior do not exist.

- [ ] **Step 3: Define the public signal types**

Replace the scalar snapshot shape in `src/types/audio.ts` with:

```ts
export type SignalState = "IDLE" | "LOW" | "MEDIUM" | "HIGH" | "EXTREME";

export type AudioReactiveSnapshot = {
  lowEnergy: number;
  midEnergy: number;
  highEnergy: number;
  overallEnergy: number;
  bassEnergy: number;
  transientEnergy: number;
  peakStrength: number;
  smoothedEnergy: number;
  stereoBalance: number;
  stereoWidth: number;
  signalState: SignalState;
  peakEventId: number;
  peakSeed: number;
  volume: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  treble: number;
  peak: number;
  smoothed: number;
};

export type AudioAnalysisState = {
  snapshot: AudioReactiveSnapshot;
  previousRawEnergy: number;
  slowEnvelope: number;
  lastPeakAt: number;
};

export type AnalysisInput = {
  bins: Uint8Array;
  sampleRate: number;
  fftSize: number;
  nowMs: number;
  state: AudioAnalysisState;
};
```

- [ ] **Step 4: Implement exact analysis policies in pure functions**

Use these constants and calculations in `src/lib/audio/analysis.ts`:

```ts
const LOW_BAND = [20, 250] as const;
const MID_BAND = [250, 4_000] as const;
const HIGH_BAND = [4_000, 20_000] as const;
const PEAK_COOLDOWN_MS = 140;
const PEAK_ENERGY_THRESHOLD = 0.68;
const TRANSIENT_THRESHOLD = 0.075;

export function classifySignalState(
  energy: number,
  previous: SignalState,
): SignalState {
  const value = clamp01(energy);
  if (previous === "EXTREME" && value >= 0.80) return "EXTREME";
  if (previous === "HIGH" && value >= 0.64) return "HIGH";
  if (previous === "MEDIUM" && value >= 0.31) return "MEDIUM";
  if (value >= 0.85) return "EXTREME";
  if (value >= 0.70) return "HIGH";
  if (value >= 0.35) return "MEDIUM";
  if (value >= 0.10) return "LOW";
  return "IDLE";
}
```

Calculate raw band RMS values, use attack `0.32` and release `0.075` for band/overall values, use attack `0.18` and release `0.045` for `smoothedEnergy`, update `slowEnvelope` with `0.04`, and calculate:

```ts
const rawLow = clamp01(rms(bins, sampleRate, fftSize, LOW_BAND) * 1.6);
const rawMid = clamp01(rms(bins, sampleRate, fftSize, MID_BAND) * 1.6);
const rawHigh = clamp01(rms(bins, sampleRate, fftSize, HIGH_BAND) * 1.6);
const weighted = rawLow * 0.4 + rawMid * 0.35 + rawHigh * 0.25;
const rawOverall = clamp01(Math.max(
  weighted,
  rawLow * 0.72,
  rawMid * 0.68,
  rawHigh * 0.62,
));
const rise = Math.max(0, rawOverall - state.previousRawEnergy);
const envelopeDelta = Math.max(0, rawOverall - state.slowEnvelope);
const transientEnergy = clamp01(rise * 2.4 + envelopeDelta * 1.2);
const eligible =
  nowMs - state.lastPeakAt >= PEAK_COOLDOWN_MS &&
  rawOverall >= PEAK_ENERGY_THRESHOLD &&
  transientEnergy >= TRANSIENT_THRESHOLD;
const peakStrength = eligible
  ? clamp01(rawOverall * 0.55 + transientEnergy * 0.45)
  : smooth(state.snapshot.peakStrength, 0, 1, 0.22);
```

Increment `peakEventId` and derive `peakSeed` only when `eligible` is true. Keep all public numeric energy fields clamped; keep `stereoBalance` in `-1..1` and `stereoWidth` in `0..1`.

During Tasks 1–5, populate the eight legacy fields as compatibility aliases (`volume = overallEnergy`, `bass = bassEnergy`, `lowMid = midEnergy`, `mid = midEnergy`, `highMid = highEnergy`, `treble = highEnergy`, `peak = peakStrength`, and `smoothed = smoothedEnergy`) so the application remains compilable before the background migration. Remove these aliases in Task 6 after the last consumer is converted.

Change the typed fixture in `useReactiveStyles.test.tsx` to start from `{ ...IDLE_AUDIO_SNAPSHOT }` and override its tested legacy values. This keeps the existing suite type-correct while the CSS projection hook migrates in Task 3.

- [ ] **Step 5: Run analysis tests and type checking through Vitest**

Run: `pnpm exec vitest run src/lib/audio/analysis.test.ts`

Expected: PASS for silence, band isolation, normalized output, attack/release, transient-versus-sustained behavior, cooldown, hysteresis, decay, and reset.

- [ ] **Step 6: Commit the analysis foundation**

```bash
git add src/types/audio.ts src/lib/audio/analysis.ts src/lib/audio/analysis.test.ts src/hooks/useReactiveStyles.test.tsx
git commit -m "feat: add shared signal and peak analysis"
```

---

### Task 2: Continuous Signal Theme

**Files:**
- Create: `src/lib/visualization/signalTheme.ts`
- Create: `src/lib/visualization/signalTheme.test.ts`
- Modify: `src/lib/visualization/canvas.ts`
- Modify: `src/lib/visualization/canvas.test.ts`

**Interfaces:**
- Consumes: normalized band values from `AudioReactiveSnapshot`.
- Produces: `SignalRgb`, `SignalTheme`, `createSignalTheme(snapshot)`, `signalColor(theme, alpha)`, and local `signalColorForLevel(level, alpha)` compatibility used by all Canvas renderers and WebGL uniforms.

- [ ] **Step 1: Write failing palette and band-influence tests**

```ts
function snapshot(
  values: Partial<AudioReactiveSnapshot>,
): AudioReactiveSnapshot {
  return { ...createAudioAnalysisState().snapshot, ...values };
}

function parse(color: string): [number, number, number, number] {
  const channels = color.match(/[\d.]+/g)?.map(Number);
  if (!channels || channels.length !== 4) throw new Error(color);
  return channels as [number, number, number, number];
}

function channelDistance(
  left: readonly number[],
  right: readonly number[],
): number {
  return Math.max(...left.slice(0, 3).map((value, index) => Math.abs(value - right[index])));
}

it("travels continuously from blue through yellow and orange to red", () => {
  expect(signalColorForLevel(0)).toBe("rgba(53, 69, 82, 1)");
  expect(signalColorForLevel(0.65)).toBe("rgba(230, 215, 163, 1)");
  expect(signalColorForLevel(1)).toBe("rgba(211, 79, 67, 1)");
  for (let sample = 1; sample <= 1_000; sample += 1) {
    const previous = parse(signalColorForLevel((sample - 1) / 1_000));
    const current = parse(signalColorForLevel(sample / 1_000));
    expect(channelDistance(previous, current)).toBeLessThan(3);
  }
});

it("keeps frequency bias bounded by overall intensity", () => {
  const bass = createSignalTheme(snapshot({ overallEnergy: 0.6, lowEnergy: 1 }));
  const highs = createSignalTheme(snapshot({ overallEnergy: 0.6, highEnergy: 1 }));
  expect(bass.rgb[2]).toBeGreaterThan(highs.rgb[2]);
  expect(highs.rgb[0]).toBeGreaterThan(bass.rgb[0]);
  expect(Math.abs(bass.brightness - highs.brightness)).toBeLessThanOrEqual(0.08);
});
```

- [ ] **Step 2: Verify the new theme tests fail**

Run: `pnpm exec vitest run src/lib/visualization/signalTheme.test.ts src/lib/visualization/canvas.test.ts`

Expected: FAIL because `signalTheme.ts` and its continuous shared contracts do not exist.

- [ ] **Step 3: Implement the shared palette and bounded frequency bias**

Use four ordered palette stops:

```ts
const STOPS = [
  { at: 0, rgb: [53, 69, 82] },
  { at: 0.65, rgb: [230, 215, 163] },
  { at: 0.82, rgb: [228, 166, 90] },
  { at: 1, rgb: [211, 79, 67] },
] as const;

export type SignalTheme = {
  rgb: readonly [number, number, number];
  brightness: number;
  saturation: number;
  glow: number;
};
```

Interpolate with clamped smoothstep inside the containing segment. Apply at most `±12` RGB channel points of band bias, then clamp channels to `0..255`. Set brightness to `0.42 + overallEnergy * 0.58`, saturation to `0.48 + overallEnergy * 0.52`, and glow to `overallEnergy ** 1.35`.

- [ ] **Step 4: Route legacy Canvas color helpers through the new theme**

Keep existing exports used outside the update, but implement `smoothSignalColor()` and `energySignalColor()` by calling `signalColorForLevel()`. Remove the binary `signalColor()` threshold behavior and make it continuous as well. Replace the old tests that require every RGB channel and raw red luminance to increase monotonically; the new contract tests continuous hue travel plus separately increasing `brightness` and `glow`, because a correct red endpoint can have lower raw luminance than yellow.

- [ ] **Step 5: Run the focused visual-language tests**

Run: `pnpm exec vitest run src/lib/visualization/signalTheme.test.ts src/lib/visualization/canvas.test.ts`

Expected: PASS with continuous clamped colors, increasing controlled glow, and bounded frequency influence.

- [ ] **Step 6: Commit the visual language**

```bash
git add src/lib/visualization/signalTheme.ts src/lib/visualization/signalTheme.test.ts src/lib/visualization/canvas.ts src/lib/visualization/canvas.test.ts
git commit -m "feat: add unified signal color theme"
```

---

### Task 3: Shared Analysis Frame Bus and Root Wiring

**Files:**
- Modify: `src/types/audio.ts`
- Modify: `src/hooks/useAudioAnalysis.ts`
- Modify: `src/hooks/useAudioAnalysis.test.tsx`
- Create: `src/hooks/useVisualizationFrame.ts`
- Create: `src/hooks/useVisualizationFrame.test.tsx`
- Modify: `src/hooks/useReactiveStyles.ts`
- Modify: `src/hooks/useReactiveStyles.test.tsx`
- Modify: `src/components/VhsVisualizerApp.tsx`
- Modify: `src/components/VhsVisualizerApp.test.tsx`

**Interfaces:**
- Consumes: `AudioAnalyserBundle`, analysis functions, and signal-theme functions.
- Produces: `VisualQuality`, `AudioVisualizationFrame`, `AudioVisualizationBus`, `useAudioAnalysis(analysersRef, options)`, and `useVisualizationFrame(bus, draw, active)`.

- [ ] **Step 1: Write failing shared-bus tests**

Extend `useAudioAnalysis.test.tsx` with a bundle whose four analyser methods are spies and assert:

```ts
it("samples every analyser once and publishes one shared frame", () => {
  const { analysersRef, frequency, oscilloscope, left, right } = spiedBundle();
  const listener = vi.fn();
  const { result } = renderHook(() =>
    useAudioAnalysis(analysersRef, { active: true, resetKey: "track-a" }),
  );
  const unsubscribe = result.current.subscribe(listener);
  act(() => runNextFrame(16));
  expect(frequency.getByteFrequencyData).toHaveBeenCalledTimes(1);
  expect(oscilloscope.getFloatTimeDomainData).toHaveBeenCalledTimes(1);
  expect(left.getFloatTimeDomainData).toHaveBeenCalledTimes(1);
  expect(right.getFloatTimeDomainData).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(result.current.frameRef.current, 16);
  unsubscribe();
});

it("clears buffers and peak state when resetKey changes", () => {
  const { analysersRef } = spiedBundle();
  const { result, rerender } = renderHook(
    ({ resetKey }) => useAudioAnalysis(analysersRef, { active: true, resetKey }),
    { initialProps: { resetKey: "track-a" } },
  );
  act(() => runNextFrame(16));
  rerender({ resetKey: "track-b" });
  expect(result.current.frameRef.current.snapshot.peakEventId).toBe(0);
  expect(result.current.frameRef.current.frequencyData.every((value) => value === 0)).toBe(true);
});

it("subscribes once, uses the latest callback, and unsubscribes", () => {
  const subscribe = vi.fn(() => vi.fn());
  const bus = fakeBus({ subscribe });
  const first = vi.fn();
  const second = vi.fn();
  const { rerender, unmount } = renderHook(
    ({ draw }) => useVisualizationFrame(bus, draw, true),
    { initialProps: { draw: first } },
  );
  rerender({ draw: second });
  expect(subscribe).toHaveBeenCalledTimes(1);
  unmount();
  expect(vi.mocked(subscribe).mock.results[0].value).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run bus and integration tests to verify failure**

Run: `pnpm exec vitest run src/hooks/useAudioAnalysis.test.tsx src/hooks/useVisualizationFrame.test.tsx src/components/VhsVisualizerApp.test.tsx src/components/visualizers/VisualizerRack.test.tsx`

Expected: FAIL because the bus, raw shared buffers, subscription hook, and reset-key API are absent.

- [ ] **Step 3: Add exact frame and bus types**

```ts
export type VisualQuality = "LOW" | "MEDIUM" | "HIGH";

export type AudioVisualizationFrame = {
  snapshot: AudioReactiveSnapshot;
  frequencyData: Uint8Array<ArrayBuffer>;
  oscilloscopeData: Float32Array<ArrayBuffer>;
  leftChannelData: Float32Array<ArrayBuffer>;
  rightChannelData: Float32Array<ArrayBuffer>;
  sampleRate: number;
  frequencyFftSize: number;
  frameId: number;
  sourceRevision: number;
  quality: VisualQuality;
  reducedMotion: boolean;
};

export type AudioVisualizationListener = (
  frame: AudioVisualizationFrame,
  time: number,
) => void;

export type AudioVisualizationBus = {
  frameRef: MutableRefObject<AudioVisualizationFrame>;
  snapshotRef: MutableRefObject<AudioReactiveSnapshot>;
  subscribe: (listener: AudioVisualizationListener) => () => void;
};
```

- [ ] **Step 4: Implement one root sampling and subscription loop**

In `useAudioAnalysis`, keep a `Set<AudioVisualizationListener>` in a ref, reuse typed arrays sized from the analyser nodes, sample all four nodes before analysis, and invoke a snapshot of the subscriber set in insertion order. Use this call shape:

```ts
export function useAudioAnalysis(
  analysersRef: MutableRefObject<AudioAnalyserBundle | null>,
  options: { active: boolean; resetKey: string | null },
): AudioVisualizationBus;
```

Detect `LOW` quality with `matchMedia("(max-width: 760px)")`, `MEDIUM` with `matchMedia("(min-width: 761px) and (max-width: 1100px)")`, and `HIGH` otherwise; detect reduced motion with `matchMedia("(prefers-reduced-motion: reduce)")`. Run one visible-tab RAF continuously because the background has a deterministic idle state. When inactive, fill shared buffers with zero, call `decayAudioAnalysis`, and never increment `peakEventId`.

Increment `sourceRevision` exactly once whenever `resetKey` changes, reset `frameId` to zero, clear every shared typed array, and publish the new revision before sampling the replacement track. Renderers use this revision—not timing heuristics—to clear history and temporary geometry.

- [ ] **Step 5: Add the renderer subscription hook**

```ts
export function useVisualizationFrame(
  bus: AudioVisualizationBus,
  draw: AudioVisualizationListener,
  active = true,
): void {
  const drawRef = useRef(draw);
  useEffect(() => { drawRef.current = draw; }, [draw]);
  useEffect(
    () => active ? bus.subscribe((frame, time) => drawRef.current(frame, time)) : undefined,
    [active, bus],
  );
}
```

Test that rerendering replaces the callback without double subscription, inactive renderers do not subscribe, and unmount calls the bus unsubscribe function.

- [ ] **Step 6: Project the new shared theme into CSS variables**

Update `useReactiveStyles` to consume `bus.frameRef`, project `--signal-strength`, `--signal-color`, `--signal-glow`, `--peak-strength`, `--background-reactivity`, `--audio-low`, `--audio-mid`, and `--audio-high`, and retain compatibility variables needed by existing CSS during migration. The hook must subscribe through the bus instead of starting another RAF.

- [ ] **Step 7: Wire the reset key and bus through the root**

Use:

```tsx
const analysis = useAudioAnalysis(engine.analysersRef, {
  active: signalActive,
  resetKey: engine.currentTrack?.id ?? null,
});
useReactiveStyles(stationRef, analysis, signalActive);

<AudioReactiveBackground reactiveRef={analysis.snapshotRef} active={signalActive} />
<VisualizerRack analysersRef={engine.analysersRef} active={signalActive} />
```

Keep `snapshotRef.current` synchronized with `frameRef.current.snapshot` for the background's temporary compatibility API. The rack retains its existing analyser prop until Task 4 so this stage compiles and runs independently; the four primary renderers migrate in Task 4 and the final Stereometer analyser read disappears in Task 5.

- [ ] **Step 8: Run shared-frame and root integration tests**

Run: `pnpm exec vitest run src/hooks/useAudioAnalysis.test.tsx src/hooks/useVisualizationFrame.test.tsx src/hooks/useReactiveStyles.test.tsx src/components/VhsVisualizerApp.test.tsx`

Expected: PASS with the bus's single sampling pass, stable bus identity, no React render loop, correct reset, and all five modules preserved through the compatibility path.

- [ ] **Step 9: Commit the shared frame bus**

```bash
git add src/types/audio.ts src/hooks/useAudioAnalysis.ts src/hooks/useAudioAnalysis.test.tsx src/hooks/useVisualizationFrame.ts src/hooks/useVisualizationFrame.test.tsx src/hooks/useReactiveStyles.ts src/hooks/useReactiveStyles.test.tsx src/components/VhsVisualizerApp.tsx src/components/VhsVisualizerApp.test.tsx
git commit -m "refactor: share one audio visualization frame"
```

---

### Task 4: Spectrum, Spectrogram, Oscilloscope, and Waveform Migration

**Files:**
- Modify: `src/components/visualizers/Spectrum.tsx`
- Modify: `src/components/visualizers/Spectrogram.tsx`
- Modify: `src/components/visualizers/Oscilloscope.tsx`
- Modify: `src/components/visualizers/Waveform.tsx`
- Modify: `src/components/visualizers/VisualizerRack.tsx`
- Modify: `src/components/visualizers/VisualizerRack.test.tsx`
- Modify: `src/components/VhsVisualizerApp.tsx`
- Modify: `src/components/VhsVisualizerApp.test.tsx`
- Modify: `src/lib/visualization/signalTheme.ts`
- Modify: `src/lib/visualization/signalTheme.test.ts`
- Modify: `src/lib/visualization/waveform.ts`
- Modify: `src/lib/visualization/waveform.test.ts`

**Interfaces:**
- Consumes: `AudioVisualizationBus`, shared typed arrays, `createSignalTheme()`, `signalColorForLevel()`, and `useVisualizationFrame()`.
- Produces: four Canvas renderers that never call an `AnalyserNode` directly and interpret shared signal values independently.

- [ ] **Step 1: Add failing local-response and shared-data tests**

Add tests that publish a synthetic frame through a fake bus and assert Canvas calls use blue, yellow, and red colors in the same frame for low, medium, and high local values. Add a contract in `VisualizerRack.test.tsx` that renders all modules with a fake bus and confirms a published frame reaches the four migrated renderers; Stereometer remains on the compatibility analyser prop until Task 5. Add waveform tests:

```ts
it("weights local geometry more than global energy", () => {
  expect(localSignalLevel(0, 0.5)).toBeCloseTo(0.09);
  expect(localSignalLevel(0.5, 0.5)).toBeCloseTo(0.5);
  expect(localSignalLevel(1, 0.5)).toBeCloseTo(0.91);
});

it("subscribes the four migrated renderers to one bus", () => {
  const analysis = fakeBus();
  render(
    <VisualizerRack
      analysis={analysis}
      analysersRef={createRef<AudioAnalyserBundle | null>()}
      active
    />,
  );
  expect(analysis.subscribe).toHaveBeenCalledTimes(4);
});

it("preserves local energy for per-column color", () => {
  const column = measureWaveformColumn(new Float32Array([-0.2, 0.8, 0.1]));
  expect(column.localEnergy).toBeCloseTo(0.8);
});

it("clears history on a track frame reset", () => {
  const history = createWaveformHistory(4);
  history.localEnergy.fill(0.8);
  clearWaveformHistory(history);
  expect(history.localEnergy).toEqual(new Float32Array(4));
});
```

- [ ] **Step 2: Verify focused visualizer tests fail**

Run: `pnpm exec vitest run src/components/visualizers/VisualizerRack.test.tsx src/lib/visualization/waveform.test.ts`

Expected: FAIL because renderers still read analysers directly and waveform history lacks local-energy/reset contracts.

- [ ] **Step 3: Migrate Spectrum and Spectrogram to the shared frequency array**

Remove analyser-owned buffers and calls to `getByteFrequencyData`. Spectrum reads `frame.frequencyData`, `frame.sampleRate`, and `frame.frequencyFftSize`, reuses one `Float32Array(BAR_COUNT)` rather than allocating it per frame, and computes each color level as:

```ts
const colorLevel = clamp01(localLevel * 0.82 + frame.snapshot.overallEnergy * 0.18);
```

Export this calculation as `localSignalLevel(localLevel, overallEnergy)` from `signalTheme.ts` so Spectrum, Oscilloscope, Waveform, and their tests share the exact weighting.

Spectrogram copies from the shared frequency array into history once per published frame, colors each cell with `signalColorForLevel(energy, Math.max(0.08, energy * age))`, and clears history when `frame.sourceRevision` changes.

- [ ] **Step 4: Migrate Oscilloscope to shared time-domain data**

Use `frame.oscilloscopeData`. Compute local amplitude per segment rather than one global stroke color. Set width to `1 + localAmplitude * 1.8`, glow to at most `6`, and on a new peak event above `0.72` split the path for at most three published frames using a deterministic horizontal offset no larger than `4 * peakStrength` pixels.

- [ ] **Step 5: Extend and migrate Waveform history**

Add `localEnergy: Float32Array` to `WaveformHistory`, write `Math.max(Math.abs(negative), positive)` in `pushWaveformColumn`, and export `createWaveformHistory(length)` and `clearWaveformHistory(history)`. Use shared left/right arrays, retain mid/side conversion, clear both histories when `sourceRevision` changes, and draw history in short contiguous segments so each segment uses its stored local energy color. Preserve both channel labels and history geometry.

Update `VisualizerRack` to accept both `analysis: AudioVisualizationBus` and the existing `analysersRef`. Pass `analysis` to the four migrated modules and pass `analysersRef` only to Stereometer during this independently compiling transition.

Change the root call to `<VisualizerRack analysis={analysis} analysersRef={engine.analysersRef} active={signalActive} />` and retain the existing module order.

- [ ] **Step 6: Run the four-visualizer focused suite**

Run: `pnpm exec vitest run src/components/visualizers/VisualizerRack.test.tsx src/lib/visualization/waveform.test.ts src/lib/visualization/canvas.test.ts src/lib/visualization/signalTheme.test.ts`

Expected: PASS and none of the four migrated components call `getByteFrequencyData` or `getFloatTimeDomainData`.

- [ ] **Step 7: Run a static analyser-read audit**

Run: `rg -n "get(ByteFrequency|FloatTimeDomain)Data" src/components/visualizers/Spectrum.tsx src/components/visualizers/Spectrogram.tsx src/components/visualizers/Oscilloscope.tsx src/components/visualizers/Waveform.tsx`

Expected: no matches.

- [ ] **Step 8: Commit the shared-data visualizers**

```bash
git add src/components/visualizers/Spectrum.tsx src/components/visualizers/Spectrogram.tsx src/components/visualizers/Oscilloscope.tsx src/components/visualizers/Waveform.tsx src/components/visualizers/VisualizerRack.tsx src/components/visualizers/VisualizerRack.test.tsx src/components/VhsVisualizerApp.tsx src/components/VhsVisualizerApp.test.tsx src/lib/visualization/signalTheme.ts src/lib/visualization/signalTheme.test.ts src/lib/visualization/waveform.ts src/lib/visualization/waveform.test.ts
git commit -m "feat: unify visualizer signal response"
```

---

### Task 5: Sharp Adaptive Stereometer

**Files:**
- Modify: `src/lib/visualization/stereometer.ts`
- Modify: `src/lib/visualization/stereometer.test.ts`
- Modify: `src/components/visualizers/Stereometer.tsx`
- Modify: `src/components/visualizers/VisualizerRack.tsx`
- Modify: `src/components/visualizers/VisualizerRack.test.tsx`
- Modify: `src/components/VhsVisualizerApp.tsx`
- Modify: `src/components/VhsVisualizerApp.test.tsx`
- Delete: `src/hooks/useAnimationFrame.ts`

**Interfaces:**
- Consumes: shared left/right buffers, `lowEnergy`, `midEnergy`, `highEnergy`, `peakStrength`, `VisualQuality`, and `useVisualizationFrame()`.
- Produces: `particleCountForQuality()`, `createStereoField()`, `updateStereoTargets()`, `particleSize()`, `particleOpacity()`, and a quality-scaled sharp Canvas renderer.

- [ ] **Step 1: Write failing density, cohort, and stereo-response tests**

```ts
it("scales density without changing analysis", () => {
  expect(particleCountForQuality("LOW")).toBe(640);
  expect(particleCountForQuality("MEDIUM")).toBe(1_280);
  expect(particleCountForQuality("HIGH")).toBe(2_400);
});

it("assigns deterministic low, mid, and high cohorts", () => {
  const field = createStereoField("LOW");
  expect(readCohort(field, 0)).toBe(0);
  expect(readCohort(field, 1)).toBe(1);
  expect(readCohort(field, 2)).toBe(2);
  expect(readCohort(field, 3)).toBe(0);
});

it("keeps mono centered and wide stereo spread outward", () => {
  const mono = stereoMetrics(new Float32Array([0.5]), new Float32Array([0.5]));
  const wide = stereoMetrics(new Float32Array([0.5]), new Float32Array([-0.5]));
  expect(Math.abs(mono.balance)).toBeLessThan(0.01);
  expect(wide.width).toBeGreaterThan(mono.width);
});
```

- [ ] **Step 2: Run stereometer tests and confirm failure**

Run: `pnpm exec vitest run src/lib/visualization/stereometer.test.ts`

Expected: FAIL because density profiles, cohorts, and the expanded target mapping do not exist.

- [ ] **Step 3: Implement adaptive particle storage and policies**

Use counts `640`, `1_280`, and `2_400`. Expand the stride to store current X/Y, target X/Y, intensity, cohort, and deterministic phase. Assign `cohort = particleIndex % 3`. Low cohorts use motion response `14`, mid `24`, and high `38`. Clamp particle size to `0.8..3.6` CSS-equivalent pixels and opacity to `0.10..0.92`.

Update targets from actual left/right samples. Apply a cohort displacement multiplier of:

```ts
const cohortEnergy = [lowEnergy, midEnergy, highEnergy][cohort];
const travel = 0.72 + cohortEnergy * 0.28;
const targetX = clamp((leftSample - rightSample) * travel, -1, 1);
const targetY = clamp((leftSample + rightSample) * travel, -1, 1);
```

- [ ] **Step 4: Migrate the component and sharpen the draw policy**

Subscribe through the bus, recreate the field when quality or `sourceRevision` changes, use a translucent clear alpha between `0.32` and `0.52` for short trails, keep `shadowBlur` at `0` for ordinary particles, and allow a maximum blur of `2` only when `peakStrength > 0.8`. Scale temporary expansion by at most `1 + peakStrength * 0.35`.

Remove the final `analysersRef` prop from Stereometer and `VisualizerRack`, pass only `analysis` to all five modules, and change the rack test to require five shared-bus subscriptions.

Change the root call to `<VisualizerRack analysis={analysis} active={signalActive} />`; `engine.analysersRef` must now appear only in the single `useAudioAnalysis` call.

Delete the now-unused per-component `useAnimationFrame` hook and verify `rg -n "useAnimationFrame" src` returns no matches.

- [ ] **Step 5: Run stereometer and rack tests**

Run: `pnpm exec vitest run src/lib/visualization/stereometer.test.ts src/components/visualizers/VisualizerRack.test.tsx`

Expected: PASS with deterministic adaptive counts, genuine stereo geometry, smaller sharp particles, and bounded trails.

- [ ] **Step 6: Commit the stereometer refinement**

```bash
git add src/lib/visualization/stereometer.ts src/lib/visualization/stereometer.test.ts src/components/visualizers/Stereometer.tsx src/components/visualizers/VisualizerRack.tsx src/components/visualizers/VisualizerRack.test.tsx src/components/VhsVisualizerApp.tsx src/components/VhsVisualizerApp.test.tsx src/hooks/useAnimationFrame.ts
git commit -m "feat: sharpen adaptive stereometer field"
```

---

### Task 6: Persistent Shared-Frame Background Visualizer

**Files:**
- Create: `src/lib/visualization/background.ts`
- Create: `src/lib/visualization/background.test.ts`
- Modify: `src/components/ui/AudioReactiveBackground.tsx`
- Modify: `src/components/ui/AudioReactiveBackground.test.tsx`
- Modify: `src/types/audio.ts`
- Modify: `src/lib/audio/analysis.ts`
- Modify: `src/lib/audio/analysis.test.ts`
- Modify: `src/hooks/useAudioAnalysis.ts`
- Modify: `src/hooks/useAudioAnalysis.test.tsx`
- Modify: `src/components/VhsVisualizerApp.tsx`

**Interfaces:**
- Consumes: `AudioVisualizationBus`, shared theme, quality, reduced-motion flag, and reusable frequency data.
- Produces: `backgroundPolicy(frame)` and a persistent Canvas renderer driven by the shared clock.

- [ ] **Step 1: Write failing bounded-background policy tests**

```ts
it("keeps idle and extreme opacity inside readability bounds", () => {
  expect(backgroundPolicy(frame({ overallEnergy: 0 })).opacity).toBeGreaterThanOrEqual(0.03);
  expect(backgroundPolicy(frame({ overallEnergy: 0 })).opacity).toBeLessThanOrEqual(0.08);
  expect(backgroundPolicy(frame({ overallEnergy: 1, peakStrength: 1 })).opacity).toBeLessThanOrEqual(0.35);
});

it("suppresses rapid movement for reduced motion", () => {
  const policy = backgroundPolicy(frame({ reducedMotion: true, overallEnergy: 1 }));
  expect(policy.shake).toBe(0);
  expect(policy.traceSpeed).toBeLessThanOrEqual(0.08);
  expect(policy.frameInterval).toBeGreaterThanOrEqual(100);
});
```

- [ ] **Step 2: Verify background tests fail**

Run: `pnpm exec vitest run src/lib/visualization/background.test.ts src/components/ui/AudioReactiveBackground.test.tsx`

Expected: FAIL because the pure policy and shared-bus component API are absent.

- [ ] **Step 3: Implement the pure background policy**

Return opacity, trace amplitude, trace speed, deformation, band count, grain count, frame interval, and shake. Use these bounds:

```ts
const opacity = clamp(0.04 + overallEnergy * 0.22 + peakStrength * 0.07, 0.03, 0.35);
const frameInterval = reducedMotion ? 120 : quality === "LOW" ? 1000 / 30 : 1000 / 60;
const bandCount = quality === "HIGH" ? 5 : quality === "MEDIUM" ? 4 : 3;
const deformation = reducedMotion ? 0 : midEnergy * 0.018 + peakStrength * 0.012;
```

- [ ] **Step 4: Replace the component-owned RAF with the shared subscription**

Change the prop to `analysis: AudioVisualizationBus`. Keep `ResizeObserver` and media-driven Canvas sizing, but remove analyser reads and the component's own `requestAnimationFrame` loop. Draw thin horizontal frequency traces, soft band glows, controlled grain, and scanlines from the published frame. Reuse point buffers and skip draws that arrive before `frameInterval`.

Replace the compatibility call in `VhsVisualizerApp` with `<AudioReactiveBackground analysis={analysis} active={signalActive} />`; after this change no component consumes `analysis.snapshotRef`, so remove `snapshotRef` from `AudioVisualizationBus` and its hook implementation in the same stage. Remove the eight legacy scalar aliases from `AudioReactiveSnapshot` and `analysis.ts`, then update any remaining tests to use the required energy names.

- [ ] **Step 5: Preserve idle persistence and fallbacks**

The component remains mounted above the base background regardless of playback. With no 2D context it renders one inert `aria-hidden` Canvas without throwing. On resize it preserves the current quality resolution cap. Reduced motion draws at the slow policy cadence and never uses shake.

- [ ] **Step 6: Run background and root tests**

Run: `pnpm exec vitest run src/lib/visualization/background.test.ts src/components/ui/AudioReactiveBackground.test.tsx src/components/VhsVisualizerApp.test.tsx`

Expected: PASS with one Canvas, no private RAF, persistent idle rendering, bounded opacity, mobile cadence, and graceful context failure.

- [ ] **Step 7: Commit the background visualizer**

```bash
git add src/lib/visualization/background.ts src/lib/visualization/background.test.ts src/components/ui/AudioReactiveBackground.tsx src/components/ui/AudioReactiveBackground.test.tsx src/types/audio.ts src/lib/audio/analysis.ts src/lib/audio/analysis.test.ts src/hooks/useAudioAnalysis.ts src/hooks/useAudioAnalysis.test.tsx src/components/VhsVisualizerApp.tsx
git commit -m "feat: deepen shared reactive background"
```

---

### Task 7: Deterministic Peak Coordinator and WebGL VHS Layer

**Files:**
- Create: `src/lib/effects/peakEffects.ts`
- Create: `src/lib/effects/peakEffects.test.ts`
- Create: `src/lib/webgl/vhsSignalRenderer.ts`
- Create: `src/lib/webgl/vhsSignalRenderer.test.ts`
- Create: `src/components/effects/PeakEffectsLayer.tsx`
- Create: `src/components/effects/PeakEffectsLayer.test.tsx`
- Modify: `src/components/VhsVisualizerApp.tsx`
- Modify: `src/components/VhsVisualizerApp.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`

**Interfaces:**
- Consumes: confirmed `peakEventId`, `peakSeed`, `peakStrength`, frequency energies, quality, reduced motion, and the shared clock.
- Produces: `PeakEffectRecipe`, `createPeakEffectRecipe(snapshot, quality, reducedMotion)`, `createVhsSignalRenderer(canvas)`, and `PeakEffectsLayer`.

- [ ] **Step 1: Write failing deterministic-recipe tests**

```ts
it("never emits an effect without a confirmed audio peak", () => {
  expect(createPeakEffectRecipe(snapshot({ peakEventId: 0, peakStrength: 0 }), "HIGH", false)).toBeNull();
});

it("is deterministic and scales within specified limits", () => {
  const input = snapshot({ peakEventId: 7, peakSeed: 8128, peakStrength: 1, highEnergy: 0.9 });
  const first = createPeakEffectRecipe(input, "HIGH", false);
  const second = createPeakEffectRecipe(input, "HIGH", false);
  expect(first).toEqual(second);
  expect(first!.durationMs).toBeGreaterThanOrEqual(30);
  expect(first!.durationMs).toBeLessThanOrEqual(150);
  expect(Math.abs(first!.shakeX)).toBeLessThanOrEqual(6);
  expect(first!.noiseOpacity).toBeLessThanOrEqual(0.15);
});

it("preserves color but removes aggressive motion for reduced motion", () => {
  const recipe = createPeakEffectRecipe(snapshot({ peakEventId: 1, peakStrength: 1 }), "HIGH", true)!;
  expect(recipe.shakeX).toBe(0);
  expect(recipe.shakeY).toBe(0);
  expect(recipe.sliceOffset).toBe(0);
  expect(recipe.flash).toBeLessThanOrEqual(0.08);
});
```

- [ ] **Step 2: Run peak and WebGL tests to verify failure**

Run: `pnpm exec vitest run src/lib/effects/peakEffects.test.ts src/lib/webgl/vhsSignalRenderer.test.ts src/components/effects/PeakEffectsLayer.test.tsx`

Expected: FAIL because the recipe, renderer, and effect component do not exist.

- [ ] **Step 3: Implement deterministic effect recipes**

Use a seeded xorshift generator initialized from `peakSeed || peakEventId`. Recipes contain `durationMs`, `shakeDurationMs`, `shakeX`, `shakeY`, `sliceOffset`, `rgbOffset`, `noiseOpacity`, `flash`, `crackleDensity`, `burstCount`, and `variant`. Apply exact caps of `150 ms`, `120 ms`, `6 px`, `6 px`, `0.15`, and `50` particles. Moderate peaks below `0.72` can only create glow or a burst; strong peaks above `0.72` can create local shake or one glitch band; extreme peaks above `0.88` can combine effects.

- [ ] **Step 4: Implement the native WebGL renderer lifecycle**

Export:

```ts
export type VhsSignalRenderer = {
  resize: (width: number, height: number, devicePixelRatio: number) => void;
  render: (timeMs: number, recipe: PeakEffectRecipe | null, progress: number) => void;
  dispose: () => void;
};

export function createVhsSignalRenderer(
  canvas: HTMLCanvasElement,
): VhsSignalRenderer | null;
```

Use `canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true })`, compile one full-screen triangle/quad vertex shader and a fragment shader with uniforms for resolution, time, seed, strength, RGB offset, slice offset, noise, flash, and crackle. Enable alpha blending with `SRC_ALPHA` and `ONE_MINUS_SRC_ALPHA`. Cap device pixel ratio at `2` on high quality and `1.25` on low quality. On any context or shader failure, delete allocated resources and return `null`.

- [ ] **Step 5: Build the coordinating React effect layer**

`PeakEffectsLayer` accepts `analysis: AudioVisualizationBus` and `targetRef: RefObject<HTMLElement | null>`. It creates the renderer once, observes size, subscribes to frames, clears the active recipe when `sourceRevision` changes, starts a recipe only when `peakEventId` changes within the current revision, computes normalized progress from the shared timestamp, and clears CSS variables when the recipe expires. Write only these bounded variables:

```text
--peak-shake-x
--peak-shake-y
--peak-scale
--peak-rgb-offset
--peak-flash
--peak-noise
```

Dispose GPU resources, observers, subscriptions, timers, and inline variables on unmount. Continue applying reduced CSS glow when WebGL is unavailable.

- [ ] **Step 6: Mount the layer and add readable stacking CSS**

Insert `<PeakEffectsLayer analysis={analysis} targetRef={stationRef} />` after `AudioReactiveBackground` and before `VhsNoise`. Add `.peak-effects-layer` as fixed, pointer-events-none, transparent, and below controls. Apply local transforms to `.visualizer-rack` and background; do not transform player controls, upload controls, library controls, or critical text. Under reduced motion, force shake, scale, and displacement variables to zero and lower the shader layer opacity.

- [ ] **Step 7: Run peak, WebGL, CSS, and app tests**

Run: `pnpm exec vitest run src/lib/effects/peakEffects.test.ts src/lib/webgl/vhsSignalRenderer.test.ts src/components/effects/PeakEffectsLayer.test.tsx src/components/VhsVisualizerApp.test.tsx src/app/globals.test.ts`

Expected: PASS for determinism, limits, no-audio behavior, context failure, disposal, correct layer order, pointer safety, and reduced motion.

- [ ] **Step 8: Commit the WebGL peak layer**

```bash
git add src/lib/effects/peakEffects.ts src/lib/effects/peakEffects.test.ts src/lib/webgl/vhsSignalRenderer.ts src/lib/webgl/vhsSignalRenderer.test.ts src/components/effects/PeakEffectsLayer.tsx src/components/effects/PeakEffectsLayer.test.tsx src/components/VhsVisualizerApp.tsx src/components/VhsVisualizerApp.test.tsx src/app/globals.css src/app/globals.test.ts
git commit -m "feat: add WebGL VHS peak effects"
```

---

### Task 8: Resilience, Performance, and Completion Verification

**Files:**
- Modify: `src/hooks/useAudioAnalysis.test.tsx`
- Modify: `src/components/effects/PeakEffectsLayer.test.tsx`
- Modify: `src/components/ui/AudioReactiveBackground.test.tsx`
- Modify: `src/app/globals.test.ts`
- Create: `docs/superpowers/reports/2026-08-16-audio-reactive-webgl-verification.md`

**Interfaces:**
- Consumes: all completed public contracts.
- Produces: regression coverage and an evidence report containing commands, results, browser sizes, fallback checks, and any explicitly unperformed manual checks.

- [ ] **Step 1: Add failing lifecycle and performance-regression tests**

Add assertions that a hidden tab cancels the sole root RAF, visibility resume schedules exactly one RAF, unmount unsubscribes every renderer, track reset clears temporary peak CSS/WebGL state, WebGL context loss is non-fatal, low quality caps device-pixel-ratio work, and reduced motion cannot write nonzero shake variables.

- [ ] **Step 2: Run the lifecycle subset and fix only discovered update regressions**

Run: `pnpm exec vitest run src/hooks/useAudioAnalysis.test.tsx src/components/effects/PeakEffectsLayer.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts`

Expected: PASS after lifecycle fixes; no additional RAF remains in visualizer or effect components.

- [ ] **Step 3: Audit animation and allocation hot paths**

Run:

```powershell
rg -n "requestAnimationFrame|get(ByteFrequency|FloatTimeDomain)Data|new (Float32Array|Uint8Array)" src/hooks src/components src/lib
```

Expected findings:

- `requestAnimationFrame` exists only in the root analysis clock and unrelated smooth-cursor code;
- analyser read methods exist only in `useAudioAnalysis.ts` and tests;
- typed-array allocations occur during initialization, resize, reset, or quality change, not inside the normal published-frame draw loops.

- [ ] **Step 4: Run the complete automated suite**

Run: `pnpm test`

Expected: all Vitest files pass with no unhandled rejection or React act warning introduced by this update.

- [ ] **Step 5: Run lint**

Run: `pnpm lint`

Expected: exit code `0` with no update-caused ESLint errors.

- [ ] **Step 6: Run the production build**

Run: `pnpm build`

Expected: Next.js 16.3 production build exits `0`; `/` renders successfully and no browser-only API leaks into the server build.

- [ ] **Step 7: Perform representative browser checks**

Start `pnpm dev` and inspect at `375×812`, `768×1024`, `1440×900`, and `2560×1440`. At each size verify no horizontal overflow, five readable visualizers, usable controls, persistent subtle background, peak layer below controls, and no console errors. Repeat one desktop check with reduced motion and one mobile check with WebGL unavailable or deliberately disabled.

- [ ] **Step 8: Validate deterministic audio profiles**

Use synthetic analyser fixtures for quiet, normal, bass-heavy, high-frequency-heavy, sustained loud, sharp transient, and clipped inputs. If representative local audio is available, manually confirm quiet audio stays mostly blue, normal music travels blue/yellow with red peaks, bass-heavy audio feels broad and physical, high-heavy audio remains sharp without continuous flicker, and clipped/transient audio triggers short controlled VHS effects.

- [ ] **Step 9: Write the evidence report**

Record exact command outcomes, test counts, lint/build results, inspected viewport sizes, WebGL/reduced-motion fallback results, the hot-path audit, and any browser or audio check that could not be performed in `docs/superpowers/reports/2026-08-16-audio-reactive-webgl-verification.md`. Do not claim an unperformed check.

- [ ] **Step 10: Commit verification coverage and report**

```bash
git add src/hooks/useAudioAnalysis.test.tsx src/components/effects/PeakEffectsLayer.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts docs/superpowers/reports/2026-08-16-audio-reactive-webgl-verification.md
git commit -m "test: verify audio-reactive WebGL update"
```

---

## Final Acceptance Checklist

- [ ] One shared analyser sampling pass and one shared animation clock drive all audio-reactive renderers.
- [ ] All five visualizers use continuous blue-to-yellow-to-orange-to-red color from shared signal values.
- [ ] The stereometer is visibly sharper, denser, frequency-aware, genuinely stereo-reactive, and quality-scaled.
- [ ] The background remains persistent, secondary, readable, mobile-aware, and reduced-motion-safe.
- [ ] Confirmed transients—not sustained loudness or random idle behavior—create peak events.
- [ ] WebGL adds short VHS scanline, crackle, noise, RGB, and flash artifacts with bounded CSS movement.
- [ ] Track switching, pause, end, hidden-tab, WebGL loss, and no-audio states clear stale effects safely.
- [ ] Playback, upload, MP3/WAV support, queue controls, responsive layout, and existing style are preserved.
- [ ] Full Vitest, ESLint, and Next.js production build pass.
- [ ] Browser and audio checks are documented accurately.
