// ISO 1302 roughness grade numbers and unit conversion helpers.
//
// Internally the whole app stores height/amplitude values in micrometres (µm).
// Conversion to microinches (µin) happens only at display time so there is a
// single source of truth.

export const MICROINCH_PER_MICRON = 39.3701;

export type Unit = "um" | "uin";

/** ISO 1302 roughness grade (N-number) table, keyed by Ra in µm. */
export interface RoughnessGrade {
  grade: string; // e.g. "N6"
  ra: number; // nominal Ra in µm
}

export const ISO_GRADES: RoughnessGrade[] = [
  { grade: "N1", ra: 0.025 },
  { grade: "N2", ra: 0.05 },
  { grade: "N3", ra: 0.1 },
  { grade: "N4", ra: 0.2 },
  { grade: "N5", ra: 0.4 },
  { grade: "N6", ra: 0.8 },
  { grade: "N7", ra: 1.6 },
  { grade: "N8", ra: 3.2 },
  { grade: "N9", ra: 6.3 },
  { grade: "N10", ra: 12.5 },
  { grade: "N11", ra: 25 },
  { grade: "N12", ra: 50 },
];

/** Nearest ISO N-grade for a given Ra value (µm), by ratio (log) distance. */
export function nearestGrade(raMicrons: number): RoughnessGrade {
  if (raMicrons <= 0) return ISO_GRADES[0];
  let best = ISO_GRADES[0];
  let bestDist = Infinity;
  for (const g of ISO_GRADES) {
    const dist = Math.abs(Math.log(raMicrons / g.ra));
    if (dist < bestDist) {
      bestDist = dist;
      best = g;
    }
  }
  return best;
}

/** Convert a micrometre value to the requested display unit. */
export function fromMicrons(valueMicrons: number, unit: Unit): number {
  return unit === "uin" ? valueMicrons * MICROINCH_PER_MICRON : valueMicrons;
}

/** Convert a value in the given display unit back to micrometres. */
export function toMicrons(value: number, unit: Unit): number {
  return unit === "uin" ? value / MICROINCH_PER_MICRON : value;
}

export function unitLabel(unit: Unit): string {
  return unit === "uin" ? "µin" : "µm";
}

/**
 * Format a length value (stored in µm) for display in the chosen unit, with a
 * sensible number of significant figures for its magnitude.
 */
export function formatLength(valueMicrons: number, unit: Unit): string {
  const v = fromMicrons(valueMicrons, unit);
  const abs = Math.abs(v);
  let digits: number;
  if (abs === 0) digits = 0;
  else if (abs < 0.1) digits = 3;
  else if (abs < 1) digits = 3;
  else if (abs < 10) digits = 2;
  else if (abs < 100) digits = 1;
  else digits = 0;
  return `${v.toFixed(digits)} ${unitLabel(unit)}`;
}
