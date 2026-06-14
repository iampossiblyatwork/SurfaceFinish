import { useMemo, useState } from "react";
import { FinishCard } from "./FinishCard";
import { FINISHES, FINISH_FAMILIES } from "../data/finishes";

type SortKey = "ra-asc" | "ra-desc" | "name";

interface FinishGalleryProps {
  onOpen: (finishId: string) => void;
}

/** Browsable grid of manufacturing finishes with family filter and sort. */
export function FinishGallery({ onOpen }: FinishGalleryProps) {
  const [family, setFamily] = useState<string>("all");
  const [sort, setSort] = useState<SortKey>("ra-asc");

  const finishes = useMemo(() => {
    const filtered =
      family === "all"
        ? FINISHES
        : FINISHES.filter((f) => f.family === family);
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "name") return a.process.localeCompare(b.process);
      if (sort === "ra-desc") return b.defaultRa - a.defaultRa;
      return a.defaultRa - b.defaultRa;
    });
    return sorted;
  }, [family, sort]);

  return (
    <section className="view">
      <p className="view-intro">
        Common manufacturing processes and the surface finish each produces.
        Tap a card to open it in the generator.
      </p>

      <div className="gallery-controls">
        <label className="field inline">
          <span className="field-label">Family</span>
          <select value={family} onChange={(e) => setFamily(e.target.value)}>
            <option value="all">All</option>
            {FINISH_FAMILIES.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <label className="field inline">
          <span className="field-label">Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="ra-asc">Smoothest first</option>
            <option value="ra-desc">Roughest first</option>
            <option value="name">Name (A–Z)</option>
          </select>
        </label>
      </div>

      <div className="finish-grid">
        {finishes.map((f) => (
          <FinishCard key={f.id} finish={f} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}
