import { useTrace } from "../hooks/useTrace";
import { TracePanel } from "./TracePanel";

interface GeneratorProps {
  initialFinishId?: string;
}

/** Single interactive trace generator with the full parameter readout. */
export function Generator({ initialFinishId }: GeneratorProps) {
  const trace = useTrace(initialFinishId);
  return (
    <section className="view">
      <p className="view-intro">
        Pick a process and drag the Ra slider to see how the trace and every
        roughness parameter respond. Regenerate for a new random surface at the
        same Ra.
      </p>
      <TracePanel trace={trace} />
      <p className="finish-note">{trace.finish.description}</p>
    </section>
  );
}
