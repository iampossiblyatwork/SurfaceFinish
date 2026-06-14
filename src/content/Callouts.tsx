import { Lesson, Callout } from "./Lesson";

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
  { f: "F", d: "Filter type, e.g. “Gaussian”." },
  { f: "S", d: "Short filter cutoff λs (noise removal)." },
  { f: "L", d: "Long filter cutoff λc (waviness removal)." },
  { f: "R", d: "Profile algorithm — Primary (P), Roughness (R), or Waviness (W)." },
  { f: "Z", d: "Parameter type, e.g. “a” = arithmetic mean, “z” = average peak-to-valley." },
  { f: "N", d: "Assessment length as a multiple of the sampling length — usually 5." },
  { f: "C", d: "Comparison rule — “max” vs the “16% rule”." },
  { f: "V", d: "Specified value, in micrometers (µm)." },
];

export function Callouts() {
  return (
    <Lesson
      title="Callouts & Standards"
      intro="The surface texture symbol on a drawing packs the entire measurement recipe — parameter, filters, evaluation length, and acceptance rule — into one compact callout. Here's how to read it."
    >
      <h2>The three base symbols</h2>
      <ul>
        <li><strong>Basic symbol</strong> — surface texture required; manufacturing method unspecified.</li>
        <li><strong>Material removal required</strong> — the surface must be machined (added horizontal bar).</li>
        <li><strong>Material removal prohibited</strong> — surface left as-produced, e.g. as-cast (added circle).</li>
      </ul>

      <h2>What sits around the symbol</h2>
      <ul>
        <li><strong>a</strong> — primary surface parameter specification.</li>
        <li><strong>b</strong> — secondary surface parameter specification.</li>
        <li><strong>c</strong> — required manufacturing method.</li>
        <li><strong>d</strong> — required lay orientation.</li>
        <li><strong>e</strong> — required minimum material removal (machining allowance).</li>
      </ul>

      <h2>Parameter specification format</h2>
      <p>The “a”/“b” field follows the form <code>D&nbsp;F&nbsp;S-L / R&nbsp;Z&nbsp;N&nbsp;C&nbsp;V</code>:</p>
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
