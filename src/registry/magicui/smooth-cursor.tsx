"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

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

const defaultSpringConfig: Required<SpringConfig> = {
  damping: 45,
  stiffness: 400,
  mass: 1,
  restDelta: 0.001,
};

const defaultCursor = (
  <svg
    aria-hidden="true"
    data-smooth-cursor-artwork="default"
    height="24"
    viewBox="0 0 20 24"
    width="20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M0 0 18 11l-7 2.2 4.2 8-4 2.1-4.3-8.1L1 20Z" fill="#171a1a" stroke="#e6d7a3" />
  </svg>
);

function shortestRotationTarget(current: number, next: number) {
  const delta = ((next - current + 180) % 360 + 360) % 360 - 180;
  return current + delta;
}

export function SmoothCursor({ cursor = defaultCursor, springConfig }: SmoothCursorProps) {
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

  return <SmoothCursorDisplay cursor={cursor} springConfig={springConfig} />;
}

function SmoothCursorDisplay({ cursor, springConfig }: SmoothCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const resolvedSpringConfig = { ...defaultSpringConfig, ...springConfig };
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotationTarget = useMotionValue(0);
  const cursorX = useSpring(pointerX, resolvedSpringConfig);
  const cursorY = useSpring(pointerY, resolvedSpringConfig);
  const cursorRotation = useSpring(rotationTarget, resolvedSpringConfig);
  const previousPosition = useRef<{ x: number; y: number } | null>(null);
  const accumulatedRotation = useRef(0);
  const pointerMayReveal = useRef(true);
  const isVisibleRef = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.smoothCursor = "active";

    const moveCursor = (event: PointerEvent) => {
      if (!pointerMayReveal.current) return;

      const nextPosition = { x: event.clientX, y: event.clientY };
      if (previousPosition.current === null) {
        pointerX.set(nextPosition.x);
        pointerY.set(nextPosition.y);
        cursorX.set(nextPosition.x);
        cursorY.set(nextPosition.y);
      } else {
        const deltaX = nextPosition.x - previousPosition.current.x;
        const deltaY = nextPosition.y - previousPosition.current.y;
        if (deltaX !== 0 || deltaY !== 0) {
          const nextRotation = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
          accumulatedRotation.current = shortestRotationTarget(
            accumulatedRotation.current,
            nextRotation,
          );
          rotationTarget.set(accumulatedRotation.current);
        }
        pointerX.set(nextPosition.x);
        pointerY.set(nextPosition.y);
      }
      previousPosition.current = nextPosition;
      if (!isVisibleRef.current) {
        isVisibleRef.current = true;
        setIsVisible(true);
      }
    };
    const hideCursor = () => {
      pointerMayReveal.current = false;
      previousPosition.current = null;
      if (isVisibleRef.current) {
        isVisibleRef.current = false;
        setIsVisible(false);
      }
    };
    const allowCursor = () => {
      pointerMayReveal.current = true;
    };

    window.addEventListener("pointermove", moveCursor);
    document.addEventListener("pointerleave", hideCursor);
    document.addEventListener("pointerenter", allowCursor);

    return () => {
      window.removeEventListener("pointermove", moveCursor);
      document.removeEventListener("pointerleave", hideCursor);
      document.removeEventListener("pointerenter", allowCursor);
      delete document.documentElement.dataset.smoothCursor;
    };
  }, [cursorX, cursorY, pointerX, pointerY, rotationTarget]);

  return (
    <motion.div
      aria-hidden="true"
      className="smooth-cursor"
      data-testid="smooth-cursor"
      data-visible={isVisible}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ opacity: { duration: 0.15 } }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 30,
        pointerEvents: "none",
        transformOrigin: "0 0",
        x: cursorX,
        y: cursorY,
        rotate: cursorRotation,
      }}
    >
      {cursor}
    </motion.div>
  );
}
