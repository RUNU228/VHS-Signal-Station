import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCanvasSurface } from "./useCanvasSurface";

describe("useCanvasSurface", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("caps pixel density and applies a resolution scale", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 200,
    } as DOMRect);
    const canvasRef = createRef<HTMLCanvasElement>();
    canvasRef.current = canvas;

    renderHook(() =>
      useCanvasSurface(canvasRef, {
        maxDevicePixelRatio: 1.5,
        resolutionScale: 0.5,
      }),
    );

    expect(canvas.width).toBe(300);
    expect(canvas.height).toBe(150);
  });

  it("keeps existing callers on the capped full-resolution default", () => {
    vi.stubGlobal("devicePixelRatio", 3);
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 100,
      height: 50,
    } as DOMRect);
    const canvasRef = createRef<HTMLCanvasElement>();
    canvasRef.current = canvas;

    renderHook(() => useCanvasSurface(canvasRef));

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });
});
