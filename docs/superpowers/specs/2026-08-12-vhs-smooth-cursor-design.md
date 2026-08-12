# VHS Smooth Cursor Design

## Purpose

Add a global physics-based cursor that replaces the native pointer on desktop mouse and trackpad devices while matching the VHS Signal Station's industrial broadcast aesthetic. The cursor must remain precise enough for transport buttons, range controls, and file-loading interactions.

## Component Architecture

Create and export `SmoothCursor` at:

```text
src/registry/magicui/smooth-cursor.tsx
```

The component is a client boundary because it listens to pointer movement and uses browser media queries. It accepts the Magic UI-compatible public interface:

```ts
type SpringConfig = {
  damping: number;
  stiffness: number;
  mass: number;
  restDelta: number;
};

type SmoothCursorProps = {
  cursor?: React.ReactNode;
  springConfig?: SpringConfig;
};
```

Create a small site-specific client wrapper at:

```text
src/components/ui/VhsSmoothCursor.tsx
```

The wrapper supplies the VHS cursor artwork and tuned spring values. Mount this wrapper once from the root layout so it appears across the complete site without adding instructional demo text to the interface.

## Visual Direction

Use a compact angular SVG inspired by a VHS deck cue marker and tape-head alignment indicator. It should read immediately as a pointer rather than a decorative badge.

Visual layers:

- near-black and gunmetal main body;
- pale phosphor pointer tip for precise targeting;
- restrained amber edge highlight;
- very subtle blue and muted-red offset strokes to echo analog chromatic misalignment;
- faint phosphor glow that stays crisp rather than blurry.

Keep the cursor approximately 24–28 pixels tall. Its active tip must align with the actual pointer coordinates. Do not add a long trail, particle emitter, large crosshair, label, or permanent instructional text.

## Motion

Use spring-driven translation and rotation based on pointer direction. Tune the spring to feel like a light mechanical tracking head: responsive, slightly weighted, and never floaty. The cursor must settle quickly enough to operate seek and volume sliders accurately.

Animate transform and opacity only. Use `requestAnimationFrame` or the animation library used by the official Magic UI implementation; do not update React state on every pointer frame.

## Pointer and Device Rules

Activate the custom cursor only when both conditions are true:

```css
(hover: hover) and (pointer: fine)
```

Disable it for:

- touch-first devices;
- coarse pointers;
- users with `prefers-reduced-motion: reduce`;
- print output.

When disabled, render no custom pointer and retain the browser cursor.

On supported devices, hide the native cursor globally. Restore the native text cursor for text inputs, textareas, selects, and editable content. Keep the custom cursor non-interactive with `pointer-events: none`, fixed positioning, a top-level z-index above the VHS atmosphere, and accessibility-hidden semantics.

## Interaction Behavior

The cursor follows all ordinary pointer movement across the page. It remains visible over buttons, canvases, upload controls, and sliders. It must not intercept clicks, drag gestures, hover states, focus, or file chooser actions.

Hide the custom cursor when the pointer leaves the document and restore it on re-entry without jumping from the origin. Do not show it before the first valid pointer position is known.

## Styling Integration

Add global cursor-hiding rules only inside the fine-pointer, non-reduced-motion media query. Reuse the existing palette variables where practical:

- `--void` for the body;
- `--phosphor` for the tip;
- `--amber` for the warm edge;
- `--blue` and `--red` for restrained chromatic offsets.

The SVG itself may use fixed matching values when CSS-variable support inside animation markup would complicate rendering.

## Dependencies

Use the current official Magic UI Smooth Cursor implementation pattern. Add only the animation dependency it requires; do not introduce the full Magic UI package or unrelated UI tooling. Keep the component source local and editable in the project registry path.

## Testing and Verification

Automated tests will verify:

- the wrapper renders the custom tracking-head cursor;
- the exported component attaches and removes pointer listeners;
- the custom cursor is hidden before the first valid pointer position;
- pointer movement updates its animated target;
- document leave/enter visibility behavior is safe;
- reduced-motion and non-fine-pointer conditions retain the native cursor;
- no listener or animation resource leaks after unmount.

Final verification will include:

- focused component tests;
- complete Vitest suite;
- ESLint;
- Next.js production build and type-check;
- desktop browser inspection over buttons, Canvas modules, sliders, and the upload control;
- confirmation that touch/mobile layouts retain the native cursor;
- browser warning/error inspection;
- reduced-motion inspection.
