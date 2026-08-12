import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";

import type { SmoothCursorProps } from "@/registry/magicui/smooth-cursor";

let cursorProps: SmoothCursorProps;

vi.mock("@/registry/magicui/smooth-cursor", () => ({
  SmoothCursor: (props: SmoothCursorProps) => {
    cursorProps = props;
    return props.cursor;
  },
}));

import { VhsSmoothCursor } from "./VhsSmoothCursor";

beforeEach(() => {
  cursorProps = {};
});

it("supplies the VHS tracking head and responsive spring tuning", () => {
  render(<VhsSmoothCursor />);
  const artwork = screen.getByLabelText("VHS tracking cursor artwork");
  expect(artwork).toBeInTheDocument();
  expect(artwork).toHaveStyle({ transform: "translate(-2px, -2px)" });
  expect(cursorProps.springConfig).toEqual({
    damping: 36,
    stiffness: 360,
    mass: 0.65,
    restDelta: 0.001,
  });
});
