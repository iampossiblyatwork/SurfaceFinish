// Stateful driver for a single trace: fetches profile + parameters from the
// Python backend whenever finishId, targetRa, or seed changes.

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type FinishSummary, type Profile, type RoughnessParameters } from "../api/client";

const DEFAULT_FINISH_ID = "turning";

export interface TraceState {
  finish: FinishSummary | null;
  finishId: string;
  selectFinish: (id: string, finishes: FinishSummary[]) => void;
  targetRa: number;
  setTargetRa: (ra: number) => void;
  seed: number;
  regenerate: () => void;
  profile: Profile | null;
  params: RoughnessParameters | null;
  grade: string;
  loading: boolean;
  error: string | null;
}

export function useTrace(
  initialFinishId: string = DEFAULT_FINISH_ID,
  initialRa?: number,
): TraceState {
  const [finishId, setFinishId] = useState(initialFinishId);
  const [finish, setFinish] = useState<FinishSummary | null>(null);
  const [targetRa, setTargetRaState] = useState<number>(initialRa ?? 1.6);
  const [seed, setSeed] = useState(1);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [params, setParams] = useState<RoughnessParameters | null>(null);
  const [grade, setGrade] = useState("N7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track in-flight request so stale responses are discarded.
  const requestIdRef = useRef(0);

  useEffect(() => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    api
      .generateTrace(finishId, targetRa, seed)
      .then((data) => {
        if (id !== requestIdRef.current) return; // stale
        setProfile(data.profile);
        setParams(data.params);
        setGrade(data.grade);
      })
      .catch((err: Error) => {
        if (id !== requestIdRef.current) return;
        setError(err.message);
      })
      .finally(() => {
        if (id === requestIdRef.current) setLoading(false);
      });
  }, [finishId, targetRa, seed]);

  const selectFinish = useCallback(
    (id: string, finishes: FinishSummary[]) => {
      const next = finishes.find((f) => f.id === id) ?? null;
      setFinishId(id);
      setFinish(next);
      if (next) setTargetRaState(next.defaultRa);
    },
    [],
  );

  const setTargetRa = useCallback((ra: number) => setTargetRaState(ra), []);
  const regenerate = useCallback(() => setSeed((s) => s + 1), []);

  return {
    finish,
    finishId,
    selectFinish,
    targetRa,
    setTargetRa,
    seed,
    regenerate,
    profile,
    params,
    grade,
    loading,
    error,
  };
}
