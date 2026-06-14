import type { ParameterDef } from "../data/parameters";

interface ParameterCardProps {
  def: ParameterDef;
  /** Live value for the current trace, already formatted, or null if curve-based. */
  value: string | null;
}

export function ParameterCard({ def, value }: ParameterCardProps) {
  return (
    <article className="param-card">
      <header className="param-card-head">
        <span className="param-card-symbol">{def.symbol}</span>
        <span className="param-card-name">{def.name}</span>
        {value !== null && <span className="param-card-value">{value}</span>}
      </header>
      <p className="param-card-summary">{def.summary}</p>
      <p className="param-card-meaning">{def.meaning}</p>
      <code className="param-card-formula">{def.formula}</code>
    </article>
  );
}
