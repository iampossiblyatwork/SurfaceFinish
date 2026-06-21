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

// Worked example: how a bearing-ratio (Rmr) callout reads on the material-ratio
// curve. An idealized plateau surface that just meets "Rmr c0.3 = 90%": at the
// section depth c = 0.3 µm below the highest peak, 90% of the length is solid.
function BearingCallout() {
  const x0 = 50, x1 = 320, yTop = 30, yBot = 170;
  const xOf = (mr: number) => x0 + (x1 - x0) * mr;
  const yOf = (d: number) => yTop + (yBot - yTop) * d; // d in µm, Rt = 1 µm
  // Plateau-then-cliff bearing curve: shallow depth across most of the ratio,
  // then a steep plunge into the valleys past 90%.
  const depth = (mr: number) =>
    mr <= 0.9 ? 0.3 * Math.pow(mr / 0.9, 1.8) : 0.3 + 0.7 * Math.pow((mr - 0.9) / 0.1, 0.7);
  const pts = Array.from({ length: 81 }, (_, i) => {
    const mr = i / 80;
    return `${xOf(mr).toFixed(1)},${yOf(depth(mr)).toFixed(1)}`;
  }).join(" ");
  const xSpec = xOf(0.9);
  const ySpec = yOf(0.3);
  const amber = "#e3a857";
  const yMid = (yTop + yBot) / 2;
  return (
    <svg viewBox="0 0 340 200" className="bearing-callout" role="img"
      aria-label="Reading an Rmr c = 90% callout on the material-ratio curve">
      <line x1={x0} y1={yTop} x2={x0} y2={yBot} stroke="var(--muted)" strokeWidth={1} />
      <line x1={x0} y1={yBot} x2={x1} y2={yBot} stroke="var(--muted)" strokeWidth={1} />
      <polyline points={pts} fill="none" stroke="var(--good)" strokeWidth={2.4} strokeLinejoin="round" />
      {/* Spec construction: section depth c across to the 90% material ratio. */}
      <line x1={xSpec} y1={yTop} x2={xSpec} y2={yBot} stroke={amber} strokeWidth={1.3} strokeDasharray="4 3" />
      <line x1={x0} y1={ySpec} x2={xSpec} y2={ySpec} stroke={amber} strokeWidth={1.3} strokeDasharray="4 3" />
      <circle cx={xSpec} cy={ySpec} r={4} fill={amber} />
      <text x={(x0 + xSpec) / 2} y={ySpec - 6} fill={amber} fontSize={13} textAnchor="middle" fontFamily="system-ui, sans-serif">c = 0.3 µm</text>
      <text x={xSpec} y={yBot + 16} fill={amber} fontSize={13} textAnchor="middle" fontFamily="system-ui, sans-serif">90%</text>
      <text x={x0} y={yBot + 16} fill="var(--muted)" fontSize={11} textAnchor="middle" fontFamily="system-ui, sans-serif">0%</text>
      <text x={x1} y={yBot + 16} fill="var(--muted)" fontSize={11} textAnchor="middle" fontFamily="system-ui, sans-serif">100%</text>
      <text x={(x0 + x1) / 2} y={196} fill="var(--muted)" fontSize={11} textAnchor="middle" fontFamily="system-ui, sans-serif">material ratio →</text>
      <text x={44} y={yTop + 3} fill="var(--muted)" fontSize={10} textAnchor="end" fontFamily="system-ui, sans-serif">0</text>
      <text x={44} y={yBot} fill="var(--muted)" fontSize={10} textAnchor="end" fontFamily="system-ui, sans-serif">1 µm</text>
      <text x={16} y={yMid} fill="var(--muted)" fontSize={11} textAnchor="middle" fontFamily="system-ui, sans-serif" transform={`rotate(-90 16 ${yMid})`}>depth ↓</text>
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
        <figure className="tex-sym-item">
          <FilledExample upper="Rmr c0.3  90%" />
          <figcaption>A bearing-ratio spec: at least 90% material by section depth c = 0.3 µm — a lower limit, common on sealing and bearing surfaces.</figcaption>
        </figure>
      </div>

      <Details summary="Reading a bearing-ratio (Rmr) callout">
        <p>
          A material-ratio callout is read differently from Ra or Rz. Instead of
          a single height limit it fixes two things: a <strong>section depth c</strong>{" "}
          below the highest peak, and the <strong>material ratio (%)</strong> the
          surface must reach by that depth. Because more material means more
          load-bearing area, it is almost always a <strong>lower limit (≥)</strong>.
        </p>
        <figure className="lesson-figure">
          <BearingCallout />
          <figcaption>
            Drop a plane to depth c, then measure how much of the trace length is
            solid at that level — that is Rmr(c). Here the plane at c = 0.3 µm
            meets 90% material, so the surface passes <code>Rmr c0.3 = 90%</code>.
          </figcaption>
        </figure>
        <p>
          Plateau-honed surfaces — engine bores, seal faces — are designed for
          exactly this: a flat load-bearing top reaches a high material ratio at
          shallow depth, while the deep valleys below it hold oil. The bearing
          curve's fast early rise is what the callout is buying.
        </p>
        <Callout label="See it live">
          On the <strong>Material ratio curve</strong> page you can drag the
          lapping plane through a profile and watch Rmr(c) and the section depth c
          move together against the same 90% line.
        </Callout>
      </Details>

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
          { id: "prof-material", label: "Material ratio curve", note: "Drag the lapping plane — read Rmr live" },
        ]}
      />
    </Lesson>
  );
}
