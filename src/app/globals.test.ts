import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const globalsCss = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
const cursorCss = globalsCss.slice(globalsCss.indexOf(".smooth-cursor"));

function styleRules(rules: CSSRuleList): CSSStyleRule[] {
  return Array.from(rules).flatMap((rule) => {
    if (rule instanceof CSSStyleRule) return [rule];
    if ("cssRules" in rule) return styleRules((rule as CSSGroupingRule).cssRules);
    return [];
  });
}

describe("smooth cursor global selectors", () => {
  afterEach(() => {
    delete document.documentElement.dataset.smoothCursor;
    document.body.replaceChildren();
  });

  it("restores text cursors only on editing surfaces and their descendants", () => {
    const style = document.createElement("style");
    style.textContent = cursorCss;
    document.head.append(style);
    const textCursorRule = styleRules(style.sheet!.cssRules).find(
      (rule) => rule.style.cursor === "text",
    );
    expect(textCursorRule).toBeDefined();

    document.documentElement.dataset.smoothCursor = "active";
    document.body.innerHTML = `
      <input data-editing="plain">
      <input data-editing="search" type="search">
      <input data-editing="email" type="email">
      <textarea data-editing="textarea"></textarea>
      <select data-editing="select"><option>one</option></select>
      <div contenteditable="true" data-editing="editor"><span data-editing="editor-child"></span></div>
      <input data-custom="range" type="range">
      <input data-custom="file" type="file">
      <input data-custom="button" type="button">
      <input data-custom="checkbox" type="checkbox">
    `;

    document.querySelectorAll("[data-editing]").forEach((element) => {
      expect(element.matches(textCursorRule!.selectorText), element.outerHTML).toBe(true);
    });
    document.querySelectorAll("[data-custom]").forEach((element) => {
      expect(element.matches(textCursorRule!.selectorText), element.outerHTML).toBe(false);
    });

    style.remove();
  });

  it("uses the semantic cursor layer class for capability fallbacks", () => {
    const style = document.createElement("style");
    style.textContent = cursorCss;
    document.head.append(style);
    const hiddenCursorRule = styleRules(style.sheet!.cssRules).find(
      (rule) => rule.style.display === "none",
    );
    const cursorLayer = document.createElement("div");
    cursorLayer.className = "smooth-cursor";

    expect(hiddenCursorRule).toBeDefined();
    expect(cursorLayer.matches(hiddenCursorRule!.selectorText)).toBe(true);

    style.remove();
  });
});

describe("responsive station foundation", () => {
  it("uses fluid spacing, bounded width, and a 44px control target", () => {
    expect(globalsCss).toContain("--station-gutter: clamp(");
    expect(globalsCss).toContain("--control-target: 44px");
    expect(globalsCss).toMatch(/\.station-shell\s*\{[^}]*width:\s*min\(100%/s);
    expect(globalsCss).toMatch(/body\s*\{[^}]*overflow-x:\s*clip/s);
    expect(globalsCss).toMatch(/\.visualizer-rack\s*\{[^}]*gap:\s*var\(--panel-gap\)/s);
    expect(globalsCss).toMatch(/\.player-grid\s*\{[^}]*gap:\s*var\(--panel-gap\)/s);
    expect(globalsCss).toMatch(/\.mute-button\s*\{[^}]*min-height:\s*var\(--control-target\)/s);
  });
});
