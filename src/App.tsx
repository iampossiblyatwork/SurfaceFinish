import { useEffect, useState } from "react";
import { UnitsProvider } from "./context/UnitsContext";
import { UnitsToggle } from "./components/UnitsToggle";
import { ParameterDictionary } from "./components/ParameterDictionary";
import { FinishGallery } from "./components/FinishGallery";
import { Generator } from "./components/Generator";
import { CompareView } from "./components/CompareView";
import { api, type FinishSummary, type ParameterDef } from "./api/client";
import type { Finish } from "./data/finishes";

type View = "parameters" | "finishes" | "generator" | "compare";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "parameters", label: "Parameters", icon: "∿" },
  { id: "finishes", label: "Finishes", icon: "▦" },
  { id: "generator", label: "Generator", icon: "↻" },
  { id: "compare", label: "Compare", icon: "⇄" },
];

export default function App() {
  const [view, setView] = useState<View>("parameters");
  const [generatorFinishId, setGeneratorFinishId] = useState<string | undefined>(undefined);
  const [finishes, setFinishes] = useState<FinishSummary[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [parameters, setParameters] = useState<ParameterDef[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  // Load finishes + parameters once on mount
  useEffect(() => {
    Promise.all([api.finishes(), api.parameters()])
      .then(([fp, pp]) => {
        setFinishes(fp.finishes as unknown as FinishSummary[]);
        setFamilies(fp.families);
        setParameters(pp.parameters as unknown as ParameterDef[]);
      })
      .catch((err: Error) => setDataError(err.message));
  }, []);

  const openInGenerator = (finishId: string) => {
    setGeneratorFinishId(finishId);
    setView("generator");
  };

  if (dataError) {
    return (
      <div className="app-error">
        <p>Could not connect to the API: {dataError}</p>
        <p>Make sure the backend is running on port 8000.</p>
      </div>
    );
  }

  return (
    <UnitsProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-title">
            <span className="app-title-main">Surface Finish</span>
            <span className="app-title-sub">Pocket Dictionary</span>
          </div>
          <UnitsToggle />
        </header>

        <main className="app-main">
          {view === "parameters" && (
            <ParameterDictionary parameters={parameters} finishes={finishes} />
          )}
          {view === "finishes" && (
            <FinishGallery
              finishes={finishes as unknown as Finish[]}
              families={families}
              onOpen={openInGenerator}
            />
          )}
          {view === "generator" && (
            <Generator
              key={generatorFinishId ?? "default"}
              initialFinishId={generatorFinishId}
              finishes={finishes}
            />
          )}
          {view === "compare" && <CompareView finishes={finishes} />}
        </main>

        <nav className="app-nav" aria-label="Sections">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              className={view === n.id ? "nav-btn active" : "nav-btn"}
              aria-current={view === n.id}
              onClick={() => setView(n.id)}
            >
              <span className="nav-icon" aria-hidden>
                {n.icon}
              </span>
              <span className="nav-label">{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </UnitsProvider>
  );
}
