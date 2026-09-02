# Technical Optimization Implementation Plan

> **For agentic workers:** Use subagent-driven-development for bounded implementation and review; execute verification in this session.

**Goal:** Implement `technical_optimization_update.md` while preserving the station's design and audio behavior.

**Architecture:** Keep the existing App Router page, shared audio engine, visualization bus, and CSS. Use local typed EN/RU dictionaries and a lightweight language context. Store waveform color history independently from amplitude history, with frequency-driven vivid interpolation and time-based smoothing.

**Tech Stack:** Next.js 16.3, React 19.2, TypeScript, Canvas/WebGL, Vitest.

## Global Constraints

- Do not redesign the website.
- Only implement English and Russian; English defaults, explicit persistent selection.
- No translation APIs, language routes, new dependencies, or replacement visualization system.
- Do not translate filenames, metadata, numeric data, technical identifiers, or brands.
- Language changes must preserve audio, track, time, analyzer graph, and visualizer history.
- Read installed Next.js docs before code changes. Keep focused diffs.

## Task 1: Localization and selector

Files: new `src/lib/i18n.ts`, `src/components/LanguageProvider.tsx`, `src/components/ui/LanguageSwitcher.tsx`; existing app, audio components, visualizer text, globals.css; focused localization tests.

- [x] Audit all rendered strings and accessibility names. Centralize typed translations, parameters, plural forms, statuses, and engine-error mapping.
- [x] Add tests for EN default, RU selection/persistence, blocked storage, hydration consistency, and mounted audio/visualizer preservation across switches. Run failing tests before implementation.
- [x] Implement a provider without changing the audio hook's language-independent API. Read persisted preference before paint using an SSR-consistent initial render and layout effect. Update document language. Fallback to English on unexpected missing entries.
- [x] Add native EN/RU buttons with full-language accessible names, pressed state, visible focus, and 44px targets in header's upper-right area.
- [x] Translate all UI including notifications already displayed during a language change. Keep dynamic filenames untouched.
- [x] Preserve style; add only layout containment and Cyrillic-compatible fallbacks where needed. Verify focused tests.

## Task 2: Waveform colors

Files: `src/components/visualizers/Waveform.tsx`, new waveform-color helper/tests under `src/lib/visualization/`; retain Task 1's translated JSX.

- [x] Test low/mid/high frequency mapping, continuous vivid blue/cyan/yellow/orange/red interpolation, equivalent smoothing over equal elapsed time, silence stability, and source-reset history.
- [x] Derive a continuous frequency position from shared FFT data, with cached frequency positions/weights. Smooth color only using frame timestamp and an approximately 65ms response constant.
- [x] Retain amplitude/transient measurements, dual M/S traces and six-second-style history. Store smoothed color when appending a history column; do not recolor old columns from current energy.
- [x] Use a bounded horizontal gradient with interpolated hue stops; avoid per-sample gradients and abrupt six-column color buckets. Preserve fills, outlines, RMS and glow.
- [x] Run focused waveform and rendering tests.

## Task 3: Evidence-based optimization

Files: only confirmed hot paths/lifecycle issues found during project inspection, plus targeted regression tests.

- [x] Review every runtime source file, effects, timers, observers, object URLs, audio graph, CSS, dependencies and tests.
- [x] Cache repeated media-query quality checks through change listeners instead of allocating MediaQueryLists every frame.
- [x] Remove duplicate Spectrum frequency calculations with cached band geometry when sample rate/FFT changes.
- [x] Address confirmed upload completion/unmount cleanup and repeated keyboard listener registration if still present after localization.
- [x] Keep shared frame loop, data buffers, current visual effects and valid existing cleanup. No speculative abstraction or cosmetic renaming.
- [x] Verify new lifecycle behavior and existing regression suite.

## Task 4: Integration and verification

- [x] Run existing tests, ESLint, TypeScript, production build.
- [x] Inspect English/Russian desktop/mobile/tablet/large-screen layout in the browser, including full-page screenshots.
- [x] Test WAV/MP3 upload, playback, seeking, volume/mute, track switching, repeated language switches, persistence, invalid-file notices, canvas resize, console errors and reduced motion.
- [x] Inspect basic runtime behavior with synthetic audio and document structural before/after evidence. No quantitative frame-timing measurement is claimed; see the verification report.
- [x] Request independent review of implementation, resolve actionable findings, and save verification evidence in `docs/superpowers/reports/2026-09-02-technical-optimization.md`.
