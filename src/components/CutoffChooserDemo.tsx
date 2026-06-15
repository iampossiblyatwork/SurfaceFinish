import { useEffect, useMemo, useRef, useState } from "react";
import { makeProfile, highpass, ra, rsm } from "../lib/signal";
import { useUnits } from "../context/UnitsContext";
import { formatLength, formatLateral, unitLabel } from "../lib/grades";

function cssVar(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

type Mode = "nonperiodic" | "periodic";

interface Band {
  lo: number;
  hi: number;
  lc: number;
}

// ISO 4288 selection tables. Non-periodic selects by Ra (µm); periodic by
// RSm (mm). Both map a measured-value band to a recommended cutoff λc (mm).
const RA_BANDS: Band[] = [
  { lo: 0.006, hi: 0.02, lc: 0.08 },
  { lo: 0.02, hi: 0.1, lc: 0.25 },
  { lo: 0.1, hi: 2, lc: 0.8 },
  { lo: 2, hi: 10, lc: 2.5 },
  { lo: 10, hi: 80, lc: 8 },
];
const SM_BANDS: Band[] = [
  { lo: 0.013, hi: 0.04, lc: 0.08 },
  { lo: 0.04, hi: 0.13, lc: 0.25 },
  { lo: 0.13, hi: 0.4, lc: 0.8 },
  { lo: 0.4, hi: 1.3, lc: 2.5 },
  { lo: 1.3, hi: 4, lc: 8 },
];

const STD = [0.08, 0.25, 0.8, 2.5, 8];
const LMIN = Math.log10(0.08);
const LMAX = Math.log10(8);

function recommend(bands: Band[], v: number): Band {
  for (const b of bands) if (v > b.lo && v <= b.hi) return b;
  return v <= bands[0].lo ? bands[0] : bands[bands.length - 1];
}

/** Snap to the adjacent standard cutoff in the given direction (+1 up, −1 down). */
function nextStd(cutoff: number, dir: number): number {
  let idx = 0;
  let best = Infinity;
  STD.forEach((s, i) => {
    const d = Math.abs(Math.log(s / cutoff));
    if (d < best) {
      best = d;
      idx = i;
    }
  });
  return STD[Math.max(0, Math.min(STD.length - 1, idx + dir))];
}

export function CutoffChooserDemo() {
  const { unit } = useUnits();
  const [mode, setMode] = useState<Mode>("nonperiodic");
  // Start deliberately too coarse so the iterate-down procedure is visible.
  const [cutoff, setCutoff] = useState(2.5);
  const profile = useMemo(() => makeProfile(700, 5), []);
  const rough = useMemo(
    () => highpass(profile.z, profile.dx, cutoff),
    [profile, cutoff],
  );

  const raVal = ra(rough);
  const smVal = rsm(rough, profile.dx);
  const bands = mode === "nonperiodic" ? RA_BANDS : SM_BANDS;
  const driving = mode === "nonperiodic" ? raVal : smVal;
  const rec = recommend(bands, driving);
  const matches = Math.abs(rec.lc - cutoff) < 0.02;
  const direction = rec.lc > cutoff ? "up" : "down";

  const drivingLabel = mode === "nonperiodic" ? "Ra" : "RSm";
  const drivingText =
    mode === "nonperiodic"
      ? formatLength(raVal, unit)
      : formatLateral(smVal, unit);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth || 320;
      const cssH = 130;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = cssVar("--surface-2", "#0c1219");
      const accent = cssVar("--accent", "#5fb0ff");
      const grid = cssVar("--grid", "#1c2733");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);

      const pad = 8;
      const plotW = cssW - pad * 2;
      const plotH = cssH - pad * 2;
      const mid = pad + plotH / 2;
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, mid);
      ctx.lineTo(pad + plotW, mid);
      ctx.stroke();

      let maxAbs = 0;
      for (const v of rough) maxAbs = Math.max(maxAbs, Math.abs(v));
      if (maxAbs === 0) maxAbs = 1;
      const scale = (plotH / 2 - 4) / (maxAbs * 1.1);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.3;
      ctx.lineJoin = "round";
      ctx.beginPath();
      const n = rough.length;
      for (let i = 0; i < n; i++) {
        const x = pad + (plotW * i) / (n - 1);
        const y = mid - rough[i] * scale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [rough]);

  return (
    <div className="filter-demo">
      <div className="filter-demo-presets chooser-mode">
        <button
          type="button"
          className={mode === "nonperiodic" ? "active" : ""}
          onClick={() => setMode("nonperiodic")}
        >
          Non-periodic · select by Ra (grinding)
        </button>
        <button
          type="button"
          className={mode === "periodic" ? "active" : ""}
          onClick={() => setMode("periodic")}
        >
          Periodic · select by RSm (turning)
        </button>
      </div>

      <div ref={wrapRef} className="filter-demo-canvas">
        <canvas ref={canvasRef} role="img" aria-label="Roughness profile at the chosen cutoff" />
      </div>

      <div className="filter-demo-readout">
        <div>
          <span className="fd-label">Filter λc</span>
          <span className="fd-value">{formatLateral(cutoff, unit)}</span>
        </div>
        <div>
          <span className="fd-label">Resulting {drivingLabel}</span>
          <span className="fd-value">{drivingText}</span>
        </div>
      </div>

      <div className="chooser-steps">
        <button
          type="button"
          onClick={() => setCutoff((c) => nextStd(c, -1))}
          disabled={cutoff <= STD[0] + 1e-9}
        >
          ← Step down
        </button>
        <span className="chooser-cur">λc {formatLateral(cutoff, unit)}</span>
        <button
          type="button"
          onClick={() => setCutoff((c) => nextStd(c, +1))}
          disabled={cutoff >= STD[STD.length - 1] - 1e-9}
        >
          Step up →
        </button>
      </div>

      <input
        type="range"
        min={LMIN}
        max={LMAX}
        step={0.001}
        value={Math.log10(cutoff)}
        onChange={(e) => setCutoff(Math.pow(10, Number(e.target.value)))}
        aria-label="Cutoff wavelength"
      />

      <div className={`chooser-verdict${matches ? " ok" : " warn"}`}>
        {matches ? (
          <>
            ✓ {drivingLabel} {drivingText} lands in the band for λc{" "}
            <strong>{formatLateral(cutoff, unit)}</strong> — this is an
            appropriate filter for this trace.
          </>
        ) : (
          <>
            {drivingLabel} {drivingText} sits {direction === "up" ? "above" : "below"}{" "}
            this filter's band, which recommends λc{" "}
            <strong>{formatLateral(rec.lc, unit)}</strong>.{" "}
            {direction === "up" ? "Step up" : "Step down"} and re-evaluate.
          </>
        )}
      </div>

      <table className="lesson-table chooser-table">
        <thead>
          <tr>
            <th>
              {drivingLabel} band ({mode === "nonperiodic" ? unitLabel(unit) : unit === "uin" ? "in" : "mm"})
            </th>
            <th>Recommended λc ({unit === "uin" ? "in" : "mm"})</th>
          </tr>
        </thead>
        <tbody>
          {bands.map((b) => (
            <tr key={b.lc} className={b === rec ? "row-active" : ""}>
              <td>
                {mode === "nonperiodic"
                  ? `${formatLength(b.lo, unit)} – ${formatLength(b.hi, unit)}`
                  : `${formatLateral(b.lo, unit)} – ${formatLateral(b.hi, unit)}`}
              </td>
              <td>{formatLateral(b.lc, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
