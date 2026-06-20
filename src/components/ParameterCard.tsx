import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ParameterDef } from "../data/parameters";
import type { Profile } from "../api/client";
import { ParameterViz, vizCaption, hasViz, vizLegend, AbbottCurve } from "./ParameterViz";

interface ParameterCardProps {
  def: ParameterDef;
  /** Live value for the current trace, already formatted, or null if curve-based. */
  value: string | null;
  /** Current reference profile, used to draw the per-parameter visual. */
  profile?: Profile | null;
  /** Briefly outline the card when it's the deep-link / search target. */
  highlight?: boolean;
  /** One-time pulse on the expand badge, to signal the diagram is tappable. */
  pulseHint?: boolean;
}

export function ParameterCard({
  def,
  value,
  profile,
  highlight,
  pulseHint,
}: ParameterCardProps) {
  const caption = vizCaption(def.key);
  const legend = vizLegend(def.key);
  const isAbbott = def.symbol === "Rmr(c)";
  const [open, setOpen] = useState(false);
  const showViz = !!(profile && hasViz(def.key));

  // Close the expanded view on Escape, and lock body scroll while it's open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const legendEl = legend && (
    <div className="viz-legend">
      {legend.map((l) => (
        <span key={l.label} className="viz-legend-item">
          <span className="viz-legend-swatch" style={{ background: l.color }} />
          {l.label}
        </span>
      ))}
    </div>
  );

  return (
    <article
      id={`param-${def.symbol}`}
      className={`param-card${highlight ? " highlight" : ""}`}
    >
      <header className="param-card-head">
        <span className="param-card-symbol">{def.symbol}</span>
        <span className="param-card-name">{def.name}</span>
        {value !== null && <span className="param-card-value">{value}</span>}
      </header>
      {showViz && profile && (
        <>
          <button
            type="button"
            className="param-viz-btn"
            onClick={() => setOpen(true)}
            aria-label={`Expand the ${def.name} diagram`}
          >
            <ParameterViz vizKey={def.key} profile={profile} symbol={def.symbol} />
            <span
              className={`param-viz-zoom${pulseHint ? " pulse" : ""}`}
              aria-hidden="true"
            >
              ⤢
            </span>
          </button>
          {legendEl}
          {caption && <p className="param-viz-caption">{caption}</p>}
        </>
      )}
      {isAbbott && (
        <>
          <AbbottCurve />
          <p className="param-viz-caption">
            Sort every height from the highest peak down: a long load-bearing
            plateau, then a steep drop into the oil-retaining valleys.
          </p>
        </>
      )}
      <p className="param-card-summary">{def.summary}</p>
      <p className="param-card-meaning">{def.meaning}</p>
      <code className="param-card-formula">{def.formula}</code>

      {open &&
        profile &&
        createPortal(
          <div
            className="viz-modal-backdrop"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${def.symbol} — ${def.name}`}
          >
            <div className="viz-modal" onClick={(e) => e.stopPropagation()}>
              <header className="viz-modal-head">
                <span className="param-card-symbol">{def.symbol}</span>
                <span className="param-card-name">{def.name}</span>
                {value !== null && (
                  <span className="param-card-value">{value}</span>
                )}
                <button
                  type="button"
                  className="viz-modal-close"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  ×
                </button>
              </header>
              <ParameterViz vizKey={def.key} profile={profile} symbol={def.symbol} expanded />
              {legendEl}
              {caption && <p className="param-viz-caption">{caption}</p>}
              <p className="param-card-meaning">{def.meaning}</p>
              <code className="param-card-formula">{def.formula}</code>
            </div>
          </div>,
          document.body,
        )}
    </article>
  );
}
