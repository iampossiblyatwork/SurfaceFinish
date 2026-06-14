// Formats a computed parameter value for display, respecting its unit type and
// the global µm/µin choice. Only height parameters follow the unit toggle;
// lateral spacing, dimensionless, and angle parameters are quoted conventionally.

import { formatLength, type Unit } from "./grades";
import type { UnitType } from "../data/parameters";

export function formatParameterValue(
  value: number,
  unitType: UnitType,
  unit: Unit,
): string {
  switch (unitType) {
    case "height":
      return formatLength(value, unit);
    case "lateral":
      // RSm is a lateral spacing; show µm, or mm once it gets large.
      return value >= 1000
        ? `${(value / 1000).toFixed(3)} mm`
        : `${value.toFixed(1)} µm`;
    case "angle":
      return `${value.toFixed(2)}°`;
    case "unitless":
    default:
      return value.toFixed(2);
  }
}
