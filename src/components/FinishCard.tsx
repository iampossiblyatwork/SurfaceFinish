import { useMemo } from "react";
import { TraceCanvas } from "./TraceCanvas";
import { useUnits } from "../context/UnitsContext";
import { generateProfile } from "../lib/profile";
import { formatLength, nearestGrade } from "../lib/grades";
import type { Finish } from "../data/finishes";

interface FinishCardProps {
  finish: Finish;
  onOpen: (finishId: string) => void;
}

export function FinishCard({ finish, onOpen }: FinishCardProps) {
  const { unit } = useUnits();
  const profile = useMemo(
    () => generateProfile(finish.defaultRa, finish.genParams, 1),
    [finish],
  );
  const gradeLo = nearestGrade(finish.raMin).grade;
  const gradeHi = nearestGrade(finish.raMax).grade;

  return (
    <button
      type="button"
      className="finish-card"
      onClick={() => onOpen(finish.id)}
    >
      <div className="finish-card-head">
        <span className="finish-card-title">{finish.process}</span>
        <span className="finish-card-grade">
          {gradeLo === gradeHi ? gradeLo : `${gradeLo}–${gradeHi}`}
        </span>
      </div>
      <TraceCanvas
        profile={profile}
        height={70}
        ariaLabel={`${finish.process} example trace`}
      />
      <div className="finish-card-meta">
        <span className="finish-card-family">{finish.family}</span>
        <span className="finish-card-ra">
          Ra {formatLength(finish.raMin, unit)} – {formatLength(finish.raMax, unit)}
        </span>
      </div>
    </button>
  );
}
