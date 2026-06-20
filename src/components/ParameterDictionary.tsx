import { useEffect, useState } from "react";
import { useTrace } from "../hooks/useTrace";
import { useUnits } from "../context/UnitsContext";
import { TracePanel } from "./TracePanel";
import { ParameterCard } from "./ParameterCard";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ParameterCategory,
  type ParameterDef,
} from "../data/parameters";
import { formatParameterValue } from "../lib/displayValue";
import type { FinishSummary } from "../api/client";

interface ParameterDictionaryProps {
  parameters: ParameterDef[];
  finishes: FinishSummary[];
  /** When set, only this category's parameters are shown (drives the Profilers subsections). */
  category?: ParameterCategory;
  intro?: string;
  /** Deep-link target: a parameter symbol to scroll to and briefly highlight. */
  focusSymbol?: string;
}

export function ParameterDictionary({
  parameters,
  finishes,
  category,
  intro,
  focusSymbol,
}: ParameterDictionaryProps) {
  const trace = useTrace(finishes[0]?.id, finishes[0]?.defaultRa);
  const { unit } = useUnits();
  const [highlighted, setHighlighted] = useState<string | null>(null);

  // Scroll a deep-linked / searched-for parameter into view and flash it.
  useEffect(() => {
    if (!focusSymbol) return;
    const el = document.getElementById(`param-${focusSymbol}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlighted(focusSymbol);
    const t = setTimeout(() => setHighlighted(null), 1600);
    return () => clearTimeout(t);
  }, [focusSymbol]);

  const categories = category ? [category] : CATEGORY_ORDER;

  return (
    <section className="view">
      <p className="view-intro">
        {intro ??
          "Every standard 2D (profile) roughness parameter, with its meaning and formula. Values update live as you change the reference trace below."}
      </p>

      <div className="reference-trace">
        <TracePanel trace={trace} finishes={finishes} showParameters={false} />
      </div>

      {categories.map((cat) => {
        const items = parameters.filter((p) => p.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="param-category">
            {!category && (
              <h2 className="param-category-title">{CATEGORY_LABELS[cat]}</h2>
            )}
            <div className="param-card-list">
              {items.map((p) => (
                <ParameterCard
                  key={p.symbol}
                  def={p}
                  profile={trace.profile}
                  highlight={highlighted === p.symbol}
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
