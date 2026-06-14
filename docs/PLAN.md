# Pocket Surface Finish Dictionary — Educational & Interactive Web App

## Context

The user wants a **pocket surface finish dictionary** — a mobile-first, booklet-style
reference and lookup tool you'd flip through on a phone. It must be **educational and
interactive** and **cover all the standard surface-texture parameters**, not just Ra.
Because measured profilometer traces are hard to source, the app **synthesizes realistic
traces** from random noise scaled to a target roughness, spanning a range of Ra values /
smoothness levels.

It should be **architected to grow** in two confirmed future directions: (1) **3D / areal
(S-) parameters**, not just 2D profile (R-) parameters, and (2) an **analyzer** that
accepts real measurement data and computes parameters. v1 ships the 2D pocket reference +
interactive generator; the data model and code structure must leave clean seams for both.

The repository is a blank slate (one-line `README.md`); everything is greenfield. Work
happens on branch `claude/surface-finish-dictionary-app-babqs1`.

**Confirmed decisions:**
- **Form factor:** pocket / **mobile-first**, booklet feel, fast lookup.
- **Trace generation:** process-aware — periodic feed-mark component + filtered random
  noise, scaled to hit a target Ra.
- **Organization:** by manufacturing process, tagged with typical Ra range + ISO N-grade;
  filter/sort by Ra or grade. Plus a first-class **parameters glossary**.
- **Interactivity:** browse the dictionary **plus** an interactive generator (Ra slider,
  regenerate, live-computed full parameter suite, side-by-side compare).
- **Stack:** React + Vite + TypeScript, traces drawn on HTML `<canvas>`.

## Goal

A static-deployable, mobile-first SPA with three pillars:
1. **Parameters dictionary** — every standard 2D roughness parameter explained
   (definition, formula, what it tells you), each with a live value computed from the
   current trace.
2. **Finishes dictionary** — manufacturing processes, each with a synthesized trace,
   typical Ra range, and ISO grade.
3. **Interactive generator** — adjust Ra, regenerate, compare; the full parameter suite
   updates live so users learn how parameters respond to surface changes.

## Approach

### 1. Project scaffold
- Vite React + TypeScript at repo root (`package.json`, `vite.config.ts`, `tsconfig.json`,
  `index.html`, `src/main.tsx`, `src/App.tsx`), `.gitignore`, Vitest for the math.
- Minimal deps — draw traces directly on canvas (no charting lib). Mobile-first responsive
  CSS; viewport meta; touch-friendly controls; later PWA-ready (manifest) so it works as a
  true "pocket" tool.

### 2. Trace-generation engine — `src/lib/` (pure, unit-testable)
- **`noise.ts`** — seeded PRNG (`mulberry32`) + Gaussian (Box–Muller); seed drives
  deterministic "regenerate".
- **`profile.ts`** — `generateProfile(params)` → `number[]`: periodic feed-mark sinusoid
  (process-weighted) + band-limited Gaussian noise (moving-average/low-pass) + optional
  sparse spikes (EDM, casting); detrend (remove mean/linear form); **scale by
  `targetRa / measuredRa`** so Ra matches exactly.
- **`roughness.ts`** — compute the **full standard 2D parameter suite** from a profile
  (after mean-line removal), grouped:
  - **Amplitude:** Ra, Rq (RMS), Rz, Rt, Rp, Rv, Rsk (skewness), Rku (kurtosis), Rc.
  - **Spacing:** RSm (mean profile element width).
  - **Hybrid:** RΔq (RMS slope).
  - **Material ratio:** Rmr(c) curve / Abbott–Firestone support.
  Return a typed `RoughnessParameters` object consumed by the readout and scaling.
- **`grades.ts`** — ISO 1302 N-grade table (N1=0.025µm … N12=50µm), Ra→nearest-grade,
  and µm⇄µin conversion (1 µm = 39.37 µin).

Parameters follow the governing standards: **ISO 4287 / ISO 21920** and **ASME B46.1**
for 2D profile R-parameters, and **ISO 25178** for the future 3D areal S-parameters.

### Global units toggle (µm ⇄ µin)
A single **app-wide micron/microinch flip switch** (React context, persisted to
`localStorage`) so every displayed value — parameter readouts, Ra ranges, slider, axis
labels — converts consistently in one place. Internals stay in µm; conversion happens at
render via `grades.ts`.

### 3. Reference data — `src/data/`
- **`parameters.ts`** — typed catalog of every standard parameter: symbol, name, category
  (amplitude/spacing/hybrid/material-ratio), unit, **plain-language meaning**, formula
  (as text/MathML-ish string), and a `compute` key linking to `roughness.ts`. This powers
  the educational dictionary. **Designed to also hold S-parameters later** via a
  `dimension: '2D' | '3D'` field (3D entries added in a later phase).
- **`finishes.ts`** — ~12 processes: `{ id, process, description, applications, raMin,
  raMax, defaultRa, gradeRange, genParams }` spanning lapping/polishing (N1–N3) →
  grinding/honing (N3–N6) → turning/boring/reaming (N5–N8) → milling/drilling (N6–N8) →
  shaping/sawing (N7–N10) → EDM (N5–N8) → sand casting / flame cutting (N9–N12). Ra ranges
  and grades from standard machining references.

### 4. UI — `src/components/` (mobile-first, booklet navigation)
- **`TraceCanvas.tsx`** — profile on canvas (height vs distance, mean line, scale, labels);
  responsive/touch-friendly; reused everywhere.
- **`ParameterDictionary.tsx`** + **`ParameterCard.tsx`** — browsable glossary; each card
  shows symbol, meaning, formula, and the **live computed value** for the current trace.
- **`FinishGallery.tsx`** + **`FinishCard.tsx`** — process entries with mini trace, Ra
  range, grade; filter/sort by Ra and grade.
- **`Generator.tsx`** — process picker, **Ra slider** (clamped to process range),
  **Regenerate**, µm/µin toggle, and a live readout of the **full parameter suite**.
- **`CompareView.tsx`** — two finishes/traces side by side.
- **`App.tsx`** — bottom-nav/tab layout (Parameters · Finishes · Generator · Compare)
  suited to a pocket booklet; simple view state, no backend.

### 5. Styling
Mobile-first plain CSS / CSS modules; clean technical look; large tap targets; readable on
a phone in the field.

## Future phases (designed-for, not built in v1)
- **3D / areal S-parameters** (Sa, Sq, Sz, Ssk, Sku, …): `parameters.ts` already carries a
  `dimension` field; add a 2D heightmap generator alongside `profile.ts` and a surface
  renderer.
- **Analyzer**: import measured profile/areal data (CSV) and run it through the same
  `roughness.ts` engine to report parameters. Keeping the engine pure and decoupled from
  generation makes this a drop-in.

## Critical files
- Config: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`
- Lib: `src/lib/noise.ts`, `profile.ts`, `roughness.ts`, `grades.ts`
- Data: `src/data/parameters.ts`, `src/data/finishes.ts`
- Components: `TraceCanvas.tsx`, `ParameterDictionary.tsx`, `ParameterCard.tsx`,
  `FinishGallery.tsx`, `FinishCard.tsx`, `Generator.tsx`, `CompareView.tsx`
- Shell: `src/App.tsx`, `src/main.tsx`, styles
- Tests: `src/lib/roughness.test.ts`

## Verification
1. `npm install` → `npm run dev`; no console errors; **looks/works on a phone-width
   viewport** (responsive, touch nav).
2. **Parameters dictionary:** every standard 2D parameter listed with meaning + formula
   and a live value tied to the current trace.
3. **Finishes:** gallery renders each entry's trace; filter/sort by Ra and grade work;
   turning/milling show visible feed marks, casting looks rough, lapping looks fine.
4. **Generator:** Ra slider visibly changes amplitude and the **live computed Ra matches
   the target** within tolerance; the full parameter suite updates; Regenerate yields a
   new trace at the same Ra; Compare shows two side by side.
5. `npm run test` — Vitest validates `roughness.ts` on known inputs (sine: Ra≈2A/π,
   Rq≈A/√2; skewness≈0; kurtosis≈1.5).
6. `npm run build` — production static build succeeds.
