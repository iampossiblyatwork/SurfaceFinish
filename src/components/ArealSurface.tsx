import { useEffect, useMemo, useRef, useState } from "react";
import { useUnits } from "../context/UnitsContext";
import { formatLength } from "../lib/grades";

// Client-side areal (3D) surface synthesizer + pseudo-3D renderer. Driven by
// user inputs (lay, roughness, groove spacing, cross-hatch angle) rather than a
// purely random shape, so it teaches how the controls map to S-parameters.

type Lay = "uni" | "cross" | "iso";

const NX = 64;
const NY = 64;
const GROOVE_WIDTH = 0.1; // groove line width as a fraction of the spacing

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TURBO: Array<[number, [number, number, number]]> = [
  [0.0, [0, 0, 140]],
  [0.2, [0, 160, 255]],
  [0.45, [0, 210, 140]],
  [0.6, [180, 230, 40]],
  [0.8, [255, 150, 30]],
  [1.0, [200, 30, 30]],
];

function turbo(t: number): [number, number, number] {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < TURBO.length - 1; i++) {
    const [t0, c0] = TURBO[i];
    const [t1, c1] = TURBO[i + 1];
    if (t <= t1) {
      const f = t1 > t0 ? (t - t0) / (t1 - t0) : 0;
      return [
        c0[0] + (c1[0] - c0[0]) * f,
        c0[1] + (c1[1] - c0[1]) * f,
        c0[2] + (c1[2] - c0[2]) * f,
      ];
    }
  }
  return TURBO[TURBO.length - 1][1];
}

/** A narrow valley line: ~1 on a groove, ~0 on the plateau between grooves. */
function groove(p: number, period: number): number {
  const frac = ((p / period) % 1 + 1) % 1;
  const d = Math.min(frac, 1 - frac) / GROOVE_WIDTH;
  return Math.exp(-d * d);
}

interface GenOpts {
  sa: number;
  period: number;
  angle: number;
  seed: number;
}

/** Build a mean-removed height grid (µm), scaled so Sa ≈ opts.sa. */
function makeHeightmap(lay: Lay, opts: GenOpts): number[][] {
  const rng = mulberry32((opts.seed + 1) * 2654435761);
  const H: number[][] = Array.from({ length: NY }, () => new Array(NX).fill(0));

  if (lay === "iso") {
    // Isotropic lay (blasting / lapping): sum of random Gaussian bumps.
    const bumps = Array.from({ length: 40 }, () => ({
      x: rng() * NX,
      y: rng() * NY,
      a: (0.6 + rng() * 0.4) * (rng() < 0.5 ? 1 : -1),
      s: 3 + rng() * 4,
    }));
    for (let r = 0; r < NY; r++) {
      for (let c = 0; c < NX; c++) {
        let v = 0;
        for (const b of bumps) {
          const d2 = ((c - b.x) ** 2 + (r - b.y) ** 2) / (2 * b.s * b.s);
          if (d2 < 6) v += b.a * Math.exp(-d2);
        }
        H[r][c] = v;
      }
    }
  } else {
    // Directional lays: flat plateau cut by groove lines (one set for
    // unidirectional, two crossing sets for cross-hatch).
    const th = lay === "cross" ? (opts.angle * Math.PI) / 360 : 0;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    for (let r = 0; r < NY; r++) {
      for (let c = 0; c < NX; c++) {
        let g: number;
        if (lay === "cross") {
          const p1 = c * cos + r * sin;
          const p2 = c * cos - r * sin;
          g = Math.max(groove(p1, opts.period), groove(p2, opts.period));
        } else {
          g = groove(c, opts.period);
        }
        H[r][c] = -g + (rng() - 0.5) * 0.06;
      }
    }
  }

  // Mean-remove, then scale to the requested Sa.
  let mean = 0;
  for (let r = 0; r < NY; r++) for (let c = 0; c < NX; c++) mean += H[r][c];
  mean /= NX * NY;
  let saRaw = 0;
  for (let r = 0; r < NY; r++)
    for (let c = 0; c < NX; c++) {
      H[r][c] -= mean;
      saRaw += Math.abs(H[r][c]);
    }
  saRaw /= NX * NY;
  const k = saRaw > 0 ? opts.sa / saRaw : 1;
  for (let r = 0; r < NY; r++) for (let c = 0; c < NX; c++) H[r][c] *= k;
  return H;
}

interface SParams {
  Sa: number;
  Sq: number;
  Sz: number;
  Ssk: number;
  Sku: number;
}

function sParams(H: number[][]): SParams {
  const flat: number[] = [];
  for (const row of H) for (const v of row) flat.push(v);
  const n = flat.length;
  let sa = 0;
  let sq = 0;
  let hi = -Infinity;
  let lo = Infinity;
  for (const v of flat) {
    sa += Math.abs(v);
    sq += v * v;
    if (v > hi) hi = v;
    if (v < lo) lo = v;
  }
  sa /= n;
  const rms = Math.sqrt(sq / n);
  let s3 = 0;
  let s4 = 0;
  for (const v of flat) {
    s3 += v ** 3;
    s4 += v ** 4;
  }
  const Ssk = rms > 0 ? s3 / n / rms ** 3 : 0;
  const Sku = rms > 0 ? s4 / n / rms ** 4 : 0;
  return { Sa: sa, Sq: rms, Sz: hi - lo, Ssk, Sku };
}

function cssVar(name: string, fallback: string): string {
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function ArealSurface() {
  const { unit } = useUnits();
  const [lay, setLay] = useState<Lay>("cross");
  const [sa, setSa] = useState(0.4);
  const [period, setPeriod] = useState(10);
  const [angle, setAngle] = useState(50);
  const [seed, setSeed] = useState(1);

  const H = useMemo(
    () => makeHeightmap(lay, { sa, period, angle, seed }),
    [lay, sa, period, angle, seed],
  );
  const S = useMemo(() => sParams(H), [H]);

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
      const cssH = 300;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.fillStyle = cssVar("--surface-2", "#0c1219");
      ctx.fillRect(0, 0, cssW, cssH);

      let hmax = 0;
      for (const row of H) for (const v of row) hmax = Math.max(hmax, Math.abs(v));
      if (hmax === 0) hmax = 1;

      const cw = (cssW * 0.74) / NX;
      const rx = (cssW * 0.18) / NY;
      const ry = (cssH * 0.46) / NY;
      const ox = cssW * 0.05;
      const oy = cssH * 0.3;
      const zs = (cssH * 0.24) / hmax;

      const sx = (c: number, r: number) => ox + c * cw + r * rx;
      const sy = (r: number, h: number) => oy + r * ry - h * zs;

      const lightX = -0.4;
      const lightY = -0.5;
      const lightZ = 0.76;

      for (let r = 0; r < NY - 1; r++) {
        for (let c = 0; c < NX - 1; c++) {
          const h00 = H[r][c];
          const h10 = H[r][c + 1];
          const h11 = H[r + 1][c + 1];
          const h01 = H[r + 1][c];
          const avg = (h00 + h10 + h11 + h01) / 4;
          const [cr, cg, cb] = turbo((avg + hmax) / (2 * hmax));

          const dzdx = h10 - h00;
          const dzdy = h01 - h00;
          const nlen = Math.sqrt(dzdx * dzdx + dzdy * dzdy + 1);
          const sh = Math.max(
            0.4,
            Math.min(
              1.1,
              (-dzdx / nlen) * lightX +
                (-dzdy / nlen) * lightY +
                (1 / nlen) * lightZ +
                0.25,
            ),
          );

          ctx.fillStyle = `rgb(${Math.round(cr * sh)},${Math.round(cg * sh)},${Math.round(cb * sh)})`;
          ctx.beginPath();
          ctx.moveTo(sx(c, r), sy(r, h00));
          ctx.lineTo(sx(c + 1, r), sy(r, h10));
          ctx.lineTo(sx(c + 1, r + 1), sy(r + 1, h11));
          ctx.lineTo(sx(c, r + 1), sy(r + 1, h01));
          ctx.closePath();
          ctx.fill();
        }
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [H]);

  const directional = lay !== "iso";

  return (
    <div className="filter-demo">
      <div ref={wrapRef} className="filter-demo-canvas">
        <canvas ref={canvasRef} role="img" aria-label={`Synthesized areal surface, ${lay} lay`} />
      </div>

      <div className="filter-demo-readout areal-readout">
        <div><span className="fd-label">Sa</span><span className="fd-value">{formatLength(S.Sa, unit)}</span></div>
        <div><span className="fd-label">Sq</span><span className="fd-value">{formatLength(S.Sq, unit)}</span></div>
        <div><span className="fd-label">Sz</span><span className="fd-value">{formatLength(S.Sz, unit)}</span></div>
        <div><span className="fd-label">Ssk</span><span className="fd-value">{S.Ssk.toFixed(2)}</span></div>
        <div><span className="fd-label">Sku</span><span className="fd-value">{S.Sku.toFixed(2)}</span></div>
      </div>

      <div className="filter-demo-presets">
        <button type="button" className={lay === "uni" ? "active" : ""} onClick={() => setLay("uni")}>Unidirectional</button>
        <button type="button" className={lay === "cross" ? "active" : ""} onClick={() => setLay("cross")}>Cross-hatch</button>
        <button type="button" className={lay === "iso" ? "active" : ""} onClick={() => setLay("iso")}>Isotropic</button>
        <button type="button" onClick={() => setSeed((s) => s + 1)}>↻ New noise</button>
      </div>

      <div className="areal-controls">
        <label className="field">
          <span className="field-label">Roughness Sa — {formatLength(sa, unit)}</span>
          <input type="range" min={0.1} max={2} step={0.05} value={sa}
            onChange={(e) => setSa(Number(e.target.value))} />
        </label>
        {directional && (
          <label className="field">
            <span className="field-label">Groove spacing — {lay === "cross" ? "cross-hatch" : "feed"} pitch</span>
            <input type="range" min={5} max={20} step={1} value={period}
              onChange={(e) => setPeriod(Number(e.target.value))} />
          </label>
        )}
        {lay === "cross" && (
          <label className="field">
            <span className="field-label">Cross-hatch angle — {angle}°</span>
            <input type="range" min={20} max={70} step={2} value={angle}
              onChange={(e) => setAngle(Number(e.target.value))} />
          </label>
        )}
      </div>

      <p className="filter-demo-caption">
        A synthesized areal patch, height mapped to color (blue = valleys, red =
        peaks). The <strong>S-parameters</strong> above are computed over the
        whole surface, not a single line. <strong>Cross-hatch</strong> is the
        classic cylinder-liner honing pattern — a flat bearing plateau cut by two
        sets of oil-retention grooves, which is why its <strong>Ssk is
        negative</strong>. Drive the controls and watch the parameters respond.
      </p>
    </div>
  );
}
