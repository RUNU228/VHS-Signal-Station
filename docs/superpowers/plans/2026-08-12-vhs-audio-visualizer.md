# VHS Audio Visualizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, responsive, browser-local VHS audio workstation with a synchronized custom player, queue, and five real-signal Canvas visualizers.

**Architecture:** One client application shell owns queue and transport state through a single `useAudioEngine` hook. The hook owns one `HTMLAudioElement` and one reusable Web Audio graph; stable analyser references feed isolated Canvas modules that render without frame-by-frame React updates.

**Tech Stack:** Latest stable Next.js App Router, React, TypeScript, Tailwind CSS, Web Audio API, Canvas API, ResizeObserver, requestAnimationFrame, Vitest, Testing Library.

## Global Constraints

- Initialize with `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`.
- UI copy is English only.
- Supported local formats are `.wav` and `.mp3`; no file leaves the browser.
- Use one shared HTML audio element, one AudioContext, and no duplicate playback streams.
- Spectrogram and Spectrum use `fftSize = 4096`.
- Spectrum displays only 100 Hz through 5 kHz with logarithmic positioning.
- Waveform displays `Side = (Left - Right) / 2` above `Mid = (Left + Right) / 2`.
- Primary visualization data must come from the active audio signal; procedural randomness is limited to ambient VHS noise and idle atmosphere.
- Canvas loops use stable refs and typed arrays, cancel on unmount, and cap device pixel ratio at two.
- The final queue item remains selected and stops at its end without looping.
- Desktop is primary; all controls and visualizers remain usable on smaller screens.
- Final verification requires clean `npm test`, `npm run lint`, and `npm run build` runs plus browser interaction checks.

---

## File Map

- `src/app/page.tsx`: server entry that renders the client workstation.
- `src/app/layout.tsx`: metadata and application frame.
- `src/app/globals.css`: Tailwind import, design tokens, CRT/VHS layers, panel and control states.
- `src/components/VhsVisualizerApp.tsx`: shared application state composition and keyboard wiring.
- `src/components/audio/AudioPlayer.tsx`: current-track display and player composition.
- `src/components/audio/PlayerControls.tsx`: previous/play/next hardware controls.
- `src/components/audio/SeekBar.tsx`: pointer-based timeline.
- `src/components/audio/VolumeControl.tsx`: volume and mute interface.
- `src/components/audio/TrackUploader.tsx`: file input and multi-file drop target.
- `src/components/audio/TrackLibrary.tsx`: selected/playing queue rows.
- `src/components/visualizers/*.tsx`: the five isolated Canvas renderers and rack composition.
- `src/components/ui/Panel.tsx`, `Led.tsx`, `VhsNoise.tsx`: physical-device primitives.
- `src/hooks/useAudioEngine.ts`: shared media element, Web Audio graph, state events, and commands.
- `src/hooks/useCanvasSurface.ts`: responsive DPR-aware canvas dimensions.
- `src/hooks/useAnimationFrame.ts`: one cancellable stable render loop.
- `src/lib/audio/files.ts`: validation, display names, metadata loading, object URL creation.
- `src/lib/audio/midSide.ts`: sample conversion helpers.
- `src/lib/audio/frequency.ts`: FFT-bin and logarithmic-position helpers.
- `src/lib/audio/queue.ts`: pure previous/next/end transition decisions.
- `src/lib/utils/formatTime.ts`: timestamps including hour-long tracks.
- `src/types/audio.ts`: track, playback, and analyser contracts.
- `src/test/setup.ts`: DOM test setup.

---

### Task 1: Initialize and verify the project

**Files:**
- Create through generator: `package.json`, `src/app/*`, configuration files
- Modify: `package.json`
- Create: `vitest.config.ts`, `src/test/setup.ts`

**Interfaces:**
- Consumes: the exact initialization command from `WorkFlow.md`
- Produces: `npm test`, `npm run lint`, and `npm run build` scripts

- [ ] **Step 1: Generate the required Next.js application**

Run:

```powershell
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Expected: the generator completes with App Router, TypeScript, Tailwind, and ESLint enabled.

- [ ] **Step 2: Add the browser test harness**

Run:

```powershell
npm install --save-dev vitest jsdom @testing-library/react @testing-library/jest-dom
```

Add `"test": "vitest run"` and configure `vitest.config.ts` with `environment: "jsdom"`, `setupFiles: ["./src/test/setup.ts"]`, and the `@` alias.

- [ ] **Step 3: Verify the untouched scaffold**

Run:

```powershell
npm run lint
npm run build
```

Expected: both commands exit zero.

- [ ] **Step 4: Establish an implementation branch once Git exists**

Run:

```powershell
git switch -c feat/vhs-audio-visualizer
```

Expected: the working branch is `feat/vhs-audio-visualizer`.

### Task 2: Define tested domain utilities

**Files:**
- Create: `src/types/audio.ts`
- Create: `src/lib/utils/formatTime.ts`, `src/lib/utils/formatTime.test.ts`
- Create: `src/lib/audio/midSide.ts`, `src/lib/audio/midSide.test.ts`
- Create: `src/lib/audio/frequency.ts`, `src/lib/audio/frequency.test.ts`
- Create: `src/lib/audio/queue.ts`, `src/lib/audio/queue.test.ts`

**Interfaces:**
- Produces: `formatTime(seconds): string`, `toMidSide(left,right,mid,side): void`, `frequencyForBin(bin,sampleRate,fftSize): number`, `logFrequencyPosition(frequency,min,max): number`, `getPreviousIndex(index,time): number`, `getNextIndex(index,count): number | null`

- [ ] **Step 1: Write failing tests for time formatting**

```ts
expect(formatTime(222)).toBe("03:42");
expect(formatTime(3822)).toBe("01:03:42");
expect(formatTime(Number.NaN)).toBe("00:00");
```

Run `npm test -- src/lib/utils/formatTime.test.ts`; expected failure: module does not exist.

- [ ] **Step 2: Implement `formatTime` and verify green**

Clamp invalid and negative input to zero, floor seconds, and add hours only when nonzero. Re-run the focused test; expected: all cases pass.

- [ ] **Step 3: Write failing tests for Mid/Side conversion**

```ts
toMidSide(new Float32Array([1, -1]), new Float32Array([1, 1]), mid, side);
expect([...mid]).toEqual([1, 0]);
expect([...side]).toEqual([0, -1]);
```

Run `npm test -- src/lib/audio/midSide.test.ts`; expected failure: module does not exist.

- [ ] **Step 4: Implement bounded Mid/Side conversion and verify green**

Iterate only to the shortest buffer length and fill the provided destination arrays. Re-run the focused test; expected: pass.

- [ ] **Step 5: Write failing tests for frequency mapping**

```ts
expect(frequencyForBin(100, 48000, 4096)).toBeCloseTo(1171.875);
expect(logFrequencyPosition(100, 100, 5000)).toBe(0);
expect(logFrequencyPosition(5000, 100, 5000)).toBe(1);
```

Run `npm test -- src/lib/audio/frequency.test.ts`; expected failure: module does not exist.

- [ ] **Step 6: Implement mapping helpers and verify green**

Use `bin * sampleRate / fftSize` and normalized natural logarithms with a `[0,1]` clamp. Re-run focused tests; expected: pass.

- [ ] **Step 7: Write failing queue-decision tests**

```ts
expect(getPreviousIndex(2, 4)).toBe(2);
expect(getPreviousIndex(2, 1)).toBe(1);
expect(getPreviousIndex(0, 0)).toBe(0);
expect(getNextIndex(1, 3)).toBe(2);
expect(getNextIndex(2, 3)).toBeNull();
```

Run `npm test -- src/lib/audio/queue.test.ts`; expected failure: module does not exist.

- [ ] **Step 8: Implement queue helpers and verify the utility suite**

Run `npm test`; expected: all utility tests pass.

### Task 3: Build tested local-file loading

**Files:**
- Create: `src/lib/audio/files.ts`, `src/lib/audio/files.test.ts`
- Modify: `src/types/audio.ts`

**Interfaces:**
- Produces: `isSupportedAudioFile(file): boolean`, `stripAudioExtension(name): string`, `loadAudioTracks(files): Promise<{ tracks: AudioTrack[]; rejected: string[] }>`

- [ ] **Step 1: Write failing validation tests**

```ts
expect(isSupportedAudioFile(new File([], "tape.WAV", { type: "audio/wav" }))).toBe(true);
expect(isSupportedAudioFile(new File([], "notes.txt", { type: "text/plain" }))).toBe(false);
expect(stripAudioExtension("THE RETURN.mp3")).toBe("THE RETURN");
```

Run `npm test -- src/lib/audio/files.test.ts`; expected failure: module does not exist.

- [ ] **Step 2: Implement validation and title extraction**

Accept case-insensitive `.wav`/`.mp3` extensions and compatible MIME types, but require the valid extension. Re-run focused tests; expected: pass.

- [ ] **Step 3: Implement metadata loading through an injected browser audio element**

`loadAudioTracks` creates an independent `crypto.randomUUID()` and object URL per valid file, waits for `loadedmetadata`, rejects corrupt files individually, and revokes URLs for rejected metadata. The production function exposes a default DOM factory while tests inject a deterministic fake.

- [ ] **Step 4: Test mixed valid/invalid batches and duplicate names**

Assert that valid results keep input order, rejected names are returned, duplicate filenames get different IDs, and displayed titles omit extensions. Run the focused test; expected: pass.

### Task 4: Implement the single-source audio engine

**Files:**
- Create: `src/hooks/useAudioEngine.ts`
- Create: `src/hooks/useAudioEngine.test.tsx`
- Modify: `src/types/audio.ts`

**Interfaces:**
- Produces: `AudioEngine` containing state, `analysersRef`, `addTracks`, `selectTrack`, `togglePlayback`, `previous`, `next`, `seek`, `setVolume`, and `toggleMute`

- [ ] **Step 1: Write failing hook tests around injected media and graph factories**

Test that track selection changes the sole media element source, selecting while paused stays paused, selecting while playing calls play, final `ended` leaves the last track selected and paused, and added tracks do not change current time.

Run `npm test -- src/hooks/useAudioEngine.test.tsx`; expected failure: hook does not exist.

- [ ] **Step 2: Implement media event synchronization**

Create the audio element once, subscribe to `timeupdate`, `durationchange`, `play`, `pause`, `ended`, and `error`, and expose transport state without placing analyser arrays into React state.

- [ ] **Step 3: Implement the reusable Web Audio graph**

On the first playback gesture, create or resume one `AudioContext`, connect one media source through gain to destination, create FFT analysers with size 4096, create left/right analysers through a splitter, and store the bundle in one stable ref.

- [ ] **Step 4: Implement queue and transport commands**

Apply the tested pure queue decisions, preserve play state on manual navigation, clamp seek/volume, and keep end-of-queue state. Re-run hook and full tests; expected: pass.

### Task 5: Add reusable Canvas infrastructure

**Files:**
- Create: `src/hooks/useCanvasSurface.ts`
- Create: `src/hooks/useAnimationFrame.ts`
- Create: `src/components/ui/Panel.tsx`, `Led.tsx`, `VhsNoise.tsx`
- Create: `src/components/visualizers/VisualizerFrame.tsx`

**Interfaces:**
- Produces: `useCanvasSurface(canvasRef)` returning CSS pixel dimensions and DPR-scaled context; `useAnimationFrame(draw, enabled)` with stable cancellation; physical UI primitives

- [ ] **Step 1: Write failing lifecycle tests**

Assert that resize caps DPR at two and cleanup disconnects ResizeObserver/cancels requestAnimationFrame. Run focused tests; expected failure: hooks do not exist.

- [ ] **Step 2: Implement the minimal hooks**

Use one ResizeObserver per mounted canvas and one animation loop per mounted visualizer. Store the latest draw callback in a ref to avoid restarting loops after renders.

- [ ] **Step 3: Build accessible equipment primitives**

`Panel` provides semantic title/serial slots and CRT glass; `Led` includes visible text state; `VhsNoise` is `aria-hidden`. Run tests and lint; expected: zero failures.

### Task 6: Implement the five real-signal visualizers

**Files:**
- Create: `src/components/visualizers/Spectrogram.tsx`
- Create: `src/components/visualizers/Waveform.tsx`
- Create: `src/components/visualizers/Stereometer.tsx`
- Create: `src/components/visualizers/Oscilloscope.tsx`
- Create: `src/components/visualizers/Spectrum.tsx`
- Create: `src/components/visualizers/VisualizerRack.tsx`

**Interfaces:**
- Consumes: `AudioAnalyserBundle | null`, `useCanvasSurface`, `useAnimationFrame`, frequency and Mid/Side helpers
- Produces: a responsive rack with five always-mounted modules

- [ ] **Step 1: Add render-contract tests**

Render the rack without analysers and assert all five English titles and five `NO SIGNAL` labels are present. Run the focused test; expected failure: rack does not exist.

- [ ] **Step 2: Implement Spectrogram and Spectrum**

Spectrogram stores a bounded scrolling `Uint8Array` history and paints a particle grid from real analyser bytes. Spectrum maps only bins whose computed frequency is 100–5000 Hz into logarithmic columns with reusable peak arrays and decay.

- [ ] **Step 3: Implement Waveform and Stereometer**

Waveform fills reusable left/right arrays, derives Side/Mid destinations, and draws two zero-centered traces. Stereometer samples the same stereo buffers into a bounded persistent particle ring using `x = left - right`, `y = left + right`, and age-based fading.

- [ ] **Step 4: Implement the triggered Oscilloscope**

Read live time-domain data, search a bounded first-half window for an upward zero crossing, and draw one thin amplitude-colored trace with controlled persistence.

- [ ] **Step 5: Verify analyser behavior statically and in tests**

Assert `fftSize = 4096`, 100/5000 bounds, Mid/Side labels, and no random primary data generation. Run `npm test` and `npm run lint`; expected: zero failures.

### Task 7: Build the custom player, uploader, and library

**Files:**
- Create: `src/components/audio/AudioPlayer.tsx`, `PlayerControls.tsx`, `SeekBar.tsx`, `VolumeControl.tsx`, `TrackUploader.tsx`, `TrackLibrary.tsx`
- Create: matching component tests

**Interfaces:**
- Consumes: the `AudioEngine` public commands and state
- Produces: accessible hardware transport, drag/drop upload, and cassette queue rows

- [ ] **Step 1: Write failing player interaction tests**

Assert disabled empty transport, current title/index/time/state, play callback, custom seek input, mute state, volume percentage, queue position, and `END OF QUEUE`. Run focused tests; expected failure: components do not exist.

- [ ] **Step 2: Implement the player controls and displays**

Use native buttons and range inputs, make play/pause visually dominant, show opposite-side times, and expose default/hover/pressed/disabled/focus states through stable class names.

- [ ] **Step 3: Write failing uploader/library tests**

Assert the hidden multiple input accepts `.wav,.mp3`, dropped files reach the callback, active rows expose `aria-current`, and empty library copy is `NO AUDIO LOADED`.

- [ ] **Step 4: Implement uploader and library**

Manage drag depth to prevent flicker, return successful and rejected state copy, and render queue position, title, duration, format, and playing/selected indicators.

- [ ] **Step 5: Run the component and full test suites**

Expected: all interactions pass without console warnings.

### Task 8: Compose the application and keyboard behavior

**Files:**
- Create: `src/components/VhsVisualizerApp.tsx`
- Modify: `src/app/page.tsx`, `src/app/layout.tsx`
- Create: `src/components/VhsVisualizerApp.test.tsx`

**Interfaces:**
- Consumes: engine, rack, player, uploader, library
- Produces: the complete one-page application

- [ ] **Step 1: Write failing shell tests**

Assert heading/rack/player/library ordering, interface-level errors, and keyboard command routing while editable controls are ignored.

- [ ] **Step 2: Implement application composition**

Render header telemetry, visualizer rack, player, uploader, and library around the one engine instance. Add the English loading and error strips.

- [ ] **Step 3: Implement keyboard commands**

Space toggles playback; Left/Right seek five seconds; Up/Down adjust volume by 0.05; M toggles mute; N/P navigate. Ignore input, textarea, select, button, and contenteditable targets.

- [ ] **Step 4: Verify application tests**

Run `npm test`; expected: all tests pass.

### Task 9: Apply the VHS/CRT visual system and responsive layout

**Files:**
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: semantic class names from all components
- Produces: the exact palette, physical hierarchy, restrained VHS atmosphere, and responsive layouts in the design spec

- [ ] **Step 1: Define design tokens and physical surfaces**

Add the seven approved colors, condensed/system display stack, monospaced telemetry stack, metal gradients, inset CRT glass, screws, labels, ventilation, and readable focus rings.

- [ ] **Step 2: Add purposeful motion and interaction states**

Add subtle grain, scanlines, rare tracking displacement, LED glow, selected-row scanline, slider feedback, and hardware button depression. Disable nonessential animation under `prefers-reduced-motion: reduce`.

- [ ] **Step 3: Implement layout breakpoints**

Wide screens use a 6-column rack where top modules span three columns and lower modules span two; medium screens use two columns; narrow screens stack every module and reorganize the player without hiding controls.

- [ ] **Step 4: Run lint, tests, and build**

Expected: every command exits zero.

### Task 10: Browser verification, performance pass, and final audit

**Files:**
- Modify only files implicated by verified failures
- Update: `docs/superpowers/plans/2026-08-12-vhs-audio-visualizer.md` checkboxes

**Interfaces:**
- Consumes: the completed application
- Produces: evidence for every Definition of Done requirement

- [ ] **Step 1: Start the local server and inspect desktop/mobile layouts**

Verify empty states, no horizontal overflow, rack hierarchy, keyboard focus, reduced motion, and all interaction states in a real browser.

- [ ] **Step 2: Exercise real audio**

Load WAV and MP3 samples, add multiple files, drag/drop, switch tracks while paused and playing, seek, change volume, mute, navigate previous/next, observe automatic progression, and verify the final item stops without looping.

- [ ] **Step 3: Inspect all five live canvases and the graph lifecycle**

Verify they respond to the same track, Spectrogram/Stereometer persistence is bounded, Spectrum ignores bins outside 100 Hz–5 kHz, no duplicate loops or AudioContexts appear, and no important console errors occur.

- [ ] **Step 4: Run fresh automated verification**

```powershell
npm test
npm run lint
npm run build
```

Expected: all commands exit zero with no test, ESLint, TypeScript, or production build failures.

- [ ] **Step 5: Audit the 92-item source specification**

Re-read `WorkFlow.md`, map every checklist item to code and browser evidence, and fix any uncovered gap before completion is claimed.
