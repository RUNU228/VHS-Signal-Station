"use client";

import { SmoothCursor } from "@/registry/magicui/smooth-cursor";

export function VhsSmoothCursor() {
  return (
    <SmoothCursor
      springConfig={{
        damping: 36,
        stiffness: 360,
        mass: 0.65,
        restDelta: 0.001,
      }}
      cursor={
        <svg
          aria-label="VHS tracking cursor artwork"
          height="32"
          style={{ transform: "translate(-2px, -2px)" }}
          viewBox="0 0 28 32"
          width="28"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M4 2 25 13l-9 3 6 11-6 3-6-11-7 7Z" fill="#a84d43" opacity="0.48" />
          <path d="M1 4 22 15l-9 3 6 11-6 3-6-11-7 7Z" fill="#6f91a8" opacity="0.52" />
          <path
            d="M2 2 23 13l-8.6 3.1 5.8 10.7-5.2 2.8-5.9-10.8-6.6 6.8Z"
            fill="#171a1a"
            stroke="#6d706c"
            strokeLinejoin="bevel"
          />
          <path d="M3.5 3.8 19.2 12l-6.8 2.4" fill="none" stroke="#c49a52" strokeWidth="1.25" />
          <path d="M2 2 6.2 4.2" fill="none" stroke="#e6d7a3" strokeLinecap="square" strokeWidth="2" />
          <circle cx="2" cy="2" fill="#e6d7a3" r="1.5" />
        </svg>
      }
    />
  );
}
