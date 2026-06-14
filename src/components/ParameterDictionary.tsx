import { useTrace } from "../hooks/useTrace";
import { useUnits } from "../context/UnitsContext";
import { TracePanel } from "./TracePanel";
import { ParameterCard } from "./ParameterCard";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ParameterDef } from "../data/parameters";
import { formatParameterValue } from "../lib/displayValue";
import type { FinishSummary } from "../api/client";

interface ParameterDictionaryProps {
  parameters: ParameterDef[];
  finishes: FinishSummary[];
}

export function ParameterDictionary({ parameters, finishes }: ParameterDictionaryProps) {
  const trace = useTrace(finishes[0]?.id, finishes[0]?.defaultRa);
  const { unit } = useUnits();

  return (
    <section className="view">
      <p className="view-intro">
        Every standard 2D (profile) roughness parameter, with its meaning and
        formula. Values update live as you change the reference trace below.
      </p>

      <div className="reference-trace">
        <TracePanel trace={trace} finishes={finishes} showParameters={false} />
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = parameters.filter((p) => p.category === cat);
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
                    p.key && trace.params && p.key in trace.params
                      ? formatParameterValue(
                          trace.params[p.key as keyof typeof trace.params] as number,
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
