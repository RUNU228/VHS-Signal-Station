# VHS Visualizer First Major Update — Design Specification

**Date:** 2026-08-12  
**Status:** Approved for implementation planning  
**Source:** `UPDATE_SPEC.md`

## Goal

Polish the existing VHS Signal Station landing page without redesigning it. The update must preserve the current analog-equipment identity while making the full experience responsive, clearer to operate, smoother in motion, subtly audio-reactive, and performant from 320px phones through 4K displays and TVs.

## Technical Foundation

The project remains a Node.js application using the existing Next.js 16, React 19, TypeScript, Tailwind/PostCSS, Vitest, and pnpm toolchain. Web Audio and Canvas are browser-side capabilities inside this Node.js application; the update will not add another runtime, a new backend, or unnecessary dependencies.

Existing playback, local file privacy, keyboard shortcuts, visualizers, visual hierarchy, copy, typography, palette, and page structure remain in place unless a responsive adaptation requires a layout change.

## Design Direction

The page remains recognizably the same VHS Signal Station: near-black equipment surfaces, warm phosphor text, muted blue, amber, and red accents, narrow display typography, monospaced telemetry, square hardware controls, CRT framing, scanlines, grain, and restrained analog imperfections.

The update is progressive enhancement. CSS handles layout and static interaction states. A centralized Web Audio analysis layer supplies smoothed normalized values through stable refs. Canvas handles the atmospheric background. CSS custom properties carry restrained audio energy into the interface without frame-by-frame React rendering.

The background retains a faint analog idle drift when no track is playing. During playback, it smoothly increases its glow, interference, grain, and horizontal-band response. Reduced-motion mode makes the idle texture essentially static and suppresses pulses and flicker.

## Responsive Layout

### Global Rules

- Replace fragile fixed dimensions with intrinsic sizing, percentages, `rem`, `clamp()`, Grid, Flexbox, and aspect-ratio constraints.
- Prevent unintended horizontal scrolling at every supported width.
- Keep the application centered with a controlled maximum width on ultrawide, TV, and 4K displays.
- Scale visual surfaces more aggressively than text and controls on large displays.
- Maintain a minimum 44px interactive target wherever a user taps or clicks a discrete control.
- Preserve readable canvas labels and avoid shrinking visualizers merely to retain desktop columns.

### Phones: 320–760px

- Use a single-column rack.
- Stack player modules and uploader controls where needed.
- Keep visualizers large enough to interpret, with responsive heights instead of desktop-sized fixed canvases.
- Allow essential station identity and queue information to remain visible while removing only secondary telemetry that cannot fit.
- Keep player, upload, seek, volume, and track-selection controls within the viewport.

### Tablets: 761–1100px

- Use a deliberate two-column visualizer grid with the Spectrum spanning the available width where appropriate.
- Arrange player modules across a compact grid that works in portrait and landscape.
- Give transport controls and track rows more room than the phone layout without reverting to the wide desktop rack.

### Desktop: 1101–1919px

- Preserve the current rack identity: Spectrogram and Waveform as the dominant upper pair, with Stereometer, Oscilloscope, and Spectrum below.
- Keep the existing player, uploader, and track-library hierarchy while tightening overly tall or sparse intermediate layouts.

### Large Displays: 1920px and above

- Cap the primary station width at a balanced readable measure.
- Let canvases and equipment frames grow within that cap while keeping copy and controls within bounded type and target sizes.
- Treat surrounding empty space as intentional broadcast-room negative space rather than stretching the station edge to edge.

## Interaction and Control Clarity

- All buttons receive coherent hover, focus-visible, active/pressed, and disabled states using subtle brightness, border, glow, inset shadow, and very small scale changes.
- Focus indicators remain visible against dark equipment panels and do not rely on color alone.
- Play, pause, previous, next, mute, upload, seek, and volume controls retain clear accessible names and familiar symbols or labels.
- Track rows always expose track name and duration.
- The selected track receives a persistent structural indicator; the currently playing track additionally receives restrained red/amber illumination and an activity label.
- Non-playing tracks remain mostly static so the active track is unambiguous.

## Smooth Visualizer Color System

Spectrum and Oscilloscope share a small analog palette derived from the existing red, amber, phosphor-yellow, muted orange, and blue accents. They do not use a rainbow or gaming-RGB cycle.

Each visualizer derives a target color from smoothed audio intensity and interpolates from its current color on animation frames. Low energy uses darker, less saturated tones and weak glow; medium energy increases saturation and highlight strength; high energy favors brighter red and yellow accents with a controlled glow. Oscilloscope contrast remains high enough that the line is always readable.

## Centralized Audio Analysis

The existing `useAudioEngine` continues to own the HTML audio element and Web Audio graph. A focused analysis controller reads the existing analysers once per animation frame and exposes a stable snapshot with values normalized approximately to `0.0–1.0`:

- overall volume;
- bass energy;
- low-mid energy;
- mid energy;
- high-mid energy;
- treble energy;
- transient or peak intensity;
- smoothed overall energy.

Frequency-band calculations use the AudioContext sample rate and analyser FFT metadata. Attack and release smoothing prevent jitter while allowing transients to remain visible. The controller stores frame-level data in refs, not React state, and pauses sampling when the document is hidden or no analyser is available.

## Audio-Reactive Interface

A root-level animation controller maps the analysis snapshot to bounded CSS custom properties. Components consume those variables through existing class boundaries:

- major buttons receive a tiny bass-linked scale pulse and restrained border/glow increase;
- the player border, play control, active playback line, progress intensity, and track-title glow react at different strengths;
- only the active track card receives the stronger track reaction;
- visualizer containers receive subtle border and background illumination while the visualizer itself remains dominant;
- treble may add a mild analog flicker, but never a high-contrast flash.

No element changes position, shakes, rotates, or scales aggressively. Text readability and control stability take priority over reactivity.

## Audio-Reactive Background

One full-viewport Canvas layer sits behind the station content and complements the existing noise overlay. It renders a restrained combination of grain, scanline drift, soft palette glows, distorted horizontal bands, and faint waveform or spectrum-like light patterns.

The mapping is intentionally limited:

- bass controls a slow soft-glow expansion and low-frequency pulse;
- mids control horizontal-band displacement and signal interference;
- treble controls fine grain and mild highlight flicker;
- overall volume controls bounded background brightness.

Idle mode keeps a faint low-frequency drift so the station does not become visually dead. Playback blends into the latest smoothed analysis values instead of switching modes abruptly.

The renderer uses one Canvas element, no particle component tree, device-pixel-ratio limits, resize observation, visibility pausing, and reusable typed arrays or drawing buffers where beneficial. Mobile mode reduces canvas resolution, blur radius, procedural detail, and update frequency. Reduced-motion mode freezes or drastically slows ambient movement and removes pulses and flicker while preserving the static VHS texture.

## Failure and Fallback Behavior

- If Web Audio analysis is unavailable, playback and all controls continue with static styling.
- If Canvas creation fails, the existing CSS background and noise texture remain visible.
- Empty queues, rejected audio files, playback faults, and unavailable signals continue using the existing station message system.
- Resizing must never clear application state or interrupt playback.
- Unsupported visual effects receive static CSS fallbacks and must not prevent interaction.

## Implementation Stages

The work follows `UPDATE_SPEC.md` section 31 exactly. The 31 ordered steps are grouped into reviewable stages without reordering work:

1. **Responsive foundation:** inspect the project and current behavior, fix global layout, then adapt visualizers, player, and uploaded-track list.
2. **Device-specific refinement:** optimize phone, tablet, desktop, ultrawide, 4K, and TV layouts, then verify responsive behavior.
3. **Interface clarity:** improve control readability, button states, and track-selection feedback.
4. **Visualizer transitions:** implement Spectrum color interpolation before Oscilloscope interpolation.
5. **Audio analysis:** build the centralized layer and expose normalized smoothed values.
6. **Reactive interface:** update major interface elements, buttons, player, active track, and visualizer containers in the specified order.
7. **Reactive background:** create the Canvas atmosphere, optimize it, simplify weak/mobile-device effects, and implement reduced-motion behavior.
8. **Final verification:** test supported resolutions, measure performance, run the production build, and fix update-caused errors and warnings.

No later major stage begins before the previous stage is implemented and verified.

## Testing Strategy

### Automated Tests

- Unit-test normalization, band aggregation, attack/release smoothing, peak behavior, and color interpolation with deterministic analyser data.
- Test that the analysis loop writes refs without requiring React state updates.
- Test responsive CSS contracts and required breakpoint rules where the existing CSS-test pattern supports them.
- Test keyboard focus, accessible labels, disabled states, selected/playing track states, and reduced-motion fallbacks.
- Preserve and run the existing visualizer, player, queue, keyboard, and canvas test suites after each stage.

### Live Visual and Browser Checks

Inspect at approximately 320, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560, and 3840px widths, including relevant portrait and landscape orientations. At each representative layout verify:

- no unintended horizontal overflow;
- readable text and telemetry;
- visualizer proportions and canvas sharpness;
- minimum touch-target size;
- player, uploader, and track-row accessibility;
- idle and playing visual hierarchy;
- controlled background contrast;
- reduced-motion behavior;
- absence of console errors.

Use current Chrome and Edge where available, Firefox where available, and Safari where the environment permits. When a browser cannot be run locally, use standards-compatible implementations and document the unperformed live check rather than claiming coverage.

### Performance and Completion Gates

- Target approximately 60 FPS on normal desktop hardware without requiring it as a hard pass condition on every device.
- Confirm the animation controller does not trigger whole-tree React renders on audio frames.
- Check mobile rendering with reduced background resolution and work rate.
- Run the full Vitest suite, ESLint, and the Next.js production build.
- Compare the final page visually with the pre-update page and confirm that it remains recognizably the same website.

## Out of Scope

- Rebuilding the application or replacing the current design system.
- Adding a server-side audio pipeline, account system, cloud upload, navigation redesign, or unrelated feature.
- Replacing working visualizers without a demonstrated technical need.
- Aggressive motion, generic particles, glossy modern effects, rainbow palettes, or decorative effects that compromise readability.
- Adding dependencies when the existing browser APIs and project utilities are sufficient.

## Acceptance Criteria

The update is complete when the page works without unintended overflow across the required widths; has deliberate phone, tablet, desktop, and large-display layouts; keeps all existing functionality; provides clear interaction and track states; uses smooth audio-driven Spectrum and Oscilloscope colors; exposes centralized normalized smoothed audio values; reacts subtly through the interface and background without React render churn; respects reduced motion; remains usable with analysis or Canvas unavailable; passes automated checks and the production build; and still unmistakably looks like the current VHS Signal Station.
