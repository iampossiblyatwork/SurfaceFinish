import { Lesson, Callout } from "./Lesson";
import { ArealSurface } from "../components/ArealSurface";

const S_PARAMS = [
  { s: "Sa", name: "Arithmetic mean height", r: "Ra", meaning: "Average absolute height over the whole area." },
  { s: "Sq", name: "Root-mean-square height", r: "Rq", meaning: "RMS height — more sensitive to outliers than Sa." },
  { s: "Sz", name: "Maximum height", r: "Rz / Rt", meaning: "Highest peak to lowest valley across the surface." },
  { s: "Sp", name: "Maximum peak height", r: "Rp", meaning: "Highest point above the mean plane." },
  { s: "Sv", name: "Maximum pit depth", r: "Rv", meaning: "Deepest point below the mean plane." },
  { s: "Ssk", name: "Skewness", r: "Rsk", meaning: "Asymmetry of heights — negative favours plateaus with pits." },
  { s: "Sku", name: "Kurtosis", r: "Rku", meaning: "Spikiness of the height distribution (3 = Gaussian)." },
  { s: "Sdq", name: "Root-mean-square gradient", r: "RΔq", meaning: "RMS surface slope — relates to gloss and sealing." },
  { s: "Sdr", name: "Developed interfacial area ratio", r: "—", meaning: "Extra true surface area vs. the flat footprint (%)." },
];

export function ThreeD() {
  return (
    <Lesson
      title="3D Surface Finish"
      intro="Everything so far has measured a single 2D line across the surface. Areal (3D) metrology measures a whole patch — and for surfaces with multidirectional or particulate lay, that's the only honest way to characterize them."
    >
      <h2>Why go areal?</h2>
      <p>
        A 2D trace assumes the surface looks the same whichever line you pick.
        That holds for clean unidirectional lay (turning, grinding) but breaks
        down for blasted, lapped, EDM, or cast surfaces with no preferred
        direction. Areal measurement captures the texture in both axes at once.
        These instruments are also excellent for volumetric wear, failure
        analysis, and step-height metrology.
      </p>

      <h2>A synthesized areal surface</h2>
      <p>
        Here is a generated areal patch with its S-parameters computed live over
        the entire surface. Switch the lay or regenerate to see how the numbers
        move:
      </p>
      <ArealSurface />

      <h2>How it works — same ideas, one more axis</h2>
      <ul>
        <li><strong>3D filters</strong> act along two axes instead of one.</li>
        <li>
          <strong>3D parameters</strong> evaluate hill-to-trough across a surface
          rather than peak-to-valley along a line.
        </li>
      </ul>

      <Callout label="The S-parameters">
        Where 2D profile parameters carry an <strong>R</strong> prefix, areal
        parameters carry an <strong>S</strong> prefix — and most map closely onto
        their profile cousins.
      </Callout>

      <h2>Areal parameter reference</h2>
      <table className="lesson-table">
        <thead>
          <tr><th>S-param</th><th>Name</th><th>2D analog</th><th>What it tells you</th></tr>
        </thead>
        <tbody>
          {S_PARAMS.map((p) => (
            <tr key={p.s}>
              <td><strong>{p.s}</strong></td>
              <td>{p.name}</td>
              <td>{p.r}</td>
              <td>{p.meaning}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Instruments</h2>
      <p>
        Common 3D surface finish equipment includes KLA, Zygo, and Bruker
        (interferometry) and Keyence (confocal microscopy) — optical, non-contact
        methods rather than a dragged stylus.
      </p>

      <p className="lesson-source">Areal texture is governed by ISO 25178 (GPS — Surface texture: Areal).</p>
    </Lesson>
  );
}
