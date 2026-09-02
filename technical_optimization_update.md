# Website Update Technical Specification

## 1. General Goal

The purpose of this update is to improve several existing parts of the website without changing its core design, visual identity, layout structure, or overall behavior.

This update should focus on four main areas:

1. Improve the smoothness of color transitions in the `Waveform` visualizer.
2. Add a language switcher in the top-right area of the interface.
3. Add full support for two interface languages:
   - English
   - Russian
4. Perform a careful optimization and code cleanup pass across the entire project without making unnecessary architectural or visual changes.

The existing website should remain visually recognizable after the update.

Do not redesign the website.

Do not replace the current style system.

Do not significantly rearrange components.

Do not remove existing functionality unless the related code is confirmed to be unused, duplicated, obsolete, or unnecessary.

The update should feel like a polished refinement of the current version rather than a new version of the website.

---

# 2. Important Development Rules

Before making changes, inspect the entire current project structure.

Review:

- App Router structure
- page files
- layouts
- React components
- visualizer components
- hooks
- utilities
- styles
- Tailwind classes
- global CSS
- local component styles
- animation logic
- Web Audio API logic
- audio analysis logic
- state management
- event listeners
- timers
- `requestAnimationFrame` loops
- resize observers
- effects
- language-related text
- duplicate constants
- unused imports
- unused functions
- unreachable code
- commented-out code
- old experimental code
- repeated calculations
- unnecessary re-renders

Do not blindly rewrite working code.

First understand the current implementation.

Only refactor code when there is a clear technical reason.

Preserve all current working features.

---

# 3. Waveform Color Transition Improvement

The existing `Waveform` visualizer already uses multiple colors.

The current color transitions should be improved so that they appear smoother and more natural.

The color change must no longer look abrupt, segmented, harsh, or obviously separated into fixed frequency zones.

The goal is to create a continuous visual gradient behavior.

---

# 4. Waveform Frequency Color Mapping

The existing frequency color concept must remain:

- low frequencies = blue
- mid frequencies = yellow
- high frequencies = red

However, the transitions between these colors should be much smoother.

The visualizer should not instantly switch from one color to another.

For example:

Bad behavior:

```text
blue
blue
blue
yellow
yellow
yellow
red
red
red
```

Desired behavior:

```text
blue
blue-cyan transition
blue-yellow blend
yellow
yellow-orange transition
orange-red blend
red
```

The result should visually feel continuous.

---

# 5. Waveform Color Interpolation

Implement smooth color interpolation.

The color of a point or waveform segment should be calculated based on the current frequency or normalized frequency position.

Avoid using hard thresholds such as:

```ts
if (frequency < X) blue
else if (frequency < Y) yellow
else red
```

unless interpolation is applied around or between those ranges.

Prefer continuous interpolation.

Possible techniques include:

- linear interpolation between RGB values
- HSL interpolation
- normalized frequency mapping
- weighted blending between neighboring frequency bands

The implementation should be efficient enough to run every animation frame without noticeably affecting performance.

---

# 6. Suggested Color Zones

Use approximately three major frequency color regions.

The exact frequency boundaries may depend on the current analyzer implementation.

Conceptually:

```text
LOW
Blue

LOW → MID
Blue gradually transitions into yellow

MID
Yellow

MID → HIGH
Yellow gradually transitions into red

HIGH
Red
```

The important requirement is the transition quality, not the exact numeric thresholds.

---

# 7. Avoid Dirty Intermediate Colors

When interpolating the colors, avoid creating visually unpleasant muddy gray or brown tones.

The transition should remain vivid and consistent with the website's current visual identity.

For example:

```text
Blue
→ cyan-like transition
→ greenish-yellow transition
→ yellow
→ orange
→ red
```

is acceptable if it visually works well.

Do not introduce random unrelated colors.

---

# 8. Temporal Smoothing

Color transitions should also be smooth over time.

Rapid frame-to-frame changes in audio analysis must not create aggressive color flickering.

If necessary, introduce lightweight temporal smoothing.

Possible implementation:

```ts
smoothedValue =
  previousValue +
  (targetValue - previousValue) * smoothingFactor;
```

The smoothing factor should be carefully tuned.

The Waveform must still react quickly enough to audio changes.

Do not make the response feel delayed or disconnected from the music.

---

# 9. Preserve Waveform Responsiveness

The new smoothing system must not reduce the responsiveness of the Waveform.

The Waveform should still react clearly to:

- transients
- kicks
- bass hits
- snares
- loud signals
- sudden frequency changes

Only visual color transitions should become smoother.

Audio responsiveness should remain strong.

---

# 10. Language Switcher

Add a language switcher to the top-right area of the website.

The control must allow the user to switch between:

```text
English
Russian
```

The language switcher should be visible and easy to understand without being visually dominant.

---

# 11. Language Switcher Position

Place the language selector in the upper-right section of the main interface.

It should visually integrate with the existing header or top navigation area.

Do not create a completely separate large panel.

Do not make it overlap with existing controls.

The language selector must remain correctly positioned on:

- desktop monitors
- laptops
- tablets
- mobile devices
- ultrawide screens
- small browser windows
- large TV-sized displays

---

# 12. Language Switcher Design

Keep the control consistent with the current VHS / retro / dark interface style.

Possible UI formats:

```text
EN | RU
```

or

```text
EN
RU
```

inside a dropdown.

Another acceptable format:

```text
LANG: EN
```

with a small expandable menu.

Use whichever option works best with the existing interface.

Do not add a generic browser-style `<select>` if it visually breaks the website style.

If a custom dropdown is implemented, it must remain accessible and keyboard usable.

---

# 13. Language Names

The interface must support:

```text
English
Русский
```

The language menu itself may display abbreviated labels:

```text
EN
RU
```

but when expanded, full language names are preferred:

```text
English
Русский
```

---

# 14. Default Language

Keep English as the default language unless the project already contains another language preference system.

Default:

```text
English
```

Do not automatically detect browser language unless there is already an existing implementation.

The user should have explicit control over the selected language.

---

# 15. Persist Selected Language

The chosen language should persist after page reload.

Use an appropriate lightweight client-side solution such as:

```text
localStorage
```

Example behavior:

1. User selects Russian.
2. Page switches to Russian.
3. User reloads the page.
4. Russian remains selected.

Do not reset to English after every reload.

---

# 16. Language Initialization

When the page loads:

1. Check whether a saved language preference exists.
2. If it exists, use it.
3. If it does not exist, use English.

Avoid visible language flashing where possible.

For example, the page should not visibly render English and then suddenly switch to Russian a moment later.

---

# 17. Translation Architecture

Do not manually scatter conditions such as:

```tsx
language === "ru" ? "..." : "..."
```

through every JSX element.

Create a centralized translation system.

A simple translation object is acceptable.

Example:

```ts
const translations = {
  en: {
    upload: "Upload",
    play: "Play",
    pause: "Pause"
  },

  ru: {
    upload: "Загрузить",
    play: "Воспроизвести",
    pause: "Пауза"
  }
};
```

A dedicated translation file or utility is preferred if the project structure makes it cleaner.

---

# 18. Suggested Translation File Structure

A reasonable structure could be:

```text
/src
  /lib
    i18n.ts
```

or:

```text
/src
  /locales
    en.ts
    ru.ts
```

or:

```text
/src
  /translations
    en.json
    ru.json
```

Choose the structure that best matches the current project.

Do not introduce a large internationalization framework unless it is actually necessary.

For two interface languages, a lightweight custom system is preferable.

---

# 19. Do Not Overengineer Localization

Do not install large dependencies such as a full enterprise localization framework unless there is a clear reason.

The website currently only requires:

```text
English
Russian
```

Use the smallest clean solution that remains maintainable.

---

# 20. Translate the Entire Interface

Review the full website and make sure every user-visible interface string is translated.

This includes, but is not limited to:

- headings
- button labels
- upload text
- visualizer names
- audio player labels
- track information
- tooltips
- empty states
- loading states
- error messages
- modal text
- status indicators
- file-related messages
- playback text
- settings labels
- control labels
- accessibility labels where appropriate

Do not leave random English text while Russian is selected.

---

# 21. Visualizer Names

Translate visualizer names carefully.

English examples:

```text
Spectrogram
Waveform
Stereometer
Oscilloscope
Spectrum
```

Russian translations should be understandable and natural.

Possible Russian versions:

```text
Спектрограмма
Волновая форма
Стереометр
Осциллограф
Спектр
```

Use the wording that looks most appropriate inside the interface.

---

# 22. Do Not Translate Technical File Data

Do not translate dynamic data that represents user files.

For example:

```text
track-name.wav
song-title.mp3
```

must remain unchanged.

Do not modify:

- uploaded filenames
- song titles
- metadata
- file extensions
- duration numbers
- technical numeric data

Only translate interface text.

---

# 23. Russian Typography Review

After implementing the Russian language, visually inspect the entire interface.

Russian text is often longer than English.

Check for:

- text overflow
- broken buttons
- text wrapping
- clipped text
- overlapping controls
- oversized labels
- broken alignment
- uneven spacing
- mobile layout issues

Do not simply translate the strings and assume the interface still works.

---

# 24. English Typography Review

Also review the English version after localization changes.

Localization work must not accidentally break the original English layout.

Test both languages independently.

---

# 25. Font Compatibility

Confirm that the current website fonts support Cyrillic characters correctly.

Check characters such as:

```text
А
Б
В
Г
Д
Ё
Ж
Й
Ф
Ц
Щ
Ъ
Ы
Ь
Э
Ю
Я
```

Make sure they render correctly.

If the current font does not support Cyrillic properly, use a compatible fallback for Russian text while keeping the visual style as close as possible to the existing design.

Do not replace the website's typography globally unless required.

---

# 26. Font Fallback

If necessary, define a fallback stack.

Example concept:

```css
font-family:
  existingFont,
  compatibleCyrillicFont,
  monospace,
  sans-serif;
```

The fallback must visually fit the VHS / technical / retro aesthetic.

---

# 27. Language Switch Animation

The language switch may use a very subtle transition.

For example:

- quick fade
- slight opacity transition
- short text transition

Do not make the language switch unnecessarily animated.

The interface should switch quickly.

Avoid animations longer than approximately:

```text
100–250 ms
```

unless an existing transition system already defines another standard.

---

# 28. Accessibility

The language selector should be accessible.

Ensure:

- keyboard navigation works
- active language is identifiable
- focus state exists
- screen reader labels are meaningful
- controls use correct semantic HTML where possible

For example:

```text
aria-label="Change language"
```

and Russian equivalent where necessary.

---

# 29. Responsive Language Selector

Test the language selector on narrow screens.

On mobile, it must not:

- leave the viewport
- overlap visualizer buttons
- overlap navigation
- cause horizontal scrolling
- break the header layout

If necessary, reduce the selector size or slightly reorganize header spacing only on smaller breakpoints.

Do not fundamentally redesign the header.

---

# 30. Full Project Optimization Pass

Perform a full optimization review of the project.

The objective is to improve code quality and runtime efficiency while preserving current behavior.

Do not treat optimization as permission to rewrite everything.

The project should remain understandable after optimization.

---

# 31. Remove Unused Imports

Inspect every file for unused imports.

Remove imports that are no longer used.

Example:

```ts
import { useMemo, useState, useEffect } from "react";
```

If `useMemo` is unused:

```ts
import { useState, useEffect } from "react";
```

Do this consistently across the project.

---

# 32. Remove Unused Variables

Remove variables that:

- are declared but never read
- are obsolete
- were part of old experiments
- are duplicated elsewhere

Do not remove variables whose usage is indirect or difficult to immediately identify without verifying them first.

---

# 33. Remove Unused Functions

Identify helper functions or handlers that are never called.

Remove them if they have no current purpose.

Be careful with:

- event handlers
- callback references
- exported utilities
- dynamically referenced functions

Do not delete code based only on appearance.

Confirm usage first.

---

# 34. Remove Dead Code

Remove unreachable or obsolete code.

Examples:

```ts
if (false) {
  ...
}
```

old branches that can never execute

old fallback implementations

deprecated component versions

experimental rendering code that is no longer connected

---

# 35. Remove Large Commented-Out Blocks

Remove large obsolete blocks of commented-out code.

Example:

```ts
// old waveform version
// const ...
// function ...
// ...
```

If the code is no longer needed, delete it.

Do not keep dead implementations as comments.

Version control already exists for historical code.

---

# 36. Review Duplicate Logic

Look for repeated logic in multiple components.

Possible duplicate areas:

- audio normalization
- frequency calculations
- amplitude calculations
- color conversion
- color interpolation
- resize logic
- playback state
- localStorage access
- timing calculations
- visualizer shared configuration

Extract repeated logic only when doing so improves readability.

Do not create unnecessary abstractions for tiny repeated expressions.

---

# 37. Review React Re-Renders

Inspect React components for unnecessary re-renders.

Check:

- props recreated every render
- inline objects passed repeatedly
- unstable callback references
- global state updates
- audio frame state updates
- unnecessary React state

Visualizer rendering should generally avoid using React state for data that changes every animation frame unless there is a specific reason.

Use refs for high-frequency mutable values where appropriate.

---

# 38. Review requestAnimationFrame Usage

Inspect all animation loops.

Make sure:

- each visualizer has no accidental duplicate animation loop
- old loops are cancelled on unmount
- loops do not continue running after the related component is removed
- loops do not multiply after track changes
- loops do not restart unnecessarily

Use:

```ts
cancelAnimationFrame(...)
```

during cleanup.

---

# 39. Review useEffect Cleanup

Inspect all `useEffect` blocks.

Every effect that registers something persistent should correctly clean it up.

Examples:

- event listeners
- timers
- intervals
- animation frames
- ResizeObserver
- MutationObserver
- media listeners
- audio listeners

Example:

```ts
useEffect(() => {
  window.addEventListener("resize", handler);

  return () => {
    window.removeEventListener("resize", handler);
  };
}, []);
```

---

# 40. Review Event Listeners

Ensure event listeners are not added repeatedly.

Check especially:

```text
resize
mousemove
pointermove
keydown
keyup
scroll
timeupdate
loadedmetadata
ended
play
pause
```

Every listener should have a clear lifecycle.

---

# 41. Review AudioContext Usage

Inspect Web Audio API initialization.

Avoid creating multiple unnecessary `AudioContext` instances.

Confirm that track switching does not create abandoned audio nodes.

Check:

- AudioContext
- MediaElementAudioSourceNode
- AnalyserNode
- GainNode
- channel splitter nodes
- channel merger nodes
- custom audio processors

Reuse nodes where appropriate.

---

# 42. Avoid Reconnecting MediaElementSource

Remember that a single HTML media element should not be repeatedly connected through new `createMediaElementSource()` calls.

Inspect existing logic carefully.

If the current code already correctly manages this, preserve it.

Do not introduce a new audio graph bug during optimization.

---

# 43. Review Audio Graph Cleanup

When components unmount or tracks change, make sure unnecessary connections are properly handled.

Do not disconnect nodes that are still required by other visualizers.

If multiple visualizers use the same analyzer pipeline, preserve the shared architecture.

---

# 44. Analyzer Data Allocation

Avoid allocating new large arrays every animation frame when unnecessary.

Bad example:

```ts
const data = new Uint8Array(analyser.frequencyBinCount);
```

inside every animation frame.

Prefer allocating reusable arrays once.

Example:

```ts
const dataRef = useRef(
  new Uint8Array(analyser.frequencyBinCount)
);
```

or an equivalent structure suitable for the current implementation.

---

# 45. Canvas Optimization

Inspect canvas-based visualizers.

Optimize obvious inefficiencies such as:

- repeatedly resetting unchanged properties
- unnecessary full DOM reads
- repeated canvas dimension calculations
- repeated creation of gradients when not needed
- excessive `save()` / `restore()` calls
- unnecessary object creation per frame

Do not reduce visual quality.

---

# 46. Device Pixel Ratio

Make sure canvas rendering handles device pixel ratio correctly.

Avoid accidentally multiplying canvas resolution repeatedly after resize.

Check both:

```text
CSS size
internal canvas pixel size
```

The visualizers should remain sharp without wasting excessive GPU resources.

---

# 47. Resize Handling

Inspect resizing logic.

Prefer a centralized or efficient resize system.

Do not run expensive resize calculations continuously if dimensions have not changed.

Use:

```text
ResizeObserver
```

where appropriate.

If already implemented correctly, preserve it.

---

# 48. Memoization

Use memoization only when it solves an actual issue.

Possible tools:

```ts
useMemo
useCallback
React.memo
```

Do not wrap every function in `useCallback`.

Do not create unnecessary memoization complexity.

---

# 49. DOM Query Review

Avoid repeatedly calling:

```ts
document.querySelector(...)
document.getElementById(...)
```

inside animation frames.

Use React refs when possible.

---

# 50. Style Cleanup

Review CSS and Tailwind usage.

Remove:

- unused classes
- duplicated style definitions
- obsolete selectors
- old visualizer styles
- overridden rules that no longer affect anything

Do not aggressively merge styles if it makes the project harder to maintain.

---

# 51. Tailwind Cleanup

Inspect repeated long Tailwind class strings.

If the same large class set appears many times, consider extracting a reusable component or helper.

Do not create abstractions for one-off styles.

---

# 52. Reduce Layout Thrashing

Avoid patterns where the code repeatedly reads and writes layout information in the same frame.

For example:

```text
read width
change style
read width again
change style again
```

Group DOM reads and writes where practical.

---

# 53. Avoid Forced Reflow

Inspect visualizer and animation code for properties such as:

```text
offsetWidth
offsetHeight
getBoundingClientRect()
clientWidth
clientHeight
```

Avoid reading them continuously in animation loops unless absolutely necessary.

Cache dimensions and update them on resize.

---

# 54. Optimize Background Effects

The website currently contains audio-reactive and visual background effects.

Do not remove them.

Inspect whether they create unnecessary CPU or GPU usage.

Possible optimizations:

- reduce duplicate calculations
- share existing audio analysis data
- reuse arrays
- reuse animation data
- avoid independent analyzers when unnecessary

Preserve the visual quality.

---

# 55. Share Audio Data Where Appropriate

If multiple visualizers independently request the same frequency data during the same frame, investigate whether shared analysis data can reduce duplicate work.

Only implement this if it fits the current architecture cleanly.

Do not create a massive global rendering system just for optimization.

---

# 56. Avoid Excessive State Updates

Do not update React state every animation frame for purely visual values.

Values such as:

```text
instant amplitude
frequency bins
waveform samples
frame counters
temporary visual intensity
```

should usually be handled using refs or direct canvas drawing.

Use React state for actual UI state.

---

# 57. LocalStorage Utility

Since language persistence will use localStorage, avoid adding repeated direct localStorage logic across multiple components.

Create a small centralized language state or utility.

---

# 58. Client Component Boundaries

Review `"use client"` usage.

Do not mark components as client components unless they require:

- React state
- React effects
- browser APIs
- Web Audio API
- canvas
- localStorage
- user interaction

Do not attempt to convert visualizer components to server components.

However, remove unnecessary `"use client"` declarations from purely static components when safe.

---

# 59. Bundle Size Review

Check whether unnecessary packages are imported.

Do not add dependencies when the same result can be implemented with existing browser APIs or existing project utilities.

For this update especially, language switching should not require a large new library.

---

# 60. Dynamic Imports

If the project contains very heavy browser-only components that do not need to be loaded immediately, consider dynamic import only if it provides a real benefit.

Do not introduce dynamic imports everywhere.

Avoid creating loading delays for core visualizers without reason.

---

# 61. Console Cleanup

Remove unnecessary debugging output such as:

```ts
console.log(...)
console.debug(...)
```

Keep only useful error handling or intentional diagnostic output.

Do not suppress real errors.

---

# 62. Error Handling

Review existing error handling.

Make sure optimization does not remove useful error messages.

Translate user-facing error messages.

Developer-facing console errors may remain in English.

---

# 63. TypeScript Review

Fix obvious TypeScript issues.

Avoid:

```ts
any
```

where a clear type can easily be defined.

Do not spend the update completely rewriting every type.

Focus on areas touched by this update and obvious unsafe code.

---

# 64. Preserve Existing Type Safety

Do not weaken existing types just to make refactoring easier.

Avoid replacing specific types with:

```ts
any
unknown
```

unless technically necessary.

---

# 65. Code Formatting

Keep formatting consistent with the current project.

Follow the existing style for:

- semicolons
- quotes
- indentation
- file naming
- component naming
- imports
- function declarations

Do not reformat unrelated files unnecessarily.

---

# 66. Do Not Perform Cosmetic Massive Refactors

Do not change every file simply to make the diff look large.

Only modify files where changes are useful.

A smaller clean change is preferable to a massive unnecessary rewrite.

---

# 67. Preserve Existing Visual Design

The update must preserve:

- VHS aesthetic
- dark interface
- existing visualizer layout
- red/yellow/blue visual language
- audio-reactive behavior
- existing background effects
- existing spacing concept
- existing interaction style

Do not transform the site into a modern generic dashboard.

---

# 68. Preserve Existing Animations

Do not remove current animations unless they are clearly broken or responsible for a performance issue.

If an animation is optimized, its visual result should remain approximately the same.

---

# 69. Preserve Existing Audio Behavior

Track loading, track switching, playback, seeking, duration display, pause, resume, and audio analysis must continue working.

Do not alter audio playback behavior while refactoring visualizer code.

---

# 70. Preserve Uploaded File Behavior

Existing `.wav` and `.mp3` upload functionality must remain intact.

Test at minimum:

```text
.wav
.mp3
```

Do not introduce stricter file handling unless required.

---

# 71. Language Switching Must Not Affect Playback

Changing the language must not:

- pause the track
- restart the track
- reset playback time
- reset visualizers
- reload the audio file
- reset selected track
- recreate the audio graph

Only interface text should change.

---

# 72. Language Switching Must Not Reload the Page

Language changes should happen immediately on the client side.

Do not use:

```ts
window.location.reload()
```

Do not navigate to a separate page just to switch language.

---

# 73. Preserve Current Track During Language Switch

If a track is playing:

```text
English → Russian
```

the track must continue playing from exactly the same position.

The same applies when switching back:

```text
Russian → English
```

---

# 74. UI String Audit

Search the project for all user-facing hardcoded strings.

Useful search categories:

```text
button text
headings
labels
status text
placeholder text
tooltips
aria labels
error messages
loading text
empty states
```

Move appropriate strings into the translation system.

---

# 75. Avoid Translating Internal Identifiers

Do not translate internal values such as:

```text
waveform
spectrum
oscilloscope
stereometer
spectrogram
```

when they are used as:

- component IDs
- keys
- object keys
- state values
- route values
- enum values
- CSS identifiers

Translate only the displayed label.

---

# 76. Active Language Indicator

The currently selected language should be visually identifiable.

Example:

```text
EN | RU
^^
active
```

Possible differences:

- brighter text
- border
- underline
- subtle glow
- accent color
- opacity difference

Keep it subtle.

---

# 77. Keyboard Interaction

If using a button-based selector:

- Tab should focus it.
- Enter or Space should activate it.

If using a dropdown:

- Enter should open it.
- Escape should close it.
- Arrow keys should work if practical.

---

# 78. Click Outside Behavior

If the language selector uses a dropdown, clicking outside should close it.

Ensure any global click/pointer listener is removed during component cleanup.

---

# 79. Language Selector Z-Index

Ensure the language menu appears above appropriate interface layers.

It must not render behind:

- visualizers
- player
- effects
- background overlays

Avoid excessively large global z-index values.

---

# 80. Mobile Language Layout

On narrow mobile screens, acceptable approaches include:

```text
EN / RU
```

or a compact language icon with a short menu.

The selector should remain easy to use with touch.

Minimum interactive target size should remain reasonable.

---

# 81. Tablet Testing

Test language layout on common tablet widths.

Russian labels may require more horizontal space.

Ensure navigation still looks intentional.

---

# 82. Large Screen Testing

On large monitors and TV-like layouts, ensure the language selector remains aligned with the rest of the interface and does not float awkwardly far away.

Use the site's existing maximum-width/container logic where possible.

---

# 83. Waveform Desktop Testing

Check the new color interpolation during:

- quiet music
- bass-heavy music
- high-frequency content
- transient-heavy audio
- dense mixes
- very loud mastered tracks

The gradient should remain smooth in all cases.

---

# 84. Waveform Mobile Testing

Make sure the Waveform color smoothing does not cause obvious performance degradation on mobile devices.

Avoid expensive per-pixel calculations if the same effect can be achieved more efficiently.

---

# 85. Performance Measurement

Before and after optimization, inspect basic runtime behavior.

Useful indicators:

- CPU usage
- GPU load where observable
- animation smoothness
- React render frequency
- memory behavior
- number of active animation loops
- number of AudioContext instances
- number of active event listeners

No formal benchmarking framework is required.

However, the optimization should be based on actual code inspection rather than random changes.

---

# 86. Memory Leak Review

Pay special attention to possible memory leaks involving:

- object URLs
- uploaded audio files
- event listeners
- timers
- animation frames
- audio nodes
- observers
- references to old tracks

---

# 87. Object URL Cleanup

If uploaded tracks use:

```ts
URL.createObjectURL(file)
```

make sure unused object URLs are eventually cleaned with:

```ts
URL.revokeObjectURL(url)
```

Do not revoke the current active track URL while it is still needed.

---

# 88. Uploaded Track Switching Review

Test repeated behavior:

```text
upload track A
upload track B
play A
switch to B
switch to A
change language
switch visualizer
resize window
```

No errors, broken analyzers, or accumulating event handlers should occur.

---

# 89. Browser Resize Test

Repeatedly resize the browser.

Check:

- Waveform
- Spectrum
- Oscilloscope
- Spectrogram
- Stereometer
- background visualizer
- player
- track list
- language selector

No canvas should become permanently stretched or blurry.

---

# 90. Localization Length Stress Test

Test long Russian labels.

If a translation creates layout problems, slightly adjust:

- font size
- letter spacing
- component width
- responsive wrapping
- padding

Do not shorten translations into unnatural Russian solely to fit bad layout.

---

# 91. Translation Quality

Russian text must sound natural.

Avoid literal machine-translation phrasing.

The interface should read like a normal Russian software interface.

Use consistent terminology throughout the website.

For example, do not use three different translations for the same action.

---

# 92. Translation Consistency

Create consistent terms for recurring concepts.

Examples:

```text
Upload
Загрузить

Play
Воспроизвести

Pause
Пауза

Track
Трек

Duration
Длительность

Language
Язык
```

Use the same terms everywhere.

---

# 93. Do Not Translate Brand or Technical Names

Do not translate names such as:

```text
MP3
WAV
VHS
Web Audio API
Next.js
React
```

when they appear as technical identifiers or format names.

---

# 94. Metadata Language

If the project uses page metadata such as:

```ts
title
description
```

inspect whether localization should affect them.

If metadata is static and the website is essentially a single client-side application, it is acceptable to keep metadata in English.

Do not overcomplicate routing for metadata localization.

---

# 95. No Language Routes Required

Do not create separate routes such as:

```text
/en
/ru
```

unless the project already uses route-based localization.

For the current requirement, client-side language state is enough.

---

# 96. No Automatic Translation APIs

Do not use Google Translate or another external translation API.

All interface translations should exist locally in the project.

---

# 97. No Network Dependency for Language Switching

Language switching must work offline after the website has loaded.

No translation strings should be fetched from an external API.

---

# 98. Hydration Safety

Because localStorage only exists in the browser, make sure the implementation does not create React hydration errors.

Handle initial language state carefully.

If using Next.js App Router, respect server/client rendering boundaries.

---

# 99. Avoid Hydration Flicker

Try to minimize:

```text
English rendered by server
↓
page hydrates
↓
Russian suddenly replaces it
```

If needed, initialize language state safely after hydration while keeping layout stable.

Do not introduce major complexity solely for this issue.

---

# 100. Language Context

A React Context is acceptable if many components require access to language state.

Example concept:

```text
LanguageProvider
useLanguage()
t(key)
```

However, use Context only if it makes the implementation cleaner.

Do not create a complicated global state library for this.

---

# 101. Example Translation API

A simple API could look like:

```ts
const { language, setLanguage, t } = useLanguage();

t("player.play");
t("player.pause");
t("visualizers.waveform");
```

The exact implementation may differ.

The important requirements are:

- centralized strings
- clean usage
- easy future expansion
- no scattered translation logic

---

# 102. Translation Key Structure

Use logical nested translation keys.

Example:

```ts
{
  navigation: {},
  player: {},
  visualizers: {},
  tracks: {},
  upload: {},
  errors: {},
  settings: {}
}
```

Avoid hundreds of unrelated flat keys if nesting improves readability.

---

# 103. Translation Type Safety

If reasonably simple, make translation keys type-safe.

For example, derive both language objects from the same TypeScript type.

The Russian translation should contain the same keys as the English translation.

Missing translations should be caught during development if possible.

---

# 104. Missing Translation Fallback

If a translation key is unexpectedly missing, fall back to English.

Do not render:

```text
undefined
```

or:

```text
translation_missing
```

to the user.

---

# 105. Waveform Gradient Performance

Do not create a new complex gradient object for every waveform sample if unnecessary.

Possible strategies:

- precompute interpolation values
- compute normalized color mathematically
- reuse lookup tables
- cache gradients
- calculate colors per segment instead of per pixel

Choose whichever matches the current Waveform rendering architecture.

---

# 106. Optional Color Lookup Table

If color interpolation becomes expensive, a lookup table is acceptable.

Example:

```text
256 precomputed colors
```

A normalized audio/frequency value can map to one entry.

This may reduce repeated color math inside the render loop.

Only implement if useful.

---

# 107. Avoid Frame Rate Dependency

Color smoothing should behave similarly across:

```text
60 Hz
120 Hz
144 Hz
165 Hz
240 Hz
```

If possible, avoid making smoothing feel radically different based on frame rate.

Time-based interpolation is preferable if the current architecture already tracks delta time.

---

# 108. Respect Reduced Motion

If the site already supports:

```css
prefers-reduced-motion
```

keep honoring it.

Do not add a new reduced-motion system unless the project already has one or implementation is trivial.

Language switching should not use excessive motion.

---

# 109. ESLint

Run the existing lint process.

For example:

```bash
npm run lint
```

or the equivalent configured command.

Fix new warnings or errors caused by this update.

Do not silently disable lint rules to hide problems.

---

# 110. Type Check

Run TypeScript checks.

Depending on the project configuration:

```bash
npx tsc --noEmit
```

or an existing project command.

Resolve errors introduced by the update.

---

# 111. Production Build

Run:

```bash
npm run build
```

The production build must complete successfully.

Do not consider the update complete if the development server works but production build fails.

---

# 112. Runtime Testing

Start the application and test actual runtime behavior.

Do not rely exclusively on static analysis.

Check:

- audio upload
- playback
- Waveform rendering
- language switching
- persistence
- resizing
- track switching
- responsive layout

---

# 113. Browser Console

During testing, inspect the browser console.

The finished result should not produce new:

- React warnings
- hydration warnings
- canvas errors
- Web Audio API errors
- event listener errors
- missing translation errors
- localStorage exceptions

---

# 114. English Language QA

Perform a complete interface review with:

```text
English
```

selected.

Inspect every visible section.

Confirm:

- all labels are correct
- no Russian text appears
- no text is clipped
- all controls work
- layout remains visually balanced

---

# 115. Russian Language QA

Perform a complete interface review with:

```text
Русский
```

selected.

Inspect every visible section.

Confirm:

- every visible label has been translated
- text looks natural
- Cyrillic renders correctly
- buttons do not overflow
- navigation remains aligned
- mobile layout remains functional

---

# 116. Reload Persistence Test

Test:

```text
select Russian
reload
```

Expected:

```text
Russian remains selected
```

Then test:

```text
select English
reload
```

Expected:

```text
English remains selected
```

---

# 117. Language Switch Stress Test

Rapidly switch:

```text
EN
RU
EN
RU
EN
```

The application should not:

- throw errors
- reset audio
- duplicate event listeners
- remount expensive audio systems unnecessarily
- create visualizer glitches

---

# 118. Waveform Color QA

Compare the Waveform before and after changes.

The updated version should clearly demonstrate:

- smoother blue → yellow transition
- smoother yellow → red transition
- less flickering
- less harsh color banding
- stable response to music
- preserved audio reactivity

---

# 119. Performance Regression Test

After optimization and localization, confirm there is no significant regression in:

- visualizer frame rate
- page responsiveness
- interaction latency
- audio playback stability
- initial loading

---

# 120. No Feature Regression

Confirm all previously existing website functionality still works.

Do not assume unrelated systems are unaffected.

Test the full core workflow.

---

# 121. Cleanup After Refactoring

After completing the optimization pass, search again for:

```text
TODO
FIXME
console.log
unused imports
unused variables
old comments
temporary code
```

Remove temporary code introduced during development.

Keep meaningful TODO comments only if they represent real future work.

---

# 122. File Structure Review

If new localization files are added, keep the project structure clean.

Avoid placing translation data inside unrelated visualizer files.

Use descriptive names.

Example:

```text
src/
  components/
  hooks/
  lib/
  translations/
```

Use the project's existing folder conventions wherever possible.

---

# 123. Do Not Rename Everything

Do not rename components, files, variables, or directories simply for cosmetic consistency unless necessary.

Large unrelated renaming makes the update harder to review and can introduce bugs.

---

# 124. Git Diff Quality

The final code changes should be focused.

A reviewer should be able to clearly identify:

1. Waveform gradient improvements
2. localization system
3. language selector
4. code cleanup and optimization

Avoid thousands of meaningless formatting-only changes.

---

# 125. Preserve Existing Public APIs

If components or utilities are used across the project, preserve their public interfaces where practical.

Do not introduce avoidable cascading changes.

---

# 126. Maintainability

The final implementation should make future localization easier.

Adding a third language later should primarily require:

```text
adding another translation object/file
adding it to the language list
```

It should not require rewriting the interface.

---

# 127. Future Language Compatibility

Even though only English and Russian are required now, avoid hardcoding the selector so deeply that adding another language becomes difficult.

A configuration structure such as:

```ts
const languages = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" }
];
```

is preferable.

---

# 128. Do Not Add Unrequested Languages

Do not add:

- Ukrainian
- German
- French
- Spanish
- automatic locale detection

Only implement:

```text
English
Russian
```

for this update.

---

# 129. Security

Do not use unsafe HTML injection for translated text.

Avoid:

```tsx
dangerouslySetInnerHTML
```

unless already required for unrelated functionality.

Translation strings should render as normal React text.

---

# 130. Final Verification Checklist

Before considering the update complete, verify:

### Waveform

- [ ] color transitions are smoother
- [ ] low frequencies remain blue
- [ ] mid frequencies remain yellow
- [ ] high frequencies remain red
- [ ] transitions are continuous
- [ ] flickering is reduced
- [ ] waveform remains responsive
- [ ] performance remains stable

### Localization

- [ ] English is implemented
- [ ] Russian is implemented
- [ ] language selector exists in the top-right area
- [ ] active language is visible
- [ ] language persists after reload
- [ ] no page reload is required
- [ ] playback continues during language switching
- [ ] every visible UI string is translated
- [ ] Cyrillic font rendering works
- [ ] Russian layout has been visually checked
- [ ] English layout has been visually checked
- [ ] mobile layout works in both languages

### Optimization

- [ ] unused imports removed
- [ ] unused variables removed
- [ ] dead functions removed
- [ ] dead code removed
- [ ] obsolete commented blocks removed
- [ ] repeated logic reviewed
- [ ] unnecessary state updates reviewed
- [ ] animation loops cleaned up
- [ ] effect cleanup verified
- [ ] event listener cleanup verified
- [ ] AudioContext usage reviewed
- [ ] canvas rendering reviewed
- [ ] unnecessary allocations reduced
- [ ] object URLs reviewed
- [ ] console debugging removed
- [ ] TypeScript checked
- [ ] lint checked
- [ ] production build succeeds

---

# 131. Final Result Requirements

The final website should feel almost identical to the existing version in terms of design and structure.

The improvements should be noticeable mainly through:

```text
better Waveform color behavior
+
English / Russian language switching
+
cleaner and more efficient internal code
```

Do not perform a visual redesign.

Do not replace the existing visualizer system.

Do not simplify away existing effects.

Do not remove features.

Do not introduce unnecessary dependencies.

Do not create a new architecture simply because refactoring is being performed.

The update should improve the project while preserving its existing identity.
