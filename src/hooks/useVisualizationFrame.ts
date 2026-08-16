"use client";

import { useEffect, useRef } from "react";

import type { AudioVisualizationBus, AudioVisualizationListener } from "@/types/audio";

export function useVisualizationFrame(
  bus: AudioVisualizationBus,
  draw: AudioVisualizationListener,
  active = true,
): void {
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(
    () => active
      ? bus.subscribe((frame, time) => drawRef.current(frame, time))
      : undefined,
    [active, bus],
  );
}
