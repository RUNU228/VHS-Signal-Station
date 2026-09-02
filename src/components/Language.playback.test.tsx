import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { VhsVisualizerApp } from "./VhsVisualizerApp";
class Media extends EventTarget {
 currentTime=0; duration=120; volume=1; muted=false; preload=""; src="";
 pause() { this.dispatchEvent(new Event("pause")); }
 load() {} async play() { this.dispatchEvent(new Event("play")); } removeAttribute() {}
}
class Metadata extends Media {
 constructor() { super(); queueMicrotask(() => this.dispatchEvent(new Event("loadedmetadata"))); }
}
beforeEach(() => {
 localStorage.clear();
 vi.spyOn(HTMLCanvasElement.prototype,"getContext").mockReturnValue(null);
 vi.stubGlobal("Audio", Metadata);
 vi.stubGlobal("URL", class extends URL { static createObjectURL() { return "blob:my-track"; } static revokeObjectURL() {} });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("preserves the playing media instance, source, time, and canvases while updating a loaded notice", async () => {
 const media=new Media(); let creations=0;
 const { container }=render(<VhsVisualizerApp engineOptions={{createAudioElement: () => {creations++; return media as unknown as HTMLAudioElement;},createAudioContext:()=>null}}/>);
 const file=new File([],"My track.wav",{type:"audio/wav"});
 await act(async () => fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}}));
 expect(screen.getByRole("status")).toHaveTextContent("01 TAPE LOADED");
 await act(async () => fireEvent.click(screen.getByRole("button",{name:"Play"})));
 act(() => {media.currentTime=35;media.dispatchEvent(new Event("timeupdate"));});
 const canvases=[...container.querySelectorAll("canvas")];
 fireEvent.click(screen.getByRole("button",{name:"Русский"}));
 expect(screen.getByRole("status")).toHaveTextContent("ЗАГРУЖЕНО: 01 КАССЕТА");
 expect(screen.getByRole("button",{name:"Пауза"})).toBeEnabled();
 expect(media.currentTime).toBe(35); expect(media.src).toBe("blob:my-track"); expect(creations).toBe(1);
 [...container.querySelectorAll("canvas")].forEach((canvas,index)=>expect(canvas).toBe(canvases[index]));
 const ru=screen.getByRole("button",{name:"Русский"});
 fireEvent.keyDown(ru,{key:" "}); fireEvent.keyDown(ru,{key:"Enter"});
 expect(screen.getByRole("button",{name:"Пауза"})).toBeEnabled();
 act(() => media.dispatchEvent(new Event("error")));
 expect(screen.getByRole("alert")).toHaveTextContent("НЕ УДАЛОСЬ ПРОЧИТАТЬ АУДИОСИГНАЛ");
 fireEvent.click(screen.getByRole("button",{name:"English"}));
 expect(screen.getByRole("alert")).toHaveTextContent("UNABLE TO READ AUDIO SIGNAL");
});
it("translates rejection notices while retaining the original filename", async () => {
 const media=new Media();
 const {container}=render(<VhsVisualizerApp engineOptions={{createAudioElement:()=>media as unknown as HTMLAudioElement,createAudioContext:()=>null}}/>);
 await act(async () => fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[new File([],"Original.txt")]}}));
 fireEvent.click(screen.getByRole("button",{name:"Русский"}));
 expect(screen.getByRole("status")).toHaveTextContent("НЕ УДАЛОСЬ ПРОЧИТАТЬ: Original.txt");
});
