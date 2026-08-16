# Audio-Reactive WebGL Update Verification

**Date:** 2026-08-16

**Branch:** `main`

**Accepted baseline:** `3752611` (`fix: enforce peak effect invariants`)

## Scope and outcome

Task 8 verified the shared analysis clock, renderer lifecycle cleanup, track-reset behavior, WebGL fallback, reduced-motion bounds, low-quality pixel budgets, animation/allocation hot paths, responsive layout, and deterministic signal profiles. One update regression was found and fixed: `AudioReactiveBackground` retried a failed `canvas.getContext("2d")` lookup on every eligible published frame. The effect now caches either the acquired context or the failed `null` result, keeping the fallback inert.

The unrelated untracked `audio_visualizer_update_spec.md` was preserved and excluded from every staging command.

## Lifecycle RED and GREEN

The mandated command was attempted exactly:

```text
pnpm exec vitest run src/hooks/useAudioAnalysis.test.tsx src/components/effects/PeakEffectsLayer.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts
'vitest' is not recognized as an internal or external command
exit 1 before test collection
```

The active Codex runtime supplies a fallback `pnpm.cmd` that does not prepend the project-local binary directory for `pnpm exec`; `node_modules/.bin/vitest.cmd` exists and is Vitest 4.1.10. The equivalent installed runner was therefore used, matching the exact test arguments.

Baseline before Task 8 assertions:

```text
.\node_modules\.bin\vitest.cmd run src/hooks/useAudioAnalysis.test.tsx src/components/effects/PeakEffectsLayer.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts
4 files passed, 45 tests passed, exit 0
```

RED after the new lifecycle/performance assertions:

```text
.\node_modules\.bin\vitest.cmd run src/hooks/useAudioAnalysis.test.tsx src/hooks/useVisualizationFrame.test.tsx src/components/effects/PeakEffectsLayer.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts
1 file failed / 4 passed; 1 test failed / 48 passed; exit 1
Expected failure: getContext("2d") was called 3 times rather than once after a null result.
```

GREEN after the tri-state context cache:

```text
.\node_modules\.bin\vitest.cmd run src/hooks/useAudioAnalysis.test.tsx src/components/effects/PeakEffectsLayer.test.tsx src/components/ui/AudioReactiveBackground.test.tsx src/app/globals.test.ts
4 files passed, 47 tests passed, exit 0

.\node_modules\.bin\vitest.cmd run src/hooks/useVisualizationFrame.test.tsx
1 file passed, 2 tests passed, exit 0
```

Independent review requested direct rack-level cleanup proof. The rack fixture was extended with a separately named unmount test, then `useVisualizationFrame` was temporarily mutated to subscribe without returning its cleanup callback. No production change was retained.

```text
RED — missing-cleanup mutation:
.\node_modules\.bin\vitest.cmd run src/components/visualizers/VisualizerRack.test.tsx
1 file failed; 1 test failed / 4 passed; exit 1
Expected 0 listeners after unmount, received 5.

GREEN — original production cleanup restored unchanged:
.\node_modules\.bin\vitest.cmd run src/components/visualizers/VisualizerRack.test.tsx
1 file passed; 5 tests passed; exit 0
```

The assertions now demonstrate:

- repeated hidden notifications cancel only the one pending root RAF; repeated visible notifications schedule only one replacement RAF; unmount cancels it;
- the mounted rack creates five live renderer subscriptions and removes all five on unmount; the shared hook also proves that the latest callback receives a publication after rerender, while background and peak-layer tests independently prove their subscriptions are removed;
- a source revision clears all six temporary peak CSS variables and sends the neutral WebGL clear frame;
- a cancelable `webglcontextlost` event is prevented, disposes the renderer, and remains non-fatal while CSS fallback output continues; restoration recreates and resizes the renderer;
- LOW quality caps peak-layer DPR at `1.25` and background work at a 300×150 backing surface for a 400×200 CSS surface at device DPR 3;
- reduced motion writes `0px`, `0px`, and `0` for peak shake/scale and the stylesheet enforces the four displacement variables as zero with `!important`.

## Hot-path audit

Command:

```text
rg -n "requestAnimationFrame|get(ByteFrequency|FloatTimeDomain)Data|new (Float32Array|Uint8Array)" src/hooks src/components src/lib
exit 0
```

Findings:

- Production `requestAnimationFrame` appears only in `src/hooks/useAudioAnalysis.ts`; no visualizer, background, or peak-effect component owns another RAF. Additional matches are test stubs/assertions. The current smooth-cursor implementation has no explicit RAF match in the audited paths.
- Production analyser reads appear only in `useAudioAnalysis.ts` (`getByteFrequencyData` once and three `getFloatTimeDomainData` calls per sampled frame). Additional matches are analyser test doubles/assertions.
- `useAudioAnalysis` typed arrays allocate when an analyser shape first appears or changes. WebGL vertex data allocates during renderer initialization. Stereometer fields and waveform histories allocate at creation or quality/size changes. Spectrogram/Spectrum arrays are mount-time refs. Background and Waveform scratch arrays grow only when their required size changes; normal published-frame draws reuse them.
- The new background context cache also removes repeated failed context acquisition from its eligible-frame path.

## Complete automated verification

| Command | Result | Evidence |
|---|---|---|
| `pnpm test` | pass, exit 0 | 30 files and 145 tests passed; no unhandled rejection or React `act` warning was printed |
| `pnpm lint` | pass, exit 0 | `eslint` completed without diagnostics |
| `pnpm build` | pass, exit 0 | Next.js 16.3.0 compiled, typechecked, generated 4/4 static pages, and prerendered `/` |
| `git diff --check` | pass, exit 0 | no whitespace errors; only Windows LF-to-CRLF checkout notices |

The first production-build attempt caught a test-only nullable listener cast in the new latest-callback assertion. The test now initializes a type-safe failure sentinel and replaces it with the subscribed wrapper; its focused test and a fresh production build then passed. A later final lint gate caught and removed an unused-parameter warning from an intermediate mock-call implementation before the clean results above were recorded.

## Deterministic signal profiles

`useAudioAnalysis.test.tsx` now feeds real hook sampling through synthetic `AnalyserNode` fixtures for all requested profiles. Each fixture set is run twice and the complete resulting snapshot structures must be exactly equal.

| Profile | Automated evidence |
|---|---|
| Quiet | remains `IDLE` |
| Normal | energy exceeds quiet, but produces no peak event |
| Bass-heavy | low energy exceeds both mid and high energy |
| High-frequency-heavy | high energy exceeds both low and mid energy |
| Sustained loud | first frame produces event 1; second stays at event 1 and has lower transient energy |
| Sharp transient | quiet-to-clipped transition produces positive peak strength and more transient energy than sustained loud frame 2 |
| Clipped | event and nonzero seed are produced; all numeric public fields remain finite and within `[-1, 1]` (energy fields are nonnegative by their production contract) |

No representative local audio file exists in the repository. No file was supplied through the task, so subjective manual checks for blue/yellow/red travel, bass physicality, high-frequency sharpness, and transient VHS feel were not performed.

## Browser verification

The Codex in-app Chromium browser inspected the live `pnpm dev` page. The app returned `GET / 200`; screenshots and DOM measurements were taken at each required size.

| Viewport | Horizontal overflow | Five readable visualizers | Controls | Background | Peak layer | Console |
|---|---|---|---|---|---|---|
| 375×812 | none | yes; five 326×318px panels | all in-bounds, minimum 44px target | present, full viewport, visibly subtle at idle | `z-index: -1`, pointer-inert, below station UI | 0 warnings/errors |
| 768×1024 | none | yes; four 354×331px plus one 714×339px panel | all in-bounds, minimum 44px target | present, full viewport, visibly subtle at idle | same | 0 warnings/errors |
| 1440×900 | none | yes; two 671×521px plus three 444×398px panels | all in-bounds, minimum 44px target | present, full viewport, visibly subtle at idle | same | 0 warnings/errors |
| 2560×1440 | none | yes; two 881×519px plus three 583×519px panels | all in-bounds, minimum 44px target | present, full viewport, visibly subtle at idle | same | 0 warnings/errors |

Transport/seek/volume controls were present and in bounds; transport controls were correctly disabled in the no-audio state, while the audio-load action remained enabled.

The connected browser exposes viewport overrides but no preferred-motion emulation and no WebGL-disable/context-loss control. Therefore a live reduced-motion desktop variant and live no-WebGL mobile variant were **not performed**. Automated DOM/WebGL lifecycle tests cover null initialization, runtime loss/restoration, bounded CSS fallback, low-quality DPR, and zero reduced-motion shake, but those results are not presented as manual browser checks.

The temporary browser tab was closed, the viewport override was reset, the complete `pnpm dev` process tree was stopped, and port 3000 had no listener afterward.

## Self-review and limitations

- The change set is confined to verification tests, the failed-context cache, and this report; it does not alter visual design, audio processing, public interfaces, or playback behavior.
- Independent review found that generic hook cleanup plus a five-subscription assertion did not directly prove rack-wide cleanup. `VisualizerRack.test.tsx` now has a separately named regression asserting five live listeners before unmount and zero afterward; a controlled missing-cleanup mutation produced the expected 5-versus-0 RED before the production hook was restored unchanged for GREEN.
- Mutation review: removing the hidden-frame guard, allowing duplicate resume RAFs, retaining any rack renderer subscription, skipping source-revision cleanup, throwing after context loss, removing DPR caps, emitting reduced-motion shake, reusing a stale draw callback, or retrying a null 2D context breaks a focused assertion.
- No physical-GPU shader output or actual audio playback was exercised. WebGL contract/lifecycle behavior is automated with a renderer test double, while browser inspection covered the real idle page and real layout.
- `pnpm exec vitest` remains unusable under the managed fallback pnpm shim; `pnpm test` and the checked-in local Vitest executable work normally.

## Final peak-budget and reduced-motion fix

An independent final review found that the variant label did not control the rendered budget: RGB separation, noise, flash, and crackle were populated for every recipe, while `burstCount` was never consumed. Reduced motion only removed shake and slice displacement, leaving the rapidly changing full-screen shader treatments active.

The final fix gives each variant an explicit budget:

- `glow` renders only a restrained warm glow;
- `burst` renders only a seeded radial WebGL burst through new `u_burst` and `u_progress` uniforms;
- `shake` uses only the existing physical movement path;
- `glitch-band` uses slice displacement and its related RGB accent without noise, flash, crackle, or particles;
- `combined` remains the extreme-only multi-treatment recipe.

Reduced motion now always projects the confirmed peak to a glow recipe. Shake, slice, RGB separation, noise, crackle, and burst density are all exactly zero, and the renderer uploads a zero time uniform so the former 30/45 Hz band and grain inputs cannot animate the output. The glow remains bounded at `0.05` and preserves color/brightness information.

### Final-fix RED and GREEN

The focused tests were added before production changes. The production mutation each test catches is the old all-variants budget, a renderer that omits or ignores burst density, or a reduced-motion renderer that uploads animated artifact inputs.

```text
RED:
.\node_modules\.bin\vitest.cmd run src/lib/effects/peakEffects.test.ts src/lib/webgl/vhsSignalRenderer.test.ts src/components/effects/PeakEffectsLayer.test.tsx
3 files failed; 6 tests failed / 26 passed; exit 1

Expected failures showed nonzero RGB/noise/crackle on glow and burst recipes,
a combined reduced-motion recipe with a nonzero burst, no u_burst/u_progress
renderer path, nonzero u_time/u_strength artifact output, and nonzero layer CSS
RGB/noise values.

GREEN:
.\node_modules\.bin\vitest.cmd run src/lib/effects/peakEffects.test.ts src/lib/webgl/vhsSignalRenderer.test.ts src/components/effects/PeakEffectsLayer.test.tsx
3 files passed; 32 tests passed; exit 0

Focused integration:
.\node_modules\.bin\vitest.cmd run src/lib/effects/peakEffects.test.ts src/lib/webgl/vhsSignalRenderer.test.ts src/components/effects/PeakEffectsLayer.test.tsx src/components/VhsVisualizerApp.test.tsx src/app/globals.test.ts
5 files passed; 52 tests passed; exit 0
```

The focused coverage asserts actual recipe fields, uploaded WebGL uniforms, and layer CSS/renderer arguments rather than relying on variant names alone. Existing exact `0.72`/`0.88` tier tests, deterministic seed tests, physical-movement gates, source-reset/same-ID cleanup, context loss/restoration, fallback, and LOW-quality DPR tests remain green.

### Fresh final verification

| Command | Result | Evidence |
|---|---|---|
| `pnpm test` | pass, exit 0 | 30 files and 149 tests passed |
| `pnpm lint` | pass, exit 0 | ESLint completed without diagnostics |
| `pnpm build` | pass, exit 0 | Next.js 16.3.0 compiled, typechecked, generated 4/4 static pages, and prerendered `/` |
| `git diff --check` | pass, exit 0 | no whitespace errors; only Windows LF-to-CRLF checkout notices |

### Final live-check limitation

The in-app browser loaded the final development page with `GET / 200`, found one `canvas.peak-effects-layer`, and reported no console warnings or errors. Its actual `prefers-reduced-motion: reduce` query was false. The browser exposes viewport and visibility controls only, with no preferred-motion emulation, so a live reduced-motion run was not performed. Automated recipe, uniform, layer, and stylesheet tests provide the reduced-motion evidence; they are not presented as a live browser check. No audio asset was available to trigger and subjectively inspect the new burst on a physical GPU.

The untracked user-owned `audio_visualizer_update_spec.md` remained untouched and excluded from staging.
