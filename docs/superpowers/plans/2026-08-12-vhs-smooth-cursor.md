# VHS Smooth Cursor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a desktop-only Magic UI-compatible smooth cursor with custom VHS tracking-head artwork, precise spring motion, touch/reduced-motion fallbacks, and global native-cursor replacement.

**Architecture:** Keep the reusable pointer engine in `src/registry/magicui/smooth-cursor.tsx` with the official `cursor` and `springConfig` interface and a single `framer-motion` dependency. A site-specific `VhsSmoothCursor` wrapper owns the SVG and tuning, while the root layout mounts it once and global CSS hides the native cursor only when the component confirms a fine pointer with motion enabled.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4/global CSS, Framer Motion, Vitest, Testing Library.

## Global Constraints

- Export `SmoothCursor` from `src/registry/magicui/smooth-cursor.tsx`.
- Preserve the Magic UI-compatible `cursor?: ReactNode` and `springConfig?: SpringConfig` API.
- Add only `framer-motion`; do not install the full Magic UI package or shadcn tooling.
- Mount one cursor globally from the server root layout through a client wrapper.
- Enable only for `(hover: hover) and (pointer: fine)` with `prefers-reduced-motion: no-preference`.
- Keep the native cursor on touch, coarse-pointer, reduced-motion, print, and text-editing surfaces.
- Do not hide the native cursor until client capability detection succeeds.
- The custom cursor must use fixed positioning, `pointer-events: none`, `aria-hidden`, and a z-index above the VHS atmosphere.
- Hide it before the first pointer position and while the pointer is outside the document.
- Animate transform and opacity without React state updates for pointer coordinates.
- Git metadata is read-only and the repository is unborn; use `git diff --check` instead of commits.

---

### Task 1: Reusable Smooth Cursor Engine

**Files:**
- Create: `src/registry/magicui/smooth-cursor.tsx`
- Create: `src/registry/magicui/smooth-cursor.test.tsx`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `ReactNode`, optional spring settings, fine-pointer and reduced-motion media-query results, document pointer events.
- Produces: `SpringConfig`, `SmoothCursorProps`, and `SmoothCursor` named exports; the component sets `document.documentElement.dataset.smoothCursor = "active"` only while enabled.

- [ ] **Step 1: Add the official animation dependency**

Run:

```powershell
pnpm add framer-motion
```

If the managed package store differs, use the existing project store location rather than reinstalling unrelated dependencies. Verify only `package.json`, `pnpm-lock.yaml`, and dependency links change.

- [ ] **Step 2: Write failing behavior tests**

Create a controllable `matchMedia` test double and tests covering:

```tsx
it("enables only for a fine hover pointer without reduced motion", async () => {
  setMedia({ finePointer: true, reducedMotion: false });
  render(<SmoothCursor cursor={<span>VS</span>} />);
  await waitFor(() =>
    expect(document.documentElement.dataset.smoothCursor).toBe("active"),
  );
  expect(screen.getByText("VS")).toBeInTheDocument();
});

it("keeps the custom and native cursor disabled for reduced motion", async () => {
  setMedia({ finePointer: true, reducedMotion: true });
  render(<SmoothCursor />);
  expect(document.documentElement.dataset.smoothCursor).toBeUndefined();
  expect(screen.queryByTestId("smooth-cursor")).not.toBeInTheDocument();
});

it("stays hidden until movement and hides when the pointer leaves", async () => {
  setMedia({ finePointer: true, reducedMotion: false });
  render(<SmoothCursor />);
  const cursor = await screen.findByTestId("smooth-cursor");
  expect(cursor).toHaveAttribute("data-visible", "false");
  fireEvent.pointerMove(window, { clientX: 100, clientY: 80 });
  expect(cursor).toHaveAttribute("data-visible", "true");
  fireEvent.pointerLeave(document);
  expect(cursor).toHaveAttribute("data-visible", "false");
});

it("removes cursor activation and listeners on unmount", async () => {
  const add = vi.spyOn(window, "addEventListener");
  const remove = vi.spyOn(window, "removeEventListener");
  const view = render(<SmoothCursor />);
  await waitFor(() => expect(add).toHaveBeenCalled());
  view.unmount();
  expect(remove).toHaveBeenCalled();
  expect(document.documentElement.dataset.smoothCursor).toBeUndefined();
});
```

- [ ] **Step 3: Run focused tests and verify RED**

```powershell
node node_modules\vitest\vitest.mjs run src\registry\magicui\smooth-cursor.test.tsx
```

Expected: FAIL because the registry component does not exist.

- [ ] **Step 4: Implement the client cursor engine**

Create a `"use client"` component using `motion`, `useMotionValue`, and `useSpring` from `framer-motion`.

Implementation requirements:

- default spring `{ damping: 45, stiffness: 400, mass: 1, restDelta: 0.001 }`;
- capability state changes only when the fine-pointer or reduced-motion media query changes;
- pointer coordinates use motion values, not React state;
- first pointer movement initializes the spring at the current coordinates and reveals the cursor;
- later movement calculates direction with `Math.atan2(deltaY, deltaX)` and updates rotation;
- `pointerleave` hides and `pointerenter` permits the next movement to reveal;
- the root dataset activates only while supported;
- listeners, media-query listeners, and dataset state clean up on unmount;
- the rendered `motion.div` has `data-testid="smooth-cursor"`, `data-visible`, `aria-hidden="true"`, fixed positioning, pointer-event exclusion, transform origin at the tip, and opacity bound to visibility.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the command from Step 3. Expected: all cursor behavior tests pass with pristine output.

- [ ] **Step 6: Check task hygiene**

```powershell
git diff --check
```

Expected: no whitespace errors; no commit is possible because Git metadata is read-only.

---

### Task 2: VHS Tracking-Head Cursor and Global Integration

**Files:**
- Create: `src/components/ui/VhsSmoothCursor.tsx`
- Create: `src/components/ui/VhsSmoothCursor.test.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `SmoothCursor` and its public spring configuration.
- Produces: one globally mounted tracking-head pointer and capability-gated native-cursor CSS.

- [ ] **Step 1: Write the failing wrapper test**

Mock only the cursor engine boundary and assert the wrapper supplies the site-specific artwork and exact spring tuning:

```tsx
it("supplies the VHS tracking head and responsive spring tuning", () => {
  render(<VhsSmoothCursor />);
  expect(screen.getByLabelText("VHS tracking cursor artwork")).toBeInTheDocument();
  expect(cursorProps.springConfig).toEqual({
    damping: 36,
    stiffness: 360,
    mass: 0.65,
    restDelta: 0.001,
  });
});
```

- [ ] **Step 2: Run the wrapper test and verify RED**

```powershell
node node_modules\vitest\vitest.mjs run src\components\ui\VhsSmoothCursor.test.tsx
```

Expected: FAIL because `VhsSmoothCursor` does not exist.

- [ ] **Step 3: Build the cursor artwork**

Create a 28×32 SVG with its active tip at approximately `(2, 2)`. Use a compact angular gunmetal pointer, phosphor tip, amber edge, and restrained blue/red offset strokes. Give the SVG `aria-label="VHS tracking cursor artwork"` for the component test while its parent remains accessibility-hidden to users. Pass the exact spring configuration from Step 1 to `SmoothCursor`.

- [ ] **Step 4: Mount the client wrapper from the root layout**

Import `VhsSmoothCursor` into `src/app/layout.tsx` and render it once inside `<body>` after `{children}`. Keep the layout itself a Server Component.

- [ ] **Step 5: Add capability-gated global CSS**

Add rules equivalent to:

```css
@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) {
  html[data-smooth-cursor="active"],
  html[data-smooth-cursor="active"] body,
  html[data-smooth-cursor="active"] body * {
    cursor: none !important;
  }

  html[data-smooth-cursor="active"] :is(input, textarea, select, [contenteditable="true"]) {
    cursor: text !important;
  }
}

@media print, (prefers-reduced-motion: reduce), (hover: none), (pointer: coarse) {
  [data-testid="smooth-cursor"] {
    display: none !important;
  }
}
```

The component's fixed layer must use a z-index above `20`, `pointer-events: none`, `will-change: transform`, and no layout-affecting animation.

- [ ] **Step 6: Run focused and complete verification**

```powershell
node node_modules\vitest\vitest.mjs run src\registry\magicui\smooth-cursor.test.tsx src\components\ui\VhsSmoothCursor.test.tsx
node node_modules\vitest\vitest.mjs run
node node_modules\eslint\bin\eslint.js .
node node_modules\next\dist\bin\next build
```

Expected: focused and complete tests pass, ESLint is clean, and Next.js compiles, type-checks, and prerenders `/`.

- [ ] **Step 7: Browser verification**

At `http://localhost:3000`, verify:

- the native cursor is replaced only after desktop capability detection;
- the tracking-head tip aligns with the actual pointer;
- movement and rotation feel smooth but precise over buttons, sliders, canvases, and upload controls;
- clicks, hover, dragging, and the file chooser are not intercepted;
- leaving and re-entering the document does not flash at the origin;
- a mobile/coarse viewport has no custom cursor;
- reduced-motion has no custom cursor;
- browser warnings and errors remain empty.

- [ ] **Step 8: Final workspace check**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and only intentional project changes in the unborn working tree.
