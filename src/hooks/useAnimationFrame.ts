"use client";

import { useEffect, useRef } from "react";

export function useAnimationFrame(
  draw: (time: number) => void,
  active = true,
): void {
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    if (!active || typeof requestAnimationFrame === "undefined") return;
    let frame = 0;
    const loop = (time: number) => {
      drawRef.current(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}
