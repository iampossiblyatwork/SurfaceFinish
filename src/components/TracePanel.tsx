import { TraceCanvas } from "./TraceCanvas";
import { useUnits } from "../context/UnitsContext";
import type { FinishSummary } from "../api/client";
import type { ParameterDef } from "../data/parameters";
import { formatParameterValue } from "../lib/displayValue";
import { formatLength, fromMicrons, nearestGrade, unitLabel } from "../lib/grades";
import type { TraceState } from "../hooks/useTrace";

const SLIDER_STEPS = 1000;

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
  finishes: FinishSummary[];
  parameters?: ParameterDef[];
  showParameters?: boolean;
}

export function TracePanel({
  trace,
  finishes,
  parameters = [],
  showParameters = true,
}: TracePanelProps) {
  const { unit } = useUnits();
  const {
    finish,
    finishId,
    selectFinish,
    targetRa,
    setTargetRa,
    regenerate,
    profile,
    params,
    grade,
    loading,
  } = trace;

  const raMin = finish?.raMin ?? 0.025;
  const raMax = finish?.raMax ?? 50;
  const displayGrade = params ? nearestGrade(params.Ra).grade : grade;

  return (
    <div className="trace-panel">
      <label className="field">
        <span className="field-label">Process</span>
        <select
          value={finishId}
          onChange={(e) => selectFinish(e.target.value, finishes)}
        >
          {finishes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.process}
            </option>
          ))}
        </select>
      </label>

      <div className={`trace-canvas-wrap${loading ? " loading" : ""}`}>
        {profile ? (
          <TraceCanvas
            profile={profile}
            detailed
            height={170}
            ariaLabel={`${finish?.process ?? ""} surface trace at Ra ${formatLength(params?.Ra ?? targetRa, unit)}`}
          />
        ) : (
          <div className="trace-skeleton" style={{ height: 170 }} />
        )}
      </div>

      <div className="trace-readout-top">
        <div className="big-ra">
          <span className="big-ra-value">
            {params ? formatLength(params.Ra, unit) : "—"}
          </span>
          <span className="big-ra-label">Ra</span>
        </div>
        <div className="grade-badge" title="Nearest ISO 1302 grade">
          {displayGrade}
        </div>
      </div>

      <label className="field">
        <span className="field-label">
          Target Ra — range {formatLength(raMin, unit)} to{" "}
          {formatLength(raMax, unit)}
        </span>
        <input
          type="range"
          min={0}
          max={SLIDER_STEPS}
          value={raToSlider(targetRa, raMin, raMax)}
          onChange={(e) =>
            setTargetRa(sliderToRa(Number(e.target.value), raMin, raMax))
          }
        />
      </label>

      <div className="trace-controls">
        <input
          className="ra-input"
          type="number"
          step="any"
          min={fromMicrons(raMin, unit)}
          max={fromMicrons(raMax, unit)}
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

      {showParameters && params && parameters.length > 0 && (
        <div className="param-grid" aria-label="Computed parameters">
          {parameters.map((p) => (
            <div className="param-cell" key={p.symbol}>
              <span className="param-symbol">{p.symbol}</span>
              <span className="param-value">
                {p.key && p.key in params
                  ? formatParameterValue(
                      params[p.key as keyof typeof params] as number,
                      p.unitType,
                      unit,
                    )
                  : "curve"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
