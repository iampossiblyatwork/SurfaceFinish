// Client-side signal helpers for the interactive filtering demos. Kept light and
// deterministic so sliders feel instant — these are illustrative, the
// authoritative compute lives in the Python backend.

/** Deterministic PRNG so the demo profile is stable across renders. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Profile {
  z: number[]; // height in µm
  dx: number; // sample spacing in mm
  lengthMm: number;
}

/**
 * A primary profile = a couple of long (waviness) waves + several short
 * (roughness) waves + a little fine noise. Designed so a Gaussian cutoff
 * visibly separates the two regimes.
 */
export function makeProfile(n = 700, lengthMm = 5): Profile {
  const dx = lengthMm / (n - 1);
  const rng = mulberry32(20260614);
  const waviness = [
    { a: 1.3, lambda: 2.6, phase: 0.4 },
    { a: 0.7, lambda: 1.25, phase: 1.7 },
  ];
  const roughness = [
    { a: 0.45, lambda: 0.19, phase: 0.0 },
    { a: 0.3, lambda: 0.095, phase: 2.1 },
    { a: 0.18, lambda: 0.05, phase: 0.9 },
  ];
  const z: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const x = i * dx;
    let v = 0;
    for (const w of [...waviness, ...roughness]) {
      v += w.a * Math.sin((2 * Math.PI * x) / w.lambda + w.phase);
    }
    v += (rng() - 0.5) * 0.18;
    z[i] = v;
  }
  return { z, dx, lengthMm };
}

const ALPHA = Math.sqrt(Math.LN2 / Math.PI); // ≈ 0.4697 (ISO 16610-21)

/**
 * Gaussian low-pass (the waviness / mean line). Per-position renormalization
 * keeps the ends from drooping, which is fine for a teaching demo.
 */
export function gaussianLowpass(z: number[], dx: number, cutoffMm: number): number[] {
  const n = z.length;
  const sigma = ALPHA * cutoffMm;
  const half = Math.min(n - 1, Math.ceil((1.6 * cutoffMm) / dx));
  const weights: number[] = new Array(half + 1);
  for (let j = 0; j <= half; j++) {
    const x = j * dx;
    weights[j] = Math.exp(-Math.PI * (x / sigma) * (x / sigma));
  }
  const out: number[] = new Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    let wsum = 0;
    for (let j = -half; j <= half; j++) {
      const k = i + j;
      if (k < 0 || k >= n) continue;
      const w = weights[Math.abs(j)];
      sum += w * z[k];
      wsum += w;
    }
    out[i] = sum / wsum;
  }
  return out;
}

/** Roughness profile = primary minus the Gaussian mean line. */
export function highpass(z: number[], dx: number, cutoffMm: number): number[] {
  const low = gaussianLowpass(z, dx, cutoffMm);
  return z.map((v, i) => v - low[i]);
}

/** Ra = arithmetic mean of |z| (z assumed mean-removed). */
export function ra(z: number[]): number {
  let s = 0;
  for (const v of z) s += Math.abs(v);
  return s / z.length;
}

/**
 * RSm — mean width of profile elements (mm). Element boundaries are upward
 * mean-line crossings, with height discrimination (a real peak above ~10% of
 * the max must occur between boundaries) so fine noise doesn't spawn spurious
 * elements. Returns 0 if fewer than two elements are found.
 */
export function rsm(z: number[], dx: number): number {
  const n = z.length;
  let maxAbs = 0;
  for (const v of z) maxAbs = Math.max(maxAbs, Math.abs(v));
  if (maxAbs === 0) return 0;
  const thr = maxAbs * 0.1;
  const bounds: number[] = [];
  for (let i = 1; i < n; i++) {
    if (z[i - 1] <= 0 && z[i] > 0) {
      if (bounds.length === 0) {
        bounds.push(i);
        continue;
      }
      const last = bounds[bounds.length - 1];
      let pk = 0;
      for (let j = last; j <= i; j++) pk = Math.max(pk, z[j]);
      if (pk > thr) bounds.push(i);
    }
  }
  if (bounds.length < 2) return 0;
  const meanSamples =
    (bounds[bounds.length - 1] - bounds[0]) / (bounds.length - 1);
  return meanSamples * dx;
}

/**
 * Low-pass (waviness) transmission of a single wavelength through the Gaussian
 * filter. Crosses 0.5 exactly at λ = λc. High-pass = 1 − this.
 */
export function lowpassTransmission(lambdaMm: number, cutoffMm: number): number {
  const r = (ALPHA * cutoffMm) / lambdaMm;
  return Math.exp(-Math.PI * r * r);
}
