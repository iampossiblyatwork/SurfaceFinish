import { useEffect, useRef } from "react";
import type { Profile } from "../api/client";

/** Which annotation style each parameter uses, keyed by its compute key. */
const VIZ: Record<string, string> = {
  Ra: "area",
  Rq: "area",
  Rp: "peak",
  Rv: "valley",
  Rt: "span",
  Rz: "segments",
  Rc: "segments",
  RSm: "spacing",
  Rsk: "hist",
  Rku: "hist",
  RDq: "slope",
};

const CAPTION: Record<string, string> = {
  area: "Shaded = deviations from the mean line that get averaged.",
  peak: "Marks the highest peak above the mean line.",
  valley: "Marks the deepest valley below the mean line.",
  span: "Total height: highest peak to lowest valley.",
  segments: "Peak + valley found in each of 5 sampling lengths, then averaged.",
  spacing: "Spacing between successive profile elements (mean-line crossings).",
  hist: "Distribution of profile heights — its shape is the parameter.",
  slope: "Local slope at each point; the parameter is their RMS.",
};

export function vizCaption(key: string | null): string | null {
  if (!key || !VIZ[key]) return null;
  return CAPTION[VIZ[key]];
}

/** Whether a given compute key has an annotated visual. */
export function hasViz(key: string | null): boolean {
  return !!(key && VIZ[key]);
}

function cssVar(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

/**
 * A clean, deterministic teaching profile with a handful of well-spaced
 * elements — designed so each parameter's annotation is legible (the dense live
 * trace crams features too close to read). Used for all geometric vizzes.
 */
function vizProfile(): number[] {
  const n = 300;
  const z = new Array<number>(n);
  let s = 12345;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < n; i++) {
    const x = i / n;
    z[i] =
      Math.sin(2 * Math.PI * 5 * x + 0.3) +
      0.42 * Math.sin(2 * Math.PI * 10.5 * x + 1.1) +
      0.16 * Math.sin(2 * Math.PI * 17 * x + 2.0) +
      (rnd() - 0.5) * 0.06;
  }
  let m = 0;
  for (const v of z) m += v;
  m /= n;
  for (let i = 0; i < n; i++) z[i] -= m;
  return z;
}

interface ParameterVizProps {
  vizKey: string | null;
  profile: Profile | null;
  /** Fixed canvas height in CSS px (inline thumbnail). */
  height?: number;
  /** Expanded view: derive a natural height from the width so it never stretches. */
  expanded?: boolean;
}

export function ParameterViz({
  vizKey,
  profile,
  height = 96,
  expanded = false,
}: ParameterVizProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const type = vizKey ? VIZ[vizKey] : undefined;

  useEffect(() => {
    if (!type || !profile) return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth || 300;
      // Expanded: height tracks width (≈ 2× the width-capped amplitude + margin)
      // so the trace fills the box at a natural aspect on phones and desktops.
      const cssH = expanded
        ? Math.round(Math.min(320, cssW * 0.24 + 56))
        : height;
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

      // Geometric annotations (area, peaks, spacing, segments, slope, span) are
      // drawn on a clean idealized profile so the mechanism is legible — a few
      // well-spaced elements rather than the dense live trace. The height
      // distribution (hist) uses the real profile so skew/kurtosis reflect the
      // actual finish.
      const z = type === "hist" && profile ? profile.z : vizProfile();
      const n = z.length;
      if (n === 0) return;
      const pad = 6;
      const plotW = cssW - pad * 2;
      const plotH = cssH - pad * 2;
      const mid = pad + plotH / 2;

      let maxAbs = 0;
      for (const v of z) maxAbs = Math.max(maxAbs, Math.abs(v));
      if (maxAbs === 0) maxAbs = 1;
      // Cap vertical amplitude relative to width so a tall canvas never stretches
      // the trace into an unnatural, over-exaggerated waveform.
      const ampPx = Math.min(plotH / 2 - 6, plotW * 0.11);
      const scale = ampPx / (maxAbs * 1.08);
      const xOf = (i: number) => pad + (plotW * i) / (n - 1);
      const yOf = (v: number) => mid - v * scale;

      const drawMean = () => {
        ctx.strokeStyle = muted;
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, mid);
        ctx.lineTo(pad + plotW, mid);
        ctx.stroke();
        ctx.setLineDash([]);
      };
      const drawTrace = (color = accent, width = 1.3) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          if (i === 0) ctx.moveTo(xOf(i), yOf(z[i]));
          else ctx.lineTo(xOf(i), yOf(z[i]));
        }
        ctx.stroke();
      };

      if (type === "area") {
        // Shaded deviation area between the profile and the mean line — the
        // region that gets averaged (KLA deck style).
        ctx.beginPath();
        ctx.moveTo(xOf(0), mid);
        for (let i = 0; i < n; i++) ctx.lineTo(xOf(i), yOf(z[i]));
        ctx.lineTo(xOf(n - 1), mid);
        ctx.closePath();
        ctx.fillStyle = good;
        ctx.globalAlpha = 0.32;
        ctx.fill();
        ctx.globalAlpha = 1;
        drawMean();
        drawTrace();
      } else if (type === "peak" || type === "valley") {
        drawMean();
        drawTrace();
        let idx = 0;
        for (let i = 1; i < n; i++) {
          if (type === "peak" ? z[i] > z[idx] : z[i] < z[idx]) idx = i;
        }
        const x = xOf(idx);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, mid);
        ctx.lineTo(x, yOf(z[idx]));
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x, yOf(z[idx]), 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (type === "span") {
        drawTrace(muted, 1);
        let hi = 0;
        let lo = 0;
        for (let i = 1; i < n; i++) {
          if (z[i] > z[hi]) hi = i;
          if (z[i] < z[lo]) lo = i;
        }
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(pad, yOf(z[hi]));
        ctx.lineTo(pad + plotW, yOf(z[hi]));
        ctx.moveTo(pad, yOf(z[lo]));
        ctx.lineTo(pad + plotW, yOf(z[lo]));
        ctx.stroke();
        ctx.setLineDash([]);
        const ax = pad + plotW - 14;
        ctx.strokeStyle = good;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(ax, yOf(z[hi]));
        ctx.lineTo(ax, yOf(z[lo]));
        ctx.stroke();
      } else if (type === "segments") {
        // 5 sampling lengths; mark each segment's max and min.
        const seg = Math.floor(n / 5);
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        for (let s = 1; s < 5; s++) {
          ctx.beginPath();
          ctx.moveTo(xOf(s * seg), pad);
          ctx.lineTo(xOf(s * seg), pad + plotH);
          ctx.stroke();
        }
        drawMean();
        drawTrace(accent, 1.1);
        for (let s = 0; s < 5; s++) {
          const a = s * seg;
          const b = s === 4 ? n : (s + 1) * seg;
          let hi = a;
          let lo = a;
          for (let i = a; i < b; i++) {
            if (z[i] > z[hi]) hi = i;
            if (z[i] < z[lo]) lo = i;
          }
          ctx.fillStyle = good;
          ctx.beginPath();
          ctx.arc(xOf(hi), yOf(z[hi]), 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(xOf(lo), yOf(z[lo]), 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === "spacing") {
        // Element boundaries = upward mean-line crossings, with height and
        // spacing discrimination so noise doesn't spawn spurious tiny elements
        // (this is how RSm itself ignores small peaks).
        const thr = maxAbs * 0.15;
        const minGap = plotW / 22;
        const raw: number[] = [];
        for (let i = 1; i < n; i++) {
          if (z[i - 1] <= 0 && z[i] > 0) raw.push(i);
        }
        const bounds: number[] = [];
        for (const c of raw) {
          if (bounds.length === 0) {
            bounds.push(c);
            continue;
          }
          const last = bounds[bounds.length - 1];
          let pk = 0;
          for (let j = last; j <= c; j++) pk = Math.max(pk, z[j]);
          if (pk > thr && xOf(c) - xOf(last) > minGap) bounds.push(c);
        }

        drawMean();
        drawTrace(accent, 1.1);

        // Vertical dashed separators at each element boundary.
        ctx.strokeStyle = muted;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        for (const b of bounds) {
          ctx.beginPath();
          ctx.moveTo(xOf(b), pad);
          ctx.lineTo(xOf(b), pad + plotH);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        // Element-width bars (Smi) along the mean line, with end ticks;
        // alternate brightness so neighbouring elements read distinctly.
        ctx.strokeStyle = good;
        ctx.lineWidth = 2;
        for (let i = 0; i < bounds.length - 1; i++) {
          const x0 = xOf(bounds[i]);
          const x1 = xOf(bounds[i + 1]);
          ctx.globalAlpha = i % 2 === 0 ? 1 : 0.55;
          ctx.beginPath();
          ctx.moveTo(x0 + 1, mid);
          ctx.lineTo(x1 - 1, mid);
          ctx.moveTo(x0, mid - 4);
          ctx.lineTo(x0, mid + 4);
          ctx.moveTo(x1, mid - 4);
          ctx.lineTo(x1, mid + 4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      } else if (type === "hist") {
        const bins = 24;
        const counts = new Array(bins).fill(0);
        for (const v of z) {
          let b = Math.floor(((v / maxAbs + 1) / 2) * bins);
          b = Math.max(0, Math.min(bins - 1, b));
          counts[b]++;
        }
        const maxC = Math.max(...counts, 1);
        const bw = plotW / bins;
        ctx.fillStyle = accent;
        for (let b = 0; b < bins; b++) {
          const h = (counts[b] / maxC) * (plotH - 6);
          ctx.fillRect(pad + b * bw + 1, pad + plotH - h, bw - 2, h);
        }
        // center line (mean height)
        ctx.strokeStyle = muted;
        ctx.setLineDash([4, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad + plotW / 2, pad);
        ctx.lineTo(pad + plotW / 2, pad + plotH);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (type === "slope") {
        drawMean();
        drawTrace(accent, 1.1);
        // tangent ticks colored by steepness
        const step = Math.max(1, Math.floor(n / 40));
        for (let i = step; i < n - step; i += step) {
          const slope = (z[i + step] - z[i - step]) / (2 * step);
          const ang = Math.atan(slope * scale);
          const len = 7;
          const x = xOf(i);
          const y = yOf(z[i]);
          ctx.strokeStyle = good;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(x - len * Math.cos(ang), y + len * Math.sin(ang));
          ctx.lineTo(x + len * Math.cos(ang), y - len * Math.sin(ang));
          ctx.stroke();
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [type, profile, height, expanded]);

  if (!type || !profile) return null;

  return (
    <div ref={wrapRef} className="param-viz">
      <canvas ref={canvasRef} role="img" aria-label="How this parameter is measured" />
    </div>
  );
}
