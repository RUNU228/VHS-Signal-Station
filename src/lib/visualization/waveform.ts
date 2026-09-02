export type WaveformColumn = {
  negative: number;
  positive: number;
  rms: number;
  localEnergy: number;
};

export type WaveformHistory = {
  negative: Float32Array;
  positive: Float32Array;
  rms: Float32Array;
  localEnergy: Float32Array;
};

export function createWaveformHistory(length: number): WaveformHistory {
  return {
    negative: new Float32Array(length),
    positive: new Float32Array(length),
    rms: new Float32Array(length),
    localEnergy: new Float32Array(length),
  };
}

export function clearWaveformHistory(history: WaveformHistory): void {
  history.negative.fill(0);
  history.positive.fill(0);
  history.rms.fill(0);
  history.localEnergy.fill(0);
}

export function measureWaveformColumn(samples: Float32Array): WaveformColumn {
  if (samples.length === 0) {
    return { negative: 0, positive: 0, rms: 0, localEnergy: 0 };
  }

  let negative = 0;
  let positive = 0;
  let sumOfSquares = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    negative = Math.min(negative, sample);
    positive = Math.max(positive, sample);
    sumOfSquares += sample * sample;
  }

  return {
    negative,
    positive,
    rms: Math.sqrt(sumOfSquares / samples.length),
    localEnergy: Math.max(Math.abs(negative), positive),
  };
}

export function pushWaveformColumn(
  history: WaveformHistory,
  column: WaveformColumn,
): void {
  history.positive.copyWithin(0, 1);
  history.negative.copyWithin(0, 1);
  history.rms.copyWithin(0, 1);
  history.localEnergy.copyWithin(0, 1);
  const last = history.positive.length - 1;
  history.positive[last] = column.positive;
  history.negative[last] = column.negative;
  history.rms[last] = column.rms;
  history.localEnergy[last] = column.localEnergy;
}

export function measureStereoWaveform(
  left: Float32Array,
  right: Float32Array,
): { mid: WaveformColumn; side: WaveformColumn } {
  const length = Math.min(left.length, right.length);
  let midNegative = 0;
  let midPositive = 0;
  let midSquares = 0;
  let sideNegative = 0;
  let sidePositive = 0;
  let sideSquares = 0;
  for (let index = 0; index < length; index++) {
    const l = left[index];
    const r = right[index];
    // Match the former Float32 mid/side buffers before measuring the samples.
    const mid = Math.fround((l + r) / 2);
    const side = Math.fround((l - r) / 2);
    midNegative = Math.min(midNegative, mid);
    midPositive = Math.max(midPositive, mid);
    midSquares += mid * mid;
    sideNegative = Math.min(sideNegative, side);
    sidePositive = Math.max(sidePositive, side);
    sideSquares += side * side;
  }
  return {
    mid: { negative: midNegative, positive: midPositive,
      rms: length ? Math.sqrt(midSquares / length) : 0,
      localEnergy: Math.max(Math.abs(midNegative), midPositive) },
    side: { negative: sideNegative, positive: sidePositive,
      rms: length ? Math.sqrt(sideSquares / length) : 0,
      localEnergy: Math.max(Math.abs(sideNegative), sidePositive) },
  };
}
