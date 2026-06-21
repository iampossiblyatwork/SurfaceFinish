import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent } from "react";
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

// Orbit camera: azimuth spins around the vertical axis, elevation tilts the
// camera up/down. Both are dragged directly on the canvas.
const DEFAULT_AZ = -50; // degrees
const DEFAULT_EL = 35;
const EL_MIN = 8;
const EL_MAX = 85;

export function ArealSurface() {
  const { unit } = useUnits();
  const [lay, setLay] = useState<Lay>("cross");
  const [sa, setSa] = useState(0.4);
  const [period, setPeriod] = useState(10);
  const [angle, setAngle] = useState(50);
  const [seed, setSeed] = useState(1);
  const [az, setAz] = useState(DEFAULT_AZ);
  const [el, setEl] = useState(DEFAULT_EL);

  const H = useMemo(
    () => makeHeightmap(lay, { sa, period, angle, seed }),
    [lay, sa, period, angle, seed],
  );
  const S = useMemo(() => sParams(H), [H]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; az: number; el: number } | null>(null);

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

      // Orbit camera basis: `dir` points from the surface toward the camera;
      // `right` / `up` span the view plane. Projecting onto them gives screen
      // position, and the component along `dir` gives depth for the painter's
      // algorithm (draw far quads first, near quads last).
      const azR = (az * Math.PI) / 180;
      const elR = (el * Math.PI) / 180;
      const dir = [
        Math.cos(elR) * Math.sin(azR),
        -Math.cos(elR) * Math.cos(azR),
        Math.sin(elR),
      ];
      const worldUp = [0, 0, 1];
      let right = [
        worldUp[1] * dir[2] - worldUp[2] * dir[1],
        worldUp[2] * dir[0] - worldUp[0] * dir[2],
        worldUp[0] * dir[1] - worldUp[1] * dir[0],
      ];
      const rlen = Math.hypot(right[0], right[1], right[2]) || 1;
      right = [right[0] / rlen, right[1] / rlen, right[2] / rlen];
      const up = [
        dir[1] * right[2] - dir[2] * right[1],
        dir[2] * right[0] - dir[0] * right[2],
        dir[0] * right[1] - dir[1] * right[0],
      ];

      const cellW = (cssW * 0.8) / NX;
      const cellD = (cssW * 0.8) / NY;
      const zScale = (cssH * 0.5) / hmax;
      const ox = cssW * 0.5;
      const oy = cssH * 0.52;

      // Project a grid point (column c, row r, height h) into screen space and
      // a camera-space depth (larger = nearer the camera).
      const project = (c: number, r: number, h: number) => {
        const px = (c - NX / 2) * cellW;
        const py = (r - NY / 2) * cellD;
        const pz = h * zScale;
        const sx = ox + px * right[0] + py * right[1] + pz * right[2];
        const sy = oy - (px * up[0] + py * up[1] + pz * up[2]);
        const depth = px * dir[0] + py * dir[1] + pz * dir[2];
        return { sx, sy, depth };
      };

      const lightX = -0.4;
      const lightY = -0.5;
      const lightZ = 0.76;

      type Quad = { sx: number[]; sy: number[]; depth: number; color: [number, number, number]; sh: number };
      const quads: Quad[] = [];

      for (let r = 0; r < NY - 1; r++) {
        for (let c = 0; c < NX - 1; c++) {
          const h00 = H[r][c];
          const h10 = H[r][c + 1];
          const h11 = H[r + 1][c + 1];
          const h01 = H[r + 1][c];
          const avg = (h00 + h10 + h11 + h01) / 4;
          const color = turbo((avg + hmax) / (2 * hmax));

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

          const p00 = project(c, r, h00);
          const p10 = project(c + 1, r, h10);
          const p11 = project(c + 1, r + 1, h11);
          const p01 = project(c, r + 1, h01);
          quads.push({
            sx: [p00.sx, p10.sx, p11.sx, p01.sx],
            sy: [p00.sy, p10.sy, p11.sy, p01.sy],
            depth: (p00.depth + p10.depth + p11.depth + p01.depth) / 4,
            color,
            sh,
          });
        }
      }

      quads.sort((a, b) => a.depth - b.depth);
      for (const q of quads) {
        const [cr, cg, cb] = q.color;
        ctx.fillStyle = `rgb(${Math.round(cr * q.sh)},${Math.round(cg * q.sh)},${Math.round(cb * q.sh)})`;
        ctx.beginPath();
        ctx.moveTo(q.sx[0], q.sy[0]);
        ctx.lineTo(q.sx[1], q.sy[1]);
        ctx.lineTo(q.sx[2], q.sy[2]);
        ctx.lineTo(q.sx[3], q.sy[3]);
        ctx.closePath();
        ctx.fill();
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [H, az, el]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, az, el };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    setAz(drag.az + dx * 0.4);
    setEl(Math.min(EL_MAX, Math.max(EL_MIN, drag.el - dy * 0.4)));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };
  const onDoubleClick = () => {
    setAz(DEFAULT_AZ);
    setEl(DEFAULT_EL);
  };

  const directional = lay !== "iso";

  return (
    <div className="filter-demo">
      <div
        ref={wrapRef}
        className="filter-demo-canvas areal-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={onDoubleClick}
      >
        <canvas ref={canvasRef} role="img" aria-label={`Synthesized areal surface, ${lay} lay, rotatable — drag to orbit`} />
        <span className="areal-rotate-hint" aria-hidden="true">⟲ drag to rotate · double-click to reset</span>
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
