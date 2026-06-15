import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ParameterDef } from "../data/parameters";
import type { Profile } from "../api/client";
import { ParameterViz, vizCaption, hasViz } from "./ParameterViz";

interface ParameterCardProps {
  def: ParameterDef;
  /** Live value for the current trace, already formatted, or null if curve-based. */
  value: string | null;
  /** Current reference profile, used to draw the per-parameter visual. */
  profile?: Profile | null;
}

export function ParameterCard({ def, value, profile }: ParameterCardProps) {
  const caption = vizCaption(def.key);
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

  return (
    <article className="param-card">
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
            <ParameterViz vizKey={def.key} profile={profile} />
            <span className="param-viz-zoom" aria-hidden="true">⤢</span>
          </button>
          {caption && <p className="param-viz-caption">{caption}</p>}
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
              <ParameterViz vizKey={def.key} profile={profile} expanded />
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
