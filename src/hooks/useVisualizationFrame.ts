"use client";

import { useEffect, useEffectEvent, useRef, type RefObject } from "react";

import type { AudioVisualizationBus, AudioVisualizationFrame } from "@/types/audio";

type VisualizationDraw = (frame: AudioVisualizationFrame, time: number, renderOnly?: boolean) => void;

export function useVisualizationFrame(
  bus: AudioVisualizationBus,
  draw: VisualizationDraw,
  active = true,
  visibleRef?: RefObject<boolean>,
): void {
  const drawRef = useRef(draw);

  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  const paintHiddenFinalFrame = useEffectEvent((frame: AudioVisualizationFrame, time: number) => {
    if (visibleRef?.current === false) drawRef.current(frame, time, true);
  });

  useEffect(() => {
    if (!active) return;
    let lastFrame: AudioVisualizationFrame | undefined;
    let lastTime = 0;
    const unsubscribe = bus.subscribe((frame, time) => {
      lastFrame = frame;
      lastTime = time;
      drawRef.current(frame, time);
    });
    return () => {
      // Paint once on a hidden pause before the shared buffers are cleared.
      // Render-only must not append history or advance particle/peak state.
      if (lastFrame) paintHiddenFinalFrame(lastFrame, lastTime);
      unsubscribe();
    };
  }, [active, bus, visibleRef]);
}
