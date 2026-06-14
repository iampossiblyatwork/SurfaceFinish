import { useUnits } from "../context/UnitsContext";

/** The global µm / µin flip switch. */
export function UnitsToggle() {
  const { unit, setUnit } = useUnits();
  return (
    <div className="units-toggle" role="group" aria-label="Display units">
      <button
        type="button"
        className={unit === "um" ? "active" : ""}
        aria-pressed={unit === "um"}
        onClick={() => setUnit("um")}
      >
        µm
      </button>
      <button
        type="button"
        className={unit === "uin" ? "active" : ""}
        aria-pressed={unit === "uin"}
        onClick={() => setUnit("uin")}
      >
        µin
      </button>
    </div>
  );
}
