"use client";

import { useEffect, type RefObject } from "react";

export function useCanvasSurface(
  canvasRef: RefObject<HTMLCanvasElement | null>,
): void {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width || canvas.clientWidth || 640));
      const height = Math.max(1, Math.round(bounds.height || canvas.clientHeight || 260));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pixelWidth = Math.round(width * dpr);
      const pixelHeight = Math.round(height * dpr);

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
    };

    resize();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);
}
