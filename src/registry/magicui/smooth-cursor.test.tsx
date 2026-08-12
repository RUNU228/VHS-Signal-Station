import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SmoothCursor } from "./smooth-cursor";

let media = { finePointer: false, reducedMotion: false };
const mediaQueries: ControllableMediaQueryList[] = [];

type ControllableMediaQueryList = MediaQueryList & {
  setMatches: (matches: boolean) => void;
};

function mediaQueryList(query: string, initialMatches: boolean): ControllableMediaQueryList {
  let matches = initialMatches;
  const listeners = new Set<EventListenerOrEventListenerObject>();
  const queryList: ControllableMediaQueryList = {
    get matches() {
      return matches;
    },
    media: query,
    onchange: null,
    addEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === "change" && listener) listeners.add(listener);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListenerOrEventListenerObject | null) => {
      if (type === "change" && listener) listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
    setMatches: (nextMatches) => {
      if (matches === nextMatches) return;
      matches = nextMatches;
      const event = new Event("change");
      listeners.forEach((listener) => {
        if (typeof listener === "function") listener(event);
        else listener.handleEvent(event);
      });
    },
  };
  mediaQueries.push(queryList);
  return queryList;
}

function setMedia(next: { finePointer: boolean; reducedMotion: boolean }) {
  media = next;
}

function changeMedia(next: { finePointer: boolean; reducedMotion: boolean }) {
  setMedia(next);
  mediaQueries.forEach((queryList) =>
    queryList.setMatches(
      queryList.media === "(hover: hover) and (pointer: fine)"
        ? media.finePointer
        : !media.reducedMotion,
    ),
  );
}

describe("SmoothCursor", () => {
  beforeEach(() => {
    mediaQueries.length = 0;
    window.matchMedia = vi.fn((query: string) =>
      mediaQueryList(
        query,
        query === "(hover: hover) and (pointer: fine)" ? media.finePointer : !media.reducedMotion,
      ),
    );
  });

  afterEach(() => {
    delete document.documentElement.dataset.smoothCursor;
  });

  it("enables only for a fine hover pointer without reduced motion", async () => {
    setMedia({ finePointer: true, reducedMotion: false });
    render(<SmoothCursor cursor={<span>VS</span>} />);
    await waitFor(() =>
      expect(document.documentElement.dataset.smoothCursor).toBe("active"),
    );
    expect(screen.getByText("VS")).toBeInTheDocument();
  });

  it("hydrates with the same initial empty markup before client capability detection", async () => {
    setMedia({ finePointer: true, reducedMotion: false });
    const browserWindow = window;
    vi.stubGlobal("window", undefined);
    const serverMarkup = renderToString(<SmoothCursor />);
    vi.stubGlobal("window", browserWindow);

    const container = document.createElement("div");
    container.innerHTML = serverMarkup;
    const recoverableErrors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot>;

    await act(async () => {
      root = hydrateRoot(container, <SmoothCursor />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    expect(serverMarkup).toBe("");
    expect(recoverableErrors).toHaveLength(0);
    root!.unmount();
  });

  it("keeps the custom and native cursor disabled for reduced motion", async () => {
    setMedia({ finePointer: true, reducedMotion: true });
    render(<SmoothCursor />);
    expect(document.documentElement.dataset.smoothCursor).toBeUndefined();
    expect(screen.queryByTestId("smooth-cursor")).not.toBeInTheDocument();
  });

  it("renders a restrained default cursor when no artwork is supplied", async () => {
    setMedia({ finePointer: true, reducedMotion: false });
    render(<SmoothCursor />);

    const cursor = await screen.findByTestId("smooth-cursor");
    expect(cursor.querySelector('[data-smooth-cursor-artwork="default"]')).toBeInTheDocument();
    expect(cursor).toHaveClass("smooth-cursor");
  });

  it("stays hidden until movement and hides when the pointer leaves", async () => {
    setMedia({ finePointer: true, reducedMotion: false });
    render(<SmoothCursor />);
    const cursor = await screen.findByTestId("smooth-cursor");
    expect(cursor).toHaveAttribute("data-visible", "false");
    fireEvent.pointerMove(window, { clientX: 100, clientY: 80 });
    expect(cursor).toHaveAttribute("data-visible", "true");
    fireEvent.pointerLeave(document);
    expect(cursor).toHaveAttribute("data-visible", "false");
  });

  it("hides and resets the cursor when pointer capability is restored", async () => {
    setMedia({ finePointer: true, reducedMotion: false });
    render(<SmoothCursor />);
    const cursor = await screen.findByTestId("smooth-cursor");
    fireEvent.pointerMove(window, { clientX: 100, clientY: 80 });
    expect(cursor).toHaveAttribute("data-visible", "true");

    await act(async () => changeMedia({ finePointer: false, reducedMotion: false }));
    expect(screen.queryByTestId("smooth-cursor")).not.toBeInTheDocument();
    expect(document.documentElement.dataset.smoothCursor).toBeUndefined();

    await act(async () => changeMedia({ finePointer: true, reducedMotion: false }));
    expect(await screen.findByTestId("smooth-cursor")).toHaveAttribute("data-visible", "false");
  });

  it("removes cursor activation and listeners on unmount", async () => {
    setMedia({ finePointer: true, reducedMotion: false });
    const windowAdd = vi.spyOn(window, "addEventListener");
    const windowRemove = vi.spyOn(window, "removeEventListener");
    const documentAdd = vi.spyOn(document, "addEventListener");
    const documentRemove = vi.spyOn(document, "removeEventListener");
    const view = render(<SmoothCursor />);
    await waitFor(() =>
      expect(windowAdd).toHaveBeenCalledWith("pointermove", expect.any(Function)),
    );

    const pointerMove = windowAdd.mock.calls.find(([type]) => type === "pointermove")?.[1];
    const pointerLeave = documentAdd.mock.calls.find(([type]) => type === "pointerleave")?.[1];
    const pointerEnter = documentAdd.mock.calls.find(([type]) => type === "pointerenter")?.[1];
    const mediaListeners = mediaQueries.map((queryList) =>
      vi.mocked(queryList.addEventListener).mock.calls.find(([type]) => type === "change")?.[1],
    );

    expect(pointerMove).toEqual(expect.any(Function));
    expect(pointerLeave).toEqual(expect.any(Function));
    expect(pointerEnter).toEqual(expect.any(Function));
    expect(mediaListeners).toEqual([expect.any(Function), expect.any(Function)]);

    view.unmount();

    expect(windowRemove).toHaveBeenCalledWith("pointermove", pointerMove);
    expect(documentRemove).toHaveBeenCalledWith("pointerleave", pointerLeave);
    expect(documentRemove).toHaveBeenCalledWith("pointerenter", pointerEnter);
    mediaQueries.forEach((queryList, index) => {
      expect(queryList.removeEventListener).toHaveBeenCalledWith("change", mediaListeners[index]);
    });
    expect(document.documentElement.dataset.smoothCursor).toBeUndefined();
  });
});
