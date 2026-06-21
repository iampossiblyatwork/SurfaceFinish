import { useEffect, useRef, useState } from "react";
import type { Profile } from "../api/client";

/** Which annotation style each parameter uses, keyed by its compute key. */
const VIZ: Record<string, string> = {
  Ra: "area",
  Rq: "rmsCompare",
  Rp: "peak",
  Rv: "valley",
  Rt: "span",
  Rz: "segments",
  Rc: "segments",
  RSm: "spacing",
  Rsk: "skewCompare",
  Rku: "kurtCompare",
  RDq: "slope",
  Rk: "core",
  Rpk: "core",
  Rvk: "core",
};

const CAPTION: Record<string, string> = {
  area: "Negative dips flipped up to |z|; the average level of the rectified profile is the parameter.",
  rmsCompare: "Every row has the SAME Ra, yet a different Rq — RMS weights tall peaks and deep valleys more, so spikier surfaces read higher.",
  peak: "Marks the highest peak above the mean line.",
  valley: "Marks the deepest valley below the mean line.",
  span: "Total height: highest peak to lowest valley.",
  segments: "Peak + valley found in each of 5 sampling lengths, then averaged.",
  spacing: "Spacing between successive profile elements (mean-line crossings).",
  skewCompare: "Skewness is the lean of the height distribution: negative = plateau with deep valleys, positive = peaks above a flat, zero = symmetric.",
  kurtCompare: "Kurtosis is the peakedness of the distribution: below 3 is broad and bumpy, 3 is Gaussian, above 3 is spiky with sharp peaks or deep scratches.",
  slope: "Local slope at each point; the parameter is their RMS.",
  core: "A flattest-40%-secant line through the bearing-area curve, extended to 0%/100% material ratio, brackets the load-bearing core (Rk); the peaks above it (Rpk) and valleys below it (Rvk) are sized to match the same area.",
};

export function vizCaption(key: string | null): string | null {
  if (!key || !VIZ[key]) return null;
  return CAPTION[VIZ[key]];
}

/** Whether a given compute key has an annotated visual. */
export function hasViz(key: string | null): boolean {
  return !!(key && VIZ[key]);
}

export interface VizLegendItem {
  color: string;
  label: string;
}

// Color key for the comparison vizzes (rows are drawn accent / good / amber in
// this order). Single source of truth shared with the canvas drawing.
const LEGENDS: Record<string, VizLegendItem[]> = {
  Rq: [
    { color: "var(--accent)", label: "smooth" },
    { color: "var(--good)", label: "some peaks" },
    { color: "#e3a857", label: "spiky" },
  ],
  Rsk: [
    { color: "var(--accent)", label: "negative" },
    { color: "var(--good)", label: "symmetric" },
    { color: "#e3a857", label: "positive" },
  ],
  Rku: [
    { color: "var(--accent)", label: "bumpy" },
    { color: "var(--good)", label: "Gaussian" },
    { color: "#e3a857", label: "spiky" },
  ],
};

/** Color legend for the comparison vizzes, or null for non-comparison params. */
export function vizLegend(key: string | null): VizLegendItem[] | null {
  return key && LEGENDS[key] ? LEGENDS[key] : null;
}

/**
 * Abbott–Firestone (material-ratio) curve, interactive: sort the profile heights
 * from the highest peak down and you get the bearing-area curve — a long plateau
 * (broad load-bearing area near the top) then a steep drop into the valleys.
 * Drag the "lapping plane" down through the profile and a marker slides along the
 * curve to the matching bearing ratio, teaching Rmr(c) directly: the fraction of
 * the surface sitting at or above a given depth. The teaching profile is
 * deterministic; only the plane depth is interactive.
 */
export function AbbottCurve() {
  const [depthFrac, setDepthFrac] = useState(0.3);
  const mid = 75;
  const N = 240;
  const fn = (t: number) => {
    const frac = (t * 5) % 1;
    const dd = (frac - 0.5) / 0.1;
    return 0.12 * Math.sin(2 * Math.PI * 9 * t) - Math.exp(-dd * dd);
  };
  let z = Array.from({ length: N + 1 }, (_, i) => fn(i / N));
  const m = z.reduce((a, b) => a + b, 0) / z.length;
  z = z.map((x) => x - m);
  let mx = 0;
  for (const x of z) mx = Math.max(mx, Math.abs(x));
  if (mx === 0) mx = 1;
  const scale = 58 / (mx * 1.08);
  const splitX = 150;

  // Give the normalized teaching profile a realistic total height so the section
  // depth c reads in micrometers — the way a drawing callout actually states it.
  const RT_UM = 1.0; // peak-to-valley height of the teaching profile (µm)
  const SPEC_MR = 0.9; // the typical "Rmr c = 90%" bearing-ratio callout target

  // Height extremes set the depth axis: depthFrac 0 = highest peak, 1 = deepest
  // valley. The lapping plane sits at planeHeight; everything above it is the
  // material currently in bearing contact.
  let hi = z[0];
  let lo = z[0];
  for (const x of z) {
    if (x > hi) hi = x;
    if (x < lo) lo = x;
  }
  const span = hi - lo || 1;
  const planeHeight = hi - depthFrac * span;
  const yPlane = mid - planeHeight * scale;
  const depthUm = depthFrac * RT_UM; // section depth c below the highest peak

  // Rmr(c): fraction of the surface at or above the plane — rises from ~0 % at
  // the peak to 100 % at the deepest valley as the plane laps downward.
  let above = 0;
  for (const x of z) if (x >= planeHeight) above++;
  const mr = above / z.length;

  const profX = (i: number) => 10 + ((splitX - 28) * i) / N;

  // Bearing intercepts (A, B, C, … in the classic mr = (A+B+C+…)/L diagram):
  // contiguous runs where the profile sits at or above the plane. Their summed
  // length over L is exactly Rmr(c), since the threshold matches `above`.
  const intercepts: Array<[number, number]> = [];
  for (let i = 0; i <= N; i++) {
    if (z[i] >= planeHeight) {
      const start = i;
      while (i <= N && z[i] >= planeHeight) i++;
      intercepts.push([start, i - 1]);
    }
  }
  const prof = z
    .map((zz, i) => `${profX(i).toFixed(1)},${(mid - zz * scale).toFixed(1)}`)
    .join(" ");

  // Cap shaded between the profile and the plane, only where the profile rises
  // above it — the material the lapping plane would shave off first.
  const x0 = profX(0);
  const x1 = profX(N);
  const cap = z
    .map((zz, i) => `${profX(i).toFixed(1)},${Math.min(mid - zz * scale, yPlane).toFixed(1)}`)
    .join(" ");
  const capArea = `${cap} ${x1.toFixed(1)},${yPlane.toFixed(1)} ${x0.toFixed(1)},${yPlane.toFixed(1)}`;

  // Bearing-area curve = heights sorted high→low; the plane meets it at x = mr.
  const zs = [...z].sort((a, b) => b - a);
  const distW = 350 - splitX - 4;
  const curve = zs
    .map((zz, k) => `${(splitX + (distW * k) / N).toFixed(1)},${(mid - zz * scale).toFixed(1)}`)
    .join(" ");
  const markerX = splitX + distW * mr;
  const pct = Math.round(mr * 100);

  // The 90 % callout target on the bearing curve, and the section depth at which
  // this surface first reaches it (the c a drawing would have to allow).
  const specX = splitX + distW * SPEC_MR;
  const cAt90 = ((hi - zs[Math.round(SPEC_MR * N)]) / span) * RT_UM;
  const meetsSpec = mr >= SPEC_MR;

  // Profile depth scale (right gutter): 0 µm at the highest peak, RT_UM at the
  // deepest valley, with a tick riding the current lapping plane.
  const yPeak = mid - hi * scale;
  const yValley = mid - lo * scale;

  return (
    <div className="abbott">
      <svg viewBox="0 0 360 152" className="stylus-fig wide" role="img" aria-label="Interactive Abbott–Firestone bearing-area curve with a lapping plane swept through the profile">
        <line x1={10} y1={mid} x2={splitX - 8} y2={mid} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 3" />
        <polygon points={capArea} fill="var(--good)" opacity={0.28} />
        <polyline points={prof} fill="none" stroke="var(--accent)" strokeWidth={1.4} strokeLinejoin="round" />
        {/* Lapping plane (thin accent reference) and a faint tie-line to the curve. */}
        <line x1={x0} y1={yPlane} x2={x1} y2={yPlane} stroke="var(--accent)" strokeWidth={1.2} strokeDasharray="4 3" />
        <line x1={x1} y1={yPlane} x2={markerX} y2={yPlane} stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 3" />
        {/* Bearing intercepts (A+B+C+…): the lengths summed into Rmr(c). */}
        {intercepts.map(([a, b], k) => {
          const xa = profX(a);
          const xb = profX(b);
          return (
            <g key={k} stroke="var(--good)" strokeWidth={3.4} strokeLinecap="round">
              <line x1={xa} y1={yPlane} x2={xb} y2={yPlane} />
              <line x1={xa} y1={yPlane - 3.5} x2={xa} y2={yPlane + 3.5} strokeWidth={1.6} />
              <line x1={xb} y1={yPlane - 3.5} x2={xb} y2={yPlane + 3.5} strokeWidth={1.6} />
            </g>
          );
        })}
        {/* Depth scale (µm) down the right edge of the profile panel. */}
        <line x1={x1 + 6} y1={yPeak} x2={x1 + 6} y2={yValley} stroke="var(--muted)" strokeWidth={1} />
        <line x1={x1 + 3} y1={yPlane} x2={x1 + 9} y2={yPlane} stroke="var(--accent)" strokeWidth={1.6} />
        <text x={x1 + 11} y={yPeak + 3} fill="var(--muted)" fontSize={8} fontFamily="system-ui, sans-serif">0</text>
        <text x={x1 + 11} y={yValley} fill="var(--muted)" fontSize={8} fontFamily="system-ui, sans-serif">{RT_UM.toFixed(1)}µm</text>
        <line x1={splitX} y1={14} x2={splitX} y2={132} stroke="var(--grid)" strokeWidth={1} />
        <polyline points={curve} fill="none" stroke="var(--good)" strokeWidth={2.2} strokeLinejoin="round" />
        {/* Typical "Rmr c = 90%" bearing-ratio callout target on the curve. */}
        <line x1={specX} y1={16} x2={specX} y2={132} stroke="#e3a857" strokeWidth={1.2} strokeDasharray="3 3" />
        <text x={specX - 2} y={23} fill="#e3a857" fontSize={9} textAnchor="end" fontFamily="system-ui, sans-serif">90%</text>
        {/* Marker where the plane crosses the bearing curve, dropped to the axis. */}
        <line x1={markerX} y1={yPlane} x2={markerX} y2={134} stroke="var(--accent)" strokeWidth={1} strokeDasharray="2 3" />
        <circle cx={markerX} cy={yPlane} r={3.5} fill="var(--accent)" />
        <text x={splitX + 2} y={148} fill="var(--muted)" fontSize={10} fontFamily="system-ui, sans-serif">0%</text>
        <text x={350} y={148} fill="var(--muted)" fontSize={10} textAnchor="end" fontFamily="system-ui, sans-serif">100% material ratio</text>
      </svg>
      <div className="abbott-control">
        <span className="abbott-readout">
          Depth c = <strong>{depthUm.toFixed(2)} µm</strong> · bearing Rmr ={" "}
          <strong>{pct}%</strong> of L
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.005}
          value={depthFrac}
          onChange={(e) => setDepthFrac(Number(e.target.value))}
          aria-label="Lapping plane depth"
        />
        <span className="abbott-callout">
          A drawing calls this out as <code>Rmr c = 90%</code> — at least 90 %
          material by section depth c. This surface crosses the amber 90 % line
          at <strong>c ≈ {cAt90.toFixed(2)} µm</strong>
          {meetsSpec ? " — the plane is past it now." : "; drag deeper to reach it."}
        </span>
      </div>
    </div>
  );
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

// ─── Rq comparison set ───────────────────────────────────────────────────────
// Three profiles that share an identical Ra but have rising Rq, to show that the
// RMS weights tall peaks / deep valleys more than the arithmetic mean does.

interface RqRow {
  z: number[];
  rq: number; // Rq/Ra ratio (since each row is normalised to Ra = 1)
  label: string;
}

/** Mean-remove, then scale so the arithmetic mean of |z| (Ra) equals 1. */
function normalizeToRa1(z: number[], label: string): RqRow {
  const n = z.length;
  let m = 0;
  for (const v of z) m += v;
  m /= n;
  for (let i = 0; i < n; i++) z[i] -= m;
  let ra = 0;
  for (const v of z) ra += Math.abs(v);
  ra /= n;
  if (ra > 0) for (let i = 0; i < n; i++) z[i] /= ra;
  let sq = 0;
  for (const v of z) sq += v * v;
  return { z, rq: Math.sqrt(sq / n), label };
}

function addSpikes(
  z: number[],
  base: number,
  baseFreq: number,
  spikes: Array<[number, number, number]>,
  seed: number,
): number[] {
  const n = z.length;
  let s = seed;
  const rnd = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < n; i++) {
    const x = i / n;
    let v = base * Math.sin(2 * Math.PI * baseFreq * x);
    for (const [p, a, w] of spikes) {
      const d = (x - p) / w;
      v += a * Math.exp(-d * d);
    }
    v += (rnd() - 0.5) * 0.06;
    z[i] = v;
  }
  return z;
}

function rqCompareSet(): RqRow[] {
  const n = 300;
  // Smooth: a gentle wave — the lowest Rq/Ra (a pure sine gives ≈ 1.11).
  const smooth = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const x = i / n;
    smooth[i] =
      Math.sin(2 * Math.PI * 4 * x) + 0.1 * Math.sin(2 * Math.PI * 9 * x + 1);
  }
  // Moderate: a few rounded peaks on a smaller wave.
  const moderate = addSpikes(
    new Array<number>(n),
    0.55,
    4,
    [
      [0.18, 1.1, 0.03],
      [0.5, -1.0, 0.032],
      [0.82, 1.05, 0.03],
    ],
    7,
  );
  // Spiky: small base plus sharp tall spikes and deep valleys — highest Rq/Ra.
  const spiky = addSpikes(
    new Array<number>(n),
    0.18,
    6,
    [
      [0.12, 2.1, 0.015],
      [0.32, -2.0, 0.016],
      [0.54, 2.3, 0.014],
      [0.74, -2.0, 0.015],
      [0.9, 2.0, 0.015],
    ],
    13,
  );
  return [
    normalizeToRa1(smooth, "smooth"),
    normalizeToRa1(moderate, "some peaks"),
    normalizeToRa1(spiky, "spiky"),
  ];
}

// ─── Skewness / kurtosis example sets ────────────────────────────────────────

interface MomentRow {
  z: number[];
  val: number; // Rsk or Rku
  label: string;
}

function prng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function centre(z: number[]): number[] {
  let m = 0;
  for (const v of z) m += v;
  m /= z.length;
  return z.map((v) => v - m);
}

function skewOf(z: number[]): number {
  const n = z.length;
  let sq = 0;
  let s3 = 0;
  for (const v of z) {
    sq += v * v;
    s3 += v ** 3;
  }
  const rq = Math.sqrt(sq / n);
  return rq > 0 ? s3 / n / rq ** 3 : 0;
}

function kurtOf(z: number[]): number {
  const n = z.length;
  let sq = 0;
  let s4 = 0;
  for (const v of z) {
    sq += v * v;
    s4 += v ** 4;
  }
  const rq = Math.sqrt(sq / n);
  return rq > 0 ? s4 / n / rq ** 4 : 0;
}

/** Plateau ripple plus periodic Gaussian features — valleys (dir −1) give
 *  negative skew, peaks (dir +1) give positive skew. */
function asymProfile(dir: number, seed: number): number[] {
  const n = 280;
  const rnd = prng(seed);
  const z = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const x = i / n;
    const f = (x * 6) % 1;
    const d = (f - 0.5) / 0.09;
    z[i] = 0.12 * Math.sin(2 * Math.PI * 9 * x) + dir * Math.exp(-d * d) + (rnd() - 0.5) * 0.05;
  }
  return centre(z);
}

function skewSet(): MomentRow[] {
  const neg = asymProfile(-1, 5);
  const sym = (() => {
    const n = 280;
    const rnd = prng(11);
    const z = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const x = i / n;
      z[i] =
        Math.sin(2 * Math.PI * 4 * x) + 0.4 * Math.sin(2 * Math.PI * 9 * x + 1) + (rnd() - 0.5) * 0.1;
    }
    return centre(z);
  })();
  const pos = asymProfile(1, 5);
  return [
    { z: neg, val: skewOf(neg), label: "negative — valleys" },
    { z: sym, val: skewOf(sym), label: "≈ 0 — symmetric" },
    { z: pos, val: skewOf(pos), label: "positive — peaks" },
  ];
}

function kurtSet(): MomentRow[] {
  const n = 280;
  // Bumpy / broad — sub-Gaussian (a sine alone gives 1.5).
  const bumpy = (() => {
    const z = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const x = i / n;
      z[i] = Math.sin(2 * Math.PI * 3 * x) + 0.35 * Math.sin(2 * Math.PI * 6 * x + 0.7);
    }
    return centre(z);
  })();
  // Random — roughly Gaussian (Rku ≈ 3).
  const gauss = (() => {
    const rnd = prng(23);
    const z = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      let g = 0;
      for (let k = 0; k < 6; k++) g += rnd();
      z[i] = g - 3;
    }
    return centre(z);
  })();
  // Spiky — sparse tall spikes both directions (skew stays ~0, kurtosis high).
  const spiky = (() => {
    const rnd = prng(31);
    const spikes: Array<[number, number, number]> = [
      [0.16, 2.6, 0.012],
      [0.34, -2.6, 0.012],
      [0.6, 2.7, 0.011],
      [0.82, -2.5, 0.012],
    ];
    const z = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      const x = i / n;
      let v = 0.08 * Math.sin(2 * Math.PI * 8 * x) + (rnd() - 0.5) * 0.05;
      for (const [p, a, w] of spikes) {
        const d = (x - p) / w;
        v += a * Math.exp(-d * d);
      }
      z[i] = v;
    }
    return centre(z);
  })();
  return [
    { z: bumpy, val: kurtOf(bumpy), label: "low — broad / bumpy" },
    { z: gauss, val: kurtOf(gauss), label: "≈ 3 — Gaussian" },
    { z: spiky, val: kurtOf(spiky), label: "high — spiky" },
  ];
}

interface ParameterVizProps {
  vizKey: string | null;
  profile: Profile | null;
  /** Parameter symbol (e.g. "Ra", "Rq") — used to label the average level. */
  symbol?: string;
  /** Fixed canvas height in CSS px (inline thumbnail). */
  height?: number;
  /** Expanded view: derive a natural height from the width so it never stretches. */
  expanded?: boolean;
}

export function ParameterViz({
  vizKey,
  profile,
  symbol,
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
      // Expanded: height tracks width so the trace fills the box at a natural
      // aspect with generous amplitude. The comparison vizzes stack three rows,
      // so they need a taller box (especially on a narrow phone canvas).
      const tallCompare =
        type === "rmsCompare" || type === "skewCompare" || type === "kurtCompare";
      const cssH = !expanded
        ? height
        : tallCompare
          ? Math.round(Math.min(380, Math.max(252, cssW * 0.5)))
          : Math.round(Math.min(340, cssW * 0.34 + 52));
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

      if (type === "rmsCompare") {
        // Same Ra in every row, different Rq. Shared vertical scale + common ±Ra
        // reference lines anchor the equal-Ra fact; taller peaks ⇒ larger Rq.
        const amber = "#e3a857";
        const rowColors = [accent, good, amber];
        const padC = 8;
        const plotWC = cssW - padC * 2;
        const plotHC = cssH - padC * 2;
        const set = expanded ? rqCompareSet() : [rqCompareSet()[0], rqCompareSet()[2]];
        const rows = set.length;
        const rowH = plotHC / rows;
        const rowHalf = rowH / 2 - 5;
        // Scale to a reference peak so the gentle waves have real amplitude; the
        // spiky peaks deliberately poke beyond and are clipped to their row.
        const refPeak = 2.0;
        const sc = rowHalf / refPeak;

        set.forEach((r, ri) => {
          const m = r.z.length;
          const midY = padC + rowH * (ri + 0.5);
          ctx.save();
          ctx.beginPath();
          ctx.rect(padC, midY - rowH / 2 + 1, plotWC, rowH - 2);
          ctx.clip();
          // ±Ra reference lines (identical offset in every row).
          ctx.strokeStyle = muted;
          ctx.globalAlpha = 0.6;
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(padC, midY - sc);
          ctx.lineTo(padC + plotWC, midY - sc);
          ctx.moveTo(padC, midY + sc);
          ctx.lineTo(padC + plotWC, midY + sc);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
          // Profile.
          const col = rowColors[ri % rowColors.length];
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.6;
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i < m; i++) {
            const x = padC + (plotWC * i) / (m - 1);
            const y = midY - r.z[i] * sc;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();
          // Label overlaid in the row's top-left corner (no reserved space).
          if (expanded) {
            ctx.fillStyle = col;
            ctx.font = "bold 12px system-ui, sans-serif";
            ctx.fillText(
              `Rq = ${r.rq.toFixed(2)} × Ra  (${r.label})`,
              padC + 4,
              padC + rowH * ri + 13,
            );
          }
        });

        // "same Ra" annotation on the reference lines (first row).
        ctx.fillStyle = muted;
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText("± Ra (same in every row)", padC + plotWC - 150, padC + rowH - 4);
        return;
      }

      if (type === "skewCompare" || type === "kurtCompare") {
        // Example profiles (left) and their height distributions (right) for a
        // range of skewness or kurtosis — the shape of the distribution is the
        // parameter.
        const isSkew = type === "skewCompare";
        const amber = "#e3a857";
        const rowColors = [accent, good, amber];
        const full = isSkew ? skewSet() : kurtSet();
        const set = expanded ? full : [full[0], full[2]];
        const padC = 8;
        const plotWC = cssW - padC * 2;
        const plotHC = cssH - padC * 2;
        const rows = set.length;
        const rowH = plotHC / rows;
        const rowHalf = rowH / 2 - 6;
        const splitX = padC + plotWC * 0.56;

        set.forEach((r, ri) => {
          const m = r.z.length;
          const midY = padC + rowH * (ri + 0.5);
          const col = rowColors[ri % rowColors.length];
          let maxAbs = 0;
          for (const v of r.z) maxAbs = Math.max(maxAbs, Math.abs(v));
          if (maxAbs === 0) maxAbs = 1;
          const span = maxAbs * 1.08;
          const sc = rowHalf / span;

          ctx.save();
          ctx.beginPath();
          ctx.rect(padC, midY - rowH / 2 + 1, plotWC, rowH - 2);
          ctx.clip();

          // Mean line across the profile region.
          ctx.strokeStyle = muted;
          ctx.globalAlpha = 0.6;
          ctx.setLineDash([3, 3]);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(padC, midY);
          ctx.lineTo(splitX - 8, midY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;

          // Profile (left).
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.5;
          ctx.lineJoin = "round";
          ctx.beginPath();
          for (let i = 0; i < m; i++) {
            const x = padC + ((splitX - 8 - padC) * i) / (m - 1);
            const y = midY - r.z[i] * sc;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Divider.
          ctx.strokeStyle = grid;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(splitX, midY - rowH / 2 + 4);
          ctx.lineTo(splitX, midY + rowH / 2 - 4);
          ctx.stroke();

          // Amplitude distribution (right), height on the y-axis.
          const bins = 40;
          const counts = new Array(bins).fill(0);
          for (const v of r.z) {
            let b = Math.floor(((v / span + 1) / 2) * bins);
            b = Math.max(0, Math.min(bins - 1, b));
            counts[b]++;
          }
          const sm = counts.map((_, b) => {
            let s = 0;
            let c = 0;
            for (let k = -2; k <= 2; k++) {
              const j = b + k;
              if (j >= 0 && j < bins) {
                s += counts[j];
                c++;
              }
            }
            return s / c;
          });
          const maxC = Math.max(...sm, 1);
          const distW = padC + plotWC - splitX - 4;
          const hAt = (b: number) => (((b + 0.5) / bins) * 2 - 1) * span;
          const xAt = (b: number) => splitX + (sm[b] / maxC) * distW;
          ctx.beginPath();
          ctx.moveTo(splitX, midY - hAt(0) * sc);
          for (let b = 0; b < bins; b++) ctx.lineTo(xAt(b), midY - hAt(b) * sc);
          ctx.lineTo(splitX, midY - hAt(bins - 1) * sc);
          ctx.closePath();
          ctx.fillStyle = col;
          ctx.globalAlpha = 0.3;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = col;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let b = 0; b < bins; b++) {
            const x = xAt(b);
            const y = midY - hAt(b) * sc;
            if (b === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          ctx.restore();

          // Label overlaid in the row's top-left corner.
          if (expanded) {
            ctx.fillStyle = col;
            ctx.font = "bold 12px system-ui, sans-serif";
            ctx.fillText(
              `${isSkew ? "Rsk" : "Rku"} = ${r.val.toFixed(2)}  (${r.label})`,
              padC + 4,
              padC + rowH * ri + 13,
            );
          }
        });
        return;
      }

      // Geometric annotations (area, peaks, spacing, segments, slope, span) are
      // drawn on a clean idealized profile so the mechanism is legible — a few
      // well-spaced elements rather than the dense live trace.
      const z = vizProfile();
      const n = z.length;
      if (n === 0) return;
      const pad = 6;
      const plotW = cssW - pad * 2;
      const plotH = cssH - pad * 2;
      const mid = pad + plotH / 2;

      let maxAbs = 0;
      for (const v of z) maxAbs = Math.max(maxAbs, Math.abs(v));
      if (maxAbs === 0) maxAbs = 1;
      // Generous amplitude, but capped relative to width so a very wide canvas
      // doesn't stretch the trace into an over-exaggerated waveform.
      const ampPx = Math.min(plotH / 2 - 8, plotW * 0.17);
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

      // Arrowhead with its tip at (x, y); dir −1 points up, +1 points down.
      const arrow = (x: number, y: number, dir: number) => {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 3, y + dir * 7);
        ctx.lineTo(x + 3, y + dir * 7);
        ctx.closePath();
        ctx.fill();
      };
      // Vertical dimension leader between yA and yB with outward arrowheads and a
      // label — engineering-drawing style, matching the reference deck.
      const dimV = (x: number, yA: number, yB: number, label: string, color: string) => {
        const top = Math.min(yA, yB);
        const bot = Math.max(yA, yB);
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, top + 1);
        ctx.lineTo(x, bot - 1);
        ctx.stroke();
        arrow(x, top, -1);
        arrow(x, bot, 1);
        ctx.font = "bold 11px system-ui, sans-serif";
        ctx.fillText(label, x + 5, (top + bot) / 2 + 4);
      };

      if (type === "area") {
        // Ra = the mean of |z|: flip every negative excursion up to the positive
        // side, then the average level of that rectified profile is Ra. (Rq is
        // the RMS of the same magnitudes — a slightly higher level.)
        let mAbs = 0;
        let mSq = 0;
        for (const v of z) {
          mAbs += Math.abs(v);
          mSq += v * v;
        }
        mAbs /= n;
        const level = symbol === "Rq" ? Math.sqrt(mSq / n) : mAbs;

        // Faint original profile, so the negative dips (before flipping) show.
        drawTrace(muted, 1);

        // Rectified profile |z| above the mean line, shaded — the area averaged.
        ctx.beginPath();
        ctx.moveTo(xOf(0), mid);
        for (let i = 0; i < n; i++) ctx.lineTo(xOf(i), mid - Math.abs(z[i]) * scale);
        ctx.lineTo(xOf(n - 1), mid);
        ctx.closePath();
        ctx.fillStyle = good;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = good;
        ctx.lineWidth = 1.6;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const x = xOf(i);
          const y = mid - Math.abs(z[i]) * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        drawMean();

        // The average level — this line is the parameter.
        const yLevel = mid - level * scale;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(pad, yLevel);
        ctx.lineTo(pad + plotW, yLevel);
        ctx.stroke();
        ctx.fillStyle = accent;
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText(
          symbol === "Rq" ? "RMS of |z| = Rq" : "mean of |z| = Ra",
          pad + 4,
          yLevel - 4,
        );
      } else if (type === "peak" || type === "valley") {
        drawMean();
        drawTrace();
        let idx = 0;
        for (let i = 1; i < n; i++) {
          if (type === "peak" ? z[i] > z[idx] : z[i] < z[idx]) idx = i;
        }
        const x = xOf(idx);
        const yExt = yOf(z[idx]);
        // Extension line from the mean line across to the peak/valley level.
        ctx.strokeStyle = muted;
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(Math.max(pad, x - 26), yExt);
        ctx.lineTo(Math.min(pad + plotW, x + 26), yExt);
        ctx.stroke();
        ctx.setLineDash([]);
        // Marker on the extreme point.
        ctx.fillStyle = accent;
        ctx.beginPath();
        ctx.arc(x, yExt, 3, 0, Math.PI * 2);
        ctx.fill();
        // Dimension leader from the mean line to the peak/valley = Rp / Rv.
        dimV(x, mid, yExt, symbol ?? (type === "peak" ? "Rp" : "Rv"), accent);
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
          const yHi = yOf(z[hi]);
          const yLo = yOf(z[lo]);
          const segMid = pad + (xOf(a) - pad + (xOf(b - 1) - pad)) / 2;
          // Extension lines from the actual peak/valley to the dimension line.
          ctx.strokeStyle = muted;
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(xOf(hi), yHi);
          ctx.lineTo(segMid, yHi);
          ctx.moveTo(xOf(lo), yLo);
          ctx.lineTo(segMid, yLo);
          ctx.stroke();
          ctx.setLineDash([]);
          // Peak / valley markers.
          ctx.fillStyle = good;
          ctx.beginPath();
          ctx.arc(xOf(hi), yHi, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(xOf(lo), yLo, 2.6, 0, Math.PI * 2);
          ctx.fill();
          // Peak-to-valley dimension leader = Rz of this sampling length.
          dimV(segMid, yHi, yLo, `Z${s + 1}`, good);
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
      } else if (type === "core") {
        // ISO 13565-2 core line: slide a secant spanning 40% of the material
        // ratio across the sorted (bearing-area) profile to find its flattest
        // span, then extend it to mr 0%/100% — those levels are h0/h100, and
        // Rk is the gap between them. Shading the spatial trace against the
        // same two levels shows the isolated peak/valley material directly.
        const zs = [...z].sort((a, b) => b - a);
        const win = Math.max(1, Math.round(0.4 * n));
        let bestI = 0;
        let bestDiff = Infinity;
        for (let i = 0; i + win < n; i++) {
          const diff = zs[i] - zs[i + win];
          if (diff < bestDiff) {
            bestDiff = diff;
            bestI = i;
          }
        }
        const slope = (zs[bestI + win] - zs[bestI]) / win;
        const h0 = zs[bestI] - slope * bestI;
        const h100 = zs[bestI] + slope * (n - bestI);
        const yH0 = yOf(h0);
        const yH100 = yOf(h100);

        drawMean();

        // Peak zone (above h0).
        ctx.beginPath();
        ctx.moveTo(xOf(0), yH0);
        for (let i = 0; i < n; i++) ctx.lineTo(xOf(i), Math.min(yOf(z[i]), yH0));
        ctx.lineTo(xOf(n - 1), yH0);
        ctx.closePath();
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Valley zone (below h100).
        ctx.beginPath();
        ctx.moveTo(xOf(0), yH100);
        for (let i = 0; i < n; i++) ctx.lineTo(xOf(i), Math.max(yOf(z[i]), yH100));
        ctx.lineTo(xOf(n - 1), yH100);
        ctx.closePath();
        ctx.fillStyle = "#e3a857";
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;

        drawTrace(good, 1.3);

        ctx.strokeStyle = muted;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad, yH0);
        ctx.lineTo(pad + plotW, yH0);
        ctx.moveTo(pad, yH100);
        ctx.lineTo(pad + plotW, yH100);
        ctx.stroke();
        ctx.setLineDash([]);

        dimV(pad + plotW - 14, yH0, yH100, "Rk", accent);
        ctx.fillStyle = accent;
        ctx.font = "11px system-ui, sans-serif";
        ctx.fillText("Rpk", pad + 4, yH0 - 4);
        ctx.fillStyle = "#e3a857";
        ctx.fillText("Rvk", pad + 4, yH100 + 13);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [type, profile, symbol, height, expanded]);

  if (!type || !profile) return null;

  return (
    <div ref={wrapRef} className="param-viz">
      <canvas ref={canvasRef} role="img" aria-label="How this parameter is measured" />
    </div>
  );
}
