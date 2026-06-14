import { TraceCanvas } from "./TraceCanvas";
import { useUnits } from "../context/UnitsContext";
import { FINISHES } from "../data/finishes";
import { PARAMETERS } from "../data/parameters";
import { formatParameterValue } from "../lib/displayValue";
import { formatLength, fromMicrons, nearestGrade, unitLabel } from "../lib/grades";
import type { TraceState } from "../hooks/useTrace";

const SLIDER_STEPS = 1000;

/** Map a slider position [0,1000] to Ra (µm) on a log scale within the range. */
function sliderToRa(pos: number, raMin: number, raMax: number): number {
  const t = pos / SLIDER_STEPS;
  return raMin * Math.pow(raMax / raMin, t);
}
function raToSlider(ra: number, raMin: number, raMax: number): number {
  const t = Math.log(ra / raMin) / Math.log(raMax / raMin);
  return Math.round(Math.min(1, Math.max(0, t)) * SLIDER_STEPS);
}

interface TracePanelProps {
  trace: TraceState;
  /** Hide the per-parameter readout grid (used in compact compare layout). */
  showParameters?: boolean;
}

export function TracePanel({ trace, showParameters = true }: TracePanelProps) {
  const { unit } = useUnits();
  const { finish, finishId, selectFinish, targetRa, setTargetRa, regenerate, profile, params } =
    trace;
  const grade = nearestGrade(params.Ra);

  return (
    <div className="trace-panel">
      <label className="field">
        <span className="field-label">Process</span>
        <select
          value={finishId}
          onChange={(e) => selectFinish(e.target.value)}
        >
          {FINISHES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.process}
            </option>
          ))}
        </select>
      </label>

      <TraceCanvas
        profile={profile}
        detailed
        height={170}
        ariaLabel={`${finish.process} surface trace at Ra ${formatLength(params.Ra, unit)}`}
      />

      <div className="trace-readout-top">
        <div className="big-ra">
          <span className="big-ra-value">{formatLength(params.Ra, unit)}</span>
          <span className="big-ra-label">Ra</span>
        </div>
        <div className="grade-badge" title="Nearest ISO 1302 grade">
          {grade.grade}
        </div>
      </div>

      <label className="field">
        <span className="field-label">
          Target Ra — range {formatLength(finish.raMin, unit)} to{" "}
          {formatLength(finish.raMax, unit)}
        </span>
        <input
          type="range"
          min={0}
          max={SLIDER_STEPS}
          value={raToSlider(targetRa, finish.raMin, finish.raMax)}
          onChange={(e) =>
            setTargetRa(
              sliderToRa(Number(e.target.value), finish.raMin, finish.raMax),
            )
          }
        />
      </label>

      <div className="trace-controls">
        <input
          className="ra-input"
          type="number"
          step="any"
          min={fromMicrons(finish.raMin, unit)}
          max={fromMicrons(finish.raMax, unit)}
          value={Number(fromMicrons(targetRa, unit).toFixed(3))}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v) && v > 0) {
              setTargetRa(unit === "uin" ? v / 39.3701 : v);
            }
          }}
          aria-label={`Target Ra in ${unitLabel(unit)}`}
        />
        <span className="ra-input-unit">{unitLabel(unit)}</span>
        <button type="button" className="regen-btn" onClick={regenerate}>
          ↻ Regenerate
        </button>
      </div>

      {showParameters && (
        <div className="param-grid" aria-label="Computed parameters">
          {PARAMETERS.map((p) => (
            <div className="param-cell" key={p.symbol}>
              <span className="param-symbol">{p.symbol}</span>
              <span className="param-value">
                {p.key
                  ? formatParameterValue(params[p.key], p.unitType, unit)
                  : "curve"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
