# Audio-Reactive WebGL Update Design Specification

**Date:** 2026-08-16  
**Status:** Approved for implementation planning  
**Source:** `audio_visualizer_update_spec.md`

## Goal

Extend the existing VHS Signal Station without redesigning it so that every visualizer communicates weak, medium, strong, and extreme audio clearly through coordinated color, motion, density, brightness, and short VHS-style peak effects. The implementation must preserve playback, upload, queue, responsive layout, current rack structure, and readability while keeping animation data outside React's frame-by-frame render cycle.

## Chosen Rendering Approach

Use a hybrid renderer. Preserve the existing Canvas 2D visualizers and add a transparent native WebGL layer for procedural extreme-signal effects. CSS custom properties provide bounded physical responses such as local shake, bass scale pulses, glow, and chromatic accents.

This approach provides shader-driven VHS artifacts without rewriting five working visualizers or uploading every Canvas frame to the GPU. A full WebGL rewrite and a centralized Canvas-to-WebGL compositor are out of scope because they add regression risk and unnecessary transfer or synchronization cost.

The WebGL layer is progressive enhancement. If WebGL initialization fails, its context is lost, or the selected quality profile disables it, playback and Canvas/CSS reactivity continue normally.

## Shared Audio and Animation Architecture

A single client-side audio visualization controller samples the existing `AnalyserNode` graph once per shared animation frame. It owns reusable typed arrays for frequency, oscilloscope, left-channel, and right-channel samples and exposes a stable mutable `AudioVisualizationFrame`. React continues to manage component lifecycle, playback state, queue state, and layout; it does not receive per-frame FFT data through state.

The shared frame contains:

- raw reusable frequency and time-domain buffers required by Canvas renderers;
- normalized `lowEnergy`, `midEnergy`, `highEnergy`, `overallEnergy`, `bassEnergy`, `transientEnergy`, `peakStrength`, and `smoothedEnergy` values;
- an interpolated signal color and conceptual `IDLE`, `LOW`, `MEDIUM`, `HIGH`, or `EXTREME` state;
- a monotonic peak event identifier and deterministic effect seed;
- stereo balance, stereo width, active/paused status, and quality/reduced-motion flags.

Low, mid, and high energy use approximately 20–250 Hz, 250 Hz–4 kHz, and 4–20 kHz. Band endpoints are clamped to the current sample rate and FFT size. Overall energy is derived from the meaningful audible range rather than a single bin.

Attack and release use separate rates: rising energy responds quickly and falling energy decays more slowly. Signal states use hysteresis so values near a threshold do not flicker between states. Continuous visual properties always use normalized values and interpolation; state labels exist only for effect eligibility and telemetry.

Transient detection compares current energy against both the previous energy and a slower envelope. A peak requires sufficient absolute energy and a sufficiently large positive transient. `peakStrength` combines absolute level, transient size, and relevant bass/high-frequency emphasis, then decays after the event. Per-effect cooldowns prevent loud sustained passages from retriggering glitches every frame. A constant loud signal can stay visually intense without being classified as a new peak.

The controller also acts as the animation clock. Render subscribers run from the same `requestAnimationFrame` callback after audio sampling. Hidden documents suspend the clock. Idle or paused states keep only the minimum cadence required for smooth decay and the subtle background drift.

## Reset and Playback Semantics

Changing tracks resets reusable buffer contents, energy history, transient baselines, peak identifiers, cooldowns, temporary particles, visualizer history where required, and WebGL uniforms before the new track resumes. The existing analyser graph is reused rather than duplicated.

Pausing or ending a track disables new peaks immediately while energy, particle motion, brightness, and color decay smoothly toward the dark-blue idle state. No-audio mode allows only the subtle deterministic background drift; it cannot produce glitches, bursts, or shake.

## Unified Signal Color System

All visualizers use one continuous color function with a dark, less-saturated blue at weak energy, yellow at medium energy, orange during the high transition, and saturated red at strong energy. The function does not use binary color thresholds. Brightness, saturation, emissive glow, and alpha scale separately so low signals remain visible without making the page bright.

Overall energy establishes the main position on the blue-to-yellow-to-red curve. Relative band dominance adds a bounded bias: bass reinforces the blue body, mids reinforce yellow, and highs reinforce red highlights. Band influence cannot override the overall intensity level or introduce unrelated hues.

The same utility produces Canvas colors, WebGL uniform values, and root CSS variables such as `--signal-color`, `--signal-strength`, `--signal-glow`, `--peak-strength`, and `--background-reactivity`.

## Visualizer Interpretations

### Spectrum

Each bar uses its local normalized amplitude for color, height, brightness, and glow. Strong local bins receive short peak caps, red pulses, or small localized particles rather than recoloring the entire spectrum. Bass bins feel heavier and broader; high bins remain sharper and faster.

### Spectrogram

New history cells map low intensity to dark blue, medium intensity to yellow, and high intensity through orange to red. Historical columns retain their original intensity information while age reduces brightness and opacity toward the dark background. History is cleared on track replacement, not on an ordinary component render.

### Oscilloscope

Waveform segments use local amplitude for color, line thickness, and glow. Strong transients can produce a few frames of bounded jitter, horizontal offset, or fragmented line segments. The trace returns immediately to its stable form after the event and never becomes permanently noisy.

### Waveform

Historical waveform columns retain their current mid/side identity and playback/history readability. Local amplitude controls segment color so quieter regions remain blue while strong regions become yellow, orange, or red. Any existing playback-position information remains structurally distinct from reactive color.

### Stereometer

The stereometer keeps genuine left/right and mid/side response. Left-heavy and right-heavy signals bias the field accordingly, mono content concentrates toward the center axis, and wide content spreads outward. Particle cohorts interpret the shared bands: low particles move more slowly and broadly, mid particles use medium motion, and high particles are smaller and faster.

Particles remain sharp rectangles or points with readable edges. Desktop quality uses the densest field supported by the measured implementation; lower quality profiles reduce the count and work rate. Particle size grows modestly with energy, with only a brief bounded expansion on extreme peaks. Persistence uses a translucent clear and fast decay to produce short trails without restoring the previous blurry cloud.

## Background Visualizer

The existing persistent background Canvas becomes a subtle frequency-trace layer rather than a foreground module. It uses the shared frame and continues independently of any rack selection or visualizer lifecycle.

At idle it shows a faint dark-blue trace and nearly static grain. Medium energy increases trace movement and opacity toward yellow. High energy introduces red accents, greater deformation, and additional faint bands. Extreme peaks permit a short displacement or brightness pulse. Opacity remains bounded to preserve text and control readability, with the strongest temporary state remaining near the specification's approximate 0.35 ceiling.

Depth comes from opacity, soft blur, low contrast, slow parallax-like drift, and masking or attenuation behind critical content. Mobile quality reduces resolution and trace detail; reduced-motion mode retains a static or slowly updating color-based representation.

## Peak Effect Coordinator

A pure peak-effect coordinator maps confirmed peak events to deterministic recipes. Signal strength and frequency content decide whether an event is eligible and how intense it is. A seeded generator chooses only decorative details such as slice position, particle direction, crackle layout, and noise pattern.

Moderate peaks may combine local glow with a small particle burst. Strong peaks may add local shake, a red pulse, or one short glitch band. Extreme peaks may combine several effects, including the WebGL layer and a very small global response. Not every effect runs for every peak.

Independent cooldowns support frequent micro-jitter, less frequent local shake, and rarer large glitches. Effect durations remain approximately 30–150 ms for glitches and 40–120 ms for shake, with intensity scaled by `peakStrength`.

## WebGL VHS Layer

A transparent, pointer-events-disabled WebGL Canvas sits above decorative visualizer layers and below controls and critical text. Small native shader modules manage compilation, uniforms, resize, context loss, and teardown without adding a rendering dependency.

The fragment shader can render:

- horizontal scanline and tracking-error bands;
- procedural noise blocks and brief crackling fragments;
- bounded RGB channel-style separation accents;
- short brightness or overexposure flashes;
- seeded slice offsets and analog tearing patterns.

The overlay generates transparent procedural artifacts; it does not pretend to post-process DOM pixels that WebGL cannot directly sample. Bounded CSS transforms on background and visualizer containers provide the corresponding physical displacement. Ordinary strong peaks prefer local visualizer movement. Background or station-level movement is reserved for extreme peaks, and critical UI remains structurally above the affected layers.

WebGL uniform updates consume the shared mutable frame and effect recipe without React state. Context loss hides the layer and clears its effects; context restoration may recreate resources when safe. Shader compilation failure is reported only in development diagnostics and must not affect audio playback.

## Layering and Readability

The visual stack is:

1. base station background;
2. reactive background Canvas;
3. main Canvas visualizers;
4. temporary particles and WebGL VHS artifacts;
5. decorative frames and noncritical accents;
6. controls and critical text.

Effects cannot intercept pointer input. Controls, track names, labels, focus indicators, and playback progress remain readable in every signal state. Global brightness and shake have lower limits than local visualizer effects.

## Quality Scaling and Accessibility

Quality selection uses a small `LOW`, `MEDIUM`, or `HIGH` profile derived from viewport size, device pixel ratio, and reduced-motion preference. It changes only visual complexity, not audio analysis:

- high quality uses the largest safe particle field, full desktop cadence, and all WebGL recipes;
- medium quality reduces particle bursts, shader noise density, and render resolution;
- low/mobile quality reduces particle count, caps Canvas/WebGL resolution, minimizes global shake, and omits the most expensive shader recipe;
- reduced-motion mode disables shake, rapid displacement, aggressive glitching, and large particle movement while preserving smooth signal color and restrained brightness.

Canvas and WebGL sizes are device-pixel-ratio capped. Typed arrays, shader resources, gradients, and particle storage are reused. No React component tree is generated for particles, and no per-frame array allocation is permitted in hot render paths where reuse is practical.

## Failure and Fallback Behavior

- Web Audio analysis failure leaves playback and static visualizers usable.
- WebGL failure removes only the shader layer; Canvas and CSS reactions continue.
- Canvas failure leaves the existing equipment UI and controls functional.
- Hidden tabs suspend costly work and resume without stale peak events.
- Resizes rebuild visual surfaces without resetting playback or queue state.
- Unsupported reduced-motion or media-query APIs use conservative defaults.
- Track, pause, end, and unmount cleanup removes callbacks and GPU resources and clears temporary effects.

## Implementation Stages

The specification's required order is grouped into eight reviewable stages without changing its dependencies:

1. **Shared signal foundation:** deterministic tests, reusable frame buffers, frequency bands, attack/release smoothing, hysteresis, transient detection, peak strength, cooldowns, resets, and shared animation scheduling.
2. **Unified visual language:** continuous color interpolation, frequency bias, brightness/saturation mapping, and CSS/WebGL color outputs.
3. **Existing visualizers:** connect all five modules to the shared frame and update Spectrum, Spectrogram, Oscilloscope, and Waveform behavior.
4. **Stereometer refinement:** adaptive density, sharper points, controlled trails, frequency cohorts, stereo behavior, and quality scaling.
5. **Reactive background:** persistent frequency traces, signal-state behavior, opacity/readability limits, idle motion, mobile scaling, and reduced motion.
6. **Peak effects:** deterministic recipes, local shake, particle bursts, WebGL lifecycle, scanline tearing, chromatic accents, crackling, noise, and extreme shake.
7. **Resilience and optimization:** track/pause/end resets, hidden-tab behavior, context loss, fallback paths, resource reuse, and mobile performance.
8. **Completion verification:** focused and full automated checks, production build, representative browser sizes, playback regression checks, and manual audio-profile validation.

Each stage must have passing focused checks before the next begins.

## Testing Strategy

Pure unit tests cover band aggregation, normalization, attack/release behavior, hysteresis boundaries, transient-versus-sustained energy, peak strength, cooldowns, deterministic recipes, color interpolation, quality profiles, and reset semantics.

Hook and component tests verify that shared frames update without React render churn, visualizers subscribe and unsubscribe correctly, playback inactivity decays rather than emits peaks, track changes reset stale state, reduced motion disables aggressive effects, and WebGL failure preserves the rest of the application.

Canvas and WebGL utilities use mocked contexts for lifecycle and parameter contracts. Shader source and program setup receive deterministic tests where feasible; live shader appearance is verified in a real browser rather than asserted through brittle pixel snapshots.

Automated signal tests use deterministic synthetic quiet, normal, bass-heavy, high-frequency-heavy, sustained-loud, transient-heavy, and clipped profiles. Manual playback checks use representative uploaded audio when available and verify synchronization, readability, and subjective restraint.

After each stage, run its focused Vitest files. Completion requires the full Vitest suite, ESLint, the Next.js production build, and browser inspection at representative phone, tablet, desktop, and large-display widths. Verify no unintended overflow, console errors, unreadable controls, continuous unprompted glitches, or update-caused playback regression.

## Out of Scope

- A full site redesign or navigation change.
- Replacing the existing audio engine or adding server-side audio processing.
- Converting all five visualizers to WebGL.
- Capturing or uploading DOM/Canvas frames into a full-scene WebGL compositor.
- Adding a third-party rendering engine when native Canvas and WebGL APIs suffice.
- Persistent aggressive glitching, rainbow colors, holographic effects, or distortion that compromises controls.
- Adding visualizer selection when the current rack intentionally displays all five modules.

## Acceptance Criteria

The update is complete when the background visibly but subtly reacts to the current track; every visualizer uses smooth blue-to-yellow-to-red signal color; low, mid, and high bands come from one shared analysis frame; the stereometer is sharper, denser, stereo-reactive, and performance-scaled; actual transients produce strength-scaled peak events; strong and extreme peaks can trigger short deterministic VHS glitches, shake, bursts, chromatic accents, or noise; effects never trigger without audio; pause, end, and track switching clear stale effects; reduced motion and WebGL fallback remain usable; controls remain readable; playback behavior is unchanged; mobile remains functional; and automated checks plus the production build pass.

