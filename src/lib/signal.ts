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
 * Low-pass (waviness) transmission of a single wavelength through the Gaussian
 * filter. Crosses 0.5 exactly at λ = λc. High-pass = 1 − this.
 */
export function lowpassTransmission(lambdaMm: number, cutoffMm: number): number {
  const r = (ALPHA * cutoffMm) / lambdaMm;
  return Math.exp(-Math.PI * r * r);
}
