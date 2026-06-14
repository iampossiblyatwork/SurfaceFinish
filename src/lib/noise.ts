// Seeded pseudo-random number generation.
//
// We use a deterministic PRNG so that a given seed always reproduces the same
// surface trace. "Regenerate" in the UI simply advances to a new seed, which
// keeps traces reproducible (e.g. for sharing or testing) while still feeling
// fresh to the user.

/**
 * mulberry32 — a small, fast, decent-quality 32-bit PRNG.
 * Returns a function producing floats in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Wraps a uniform [0,1) generator to produce standard-normal samples
 * (mean 0, variance 1) via the Box–Muller transform.
 */
export function gaussianSource(rng: () => number): () => number {
  let spare: number | null = null;
  return function () {
    if (spare !== null) {
      const value = spare;
      spare = null;
      return value;
    }
    // Avoid log(0) by clamping u away from 0.
    let u = rng();
    const v = rng();
    if (u < 1e-12) u = 1e-12;
    const mag = Math.sqrt(-2.0 * Math.log(u));
    spare = mag * Math.sin(2.0 * Math.PI * v);
    return mag * Math.cos(2.0 * Math.PI * v);
  };
}
