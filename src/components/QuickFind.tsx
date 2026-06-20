import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface QuickFindItem {
  symbol: string;
  name: string;
  category: string;
}

/**
 * Command-palette style parameter finder. Opens over everything (portal),
 * filters as you type, and is fully keyboard-driven (↑/↓ to move, Enter to pick,
 * Esc to close).
 */
export function QuickFind({
  parameters,
  onPick,
  onClose,
}: {
  parameters: QuickFindItem[];
  onPick: (item: QuickFindItem) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return parameters;
    return parameters.filter(
      (p) =>
        p.symbol.toLowerCase().includes(s) || p.name.toLowerCase().includes(s),
    );
  }, [q, parameters]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    setSel(0);
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSel((s) => Math.min(results.length - 1, s + 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const p = results[sel];
        if (p) onPick(p);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [results, sel, onPick, onClose]);

  return createPortal(
    <div
      className="qf-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Find a parameter"
    >
      <div className="qf-panel" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="qf-input"
          type="text"
          placeholder="Find a parameter — e.g. Rz, kurtosis…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search parameters"
        />
        <ul className="qf-list">
          {results.length === 0 && <li className="qf-empty">No match</li>}
          {results.map((p, i) => (
            <li key={p.symbol}>
              <button
                type="button"
                className={`qf-item${i === sel ? " sel" : ""}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => onPick(p)}
              >
                <span className="qf-sym">{p.symbol}</span>
                <span className="qf-name">{p.name}</span>
                <span className="qf-cat">{p.category.replace("-", " ")}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
