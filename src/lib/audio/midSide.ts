export function toMidSide(
  left: Float32Array,
  right: Float32Array,
  mid: Float32Array,
  side: Float32Array,
): void {
  const length = Math.min(left.length, right.length, mid.length, side.length);

  for (let index = 0; index < length; index += 1) {
    const leftSample = left[index];
    const rightSample = right[index];
    mid[index] = (leftSample + rightSample) / 2;
    side[index] = (leftSample - rightSample) / 2;
  }
}
