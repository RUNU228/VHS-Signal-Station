# Detailed Audio Visualizer Update Specification

## 1. General Goal

The goal of this update is to make the entire audio visualization system feel more responsive, more readable, and more physically connected to the strength of the currently playing audio signal.

The visualizers should not only react through shape and movement.

They should also communicate signal intensity through:

- color;
- particle density;
- movement intensity;
- distortion;
- glitch effects;
- screen shake;
- visual noise;
- short peak reactions.

The final result should make it immediately obvious whether the current audio signal is weak, medium, strong, or extremely strong.

All visual effects must remain synchronized with the actual audio signal.

The system must remain smooth and should not feel random.

---

# 2. Shared Audio Analysis System

All visualizers must use the same centralized audio analysis system.

Do not create separate independent audio analyzers for every visualizer unless technically necessary.

The audio analysis system should provide normalized values that can be reused across the entire interface.

Recommended shared values:

```ts
lowEnergy
midEnergy
highEnergy
overallEnergy
bassEnergy
transientEnergy
peakStrength
smoothedEnergy
```

Each value should preferably use a normalized range:

```text
0.0 → no signal
1.0 → maximum expected signal
```

Values may temporarily exceed `1.0` internally if useful for peak detection, but rendering values should normally be clamped or normalized.

The goal is to create one reliable signal state that controls all visualizers consistently.

---

# 3. Audio Frequency Analysis

Split the incoming audio signal into at least three main frequency ranges.

Suggested approximate ranges:

```text
LOW:
20 Hz – 250 Hz

MID:
250 Hz – 4 kHz

HIGH:
4 kHz – 20 kHz
```

These exact ranges can be adjusted if necessary for better visual behavior.

The important requirement is that low, mid, and high frequencies must be analyzed independently.

This allows the visual system to react differently depending on the frequency content of the music.

For example:

- kick drums and sub bass should strongly affect `lowEnergy`;
- vocals, snares, synth bodies, and instruments should mostly affect `midEnergy`;
- hi-hats, cymbals, noise, and sharp transients should mostly affect `highEnergy`.

---

# 4. Signal Smoothing

Raw FFT and waveform values must not be used directly for every visual property.

Raw audio values change too quickly and can create unpleasant flickering.

Add smoothing to the analyzed values.

Use interpolation such as:

```ts
smoothedValue += (targetValue - smoothedValue) * smoothingFactor
```

or an equivalent exponential smoothing system.

Different properties may use different smoothing speeds.

For example:

```text
Color transitions:
slow / medium smoothing

Particle movement:
medium smoothing

Screen shake:
fast response

Peak glitches:
very fast response

Background visualizer:
slow smoothing
```

The visual system should react quickly to strong hits while still remaining visually stable.

---

# 5. Unified Signal Color System

All audio visualizers must use one shared signal-based color system.

The primary color states are:

```text
LOW SIGNAL
Blue

MEDIUM SIGNAL
Yellow

HIGH SIGNAL
Red
```

These colors must not switch instantly.

The color must interpolate continuously depending on signal strength.

Suggested normalized mapping:

```text
0.00 – 0.35
Blue range

0.35 – 0.70
Blue → Yellow transition

0.70 – 1.00
Yellow → Red transition
```

This mapping should not be treated as a hard requirement if another curve feels more natural.

The important behavior is continuous interpolation.

---

# 6. Color Interpolation

Do not implement color changes using simple binary conditions like:

```ts
if (signal > 0.7) {
  color = red;
}
```

Instead, use smooth interpolation.

Conceptually:

```text
0% signal
BLUE

25% signal
BLUE

50% signal
BLUE/YELLOW MIX

65% signal
YELLOW

80% signal
YELLOW/RED MIX

100% signal
RED
```

Use RGB, HSL, HSV, or another suitable color interpolation method.

Avoid muddy colors during transitions.

The transition should visually remain:

```text
BLUE
↓
BLUE-YELLOW INTERMEDIATE
↓
YELLOW
↓
ORANGE
↓
RED
```

The transition must not suddenly jump through unrelated colors.

---

# 7. Frequency-Based Color Influence

Where technically appropriate, visualizers should also use the relative energy of each frequency band.

Example:

- dominant bass energy should increase the blue contribution;
- dominant mid-range energy should increase the yellow contribution;
- dominant high-frequency energy should increase the red contribution.

However, overall signal strength must still determine the general intensity level.

This means color behavior should combine:

```text
frequency content
+
signal strength
```

rather than only using one value.

---

# 8. Brightness and Saturation

Signal strength should also influence brightness and saturation.

Weak signal:

```text
darker
less saturated
less emissive
```

Strong signal:

```text
brighter
more saturated
more emissive
```

Extreme signal:

```text
very bright
high saturation
temporary overexposure-like flashes allowed
```

Do not make the entire website permanently bright.

Intensity must remain proportional to the audio signal.

---

# 9. Background Mini Visualizer

Add a new audio-reactive visualizer directly into the website background.

It must behave as part of the existing background design rather than as another foreground card.

The background visualizer should be visible throughout the main audio visualization page.

It must use the same audio source and analysis data as the primary visualizers.

---

# 10. Background Visualizer Appearance

The background visualizer should be subtle.

Possible visual styles include:

- thin waveform lines;
- soft spectrum bars;
- particle trails;
- abstract frequency waves;
- horizontal signal traces;
- circular or radial waves;
- faint frequency-grid deformation.

Choose the implementation that best fits the current website style.

Do not create a giant distracting waveform behind all controls.

The background effect must remain secondary.

---

# 11. Background Signal Behavior

At very low signal levels:

- movement should be minimal;
- opacity should remain low;
- particles or lines should move slowly;
- background should remain calm.

At medium signal levels:

- movement should become more noticeable;
- opacity can increase slightly;
- color should move toward yellow;
- particle activity should increase.

At high signal levels:

- movement should become stronger;
- red tones should appear;
- deformation may increase;
- more visual layers may become visible.

At extreme peaks:

- the background may briefly distort;
- short glitch lines may appear;
- displacement may occur;
- slight background shake may happen;
- brightness may briefly increase.

---

# 12. Background Visualizer Opacity

The background visualizer must never reduce readability.

Use controlled opacity.

Suggested approximate values:

```text
Idle:
0.03 – 0.08

Low signal:
0.05 – 0.12

Medium signal:
0.10 – 0.20

High signal:
0.15 – 0.30

Extreme peak:
temporary maximum around 0.35
```

These values are approximate.

They should be adjusted based on the existing background.

---

# 13. Background Visualizer Depth

The background visualizer should feel like it exists behind the interface.

Possible techniques:

- opacity;
- blur;
- depth scaling;
- parallax;
- slow movement;
- reduced contrast;
- masked areas around text.

Avoid placing bright lines directly behind important UI text.

---

# 14. Stereometer Improvement

The current Stereometer needs a visual quality improvement.

Main current problems to address:

- excessive softness;
- blurry particles;
- lack of fine detail;
- insufficient particle density;
- weak definition.

The new Stereometer should feel sharper and more precise.

---

# 15. Stereometer Sharpness

Reduce excessive blur.

If the current visualizer uses:

```text
Gaussian blur
canvas blur filters
large glow radius
motion blur
large bloom
```

reduce these effects significantly.

Particles and lines should have visible edges.

Some glow can remain, but the underlying geometry must stay readable.

---

# 16. Stereometer Particle Density

Increase the number of particles.

The exact amount depends on performance.

The goal is to make stereo movement feel more dense and detailed.

For example:

```text
Current:
100 particles

Potential updated range:
300 – 800 particles
```

This is only an example.

Use adaptive particle counts if necessary.

Desktop systems may use more particles than low-performance mobile devices.

---

# 17. Stereometer Particle Size

Use smaller particles than before if necessary.

More particles should not mean giant glowing blobs.

Recommended behavior:

```text
weak signal:
small particles

medium signal:
slightly larger particles

strong signal:
larger particles + stronger glow

extreme peak:
temporary particle expansion
```

---

# 18. Stereometer Particle Persistence

Particles should leave short trails where appropriate.

However, trails must remain controlled.

Too much persistence creates visual smearing.

Use:

- shorter trails;
- faster alpha decay;
- limited motion blur.

The goal is detailed movement rather than a blurry cloud.

---

# 19. Stereometer Stereo Response

The Stereometer must remain genuinely stereo-reactive.

Left and right channel differences should visibly influence particle positions.

Possible mapping:

```text
Left-heavy signal:
particles bias toward left

Right-heavy signal:
particles bias toward right

Centered mono signal:
particles cluster closer to center

Wide stereo signal:
particles spread outward
```

Signal amplitude should influence how far particles travel.

---

# 20. Stereometer Frequency Response

Particle behavior should also respond to frequency bands.

Example:

```text
Bass:
larger slow movement

Mids:
medium-speed movement

Highs:
small fast particles
```

This can create more detailed and natural movement.

---

# 21. Stereometer Color System

The Stereometer must use the same shared color system:

```text
Blue → Yellow → Red
```

Particles should smoothly change colors based on signal strength.

Optionally, individual particles may respond to different frequency bands.

For example:

- bass-related particles lean blue;
- mid particles lean yellow;
- high-frequency particles lean red.

Do not make this chaotic.

---

# 22. Spectrogram Color Update

Update the Spectrogram so that the new color logic is clearly visible.

Low-intensity areas:

```text
dark blue / blue
```

Medium-intensity areas:

```text
yellow
```

High-intensity areas:

```text
orange / red
```

The spectrogram should preserve historical signal information.

Older signal areas may gradually fade toward darker tones.

---

# 23. Spectrum Visualizer Color Update

The Spectrum bars or frequency lines must use the new color system.

Possible implementation:

Each individual frequency bar can use its own amplitude.

Example:

```text
weak bar:
blue

medium bar:
yellow

strong bar:
red
```

This is preferable to changing the entire spectrum to one single color.

The user should be able to visually identify which frequency regions are strongest.

---

# 24. Spectrum Peak Response

Strong spectrum peaks may briefly:

- stretch farther;
- glow brighter;
- produce small particles;
- create a short red pulse;
- create slight local distortion.

These effects must remain localized to strong frequencies where possible.

---

# 25. Oscilloscope Update

The Oscilloscope waveform should use smooth dynamic coloring.

Weak waveform:

```text
blue
```

Medium waveform:

```text
yellow
```

Strong waveform:

```text
red
```

Amplitude should also control:

- line thickness;
- glow;
- waveform displacement;
- small distortion.

---

# 26. Oscilloscope Extreme Peaks

During extreme peaks:

- waveform may briefly deform;
- horizontal displacement may occur;
- line may split into short glitch fragments;
- brightness may increase;
- slight jitter may appear.

The waveform must immediately return to normal after the peak.

Do not permanently destabilize the Oscilloscope.

---

# 27. Waveform Visualizer Update

The Waveform visualizer should also follow the shared color system.

Color should depend on local waveform amplitude where possible.

This means louder waveform sections may become red while quieter sections remain blue or yellow.

This creates more useful visual information than coloring the whole waveform globally.

---

# 28. Waveform Playback Position

If the visualizer already displays the current playback position, preserve it.

The new reactive colors should not make it difficult to determine playback progress.

UI information must remain readable.

---

# 29. Extreme Signal System

Create a dedicated extreme signal response system.

Extreme effects should only trigger when the audio signal crosses clearly defined thresholds.

Possible trigger sources:

```text
overallEnergy
bassEnergy
transientEnergy
peakStrength
```

Do not use one raw FFT bin as the trigger.

---

# 30. Peak Detection

Implement actual peak detection.

A peak should represent a sudden strong increase in energy.

Concept example:

```ts
const delta = currentEnergy - previousEnergy;

if (
  currentEnergy > highThreshold &&
  delta > transientThreshold
) {
  triggerPeak();
}
```

The final implementation may use a better algorithm.

The main requirement is to distinguish between:

```text
constant loud sound
```

and

```text
sudden strong hit
```

---

# 31. Peak Strength

Calculate a normalized `peakStrength`.

Example range:

```text
0.0
no peak

0.5
moderate peak

1.0
very strong peak
```

Peak strength should control effect intensity.

Do not trigger all peak effects at full strength every time.

---

# 32. Peak Cooldown

Add cooldown logic.

Without cooldowns, a loud section could trigger glitches every frame.

Example cooldown:

```text
50 – 250 ms
```

Different effects may use different cooldown durations.

For example:

```text
micro jitter:
very short cooldown

screen shake:
medium cooldown

large glitch:
longer cooldown
```

---

# 33. Visual Crackling

Add small crackling effects during strong peaks.

Visual crackling may include:

- short broken lines;
- tiny random displacement;
- noisy edges;
- very short flashes;
- fragmented visualizer segments.

Crackling should last only a few frames.

Avoid constant noise.

---

# 34. Digital Glitch Effects

Create short digital glitch effects for extreme signal peaks.

Possible techniques:

- horizontal slice displacement;
- vertical offset;
- temporary duplicate layers;
- RGB channel separation;
- pixel block shifts;
- scanline displacement;
- brief frame tearing.

Glitches should generally last:

```text
30 – 150 ms
```

Longer glitches should only happen during exceptionally strong peaks.

---

# 35. Chromatic Aberration

During strong peaks, briefly separate RGB channels.

Example:

```text
Red channel:
+2 px

Green:
0 px

Blue:
-2 px
```

The offset should scale with peak strength.

Do not leave chromatic aberration permanently enabled.

---

# 36. Screen Shake

Add controlled screen or visualizer shake during very strong peaks.

Important:

Do not aggressively shake the entire page for every bass hit.

Use small movement.

Suggested range:

```text
weak peak:
0 – 1 px

strong peak:
1 – 3 px

extreme peak:
3 – 6 px
```

Duration should remain short.

Example:

```text
40 – 120 ms
```

---

# 37. Local vs Global Shake

Prefer local visualizer shake for normal strong signals.

Use whole-interface or whole-background shake only for extreme peaks.

Example:

```text
normal strong kick:
Spectrum shakes slightly

very strong transient:
visualizer container + background shake

extreme clip-like hit:
very small global page shake
```

This prevents the interface from becoming annoying.

---

# 38. Particle Burst

Strong peaks may trigger temporary particle bursts.

The number of particles should scale with `peakStrength`.

Example:

```text
moderate peak:
5 – 10 particles

strong peak:
10 – 25 particles

extreme peak:
25 – 50 particles
```

Exact values should be performance tested.

Particles should fade quickly.

---

# 39. Peak Particle Direction

Particle movement may depend on frequency.

Example:

```text
Bass peak:
particles move outward slowly

Mid peak:
particles move diagonally

High-frequency peak:
particles move quickly and sharply
```

This is optional but preferred if it fits the visual style.

---

# 40. Noise Overlay

Add a temporary visual noise overlay during very strong peaks.

Possible implementation:

- CSS noise texture;
- procedural canvas noise;
- WebGL noise shader.

Opacity must remain low.

Suggested approximate maximum:

```text
0.05 – 0.15
```

Only extremely strong peaks should approach the higher end.

---

# 41. Scanlines

Short scanline glitches may appear during strong signals.

Examples:

- horizontal CRT-like lines;
- moving distortion bands;
- displaced rows;
- brief brightness lines.

These effects should fit the existing VHS / retro visual language of the site.

---

# 42. VHS Style Integration

All glitch effects should remain consistent with the existing VHS-inspired design.

Preferred visual language:

- analog signal instability;
- CRT noise;
- tape tracking errors;
- scanline distortion;
- analog color separation;
- temporary image warping.

Avoid futuristic holographic effects that do not match the current style.

---

# 43. Strong Bass Response

Bass should have a stronger physical feeling than other frequency bands.

Strong bass hits may control:

- slight scale pulse;
- screen shake;
- slow particle expansion;
- background displacement;
- thicker visualizer lines.

Bass response should feel heavy.

---

# 44. Mid Frequency Response

Mid frequencies should primarily control:

- yellow color intensity;
- medium-speed particles;
- waveform complexity;
- moderate visual movement.

Mids should visually connect low and high frequency behavior.

---

# 45. High Frequency Response

High frequencies should feel sharper and faster.

They may control:

- small fast particles;
- red highlights;
- sharp glitch lines;
- tiny rapid jitter;
- bright short flashes.

High-frequency effects must not create constant flickering during cymbal-heavy tracks.

Use smoothing and thresholds.

---

# 46. Signal Intensity States

Use conceptual signal states internally.

For example:

```text
IDLE
LOW
MEDIUM
HIGH
EXTREME
```

Approximate values:

```text
IDLE:
0.00 – 0.10

LOW:
0.10 – 0.35

MEDIUM:
0.35 – 0.65

HIGH:
0.65 – 0.85

EXTREME:
0.85 – 1.00+
```

Do not make these transitions visually hard.

The states are useful for logic, but visual interpolation must remain smooth.

---

# 47. Hysteresis

Add hysteresis where needed.

This prevents effects from rapidly switching between states when the signal stays near a threshold.

Example:

Enter HIGH at:

```text
0.70
```

Return to MEDIUM only below:

```text
0.64
```

This helps prevent flickering.

---

# 48. Attack and Release

Use separate attack and release speeds.

Strong signals should appear quickly.

After the signal decreases, effects should fade slightly more slowly.

Example:

```text
Attack:
fast

Release:
medium
```

This makes the visualizers feel more natural.

---

# 49. Overall Visual Reaction

Signal intensity should influence several properties at the same time.

For example:

```text
Signal increases
↓
Color moves toward red
↓
Brightness increases
↓
Particle density increases
↓
Movement becomes stronger
↓
Glow increases
↓
Distortion increases
↓
Extreme peak effects become possible
```

The system should feel interconnected.

---

# 50. Do Not Overload the Interface

Do not trigger every effect at the same time for every strong signal.

Create variation.

For example, one strong peak may trigger:

```text
small shake + particle burst
```

while another may trigger:

```text
glitch line + chromatic offset
```

An extreme peak may combine several effects.

Random variation is allowed, but signal strength must remain the main controlling factor.

---

# 51. Controlled Randomness

Random effects must be seeded or limited where practical.

Do not allow effects to feel completely disconnected from audio.

Randomness should only decide details such as:

- glitch position;
- particle direction;
- slice displacement;
- noise pattern.

The trigger itself must come from the audio.

---

# 52. Performance Requirements

The new system must remain performant.

Target smooth rendering on modern desktop systems.

Prefer:

```text
60 FPS
```

during normal playback.

Avoid unnecessary React re-renders every animation frame.

Audio-reactive rendering should preferably use:

- `requestAnimationFrame`;
- Canvas;
- WebGL;
- refs;
- shader uniforms;
- mutable rendering state.

Do not push every FFT value through React state at 60 FPS.

---

# 53. React Performance

React should manage:

- component lifecycle;
- UI state;
- selected visualizer;
- playback state.

Animation data should generally remain outside frequent React render cycles.

For example:

```ts
useRef()
```

is preferable for continuously changing audio values when no UI render is required.

---

# 54. Shared Animation Loop

Where possible, create one shared animation loop.

Example:

```text
Audio analyser
↓
Shared signal state
↓
requestAnimationFrame
↓
All active visual effects
```

Avoid running five unrelated animation loops if they can be coordinated.

---

# 55. Device Performance Scaling

Add quality scaling if needed.

Possible quality levels:

```text
LOW
MEDIUM
HIGH
```

High quality:

- more particles;
- more background detail;
- higher render resolution;
- more complex glitches.

Low quality:

- fewer particles;
- simplified background;
- fewer distortion layers.

The site should remain functional on phones and tablets.

---

# 56. Mobile Behavior

On mobile devices:

- reduce particle count;
- reduce expensive blur;
- reduce large noise effects;
- minimize global screen shake;
- preserve smooth playback.

Audio analysis should remain identical.

Only visual complexity should be reduced.

---

# 57. Reduced Motion

Respect:

```css
prefers-reduced-motion
```

When enabled:

- disable screen shake;
- disable aggressive glitches;
- reduce particle movement;
- preserve color-based signal information.

The site must remain usable.

---

# 58. Visualizer Independence

Each visualizer should preserve its own identity.

Do not make every visualizer behave exactly the same.

Shared elements:

- color language;
- signal strength;
- peak events;
- audio analysis.

Individual visualizers should interpret these values differently.

---

# 59. Background Independence

The background visualizer must continue reacting regardless of which primary visualizer is selected.

Changing from:

```text
Spectrum
```

to:

```text
Oscilloscope
```

must not reset or restart the background effect unnecessarily.

---

# 60. Track Switching

When switching tracks:

1. stop analysis of the previous track;
2. reset stale FFT values;
3. reset peak state;
4. clear temporary glitches;
5. reset visualizer history where necessary;
6. connect the new track to the existing shared analyser;
7. resume visual reaction immediately.

Avoid visual artifacts from the previous track.

---

# 61. Pause Behavior

When playback is paused:

- visualizers should gradually settle;
- color should slowly return toward blue or neutral;
- particles should slow down;
- glitches must stop;
- screen shake must stop;
- background animation may continue minimally.

Do not instantly freeze every visual element unless that matches the existing visualizer behavior.

---

# 62. Stop / End of Track Behavior

At the end of a track:

- signal values should smoothly decay;
- particles should settle;
- red/yellow states should fade back toward blue;
- temporary distortion should disappear;
- visualizers should return to idle state.

---

# 63. No Audio Loaded

When no audio file is loaded:

- no peak effects;
- no random glitches;
- no random screen shake;
- background visualizer may display a very subtle idle animation;
- color should remain mostly dark blue or neutral.

---

# 64. UI Readability

Never allow audio effects to make buttons, labels, track names, or controls unreadable.

If the entire interface receives distortion, UI controls should be affected less than the visualizer layer.

Recommended layering:

```text
Background effects
↓
Visualizers
↓
Decorative glitch layer
↓
UI controls
↓
Critical text
```

Critical controls should remain readable.

---

# 65. Effect Layer Architecture

Prefer separate effect layers.

Example:

```text
Layer 1:
background

Layer 2:
background visualizer

Layer 3:
main visualizer

Layer 4:
particles

Layer 5:
glitch / noise

Layer 6:
UI
```

This allows individual effects to be adjusted without breaking the full layout.

---

# 66. CSS Variables

Use shared CSS variables or a centralized visual theme where practical.

Example:

```css
--signal-color
--signal-strength
--signal-glow
--peak-strength
--background-reactivity
```

This can simplify synchronization between components.

---

# 67. Shared Signal Context

If appropriate for the current architecture, create a shared audio visualization context or hook.

Possible structure:

```ts
useAudioAnalysis()
```

Returned values may include:

```ts
{
  low,
  mid,
  high,
  overall,
  peak,
  transient,
  color,
  state
}
```

Avoid duplicating FFT calculations inside each component.

---

# 68. Code Organization

Do not place the entire audio-reactive system in one massive component.

Prefer modular structure.

Example:

```text
audio/
  analyzer.ts
  frequencyBands.ts
  smoothing.ts
  peakDetection.ts

visualizers/
  Spectrum.tsx
  Oscilloscope.tsx
  Waveform.tsx
  Stereometer.tsx
  Spectrogram.tsx

effects/
  BackgroundVisualizer.tsx
  GlitchLayer.tsx
  ParticleLayer.tsx
  ScreenShake.ts

hooks/
  useAudioAnalysis.ts
```

Adapt names to the existing project structure.

Do not unnecessarily rewrite working code.

---

# 69. Preserve Existing Features

Do not break:

- audio upload;
- MP3 playback;
- WAV playback;
- track switching;
- playback controls;
- current visualizer selection;
- responsive layout;
- existing animation;
- existing site styling.

The update should extend the existing system.

---

# 70. No Full Redesign

Do not redesign the website.

Keep:

- current layout;
- existing VHS-inspired style;
- current component structure where practical;
- current navigation;
- existing controls.

Focus specifically on improving the audio-reactive visual behavior.

---

# 71. Testing

Test the update using multiple types of audio.

At minimum:

### Quiet audio

Expected:

- mostly blue;
- low movement;
- almost no glitches.

### Normal mastered track

Expected:

- frequent movement between blue and yellow;
- red appears during strong moments;
- moderate particle activity.

### Bass-heavy track

Expected:

- strong bass movement;
- noticeable shake on large hits;
- strong background reaction.

### High-frequency-heavy track

Expected:

- more sharp particle movement;
- red highlights;
- controlled high-frequency reactions.

### Very loud / clipped audio

Expected:

- frequent extreme signal reactions;
- red state;
- visible glitches;
- shake;
- distortion.

---

# 72. Acceptance Criteria

The update is complete when:

- the website background contains a working audio-reactive mini visualizer;
- the background reacts to the currently playing audio;
- Stereometer is noticeably sharper;
- Stereometer contains more visible particles;
- excessive Stereometer blur is removed;
- all visualizers use the blue → yellow → red signal color system;
- color changes are smooth;
- low, mid, and high frequency bands are analyzed separately;
- very strong signals trigger additional visual effects;
- strong peaks can trigger glitches;
- strong peaks can trigger shake;
- strong peaks can trigger particle bursts or similar distortion;
- effects scale with actual signal strength;
- effects do not randomly trigger without audio;
- the interface remains readable;
- playback functionality is unchanged;
- performance remains smooth;
- mobile layout remains functional.

---

# 73. Required Implementation Order

Implement the update in this order.

## Step 1

Inspect the current audio analysis and visualizer architecture.

Do not rewrite working systems before understanding how the current implementation works.

## Step 2

Create or improve the shared audio analysis system.

Implement:

- low frequency energy;
- mid frequency energy;
- high frequency energy;
- overall energy;
- smoothing;
- peak detection.

## Step 3

Implement the shared dynamic color system.

Verify:

```text
Blue → Yellow → Red
```

transitions before adding complex effects.

## Step 4

Apply the color system to all existing visualizers.

## Step 5

Improve Stereometer quality.

Focus on:

- sharpness;
- particle density;
- reduced blur;
- stereo response.

## Step 6

Create the background mini visualizer.

## Step 7

Implement peak strength and transient detection.

## Step 8

Add subtle strong-signal effects.

Start with:

- local shake;
- brightness;
- small particle bursts.

## Step 9

Add extreme effects.

Add:

- glitch displacement;
- visual crackling;
- chromatic aberration;
- noise;
- stronger shake.

## Step 10

Optimize performance.

## Step 11

Test desktop and mobile behavior.

## Step 12

Verify that existing audio playback and UI functionality were not broken.

---

# 74. Final Design Principle

The final system should visually communicate audio strength without requiring any numerical meter.

A user should be able to look at the website and intuitively understand:

```text
Blue + calm
=
weak signal

Yellow + active
=
medium signal

Red + aggressive
=
strong signal

Red + glitch + shake + distortion
=
extreme signal
```

The website should feel like the entire visual system is being physically driven by the music.

The stronger the signal becomes, the more unstable and aggressive the visual presentation should become.

However, all instability must remain controlled, intentional, readable, and synchronized with the actual audio.
