# VHS Visualizer First Major Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the existing VHS Signal Station landing page so it is responsive from 320px through 4K, clearer to operate, smoothly audio-reactive, and performant without changing its established identity or features.

**Architecture:** Keep the existing Node.js, Next.js 16, React 19, and Web Audio application. Implement responsive behavior in the existing global stylesheet, derive smoothed normalized audio values in one ref-driven analysis layer, project bounded values to CSS custom properties without per-frame React state, and draw the ambient background with one adaptive Canvas.

**Tech Stack:** Node.js, pnpm, Next.js 16.3.0 App Router, React 19.2.8, TypeScript, Tailwind CSS 4/PostCSS, Web Audio API, Canvas 2D, Vitest 4, React Testing Library, ESLint 9.

## Global Constraints

- Follow `UPDATE_SPEC.md` section 31 in its exact order; do not begin a later major stage until the preceding stage is implemented and verified.
- Keep Node.js and the current Next.js/React application as the project foundation.
- Preserve the current palette, typography, VHS/analog style, hierarchy, local-file privacy, keyboard commands, visualizers, and existing functionality.
- Do not add dependencies, another runtime, a backend, generic particles, rainbow/RGB effects, aggressive motion, or unrelated features.
- Use refs, `requestAnimationFrame`, direct Canvas drawing, and bounded CSS custom properties for frame-level animation; never drive the React tree with per-frame state.
- Respect `prefers-reduced-motion`; keep all core controls and playback behavior unchanged when animation is reduced or unavailable.
- Keep interactive targets at least 44 CSS pixels in both dimensions where the element is a discrete tap target.
- Test 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560, and 3840px widths, including relevant portrait and landscape orientations.
- Before editing Next.js application code, follow the repository `AGENTS.md` and consult the relevant local Next.js 16 guides under `node_modules/next/dist/docs/`.

## File Responsibility Map

- `src/app/globals.css`: fluid tokens, device layouts, interaction states, reactive CSS mappings, and reduced-motion fallbacks.
- `src/app/globals.test.ts`: static contracts for required breakpoints, fluid sizing, 44px targets, and reduced-motion selectors.
- `src/types/audio.ts`: public `AudioReactiveSnapshot` and mutable ref types.
- `src/lib/audio/analysis.ts`: frequency-band measurement, normalization, attack/release smoothing, peak detection, and immutable default values.
- `src/lib/audio/analysis.test.ts`: deterministic unit tests for all analysis math.
- `src/hooks/useAudioAnalysis.ts`: the single animation loop that samples analyser data into a stable ref.
- `src/hooks/useAudioAnalysis.test.tsx`: lifecycle, visibility, stable-ref, and no-analyser tests.
- `src/hooks/useReactiveStyles.ts`: maps analysis values to bounded root CSS variables without React state.
- `src/hooks/useReactiveStyles.test.tsx`: CSS-variable mapping and cleanup tests.
- `src/lib/visualization/canvas.ts`: continuous analog palette interpolation shared by Spectrum and Oscilloscope.
- `src/lib/visualization/canvas.test.ts`: deterministic interpolation and clamping tests.
- `src/components/visualizers/Spectrum.tsx`: smooth audio-intensity-driven spectrum colors.
- `src/components/visualizers/Oscilloscope.tsx`: smooth audio-intensity-driven scope colors.
- `src/components/visualizers/VisualizerFrame.tsx`: semantic active/reactive frame attributes.
- `src/components/visualizers/VisualizerRack.tsx`: passes shared reactive values to all five frames.
- `src/components/audio/AudioPlayer.tsx`: semantic playback attributes for restrained player reactions.
- `src/components/audio/TrackLibrary.tsx`: distinct selected and currently-playing track attributes.
- `src/components/VhsVisualizerApp.tsx`: composes the analysis hook, reactive style hook, background, rack, player, and library.
- `src/components/ui/AudioReactiveBackground.tsx`: one full-viewport adaptive Canvas renderer.
- `src/components/ui/AudioReactiveBackground.test.tsx`: Canvas fallback, active/idle mode, resize, and reduced-motion tests.
- Existing component tests: preserve behavior and add semantic-state assertions without mocking implementation details.

---

### Task 1: Global Responsive Foundation

**Specification order covered:** 1–3 (inspect structure and behavior already completed during design; fix global responsive layout).

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`

**Interfaces:**
- Consumes: existing class names from `VhsVisualizerApp`, `Panel`, visualizer, audio, and track components.
- Produces: CSS tokens `--station-gutter`, `--section-gap`, `--panel-gap`, `--control-target`, and a fluid `.station-shell` with no page-level horizontal overflow.

- [ ] **Step 1: Add a failing responsive-contract test**

Append a test that reads the whole stylesheet and verifies the exact foundation tokens and overflow protection:

```ts
describe("responsive station foundation", () => {
  it("uses fluid spacing, bounded width, and a 44px control target", () => {
    expect(globalsCss).toContain("--station-gutter: clamp(");
    expect(globalsCss).toContain("--control-target: 44px");
    expect(globalsCss).toMatch(/\.station-shell\s*\{[^}]*width:\s*min\(100%/s);
    expect(globalsCss).toMatch(/body\s*\{[^}]*overflow-x:\s*clip/s);
  });
});
```

- [ ] **Step 2: Run the test and confirm the expected failure**

Run: `pnpm test src/app/globals.test.ts`

Expected: FAIL because the new fluid tokens and `overflow-x: clip` rule do not exist.

- [ ] **Step 3: Introduce the fluid foundation**

In `:root`, define:

```css
--station-gutter: clamp(10px, 1.6vw, 28px);
--section-gap: clamp(38px, 5vw, 78px);
--panel-gap: clamp(6px, .8vw, 12px);
--control-target: 44px;
--station-max: 1800px;
```

Update the global and shell rules to use intrinsic width and bounded padding:

```css
html { min-width: 0; background: var(--void); }
body { min-width: 0; overflow-x: clip; }
.station-shell {
  position: relative;
  z-index: 1;
  width: min(100%, calc(var(--station-max) + var(--station-gutter) * 2));
  min-width: 0;
  margin-inline: auto;
  padding: var(--station-gutter);
}
.visualizer-section,
.player-section,
.library-section { margin-top: var(--section-gap); }
```

Replace page-structure gaps and paddings that currently scale only in pixels with the new variables or bounded `clamp()` values. Keep decorative one-pixel rules and hardware details fixed where their physical appearance depends on a pixel border.

- [ ] **Step 4: Verify the responsive foundation**

Run: `pnpm test src/app/globals.test.ts`

Expected: PASS.

Run: `pnpm test`

Expected: all existing tests PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add src/app/globals.css src/app/globals.test.ts
git commit -m "feat: add fluid station layout foundation"
```

### Task 2: Responsive Visualizer Rack

**Specification order covered:** 4 (adapt visualizers).

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`
- Modify: `src/components/visualizers/VisualizerRack.test.tsx`

**Interfaces:**
- Consumes: the five existing `.module--*` classes and `.crt-screen` structure.
- Produces: one-column phone, two-column tablet, current desktop 6-column rack, and bounded large-screen canvas sizing.

- [ ] **Step 1: Write the failing visualizer-layout contracts**

Add assertions for the three intentional rack modes and intrinsic canvas geometry:

```ts
it("defines phone, tablet, and desktop visualizer arrangements", () => {
  expect(globalsCss).toMatch(/@media \(max-width: 760px\)[\s\S]*\.visualizer-rack\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
  expect(globalsCss).toMatch(/@media \(min-width: 761px\) and \(max-width: 1100px\)[\s\S]*\.visualizer-rack\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  expect(globalsCss).toMatch(/@media \(min-width: 1101px\)[\s\S]*\.visualizer-rack\s*\{[^}]*repeat\(6, minmax\(0, 1fr\)\)/);
  expect(globalsCss).toMatch(/\.crt-screen\s*\{[^}]*aspect-ratio:/s);
});
```

Keep the rack component test asserting that all five instruments remain in the DOM with no signal.

- [ ] **Step 2: Confirm the layout test fails**

Run: `pnpm test src/app/globals.test.ts src/components/visualizers/VisualizerRack.test.tsx`

Expected: the CSS contract FAILS because the tablet range and aspect-ratio rules are absent.

- [ ] **Step 3: Implement the three rack modes**

Use a base single-column grid, then layer tablet and desktop media queries:

```css
.visualizer-rack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--panel-gap);
  min-width: 0;
}
.equipment-panel { min-width: 0; }
.crt-screen { aspect-ratio: 16 / 10; min-height: clamp(220px, 60vw, 300px); }

@media (min-width: 761px) and (max-width: 1100px) {
  .visualizer-rack { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .module--spectrogram,
  .module--waveform,
  .module--stereometer,
  .module--oscilloscope { grid-column: span 1; }
  .module--spectrum { grid-column: 1 / -1; }
  .crt-screen { min-height: clamp(230px, 31vw, 340px); }
}

@media (min-width: 1101px) {
  .visualizer-rack { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .module--spectrogram,
  .module--waveform { grid-column: span 3; }
  .module--stereometer,
  .module--oscilloscope,
  .module--spectrum { grid-column: span 2; }
  .crt-screen { min-height: clamp(240px, 22vw, 360px); }
  .module--spectrogram .crt-screen,
  .module--waveform .crt-screen { aspect-ratio: 16 / 11; }
}
```

Remove conflicting earlier breakpoint overrides rather than leaving duplicate selectors.

- [ ] **Step 4: Verify visualizer layout contracts**

Run: `pnpm test src/app/globals.test.ts src/components/visualizers/VisualizerRack.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/app/globals.css src/app/globals.test.ts src/components/visualizers/VisualizerRack.test.tsx
git commit -m "feat: adapt visualizer rack across devices"
```

### Task 3: Responsive Player and Track Library

**Specification order covered:** 5–6 (adapt player, then uploaded track list).

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`
- Modify: `src/components/audio/AudioControls.test.tsx`

**Interfaces:**
- Consumes: `.player-grid`, `.tape-bay`, `.queue-display`, `.transport-controls`, `.seek-module`, `.volume-module`, `.tape-loader`, and `.track-row`.
- Produces: stable 12-column desktop, 8-column tablet, and one-column phone layouts with 44px discrete controls and truncation-safe track rows.

- [ ] **Step 1: Write failing player and track responsive tests**

Add CSS contracts plus DOM assertions that the accessible controls remain present:

```ts
it("keeps player controls tappable and track rows shrink-safe", () => {
  expect(globalsCss).toMatch(/\.mute-button\s*\{[^}]*min-height:\s*var\(--control-target\)/s);
  expect(globalsCss).toMatch(/\.track-row\s*\{[^}]*min-height:\s*var\(--control-target\)/s);
  expect(globalsCss).toMatch(/@media \(min-width: 761px\) and \(max-width: 1100px\)[\s\S]*\.player-grid\s*\{[^}]*repeat\(8, minmax\(0, 1fr\)\)/);
});
```

In `AudioControls.test.tsx`, keep the current accessibility test and add:

```ts
expect(screen.getByRole("button", { name: "Mute output" })).toBeVisible();
expect(screen.getByRole("slider", { name: "Playback position" })).toBeVisible();
expect(screen.getByRole("slider", { name: "Output level" })).toBeVisible();
```

- [ ] **Step 2: Confirm the new contracts fail**

Run: `pnpm test src/app/globals.test.ts src/components/audio/AudioControls.test.tsx`

Expected: CSS assertions FAIL because the mute target is currently 34px and the tablet player remains a 12-column desktop grid.

- [ ] **Step 3: Implement responsive player and library CSS**

Use one-column base placement, a tablet 8-column grid, and the current 12-column desktop pattern:

```css
.player-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--panel-gap); }
.tape-bay,
.queue-display,
.transport-controls,
.seek-module,
.volume-module { grid-column: 1 / -1; min-width: 0; }
.hardware-button,
.mute-button,
.tape-loader button,
.track-row { min-height: var(--control-target); }
.track-row { grid-template-columns: auto minmax(0, 1fr) auto; }
.track-copy { min-width: 0; }

@media (min-width: 761px) and (max-width: 1100px) {
  .player-grid { grid-template-columns: repeat(8, minmax(0, 1fr)); }
  .tape-bay { grid-column: 1 / -1; }
  .queue-display { grid-column: span 3; }
  .transport-controls { grid-column: span 5; }
  .seek-module { grid-column: span 5; }
  .volume-module { grid-column: span 3; }
  .track-row { grid-template-columns: 44px 72px minmax(0, 1fr) auto auto; }
}

@media (min-width: 1101px) {
  .player-grid { grid-template-columns: repeat(12, minmax(0, 1fr)); }
  .tape-bay { grid-column: span 8; }
  .queue-display { grid-column: span 4; }
  .transport-controls { grid-column: span 4; }
  .seek-module { grid-column: span 5; }
  .volume-module { grid-column: span 3; }
  .track-row { grid-template-columns: 48px 84px minmax(0, 1fr) auto auto; }
}
```

At phone widths, hide the cassette illustration and secondary state column only; keep track name and duration visible. Make uploader copy wrap without forcing overflow.

- [ ] **Step 4: Verify player and library behavior**

Run: `pnpm test src/app/globals.test.ts src/components/audio/AudioControls.test.tsx`

Expected: PASS.

Run: `pnpm test`

Expected: all tests PASS.

- [ ] **Step 5: Commit Task 3**

```bash
git add src/app/globals.css src/app/globals.test.ts src/components/audio/AudioControls.test.tsx
git commit -m "feat: make player and track library responsive"
```

### Task 4: Device-Specific Responsive Verification

**Specification order covered:** 7–11 (smartphone, tablet, desktop, ultrawide/4K/TV optimization, then responsive testing).

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`
- Create: `docs/superpowers/reports/2026-08-12-responsive-baseline.md`

**Interfaces:**
- Consumes: Tasks 1–3 layouts.
- Produces: breakpoint refinements and a recorded width/orientation verification matrix before usability work begins.

- [ ] **Step 1: Add failing breakpoint-coverage assertions**

```ts
it("contains explicit small-phone, phone, tablet, desktop, and large-display policies", () => {
  for (const query of [
    "@media (max-width: 380px)",
    "@media (max-width: 760px)",
    "@media (min-width: 761px) and (max-width: 1100px)",
    "@media (min-width: 1101px)",
    "@media (min-width: 1920px)",
  ]) expect(globalsCss).toContain(query);
});
```

- [ ] **Step 2: Run the test and confirm missing policies**

Run: `pnpm test src/app/globals.test.ts`

Expected: FAIL until the 380px and 1920px policies exist.

- [ ] **Step 3: Optimize the smartphone layout**

Implement only targeted adaptations:

```css
@media (max-width: 380px) {
  .station-header { padding: 14px 12px; }
  .station-brand h1 { font-size: clamp(20px, 7vw, 24px); }
  .transport-controls { gap: 5px; }
  .hardware-button { padding-inline: 4px; }
  .panel-header { align-items: flex-start; }
  .panel-meta { max-width: 46%; }
}

```

Verify 320, 375, 390, and 430px portrait widths plus a 760×430 landscape viewport. Fix overflow, target size, wrapping, and visualizer height issues before continuing.

- [ ] **Step 4: Optimize the tablet layout**

Verify 768×1024 portrait, 1024×768 landscape, and a narrow 820px tablet layout. Refine only the 761–1100px grid. Use `@media (orientation: landscape) and (max-height: 600px) and (max-width: 1100px)` to reduce vertical section spacing without shrinking controls or visualizer readability. Require two useful visualizer columns and an 8-column player grid before continuing.

- [ ] **Step 5: Optimize the desktop layout**

Verify 1280 and 1440px widths. Preserve the dominant upper pair and three lower modules, eliminate excessive intermediate-height canvases, and confirm the 12-column player remains balanced. Do not add large-display overrides in this step.

- [ ] **Step 6: Optimize ultrawide, 4K, and TV layouts**

Add and verify the bounded large-display policy:

```css
@media (min-width: 1920px) {
  :root { --station-gutter: clamp(28px, 2vw, 48px); }
  .station-shell { --station-max: 1800px; }
  .station-brand h1 { font-size: clamp(38px, 2.4vw, 52px); }
  .crt-screen { max-height: 440px; }
}
```

Verify 1920, 2560, and 3840px widths. Confirm the station stays centered and capped, controls/text stop growing, and surrounding space is intentional.

- [ ] **Step 7: Run the automated responsive contracts**

Run: `pnpm test src/app/globals.test.ts`

Expected: PASS.

- [ ] **Step 8: Perform the required live width audit**

Start or reuse `pnpm dev`, then inspect 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560, and 3840px widths. For phone/tablet widths inspect portrait and landscape where relevant. Record for every viewport:

```markdown
| Viewport | Orientation | Page overflow | Rack mode | Min discrete target | Player accessible | Result |
|---|---|---:|---|---:|---|---|
| 320×568 | portrait | no | 1 column | ≥44px | yes | pass |
```

Use DOM measurements for `document.documentElement.scrollWidth <= innerWidth` and all visible discrete `button` rectangles. Save the complete matrix to `docs/superpowers/reports/2026-08-12-responsive-baseline.md`. If a row fails, fix the responsible CSS and repeat that viewport before proceeding.

- [ ] **Step 9: Commit Task 4**

```bash
git add src/app/globals.css src/app/globals.test.ts docs/superpowers/reports/2026-08-12-responsive-baseline.md
git commit -m "test: verify responsive station layouts"
```

### Task 5: Interface Clarity and Interaction States

**Specification order covered:** 12–14 (clarity, button states, track feedback).

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`
- Modify: `src/components/audio/TrackLibrary.tsx`
- Modify: `src/components/audio/AudioControls.test.tsx`

**Interfaces:**
- Consumes: `currentTrackIndex` and `isPlaying` already passed to `TrackLibrary`.
- Produces: `data-selected="true|false"`, `data-playing="true|false"`, `aria-current="true"` on the selected row, and complete focus/hover/pressed/disabled CSS states.

- [ ] **Step 1: Write failing control-clarity and button-state tests**

In `AudioControls.test.tsx`, assert that each transport action remains both visibly labeled and accessibly named, that the mute button exposes `aria-pressed`, and that both sliders retain their names. In `globals.test.ts` add:

```ts
it("defines analog focus, pressed, and disabled button states", () => {
  for (const selector of [":focus-visible", ":active:not(:disabled)", ":disabled"]) {
    expect(globalsCss).toContain(selector);
  }
});
```

- [ ] **Step 2: Confirm the clarity/state test fails for the unified state policy**

Run: `pnpm test src/components/audio/AudioControls.test.tsx src/app/globals.test.ts`

Expected: FAIL until all interactive families share the required state rules.

- [ ] **Step 3: Improve control readability without changing actions**

Keep the existing symbols and action names. Adjust only spacing, contrast, label wrapping, and the separation of symbol from text. Ensure `PLAY`/`PAUSE`, `PREVIOUS`, `NEXT`, `MUTE`, `LOAD AUDIO`, the two sliders, and track duration remain legible at 320px. Run the focused component test before continuing.

- [ ] **Step 4: Implement and verify complete button feedback**

Add consistent analog interaction feedback:

```css
:is(.hardware-button, .mute-button, .tape-loader button, .track-row, .system-message button) {
  transition: border-color 140ms ease, color 140ms ease, background-color 140ms ease,
    filter 140ms ease, box-shadow 140ms ease, transform 90ms ease;
}
:is(.hardware-button, .mute-button, .tape-loader button, .track-row, .system-message button):focus-visible {
  outline: 2px solid var(--phosphor);
  outline-offset: 3px;
  box-shadow: 0 0 0 1px #070808, 0 0 14px rgba(230, 215, 163, .2);
}
:is(.hardware-button, .mute-button, .tape-loader button):active:not(:disabled) {
  transform: translateY(2px) scale(.995);
}
```

Keep existing hover and disabled rules, but make their selectors cover all control families. Run `pnpm test src/components/audio/AudioControls.test.tsx src/app/globals.test.ts` and require PASS before beginning track feedback.

- [ ] **Step 5: Write the failing semantic track-state test**

In `AudioControls.test.tsx`:

```ts
const row = screen.getByRole("button", { name: /select the return/i });
expect(row).toHaveAttribute("data-selected", "true");
expect(row).toHaveAttribute("data-playing", "true");
expect(row).toHaveAttribute("aria-current", "true");
```

In `globals.test.ts`:

```ts
it("defines distinct selected and playing track states", () => {
  for (const selector of ['[data-selected="true"]', '[data-playing="true"]']) {
    expect(globalsCss).toContain(selector);
  }
});
```

- [ ] **Step 6: Confirm the playing-state assertion fails**

Run: `pnpm test src/components/audio/AudioControls.test.tsx src/app/globals.test.ts`

Expected: FAIL because track rows do not expose `data-playing`.

- [ ] **Step 7: Add distinct selected and playing semantics**

In `TrackLibrary.tsx`:

```tsx
const playing = selected && isPlaying;
// on the row button
data-selected={selected}
data-playing={playing}
aria-current={selected ? "true" : undefined}
```

Keep the displayed state copy as `PLAYING`, `SELECTED`, or `READY`.

Add the two structural track treatments:

```css
.track-row[data-selected="true"] {
  border-color: #715842;
  box-shadow: inset 3px 0 0 var(--amber);
}
.track-row[data-playing="true"] {
  border-color: color-mix(in srgb, var(--red) 58%, var(--amber));
  box-shadow: inset 3px 0 0 var(--red), 0 0 12px rgba(168, 77, 67, .12);
}
```

Use existing palette tokens only. Retain disabled cursor, reduced saturation, and readable labels.

- [ ] **Step 8: Verify clarity and state behavior**

Run: `pnpm test src/components/audio/AudioControls.test.tsx src/app/globals.test.ts`

Expected: PASS.

- [ ] **Step 9: Commit Task 5**

```bash
git add src/app/globals.css src/app/globals.test.ts src/components/audio/TrackLibrary.tsx src/components/audio/AudioControls.test.tsx
git commit -m "feat: clarify controls and track states"
```

### Task 6: Smooth Spectrum and Oscilloscope Colors

**Specification order covered:** 15–16 (Spectrum first, Oscilloscope second).

**Files:**
- Modify: `src/lib/visualization/canvas.ts`
- Modify: `src/lib/visualization/canvas.test.ts`
- Modify: `src/components/visualizers/Spectrum.tsx`
- Modify: `src/components/visualizers/Oscilloscope.tsx`

**Interfaces:**
- Produces: `smoothEnergy(previous: number, target: number, attack?: number, release?: number): number` and existing `smoothSignalColor(level, alpha): string` using the analog blue→amber→red palette.
- Consumes: analyser values already available inside each visualizer.

- [ ] **Step 1: Write the failing energy-smoothing tests**

```ts
import { smoothEnergy, smoothSignalColor } from "./canvas";

it("uses faster attack and slower release for visual energy", () => {
  expect(smoothEnergy(0, 1)).toBeCloseTo(0.18);
  expect(smoothEnergy(1, 0)).toBeCloseTo(0.94);
});

it("keeps adjacent palette samples continuous", () => {
  expect(smoothSignalColor(0.49)).not.toBe(smoothSignalColor(0.51));
  expect(smoothSignalColor(0.49)).toMatch(/^rgba\(/);
});
```

- [ ] **Step 2: Confirm the missing export fails**

Run: `pnpm test src/lib/visualization/canvas.test.ts`

Expected: FAIL because `smoothEnergy` does not exist.

- [ ] **Step 3: Implement the shared smoother**

```ts
export function smoothEnergy(
  previous: number,
  target: number,
  attack = 0.18,
  release = 0.06,
): number {
  const next = Math.min(Math.max(target, 0), 1);
  const amount = next > previous ? attack : release;
  return previous + (next - previous) * amount;
}
```

Keep `smoothSignalColor` continuous and clamped.

- [ ] **Step 4: Update Spectrum and verify before touching Oscilloscope**

In `Spectrum.tsx`, add `const colorEnergyRef = useRef(0);`, compute the mean of the visible bar levels each frame, and then:

```ts
colorEnergyRef.current = smoothEnergy(colorEnergyRef.current, meanEnergy);
const colorLevel = Math.min(1, level * 0.72 + colorEnergyRef.current * 0.28);
context.fillStyle = smoothSignalColor(colorLevel, 0.9);
```

Use `smoothSignalColor` for peak markers too.

Run: `pnpm test src/lib/visualization/canvas.test.ts src/components/visualizers/VisualizerRack.test.tsx`

Expected: PASS.

- [ ] **Step 5: Update Oscilloscope second**

In `Oscilloscope.tsx`, add `const colorEnergyRef = useRef(0);` and replace abrupt `signalColor` calls:

```ts
colorEnergyRef.current = smoothEnergy(colorEnergyRef.current, peak);
context.strokeStyle = smoothSignalColor(colorEnergyRef.current, 0.96);
context.shadowColor = smoothSignalColor(colorEnergyRef.current, 0.7);
```

- [ ] **Step 6: Verify both visualizers**

Run: `pnpm test src/lib/visualization/canvas.test.ts src/components/visualizers/VisualizerRack.test.tsx`

Expected: PASS.

Run: `pnpm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit Task 6**

```bash
git add src/lib/visualization/canvas.ts src/lib/visualization/canvas.test.ts src/components/visualizers/Spectrum.tsx src/components/visualizers/Oscilloscope.tsx
git commit -m "feat: smooth visualizer color transitions"
```

### Task 7: Centralized Normalized Audio Analysis

**Specification order covered:** 17–18 (create analysis system, then expose normalized values).

**Files:**
- Modify: `src/types/audio.ts`
- Create: `src/lib/audio/analysis.ts`
- Create: `src/lib/audio/analysis.test.ts`
- Create: `src/hooks/useAudioAnalysis.ts`
- Create: `src/hooks/useAudioAnalysis.test.tsx`

**Interfaces:**
- Produces:

```ts
export type AudioReactiveSnapshot = {
  volume: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  treble: number;
  peak: number;
  smoothed: number;
};

export const IDLE_AUDIO_SNAPSHOT: Readonly<AudioReactiveSnapshot>;
export function analyseFrequencyData(input: AnalysisInput): AudioReactiveSnapshot;
export function useAudioAnalysis(analysersRef: MutableRefObject<AudioAnalyserBundle | null>, active: boolean): MutableRefObject<AudioReactiveSnapshot>;
```

- Consumes: `AudioAnalyserBundle.frequency`, its `fftSize`, `frequencyBinCount`, and `context.sampleRate`.

- [ ] **Step 1: Write deterministic failing analysis tests**

Create `analysis.test.ts` covering silent input, band isolation, normalization, and attack/release:

```ts
it("returns zeroed normalized values for silence", () => {
  const bins = new Uint8Array(2048);
  expect(analyseFrequencyData({ bins, sampleRate: 48000, fftSize: 4096, previous: IDLE_AUDIO_SNAPSHOT }))
    .toEqual(IDLE_AUDIO_SNAPSHOT);
});

it("isolates bass energy and clamps every result to 0..1", () => {
  const bins = new Uint8Array(2048);
  bins.fill(255, 2, 22);
  const value = analyseFrequencyData({ bins, sampleRate: 48000, fftSize: 4096, previous: IDLE_AUDIO_SNAPSHOT });
  expect(value.bass).toBeGreaterThan(value.treble);
  for (const energy of Object.values(value)) expect(energy).toBeGreaterThanOrEqual(0);
  for (const energy of Object.values(value)) expect(energy).toBeLessThanOrEqual(1);
});
```

Use frequency ranges: bass 20–250Hz, low-mid 250–500Hz, mid 500–2000Hz, high-mid 2000–6000Hz, treble 6000–20000Hz.

- [ ] **Step 2: Confirm analysis tests fail**

Run: `pnpm test src/lib/audio/analysis.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement pure analysis math**

In `analysis.ts`, implement:

```ts
export type AnalysisInput = {
  bins: Uint8Array;
  sampleRate: number;
  fftSize: number;
  previous: Readonly<AudioReactiveSnapshot>;
};
```

For each band, convert Hz endpoints to clamped bin indexes, calculate RMS energy (`Math.sqrt(sumSquares / count) / 255`), calculate `volume` from all relevant bins, calculate a raw maximum, then apply attack `0.24` and release `0.07`. Define `peak` as the greater of the smoothed maximum and the positive rise from the previous overall value, clamped to 1. Define `smoothed` from overall volume with attack `0.16` and release `0.045`. Return exact zero values when all bins are zero and the previous snapshot is idle.

- [ ] **Step 4: Verify pure analysis**

Run: `pnpm test src/lib/audio/analysis.test.ts`

Expected: PASS.

- [ ] **Step 5: Write the failing hook lifecycle tests**

Create `useAudioAnalysis.test.tsx` with a fake analyser. Assert:

```ts
const { result, rerender } = renderHook(({ active }) => useAudioAnalysis(analysersRef, active), { initialProps: { active: true } });
const stableRef = result.current;
act(() => frameCallback!(16));
expect(result.current).toBe(stableRef);
expect(result.current.current.bass).toBeGreaterThan(0);
rerender({ active: false });
expect(cancelAnimationFrame).toHaveBeenCalled();
```

Also assert an absent analyser leaves `IDLE_AUDIO_SNAPSHOT` and does not throw.

- [ ] **Step 6: Confirm the hook tests fail**

Run: `pnpm test src/hooks/useAudioAnalysis.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 7: Implement the single analysis loop**

Use one `requestAnimationFrame` effect. Allocate the byte buffer only when `frequencyBinCount` changes. On each active visible frame, call `getByteFrequencyData`, write the pure analyser result to `snapshotRef.current`, and request the next frame. Listen to `visibilitychange`; stop sampling while hidden and resume when visible. On inactive playback, ease values toward idle for a short decay rather than snapping.

- [ ] **Step 8: Verify centralized analysis and existing engine**

Run: `pnpm test src/lib/audio/analysis.test.ts src/hooks/useAudioAnalysis.test.tsx src/hooks/useAudioEngine.test.tsx`

Expected: PASS.

- [ ] **Step 9: Commit Task 7**

```bash
git add src/types/audio.ts src/lib/audio/analysis.ts src/lib/audio/analysis.test.ts src/hooks/useAudioAnalysis.ts src/hooks/useAudioAnalysis.test.tsx
git commit -m "feat: add centralized audio analysis"
```

### Task 8: Root Audio-Reactive Style Controller

**Specification order covered:** 19–20 (major interface reaction, then buttons).

**Files:**
- Create: `src/hooks/useReactiveStyles.ts`
- Create: `src/hooks/useReactiveStyles.test.tsx`
- Modify: `src/components/VhsVisualizerApp.tsx`
- Modify: `src/components/VhsVisualizerApp.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `MutableRefObject<AudioReactiveSnapshot>` and `active: boolean`.
- Produces: root CSS variables `--audio-volume`, `--audio-bass`, `--audio-mid`, `--audio-treble`, `--audio-peak`, `--audio-smoothed`, and `data-audio-active`.

- [ ] **Step 1: Write failing CSS-variable controller tests**

```ts
it("writes bounded audio variables without React state", () => {
  const targetRef = { current: document.createElement("main") };
  const snapshotRef = { current: { volume: .4, bass: .8, lowMid: .3, mid: .5, highMid: .2, treble: .6, peak: .9, smoothed: .45 } };
  renderHook(() => useReactiveStyles(targetRef, snapshotRef, true));
  act(() => frameCallback!(16));
  expect(targetRef.current.style.getPropertyValue("--audio-bass")).toBe("0.800");
  expect(targetRef.current.dataset.audioActive).toBe("true");
});
```

Assert cleanup removes the data attribute and variables.

- [ ] **Step 2: Confirm the hook test fails**

Run: `pnpm test src/hooks/useReactiveStyles.test.tsx`

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement direct root-style projection**

The hook receives:

```ts
export function useReactiveStyles(
  targetRef: RefObject<HTMLElement | null>,
  snapshotRef: MutableRefObject<AudioReactiveSnapshot>,
  active: boolean,
): void
```

On animation frames, round each clamped value to three decimal places and update a CSS variable only if the formatted value changed. Set `data-audio-active` from playback state. Remove values on cleanup. Do not call a React state setter.

- [ ] **Step 4: Connect analysis and style projection at the app root**

In `VhsVisualizerApp.tsx`:

```tsx
const stationRef = useRef<HTMLElement>(null);
const reactiveRef = useAudioAnalysis(engine.analysersRef, signalActive);
useReactiveStyles(stationRef, reactiveRef, signalActive);

return <main ref={stationRef} className="station-shell">...</main>;
```

Pass `reactiveRef` to `VisualizerRack`; later tasks will pass it to other consumers.

- [ ] **Step 5: Add restrained major-button mappings**

```css
.station-shell {
  --audio-volume: 0;
  --audio-bass: 0;
  --audio-mid: 0;
  --audio-treble: 0;
  --audio-peak: 0;
  --audio-smoothed: 0;
}
.station-shell[data-audio-active="true"] :is(.hardware-button--primary, .tape-loader button) {
  border-color: color-mix(in srgb, var(--amber) calc(32% + var(--audio-bass) * 20%), #343737);
  box-shadow: 0 0 calc(4px + 8px * var(--audio-bass)) rgba(196, 154, 82, calc(.06 + .12 * var(--audio-smoothed)));
  transform: scale(calc(1 + var(--audio-peak) * .006));
}
```

Keep the maximum scale at 1.006 and avoid positional movement.

- [ ] **Step 6: Verify root integration**

Run: `pnpm test src/hooks/useReactiveStyles.test.tsx src/components/VhsVisualizerApp.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit Task 8**

```bash
git add src/hooks/useReactiveStyles.ts src/hooks/useReactiveStyles.test.tsx src/components/VhsVisualizerApp.tsx src/components/VhsVisualizerApp.test.tsx src/app/globals.css
git commit -m "feat: project audio energy into interface styles"
```

### Task 9: Player, Active Track, and Visualizer Frame Reactions

**Specification order covered:** 21–23 (player, active track, visualizer containers).

**Files:**
- Modify: `src/components/audio/AudioPlayer.tsx`
- Modify: `src/components/audio/AudioControls.test.tsx`
- Modify: `src/components/visualizers/VisualizerFrame.tsx`
- Modify: `src/components/visualizers/VisualizerRack.tsx`
- Modify: `src/components/visualizers/VisualizerRack.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: root CSS audio variables; `active` booleans already available.
- Produces: `data-playing` on `.player-panel` and `data-reactive` on visualizer panels.

- [ ] **Step 1: Write the failing player-reaction test**

In the player test, render a playing engine and assert:

```ts
expect(screen.getByRole("region", { name: "VHS AUDIO DECK" })).toHaveAttribute("data-playing", "true");
```

If the current section lacks a region role, give the `section` `aria-labelledby="player-title"` and query it through `container.querySelector(".player-section")`; assert its `data-playing` value.

Do not add track or visualizer-frame assertions yet.

- [ ] **Step 2: Confirm the player test fails**

Run: `pnpm test src/components/audio/AudioControls.test.tsx`

Expected: FAIL because the player reaction attribute does not exist.

- [ ] **Step 3: Implement and verify the player reaction**

Add `data-playing={engine.isPlaying}` to the player section boundary, then add only the player CSS:

```css
.player-section[data-playing="true"] .player-panel {
  box-shadow: 0 0 calc(10px + 16px * var(--audio-smoothed)) rgba(168, 77, 67, calc(.04 + .08 * var(--audio-volume)));
}
.player-section[data-playing="true"] .now-playing-display > strong {
  text-shadow: 0 0 calc(4px + 7px * var(--audio-mid)) rgba(230, 215, 163, calc(.1 + .12 * var(--audio-mid)));
}
```

Run: `pnpm test src/components/audio/AudioControls.test.tsx`

Expected: PASS before active-track work starts.

- [ ] **Step 4: Write, fail, and satisfy the active-track reaction test**

Extend the existing playing track test to assert `data-playing="true"` and add only the active-track reactive CSS:

```css
.track-row[data-playing="true"] {
  background-color: rgba(168, 77, 67, calc(.04 + .06 * var(--audio-smoothed)));
  box-shadow: inset 3px 0 0 var(--red), 0 0 calc(5px + 9px * var(--audio-bass)) rgba(168, 77, 67, .14);
  transform: scale(calc(1 + var(--audio-peak) * .003));
}
```

Run the test once before the CSS change to confirm it fails on the new styling contract, then run `pnpm test src/components/audio/AudioControls.test.tsx src/app/globals.test.ts` and require PASS.

- [ ] **Step 5: Write the failing visualizer-frame reaction test**

In `VisualizerRack.test.tsx`, assert every `.equipment-panel` rendered by an active rack has `data-reactive="true"`.

Run: `pnpm test src/components/visualizers/VisualizerRack.test.tsx`

Expected: FAIL because visualizer frames do not expose the attribute.

- [ ] **Step 6: Implement and verify visualizer-frame reactions**

Add optional `reactive?: boolean` to `VisualizerFrameProps` or reuse `active` to emit `data-reactive={active}` through `Panel`; if `Panel` does not forward data attributes, put it on a wrapper owned by `VisualizerFrame` and keep the existing DOM hierarchy intact. Add:

```css
.equipment-panel[data-reactive="true"] {
  border-color: color-mix(in srgb, var(--line), var(--amber) calc(var(--audio-smoothed) * 14%));
  box-shadow: 0 0 calc(3px + 8px * var(--audio-volume)) rgba(196, 154, 82, calc(.02 + .05 * var(--audio-volume)));
}
```

Do not apply the stronger track effect to non-playing rows.

- [ ] **Step 7: Verify all reaction semantics**

Run: `pnpm test src/components/audio/AudioControls.test.tsx src/components/visualizers/VisualizerRack.test.tsx src/components/VhsVisualizerApp.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit Task 9**

```bash
git add src/components/audio/AudioPlayer.tsx src/components/audio/AudioControls.test.tsx src/components/visualizers/VisualizerFrame.tsx src/components/visualizers/VisualizerRack.tsx src/components/visualizers/VisualizerRack.test.tsx src/app/globals.css
git commit -m "feat: add restrained component audio reactions"
```

### Task 10: Audio-Reactive Canvas Background

**Specification order covered:** 24 (create background).

**Files:**
- Create: `src/components/ui/AudioReactiveBackground.tsx`
- Create: `src/components/ui/AudioReactiveBackground.test.tsx`
- Modify: `src/components/VhsVisualizerApp.tsx`
- Modify: `src/components/VhsVisualizerApp.test.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `reactiveRef: MutableRefObject<AudioReactiveSnapshot>` and `active: boolean`.
- Produces: one `<canvas className="audio-reactive-background" aria-hidden="true" />` behind the station.

- [ ] **Step 1: Write failing background component tests**

```ts
it("renders one non-interactive background canvas", () => {
  const { container } = render(<AudioReactiveBackground reactiveRef={idleRef} active={false} />);
  const canvases = container.querySelectorAll("canvas.audio-reactive-background");
  expect(canvases).toHaveLength(1);
  expect(canvases[0]).toHaveAttribute("aria-hidden", "true");
});

it("does not fail when a 2d context is unavailable", () => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
  expect(() => render(<AudioReactiveBackground reactiveRef={idleRef} active />)).not.toThrow();
});
```

- [ ] **Step 2: Confirm background tests fail**

Run: `pnpm test src/components/ui/AudioReactiveBackground.test.tsx`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement one adaptive Canvas renderer**

Create a client component that owns a canvas ref and one animation loop. Each frame:

1. clear with a transparent near-black wash;
2. draw two soft radial glows using bass and overall energy;
3. draw 3–5 horizontal interference bands displaced by mid energy;
4. draw sparse deterministic grain pixels controlled by treble;
5. draw faint scanlines at a fixed spacing.

Use a seeded integer hash of `(x, y, frameBucket)` for repeatable grain without allocating hundreds of objects. Idle mode uses a `time * 0.00004` drift and maximum opacity `0.06`; playing mode blends toward the snapshot and caps the entire canvas opacity at `0.22`. The renderer must return early when `getContext("2d")` is null.

- [ ] **Step 4: Compose the background behind existing noise**

In `VhsVisualizerApp.tsx`, render exactly once immediately inside `main`, before `VhsNoise`:

```tsx
<AudioReactiveBackground reactiveRef={reactiveRef} active={signalActive} />
<VhsNoise />
```

Style it:

```css
.audio-reactive-background {
  position: fixed;
  z-index: -2;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  opacity: .82;
}
```

Keep existing content and noise layers above it.

- [ ] **Step 5: Verify background composition**

Run: `pnpm test src/components/ui/AudioReactiveBackground.test.tsx src/components/VhsVisualizerApp.test.tsx`

Expected: PASS and exactly one reactive background canvas.

- [ ] **Step 6: Commit Task 10**

```bash
git add src/components/ui/AudioReactiveBackground.tsx src/components/ui/AudioReactiveBackground.test.tsx src/components/VhsVisualizerApp.tsx src/components/VhsVisualizerApp.test.tsx src/app/globals.css
git commit -m "feat: add audio-reactive analog background"
```

### Task 11: Background Performance, Mobile Simplification, and Reduced Motion

**Specification order covered:** 25–27 (optimize background, simplify weaker/mobile effects, reduced motion).

**Files:**
- Modify: `src/components/ui/AudioReactiveBackground.tsx`
- Modify: `src/components/ui/AudioReactiveBackground.test.tsx`
- Modify: `src/hooks/useCanvasSurface.ts`
- Create: `src/hooks/useCanvasSurface.test.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/globals.test.ts`

**Interfaces:**
- Produces: `CanvasSurfaceOptions { maxDevicePixelRatio?: number; resolutionScale?: number }` with backward-compatible defaults; background quality mode derived from width, pixel ratio, reduced motion, and document visibility.
- Consumes: existing visualizers call `useCanvasSurface(canvasRef)` unchanged.

- [ ] **Step 1: Write failing surface-quality and reduced-motion tests**

For `useCanvasSurface`:

```ts
renderHook(() => useCanvasSurface(canvasRef, { maxDevicePixelRatio: 1.5, resolutionScale: .5 }));
expect(canvas.width).toBe(Math.round(400 * 1.5 * .5));
expect(canvas.height).toBe(Math.round(200 * 1.5 * .5));
```

For the background, mock `matchMedia("(prefers-reduced-motion: reduce)")` to return `matches: true`, advance a frame, and assert the renderer does not schedule continuous animation after drawing its static texture.

In `globals.test.ts` assert the reduced-motion block explicitly addresses `.audio-reactive-background` and reactive transforms.

- [ ] **Step 2: Confirm the new options fail**

Run: `pnpm test src/hooks/useCanvasSurface.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts`

Expected: FAIL because the options and reduced-motion behavior do not exist.

- [ ] **Step 3: Add backward-compatible Canvas sizing options**

```ts
export type CanvasSurfaceOptions = {
  maxDevicePixelRatio?: number;
  resolutionScale?: number;
};

export function useCanvasSurface(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { maxDevicePixelRatio = 2, resolutionScale = 1 }: CanvasSurfaceOptions = {},
): void
```

Calculate `dpr = Math.min(window.devicePixelRatio || 1, maxDevicePixelRatio)` and pixel dimensions from `width * dpr * resolutionScale`. Clamp both dimensions to at least one.

- [ ] **Step 4: Apply adaptive background quality**

For widths at or below 760px use `resolutionScale: 0.5`, maximum DPR `1.5`, at most three interference bands, half the grain samples, and a 30 FPS frame interval. For wider devices use `resolutionScale: 0.75`, maximum DPR `2`, at most five bands, and target 60 FPS. Recalculate the quality mode on `matchMedia("(max-width: 760px)")` changes without React state; store it in a ref.

Pause continuous rendering while `document.hidden`. When reduced motion is requested, draw one static frame on mount/resize/active-mode change, set time drift to zero, remove transient pulses and flicker, and do not start a perpetual RAF loop.

- [ ] **Step 5: Add CSS reduced-motion guarantees**

```css
@media (prefers-reduced-motion: reduce) {
  .audio-reactive-background { opacity: .45; }
  .station-shell[data-audio-active="true"] :is(.hardware-button--primary, .track-row, .equipment-panel) {
    transform: none !important;
  }
  .track-row[data-selected="true"]::after,
  .tape-bay[data-playing="true"] .reel { animation: none !important; }
}
```

- [ ] **Step 6: Verify performance controls and all canvas users**

Run: `pnpm test src/hooks/useCanvasSurface.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts src/components/visualizers/VisualizerRack.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit Task 11**

```bash
git add src/components/ui/AudioReactiveBackground.tsx src/components/ui/AudioReactiveBackground.test.tsx src/hooks/useCanvasSurface.ts src/hooks/useCanvasSurface.test.tsx src/app/globals.css src/app/globals.test.ts
git commit -m "perf: adapt reactive effects to device capability"
```

### Task 12: Final Resolution, Performance, Browser, and Production Verification

**Specification order covered:** 28–31 (all resolutions, performance, production build, update-caused errors/warnings).

**Files:**
- Modify as failures require: only files already in this plan's scope.
- Create: `docs/superpowers/reports/2026-08-12-major-update-verification.md`

**Interfaces:**
- Consumes: the complete update.
- Produces: fresh evidence for responsive, accessibility, performance, browser, test, lint, and production-build completion.

- [ ] **Step 1: Test every required resolution**

At 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560, and 3840px, verify and record:

- `scrollWidth <= innerWidth`;
- all visible discrete buttons are at least 44×44px;
- visualizer rack mode and readable canvas labels;
- player, seek, volume, upload, and track-selection access;
- no overlap in portrait or relevant landscape orientation;
- intentional maximum width on 1920px and above;
- zero browser console errors.

- [ ] **Step 2: Verify idle, playing, and reduced-motion visuals**

Use a local WAV or MP3 test file only if already available in the workspace or generated as a non-copyright test tone. Verify:

- faint background drift with no track playing;
- smooth increase in background response during playback;
- Spectrum and Oscilloscope colors interpolate without abrupt palette jumps;
- buttons, player, active track, and frames react subtly without positional instability;
- non-playing tracks remain static;
- reduced-motion mode removes perpetual background movement, pulses, flicker, selected scan, and reel rotation while playback still works.

- [ ] **Step 3: Check current supported browsers where available**

Run the representative 390px and 1440px checks in Chrome/Chromium and Edge. Run Firefox and Safari where the environment provides them. Record the exact browser and whether the live check was performed. Do not claim a browser was tested if it was unavailable.

- [ ] **Step 4: Record performance evidence**

During 20 seconds of playback at 1440px and 390px, record approximate animation cadence and confirm:

- the background creates one Canvas element;
- audio frame updates do not change React render counts for the app tree;
- the hidden document pauses analysis/background work;
- mobile uses the reduced resolution and target cadence;
- normal desktop animation remains near the approximately 60 FPS target when the environment can sustain it.

- [ ] **Step 5: Run the complete automated suite and ESLint**

Run: `pnpm test`

Expected: all Vitest files and tests PASS with zero failures. If a failure appears, retain the smallest reproducing test, confirm it fails for the intended reason, fix only the responsible implementation, and rerun the full suite.

Run: `pnpm lint`

Expected: exit code 0 with no update-caused warnings or errors.

- [ ] **Step 6: Run the production build**

Run: `pnpm build`

Expected: Next.js production build exits 0 with no update-caused errors or warnings.

- [ ] **Step 7: Fix every update-caused build error or warning**

For each build diagnostic caused by this update, add a focused test when the behavior is testable, reproduce the failure, apply the smallest fix, rerun that focused test, and rerun `pnpm build`. Do not suppress diagnostics or change unrelated code. Repeat until the build exits 0 without update-caused warnings.

- [ ] **Step 8: Compare against the original identity and write the final report**

In `docs/superpowers/reports/2026-08-12-major-update-verification.md`, include:

Write five concrete sections: automated commands with exact exit codes and pass counts; the complete responsive matrix; browsers actually performed and browsers unavailable; observed idle/playing/reduced-motion/visibility/canvas/cadence behavior; and an identity comparison covering palette, typography, hierarchy, components, and preserved features. Every statement must use observed results from Steps 1–7.

- [ ] **Step 9: Run a final clean verification after all fixes**

Run in this order:

```bash
pnpm test
pnpm lint
pnpm build
git status --short
```

Expected: tests, lint, and build exit 0. `git status --short` lists only the intended update/report changes plus the user's pre-existing untracked `UPDATE_SPEC.md` if it remains untracked.

- [ ] **Step 10: Commit Task 12**

```bash
git add docs/superpowers/reports/2026-08-12-major-update-verification.md
git commit -m "test: verify first major visualizer update"
```

## Plan Self-Review Checklist

- Responsive work precedes clarity, color, analysis, reactivity, and background work.
- Spectrum transition precedes Oscilloscope transition.
- Central analysis precedes every interface and background consumer.
- Player reaction precedes active-track reaction, which precedes frame reaction.
- Background creation precedes background performance/mobile/reduced-motion work.
- Each production behavior has a failing automated test before implementation.
- Every stage has a focused verification and commit boundary.
- Final verification covers every width, relevant orientation, available browser, reduced motion, performance, tests, lint, and production build.
