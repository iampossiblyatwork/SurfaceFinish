// TypeScript types for the parameter catalog served from /api/parameters.
// The CATEGORY_LABELS constant stays here as it is pure UI config.

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
  key: string | null;
  summary: string;
  meaning: string;
  formula: string;
}

export const CATEGORY_LABELS: Record<ParameterCategory, string> = {
  amplitude: "Amplitude (height)",
  spacing: "Spacing (lateral)",
  hybrid: "Hybrid (shape)",
  "material-ratio": "Material ratio",
};

export const CATEGORY_ORDER: ParameterCategory[] = [
  "amplitude",
  "spacing",
  "hybrid",
  "material-ratio",
];
