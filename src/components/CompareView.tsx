import { useTrace } from "../hooks/useTrace";
import { TracePanel } from "./TracePanel";
import { useUnits } from "../context/UnitsContext";
import { PARAMETERS } from "../data/parameters";
import { formatParameterValue } from "../lib/displayValue";
import { FINISHES } from "../data/finishes";

/** Side-by-side comparison of two finishes with a shared parameter table. */
export function CompareView() {
  const left = useTrace(FINISHES[5].id); // turning
  const right = useTrace(FINISHES[3].id); // grinding
  const { unit } = useUnits();

  return (
    <section className="view">
      <p className="view-intro">
        Compare two finishes side by side. The table lines up every parameter so
        you can see how, say, a turned and a ground surface differ even at the
        same Ra.
      </p>
      <div className="compare-grid">
        <TracePanel trace={left} showParameters={false} />
        <TracePanel trace={right} showParameters={false} />
      </div>

      <table className="compare-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>{left.finish.process}</th>
            <th>{right.finish.process}</th>
          </tr>
        </thead>
        <tbody>
          {PARAMETERS.filter((p) => p.key).map((p) => (
            <tr key={p.symbol}>
              <th scope="row">
                {p.symbol}
                <span className="compare-param-name">{p.name}</span>
              </th>
              <td>
                {formatParameterValue(left.params[p.key!], p.unitType, unit)}
              </td>
              <td>
                {formatParameterValue(right.params[p.key!], p.unitType, unit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
