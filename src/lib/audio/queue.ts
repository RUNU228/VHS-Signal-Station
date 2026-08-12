const RESTART_THRESHOLD_SECONDS = 3;

export function getPreviousIndex(index: number, currentTime: number): number {
  if (currentTime > RESTART_THRESHOLD_SECONDS) {
    return index;
  }

  return Math.max(0, index - 1);
}

export function getNextIndex(index: number, count: number): number | null {
  const nextIndex = index + 1;
  return nextIndex < count ? nextIndex : null;
}
