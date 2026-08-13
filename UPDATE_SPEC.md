# Technical Specification — First Major Update

## General Goal

Improve the existing website without redesigning it from scratch.

The current visual identity, VHS-inspired aesthetic, layout logic, typography, color palette, and overall atmosphere must remain recognizable.

The update should focus on:

1. full responsive support;
2. better usability;
3. smoother visualizer animations;
4. audio-reactive interface elements;
5. an audio-reactive background.

The work must be completed step by step in the exact order described below.

Do not start the next major stage before the previous one is completed and verified.

---

# 1. Responsive Design

The first priority is to fully adapt the existing website for different screen sizes.

The website must work correctly on:

- smartphones;
- small smartphones;
- tablets;
- laptops;
- standard desktop monitors;
- ultrawide monitors;
- large monitors;
- TVs;
- 4K displays.

The interface must remain usable and visually balanced at all supported resolutions.

## Requirements

Review the entire current layout and remove any elements that depend too heavily on fixed pixel dimensions.

Prefer responsive units and layout systems such as:

- `%`
- `rem`
- `em`
- `vw`
- `vh`
- `clamp()`
- CSS Grid
- Flexbox

Use Tailwind responsive breakpoints where appropriate.

Avoid unnecessary hardcoded widths and heights.

---

# 2. Responsive Visualizer Layout

The main visualizers must adapt correctly to different screen sizes.

Current visualizers:

- Spectrogram
- Waveform
- Stereometer
- Oscilloscope
- Spectrum

Their proportions must remain visually consistent.

On large screens, visualizers can remain arranged horizontally or in the current desktop layout.

On medium screens, reduce gaps and scale the visualizers appropriately.

On tablets and smartphones, the layout may change into fewer columns or a vertical layout when required.

Do not make the visualizers too small just to preserve the desktop layout.

Readability and usability are more important than forcing everything into one row.

---

# 3. Smartphone Layout

Create a proper mobile layout.

The mobile version must not simply be the desktop version scaled down.

Important requirements:

- buttons must remain easy to tap;
- text must remain readable;
- visualizers must remain large enough to understand;
- controls must not overlap;
- audio player controls must remain accessible;
- uploaded track cards must fit the viewport;
- horizontal page scrolling must never appear unintentionally.

Where necessary, stack interface elements vertically.

Keep the existing visual style.

---

# 4. Tablet Layout

Create a layout specifically suitable for tablets.

Avoid simply using either the phone or desktop layout.

The tablet layout should use the available screen space efficiently.

Visualizers may use:

- two-column layouts;
- adaptive grids;
- wider player controls;
- larger track cards.

Both portrait and landscape orientations must work correctly.

---

# 5. Large Monitors and TVs

The interface must also scale properly on large displays.

Prevent the website from becoming excessively stretched.

Use reasonable maximum widths for interface sections where appropriate.

Large empty areas should be handled intentionally.

The website must remain visually balanced on:

- 1440p displays;
- ultrawide monitors;
- 4K monitors;
- TVs.

Visualizers may grow, but controls and text should not become absurdly large.

---

# 6. Maintain Existing Style

Do not redesign the website.

Preserve:

- current color palette;
- VHS / analog equipment style;
- dark interface;
- red, yellow and blue accents;
- typography;
- existing visual hierarchy;
- general layout identity.

Responsive changes must feel like natural extensions of the existing design.

---

# 7. Improve Interface Clarity

After responsive design is completed, improve the usability of the interface.

The goal is to make the interface as intuitive as possible without significantly changing its appearance.

Do not introduce a completely new navigation system.

Instead, improve the existing one.

---

# 8. Improve Interactive Feedback

Every interactive element should clearly communicate that it can be interacted with.

Buttons should have subtle states for:

- hover;
- active;
- pressed;
- disabled;
- focus.

These effects must match the existing visual style.

Possible effects:

- subtle brightness changes;
- tiny scale changes;
- small glow changes;
- border intensity changes;
- analog/VHS flicker effects.

Avoid modern glossy UI effects that do not match the design.

---

# 9. Improve Control Readability

Ensure that important controls are immediately understandable.

This includes:

- play;
- pause;
- track selection;
- upload controls;
- visualizer selection;
- volume controls;
- playback position;
- other existing interactive buttons.

Icons and labels should remain clear.

If an existing button is visually confusing, improve its visual feedback rather than redesigning the entire component.

---

# 10. Improve Track Selection

Uploaded songs should be easy to identify and select.

Track cards must clearly show:

- track name;
- duration;
- selected state;
- hover state;
- playing state.

The currently playing track should be visually distinguishable.

Use subtle styling consistent with the VHS interface.

---

# 11. Smooth Spectrum Color Transitions

Improve the Spectrum visualizer.

Its colors should transition smoothly rather than changing abruptly.

The color animation must remain dynamic and audio-reactive.

Possible colors should remain within the existing website palette.

For example:

- red;
- orange;
- yellow;
- blue;
- muted analog variations between them.

Avoid rainbow or RGB gaming-style effects.

---

# 12. Spectrum Color Behaviour

Spectrum color transitions should depend partly on audio intensity.

For example:

low energy:

- darker tones;
- reduced saturation;
- weaker glow.

medium energy:

- stronger colors;
- slightly brighter highlights.

high energy:

- brighter red/yellow accents;
- stronger glow;
- more noticeable transitions.

Transitions must always remain smooth.

Use interpolation rather than abrupt switching.

---

# 13. Smooth Oscilloscope Color Transitions

Apply a similar system to the Oscilloscope.

The oscilloscope line should smoothly shift between colors.

Color changes should react to the music without distracting from the waveform itself.

The waveform must always remain clearly visible.

---

# 14. Audio Analysis System

Before making the interface audio-reactive, create or improve a centralized audio analysis system.

Do not create separate random audio analysis logic for every component.

Use a shared audio-reactive data layer.

The system should provide normalized values such as:

- overall volume;
- bass energy;
- low-mid energy;
- mid energy;
- high-mid energy;
- treble energy;
- transient / peak intensity;
- smoothed energy value.

Values should be normalized approximately between:

`0.0` and `1.0`

The values should also use smoothing to avoid excessive jitter.

---

# 15. Audio-Reactive Interface

After the shared audio analysis system works correctly, make most of the interface subtly audio-reactive.

The effect must remain restrained.

The website should feel alive with the music, not unstable.

Possible reactive properties:

- glow intensity;
- border brightness;
- subtle shadows;
- background light;
- tiny scale changes;
- subtle opacity changes;
- small text glow;
- analog flicker intensity.

---

# 16. Audio-Reactive Buttons

Most major buttons should respond subtly to music.

Do not move buttons around the screen.

Do not create large scaling animations.

Use restrained effects.

Example behaviour:

bass hit:

- slightly stronger glow;
- tiny scale pulse;
- border brightness increase.

high frequencies:

- subtle flicker;
- small highlight intensity change.

These effects must remain visually consistent with the interface.

---

# 17. Audio-Reactive Player

Make the main audio player subtly react to the music.

Possible reactive elements:

- player border;
- active playback line;
- play button glow;
- track title glow;
- progress bar intensity.

Avoid making every element react equally.

The most important controls must remain easy to read.

---

# 18. Audio-Reactive Track Cards

Track cards can have subtle audio-reactive behaviour.

Only the currently playing track should have stronger reactions.

Non-playing tracks should remain mostly static.

Possible effects for the active track:

- border glow;
- subtle background brightness;
- tiny pulse;
- analog noise intensity.

---

# 19. Audio-Reactive Visualizer Containers

The containers surrounding the visualizers can also react slightly.

Possible effects:

- border intensity;
- small glow changes;
- tiny shadow changes;
- subtle background illumination.

The visualizer itself must remain the dominant element.

---

# 20. Avoid Excessive Motion

Audio-reactive effects must never become visually exhausting.

Do not:

- shake the interface;
- heavily scale components;
- constantly rotate objects;
- aggressively flash the screen;
- move text positions;
- produce rapid high-contrast flashes.

The effects should primarily use:

- opacity;
- glow;
- color;
- subtle scale;
- subtle noise.

---

# 21. Audio-Reactive Background

After all interface audio-reactive elements are working, add an audio-reactive background.

The background must match the existing VHS / analog visual style.

Do not use generic particle systems or modern neon gradients unless heavily stylized to match the current interface.

---

# 22. Background Visual Style

Possible background elements:

- analog noise;
- VHS grain;
- CRT scanlines;
- soft colored glow;
- distorted horizontal bands;
- subtle signal interference;
- waveform-like shapes;
- analog tracking distortion;
- faint spectrum-like light patterns.

The background must remain visually subtle.

It must never reduce text readability.

---

# 23. Background Audio Reaction

Different frequency ranges may control different background properties.

Example:

bass:

- stronger low-frequency pulse;
- larger soft glow;
- subtle background expansion.

mids:

- distortion intensity;
- moving analog bands.

high frequencies:

- subtle noise intensity;
- small flicker;
- brighter highlights.

overall volume:

- overall background brightness.

All values must use smoothing.

---

# 24. Background Performance

The background must be optimized.

Avoid excessive DOM elements.

Prefer:

- Canvas;
- WebGL;
- CSS effects;
- lightweight procedural animation.

Do not create hundreds of individual React components for particles.

The animation should target approximately 60 FPS on normal desktop hardware.

It must remain usable on smartphones.

---

# 25. Reduced Effects on Mobile

Mobile devices may use simplified audio-reactive effects.

If performance becomes problematic:

- reduce background resolution;
- reduce animation frequency;
- reduce blur intensity;
- reduce number of procedural elements;
- simplify noise;
- disable expensive effects.

Do not completely remove the visual identity on mobile.

---

# 26. Performance Monitoring

Avoid unnecessary React re-renders caused by audio analysis.

Audio-reactive values that update every animation frame should not cause the entire React component tree to re-render.

Prefer:

- requestAnimationFrame;
- Canvas drawing;
- refs;
- direct style updates where appropriate;
- shared animation controllers.

React state should only be used where state changes actually need React rendering.

---

# 27. Accessibility and Reduced Motion

Respect:

`prefers-reduced-motion`

Users who request reduced motion should receive significantly reduced reactive effects.

Disable or reduce:

- pulses;
- flicker;
- aggressive movement;
- large visual transitions.

Core functionality must remain unchanged.

---

# 28. Testing Screen Sizes

Test the website at minimum at approximately:

- 320px width;
- 375px width;
- 390px width;
- 430px width;
- 768px width;
- 1024px width;
- 1280px width;
- 1440px width;
- 1920px width;
- 2560px width;
- 3840px width.

Also test both portrait and landscape modes where relevant.

---

# 29. Browser Testing

Verify the updated website in modern versions of:

- Chrome;
- Edge;
- Firefox;
- Safari where possible.

The project must not rely on browser-specific behaviour without fallback handling.

---

# 30. Final Visual Check

After implementation, compare the updated website to the current version.

The updated website should still clearly look like the same website.

The update should feel like:

- better scaling;
- better usability;
- smoother visualizers;
- more responsive feedback;
- more dynamic audio interaction.

It must not feel like a complete redesign.

---

# 31. Development Order

Codex must follow this exact implementation order:

1. inspect the current project structure;
2. inspect the current responsive behaviour;
3. fix global responsive layout;
4. adapt visualizers;
5. adapt player;
6. adapt uploaded track list;
7. optimize smartphone layout;
8. optimize tablet layout;
9. optimize desktop layout;
10. optimize ultrawide / 4K / TV layout;
11. test responsive behaviour;
12. improve interface clarity;
13. improve button states;
14. improve track selection feedback;
15. implement smooth Spectrum color transitions;
16. implement smooth Oscilloscope color transitions;
17. create centralized audio analysis system;
18. expose normalized audio-reactive values;
19. make major interface elements audio-reactive;
20. make buttons subtly audio-reactive;
21. make player audio-reactive;
22. make active track card audio-reactive;
23. make visualizer containers audio-reactive;
24. create audio-reactive background;
25. optimize background performance;
26. simplify effects on weaker/mobile devices;
27. implement reduced-motion behaviour;
28. test all supported resolutions;
29. test performance;
30. run production build;
31. fix all build errors and warnings caused by the update.

---

# 32. Important Restrictions

Do not:

- rebuild the project from scratch;
- replace the current design system;
- remove existing functionality;
- significantly change the current layout unless required for responsive behaviour;
- add unrelated features;
- add unnecessary dependencies;
- replace working visualizers without a strong technical reason;
- introduce aggressive animations;
- create rainbow RGB effects;
- sacrifice readability for audio-reactive effects.

---

# 33. Final Result

The final website should feel like the same existing audio visualizer website, but significantly more polished.

It should:

- work correctly on virtually every common screen size;
- remain readable and usable on smartphones;
- look properly scaled on TVs and 4K monitors;
- provide clearer interaction feedback;
- have smooth Spectrum color transitions;
- have smooth Oscilloscope color transitions;
- react subtly to the currently playing audio;
- include an atmospheric audio-reactive background;
- remain performant;
- preserve the existing VHS-inspired visual identity.
