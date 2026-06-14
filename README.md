# Surface Finish — Pocket Dictionary

A mobile-first, educational, interactive reference for machined surface finishes.
Browse standard roughness parameters and common manufacturing processes, and use
an interactive generator to see how a surface trace and its parameters change
with roughness.

Because measured profilometer traces are hard to source, the app **synthesizes**
realistic traces from random noise plus process-characteristic feed marks, then
scales each trace so its measured **Ra** exactly matches the chosen target.

## Features

- **Parameters dictionary** — every standard 2D (profile) roughness parameter
  (Ra, Rq, Rz, Rt, Rp, Rv, Rc, Rsk, Rku, RSm, RΔq, and the material-ratio /
  Abbott–Firestone curve) with plain-language meaning, formula, and a **live
  value** computed from a reference trace you can change.
- **Finishes dictionary** — common processes (lapping, polishing, honing,
  grinding, turning, boring, milling, drilling, reaming, shaping, EDM, sawing,
  sand casting, flame/plasma cutting) with a representative trace, typical Ra
  range, and ISO 1302 N-grade.
- **Interactive generator** — pick a process, drag the Ra slider, regenerate a
  new random surface at the same Ra, and watch every parameter update live.
- **Compare** — two finishes side by side with a lined-up parameter table.
- **Global µm ⇄ µin switch** — flip units anywhere; the choice persists.

## Tech

React + TypeScript + Vite. Traces are drawn directly on an HTML `<canvas>`
(no charting dependency). The roughness math (`src/lib/`) is pure and unit-tested
with Vitest.

## Standards

2D profile parameters follow ISO 4287 / ISO 21920-2 and ASME B46.1; grades follow
ISO 1302. The data model already carries a `dimension` field so 3D / areal
(ISO 25178 S-) parameters can be added later.

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the math test suite
npm run build    # type-check + production build
npm run preview  # serve the production build
```

## Project layout

- `src/lib/` — noise, trace generation, roughness math, grades/units (pure logic)
- `src/data/` — parameter catalog and finish/process dictionary
- `src/components/` — UI (canvas trace, generator/panel, dictionaries, compare)
- `src/hooks/`, `src/context/` — trace state and the units toggle

## Roadmap

- 3D / areal (S-) parameters with a heightmap generator and surface renderer.
- Analyzer: import measured profile/areal data (CSV) and run it through the same
  roughness engine.
