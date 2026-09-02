import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { posix } from 'node:path';
import { performance } from 'node:perf_hooks';
import ts from 'typescript';

// Compare the actual helper code with the pre-optimization commit. No browser
// drawing is simulated here: these timings cover JavaScript calculation only.
const baseline = process.argv[2] ?? '6319d92';
const urls = new Map();
function moduleUrl(path, revision) {
  const key = `${revision}:${path}`;
  if (urls.has(key)) return urls.get(key);
  const source = revision === 'current' ? readFileSync(path, 'utf8')
    : execFileSync('git', ['show', `${revision}:${path}`], { encoding: 'utf8' });
  let code = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  } }).outputText;
  code = code.replace(/from ["']([^"']+)["']/g, (_, specifier) => {
    const dependency = specifier.startsWith('@/') ? `src/${specifier.slice(2)}`
      : posix.join(posix.dirname(path), specifier);
    return `from ${JSON.stringify(moduleUrl(`${dependency}.ts`, revision))}`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  urls.set(key, url);
  return url;
}
const load = (path, revision = 'current') => import(moduleUrl(path, revision));
const [oldColor, oldWave, oldMidSide, oldGradient, stereo, newWave, newGradient, spectrogram] = await Promise.all([
  load('src/lib/visualization/signalTheme.ts', baseline),
  load('src/lib/visualization/waveform.ts', baseline),
  load('src/lib/audio/midSide.ts', baseline),
  load('src/lib/visualization/waveformColor.ts', baseline),
  load('src/lib/visualization/stereometer.ts'),
  load('src/lib/visualization/waveform.ts'),
  load('src/lib/visualization/waveformColor.ts'),
  load('src/lib/visualization/spectrogram.ts'),
]);
let checksum = 0;
const colorFor = spectrogram.createSpectrogramColors();
const coldStart = performance.now();
for (let column = 0; column < 72; column++) {
  for (let byte = 15; byte < 256; byte++) checksum += colorFor(byte, column).length;
}
const paletteWarmupMs = performance.now() - coldStart;
const amplitudes = Uint8Array.from({ length: 72 * 34 }, (_, i) => 15 + (i * 71) % 241);
const left = Float32Array.from({ length: 4096 }, (_, i) => Math.sin(i * 0.13) * 0.731);
const right = Float32Array.from({ length: 4096 }, (_, i) => Math.cos(i * 0.27) * 0.419);
const mid = new Float32Array(4096);
const side = new Float32Array(4096);
const flat = new Float32Array(360).fill(0.5);
const changing = Float32Array.from({ length: 360 }, (_, i) => 0.5 + 0.25 * Math.sin(i * 0.09));
const gradient = { addColorStop(offset, color) { checksum += color.length + offset; } };
function median(values) { return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]; }
function compare(name, before, after, iterations = 400) {
  for (let i = 0; i < 50; i++) { before(i); after(i); }
  const samples = { before: [], after: [] };
  for (let round = 0; round < 9; round++) {
    for (const key of round % 2 ? ['after', 'before'] : ['before', 'after']) {
      const fn = key === 'before' ? before : after;
      const start = performance.now();
      for (let i = 0; i < iterations; i++) fn(i);
      samples[key].push((performance.now() - start) / iterations);
    }
  }
  const beforeMs = median(samples.before);
  const afterMs = median(samples.after);
  return { name, beforeMs, afterMs, speedup: beforeMs / afterMs };
}
const results = [
  compare('2448 exact spectrogram colors, warm cache', () => {
    for (let column = 0; column < 72; column++) {
      for (let row = 0; row < 34; row++) {
        const energy = amplitudes[column * 34 + row] / 255;
        checksum += oldColor.signalColorForLevel(energy, Math.max(0.08, energy * (0.42 + column / 72 * 0.58))).length;
      }
    }
  }, () => {
    for (let column = 0; column < 72; column++) {
      for (let row = 0; row < 34; row++) checksum += colorFor(amplitudes[column * 34 + row], column).length;
    }
  }, 100),
  compare('4096 stereo waveform samples', () => {
    oldMidSide.toMidSide(left, right, mid, side);
    checksum += oldWave.measureWaveformColumn(mid).rms + oldWave.measureWaveformColumn(side).rms;
  }, () => {
    const columns = newWave.measureStereoWaveform(left, right);
    checksum += columns.mid.rms + columns.side.rms;
  }),
  compare('2400 particle motion factors', i => {
    const delta = 0.01 + i % 7 / 1000;
    for (let particle = 0; particle < 2400; particle++) checksum += stereo.stereoMotionFactor(delta, particle % 3);
  }, i => {
    const delta = 0.01 + i % 7 / 1000;
    const low = stereo.stereoMotionFactor(delta, 0);
    const mid = stereo.stereoMotionFactor(delta, 1);
    const high = stereo.stereoMotionFactor(delta, 2);
    for (let particle = 0; particle < 2400; particle++) checksum += particle % 3 === 0 ? low : particle % 3 === 1 ? mid : high;
  }),
  compare('360 constant waveform gradient columns', () => oldGradient.addWaveformColorStops(gradient, flat),
    () => newGradient.addWaveformColorStops(gradient, flat)),
  compare('360 varying waveform gradient columns', () => oldGradient.addWaveformColorStops(gradient, changing),
    () => newGradient.addWaveformColorStops(gradient, changing)),
];
console.log(JSON.stringify({ baseline, node: process.version, rounds: 9, paletteWarmupMs, results, checksum }, null, 2));
