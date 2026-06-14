// App-wide micron / microinch unit toggle.
//
// A single source of truth so every displayed length converts consistently.
// Stored values stay in µm; this only changes presentation. The choice is
// persisted to localStorage so it survives reloads (handy for a pocket tool).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Unit } from "../lib/grades";

interface UnitsContextValue {
  unit: Unit;
  setUnit: (u: Unit) => void;
  toggle: () => void;
}

const UnitsContext = createContext<UnitsContextValue | null>(null);

const STORAGE_KEY = "surface-finish-unit";

function readStored(): Unit {
  if (typeof localStorage === "undefined") return "um";
  return localStorage.getItem(STORAGE_KEY) === "uin" ? "uin" : "um";
}

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [unit, setUnitState] = useState<Unit>(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, unit);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [unit]);

  const setUnit = useCallback((u: Unit) => setUnitState(u), []);
  const toggle = useCallback(
    () => setUnitState((u) => (u === "um" ? "uin" : "um")),
    [],
  );

  const value = useMemo(
    () => ({ unit, setUnit, toggle }),
    [unit, setUnit, toggle],
  );

  return (
    <UnitsContext.Provider value={value}>{children}</UnitsContext.Provider>
  );
}

export function useUnits(): UnitsContextValue {
  const ctx = useContext(UnitsContext);
  if (!ctx) throw new Error("useUnits must be used within a UnitsProvider");
  return ctx;
}
