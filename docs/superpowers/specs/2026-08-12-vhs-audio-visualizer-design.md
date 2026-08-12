# VHS Audio Visualizer Design

**Date:** 2026-08-12
**Status:** Approved design direction
**Source of truth:** `WorkFlow.md`

## Purpose

Build a complete client-side audio workstation that lets a listener load local WAV and MP3 files, manage them as a queue, play them through one synchronized audio engine, and inspect the live signal through five real-time visualizers. The interface is English-only and should feel like a late-1980s broadcast analysis rack combined with a professional VHS deck.

The application is not a marketing mockup. Local audio loading, playback, queue progression, keyboard controls, and every primary visualization must be functional and derived from the selected audio signal.

## Technical Architecture

The project will use the latest stable Next.js release with the App Router, React, TypeScript, Tailwind CSS, the Web Audio API, Canvas API, `requestAnimationFrame`, and `ResizeObserver`. It has no backend or persistent storage.

One hidden `HTMLAudioElement` is the sole playback source. A client-only audio engine creates one `AudioContext`, one `MediaElementAudioSourceNode`, a master gain path, shared analysers, and a stereo channel splitter. Track changes replace only the element source URL; they do not recreate the audio graph or create additional playback streams.

React owns low-frequency application state: tracks, active track index, playback state, current time, duration, volume, mute state, readiness, errors, and queue completion. Canvas components read analyser data through stable engine references. FFT and time-domain arrays never enter React state.

Object URLs are unique per upload and revoked when no longer used. Audio events, animation frames, observers, and graph resources are removed during cleanup.

## Component Boundaries

- `useAudioEngine` owns the media element, shared graph, transport commands, audio event synchronization, keyboard shortcuts, and cleanup.
- Audio-loading utilities validate WAV/MP3 files, create independent track IDs and object URLs, and read real metadata durations.
- The application shell composes the rack, player, uploader, and track library around the single playback state.
- Player components expose previous, play/pause, next, seek, mute, and volume controls with equipment-like interaction states.
- The track library appends uploads without interrupting playback and selects tracks according to the current paused/playing state.
- Canvas hooks handle device-pixel-ratio sizing, `ResizeObserver`, and cancellable animation loops.
- Each visualizer receives the same stable analyser bundle and implements only its own signal transformation and drawing.
- Shared UI primitives provide panels, LEDs, screws, technical labels, error strips, and CRT treatment without owning application behavior.

## Playback and Queue Behavior

Uploaded files are appended in selection order. Duplicate filenames are allowed because every upload receives an independent ID. Adding tracks during playback preserves the active track and playback position.

Selecting a track loads it. If playback was running, the new selection begins playing; if paused, it remains paused. Next moves forward while preserving the prior playing state. Previous restarts the current track when playback is past approximately three seconds; otherwise it selects the previous track. Queue completion leaves the final track selected, pauses at its duration, and displays `END OF QUEUE` without looping.

The seek control supports click and drag interaction. Keyboard controls use Space, arrow keys, M, N, and P, but ignore events originating from inputs or other editable controls. Seeking uses five-second increments and clamps safely to the track duration.

## Visualizer Rack

The visual hierarchy is the visualizer rack, then the player, then the track library. On wide screens the rack uses two large modules on the first row and three modules on the second. Narrow screens stack all modules in specification order. Every canvas remains present in the empty state and shows `NO SIGNAL` without fake audio animation.

### Spectrogram

Uses real frequency data with `fftSize = 4096`. Frequency energy enters a bounded particle-grid history and scrolls across the display. Brightness, opacity, color, and glow come from the stored FFT magnitudes. The restrained mapping moves from near-black and analog blue through dirty yellow to amber and muted red.

### Waveform

Reads real left and right time-domain samples, calculates `Side = (Left - Right) / 2` and `Mid = (Left + Right) / 2`, and renders two vertically stacked traces labeled `CHANNEL 1 — SIDE` and `CHANNEL 2 — MID`. Each trace has a visible zero axis, controlled afterglow, and amplitude-dependent blue/yellow/red coloring.

### Stereometer

Uses real stereo samples to derive a scaled bipolar coordinate system using left-minus-right and left-plus-right relationships. A bounded canvas particle buffer provides phosphor persistence and decay. The grid communicates mono center, stereo spread, and phase relationship with restrained reference marks.

### Oscilloscope

Draws a thin real-time waveform from actual time-domain data around a horizontal zero line. A low-cost zero-crossing search stabilizes the trace where practical. Stronger peaks transition from muted blue and warm white toward amber and signal red.

### Spectrum

Uses real frequency data with `fftSize = 4096`. Bin frequencies are calculated from the live `AudioContext.sampleRate`; only 100 Hz through 5 kHz are displayed. Logarithmic positioning gives lower frequencies more useful space. Narrow illuminated bars use amplitude color mapping, peak hold, and slow peak decay.

## Visual Design System

The interface uses a disciplined industrial palette:

- Void black: `#080909`
- Rack charcoal: `#111212`
- Raised metal: `#171818`
- Warm phosphor: `#E6D7A3`
- Analog blue: `#6F91A8`
- Dirty amber: `#C49A52`
- Signal red: `#A84D43`

Typography combines a condensed industrial display face for rack titles with a monospaced utility face for timestamps, scales, states, and metadata. Font delivery will use a local/system-safe stack so the application does not depend on runtime font downloads.

Panels resemble related pieces of one physical monitoring console: squared dark-metal housings, inset CRT glass, sparse hardware labels, small screws, fine highlights, ventilation details, and faint inactive LEDs. Decoration stays secondary to signal information.

The signature visual element is the continuous rack silhouette: the five distinct CRT modules read as one professional instrument when viewed together. Thin scanlines, film grain, gentle brightness fluctuation, and rare 1–3 px tracking displacement create VHS atmosphere. Motion respects `prefers-reduced-motion` and never obscures text or signal data.

Controls depress physically on activation, reduce their shadow, and change LED feedback. Track rows, sliders, upload states, focus indicators, and disabled states remain obvious without relying only on color.

## Loading, Empty, and Error States

Before upload, every visualizer is mounted in a quiet inactive state, the transport is visibly disabled, and the library displays `NO AUDIO LOADED`. Metadata extraction shows `READING TAPE...` or `LOADING SIGNAL...`.

Unsupported files, corrupt metadata, playback failures, and audio-context failures produce an interface-level English message with a corrective cue. Invalid files do not prevent valid files from being loaded in the same batch.

## Accessibility and Responsive Behavior

All controls use native interactive elements, readable labels, visible focus states, and appropriate `aria-label` attributes. Playback and selection states are communicated with text or shape in addition to LED color. Text contrast remains legible through the CRT layers.

Desktop is the primary composition. Tablet layouts reduce module columns while preserving controls and scales; smaller screens stack visualizers and reorganize the player without removing functionality. Canvas resolution follows observed panel size and caps device pixel ratio at two.

## Performance and Verification

Animation aims for approximately 60 FPS where hardware permits. Visualizers reuse typed arrays and bounded particle/history buffers, avoid React frame updates, cancel animation frames on unmount, and do not allocate large arrays inside hot loops.

Implementation follows the 19 sequential stages in `WorkFlow.md`. Each major stage receives targeted verification before the next begins. Final validation includes functional WAV and MP3 checks, multi-file drag/drop, queue behavior, all transport controls, real analyser response across all five canvases, responsive inspection, accessibility interaction, browser-console inspection, `npm run lint`, and `npm run build`.

## Scope

The first release includes every core item in `WorkFlow.md`. It intentionally excludes a backend, accounts, cloud uploads, persistent playlists, waveform precomputation, third-party visualization libraries, and infinite playback. No primary visualization will use random or synthetic signal data.
