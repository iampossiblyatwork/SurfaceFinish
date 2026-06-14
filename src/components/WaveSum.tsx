import { useEffect, useRef, useState } from "react";
import { useUnits } from "../context/UnitsContext";
import { formatLength, formatLateral } from "../lib/grades";

/**
 * Interactive "adding sine waves" demo from the filtering lesson. Two component
 * sine waves and their sum are drawn live as the user changes amplitude and
 * wavelength. Pure client-side math — illustrative, not a measurement.
 */
export function WaveSum() {
  const { unit } = useUnits();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [a1, setA1] = useState(0.5);
  const [w1, setW1] = useState(3.0);
  const [a2, setA2] = useState(0.2);
  const [w2, setW2] = useState(0.6);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const draw = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = wrap.clientWidth || 300;
      const cssH = 220;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const styles = getComputedStyle(document.documentElement);
      const bg = styles.getPropertyValue("--surface-2").trim() || "#0c1219";
      const grid = styles.getPropertyValue("--grid").trim() || "#1c2733";
      const accent = styles.getPropertyValue("--accent").trim() || "#5fb0ff";
      const good = styles.getPropertyValue("--good").trim() || "#5fd0a0";
      const muted = styles.getPropertyValue("--muted").trim() || "#7d8c9a";

      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssW, cssH);

      const lengthMm = 6; // trace window
      const n = 600;
      const pad = 10;
      const plotW = cssW - pad * 2;
      const sumPanelH = cssH * 0.55;
      const compPanelH = cssH - sumPanelH;
      const sumMid = pad + (sumPanelH - pad) / 2;
      const compMid = sumPanelH + compPanelH / 2;

      // Vertical scales.
      const sumMax = (a1 + a2) * 1.15 || 1;
      const sumScale = (sumPanelH / 2 - pad) / sumMax;
      const compMax = Math.max(a1, a2) * 1.15 || 1;
      const compScale = (compPanelH / 2 - 4) / compMax;

      // Divider + mean lines.
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, sumPanelH);
      ctx.lineTo(cssW, sumPanelH);
      ctx.moveTo(pad, sumMid);
      ctx.lineTo(pad + plotW, sumMid);
      ctx.moveTo(pad, compMid);
      ctx.lineTo(pad + plotW, compMid);
      ctx.stroke();

      const plot = (
        fn: (x: number) => number,
        mid: number,
        scale: number,
        color: string,
        width: number,
      ) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineJoin = "round";
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const xmm = (lengthMm * i) / (n - 1);
          const x = pad + (plotW * i) / (n - 1);
          const y = mid - fn(xmm) * scale;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };

      const wave1 = (x: number) => a1 * Math.sin((2 * Math.PI * x) / w1);
      const wave2 = (x: number) => a2 * Math.sin((2 * Math.PI * x) / w2);

      // Component waves (lower panel).
      plot(wave1, compMid, compScale, accent, 1.5);
      plot(wave2, compMid, compScale, good, 1.5);

      // Sum (upper panel).
      plot((x) => wave1(x) + wave2(x), sumMid, sumScale, muted, 1.8);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [a1, w1, a2, w2]);

  return (
    <div className="wave-sum">
      <div ref={wrapRef} className="wave-sum-canvas">
        <canvas ref={canvasRef} role="img" aria-label="Two sine waves and their sum" />
      </div>
      <p className="wave-sum-caption">
        Top: the combined signal (what the stylus records). Bottom: the two
        component sine waves. A real surface is the sum of <em>many</em> such
        waves — which is exactly what the FFT recovers.
      </p>
      <div className="wave-sum-controls">
        <fieldset>
          <legend>Wave #1</legend>
          <label>
            Amplitude <span>{formatLength(a1, unit)}</span>
            <input type="range" min={0.05} max={1} step={0.01} value={a1}
              onChange={(e) => setA1(Number(e.target.value))} />
          </label>
          <label>
            Wavelength <span>{formatLateral(w1, unit)}</span>
            <input type="range" min={0.2} max={5} step={0.05} value={w1}
              onChange={(e) => setW1(Number(e.target.value))} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Wave #2</legend>
          <label>
            Amplitude <span>{formatLength(a2, unit)}</span>
            <input type="range" min={0.05} max={1} step={0.01} value={a2}
              onChange={(e) => setA2(Number(e.target.value))} />
          </label>
          <label>
            Wavelength <span>{formatLateral(w2, unit)}</span>
            <input type="range" min={0.2} max={5} step={0.05} value={w2}
              onChange={(e) => setW2(Number(e.target.value))} />
          </label>
        </fieldset>
      </div>
    </div>
  );
}
