import { useCallback, useState } from "react";

/**
 * A boolean flag that persists in localStorage — true once it has been marked,
 * across reloads. Used for one-time hints. Mirrors the UnitsContext storage
 * pattern (guarded against private-mode failures).
 */
export function useOnceFlag(key: string): [boolean, () => void] {
  const [seen, setSeen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  });

  const mark = useCallback(() => {
    setSeen(true);
    try {
      localStorage.setItem(key, "1");
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }, [key]);

  return [seen, mark];
}
