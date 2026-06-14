import { Lesson, Callout } from "./Lesson";

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
      intro="A contact profilometer can only report what its tip can physically reach. The tip's radius and angle set a hard limit on the finest features you can resolve — a limit that exists before any digital filter is applied."
    >
      <Callout label="Note on sources">
        This page is authored from ISO 3274 (nominal characteristics of contact
        stylus instruments). It's a placeholder for the dedicated stylus deck —
        once that's available the values and figures here should be checked
        against it.
      </Callout>

      <h2>The tip is a cone with a rounded point</h2>
      <p>
        A standard stylus is a diamond cone ending in a spherical tip. Two numbers
        define it:
      </p>
      <ul>
        <li>
          <strong>Tip radius (r<sub>tip</sub>)</strong> — the radius of the
          spherical end. Standard values are <strong>2&nbsp;µm, 5&nbsp;µm, and
          10&nbsp;µm</strong>.
        </li>
        <li>
          <strong>Cone angle</strong> — typically <strong>60°</strong> or{" "}
          <strong>90°</strong>. The angle limits how steeply the flanks can dive
          into a narrow valley.
        </li>
      </ul>

      <h2>Mechanical filtering — the tip is its own low-pass</h2>
      <p>
        A finite tip cannot enter a valley narrower than itself. It rides over
        fine peaks and bridges across narrow troughs, geometrically rounding off
        short wavelengths. This <strong>mechanical filtering</strong> happens in
        the physical contact, distinct from (and in addition to) the λs electrical
        filter. Effectively the recorded profile is the surface{" "}
        <em>dilated</em> by the tip shape — features sharper than the tip are
        smoothed, valley bottoms are not fully reached.
      </p>

      <Callout label="Consequence">
        Too large a tip for the surface and you under-report roughness in fine
        valleys; too aggressive a force and you can scratch a soft part. The tip
        must be matched to the cutoff and the surface.
      </Callout>

      <h2>Matching tip, λs, and cutoff (ISO 3274)</h2>
      <p>
        Tip radius, the short cutoff λs, the maximum sampling spacing, and the
        long cutoff λc are all linked. Pick a cutoff and the rest follow:
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

      <h2>Measuring force</h2>
      <p>
        The stylus presses down with a small static force (nominally on the order
        of <strong>0.75&nbsp;mN</strong> at the standard tip) plus a force that
        varies with deflection. Enough to keep contact and track the surface;
        little enough to avoid plowing a groove in softer materials. Both the
        static force and its gradient are specified by the instrument standard.
      </p>

      <p className="lesson-source">Governed by ISO 3274 (contact stylus instruments) and ISO 4288 (assessment rules).</p>
    </Lesson>
  );
}
