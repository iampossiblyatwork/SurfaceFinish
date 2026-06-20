import { Lesson, Callout, Details, NextSteps } from "./Lesson";

// ─── ISO 1302 surface texture symbol SVG components ──────────────────────────
//
// Recreated (beautified) from the KLA reference deck. The symbol is a check /
// tick: a short left leg drops to a V-vertex, a tall right leg rises to the
// apex, and a horizontal shelf extends to the right from the apex.
//
//   L (left tip) → V (vertex) → A (apex) → shelf
//
// "Material removal required" closes a triangle across the vertex; "removal
// prohibited" inscribes a circle in the crook.

const SS = {
  stroke: "currentColor",
  strokeWidth: 2.5,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// Shared tick geometry for the small base symbols (viewBox 0 0 104 70).
const TICK = "8,36 24,60 48,10";

// One of the three base symbols at small size.
function SmallSym({ variant, shelfEnd = 100 }: {
  variant: "basic" | "required" | "prohibited";
  shelfEnd?: number;
}) {
  return (
    <svg viewBox={`0 0 ${shelfEnd + 4} 70`} className="tex-sym-base">
      <polyline points={`${TICK} ${shelfEnd},10`} {...SS} />
      {variant === "required" && (
        // Bar closing the triangle across the vertex = material must be removed.
        <line x1={8} y1={36} x2={35.5} y2={36} {...SS} />
      )}
      {variant === "prohibited" && (
        // Circle inscribed in the crook, tangent to both legs (center on the
        // angle bisector at the vertex) = material removal prohibited.
        <circle cx={22.9} cy={43.9} r={8} {...SS} />
      )}
    </svg>
  );
}

// Large annotated diagram showing where fields a–e sit (recreated from the deck
// legend: single shelf, e left of the leg, c top-right, a below the shelf, b
// under a, d below-middle). viewBox 0 0 340 200.
function AnnotatedSym() {
  const ac = "var(--accent)";
  const go = "var(--good)";
  const mu = "var(--muted)";
  const T = {
    fontSize: 22,
    fontWeight: "bold" as const,
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
    fontFamily: "system-ui, sans-serif",
  };

  return (
    <svg viewBox="0 0 340 200" className="tex-sym-annotated">
      {/* Short left leg → vertex → tall right leg → horizontal shelf */}
      <polyline points="58,116 92,186 150,70 332,70" {...SS} />
      <text x={28} y={122} fill={mu} {...T}>e</text>
      <text x={252} y={38} fill={go} {...T}>c</text>
      <text x={252} y={100} fill={ac} {...T}>a</text>
      <text x={252} y={152} fill={ac} {...T}>b</text>
      <text x={170} y={152} fill={mu} {...T}>d</text>
    </svg>
  );
}

// Filled-in example callout, the form you'd actually see on a drawing.
function FilledExample({ upper, lower, lay }: {
  upper: string;
  lower?: string;
  lay?: string;
}) {
  const shelfY = 28;
  const viewH = lower ? 104 : 84;
  return (
    <svg viewBox={`0 0 210 ${viewH}`} className="tex-sym-filled">
      <polyline
        points={`8,${shelfY + 26} 24,${shelfY + 50} 48,${shelfY} 206,${shelfY}`}
        {...SS}
      />
      {/* upper param spec — sits just above the shelf */}
      <text x={54} y={shelfY - 5} fill="currentColor" fontSize={15}
        dominantBaseline="auto" fontFamily="system-ui, sans-serif">
        {upper}
      </text>
      {lower && (
        <text x={54} y={shelfY + 16} fill="currentColor" fontSize={13}
          dominantBaseline="hanging" fontFamily="system-ui, sans-serif">
          {lower}
        </text>
      )}
      {lay && (
        <text x={54} y={shelfY + (lower ? 34 : 16)} fill="var(--muted)"
          fontSize={12} dominantBaseline="hanging" fontFamily="system-ui, sans-serif">
          lay {lay}
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

export function Callouts({ onNavigate }: { onNavigate?: (id: string) => void }) {
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
          specifications, <span style={{ color: "var(--good)" }}>c</span> the
          manufacturing method, <span style={{ color: "var(--muted)" }}>d</span>{" "}
          the lay direction, and <span style={{ color: "var(--muted)" }}>e</span>{" "}
          the machining allowance (mm).
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

      <Details summary="Parameter specification format (the D F S-L / R Z N C V string)">
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
      </Details>

      <Details summary="Lay direction symbols (field d)">
      <table className="lesson-table">
        <thead><tr><th>Symbol</th><th>Lay direction</th></tr></thead>
        <tbody>
          {LAY.map((r) => (
            <tr key={r.sym}><td className="lay-sym">{r.sym}</td><td>{r.meaning}</td></tr>
          ))}
        </tbody>
      </table>
      </Details>

      <h2>Relevant standards</h2>
      <ul className="lesson-standards">
        <li><strong>ISO 4287</strong> — Profile method: terms, definitions, and parameters.</li>
        <li><strong>ISO 4288</strong> — Profile method: rules and procedures for assessment.</li>
        <li><strong>ISO 3274</strong> — Nominal characteristics of contact (stylus) instruments.</li>
        <li><strong>ISO 25178</strong> — Areal (3D) surface texture.</li>
        <li><strong>ISO 1302 / ASME B46.1</strong> — Indication of surface texture &amp; N-grades.</li>
      </ul>

      <NextSteps
        onNavigate={onNavigate}
        items={[
          { id: "realworld", label: "Meeting Spec in the Real World", note: "The callout gave no filter — now what?" },
          { id: "filt-choosing", label: "Choosing a cutoff", note: "Pick the filter the drawing left off" },
        ]}
      />
    </Lesson>
  );
}
