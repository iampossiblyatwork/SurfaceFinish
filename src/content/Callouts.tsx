import { Lesson, Callout } from "./Lesson";

// ─── ISO 1302 surface texture symbol SVG components ──────────────────────────
//
// All diagrams share the same base geometry (viewBox 0 0 80 86):
//   left-tip (4,44) → apex (18,76) → right-top (22,8) → shelf-end
//
// The left leg is shorter (~60° from horizontal); the right leg is taller
// (~87°, nearly vertical). This matches the proportions in the standard.

const SS = {
  stroke: "currentColor",
  strokeWidth: 2.5,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// One of the three base symbols at small size.
function SmallSym({ variant, shelfEnd = 76 }: {
  variant: "basic" | "required" | "prohibited";
  shelfEnd?: number;
}) {
  return (
    <svg viewBox={`0 0 ${shelfEnd + 4} 86`} className="tex-sym-base">
      <polyline points={`4,44 18,76 22,8 ${shelfEnd},8`} {...SS} />
      {variant === "required" && (
        // Short horizontal bar crossing the left leg at mid-height.
        <line x1={6} y1={60} x2={30} y2={60} {...SS} />
      )}
      {variant === "prohibited" && (
        // Small circle inside the angle of the symbol.
        <circle cx={15} cy={58} r={9} {...SS} />
      )}
    </svg>
  );
}

// Large annotated diagram showing where fields a–e sit.
// viewBox 0 0 290 190
function AnnotatedSym() {
  const ac = "var(--accent)";
  const go = "var(--good)";
  const mu = "var(--muted)";
  const font = "system-ui, sans-serif";

  return (
    <svg viewBox="0 0 290 190" className="tex-sym-annotated">
      {/* Main symbol body */}
      <polyline points="7,108 28,176 33,38 283,38" {...SS} />
      {/* Second horizontal line above the shelf (used when 'c' is specified) */}
      <line x1={33} y1={18} x2={283} y2={18} {...SS} />

      {/* ── Zone labels ──────────────────────────────────────────── */}
      {/* c — above the second line */}
      <text x={40} y={6} fill={go} fontSize={11} dominantBaseline="hanging"
        fontFamily={font} fontWeight="bold">c</text>
      <text x={54} y={6} fill={go} fontSize={10} dominantBaseline="hanging"
        fontFamily={font}>manufacturing method</text>

      {/* a — between the two lines */}
      <text x={40} y={20} fill={ac} fontSize={11} dominantBaseline="hanging"
        fontFamily={font} fontWeight="bold">a</text>
      <text x={54} y={20} fill={ac} fontSize={10} dominantBaseline="hanging"
        fontFamily={font}>upper parameter specification</text>

      {/* b — below the shelf */}
      <text x={40} y={42} fill={ac} fontSize={11} dominantBaseline="hanging"
        fontFamily={font} fontWeight="bold">b</text>
      <text x={54} y={42} fill={ac} fontSize={10} dominantBaseline="hanging"
        fontFamily={font}>second specification (optional)</text>

      {/* d — lay direction, sits below shelf near the right leg */}
      <text x={36} y={57} fill={mu} fontSize={11} dominantBaseline="hanging"
        fontFamily={font} fontWeight="bold">d</text>
      <text x={50} y={57} fill={mu} fontSize={10} dominantBaseline="hanging"
        fontFamily={font}>lay direction</text>

      {/* e — machining allowance, on the left leg */}
      {/* Left-leg midpoint: ~(17, 142). Label goes to the left. */}
      <text x={2} y={132} fill={mu} fontSize={11} dominantBaseline="hanging"
        fontFamily={font} fontWeight="bold">e</text>
      {/* Tick line pointing to left leg */}
      <line x1={10} y1={139} x2={18} y2={139} stroke={mu} strokeWidth={1.2} />
    </svg>
  );
}

// Filled-in example callout, the form you'd actually see on a drawing.
// Shows  "Ra 1.6"  above the shelf of a basic symbol.
function FilledExample({ upper, lower, lay }: {
  upper: string;
  lower?: string;
  lay?: string;
}) {
  const shelfY = 18;
  const viewH = lower ? 110 : 90;
  return (
    <svg viewBox={`0 0 200 ${viewH}`} className="tex-sym-filled">
      <polyline points={`4,${viewH - 14} 18,${viewH + 2} 22,${shelfY} 196,${shelfY}`} {...SS} />
      {/* upper param spec — sits just above the shelf */}
      <text x={28} y={shelfY - 3} fill="currentColor" fontSize={13}
        dominantBaseline="auto" fontFamily="system-ui, sans-serif">
        {upper}
      </text>
      {lower && (
        <text x={28} y={shelfY + 14} fill="currentColor" fontSize={11}
          dominantBaseline="hanging" fontFamily="system-ui, sans-serif">
          {lower}
        </text>
      )}
      {lay && (
        <text x={28} y={shelfY + (lower ? 28 : 14)} fill="var(--muted)"
          fontSize={10} dominantBaseline="hanging" fontFamily="system-ui, sans-serif">
          lay: {lay}
        </text>
      )}
    </svg>
  );
}

// ─── Data tables ──────────────────────────────────────────────────────────────

const LAY = [
  { sym: "=", meaning: "Parallel to the plane of projection of the view the symbol is used in." },
  { sym: "⟂", meaning: "Perpendicular to the plane of projection of the view." },
  { sym: "X", meaning: "Crossed in two oblique directions relative to the plane of projection." },
  { sym: "M", meaning: "Multidirectional." },
  { sym: "C", meaning: "Approximately circular relative to the center of the surface." },
  { sym: "R", meaning: "Approximately radial relative to the center of the surface." },
  { sym: "P", meaning: "Particulate, non-directional, or protuberant." },
];

const FORMAT = [
  { f: "D", d: "Tolerance direction — Upper (U) or Lower (L) limit." },
  { f: "F", d: "Filter type, e.g. Gaussian." },
  { f: "S", d: "Short filter cutoff λs (noise removal)." },
  { f: "L", d: "Long filter cutoff λc (waviness removal)." },
  { f: "R", d: "Profile algorithm — Primary (P), Roughness (R), or Waviness (W)." },
  { f: "Z", d: "Parameter type, e.g. 'a' = arithmetic mean, 'z' = average peak-to-valley." },
  { f: "N", d: "Assessment length as a multiple of the sampling length — usually 5." },
  { f: "C", d: "Comparison rule — 'max' vs the '16% rule'." },
  { f: "V", d: "Specified value, in micrometers (µm)." },
];

// ─── Page component ───────────────────────────────────────────────────────────

export function Callouts() {
  return (
    <Lesson
      title="Callouts & Standards"
      intro="The surface texture symbol on a drawing packs the entire measurement recipe — parameter, filters, evaluation length, and acceptance rule — into one compact callout. Here's how to read it."
    >
      <h2>The three base symbols</h2>
      <p>Each variant of the symbol signals how the surface must be produced:</p>

      <div className="tex-sym-row">
        <figure className="tex-sym-item">
          <SmallSym variant="basic" />
          <figcaption>Basic symbol — surface texture required; manufacturing method unspecified.</figcaption>
        </figure>
        <figure className="tex-sym-item">
          <SmallSym variant="required" />
          <figcaption>Material removal required — the surface must be machined.</figcaption>
        </figure>
        <figure className="tex-sym-item">
          <SmallSym variant="prohibited" />
          <figcaption>Material removal prohibited — surface left as-produced (e.g. as-cast).</figcaption>
        </figure>
      </div>

      <h2>What sits around the symbol</h2>
      <p>Five positions surround the symbol, each carrying a specific piece of information:</p>

      <figure className="tex-sym-annotated-wrap">
        <AnnotatedSym />
        <figcaption className="tex-sym-cap">
          Fields <span style={{ color: "var(--accent)" }}>a</span> and{" "}
          <span style={{ color: "var(--accent)" }}>b</span> carry the parameter
          specifications. <span style={{ color: "var(--good)" }}>c</span> names
          the manufacturing method (and requires the second horizontal line).{" "}
          <span style={{ color: "var(--muted)" }}>d</span> is the lay direction
          symbol. <span style={{ color: "var(--muted)" }}>e</span> is the
          machining allowance in mm.
        </figcaption>
      </figure>

      <h2>Common examples</h2>
      <div className="tex-sym-row">
        <figure className="tex-sym-item">
          <FilledExample upper="Ra 1.6" />
          <figcaption>Arithmetic mean roughness Ra ≤ 1.6 µm — the most common callout.</figcaption>
        </figure>
        <figure className="tex-sym-item">
          <FilledExample upper="Ra 0.8" lower="Rz 6.3" lay="=" />
          <figcaption>Two specs: Ra ≤ 0.8 and Rz ≤ 6.3 µm; lay parallel to the view plane.</figcaption>
        </figure>
      </div>

      <h2>Parameter specification format</h2>
      <p>The "a"/"b" field follows the form <code>D&nbsp;F&nbsp;S-L / R&nbsp;Z&nbsp;N&nbsp;C&nbsp;V</code>:</p>
      <table className="lesson-table">
        <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
        <tbody>
          {FORMAT.map((r) => (
            <tr key={r.f}><td><strong>{r.f}</strong></td><td>{r.d}</td></tr>
          ))}
        </tbody>
      </table>
      <Callout label="Reading an example">
        <code>U Gaussian 0.0025-0.8 / Rz 5 max 3.2</code> → upper limit, Gaussian
        filter, λs&nbsp;0.0025&nbsp;mm to λc&nbsp;0.8&nbsp;mm, roughness profile,
        Rz parameter, 5 sampling lengths, max rule, value 3.2&nbsp;µm.
      </Callout>

      <h2>Lay direction symbols (field d)</h2>
      <table className="lesson-table">
        <thead><tr><th>Symbol</th><th>Lay direction</th></tr></thead>
        <tbody>
          {LAY.map((r) => (
            <tr key={r.sym}><td className="lay-sym">{r.sym}</td><td>{r.meaning}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Relevant standards</h2>
      <ul className="lesson-standards">
        <li><strong>ISO 4287</strong> — Profile method: terms, definitions, and parameters.</li>
        <li><strong>ISO 4288</strong> — Profile method: rules and procedures for assessment.</li>
        <li><strong>ISO 3274</strong> — Nominal characteristics of contact (stylus) instruments.</li>
        <li><strong>ISO 25178</strong> — Areal (3D) surface texture.</li>
        <li><strong>ISO 1302 / ASME B46.1</strong> — Indication of surface texture &amp; N-grades.</li>
      </ul>
    </Lesson>
  );
}
