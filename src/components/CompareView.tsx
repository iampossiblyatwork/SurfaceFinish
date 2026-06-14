import { useTrace } from "../hooks/useTrace";
import { TracePanel } from "./TracePanel";
import { useUnits } from "../context/UnitsContext";
import { formatParameterValue } from "../lib/displayValue";
import type { FinishSummary } from "../api/client";

interface CompareViewProps {
  finishes: FinishSummary[];
}

// Inline parameter list for the compare table (fetched symbols only)
const COMPARE_PARAMS: { symbol: string; name: string; key: string; unitType: string }[] = [
  { symbol: "Ra", name: "Arithmetic mean deviation", key: "Ra", unitType: "height" },
  { symbol: "Rq", name: "RMS deviation", key: "Rq", unitType: "height" },
  { symbol: "Rz", name: "Mean roughness depth", key: "Rz", unitType: "height" },
  { symbol: "Rt", name: "Total height", key: "Rt", unitType: "height" },
  { symbol: "Rp", name: "Max peak height", key: "Rp", unitType: "height" },
  { symbol: "Rv", name: "Max valley depth", key: "Rv", unitType: "height" },
  { symbol: "Rc", name: "Mean element height", key: "Rc", unitType: "height" },
  { symbol: "Rsk", name: "Skewness", key: "Rsk", unitType: "unitless" },
  { symbol: "Rku", name: "Kurtosis", key: "Rku", unitType: "unitless" },
  { symbol: "RSm", name: "Mean element spacing", key: "RSm", unitType: "lateral" },
  { symbol: "RΔq", name: "RMS slope", key: "RDq", unitType: "angle" },
];

export function CompareView({ finishes }: CompareViewProps) {
  const turningId = finishes.find((f) => f.id === "turning")?.id ?? finishes[5]?.id ?? finishes[0]?.id;
  const grindingId = finishes.find((f) => f.id === "grinding")?.id ?? finishes[3]?.id ?? finishes[1]?.id;

  const left = useTrace(turningId);
  const right = useTrace(grindingId);
  const { unit } = useUnits();

  return (
    <section className="view">
      <p className="view-intro">
        Compare two finishes side by side. The table lines up every parameter so
        you can see how, say, a turned and a ground surface differ even at the same Ra.
      </p>
      <div className="compare-grid">
        <TracePanel trace={left} finishes={finishes} showParameters={false} />
        <TracePanel trace={right} finishes={finishes} showParameters={false} />
      </div>

      <table className="compare-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>{left.finish?.process ?? "—"}</th>
            <th>{right.finish?.process ?? "—"}</th>
          </tr>
        </thead>
        <tbody>
          {COMPARE_PARAMS.map((p) => (
            <tr key={p.symbol}>
              <th scope="row">
                {p.symbol}
                <span className="compare-param-name">{p.name}</span>
              </th>
              <td>
                {left.params
                  ? formatParameterValue(
                      left.params[p.key as keyof typeof left.params] as number,
                      p.unitType as "height" | "lateral" | "unitless" | "angle",
                      unit,
                    )
                  : "—"}
              </td>
              <td>
                {right.params
                  ? formatParameterValue(
                      right.params[p.key as keyof typeof right.params] as number,
                      p.unitType as "height" | "lateral" | "unitless" | "angle",
                      unit,
                    )
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
