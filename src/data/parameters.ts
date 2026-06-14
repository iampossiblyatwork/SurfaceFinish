// Educational catalog of standard surface-texture parameters.
//
// Each entry pairs a plain-language explanation with its formula and (for the
// scalar parameters) a `key` linking to the value computed in roughness.ts, so
// the dictionary can show a live number for the current trace.
//
// `dimension` distinguishes 2D profile (R-) parameters from 3D areal (S-)
// parameters. v1 ships the 2D set; the field exists so S-parameters can be
// added later without changing the data shape.

import type { RoughnessParameters } from "../lib/roughness";

export type ParameterCategory =
  | "amplitude"
  | "spacing"
  | "hybrid"
  | "material-ratio";

export type UnitType = "height" | "lateral" | "unitless" | "angle";

export interface ParameterDef {
  symbol: string;
  name: string;
  category: ParameterCategory;
  dimension: "2D" | "3D";
  unitType: UnitType;
  /** Key into RoughnessParameters for the live value, or null if curve-based. */
  key: keyof RoughnessParameters | null;
  /** One-line gist for quick lookup. */
  summary: string;
  /** Fuller plain-language explanation of what it tells you. */
  meaning: string;
  /** Human-readable formula. */
  formula: string;
}

export const CATEGORY_LABELS: Record<ParameterCategory, string> = {
  amplitude: "Amplitude (height)",
  spacing: "Spacing (lateral)",
  hybrid: "Hybrid (shape)",
  "material-ratio": "Material ratio",
};

export const PARAMETERS: ParameterDef[] = [
  {
    symbol: "Ra",
    name: "Arithmetic mean deviation",
    category: "amplitude",
    dimension: "2D",
    unitType: "height",
    key: "Ra",
    summary: "Average distance of the profile from its mean line.",
    meaning:
      "The most widely used roughness number. It is the average absolute height of the profile relative to the mean line. Robust and easy to measure, but it cannot tell peaks apart from valleys — two very different surfaces can share the same Ra.",
    formula: "Ra = (1/L) ∫ |z(x)| dx",
  },
  {
    symbol: "Rq",
    name: "Root-mean-square deviation",
    category: "amplitude",
    dimension: "2D",
    unitType: "height",
    key: "Rq",
    summary: "RMS average of profile heights.",
    meaning:
      "Like Ra but using a root-mean-square average, so larger excursions count more. It is the standard deviation of the surface heights and ties directly into skewness and kurtosis. For a sine wave Rq = A/√2 while Ra = 2A/π.",
    formula: "Rq = √[ (1/L) ∫ z(x)² dx ]",
  },
  {
    symbol: "Rz",
    name: "Mean roughness depth",
    category: "amplitude",
    dimension: "2D",
    unitType: "height",
    key: "Rz",
    summary: "Average peak-to-valley height over sampling lengths.",
    meaning:
      "The evaluation length is split into (usually five) sampling lengths; in each the largest peak-to-valley height is taken and the results averaged. More sensitive to occasional tall peaks or deep scratches than Ra.",
    formula: "Rz = (1/n) Σ (Rp_i + Rv_i)  over n sampling lengths",
  },
  {
    symbol: "Rt",
    name: "Total height of the profile",
    category: "amplitude",
    dimension: "2D",
    unitType: "height",
    key: "Rt",
    summary: "Highest peak to deepest valley over the whole length.",
    meaning:
      "The single largest peak-to-valley span across the entire evaluation length. Useful when even one defect matters (sealing faces, fatigue-critical parts), but very sensitive to outliers.",
    formula: "Rt = Rp + Rv  (over the evaluation length)",
  },
  {
    symbol: "Rp",
    name: "Maximum peak height",
    category: "amplitude",
    dimension: "2D",
    unitType: "height",
    key: "Rp",
    summary: "Height of the highest peak above the mean line.",
    meaning:
      "The tallest peak measured from the mean line. Matters for surfaces that slide or seal, where high peaks are worn off first.",
    formula: "Rp = max z(x)",
  },
  {
    symbol: "Rv",
    name: "Maximum valley depth",
    category: "amplitude",
    dimension: "2D",
    unitType: "height",
    key: "Rv",
    summary: "Depth of the deepest valley below the mean line.",
    meaning:
      "The deepest valley measured from the mean line (reported positive). Valleys retain lubricant but can also concentrate stress.",
    formula: "Rv = |min z(x)|",
  },
  {
    symbol: "Rc",
    name: "Mean height of profile elements",
    category: "amplitude",
    dimension: "2D",
    unitType: "height",
    key: "Rc",
    summary: "Average peak-to-valley height of individual profile elements.",
    meaning:
      "Averages the height of each profile element (a peak/valley pair between mean-line crossings) using discrimination thresholds, giving a measure that is less swayed by single extreme features than Rt.",
    formula: "Rc = (1/m) Σ Zt_i  over m profile elements",
  },
  {
    symbol: "Rsk",
    name: "Skewness",
    category: "amplitude",
    dimension: "2D",
    unitType: "unitless",
    key: "Rsk",
    summary: "Asymmetry of the height distribution.",
    meaning:
      "Tells whether the surface is dominated by peaks (positive skew) or valleys (negative skew). Negative skew — a flat plateau with oil-retaining valleys — is often desirable for bearing and sealing surfaces.",
    formula: "Rsk = (1/Rq³)(1/L) ∫ z(x)³ dx",
  },
  {
    symbol: "Rku",
    name: "Kurtosis",
    category: "amplitude",
    dimension: "2D",
    unitType: "unitless",
    key: "Rku",
    summary: "Sharpness / spikiness of the height distribution.",
    meaning:
      "Describes how peaked the height distribution is. Rku = 3 is Gaussian; below 3 the surface is bumpy and rounded, above 3 it has sharp spikes or deep scratches. (A pure sine wave gives 1.5.)",
    formula: "Rku = (1/Rq⁴)(1/L) ∫ z(x)⁴ dx",
  },
  {
    symbol: "RSm",
    name: "Mean width of profile elements",
    category: "spacing",
    dimension: "2D",
    unitType: "lateral",
    key: "RSm",
    summary: "Average spacing of profile elements along the surface.",
    meaning:
      "The mean lateral distance between repeating features — for a turned part this tracks the feed per revolution. Two surfaces can share an Ra yet feel completely different because their RSm (texture spacing) differs.",
    formula: "RSm = (1/m) Σ Xs_i  over m profile elements",
  },
  {
    symbol: "RΔq",
    name: "Root-mean-square slope",
    category: "hybrid",
    dimension: "2D",
    unitType: "angle",
    key: "RDq",
    summary: "RMS of the local profile slope.",
    meaning:
      "A hybrid parameter combining height and spacing: the RMS slope of the surface. It correlates with optical scatter (gloss), adhesion, and how a coating or paint will key to the surface.",
    formula: "RΔq = √[ (1/L) ∫ (dz/dx)² dx ]",
  },
  {
    symbol: "Rmr(c)",
    name: "Material ratio (Abbott–Firestone)",
    category: "material-ratio",
    dimension: "2D",
    unitType: "unitless",
    key: null,
    summary: "Fraction of material at a given depth below the highest peak.",
    meaning:
      "The bearing-area curve: at each depth c below the highest peak it gives the percentage of solid material. Its S-shape reveals running-in behavior — a curve that rises quickly means broad load-bearing plateaus near the top.",
    formula: "Rmr(c) = (length of material at depth c) / L × 100%",
  },
];
