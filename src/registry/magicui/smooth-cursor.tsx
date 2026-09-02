"use client";

import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";

export type SpringConfig = {
  damping?: number;
  stiffness?: number;
  mass?: number;
  restDelta?: number;
};

export type SmoothCursorProps = {
  cursor?: ReactNode;
  springConfig?: SpringConfig;
};

const SmoothCursorDisplay = lazy(() =>
  import("./smooth-cursor-display").then((module) => ({ default: module.SmoothCursorDisplay })),
);

export function SmoothCursor({ cursor, springConfig }: SmoothCursorProps) {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const updateSupport = () => setIsSupported(finePointer.matches && reducedMotion.matches);

    updateSupport();
    finePointer.addEventListener("change", updateSupport);
    reducedMotion.addEventListener("change", updateSupport);

    return () => {
      finePointer.removeEventListener("change", updateSupport);
      reducedMotion.removeEventListener("change", updateSupport);
    };
  }, []);

  if (!isSupported) return null;

  return (
    <Suspense fallback={null}>
      <SmoothCursorDisplay cursor={cursor} springConfig={springConfig} />
    </Suspense>
  );
}
