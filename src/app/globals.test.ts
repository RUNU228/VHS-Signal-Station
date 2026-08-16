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

describe("audio-reactive interface contracts", () => {
  it("defines bounded root variables and restrained major-button reactions", () => {
    for (const variable of [
      "--audio-volume",
      "--audio-bass",
      "--audio-mid",
      "--audio-treble",
      "--audio-peak",
      "--audio-smoothed",
    ]) {
      expect(globalsCss).toContain(variable);
    }
    expect(globalsCss).toContain('.station-shell[data-audio-active="true"]');
    expect(globalsCss).toMatch(/scale\(calc\(1 \+ var\(--audio-peak\) \* \.006\)\)/);
    expect(globalsCss).toMatch(
      /\.track-row\[data-playing="true"\]\s*\{[^}]*var\(--audio-bass\)[^}]*var\(--audio-peak\)/,
    );
    expect(globalsCss).toMatch(
      /data-audio-active="true"[^\{]*:is\(\.hardware-button:not\(\.hardware-button--primary\), \.mute-button\)[^{]*\{[^}]*var\(--audio-mid\)[^}]*var\(--audio-peak\)/,
    );
    expect(globalsCss).toMatch(
      /\.player-section\[data-playing="true"\] \.seek-module \.range-housing::before\s*\{[^}]*var\(--audio-smoothed\)/,
    );
  });

  it("removes background motion and reactive transforms for reduced motion", () => {
    expect(globalsCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.audio-reactive-background\s*\{[^}]*opacity:/,
    );
    expect(globalsCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*data-audio-active[^}]*transform:\s*none\s*!important/,
    );
  });

  it("keeps peak effects transparent, non-interactive, and below controls", () => {
    expect(globalsCss).toMatch(
      /\.peak-effects-layer\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*-1[^}]*pointer-events:\s*none[^}]*background:/,
    );
    expect(globalsCss).toMatch(
      /\.station-shell\s*>\s*:is\(\.audio-reactive-background,\s*\.peak-effects-layer\)[^{]*\{[^}]*transform:/,
    );
    expect(globalsCss).toMatch(
      /\.visualizer-rack\s*\{[^}]*transform:\s*translate3d\(var\(--peak-shake-x\),\s*var\(--peak-shake-y\),\s*0\)\s*scale\(calc\(1\s*\+\s*var\(--peak-scale\)\)\)/,
    );
    expect(globalsCss).not.toMatch(
      /:(?:is|where)\([^)]*(?:player|uploader|library)[^)]*\)[^{]*\{[^}]*--peak-shake/,
    );
  });

  it("zeros peak displacement and lowers the shader layer for reduced motion", () => {
    expect(globalsCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.station-shell\s*\{[^}]*--peak-shake-x:\s*0px[^}]*--peak-shake-y:\s*0px[^}]*--peak-scale:\s*0[^}]*--peak-rgb-offset:\s*0px/,
    );
    expect(globalsCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.peak-effects-layer\s*\{[^}]*opacity:\s*\.35/,
    );
  });
});

describe("responsive station foundation", () => {
  it("uses fluid spacing, bounded width, and a 44px control target", () => {
    expect(globalsCss).toContain("--station-gutter: clamp(");
    expect(globalsCss).toContain("--control-target: 44px");
    expect(globalsCss).toMatch(/\.station-shell\s*\{[^}]*width:\s*min\(100%/);
    expect(globalsCss).toMatch(/body\s*\{[^}]*overflow-x:\s*clip/);
    expect(globalsCss).toMatch(/\.visualizer-rack\s*\{[^}]*gap:\s*var\(--panel-gap\)/);
    expect(globalsCss).toMatch(/\.player-grid\s*\{[^}]*gap:\s*var\(--panel-gap\)/);
    expect(globalsCss).toMatch(/\.mute-button\s*\{[^}]*min-height:\s*var\(--control-target\)/);
  });

  it("contains explicit small-phone, phone, tablet, desktop, and large-display policies", () => {
    for (const query of [
      "@media (max-width: 380px)",
      "@media (max-width: 760px)",
      "@media (min-width: 761px) and (max-width: 1100px)",
      "@media (orientation: landscape) and (max-height: 600px) and (max-width: 1100px)",
      "@media (min-width: 1101px)",
      "@media (min-width: 1920px)",
    ]) {
      expect(globalsCss).toContain(query);
    }
  });

  it("keeps shallow and full-width tablet CRTs wide while bounding their height", () => {
    const tabletCss = globalsCss.slice(
      globalsCss.indexOf("@media (min-width: 761px) and (max-width: 1100px)"),
      globalsCss.indexOf("@media (min-width: 1101px)"),
    );
    const shallowCss = globalsCss.slice(
      globalsCss.indexOf(
        "@media (orientation: landscape) and (max-height: 600px) and (max-width: 1100px)",
      ),
      globalsCss.indexOf("@media (min-width: 1920px)"),
    );
    expect(tabletCss).toMatch(
      /\.module--spectrum \.crt-screen\s*\{[^}]*aspect-ratio:\s*auto[^}]*height:\s*clamp\(/,
    );
    expect(shallowCss).toMatch(
      /\.crt-screen\s*\{[^}]*aspect-ratio:\s*auto[^}]*height:\s*clamp\(/,
    );
  });

  it("keeps phone CRTs inside their panels while preserving readable height", () => {
    const phoneCss = globalsCss.slice(
      globalsCss.indexOf("@media (max-width: 760px)"),
      globalsCss.indexOf("@media (max-width: 480px)"),
    );
    expect(phoneCss).toMatch(
      /\.crt-screen\s*\{[^}]*aspect-ratio:\s*auto[^}]*height:\s*clamp\([^}]*min-height:\s*0/,
    );
  });

  it("keeps tablet CRTs inside their columns while preserving readable height", () => {
    const tabletCss = globalsCss.slice(
      globalsCss.indexOf("@media (min-width: 761px) and (max-width: 1100px)"),
      globalsCss.indexOf("@media (min-width: 1101px)"),
    );
    expect(tabletCss).toMatch(
      /\.crt-screen\s*\{[^}]*aspect-ratio:\s*auto[^}]*height:\s*clamp\([^}]*min-height:\s*0/,
    );
  });

  it("keeps the three lower desktop CRTs inside their panels", () => {
    const desktopRackCss = globalsCss.slice(
      globalsCss.indexOf("@media (min-width: 1101px)"),
      globalsCss.indexOf(
        "@media (min-width: 761px) and (max-width: 1100px)",
        globalsCss.indexOf("@media (min-width: 1101px)") + 1,
      ),
    );
    expect(desktopRackCss).toMatch(
      /\.module--stereometer \.crt-screen,\s*\.module--oscilloscope \.crt-screen,\s*\.module--spectrum \.crt-screen\s*\{[^}]*aspect-ratio:\s*auto/,
    );
  });

  it("bounds large-display CRT height without narrowing the screen", () => {
    expect(globalsCss).toMatch(
      /@media \(min-width: 1920px\)[\s\S]*\.crt-screen\s*\{[^}]*aspect-ratio:\s*auto[^}]*height:\s*clamp\([^}]*max-height:\s*440px/,
    );
    expect(globalsCss).toMatch(
      /@media \(min-width: 1920px\)[\s\S]*\.module--spectrogram \.crt-screen,\s*\.module--waveform \.crt-screen\s*\{[^}]*aspect-ratio:\s*auto/,
    );
  });
});

describe("responsive player and track library", () => {
  it("keeps player controls tappable and track rows shrink-safe", () => {
    expect(globalsCss).toMatch(/\.mute-button\s*\{[^}]*min-height:\s*var\(--control-target\)/);
    expect(globalsCss).toMatch(/\.range-housing\s*\{[^}]*min-height:\s*var\(--control-target\)/);
    expect(globalsCss).toMatch(
      /\.range-housing::before\s*\{[^}]*top:\s*50%[^}]*translate:\s*0 -50%/,
    );
    expect(globalsCss).toMatch(
      /\.range-housing input\s*\{[^}]*inset:\s*-1px[^}]*calc\(100% \+ 2px\)/,
    );
    expect(globalsCss).toMatch(/\.track-row\s*\{[^}]*min-height:\s*var\(--control-target\)/);
    expect(globalsCss).toMatch(
      /@media \(min-width: 761px\) and \(max-width: 1100px\)[\s\S]*\.player-grid\s*\{[^}]*repeat\(8, minmax\(0, 1fr\)\)/,
    );
  });
});

describe("interactive control feedback", () => {
  it("defines analog focus, pressed, and disabled button states", () => {
    for (const selector of [":focus-visible", ":active:not(:disabled)", ":disabled"]) {
      expect(globalsCss).toContain(selector);
    }
  });

  it("shares analog feedback across each interactive control family", () => {
    const controlFamilies = ":is(.hardware-button, .mute-button, .tape-loader button, .track-row, .system-message button)";
    expect(globalsCss).toContain(`${controlFamilies} {`);
    expect(globalsCss).toContain(`${controlFamilies}:focus-visible`);
  });
});

describe("track feedback", () => {
  it("defines distinct selected and playing track states", () => {
    for (const selector of ['[data-selected="true"]', '[data-playing="true"]']) {
      expect(globalsCss).toContain(selector);
    }
  });

  it("reserves the track scan animation for playback", () => {
    expect(globalsCss).not.toContain('.track-row[data-selected="true"]::after { animation: selected-scan');
    expect(globalsCss).toContain('.track-row[data-playing="true"]::after { animation: selected-scan');
  });
});

describe("responsive visualizer rack", () => {
  it("defines phone, tablet, and desktop visualizer arrangements", () => {
    expect(globalsCss).toMatch(/@media \(max-width: 760px\)[\s\S]*\.visualizer-rack\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/);
    expect(globalsCss).toMatch(/@media \(min-width: 761px\) and \(max-width: 1100px\)[\s\S]*\.visualizer-rack\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
    expect(globalsCss).toMatch(/@media \(min-width: 1101px\)[\s\S]*\.visualizer-rack\s*\{[^}]*repeat\(6, minmax\(0, 1fr\)\)/);
    expect(globalsCss).toMatch(/\.crt-screen\s*\{[^}]*aspect-ratio:/);
  });
});
