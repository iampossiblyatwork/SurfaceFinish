import { useTrace } from "../hooks/useTrace";
import { useUnits } from "../context/UnitsContext";
import { TracePanel } from "./TracePanel";
import { ParameterCard } from "./ParameterCard";
import {
  CATEGORY_LABELS,
  PARAMETERS,
  type ParameterCategory,
} from "../data/parameters";
import { formatParameterValue } from "../lib/displayValue";

const CATEGORY_ORDER: ParameterCategory[] = [
  "amplitude",
  "spacing",
  "hybrid",
  "material-ratio",
];

/**
 * The educational glossary. A live reference trace at the top drives the values
 * shown on each parameter card, so the definitions are grounded in a real
 * (synthesized) surface the user can change.
 */
export function ParameterDictionary() {
  const trace = useTrace();
  const { unit } = useUnits();

  return (
    <section className="view">
      <p className="view-intro">
        Every standard 2D (profile) roughness parameter, with its meaning and
        formula. The values update live for the reference trace below — change
        the process or Ra to see how each parameter reacts.
      </p>

      <div className="reference-trace">
        <TracePanel trace={trace} showParameters={false} />
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = PARAMETERS.filter((p) => p.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="param-category">
            <h2 className="param-category-title">{CATEGORY_LABELS[cat]}</h2>
            <div className="param-card-list">
              {items.map((p) => (
                <ParameterCard
                  key={p.symbol}
                  def={p}
                  value={
                    p.key
                      ? formatParameterValue(
                          trace.params[p.key],
                          p.unitType,
                          unit,
                        )
                      : null
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
