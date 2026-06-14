// Formats a computed parameter value for display, respecting its unit type and
// the global µm/µin choice. Only height parameters follow the unit toggle;
// lateral spacing, dimensionless, and angle parameters are quoted conventionally.

import { formatLength, formatLateral, type Unit } from "./grades";
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
      // RSm stored in µm internally; convert to mm then format as lateral distance.
      return formatLateral(value / 1000, unit);
    case "angle":
      return `${value.toFixed(2)}°`;
    case "unitless":
    default:
      return value.toFixed(2);
  }
}
