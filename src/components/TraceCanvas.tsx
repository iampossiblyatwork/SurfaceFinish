import { useEffect, useRef } from "react";
import type { Profile } from "../lib/roughness";

interface TraceCanvasProps {
  profile: Profile;
  height?: number;
  /** Draw axis labels and the mean line (off for tiny preview thumbnails). */
  detailed?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Renders a surface profile trace (height vs. lateral distance) on a canvas.
 * Width is responsive to the container; vertical scale auto-fits the profile so
 * fine and rough traces are both legible. Reused for thumbnails and full views.
 */
export function TraceCanvas({
  profile,
  height = 160,
  detailed = false,
  className,
  ariaLabel,
}: TraceCanvasProps) {
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
      const cssWidth = wrap.clientWidth || 300;
      const cssHeight = height;
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const styles = getComputedStyle(document.documentElement);
      const bg = styles.getPropertyValue("--surface-2").trim() || "#0c1219";
      const grid = styles.getPropertyValue("--grid").trim() || "#1c2733";
      const line = styles.getPropertyValue("--accent").trim() || "#5fb0ff";
      const mid = styles.getPropertyValue("--muted").trim() || "#7d8c9a";

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, cssWidth, cssHeight);

      const z = profile.z;
      const n = z.length;
      if (n === 0) return;

      const padX = detailed ? 8 : 2;
      const padY = detailed ? 14 : 6;
      const plotW = cssWidth - padX * 2;
      const plotH = cssHeight - padY * 2;
      const midY = padY + plotH / 2;

      // Symmetric vertical scale about the mean line.
      let maxAbs = 0;
      for (const v of z) {
        const a = Math.abs(v);
        if (a > maxAbs) maxAbs = a;
      }
      if (maxAbs === 0) maxAbs = 1;
      const yScale = (plotH / 2) / (maxAbs * 1.1);

      // Light grid.
      if (detailed) {
        ctx.strokeStyle = grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let g = 1; g < 4; g++) {
          const gx = padX + (plotW * g) / 4;
          ctx.moveTo(gx, padY);
          ctx.lineTo(gx, padY + plotH);
        }
        ctx.stroke();
      }

      // Mean line.
      ctx.strokeStyle = mid;
      ctx.setLineDash(detailed ? [4, 4] : []);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX, midY);
      ctx.lineTo(padX + plotW, midY);
      ctx.stroke();
      ctx.setLineDash([]);

      // The trace.
      ctx.strokeStyle = line;
      ctx.lineWidth = detailed ? 1.5 : 1;
      ctx.lineJoin = "round";
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const x = padX + (plotW * i) / (n - 1);
        const y = midY - z[i] * yScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [profile, height, detailed]);

  return (
    <div ref={wrapRef} className={className} style={{ width: "100%" }}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel ?? "Surface trace"} />
    </div>
  );
}
