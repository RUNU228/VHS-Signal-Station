# Waveform Color and Persistent Stereometer Design

## Purpose

Refine two live Canvas instruments without changing the audio transport or the other analyzers. The Waveform needs continuous, stable amplitude coloring. The Stereometer needs a large, persistent bipolar particle field whose visibility increases smoothly with signal value instead of particles expiring over time.

## Waveform Color Model

The existing real Side and Mid histories remain unchanged: each channel continues to scroll positive peaks, negative peaks, and RMS energy derived from the left and right time-domain samples.

Replace threshold-based color selection with a continuous amplitude gradient. The gradient interpolates through the established instrument palette:

- low value: analog blue-gray;
- moderate value: dirty yellow;
- strong value: amber;
- highest value: muted signal red.

Each Side and Mid channel maintains its own eased display level. The display level moves gradually toward the current measured peak, preventing single-frame amplitude changes from producing visible color flicker. Envelope fill, outline, RMS trace, and phosphor glow use the same interpolated color with different alpha values.

## Persistent Stereometer Field

Use one fixed Canvas buffer containing exactly 2,400 particles. Particles remain plain numeric data in a reusable typed array; no React elements or unbounded allocations are introduced.

On the first active signal frame, initialize the complete field from actual left/right samples using the bipolar mapping:

```text
x = Left - Right
y = Left + Right
```

After initialization, refresh a bounded subset of slots on each animation frame using a circular cursor. Every stored point therefore stays visible until real incoming signal data replaces that exact slot. There is no lifetime expiration or age-driven fade-out.

## Particle Visibility and Color

Particle opacity is based on the magnitude of its bipolar coordinate, not frequency and not random variation:

```text
value = clamp(hypot(x, y), 0, 1)
```

Map this value through a smooth easing curve. Low-value particles retain a subtle minimum opacity rather than disappearing; larger values become progressively more opaque. This preserves quiet detail while giving bass-heavy or otherwise strong stereo motion more visual weight.

Use the same continuous blue-gray through yellow, amber, and muted-red gradient as the Waveform. Color and opacity remain tied to real signal values. Coordinate interpolation continues to smooth the motion between consecutive bipolar positions.

## Idle and Playback Behavior

Before any audio graph exists, the existing `NO SIGNAL` state remains unchanged. During active playback, all initialized particles remain rendered. Pausing preserves the latest Canvas field instead of clearing its particle data; playback continues updating the same fixed buffer when resumed.

## Performance

- Fixed particle count: 2,400.
- Reuse a typed array for all particle attributes.
- Initialize once, then update only a subset of slots per frame.
- Avoid per-frame arrays and random motion.
- Continue drawing through `requestAnimationFrame` outside React state.

## Verification

Automated tests will cover:

- continuous color interpolation at low, middle, and high values;
- clamping outside the supported value range;
- nonzero minimum opacity for low-value particles;
- monotonically increasing opacity as bipolar value rises;
- persistent visibility without lifetime-based decay;
- fixed particle count and real-signal initialization behavior through focused helper tests.

Browser verification will use asymmetric stereo audio to confirm that:

- Side and Mid colors transition smoothly without threshold flashes;
- the stereometer immediately forms a dense bipolar field;
- quiet particles remain faintly visible;
- stronger particles are more opaque and warmer;
- older particles persist until circular replacement;
- the browser console remains clean.
