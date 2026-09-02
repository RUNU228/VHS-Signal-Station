"use client";

import { useEffect, useEffectEvent, useRef, type RefObject } from "react";

export type CanvasSurfaceOptions = {
  maxDevicePixelRatio?: number;
  resolutionScale?: number;
  active?: boolean;
};

export function useCanvasSurface(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  {
    maxDevicePixelRatio = 2,
    resolutionScale = 1,
    active = true,
  }: CanvasSurfaceOptions = {},
): RefObject<boolean> {
  const visibleRef = useRef(true);
  const reveal = useEffectEvent(() => {
    const canvas = canvasRef.current;
    // Live rendering resumes next frame. A paused surface already received its
    // final frame during unsubscribe and must retain that image.
    if (active && canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  });
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !visibleRef.current) reveal();
        visibleRef.current = entry.isIntersecting;
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width || canvas.clientWidth || 640));
      const height = Math.max(1, Math.round(bounds.height || canvas.clientHeight || 260));
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        Math.max(1, maxDevicePixelRatio),
      );
      const scale = Math.min(1, Math.max(0.1, resolutionScale));
      const pixelWidth = Math.max(1, Math.round(width * dpr * scale));
      const pixelHeight = Math.max(1, Math.round(height * dpr * scale));

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
  }, [canvasRef, maxDevicePixelRatio, resolutionScale]);
  return visibleRef;
}
