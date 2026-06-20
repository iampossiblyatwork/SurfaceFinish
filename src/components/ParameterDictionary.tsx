import { useEffect, useState } from "react";
import { useTrace } from "../hooks/useTrace";
import { useOnceFlag } from "../hooks/useOnceFlag";
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

// One-glance "what this family measures": amplitude = height, spacing = lateral
// distance, hybrid = slope, material-ratio = the bearing curve.
function FamilyGlyph({ kind }: { kind: ParameterCategory }) {
  const mid = 22;
  const N = 60;
  const wave = (t: number) =>
    Math.sin(2 * Math.PI * 2.2 * t) + 0.35 * Math.sin(2 * Math.PI * 5 * t + 1);
  const line = Array.from({ length: N + 1 }, (_, i) => {
    const x = 6 + (56 * i) / N;
    const y = mid - 9 * wave(i / N);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  let pk = 0;
  for (let i = 1; i <= N; i++) if (wave(i / N) > wave(pk / N)) pk = i;
  const px = 6 + (56 * pk) / N;
  const py = mid - 9 * wave(pk / N);
  const hx = 30;
  const hy = mid - 9 * wave((hx - 6) / 56);
  const acc = "var(--accent)";
  const good = "var(--good)";
  const mu = "var(--muted)";
  return (
    <svg viewBox="0 0 72 44" className="family-glyph" aria-hidden="true">
      <line x1={6} y1={mid} x2={62} y2={mid} stroke={mu} strokeWidth={1} strokeDasharray="3 3" />
      {kind !== "material-ratio" && (
        <polyline points={line} fill="none" stroke={acc} strokeWidth={1.6} strokeLinejoin="round" />
      )}
      {kind === "amplitude" && (
        <line x1={px} y1={mid} x2={px} y2={py} stroke={good} strokeWidth={2.4} strokeLinecap="round" />
      )}
      {kind === "spacing" && (
        <>
          <line x1={18} y1={mid} x2={45} y2={mid} stroke={good} strokeWidth={2.2} />
          <line x1={18} y1={mid - 4} x2={18} y2={mid + 4} stroke={good} strokeWidth={1.8} />
          <line x1={45} y1={mid - 4} x2={45} y2={mid + 4} stroke={good} strokeWidth={1.8} />
        </>
      )}
      {kind === "hybrid" && (
        <line x1={hx - 8} y1={hy + 7} x2={hx + 8} y2={hy - 7} stroke={good} strokeWidth={2.4} strokeLinecap="round" />
      )}
      {kind === "material-ratio" && (
        <polyline
          points={Array.from({ length: N + 1 }, (_, i) =>
            `${(6 + (56 * i) / N).toFixed(1)},${(mid - 13 * Math.tanh(2.4 * (0.5 - i / N))).toFixed(1)}`,
          ).join(" ")}
          fill="none" stroke={good} strokeWidth={2.2} strokeLinejoin="round"
        />
      )}
    </svg>
  );
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
  const [hintSeen, markHint] = useOnceFlag("surface-finish-hint-seen");

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
  const firstSymbol = categories.flatMap((cat) =>
    parameters.filter((p) => p.category === cat),
  )[0]?.symbol;

  return (
    <section className="view">
      {category ? (
        <div className="family-head">
          <FamilyGlyph kind={category} />
          <p className="view-intro">
            {intro ??
              "Every standard 2D (profile) roughness parameter, with its meaning and formula."}
          </p>
        </div>
      ) : (
        <p className="view-intro">
          {intro ??
            "Every standard 2D (profile) roughness parameter, with its meaning and formula. Values update live as you change the reference trace below."}
        </p>
      )}

      <div className="reference-trace">
        <TracePanel trace={trace} finishes={finishes} showParameters={false} />
      </div>

      {!hintSeen && (
        <div className="viz-hint" role="note">
          <span>
            Tap any diagram to enlarge · the trace above drives every value.
          </span>
          <button
            type="button"
            className="viz-hint-x"
            onClick={markHint}
            aria-label="Dismiss hint"
          >
            ×
          </button>
        </div>
      )}

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
                  pulseHint={!hintSeen && p.symbol === firstSymbol}
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
