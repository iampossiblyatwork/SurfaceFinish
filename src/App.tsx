import { useState } from "react";
import { UnitsProvider } from "./context/UnitsContext";
import { UnitsToggle } from "./components/UnitsToggle";
import { ParameterDictionary } from "./components/ParameterDictionary";
import { FinishGallery } from "./components/FinishGallery";
import { Generator } from "./components/Generator";
import { CompareView } from "./components/CompareView";

type View = "parameters" | "finishes" | "generator" | "compare";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "parameters", label: "Parameters", icon: "∿" },
  { id: "finishes", label: "Finishes", icon: "▦" },
  { id: "generator", label: "Generator", icon: "↻" },
  { id: "compare", label: "Compare", icon: "⇄" },
];

export default function App() {
  const [view, setView] = useState<View>("parameters");
  const [generatorFinishId, setGeneratorFinishId] = useState<string | undefined>(
    undefined,
  );

  const openInGenerator = (finishId: string) => {
    setGeneratorFinishId(finishId);
    setView("generator");
  };

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
          {view === "parameters" && <ParameterDictionary />}
          {view === "finishes" && <FinishGallery onOpen={openInGenerator} />}
          {view === "generator" && (
            <Generator
              key={generatorFinishId ?? "default"}
              initialFinishId={generatorFinishId}
            />
          )}
          {view === "compare" && <CompareView />}
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
