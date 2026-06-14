// Surface roughness parameter calculations (2D profile / R-parameters).
//
// Definitions follow ISO 4287 / ISO 21920-2 (and ASME B46.1, which agrees on
// the core amplitude parameters). All amplitude/height values are returned in
// micrometres (µm); the lateral spacing parameter RSm is returned in
// micrometres of lateral distance; RΔq is returned in degrees; Rsk and Rku are
// dimensionless.
//
// The engine is intentionally pure and decoupled from how a profile is created,
// so the same code can later compute parameters from imported measurement data
// (the planned "analyzer" feature), not just synthesized traces.

/** A sampled surface profile. */
export interface Profile {
  /** Heights in µm, sampled at uniform spacing. Need not be mean-centred. */
  z: number[];
  /** Lateral spacing between samples, in µm. */
  dx: number;
}

export interface MaterialRatioPoint {
  /** Depth below the highest peak, in µm. */
  c: number;
  /** Material ratio at that depth, in percent (0–100). */
  mr: number;
}

export interface RoughnessParameters {
  /** Arithmetic mean deviation. */
  Ra: number;
  /** Root-mean-square (RMS) deviation. */
  Rq: number;
  /** Maximum peak height above the mean line. */
  Rp: number;
  /** Maximum valley depth below the mean line (positive). */
  Rv: number;
  /** Mean roughness depth (mean peak-to-valley over sampling lengths). */
  Rz: number;
  /** Total height of the profile (max peak + max valley). */
  Rt: number;
  /** Skewness — asymmetry of the height distribution (dimensionless). */
  Rsk: number;
  /** Kurtosis — sharpness/spikiness of the height distribution (dimensionless). */
  Rku: number;
  /** Mean height of profile elements. */
  Rc: number;
  /** Mean width of profile elements (lateral), in µm. */
  RSm: number;
  /** Root-mean-square profile slope, in degrees. */
  RDq: number;
}

function mean(values: number[]): number {
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/** Returns a copy of the profile with its mean (centre) line subtracted. */
export function centerProfile(z: number[]): number[] {
  const m = mean(z);
  return z.map((v) => v - m);
}

/**
 * Mean roughness depth Rz (ISO): split the evaluation length into `segments`
 * equal sampling lengths, take the peak-to-valley height in each, and average.
 */
function computeRz(z: number[], segments = 5): number {
  const n = z.length;
  if (n === 0) return 0;
  const len = Math.floor(n / segments);
  if (len < 2) {
    return Math.max(...z) - Math.min(...z);
  }
  let total = 0;
  for (let s = 0; s < segments; s++) {
    const start = s * len;
    const end = s === segments - 1 ? n : start + len;
    let hi = -Infinity;
    let lo = Infinity;
    for (let i = start; i < end; i++) {
      if (z[i] > hi) hi = z[i];
      if (z[i] < lo) lo = z[i];
    }
    total += hi - lo;
  }
  return total / segments;
}

/**
 * Profile elements are the segments between consecutive upward crossings of the
 * mean line. A small height discrimination (a fraction of Rq) suppresses
 * spurious crossings from fine noise, per the spirit of ISO discrimination.
 * Returns mean element width (µm) for RSm and mean element height (µm) for Rc.
 */
function computeElementStats(
  z: number[],
  dx: number,
  rq: number,
): { RSm: number; Rc: number } {
  const n = z.length;
  const threshold = rq * 0.1; // height discrimination
  const upwardCrossings: number[] = [];
  for (let i = 1; i < n; i++) {
    if (z[i - 1] <= 0 && z[i] > threshold) {
      upwardCrossings.push(i);
    }
  }
  if (upwardCrossings.length < 2) {
    return { RSm: n * dx, Rc: Math.max(...z) - Math.min(...z) };
  }
  let widthSum = 0;
  let heightSum = 0;
  let count = 0;
  for (let k = 1; k < upwardCrossings.length; k++) {
    const start = upwardCrossings[k - 1];
    const end = upwardCrossings[k];
    widthSum += (end - start) * dx;
    let hi = -Infinity;
    let lo = Infinity;
    for (let i = start; i < end; i++) {
      if (z[i] > hi) hi = z[i];
      if (z[i] < lo) lo = z[i];
    }
    heightSum += hi - lo;
    count++;
  }
  return { RSm: widthSum / count, Rc: heightSum / count };
}

/** RMS profile slope RΔq, returned in degrees. */
function computeRDq(z: number[], dx: number): number {
  if (z.length < 2 || dx === 0) return 0;
  let sumSq = 0;
  for (let i = 1; i < z.length; i++) {
    const slope = (z[i] - z[i - 1]) / dx; // µm / µm = dimensionless ratio
    sumSq += slope * slope;
  }
  const rmsSlope = Math.sqrt(sumSq / (z.length - 1));
  return (Math.atan(rmsSlope) * 180) / Math.PI;
}

/**
 * Abbott–Firestone material ratio (bearing ratio) curve. For each depth `c`
 * below the highest peak, the material ratio is the fraction of samples at or
 * above that height.
 */
export function materialRatioCurve(
  profile: Profile,
  steps = 100,
): MaterialRatioPoint[] {
  const z = centerProfile(profile.z);
  const n = z.length;
  const hi = Math.max(...z);
  const lo = Math.min(...z);
  const range = hi - lo;
  if (range === 0) return [{ c: 0, mr: 100 }];
  const sorted = [...z].sort((a, b) => b - a); // descending
  const points: MaterialRatioPoint[] = [];
  let idx = 0;
  for (let s = 0; s <= steps; s++) {
    const level = hi - (range * s) / steps; // walk down from the highest peak
    while (idx < n && sorted[idx] >= level) idx++;
    points.push({ c: hi - level, mr: (idx / n) * 100 });
  }
  return points;
}

/** Compute the full standard 2D roughness parameter suite for a profile. */
export function computeParameters(profile: Profile): RoughnessParameters {
  const z = centerProfile(profile.z);
  const n = z.length;
  if (n === 0) {
    return {
      Ra: 0, Rq: 0, Rp: 0, Rv: 0, Rz: 0, Rt: 0,
      Rsk: 0, Rku: 0, Rc: 0, RSm: 0, RDq: 0,
    };
  }

  let absSum = 0;
  let sq = 0;
  let cube = 0;
  let quad = 0;
  let hi = -Infinity;
  let lo = Infinity;
  for (const v of z) {
    absSum += Math.abs(v);
    const v2 = v * v;
    sq += v2;
    cube += v2 * v;
    quad += v2 * v2;
    if (v > hi) hi = v;
    if (v < lo) lo = v;
  }

  const Ra = absSum / n;
  const Rq = Math.sqrt(sq / n);
  const Rp = hi;
  const Rv = -lo;
  const Rt = Rp + Rv;
  const Rz = computeRz(z);
  const Rsk = Rq > 0 ? cube / n / (Rq * Rq * Rq) : 0;
  const Rku = Rq > 0 ? quad / n / (Rq * Rq * Rq * Rq) : 0;
  const { RSm, Rc } = computeElementStats(z, profile.dx, Rq);
  const RDq = computeRDq(z, profile.dx);

  return { Ra, Rq, Rp, Rv, Rz, Rt, Rsk, Rku, Rc, RSm, RDq };
}
