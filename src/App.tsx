import { useEffect, useState } from "react";
import { UnitsProvider } from "./context/UnitsContext";
import { UnitsToggle } from "./components/UnitsToggle";
import { Drawer } from "./components/Drawer";
import { ParameterDictionary } from "./components/ParameterDictionary";
import { FinishGallery } from "./components/FinishGallery";
import { Generator } from "./components/Generator";
import { CompareView } from "./components/CompareView";
import { ProcessComparison } from "./components/ProcessComparison";
import { QuickFind } from "./components/QuickFind";
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
import {
  pageForCategory,
  pageLabel,
  parseHash,
  routeToHash,
} from "./data/navigation";
import type { ParameterCategory } from "./data/parameters";
import { api, type FinishSummary, type ParameterDef } from "./api/client";
import type { Finish } from "./data/finishes";

export default function App() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [generatorFinishId, setGeneratorFinishId] = useState<string | undefined>(undefined);
  const [finishes, setFinishes] = useState<FinishSummary[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [parameters, setParameters] = useState<ParameterDef[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  const page = route.page;

  useEffect(() => {
    Promise.all([api.finishes(), api.parameters()])
      .then(([fp, pp]) => {
        setFinishes(fp.finishes as unknown as FinishSummary[]);
        setFamilies(fp.families);
        setParameters(pp.parameters as unknown as ParameterDef[]);
      })
      .catch((err: Error) => setDataError(err.message));
  }, []);

  // The location hash is the source of truth: refresh keeps your place, the
  // back button works, and pages/parameters are deep-linkable.
  useEffect(() => {
    const onHash = () => {
      const r = parseHash(window.location.hash);
      setRoute(r);
      if (!r.anchor) window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // "/" opens the parameter finder from anywhere (unless you're typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault();
      setFindOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const navigate = (pageId: string, anchor?: string) => {
    const target = routeToHash(pageId, anchor);
    setDrawerOpen(false);
    if (`#${target}` === window.location.hash) {
      setRoute({ page: pageId, anchor }); // no hashchange will fire
    } else {
      window.location.hash = target;
    }
    if (!anchor) window.scrollTo({ top: 0 });
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
        return <RealWorld onNavigate={navigate} />;
      case "filt-cutoffs":
        return <FilteringCutoffs onNavigate={navigate} />;
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
            focusSymbol={route.anchor}
            intro="Amplitude parameters measure how far the profile's data points sit from the mean line. Ra is the workhorse; the rest describe peaks, valleys, and distribution shape."
          />
        );
      case "prof-spacing":
        return (
          <ParameterDictionary
            parameters={parameters}
            finishes={finishes}
            category="spacing"
            focusSymbol={route.anchor}
            intro="Spacing parameters look at wavelengths along the surface rather than heights. RSm — mean element width — is the key one, useful for feed rates and filter selection."
          />
        );
      case "prof-hybrid":
        return (
          <ParameterDictionary
            parameters={parameters}
            finishes={finishes}
            category="hybrid"
            focusSymbol={route.anchor}
            intro="Hybrid parameters combine height and spacing. The slope parameters RΔa and RΔq (in degrees) describe how steeply the surface rises and falls."
          />
        );
      case "prof-material":
        return (
          <ParameterDictionary
            parameters={parameters}
            finishes={finishes}
            category="material-ratio"
            focusSymbol={route.anchor}
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
        return <Callouts onNavigate={navigate} />;
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
          <div className="app-header-right">
            <button
              type="button"
              className="header-find"
              aria-label="Find a parameter"
              onClick={() => setFindOpen(true)}
            >
              <span aria-hidden>⌕</span>
              <span className="header-find-text">Find</span>
            </button>
            <UnitsToggle />
          </div>
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

        {findOpen && (
          <QuickFind
            parameters={parameters}
            onClose={() => setFindOpen(false)}
            onPick={(p) => {
              setFindOpen(false);
              navigate(
                pageForCategory(p.category as ParameterCategory),
                p.symbol,
              );
            }}
          />
        )}
      </div>
    </UnitsProvider>
  );
}
