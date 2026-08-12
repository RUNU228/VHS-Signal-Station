export function signalColor(level: number, alpha = 1): string {
  const value = Math.min(Math.max(level, 0), 1);
  if (value > 0.78) return `rgba(168, 77, 67, ${alpha})`;
  if (value > 0.48) return `rgba(196, 154, 82, ${alpha})`;
  return `rgba(111, 145, 168, ${alpha})`;
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

type Rgb = readonly [number, number, number];

const SIGNAL_PALETTE = {
  low: [111, 145, 168],
  middle: [196, 154, 82],
  high: [168, 77, 67],
} as const satisfies Record<string, Rgb>;

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function interpolateRgb(
  start: Rgb,
  end: Rgb,
  amount: number,
): string {
  const formatChannel = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(2);
  const red = formatChannel(start[0] + (end[0] - start[0]) * amount);
  const green = formatChannel(start[1] + (end[1] - start[1]) * amount);
  const blue = formatChannel(start[2] + (end[2] - start[2]) * amount);

  return `${red}, ${green}, ${blue}`;
}

export function smoothSignalColor(level: number, alpha = 1): string {
  const value = Math.min(Math.max(level, 0), 1);
  const opacity = Math.min(Math.max(alpha, 0), 1);
  let start: Rgb;
  let end: Rgb;

  if (value <= 0.5) {
    start = SIGNAL_PALETTE.low;
    end = SIGNAL_PALETTE.middle;
  } else {
    start = SIGNAL_PALETTE.middle;
    end = SIGNAL_PALETTE.high;
  }

  const localValue = value <= 0.5 ? value * 2 : (value - 0.5) * 2;

  return `rgba(${interpolateRgb(start, end, smoothstep(localValue))}, ${opacity})`;
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
