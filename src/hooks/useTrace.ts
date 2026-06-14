// Stateful driver for a single trace: which finish, target Ra, and seed, plus
// the derived profile and its computed parameters. Shared by the Generator and
// by each side of the Compare view.

import { useCallback, useMemo, useState } from "react";
import { FINISHES, type Finish } from "../data/finishes";
import { generateProfile } from "../lib/profile";
import { computeParameters } from "../lib/roughness";

export function useTrace(initialFinishId: string = FINISHES[0].id) {
  const findFinish = (id: string): Finish =>
    FINISHES.find((f) => f.id === id) ?? FINISHES[0];

  const [finishId, setFinishId] = useState(initialFinishId);
  const finish = findFinish(finishId);
  const [targetRa, setTargetRa] = useState(finish.defaultRa);
  const [seed, setSeed] = useState(1);

  const selectFinish = useCallback((id: string) => {
    const next = findFinish(id);
    setFinishId(id);
    setTargetRa(next.defaultRa);
  }, []);

  const regenerate = useCallback(() => {
    setSeed((s) => s + 1);
  }, []);

  const profile = useMemo(
    () => generateProfile(targetRa, finish.genParams, seed),
    [targetRa, finish, seed],
  );

  const params = useMemo(() => computeParameters(profile), [profile]);

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
  };
}

export type TraceState = ReturnType<typeof useTrace>;
