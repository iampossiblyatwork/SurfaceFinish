import type { ParameterDef } from "../data/parameters";
import type { Profile } from "../api/client";
import { ParameterViz, vizCaption } from "./ParameterViz";

interface ParameterCardProps {
  def: ParameterDef;
  /** Live value for the current trace, already formatted, or null if curve-based. */
  value: string | null;
  /** Current reference profile, used to draw the per-parameter visual. */
  profile?: Profile | null;
}

export function ParameterCard({ def, value, profile }: ParameterCardProps) {
  const caption = vizCaption(def.key);
  return (
    <article className="param-card">
      <header className="param-card-head">
        <span className="param-card-symbol">{def.symbol}</span>
        <span className="param-card-name">{def.name}</span>
        {value !== null && <span className="param-card-value">{value}</span>}
      </header>
      {profile && def.key && (
        <>
          <ParameterViz vizKey={def.key} profile={profile} />
          {caption && <p className="param-viz-caption">{caption}</p>}
        </>
      )}
      <p className="param-card-summary">{def.summary}</p>
      <p className="param-card-meaning">{def.meaning}</p>
      <code className="param-card-formula">{def.formula}</code>
    </article>
  );
}
