import { useEffect, useMemo, useRef, useState } from "react";
import {
  makeProfile,
  gaussianLowpass,
  highpass,
  ra,
  lowpassTransmission,
} from "../lib/signal";
import { useUnits } from "../context/UnitsContext";
import { formatLength, formatLateral } from "../lib/grades";

const PRESETS = [0.08, 0.25, 0.8, 2.5];
const LMIN = Math.log10(0.08);
const LMAX = Math.log10(2.5);

function cssVar(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function GaussianFilterDemo() {
  const { unit } = useUnits();
  const [cutoff, setCutoff] = useState(0.8);

  const profile = useMemo(() => makeProfile(700, 5), []);
  const waviness = useMemo(
    () => gaussianLowpass(profile.z, profile.dx, cutoff),
    [profile, cutoff],
  );
  const roughness = useMemo(
    () => highpass(profile.z, profile.dx, cutoff),
    [profile, cutoff],
  );
  const roughnessRa = ra(roughness);

  const mainRef = useRef<HTMLCanvasElement>(null);
  const transRef = useRef<HTMLCanvasElement>(null);
  const mainWrap = useRef<HTMLDivElement>(null);
  const transWrap = useRef<HTMLDivElement>(null);

  // --- Main split plot: primary + waviness (top), roughness (bottom) ---
  useEffect(() => {
    const canvas = mainRef.current;
    const wrap = mainWrap.current;
    if (!canvas || !wrap) return;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth || 320;
      const cssH = 260;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = cssVar("--surface-2", "#0c1219");
      const grid = cssVar("--grid", "#1c2733");
      const accent = cssVar("--accent", "#5fb0ff");
      const good = cssVar("--good", "#5fd0a0");
      const muted = cssVar("--muted", "#7d8c9a");
      const faint = cssVar("--border", "#243140");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);

      const n = profile.z.length;
      const pad = 8;
      const plotW = cssW - pad * 2;
      const panelH = (cssH - pad * 3) / 2;
      const topMid = pad + panelH / 2;
      const botMid = pad * 2 + panelH + panelH / 2;

      // Shared honest scale based on the primary profile.
      let maxAbs = 0;
      for (const v of profile.z) maxAbs = Math.max(maxAbs, Math.abs(v));
      if (maxAbs === 0) maxAbs = 1;
      const scale = (panelH / 2 - 4) / (maxAbs * 1.05);

      const series = (
        z: number[],
        mid: number,
        color: string,
        width: number,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = pad + (plotW * i) / (n - 1);
          const y = mid - z[i] * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      // mean lines
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, topMid); ctx.lineTo(pad + plotW, topMid);
      ctx.moveTo(pad, botMid); ctx.lineTo(pad + plotW, botMid);
      ctx.stroke();

      // top: primary faint + waviness bold
      series(profile.z, topMid, faint, 1);
      series(waviness, topMid, accent, 2);

      // bottom: roughness
      series(roughness, botMid, good, 1.4);

      // labels
      ctx.fillStyle = muted;
      ctx.font = "11px system-ui, sans-serif";
      ctx.fillText("Primary profile (faint) + waviness / mean line", pad + 2, pad + 11);
      ctx.fillText("Roughness profile — what passes the filter", pad + 2, pad * 2 + panelH + 11);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [profile, waviness, roughness]);

  // --- Transmission curve ---
  useEffect(() => {
    const canvas = transRef.current;
    const wrap = transWrap.current;
    if (!canvas || !wrap) return;
    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth || 320;
      const cssH = 140;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const bg = cssVar("--surface-2", "#0c1219");
      const grid = cssVar("--grid", "#1c2733");
      const accent = cssVar("--accent", "#5fb0ff");
      const good = cssVar("--good", "#5fd0a0");
      const muted = cssVar("--muted", "#7d8c9a");

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);

      const padL = 30;
      const padR = 8;
      const padT = 8;
      const padB = 20;
      const plotW = cssW - padL - padR;
      const plotH = cssH - padT - padB;

      // wavelength domain: λc/12 .. λc*12 (log)
      const lo = Math.log10(cutoff / 12);
      const hi = Math.log10(cutoff * 12);
      const xOf = (logL: number) => padL + (plotW * (logL - lo)) / (hi - lo);
      const yOf = (t: number) => padT + plotH * (1 - t);

      // 50% line
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, yOf(0.5)); ctx.lineTo(padL + plotW, yOf(0.5));
      ctx.stroke();
      ctx.fillStyle = muted;
      ctx.font = "10px system-ui, sans-serif";
      ctx.fillText("50%", 4, yOf(0.5) + 3);
      ctx.fillText("0", 16, yOf(0) + 3);
      ctx.fillText("100%", 2, yOf(1) + 7);

      // cutoff marker
      const xc = xOf(Math.log10(cutoff));
      ctx.strokeStyle = muted;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(xc, padT); ctx.lineTo(xc, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = muted;
      ctx.fillText("λc", xc - 6, padT + plotH + 14);

      const curve = (fn: (lam: number) => number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        const steps = 120;
        for (let i = 0; i <= steps; i++) {
          const logL = lo + ((hi - lo) * i) / steps;
          const lam = Math.pow(10, logL);
          const x = xOf(logL);
          const y = yOf(fn(lam));
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      curve((lam) => lowpassTransmission(lam, cutoff), accent); // waviness kept
      curve((lam) => 1 - lowpassTransmission(lam, cutoff), good); // roughness kept

      ctx.fillStyle = muted;
      ctx.fillText("short λ (roughness) ← wavelength → long λ (waviness)", padL, cssH - 4);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [cutoff]);

  return (
    <div className="filter-demo">
      <div ref={mainWrap} className="filter-demo-canvas">
        <canvas ref={mainRef} role="img" aria-label="Primary profile split into waviness and roughness" />
      </div>

      <div className="filter-demo-readout">
        <div>
          <span className="fd-label">Cutoff λc</span>
          <span className="fd-value">{formatLateral(cutoff, unit)}</span>
        </div>
        <div>
          <span className="fd-label">Roughness Ra</span>
          <span className="fd-value">{formatLength(roughnessRa, unit)}</span>
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

      <p className="filter-demo-caption">
        Drag the cutoff. Everything <em>longer</em> than λc goes to waviness (blue
        mean line); everything <em>shorter</em> becomes roughness (green). A small
        cutoff leaves almost everything as waviness; a large cutoff sweeps more of
        the surface into roughness.
      </p>

      <div ref={transWrap} className="filter-demo-canvas trans">
        <canvas ref={transRef} role="img" aria-label="Gaussian filter transmission curves" />
      </div>
      <p className="filter-demo-caption">
        Transmission: each wave's amplitude is split between roughness (green) and
        waviness (blue). The two always cross at <strong>50%</strong>, exactly at λc.
      </p>
    </div>
  );
}
