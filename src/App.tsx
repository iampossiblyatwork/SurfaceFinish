import { useEffect, useState } from "react";
import { UnitsProvider } from "./context/UnitsContext";
import { UnitsToggle } from "./components/UnitsToggle";
import { Drawer } from "./components/Drawer";
import { ParameterDictionary } from "./components/ParameterDictionary";
import { FinishGallery } from "./components/FinishGallery";
import { Generator } from "./components/Generator";
import { CompareView } from "./components/CompareView";
import { ProcessComparison } from "./components/ProcessComparison";
import { Overview, ProcessingChain } from "./content/Fundamentals";
import {
  FilteringCutoffs,
  FilteringFFT,
  FilteringTransmission,
  FilteringChoosing,
} from "./content/Filtering";
import { ThreeD } from "./content/ThreeD";
import { StylusTip } from "./content/StylusTip";
import { Callouts } from "./content/Callouts";
import { RealWorld } from "./content/RealWorld";
import { DEFAULT_PAGE, pageLabel } from "./data/navigation";
import { api, type FinishSummary, type ParameterDef } from "./api/client";
import type { Finish } from "./data/finishes";

export default function App() {
  const [page, setPage] = useState<string>(DEFAULT_PAGE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [generatorFinishId, setGeneratorFinishId] = useState<string | undefined>(undefined);
  const [finishes, setFinishes] = useState<FinishSummary[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [parameters, setParameters] = useState<ParameterDef[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.finishes(), api.parameters()])
      .then(([fp, pp]) => {
        setFinishes(fp.finishes as unknown as FinishSummary[]);
        setFamilies(fp.families);
        setParameters(pp.parameters as unknown as ParameterDef[]);
      })
      .catch((err: Error) => setDataError(err.message));
  }, []);

  const navigate = (pageId: string) => {
    setPage(pageId);
    setDrawerOpen(false);
    window.scrollTo({ top: 0 });
  };

  const openInGenerator = (finishId: string) => {
    setGeneratorFinishId(finishId);
    navigate("tool-generator");
  };

  if (dataError) {
    return (
      <div className="app-error">
        <p>Could not connect to the API: {dataError}</p>
        <p>Make sure the backend is running on port 8000.</p>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case "fund-overview":
        return <Overview onNavigate={navigate} />;
      case "fund-chain":
        return <ProcessingChain />;
      case "realworld":
        return <RealWorld />;
      case "filt-cutoffs":
        return <FilteringCutoffs />;
      case "filt-fft":
        return <FilteringFFT />;
      case "filt-transmission":
        return <FilteringTransmission />;
      case "filt-choosing":
        return <FilteringChoosing />;
      case "prof-amplitude":
        return (
          <ParameterDictionary
            parameters={parameters}
            finishes={finishes}
            category="amplitude"
            intro="Amplitude parameters measure how far the profile's data points sit from the mean line. Ra is the workhorse; the rest describe peaks, valleys, and distribution shape."
          />
        );
      case "prof-spacing":
        return (
          <ParameterDictionary
            parameters={parameters}
            finishes={finishes}
            category="spacing"
            intro="Spacing parameters look at wavelengths along the surface rather than heights. RSm — mean element width — is the key one, useful for feed rates and filter selection."
          />
        );
      case "prof-hybrid":
        return (
          <ParameterDictionary
            parameters={parameters}
            finishes={finishes}
            category="hybrid"
            intro="Hybrid parameters combine height and spacing. The slope parameters RΔa and RΔq (in degrees) describe how steeply the surface rises and falls."
          />
        );
      case "prof-material":
        return (
          <ParameterDictionary
            parameters={parameters}
            finishes={finishes}
            category="material-ratio"
            intro="The material ratio (Abbott–Firestone) curve is the cumulative distribution of the profile's heights — the basis of bearing-area and functional parameters."
          />
        );
      case "threed":
        return <ThreeD />;
      case "stylus":
        return <StylusTip />;
      case "tool-generator":
        return (
          <Generator
            key={generatorFinishId ?? "default"}
            initialFinishId={generatorFinishId}
            finishes={finishes}
            parameters={parameters}
          />
        );
      case "tool-finishes":
        return (
          <FinishGallery
            finishes={finishes as unknown as Finish[]}
            families={families}
            onOpen={openInGenerator}
          />
        );
      case "tool-compare":
        return <CompareView finishes={finishes} />;
      case "tool-chart":
        return <ProcessComparison />;
      case "callouts":
        return <Callouts />;
      default:
        return <Overview />;
    }
  };

  return (
    <UnitsProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-header-left">
            <button
              type="button"
              className="drawer-toggle"
              aria-label="Toggle navigation"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen((o) => !o)}
            >
              ☰
            </button>
            <div className="app-title">
              <span className="app-title-main">Surface Finish</span>
              <span className="app-title-sub">{pageLabel(page) || "Reference"}</span>
            </div>
          </div>
          <UnitsToggle />
        </header>

        <div className="app-body">
          <Drawer
            activePage={page}
            onNavigate={navigate}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />
          <main className="app-main">{renderPage()}</main>
        </div>
      </div>
    </UnitsProvider>
  );
}
