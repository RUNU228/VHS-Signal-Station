# Maximum Optimization Implementation Plan

> **For agentic workers:** Use subagent-driven-development for bounded implementation and review. Root owns rendering/idle work and final measurement; a task implementer owns React boundaries and cursor loading.

**Goal:** Reduce live rendering, idle, and startup costs as far as demonstrated bottlenecks permit while retaining the existing experience.

**Architecture:** Keep the shared audio bus, sampling cadence, canvas geometry, particle counts, quality policy, and audio graph. Cache finite repeated calculations, avoid redundant canvas/DOM work, isolate unrelated React renders, and load cursor animation code only on supported devices.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript, Canvas/WebGL, Vitest.

## Global Constraints

- Preserve the current design, animation cadence, amplitude, colors, particle counts, glow, controls, localization, and audio behavior.
- Do not reduce canvas resolution, remove effects, add a quality toggle, or introduce dependencies.
- Preserve immutable published frame/snapshot semantics and existing subscription behavior.
- Use installed Next.js documentation before Next-specific edits.
- Run meaningful regression checks and report measured scope honestly. Microbenchmarks are not browser FPS measurements.
- Work on the existing `codex/technical-optimization` branch; baseline is commit `6319d92`. Do not commit, merge, or push during this pass.

## Task 1: Live rendering and idle work (root)

Files: visualizers, visualization helpers, PeakEffectsLayer, webgl renderer, existing related tests; a repeatable benchmark under scripts if useful.

- [x] Record production initial JavaScript byte totals and repeatable hot-path timings against the committed baseline.
- [x] Replace spectrogram per-cell color interpolation/formatting with a finite lazy cache keyed by exact byte amplitude and column age. Preserve the exact RGBA strings and bound retained entries to 72 x 256. Cache the 34 FFT row indices when data length changes. Add exhaustive color equivalence and integration coverage.
- [x] Compute stereometer motion easing once for each of its three cohorts per frame. Preserve all particle positions, counts, opacity, and sizes; assert exponential work stays bounded to three calls and numerical output matches the original.
- [x] Remove only redundant equal-color interior waveform gradient stops; preserve plateau boundaries and all transition subdivisions. Verify equivalence at every original stop and count savings for flat/mixed histories.
- [x] Evaluate fused mid/side waveform measurement without temporary sample buffers; retain Float32 rounding and only keep it if measurements show a useful gain. Compare full statistics across representative inputs.
- [x] Eliminate repeated clearing of already-absent peak CSS variables, and avoid full shader draws when clearing the peak canvas. Avoid resetting unchanged canvas sizes. Cover lifecycle/reset/context restore behavior.
- [x] Skip fully off-screen instrument drawing while retaining numerical history. Cover hidden pause without another bus frame, prevent duplicate history updates during a final paint, and clear frozen trails on active re-entry.
- [x] Run focused tests, benchmark old/new in one process with alternating samples, and retain only useful safe changes.

## Task 2: React and cursor loading

Files: VhsVisualizerApp, VisualizerRack, TrackLibrary, TrackUploader, AudioReactiveBackground, PeakEffectsLayer (export boundary only; coordinate with root), VhsSmoothCursor, registry cursor files, associated tests.

- [x] Prove time-only updates currently rerender the rack/library and set a regression budget that they should not rerender when relevant props are unchanged. Keep time/seek display updates working.
- [x] Memoize expensive stable boundaries using React.memo and stabilize props crossing those boundaries. Context language changes must still update every visible string. Do not scatter useMemo around primitive values.
- [x] Split the cursor capability gate from its Framer Motion display so unsupported coarse-pointer/reduced-motion devices never load the animation implementation. Use lazy/Suspense or installed Next guidance. Preserve SSR markup, custom artwork, spring settings, media-query updates, native cursor behavior, and cleanup. Keep the dependency and the existing cursor implementation.
- [x] Update or add meaningful tests for deferred load, capability changes, visual mounting, and render isolation. Run the related tests and lint.
- [x] Write the task report including exact files, tests, before/after render counts, and limitations. Do not modify root-owned renderer internals.

## Task 3: Review and verification

- [x] Independent review of both tasks for correctness, visual equivalence, and bounded resource usage.
- [x] Full tests, lint, strict TypeScript unused checks, production build, and whitespace validation.
- [x] Compare initial script bytes and hot-path measurements against baseline. Check for allocation or cache growth regressions.
- [x] Browser production QA: WAV/MP3, all visualizers, repeated play/pause/seek, language switching, resize/mobile layout, cursor, and console errors.
- [x] Save final measurements and verification limits in the report; leave the local preview ready.
