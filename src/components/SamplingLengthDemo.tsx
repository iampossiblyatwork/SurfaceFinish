import { useEffect, useMemo, useRef, useState } from "react";
import { makeProfile, highpass } from "../lib/signal";
import { useUnits } from "../context/UnitsContext";
import { formatLateral } from "../lib/grades";

function cssVar(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

const LMIN = Math.log10(0.08);
const LMAX = Math.log10(1.0);

/**
 * Shows a roughness trace with the sampling lengths (each = λc) marked, and the
 * 5-sampling-length evaluation window highlighted. Moving the cutoff resizes the
 * bands so the relationship is obvious.
 */
export function SamplingLengthDemo() {
  const { unit } = useUnits();
  const [cutoff, setCutoff] = useState(0.25);
  const profile = useMemo(() => makeProfile(700, 5), []);
  const rough = useMemo(
    () => highpass(profile.z, profile.dx, cutoff),
    [profile, cutoff],
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const evalLen = 5 * cutoff;
  const fitsEval = evalLen <= profile.lengthMm;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth || 320;
      const cssH = 170;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = cssVar("--surface-2", "#0c1219");
      const accent = cssVar("--accent", "#5fb0ff");
      const muted = cssVar("--muted", "#7d8c9a");
      const grid = cssVar("--grid", "#1c2733");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);

      const pad = 8;
      const plotW = cssW - pad * 2;
      const plotH = cssH - pad * 2;
      const mid = pad + plotH / 2;
      const mmToX = (mm: number) => pad + (plotW * mm) / profile.lengthMm;

      // Sampling-length bands (alternating shade); first 5 = evaluation length.
      const nBands = Math.floor(profile.lengthMm / cutoff);
      for (let b = 0; b < nBands; b++) {
        const x0 = mmToX(b * cutoff);
        const x1 = mmToX(Math.min((b + 1) * cutoff, profile.lengthMm));
        if (b < 5) {
          ctx.fillStyle =
            b % 2 === 0 ? "rgba(95,176,255,0.12)" : "rgba(95,176,255,0.05)";
        } else {
          ctx.fillStyle = b % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent";
        }
        ctx.fillRect(x0, pad, x1 - x0, plotH);
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, pad);
        ctx.lineTo(x0, pad + plotH);
        ctx.stroke();
      }

      // Evaluation-length bracket (first 5 bands).
      const evalX1 = mmToX(Math.min(evalLen, profile.lengthMm));
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mmToX(0), pad + 2);
      ctx.lineTo(evalX1, pad + 2);
      ctx.stroke();

      // mean line + trace
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, mid);
      ctx.lineTo(pad + plotW, mid);
      ctx.stroke();

      let maxAbs = 0;
      for (const v of rough) maxAbs = Math.max(maxAbs, Math.abs(v));
      if (maxAbs === 0) maxAbs = 1;
      const scale = (plotH / 2 - 6) / (maxAbs * 1.1);
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

      ctx.fillStyle = muted;
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillText("each band = 1 sampling length (λc)", pad + 2, pad + plotH - 4);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [profile, rough, cutoff, evalLen]);

  return (
    <div className="filter-demo">
      <div ref={wrapRef} className="filter-demo-canvas">
        <canvas ref={canvasRef} role="img" aria-label="Sampling lengths across a roughness trace" />
      </div>
      <div className="filter-demo-readout">
        <div>
          <span className="fd-label">Sampling length (λc)</span>
          <span className="fd-value">{formatLateral(cutoff, unit)}</span>
        </div>
        <div>
          <span className="fd-label">Evaluation length (5×)</span>
          <span className="fd-value">
            {formatLateral(evalLen, unit)}{fitsEval ? "" : " ⚠"}
          </span>
        </div>
      </div>
      <input
        type="range"
        min={LMIN}
        max={LMAX}
        step={0.001}
        value={Math.log10(cutoff)}
        onChange={(e) => setCutoff(Math.pow(10, Number(e.target.value)))}
        aria-label="Cutoff / sampling length"
      />
      <p className="filter-demo-caption">
        One sampling length equals one cutoff; the standard evaluation length is
        five of them (highlighted). Averaging over five sampling lengths is what
        makes Ra so stable.
        {!fitsEval && " At this cutoff, five sampling lengths exceed the 5 mm trace shown."}
      </p>
    </div>
  );
}
