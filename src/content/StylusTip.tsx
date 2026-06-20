import { Lesson, Callout, Details } from "./Lesson";

const acc = "var(--accent)";
const good = "var(--good)";
const mu = "var(--muted)";
const FONT = "system-ui, sans-serif";

// Diamond cone ending in a spherical tip: the two defining numbers are the tip
// radius (the circle) and the cone angle (between the flanks).
function TipGeometry() {
  const flank = { stroke: acc, strokeWidth: 2.2, fill: "none", strokeLinecap: "round" as const };
  return (
    <svg viewBox="0 0 220 168" className="stylus-fig" role="img" aria-label="Stylus tip: a cone ending in a spherical tip of radius r">
      <line x1={92.7} y1={106} x2={35.2} y2={10} {...flank} />
      <line x1={127.3} y1={106} x2={184.8} y2={10} {...flank} />
      <circle cx={110} cy={116} r={20} {...flank} />
      <line x1={18} y1={136} x2={202} y2={136} stroke={mu} strokeWidth={2} strokeLinecap="round" />
      <line x1={110} y1={116} x2={125.3} y2={128.9} stroke={good} strokeWidth={1.6} />
      <text x={134} y={132} fill={good} fontSize={13} fontWeight="bold" fontFamily={FONT}>r</text>
      <text x={110} y={28} fill={mu} fontSize={12} textAnchor="middle" fontFamily={FONT}>cone angle 60–90°</text>
      <text x={110} y={152} fill={mu} fontSize={11} textAnchor="middle" fontFamily={FONT}>workpiece surface</text>
    </svg>
  );
}

// The finite tip reaches into a wide valley but bridges a narrow one — so the
// recorded profile (dashed) is the surface "dilated" by the tip shape.
function MechFilter() {
  return (
    <svg viewBox="0 0 380 200" className="stylus-fig wide" role="img" aria-label="A finite stylus tip reaches a wide valley but bridges a narrow one">
      <polygon points="232,115 219,152 245,152" fill="#3a2a16" />
      <polyline
        points="10,80 70,80 85,124 135,124 150,80 200,74 232,152 264,74 320,80 345,96 372,82"
        fill="none" stroke="#b4bec8" strokeWidth={2.2} strokeLinejoin="round"
      />
      <circle cx={110} cy={102} r={22} fill="none" stroke={good} strokeWidth={2.2} />
      <circle cx={232} cy={93} r={22} fill="none" stroke="#e3a857" strokeWidth={2.2} />
      <polyline
        points="10,58 85,58 110,120 140,58 200,52 255,52 320,58 372,60"
        fill="none" stroke={acc} strokeWidth={2} strokeDasharray="6 5" strokeLinejoin="round"
      />
      <text x={110} y={150} fill={good} fontSize={11} textAnchor="middle" fontFamily={FONT}>reaches</text>
      <text x={232} y={186} fill="#e3a857" fontSize={11} textAnchor="middle" fontFamily={FONT}>bridges — floor unseen</text>
      <text x={356} y={46} fill={acc} fontSize={11} textAnchor="end" fontFamily={FONT}>recorded</text>
    </svg>
  );
}

const TIP_TABLE = [
  { lc: "0.08", ratio: "30", ls: "2.5", rtip: "2", spacing: "0.5" },
  { lc: "0.25", ratio: "100", ls: "2.5", rtip: "2", spacing: "0.5" },
  { lc: "0.8", ratio: "300", ls: "2.5", rtip: "2", spacing: "0.5" },
  { lc: "2.5", ratio: "300", ls: "8", rtip: "5", spacing: "1.5" },
  { lc: "8", ratio: "300", ls: "25", rtip: "10", spacing: "5" },
];

export function StylusTip() {
  return (
    <Lesson
      title="Stylus Tip Geometry"
      intro="A contact profilometer can only report what its tip can physically reach. The tip's radius and angle set a hard limit on the finest features you can resolve — before any digital filter is applied."
    >
      <figure className="lesson-figure">
        <TipGeometry />
        <figcaption>
          A diamond cone ending in a spherical tip. Two numbers define it: the{" "}
          <strong>tip radius r</strong> (2, 5, or 10&nbsp;µm) and the{" "}
          <strong>cone angle</strong> (typically 60° or 90°).
        </figcaption>
      </figure>

      <h2>Mechanical filtering — the tip is its own low-pass</h2>
      <figure className="lesson-figure">
        <MechFilter />
        <figcaption>
          The tip drops into a valley wider than itself (green) but{" "}
          <strong>bridges any valley narrower than its radius</strong> (orange) —
          so the recorded profile (dashed) is the true surface rounded off, with
          deep narrow valleys never fully reached.
        </figcaption>
      </figure>
      <p>
        This happens in the physical contact, on top of the λs electrical filter.
        Too large a tip and you under-report roughness in fine valleys; too much
        force and you can scratch a soft part. The tip must be matched to the
        cutoff and the surface.
      </p>

      <Details summary="Matching tip, λs, and cutoff (ISO 3274)">
        <p>
          Tip radius, the short cutoff λs, the maximum sampling spacing, and the
          long cutoff λc are linked — pick a cutoff and the rest follow:
        </p>
        <table className="lesson-table">
          <thead>
            <tr>
              <th>λc (mm)</th>
              <th>λc/λs</th>
              <th>λs (µm)</th>
              <th>Max r<sub>tip</sub> (µm)</th>
              <th>Max spacing (µm)</th>
            </tr>
          </thead>
          <tbody>
            {TIP_TABLE.map((r) => (
              <tr key={r.lc}>
                <td>{r.lc}</td>
                <td>{r.ratio}</td>
                <td>{r.ls}</td>
                <td>{r.rtip}</td>
                <td>{r.spacing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Details>

      <Callout label="Measuring force">
        The stylus presses with a small static force (≈0.75&nbsp;mN at the standard
        tip) plus a deflection-dependent part — enough to track the surface, little
        enough not to plough a groove in softer materials.
      </Callout>

      <p className="lesson-source">Governed by ISO 3274 (contact stylus instruments) and ISO 4288 (assessment rules).</p>
    </Lesson>
  );
}
