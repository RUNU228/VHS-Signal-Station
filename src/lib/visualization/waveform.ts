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
