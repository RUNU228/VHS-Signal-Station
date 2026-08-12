import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type FakeMotionValue = {
  get: () => number;
  set: ReturnType<typeof vi.fn<(next: number) => void>>;
};

type SpringRecord = {
  source: FakeMotionValue;
  result: FakeMotionValue;
  config: Record<string, number>;
};

const motionHarness = vi.hoisted(() => ({
  latestStyle: {} as Record<string, unknown>,
  springs: [] as SpringRecord[],
}));

vi.mock("framer-motion", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  const createMotionValue = (initial: number): FakeMotionValue => {
    let current = initial;
    return {
      get: () => current,
      set: vi.fn((next: number) => {
        current = next;
      }),
    };
  };

  const useMotionValue = (initial: number) => {
    const value = React.useRef<FakeMotionValue | null>(null);
    value.current ??= createMotionValue(initial);
    return value.current;
  };

  const useSpring = (source: FakeMotionValue, config: Record<string, number>) => {
    const result = React.useRef<FakeMotionValue | null>(null);
    const record = React.useRef<SpringRecord | null>(null);
    result.current ??= createMotionValue(source.get());
    if (record.current === null) {
      record.current = { source, result: result.current, config };
      motionHarness.springs.push(record.current);
    }
    return result.current;
  };

  const MotionDiv = ({
    animate: _animate,
    children,
    style,
    transition: _transition,
    ...props
  }: ComponentPropsWithoutRef<"div"> & {
    animate?: unknown;
    children?: ReactNode;
    style?: Record<string, unknown>;
    transition?: unknown;
  }) => {
    void _animate;
    void _transition;
    motionHarness.latestStyle = style ?? {};
    return React.createElement("div", props, children);
  };

  return {
    motion: { div: MotionDiv },
    useMotionValue,
    useSpring,
  };
});

import { SmoothCursor } from "./smooth-cursor";

describe("SmoothCursor motion targets", () => {
  beforeEach(() => {
    motionHarness.latestStyle = {};
    motionHarness.springs.length = 0;
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

  it("springs rotation and accumulates the shortest path across the angle boundary", async () => {
    render(<SmoothCursor cursor={<span>tracking head</span>} />);
    await screen.findByTestId("smooth-cursor");

    const xSpring = motionHarness.springs.find(
      ({ result }) => result === motionHarness.latestStyle.x,
    );
    const ySpring = motionHarness.springs.find(
      ({ result }) => result === motionHarness.latestStyle.y,
    );
    const rotationSpring = motionHarness.springs.find(
      ({ result }) => result === motionHarness.latestStyle.rotate,
    );

    expect(xSpring).toBeDefined();
    expect(ySpring).toBeDefined();
    expect(rotationSpring).toBeDefined();

    fireEvent.pointerMove(window, { clientX: 100, clientY: 100 });
    expect(xSpring!.source.set).toHaveBeenLastCalledWith(100);
    expect(ySpring!.source.set).toHaveBeenLastCalledWith(100);
    expect(xSpring!.result.set).toHaveBeenLastCalledWith(100);
    expect(ySpring!.result.set).toHaveBeenLastCalledWith(100);
    expect(rotationSpring!.source.set).not.toHaveBeenCalled();

    fireEvent.pointerMove(window, { clientX: 0, clientY: 102 });
    expect(rotationSpring!.source.set.mock.lastCall?.[0]).toBeCloseTo(178.8542371618249);

    fireEvent.pointerMove(window, { clientX: -100, clientY: 100 });
    expect(rotationSpring!.source.set.mock.lastCall?.[0]).toBeCloseTo(181.1457628381751);

    fireEvent.pointerLeave(document);
    fireEvent.pointerMove(window, { clientX: 250, clientY: 250 });
    expect(xSpring!.source.set).not.toHaveBeenLastCalledWith(250);

    fireEvent.pointerEnter(document);
    fireEvent.pointerMove(window, { clientX: 400, clientY: 300 });
    expect(xSpring!.result.set).toHaveBeenLastCalledWith(400);
    expect(ySpring!.result.set).toHaveBeenLastCalledWith(300);
    expect(rotationSpring!.source.set).toHaveBeenCalledTimes(2);
  });
});
