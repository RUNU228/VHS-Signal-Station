# Technical Specification — VHS Audio Visualizer

## 1. Project Overview

Create a complete interactive browser-based audio visualizer application.

The application must allow the user to upload local audio files, create a playback queue, play tracks, and visualize the currently playing audio in real time using five different audio visualization modules.

The entire application interface must use English only.

The website must have a dark retro VHS / CRT / analog audio equipment aesthetic.

This must be a functional application, not a static UI mockup.

All visualizers must react to the actual currently playing audio.

---

# 2. Technology Stack

Use:

- Next.js — latest stable version
- App Router
- React
- TypeScript
- Tailwind CSS
- Web Audio API
- Canvas API
- requestAnimationFrame
- ResizeObserver

Avoid unnecessary third-party libraries.

Do not use third-party audio visualization libraries unless absolutely necessary.

The main audio processing and visualization system should be implemented using native browser APIs.

No backend is required.

No database is required.

All uploaded files must remain local in the browser.

Do not upload audio files to any external server.

---

# 3. Project Initialization

The project directory will initially be completely empty.

Codex must initialize the project itself before implementing the interface.

Use:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

After initialization:

1. Install required dependencies.
2. Verify that the project starts correctly.
3. Remove the default Next.js demo content.
4. Create the required project structure.
5. Only then begin implementing the actual application.

Do not manually create a Next.js project instead of using `create-next-app`.

---

# 4. Mandatory Development Workflow

Development must be split into clear stages.

Codex must follow the stages sequentially.

Do not attempt to build the entire application in one uncontrolled pass.

After every major stage, verify that the implemented functionality actually works before moving to the next one.

Use the following workflow:

## Stage 1 — Project initialization

- Initialize Next.js.
- Verify development server.
- Configure base layout.
- Remove unnecessary default files.

## Stage 2 — Application structure

Create the main component and utility structure.

Separate:

- audio engine;
- player;
- playlist;
- visualizers;
- UI components;
- reusable hooks;
- audio utilities.

## Stage 3 — Audio loading system

Implement:

- `.wav` support;
- `.mp3` support;
- multi-file selection;
- drag and drop;
- file validation;
- metadata extraction;
- track duration extraction.

## Stage 4 — Audio playback engine

Implement:

- one shared audio element;
- playback;
- pause;
- seeking;
- volume;
- mute;
- track switching;
- current time;
- duration;
- playback state.

## Stage 5 — Playlist / queue system

Implement automatic track progression.

## Stage 6 — Web Audio graph

Create the shared Web Audio API audio processing graph.

## Stage 7 — Visualizer framework

Create reusable canvas infrastructure.

## Stage 8 — Spectrogram

Implement the complete Spectrogram visualizer.

## Stage 9 — Waveform

Implement Mid / Side waveform processing.

## Stage 10 — Stereometer

Implement particle-based bipolar stereo meter.

## Stage 11 — Oscilloscope

Implement stereo-reactive oscilloscope.

## Stage 12 — Spectrum

Implement frequency spectrum between 100 Hz and 5 kHz.

## Stage 13 — Player UI

Create the complete VHS-styled player.

## Stage 14 — Track library

Create uploaded track cards and selection behavior.

## Stage 15 — VHS visual system

Implement noise, CRT effects, subtle glitches, shadows, borders, typography, colors, and animations.

## Stage 16 — Interaction polish

Add:

- hover states;
- pressed states;
- animations;
- transitions;
- feedback;
- micro-interactions.

## Stage 17 — Performance optimization

Check rendering performance and remove unnecessary React rerenders.

## Stage 18 — Responsive layout

Verify desktop, tablet, and smaller viewport behavior.

## Stage 19 — Final validation

Run:

```bash
npm run lint
npm run build
```

Fix all TypeScript, ESLint, hydration, console, and build errors.

Do not consider the task complete while known errors remain.

---

# 5. General Page Structure

The main application should contain three major vertical sections.

```text
┌──────────────────────────────────────────────┐
│               VISUALIZER RACK                │
│                                              │
│  Spectrogram             Waveform            │
│                                              │
│  Stereometer  Oscilloscope  Spectrum         │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│                  PLAYER                      │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│               TRACK LIBRARY                  │
│                                              │
│ Track 01                                     │
│ Track 02                                     │
│ Track 03                                     │
└──────────────────────────────────────────────┘
```

The exact proportions may adapt responsively, but the hierarchy must remain:

1. visualizers;
2. player;
3. tracks.

---

# 6. UI Language

The entire application must use English only.

Examples:

```text
LOAD AUDIO
DROP AUDIO
TRACK LIBRARY
NOW PLAYING
PLAY
PAUSE
PREVIOUS
NEXT
MUTE
VOLUME
QUEUE
SPECTROGRAM
WAVEFORM
STEREOMETER
OSCILLOSCOPE
SPECTRUM
CHANNEL 1 — SIDE
CHANNEL 2 — MID
NO SIGNAL
READY
PLAYING
PAUSED
END OF QUEUE
```

Do not display Russian or Ukrainian UI text.

---

# 7. Audio File Support

Supported formats:

```text
.wav
.mp3
```

The user must be able to:

- click an upload button;
- select one file;
- select multiple files;
- drag files into the application;
- drop multiple files at once.

Invalid file formats should be rejected gracefully.

---

# 8. Audio Upload Interaction

The upload area must be interactive.

It should visually react to:

- hover;
- click;
- drag enter;
- drag leave;
- active drag;
- successful drop.

Example label:

```text
DROP AUDIO TAPE HERE
```

or:

```text
LOAD AUDIO
```

The interface should feel like inserting media into old hardware.

---

# 9. Track Data

Use a strongly typed structure.

Example:

```ts
type AudioTrack = {
  id: string;
  file: File;
  url: string;
  name: string;
  duration: number;
};
```

Additional properties may be added if necessary.

Each track must use a stable unique ID.

Do not use only the file name as the identifier.

---

# 10. Track Metadata

For each uploaded track determine:

- file name;
- duration.

Display duration using:

```text
03:42
```

For tracks longer than one hour:

```text
01:03:42
```

Do not use fake durations.

Do not display the `.mp3` or `.wav` extension as part of the visible track title unless intentionally used as secondary metadata.

---

# 11. Track Library

All uploaded tracks must appear below the player.

Each track should be displayed as an interactive card or cassette-like row.

Each item must display:

- track title;
- duration;
- queue position if appropriate.

Optional secondary visual information may include:

- format;
- index number;
- playing indicator.

---

# 12. Selected Track

The currently selected track must have a clearly different visual state.

For example:

- brighter border;
- active LED;
- subtle red indicator;
- animated scanline;
- `PLAYING` label.

Selecting a different track should load it into the player.

---

# 13. Playlist / Queue

Uploaded tracks form a playback queue.

The queue order should initially follow the order in which the files were added.

Example:

```text
01 — Track A
02 — Track B
03 — Track C
```

If Track A finishes:

```text
Track B
```

must automatically begin playing.

If Track B finishes:

```text
Track C
```

must automatically begin playing.

If the final track finishes:

- do not restart the playlist;
- do not loop automatically;
- do not return to Track 1;
- stop playback;
- keep the final track selected;
- set player state to paused/stopped.

The interface may show:

```text
END OF QUEUE
```

---

# 14. Manual Queue Navigation

The player must include:

```text
PREVIOUS
NEXT
```

behavior.

NEXT:

- moves to the next track;
- starts playback if the current track was playing.

PREVIOUS:

If current playback time is greater than approximately 3 seconds:

- restart the current track.

If current playback time is near the beginning:

- move to the previous track.

If already on the first track:

- remain on the first track.

---

# 15. Track Switching

When another track is selected:

1. stop/pause the previous source;
2. change the source;
3. reset current playback time;
4. load new metadata;
5. keep all visualizers connected to the same shared audio engine;
6. avoid creating duplicate MediaElementAudioSourceNode instances;
7. resume playback according to intended player behavior.

Do not recreate the entire Web Audio system every time a track changes.

---

# 16. Shared Audio Architecture

Use one shared HTML audio element.

Do not create separate playback elements for every visualization.

Recommended architecture:

```text
HTMLAudioElement
        │
        ▼
MediaElementAudioSourceNode
        │
        ▼
Master Gain
        │
        ├──────────────► Destination
        │
        ├──────────────► Spectrogram Analyser
        │
        ├──────────────► Spectrum Analyser
        │
        ├──────────────► Oscilloscope Analyser
        │
        ▼
ChannelSplitterNode
        │
        ├──────────────► Left Analyser
        │
        └──────────────► Right Analyser
```

Additional nodes may be used when required.

All five visualizers must analyze the exact same playback source.

---

# 17. Web Audio API

Create AudioContext only in the browser.

Do not initialize browser audio APIs during server-side rendering.

Handle browser autoplay restrictions correctly.

Resume AudioContext after valid user interaction where required.

Clean up all listeners, animation frames, object URLs, and audio resources appropriately.

---

# 18. Visualization Rendering Architecture

Prefer:

```html
<canvas>
```

for all high-frequency visualization rendering.

Do not generate thousands of React elements for particles.

Use:

```ts
requestAnimationFrame()
```

for visualization loops.

Do not use React state for frame-by-frame audio visualization data.

Use:

- refs;
- typed arrays;
- canvas contexts;
- reusable animation loops.

React should handle application state, not 60 FPS pixel rendering.

---

# 19. Canvas Quality

Canvas rendering must remain sharp.

Use:

```ts
window.devicePixelRatio
```

with sensible limits.

For example:

```ts
Math.min(window.devicePixelRatio, 2)
```

Use ResizeObserver so visualizers adapt to their panel size.

Do not render canvases at an enormous fixed resolution regardless of display size.

---

# 20. Visualizer Rack

The upper section contains five modules:

```text
SPECTROGRAM
WAVEFORM
STEREOMETER
OSCILLOSCOPE
SPECTRUM
```

Each visualizer must look like an individual piece of analog studio equipment.

Panels may contain:

- module title;
- tiny technical labels;
- fake equipment IDs;
- scale labels;
- frequency labels;
- channel indicators;
- LEDs;
- borders;
- screws;
- subtle CRT glass overlays.

Decorative details must not obscure the visualization.

---

# 21. Visualizer 1 — Spectrogram

Title:

```text
SPECTROGRAM
```

Mandatory FFT size:

```ts
fftSize = 4096
```

The data must come from the actual audio.

---

# 22. Spectrogram Rendering Style

The Spectrogram must be particle-based.

Do not render a conventional smooth rainbow spectrogram.

Create a matrix/grid of small visual particles.

Possible shapes:

- tiny squares;
- dots;
- short phosphor rectangles.

Particles represent frequency energy.

A particle should respond to its frequency magnitude by changing:

- brightness;
- opacity;
- color;
- glow.

---

# 23. Spectrogram Time History

The Spectrogram must show historical audio information.

New FFT frames should enter continuously.

Older information should move through the visualization and decay.

Example conceptual behavior:

```text
NEW DATA ─────────────► OLD DATA
```

The spectrogram should therefore continuously scroll.

Do not randomly animate particles.

Every active particle must be derived from actual FFT information.

---

# 24. Spectrogram Color Mapping

Use a restrained VHS/CRT palette.

Low energy:

- almost black;
- dark gray;
- dark blue.

Medium energy:

- muted blue;
- dirty amber;
- yellow.

High energy:

- yellow;
- orange;
- red.

The brightest signals may have a small glow.

Avoid full rainbow gradients.

Avoid neon cyberpunk RGB aesthetics.

---

# 25. Spectrogram Idle State

When no track is loaded:

show a subtle inactive particle grid.

Possible label:

```text
NO SIGNAL
```

Particles may have extremely subtle random analog flicker, but must not simulate fake audio.

---

# 26. Visualizer 2 — Waveform

Title:

```text
WAVEFORM
```

The Waveform visualizer must contain two independent channels.

Required labels:

```text
CHANNEL 1 — SIDE
CHANNEL 2 — MID
```

Do not simply show Left and Right channels.

---

# 27. Mid / Side Processing

Use the stereo input channels.

For each audio sample:

```ts
Mid = (Left + Right) / 2
Side = (Left - Right) / 2
```

Display:

```text
Channel 1 = Side
Channel 2 = Mid
```

Both channels must react to the real signal.

---

# 28. Waveform Layout

Display the channels vertically.

Example:

```text
CHANNEL 1 — SIDE
────────────────────────────────
      waveform
────────────────────────────────

CHANNEL 2 — MID
────────────────────────────────
      waveform
────────────────────────────────
```

Each channel must have a clear zero axis.

---

# 29. Waveform Color Behavior

Waveform color should react dynamically to amplitude.

For example:

Low amplitude:

```text
blue / gray
```

Medium:

```text
yellow
```

High:

```text
red
```

Color changes should be smooth rather than flashing randomly.

Add subtle phosphor glow without making the waveform blurry.

---

# 30. Waveform Motion

The visualization must feel alive.

Use:

- smooth traces;
- subtle persistence;
- controlled decay;
- minimal afterglow.

It should resemble an old audio monitoring scope.

---

# 31. Visualizer 3 — Stereometer

Title:

```text
STEREOMETER
```

The Stereometer must be implemented using particles.

The particles must:

- illuminate;
- fade;
- change intensity;
- accumulate temporarily;
- decay over time.

---

# 32. Stereometer Mode

The display must use:

```text
Scaled — Bipolar
```

behavior.

The visualization should represent stereo width and stereo relationship around a centered bipolar coordinate system.

Use Left and Right channel information to calculate the display.

Conceptually derive coordinates from combinations such as:

```ts
x = Left - Right
y = Left + Right
```

Normalize values appropriately.

The final visual orientation must clearly communicate:

- centered mono information;
- stereo spread;
- phase relationship.

---

# 33. Stereometer Particle Behavior

Use persistent particles rather than only one instantaneous line.

New particles should appear from current signal information.

They should:

1. appear bright;
2. remain briefly visible;
3. slowly lose brightness;
4. fade out.

Create an analog phosphor persistence effect.

---

# 34. Stereometer Grid

Use a subtle background scale.

Possible features:

- center vertical line;
- center horizontal line;
- diagonal reference lines;
- bipolar scale marks;
- stereo width indicators.

Example labels:

```text
L
R
MONO
WIDE
+
-
```

Keep labels subtle.

---

# 35. Stereometer Colors

Default particle colors:

- pale blue;
- muted cyan;
- yellow.

Very strong signal:

- amber;
- red.

Older particles should lose saturation and brightness while fading.

---

# 36. Visualizer 4 — Oscilloscope

Title:

```text
OSCILLOSCOPE
```

The Oscilloscope should display a traditional real-time waveform.

No unusual processing is required.

It must still use real audio data.

---

# 37. Oscilloscope Appearance

Use a centered horizontal zero line.

The waveform should respond to the instantaneous audio signal.

Visual characteristics:

- smooth;
- thin;
- sharp;
- subtle glow;
- CRT persistence.

Avoid excessive thickness.

---

# 38. Oscilloscope Stabilization

Where practical, improve visual stability by finding a useful zero crossing before drawing each waveform frame.

This prevents the waveform from unnecessarily jumping horizontally.

Do not sacrifice performance for perfect trigger behavior.

---

# 39. Oscilloscope Colors

Use primarily:

- muted blue;
- pale yellow;
- warm white.

Allow stronger peaks to approach:

- amber;
- red.

Use subtle CRT persistence.

---

# 40. Visualizer 5 — Spectrum

Title:

```text
SPECTRUM
```

Mandatory FFT size:

```ts
fftSize = 4096
```

Mandatory visible frequency range:

```text
100 Hz → 5 kHz
```

Ignore frequencies outside this displayed range.

---

# 41. Spectrum Frequency Mapping

Do not simply display every FFT bin from 0 Hz to Nyquist.

Convert FFT bin indices to their actual frequencies using the current AudioContext sample rate.

Only render bins corresponding to:

```text
100 Hz
to
5000 Hz
```

---

# 42. Spectrum Scale

Prefer logarithmic frequency positioning rather than a purely linear scale.

This gives useful visual space to lower frequencies.

Possible labels:

```text
100
200
500
1K
2K
5K
```

---

# 43. Spectrum Rendering

Use animated vertical bars or narrow illuminated columns.

Bars should respond to FFT magnitude.

Add:

- peak hold;
- slow peak decay;
- subtle CRT glow;
- amplitude-dependent color.

---

# 44. Spectrum Colors

Suggested amplitude mapping:

Low:

```text
blue
```

Medium:

```text
yellow
```

High:

```text
red
```

Do not color each frequency using random colors.

---

# 45. Player Overview

Create a visually elaborate but practical audio player.

It must look like an old VHS deck / cassette machine / studio playback unit.

The player should be one of the major visual elements of the page.

It must not look like a default HTML audio control.

Do not use the browser's standard `<audio controls>` interface as the visible player.

Build a custom player interface.

---

# 46. Player Information Display

The player must show:

- current track name;
- current track index;
- total number of tracks;
- current playback time;
- total duration;
- playback state.

Example:

```text
NOW PLAYING

03 / 08

THE RETURN

01:28 / 04:17

PLAYING
```

---

# 47. Main Playback Controls

Required controls:

```text
PREVIOUS
PLAY / PAUSE
NEXT
```

The Play/Pause button should be visually dominant.

Controls must have visible:

- default;
- hover;
- pressed;
- disabled states.

---

# 48. Seek Bar

Create a custom playback timeline.

It must:

- show playback progress;
- support click seeking;
- support drag seeking;
- update smoothly during playback.

Display:

```text
CURRENT TIME
TOTAL TIME
```

on opposite sides.

The seek bar should resemble analog equipment rather than a generic modern streaming player.

---

# 49. Volume

Implement:

- volume slider;
- mute toggle.

Optional label:

```text
OUTPUT
```

or:

```text
LEVEL
```

Volume value may be displayed as:

```text
72%
```

or an equipment-like scale.

---

# 50. Player Status Indicators

Add small status indicators such as:

```text
PLAY
PAUSE
READY
END
MUTE
QUEUE
```

Use LED-style indicators.

Only active states should illuminate strongly.

Inactive LEDs should remain faintly visible.

---

# 51. Queue Information

The player should show at least basic queue information.

For example:

```text
QUEUE 03 / 08
```

Optionally show:

```text
UP NEXT
Track Name
```

The next track name should update whenever queue position changes.

If the current track is the final item:

```text
UP NEXT
END OF QUEUE
```

---

# 52. Playback Queue Behavior

When a track ends:

```ts
if (currentTrackIndex < tracks.length - 1) {
  playNextTrack();
} else {
  pausePlayback();
}
```

Do not loop back to the first song.

Do not restart the final track.

Do not automatically create an infinite playlist.

---

# 53. Manual Track Selection

Clicking a track in the library should make it the active track.

If playback is currently running, selecting another track should begin playing the newly selected track.

If playback is paused, selecting another track should load it but remain paused.

---

# 54. Keyboard Controls

Implement useful keyboard shortcuts.

Recommended:

```text
Space       Play / Pause
Left Arrow  Seek backward
Right Arrow Seek forward
Up Arrow    Volume up
Down Arrow  Volume down
M           Mute
N           Next track
P           Previous track
```

Keyboard shortcuts must not interfere with normal input interactions.

---

# 55. Seek Keyboard Behavior

Recommended seek interval:

```text
5 seconds
```

Left Arrow:

```text
-5s
```

Right Arrow:

```text
+5s
```

Clamp values safely between:

```text
0
duration
```

---

# 56. VHS / CRT Design Direction

The website must have a strong old VHS / CRT / analog studio equipment aesthetic.

Reference feeling:

- old VHS decks;
- broadcast monitoring equipment;
- CRT oscilloscopes;
- analog audio analyzers;
- 1980s / 1990s electronics;
- industrial recording hardware.

Do not make the interface look like a modern SaaS dashboard.

---

# 57. Main Colors

Primary background:

```text
near black
charcoal
dark gray
```

Example feeling:

```text
#080909
#111212
#171818
```

Accent colors:

```text
muted red
dirty yellow
analog blue
warm white
```

Avoid extremely saturated modern colors.

---

# 58. Accent Usage

Red:

- peaks;
- warnings;
- recording-style indicators;
- active states.

Yellow:

- labels;
- important metadata;
- amplitude highlights.

Blue:

- secondary visualization;
- low energy;
- channel indicators.

Do not make every element colorful simultaneously.

---

# 59. VHS Noise Background

The entire website background must have continuous subtle analog interference.

Include effects such as:

- film grain;
- VHS noise;
- horizontal scanlines;
- subtle brightness fluctuation;
- very occasional tracking distortion.

The effect must always exist but remain subtle.

Do not make the page unreadable.

---

# 60. Noise Implementation

Prefer lightweight CSS or canvas-based procedural effects.

Possible layers:

```text
noise
scanlines
flicker
vignette
```

Use pseudo-elements where practical.

Avoid loading huge video textures just to create noise.

---

# 61. Scanlines

Add thin horizontal scanlines across parts of the interface.

They should have very low opacity.

Do not use thick obvious black stripes.

The purpose is atmosphere, not sabotaging readability.

---

# 62. VHS Tracking Glitches

Occasionally introduce very subtle visual glitches.

Examples:

- 1–3 px horizontal displacement;
- momentary brightness shift;
- tiny RGB separation;
- short horizontal noise band.

These effects should happen rarely.

Do not constantly shake the whole interface.

---

# 63. Background Motion

Nothing should feel completely dead.

Possible subtle motion:

- noise;
- CRT flicker;
- LEDs;
- visualizers;
- tiny panel reflections;
- hover states.

However, avoid excessive motion that distracts from the audio visualization.

---

# 64. Typography

Use typography inspired by:

- technical displays;
- old electronics;
- terminal interfaces;
- VHS timestamps;
- industrial labels.

Prefer:

- monospaced fonts;
- condensed technical fonts;
- uppercase labels.

Avoid overly futuristic sci-fi fonts.

---

# 65. Panels

Visualizer and player panels should resemble physical devices.

Possible styling:

- dark metal surfaces;
- inset borders;
- thin highlights;
- tiny screws;
- labels;
- serial numbers;
- CRT glass;
- ventilation details.

Do not overdecorate.

The audio information must remain dominant.

---

# 66. CRT Glass Effect

Visualizer canvases can have subtle CRT screen treatment.

Include:

- slight inner shadow;
- subtle reflection;
- scanlines;
- very mild vignette;
- soft phosphor glow.

Avoid heavy blur.

---

# 67. Interactive Requirement

Nothing important should feel static.

All interactive elements must provide visual feedback.

Buttons:

- hover;
- pressed;
- active;
- disabled.

Track rows:

- hover;
- selected;
- playing.

Sliders:

- hover;
- dragging.

Upload area:

- idle;
- hover;
- drag active.

---

# 68. Button Interaction

Buttons should physically feel like old hardware controls.

On press:

- move slightly inward;
- reduce shadow;
- change LED state;
- optionally emit a subtle flash.

Do not use exaggerated elastic animations.

---

# 69. Track Card Interaction

Track cards should react on hover.

Possible behavior:

- thin border illumination;
- slight background change;
- small LED activation;
- title brightness increase.

The active track should have a persistent indicator.

---

# 70. Loading State

When audio metadata is being decoded or analyzed:

show an appropriate state.

Example:

```text
READING TAPE...
```

or:

```text
LOADING SIGNAL...
```

Do not freeze the interface silently.

---

# 71. Empty State

Before audio files are uploaded, visualizer modules must still be visible.

They should display inactive states such as:

```text
NO SIGNAL
```

The player should remain visible but disabled appropriately.

The track library may display:

```text
NO AUDIO LOADED
```

---

# 72. Playback State Synchronization

All UI components must use one shared playback state.

Do not allow visualizers, player, and playlist to independently believe different tracks are active.

Maintain a single source of truth for:

- selected track;
- playback state;
- current time;
- duration;
- volume;
- muted state;
- queue position.

---

# 73. Suggested Application State

Conceptually manage state similar to:

```ts
tracks
currentTrackIndex
isPlaying
currentTime
duration
volume
isMuted
audioReady
```

Do not place raw high-frequency FFT arrays into global React state.

---

# 74. Suggested Project Structure

A possible structure:

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── audio/
│   │   ├── AudioPlayer.tsx
│   │   ├── PlayerControls.tsx
│   │   ├── SeekBar.tsx
│   │   ├── VolumeControl.tsx
│   │   └── TrackLibrary.tsx
│   │
│   ├── visualizers/
│   │   ├── VisualizerRack.tsx
│   │   ├── Spectrogram.tsx
│   │   ├── Waveform.tsx
│   │   ├── Stereometer.tsx
│   │   ├── Oscilloscope.tsx
│   │   └── Spectrum.tsx
│   │
│   └── ui/
│       ├── Panel.tsx
│       ├── Led.tsx
│       └── VHSNoise.tsx
│
├── hooks/
│   ├── useAudioEngine.ts
│   ├── useCanvasSize.ts
│   └── useAnimationFrame.ts
│
├── lib/
│   ├── audio/
│   │   ├── engine.ts
│   │   ├── midSide.ts
│   │   └── frequency.ts
│   └── utils/
│       └── formatTime.ts
│
└── types/
    └── audio.ts
```

The exact structure may be adjusted when technically justified.

Do not place the entire application into one huge component.

---

# 75. Responsive Layout

Desktop is the primary target.

However, the site must remain usable on smaller screens.

Recommended desktop visualizer arrangement:

```text
┌───────────────────────────┬───────────────────────────┐
│       SPECTROGRAM         │         WAVEFORM          │
└───────────────────────────┴───────────────────────────┘

┌─────────────────┬─────────────────┬─────────────────┐
│   STEREOMETER   │  OSCILLOSCOPE   │    SPECTRUM     │
└─────────────────┴─────────────────┴─────────────────┘
```

On narrower layouts:

```text
Spectrogram
Waveform
Stereometer
Oscilloscope
Spectrum
```

may stack vertically.

---

# 76. Performance Requirements

Target smooth visualization close to:

```text
60 FPS
```

where hardware and browser conditions allow.

Avoid unnecessary React rerenders.

Reuse TypedArrays where possible.

Do not allocate large arrays every animation frame.

Do not redraw invisible components unnecessarily.

---

# 77. Particle Performance

For Spectrogram and Stereometer:

do not implement particles as React elements.

Use Canvas.

Use bounded particle counts.

Reuse objects or array buffers when possible.

Avoid memory growth during long playback sessions.

---

# 78. Animation Lifecycle

Every visualizer must:

- start rendering when mounted;
- use requestAnimationFrame;
- cancel animation frame when unmounted;
- respond safely when no analyser exists;
- not create duplicate loops after React rerenders.

---

# 79. Audio Cleanup

When files are removed or replaced:

revoke unused Object URLs.

When application components unmount:

remove event listeners.

Do not leak AudioNodes.

Do not create a new AudioContext for every track.

---

# 80. Accessibility

Even though the interface is heavily stylized:

- buttons must remain keyboard accessible;
- interactive controls must use correct elements;
- provide aria-labels where necessary;
- do not rely exclusively on color to indicate playback state;
- maintain readable text contrast.

---

# 81. Error Handling

Handle:

- unsupported audio files;
- failed metadata loading;
- corrupted files;
- playback errors;
- AudioContext initialization failures.

Show an interface-level message rather than failing silently.

Example:

```text
UNABLE TO READ AUDIO SIGNAL
```

---

# 82. No Fake Visualization

This requirement is critical.

Do not use:

- random bars;
- random particle movement;
- fake sine waves;
- decorative audio animation unrelated to actual playback.

All primary visualization must derive from the selected audio signal.

Ambient VHS background effects may be procedural.

---

# 83. No Default Browser Audio Player

Do not show:

```html
<audio controls>
```

as the final visible interface.

The HTMLAudioElement may exist internally.

The user-facing player must be custom designed.

---

# 84. Visual Hierarchy

The most visually important areas should be:

1. five audio visualizers;
2. current track / player controls;
3. queue / track library.

Decorative elements must remain secondary.

---

# 85. Interaction Details

Add small polished details such as:

- active LEDs;
- button depression;
- CRT glow changes;
- timeline hover marker;
- selected track scanline;
- volume indicator movement;
- subtle visualization screen flicker.

Every animation must serve the interface.

---

# 86. Player Completion Behavior

When the final song reaches its end:

1. keep the final song selected;
2. set playback state to paused;
3. keep current time at the end;
4. stop automatic progression;
5. show:

```text
END OF QUEUE
```

Do not automatically restart playback.

---

# 87. Adding Tracks During Playback

If new tracks are uploaded while music is playing:

- preserve the currently playing track;
- preserve current playback time;
- append new tracks to the queue;
- do not restart playback.

---

# 88. Duplicate Files

If the same file is added more than once, the application may allow it.

Each upload must still receive an independent unique track ID.

Do not break because two files have identical names.

---

# 89. Browser Refresh

Audio files are local browser File objects.

It is acceptable for the playlist to be cleared on page refresh.

Persistent browser storage is not required.

Do not attempt to upload or persist local audio automatically.

---

# 90. Final Design Goal

The finished interface should feel like:

```text
an old broadcast audio analysis station
+
a VHS tape deck
+
a CRT signal monitor
+
a professional audio visualizer
```

It should not feel like:

```text
Spotify clone
modern SaaS dashboard
generic Tailwind demo
gaming RGB interface
```

---

# 91. Final Functional Checklist

Before considering the project finished, verify all of the following:

- [ ] Next.js project was created with `create-next-app`
- [ ] App Router is used
- [ ] TypeScript is enabled
- [ ] Tailwind CSS is enabled
- [ ] `.wav` files work
- [ ] `.mp3` files work
- [ ] multiple files can be loaded
- [ ] drag and drop works
- [ ] tracks display names
- [ ] tracks display durations
- [ ] selecting tracks works
- [ ] player Play/Pause works
- [ ] Previous works
- [ ] Next works
- [ ] seek works
- [ ] volume works
- [ ] mute works
- [ ] keyboard controls work
- [ ] automatic queue progression works
- [ ] final queue item stops instead of looping
- [ ] Spectrogram reacts to real audio
- [ ] Spectrogram uses fftSize 4096
- [ ] Spectrogram uses particle rendering
- [ ] Waveform displays Side
- [ ] Waveform displays Mid
- [ ] Side/Mid are mathematically derived from stereo channels
- [ ] Stereometer reacts to real stereo information
- [ ] Stereometer uses particle persistence
- [ ] Stereometer behaves as Scaled/Bipolar
- [ ] Oscilloscope reacts to real audio
- [ ] Spectrum reacts to real FFT data
- [ ] Spectrum uses fftSize 4096
- [ ] Spectrum only displays 100 Hz–5 kHz
- [ ] all visualizers react to the same currently playing track
- [ ] no fake random primary audio visualization exists
- [ ] VHS background noise is visible
- [ ] subtle scanlines are visible
- [ ] UI is English only
- [ ] interface is interactive
- [ ] custom player is used
- [ ] responsive layout works
- [ ] no obvious animation memory leaks exist
- [ ] no duplicate AudioContext is created per track
- [ ] no duplicate playback streams exist
- [ ] browser console contains no important errors
- [ ] TypeScript contains no unresolved errors
- [ ] `npm run lint` passes
- [ ] `npm run build` passes

---

# 92. Definition of Done

The task is complete only when the application can be started locally, audio files can be loaded and played, playlist progression works correctly, and all five visualization modules react in real time to the same actual playback source.

The final product must feel like a polished interactive application rather than a technical prototype.

Do not replace unfinished functionality with static placeholders.

Do not fake visualization data.

Do not leave TODO placeholders for core functionality.

Do not stop after creating the visual design.

Functional audio processing and synchronization are mandatory.
