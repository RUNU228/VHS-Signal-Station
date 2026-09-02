import { act, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

const imports = vi.hoisted(() => ({ motion: 0 }));
vi.mock("framer-motion", async (importOriginal) => {
  imports.motion++;
  return importOriginal<typeof import("framer-motion")>();
});
import { SmoothCursor } from "./smooth-cursor";

it("does not load animation on unsupported devices and loads it when capability becomes available", async () => {
  let fine = false;
  let motion = false;
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const notifyChange = () => {
    const event = new Event("change");
    listeners.forEach((listener) => {
      if (typeof listener === "function") listener(event);
      else listener.handleEvent(event);
    });
  };
  window.matchMedia = vi.fn((query: string) => ({
    get matches() { return query.includes("pointer") ? fine : motion; },
    media: query, onchange: null,
    addEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === "change" && listener) listeners.add(listener);
    },
    removeEventListener: (type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === "change" && listener) listeners.delete(listener);
    },
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  } as MediaQueryList));
  const view = render(<SmoothCursor cursor={<span>custom tracking artwork</span>} />);
  expect(imports.motion).toBe(0);
  act(() => { fine = true; notifyChange(); });
  expect(imports.motion).toBe(0);
  expect(document.documentElement.dataset.smoothCursor).toBeUndefined();
  await act(async () => { motion = true; notifyChange(); });
  await act(async () => { await vi.dynamicImportSettled(); });
  expect(await screen.findByText("custom tracking artwork")).toBeInTheDocument();
  expect(imports.motion).toBe(1);
  act(() => { motion = false; notifyChange(); });
  expect(screen.queryByTestId("smooth-cursor")).not.toBeInTheDocument();
  expect(document.documentElement.dataset.smoothCursor).toBeUndefined();
  view.unmount();
  expect(listeners.size).toBe(0);
});
