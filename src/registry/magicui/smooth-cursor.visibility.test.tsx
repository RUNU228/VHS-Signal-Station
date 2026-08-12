import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

const stateHarness = vi.hoisted(() => ({ updates: [] as unknown[] }));

vi.mock("react", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  function useTrackedState<State>(initialState: State | (() => State)) {
    const [state, setState] = React.useState(initialState);
    const setter = React.useRef(setState);
    setter.current = setState;
    const trackedSetter = React.useCallback((nextState: React.SetStateAction<State>) => {
      stateHarness.updates.push(nextState);
      setter.current(nextState);
    }, []);
    return [state, trackedSetter] as const;
  }

  return { ...React, useState: useTrackedState };
});

import { SmoothCursor } from "./smooth-cursor";

beforeEach(() => {
  stateHarness.updates.length = 0;
  window.matchMedia = vi.fn((query: string) => ({
    matches: query === "(hover: hover) and (pointer: fine)" ||
      query === "(prefers-reduced-motion: no-preference)",
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
});

it("transitions visibility only once across repeated pointer moves", async () => {
  render(<SmoothCursor />);
  await screen.findByTestId("smooth-cursor");
  stateHarness.updates.length = 0;

  fireEvent.pointerMove(window, { clientX: 10, clientY: 20 });
  fireEvent.pointerMove(window, { clientX: 20, clientY: 30 });
  fireEvent.pointerMove(window, { clientX: 30, clientY: 40 });

  expect(stateHarness.updates).toEqual([true]);
});
