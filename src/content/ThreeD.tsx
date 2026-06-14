import { Lesson, Callout } from "./Lesson";

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
        parameters carry an <strong>S</strong> prefix — and they map closely:
        <ul style={{ margin: "8px 0 0" }}>
          <li><strong>Sa</strong> — arithmetic mean height (areal Ra)</li>
          <li><strong>Sq</strong> — root-mean-square height (areal Rq)</li>
          <li><strong>Sz</strong> — maximum height of the surface (areal Rz/Rt)</li>
        </ul>
      </Callout>

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
