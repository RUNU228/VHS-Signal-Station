export type KeyboardCommand =
  | "toggle"
  | "seek-backward"
  | "seek-forward"
  | "volume-up"
  | "volume-down"
  | "mute"
  | "next"
  | "previous";

export function commandForKey(key: string): KeyboardCommand | null {
  switch (key.toLowerCase()) {
    case " ": return "toggle";
    case "arrowleft": return "seek-backward";
    case "arrowright": return "seek-forward";
    case "arrowup": return "volume-up";
    case "arrowdown": return "volume-down";
    case "m": return "mute";
    case "n": return "next";
    case "p": return "previous";
    default: return null;
  }
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    tag === "button" ||
    target.isContentEditable === true ||
    target.contentEditable === "true" ||
    target.getAttribute("contenteditable") === "true"
  );
}
