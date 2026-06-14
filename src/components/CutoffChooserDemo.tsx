import { useEffect, useMemo, useRef, useState } from "react";
import { makeProfile, highpass, ra } from "../lib/signal";
import { useUnits } from "../context/UnitsContext";
import { formatLength, formatLateral, unitLabel } from "../lib/grades";

function cssVar(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

const BANDS = [
  { raLo: 0.006, raHi: 0.02, lc: 0.08 },
  { raLo: 0.02, raHi: 0.1, lc: 0.25 },
  { raLo: 0.1, raHi: 2, lc: 0.8 },
  { raLo: 2, raHi: 10, lc: 2.5 },
  { raLo: 10, raHi: 80, lc: 8 },
];

const PRESETS = [0.08, 0.25, 0.8, 2.5];
const LMIN = Math.log10(0.08);
const LMAX = Math.log10(2.5);

function recommend(raVal: number) {
  return BANDS.find((b) => raVal > b.raLo && raVal <= b.raHi) ?? BANDS[2];
}

export function CutoffChooserDemo() {
  const { unit } = useUnits();
  const [cutoff, setCutoff] = useState(0.8);
  const profile = useMemo(() => makeProfile(700, 5), []);
  const rough = useMemo(
    () => highpass(profile.z, profile.dx, cutoff),
    [profile, cutoff],
  );
  const raVal = ra(rough);
  const rec = recommend(raVal);
  const matches = Math.abs(rec.lc - cutoff) < 0.02;

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
      <div ref={wrapRef} className="filter-demo-canvas">
        <canvas ref={canvasRef} role="img" aria-label="Roughness profile at the chosen cutoff" />
      </div>

      <div className="filter-demo-readout">
        <div>
          <span className="fd-label">Measured at λc</span>
          <span className="fd-value">{formatLateral(cutoff, unit)}</span>
        </div>
        <div>
          <span className="fd-label">Resulting Ra</span>
          <span className="fd-value">{formatLength(raVal, unit)}</span>
        </div>
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
      <div className="filter-demo-presets">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            className={Math.abs(p - cutoff) < 0.005 ? "active" : ""}
            onClick={() => setCutoff(p)}
          >
            {formatLateral(p, unit)}
          </button>
        ))}
      </div>

      <div className={`chooser-verdict${matches ? " ok" : " warn"}`}>
        {matches ? (
          <>
            Ra {formatLength(raVal, unit)} falls in the band whose recommended
            cutoff is <strong>{formatLateral(rec.lc, unit)}</strong> — your cutoff matches. ✓
          </>
        ) : (
          <>
            Ra {formatLength(raVal, unit)} falls in the band whose recommended
            cutoff is <strong>{formatLateral(rec.lc, unit)}</strong>, not {formatLateral(cutoff, unit)}.
            Re-evaluate at {formatLateral(rec.lc, unit)}.
          </>
        )}
      </div>

      <table className="lesson-table chooser-table">
        <thead>
          <tr><th>Ra band ({unitLabel(unit)})</th><th>Recommended λc ({unit === "uin" ? "in" : "mm"})</th></tr>
        </thead>
        <tbody>
          {BANDS.map((b) => (
            <tr key={b.lc} className={b === rec ? "row-active" : ""}>
              <td>{formatLength(b.raLo, unit)} – {formatLength(b.raHi, unit)}</td>
              <td>{formatLateral(b.lc, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
