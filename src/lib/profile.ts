// Process-aware synthetic surface trace generation.
//
// A real profilometer trace from a machined surface is roughly:
//   (periodic feed/tool marks) + (random micro-roughness) + (occasional spikes)
// We synthesize each of those, combine them, remove the mean line, then rescale
// the whole profile so its measured Ra exactly matches the requested target.
// Because rescaling fixes Ra last, the *shape* parameters come from genParams
// while the *amplitude* comes from the target — which is exactly how the
// interactive generator should behave.

import { mulberry32, gaussianSource } from "./noise";
import type { Profile } from "./roughness";

/** Shape controls for a process's characteristic trace (amplitudes relative). */
export interface GenParams {
  /** Relative weight of the periodic feed-mark component. */
  periodicWeight: number;
  /** Number of feed-mark cycles across the evaluation length. */
  periodicCycles: number;
  /** Relative weight of the random micro-roughness. */
  noiseWeight: number;
  /** Smoothing window (samples) applied to the noise; larger = longer wavelength. */
  noiseSmoothing: number;
  /** Probability per sample of a spike (craters/peaks); 0 disables. */
  spikeDensity?: number;
  /** Spike direction: -1 valleys (e.g. EDM craters), +1 peaks, 0 both. */
  spikePolarity?: number;
}

export interface GenerateOptions {
  /** Number of samples in the profile. */
  samples?: number;
  /** Evaluation length, in µm. */
  evaluationLengthUm?: number;
}

const DEFAULT_SAMPLES = 800;
const DEFAULT_EVAL_LENGTH_UM = 4000; // 4 mm

/** Centred moving-average low-pass to band-limit white noise. */
function smooth(values: number[], window: number): number[] {
  if (window <= 1) return values.slice();
  const half = Math.floor(window / 2);
  const out = new Array<number>(values.length);
  for (let i = 0; i < values.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = i - half; j <= i + half; j++) {
      if (j >= 0 && j < values.length) {
        sum += values[j];
        count++;
      }
    }
    out[i] = sum / count;
  }
  return out;
}

function arithmeticMeanDeviation(z: number[]): number {
  const mean = z.reduce((a, b) => a + b, 0) / z.length;
  let absSum = 0;
  for (const v of z) absSum += Math.abs(v - mean);
  return absSum / z.length;
}

/**
 * Generate a synthetic profile whose Ra equals `targetRaMicrons`.
 * `seed` makes the result reproducible; change it to "regenerate".
 */
export function generateProfile(
  targetRaMicrons: number,
  params: GenParams,
  seed: number,
  options: GenerateOptions = {},
): Profile {
  const n = options.samples ?? DEFAULT_SAMPLES;
  const evalLength = options.evaluationLengthUm ?? DEFAULT_EVAL_LENGTH_UM;
  const dx = evalLength / n;

  const rng = mulberry32(seed);
  const gauss = gaussianSource(rng);

  // 1. Periodic feed-mark component (fundamental + mild harmonic for realism).
  const phase = rng() * Math.PI * 2;
  const harmonic = 0.25;
  const periodic = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2 * params.periodicCycles;
    periodic[i] =
      params.periodicWeight *
      (Math.sin(t + phase) + harmonic * Math.sin(2 * t + phase));
  }

  // 2. Band-limited random micro-roughness.
  const rawNoise = new Array<number>(n);
  for (let i = 0; i < n; i++) rawNoise[i] = gauss();
  const noise = smooth(rawNoise, params.noiseSmoothing);

  // 3. Combine periodic + noise.
  const z = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    z[i] = periodic[i] + params.noiseWeight * noise[i];
  }

  // 4. Optional spikes (EDM craters / cast pits-and-peaks).
  const density = params.spikeDensity ?? 0;
  if (density > 0) {
    const polarity = params.spikePolarity ?? 0;
    for (let i = 0; i < n; i++) {
      if (rng() < density) {
        const magnitude = (1 + rng() * 2) * params.noiseWeight * 3;
        const dir = polarity === 0 ? (rng() < 0.5 ? 1 : -1) : polarity;
        z[i] += dir * magnitude;
      }
    }
  }

  // 5. Remove the mean line.
  const mean = z.reduce((a, b) => a + b, 0) / n;
  for (let i = 0; i < n; i++) z[i] -= mean;

  // 6. Rescale so the measured Ra equals the target.
  const rawRa = arithmeticMeanDeviation(z);
  const scale = rawRa > 0 ? targetRaMicrons / rawRa : 0;
  for (let i = 0; i < n; i++) z[i] *= scale;

  return { z, dx };
}
