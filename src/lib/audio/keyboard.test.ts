import { describe, expect, it } from "vitest";

import { commandForKey, isEditableTarget } from "./keyboard";

describe("keyboard transport routing", () => {
  it("maps the specified transport keys", () => {
    expect(commandForKey(" ")).toBe("toggle");
    expect(commandForKey("ArrowLeft")).toBe("seek-backward");
    expect(commandForKey("ArrowRight")).toBe("seek-forward");
    expect(commandForKey("ArrowUp")).toBe("volume-up");
    expect(commandForKey("ArrowDown")).toBe("volume-down");
    expect(commandForKey("m")).toBe("mute");
    expect(commandForKey("N")).toBe("next");
    expect(commandForKey("p")).toBe("previous");
    expect(commandForKey("Escape")).toBeNull();
  });

  it("protects editable and native control targets", () => {
    for (const tag of ["input", "textarea", "select", "button"]) {
      expect(isEditableTarget(document.createElement(tag))).toBe(true);
    }
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    expect(isEditableTarget(editable)).toBe(true);
    expect(isEditableTarget(document.createElement("main"))).toBe(false);
  });
});
