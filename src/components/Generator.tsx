import { useTrace } from "../hooks/useTrace";
import { TracePanel } from "./TracePanel";
import type { FinishSummary } from "../api/client";
import type { ParameterDef } from "../data/parameters";

interface GeneratorProps {
  initialFinishId?: string;
  finishes: FinishSummary[];
  parameters?: ParameterDef[];
}

export function Generator({ initialFinishId, finishes, parameters = [] }: GeneratorProps) {
  const initialFinish = finishes.find((f) => f.id === initialFinishId) ?? finishes[0];
  const trace = useTrace(initialFinish?.id, initialFinish?.defaultRa);

  return (
    <section className="view">
      <p className="view-intro">
        Pick a process and drag the Ra slider to see how the trace and every
        roughness parameter respond. The calculations run on the Python backend.
        Regenerate for a new random surface at the same Ra.
      </p>
      {finishes.length > 0 ? (
        <>
          <TracePanel
            trace={trace}
            finishes={finishes}
            parameters={parameters}
          />
          {trace.finish && (
            <p className="finish-note">{trace.finish.description}</p>
          )}
        </>
      ) : (
        <div className="trace-skeleton" style={{ height: 300 }} />
      )}
    </section>
  );
}
