# Stereometer Full-Field Motion Design

## Purpose

Replace the delayed circular-refresh stereometer behavior with a continuously active bipolar field. All 2,400 particles must respond to the current song every animation frame, move at a stable frame-rate-independent speed, and remain visible without reveal resets, fade-outs, or slot-by-slot popping.

## Confirmed Root Cause

The current renderer updates only 24 of 2,400 particle targets per frame. At 60 FPS, a complete field refresh therefore takes about 1.7 seconds. Each refreshed slot also resets its reveal progress to zero and takes 1.35 seconds to return to full visibility. Together, those behaviors create delayed response, disappearance, and visible frame-by-frame pop-in.

## Full-Field Signal Mapping

Keep one fixed typed-array buffer containing exactly 2,400 particles. Every animation frame, resample the current left and right time-domain arrays across all particle indices. Derive every particle target directly from the current stereo signal:

```text
x = clamp(Left - Right, -1, 1)
y = clamp(Left + Right, -1, 1)
value = clamp(hypot(x, y), 0, 1)
```

If 2,400 particles exceed the analyser sample count, cycle or interpolate deterministically through the available samples. Do not use randomness or synthetic motion.

## Motion Model

Each particle stores current X/Y, target X/Y, and bipolar magnitude. Remove reveal progress from the particle layout entirely.

On the first active frame, initialize current and target coordinates to the same real-signal-derived positions. This prevents particles from flying outward from the center or appearing progressively.

On every later frame:

1. update all target coordinates and magnitudes from the current samples;
2. calculate one frame-rate-independent motion factor from animation delta time;
3. move every current coordinate toward its target using that shared factor;
4. draw every particle.

Use exponential time-based smoothing so the perceived response remains consistent at 30, 60, and 120 Hz. The response must be substantially faster than the previous 24-slot ring update while remaining visually smooth.

## Visibility and Color

Every initialized particle is always rendered. There is no age, reveal, birth, lifetime, fade-in, or fade-out state.

Opacity continues to use the approved magnitude curve:

- low-value particles retain a subtle nonzero minimum opacity;
- increasing values become progressively more opaque;
- high-value particles remain strongest.

Color continues to use the shared continuous analog gradient from blue-gray through dirty yellow and amber to muted red. Both opacity and color remain derived from the particle's current real-signal magnitude.

## Canvas Persistence

The screen background may use a restrained translucent clear for CRT character, but the particles themselves must not rely on previous Canvas pixels for persistence. Every frame redraws all 2,400 particles from the persistent data buffer. A background clear must never cause the particle field to disappear because each particle is immediately redrawn.

Pausing preserves the latest drawn frame. Resuming continues from the stored particle coordinates and immediately updates all targets from current audio.

## Performance

- Fixed particle count: exactly 2,400.
- One reusable typed array; no unbounded history.
- No per-particle object or array allocation in the animation loop.
- Calculate the delta-time motion factor once per frame.
- Update and draw all particles in one bounded loop where practical.
- No React state updates during animation.

Updating 2,400 particles per frame is intentional. The calculations are scalar arithmetic and Canvas rectangles; allocation-free implementation keeps the workload predictable.

## Verification

Automated tests will verify:

- particle stride no longer contains reveal/lifetime state;
- initialization places current coordinates directly on real signal targets;
- every particle target is refreshed on each update call;
- low magnitudes retain nonzero opacity;
- no particle visibility function can return zero for an initialized particle;
- motion factor is delta-time based and clamped safely;
- empty analyser input remains safe.

Browser verification with asymmetric stereo audio will confirm:

- the full field reacts immediately to changing audio;
- particles do not disappear or repopulate in waves;
- movement remains smooth at a constant perceived response speed;
- the field remains visible during sustained quiet passages;
- pausing preserves the field and resuming does not pop particles in;
- browser warnings and errors remain empty.
