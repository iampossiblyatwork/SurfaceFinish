import { useUnits } from "../context/UnitsContext";
import { fromMicrons, unitLabel } from "../lib/grades";
import {
  PROCESS_COMPARISON,
  RA_TICKS,
  RA_DOMAIN_MIN,
  RA_DOMAIN_MAX,
} from "../data/processComparison";

const LOG_MIN = Math.log10(RA_DOMAIN_MIN);
const LOG_MAX = Math.log10(RA_DOMAIN_MAX);

/** Position (0–100%) for a Ra value — rough (large Ra) at left, fine at right. */
function posPct(ra: number): number {
  const t = (Math.log10(ra) - LOG_MIN) / (LOG_MAX - LOG_MIN);
  return (1 - t) * 100;
}

function tickLabel(raMicron: number, unit: "um" | "uin"): string {
  const v = fromMicrons(raMicron, unit);
  if (unit === "uin") return String(Math.round(v));
  return v < 0.1 ? v.toFixed(3).replace(/0+$/, "").replace(/\.$/, "") : String(v);
}

export function ProcessComparison() {
  const { unit } = useUnits();

  return (
    <section className="view">
      <p className="view-intro">
        Indicative Ra ranges for common manufacturing processes, grouped by
        family. The scale is logarithmic, rough on the left and fine on the
        right. These are typical ranges for orientation — not a substitute for a
        drawing specification.
      </p>

      <div className="pcomp">
        <div className="pcomp-axis" aria-hidden>
          {RA_TICKS.map((t) => (
            <span
              key={t}
              className="pcomp-tick"
              style={{ left: `${posPct(t)}%` }}
            >
              {tickLabel(t, unit)}
            </span>
          ))}
        </div>
        <div className="pcomp-axis-unit">Ra ({unitLabel(unit)})</div>

        {PROCESS_COMPARISON.map((group) => (
          <div key={group.family} className="pcomp-group">
            <h2 className="pcomp-family">{group.family}</h2>
            {group.processes.map((p) => {
              const left = posPct(p.raMax);
              const right = posPct(p.raMin);
              return (
                <div key={p.name} className="pcomp-row">
                  <span className="pcomp-label">{p.name}</span>
                  <span className="pcomp-track">
                    {RA_TICKS.map((t) => (
                      <span
                        key={t}
                        className="pcomp-gridline"
                        style={{ left: `${posPct(t)}%` }}
                      />
                    ))}
                    <span
                      className="pcomp-bar"
                      style={{ left: `${left}%`, width: `${right - left}%` }}
                      title={`Ra ${tickLabel(p.raMin, unit)}–${tickLabel(p.raMax, unit)} ${unitLabel(unit)}`}
                    />
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
