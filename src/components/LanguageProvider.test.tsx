import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageProvider";
import { LanguageSwitcher } from "./ui/LanguageSwitcher";
import { tapesLoaded } from "@/lib/i18n";
function Fixture() { const { t } = useLanguage(); return <><LanguageSwitcher /><p>{t.tracks.title}</p></>; }
describe("language storage and hydration", () => {
 beforeEach(() => localStorage.clear());
 afterEach(() => vi.restoreAllMocks());
 it.each(["de", "null", "{broken", "RU"])("falls back to English for %s", (saved) => {
  localStorage.setItem("vhs-language", saved);
  render(<LanguageProvider><Fixture /></LanguageProvider>);
  expect(screen.getByRole("button", {name:"English"})).toHaveAttribute("aria-pressed","true");
 });
 it("hydrates English server markup with a persisted Russian preference without mismatch", async () => {
  localStorage.setItem("vhs-language", "ru");
  const view = <LanguageProvider><Fixture /></LanguageProvider>;
  const html = renderToString(view);
  expect(html).toContain("TRACK LIBRARY");
  const container = document.createElement("div"); container.innerHTML = html; document.body.append(container);
  const errors: unknown[] = []; let root: ReturnType<typeof hydrateRoot>;
  await act(async () => { root = hydrateRoot(container, view, {onRecoverableError: error => errors.push(error)}); });
  expect(container).toHaveTextContent("БИБЛИОТЕКА ТРЕКОВ"); expect(errors).toEqual([]);
  await act(async () => root.unmount()); container.remove();
 });
 it.each([[1,"КАССЕТА"],[2,"КАССЕТЫ"],[5,"КАССЕТ"],[11,"КАССЕТ"],[21,"КАССЕТА"],[22,"КАССЕТЫ"],[112,"КАССЕТ"]])("uses Russian count inflections for %s", (count, noun) => {
   expect(tapesLoaded(Number(count), "ru")).toBe(`ЗАГРУЖЕНО: ${String(count).padStart(2,"0")} ${noun}`);
 });
 it("keeps native buttons available for keyboard activation", () => {
  render(<LanguageProvider><Fixture /></LanguageProvider>);
  const button=screen.getByRole("button", {name:"Русский"}); button.focus();
  expect(button).toHaveFocus(); fireEvent.click(button);
  expect(button).toHaveAttribute("aria-pressed","true");
 });
});
