# Maximum optimization results

Date: 2026-09-02. Baseline: `6319d92` on `codex/technical-optimization`.

The site now sends less initial JavaScript, avoids unnecessary React and canvas work, and spends less time calculating instrument data. The existing design, canvas resolution, particle counts, audio graph, sampling cadence, controls, and EN/RU localization remain in place. No dependencies were added.

## Initial JavaScript

Measured from distinct JavaScript URLs advertised by the production home page. Modern-browser totals exclude the unchanged `noModule` legacy script. Gzip totals sum each file compressed individually; they are estimates of compressed payload size, not a measured network transfer or loading time.

| Scope | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Modern initial JavaScript | 640,657 bytes | 518,945 bytes | 19.0% |
| Modern initial JavaScript, gzip | 195,393 bytes | 155,728 bytes | 20.3% |
| All advertised scripts, including legacy | 753,251 bytes | 631,539 bytes | 121,712 bytes |
| All advertised scripts, gzip | 235,020 bytes | 195,355 bytes | 39,665 bytes |

The custom cursor's animation implementation loads after pointer and motion capability checks. Supported desktop users still receive it after hydration; unsupported coarse-pointer or reduced-motion devices avoid that import. This is an initial-load reduction, not a claim that desktop users download 19% less JavaScript over the entire session.

## Rendering and calculation changes

- Memoized rack, library, uploader, background, and peak-effect boundaries. Three playback-time updates previously caused three extra rack/library/uploader renders each; the regression now measures zero, while time and language displays continue updating.
- All five instruments skip canvas painting when fully outside the viewport. Signal history, particle positions, and peak state keep advancing. A hidden pause paints one final frame without advancing state again; returning during playback clears stale trails before live drawing resumes.
- Spectrogram colors use a lazy, exact lookup keyed by byte amplitude and column age. Exhaustive tests compare all 18,432 possible entries with the original formula. FFT row indices are reused while the input length stays unchanged.
- Stereometer easing calculations drop from 2,400 to three per high-quality frame, with all 2,400 particles retained.
- Stereo waveform statistics use one fused pass and no intermediate mid/side sample buffers, preserving the original Float32 rounding.
- Constant waveform gradients need two stops instead of 360. Transition stops and plateau endpoints remain intact.
- Already-cleared peak CSS variables are no longer removed on every idle frame. Clearing an inactive WebGL effect avoids a full-screen shader draw. Unchanged canvas dimensions no longer reset their drawing surfaces.

## Repeatable calculation benchmark

Node 24.19.0, nine alternating before/after rounds, median per operation after warmup. The script loads the original helpers from Git and compares them with the current helpers in one process.

| Workload | Before | After | Result |
| --- | ---: | ---: | ---: |
| 2,448 exact spectrogram colors, warm cache | 1.181544 ms | 0.007964 ms | 148.4× faster |
| 4,096 stereo waveform samples | 0.016724 ms | 0.009293 ms | 1.80× faster |
| 2,400 particle motion factors | 0.036120 ms | 0.013708 ms | 2.63× faster |
| 360 constant gradient columns | 0.005065 ms | 0.001278 ms | 3.96× faster |
| 360 varying gradient columns | 0.007334 ms | 0.007912 ms | 0.000578 ms slower |

The gradient branch has a small calculation cost on continuously changing inputs in exchange for eliminating redundant native gradient calls on equal-color runs. These are JavaScript microbenchmarks, not browser FPS, GPU, battery, or whole-site speed measurements.

The color cache trades bounded memory for repeated work: at most 72 × 256 strings per spectrogram. Eagerly populating all 17,352 visible-amplitude entries took 17.3 ms in the benchmark; the application populates entries on demand and releases the cache with the component. No unbounded cache or new animation clock was introduced.

Off-screen numerical history is preserved. Short pixel trails restart when an active instrument returns to view; hidden trail pixels are not reconstructed. Normal visible rendering retains its original settings and geometry.

## Verification

- Full suite: **211 tests passed in 40 files**. The suite still emits React test-environment `act` warnings in several cursor tests; there are no test failures.
- ESLint: passed with no warnings or errors.
- TypeScript with unused-local and unused-parameter checks: passed.
- Production build: passed; home page remains statically prerendered.
- Whitespace validation: passed.
- Independent review: passed after fixing hidden-pause images and frozen trails on re-entry.
- Production browser QA: local WAV and MP3 upload/playback, automatic next track, previous/next controls, repeated pause/resume, seek, all five instruments, and EN/RU switching without resetting playback. The final build was additionally checked at a 375 × 812 viewport, including hidden playback → pause → visible and live re-entry, then restored to desktop width. Paused instrument images remained populated. Browser console reported no warnings or errors.

No browser FPS or battery benchmark was performed. No claim of a universal maximum or pixel-identical hidden trail reconstruction is made.

## Reproduce

```powershell
npm test -- --reporter=dot
npm run lint
npx tsc --noEmit --noUnusedLocals --noUnusedParameters
npm run build
node scripts/measure-build.mjs
node scripts/benchmark-rendering.mjs 6319d92
git -c core.safecrlf=false diff --check
```

`measure-build.mjs` reports all advertised files; subtract the `noModule` file shown in the generated HTML for modern-browser totals. The baseline build totals were captured before editing. Rebuild the baseline in a separate checkout to reproduce those totals without disturbing this workspace.

The local production preview runs at http://127.0.0.1:3002. Changes remain uncommitted for review.
