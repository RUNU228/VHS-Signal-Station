import { signalColorForLevel } from "./signalTheme";

export function signalColor(level: number, alpha = 1): string {
  return signalColorForLevel(level, alpha);
}

export function smoothEnergy(
  previous: number,
  target: number,
  attack = 0.18,
  release = 0.06,
): number {
  const next = Math.min(Math.max(target, 0), 1);
  const amount = next > previous ? attack : release;
  return previous + (next - previous) * amount;
}

export function signalGlow(level: number) {
  const value = Math.min(Math.max(level, 0), 1);

  return {
    barAlpha: 0.5 + value * 0.4,
    peakAlpha: 0.7 + value * 0.25,
    strokeAlpha: 0.72 + value * 0.24,
    shadowAlpha: 0.2 + value * 0.5,
    shadowBlur: 1 + value * 4,
  };
}

export function smoothSignalColor(level: number, alpha = 1): string {
  return signalColorForLevel(level, alpha);
}

export function energySignalColor(level: number, alpha = 1): string {
  return signalColorForLevel(level, alpha);
}

export function drawScopeGrid(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  columns = 8,
  rows = 4,
): void {
  context.save();
  context.strokeStyle = "rgba(111, 145, 168, 0.12)";
  context.lineWidth = 1;
  context.beginPath();
  for (let column = 1; column < columns; column += 1) {
    const x = (column / columns) * width;
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let row = 1; row < rows; row += 1) {
    const y = (row / rows) * height;
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();
  context.restore();
}
