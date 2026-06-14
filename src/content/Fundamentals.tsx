import { Lesson, Callout } from "./Lesson";
import processingChain from "../assets/processing-chain.png";

export function Overview() {
  return (
    <Lesson
      title="What is surface finish?"
      intro="When someone asks “what's the surface finish?” they're almost always asking “what's the Ra value?” But Ra is just one number squeezed out of a long chain of measurement and filtering. This reference walks that whole chain, then every parameter that comes out the other end."
    >
      <h2>The everyday meaning</h2>
      <p>
        In a shop, “surface finish” is shorthand for Ra — the arithmetic mean
        roughness. It's stable, universally specified, and easy to compare. It's
        also, on its own, a blunt instrument: two very different surfaces can
        share the same Ra. Ra tells you the process hasn't drifted badly; it
        rarely tells you <em>why</em> a part performs the way it does.
      </p>

      <h2>The ISO meaning</h2>
      <p>
        ISO is more precise. It defines a sequence of <strong>profiles</strong>,
        each derived from the last by a filter:
      </p>
      <Callout label="Total profile (ISO 3274)">
        The digital form of the traced profile relative to the reference,
        with vertical and horizontal coordinates assigned to each other.
      </Callout>
      <Callout label="Primary profile (ISO 3274)">
        The total profile after the short-wavelength filter <em>λs</em> removes
        noise. Still contains both roughness and waviness.
      </Callout>
      <Callout label="Roughness profile (ISO 4287)">
        Derived from the primary profile by suppressing the long-wave component
        with the profile filter <em>λc</em> — the cutoff usually written on your
        drawing. This profile is intentionally modified, and it is the basis for
        evaluating roughness parameters such as Ra and Rz.
      </Callout>

      <h2>Where this app goes next</h2>
      <p>
        The <strong>Filtering</strong> section explains how a raw trace becomes a
        roughness profile and how to pick the cutoff. The{" "}
        <strong>Profilers</strong> section then defines every amplitude, spacing,
        and hybrid parameter computed from that profile — each with a live value
        you can drive from a synthesized trace.
      </p>
    </Lesson>
  );
}

export function ProcessingChain() {
  return (
    <Lesson
      title="The ISO processing chain"
      intro="Every roughness number starts as a raw stylus trace and is transformed in stages. Knowing the stage you're looking at is half the battle."
    >
      <figure className="lesson-figure">
        <img src={processingChain} alt="ISO surface texture processing road map: total profile through form removal, λs and λc filters, into roughness and waviness profiles and their parameters." />
        <figcaption>
          The full ISO processing road map — from the total profile through form
          removal and the λs/λc filters to the roughness and waviness profiles
          and their parameters.
        </figcaption>
      </figure>

      <ol className="lesson-steps">
        <li>
          <strong>Step 1 — Collect raw data.</strong> The trace with no form
          removal applied. Note this still isn't the truly raw instrument signal:
          calibrations and stylus corrections are already baked in.
        </li>
        <li>
          <strong>Step 2 — Form removal.</strong> Level the profile or subtract a
          least-squares arc/line (or, for bearing profiles, a log curve or
          polynomial). Example: removing a 79&nbsp;mm radius from a curved part.
        </li>
        <li>
          <strong>Primary profile.</strong> The result of form removal. It still
          contains <em>both</em> roughness and waviness.
        </li>
        <li>
          <strong>Step 3 — Apply the λc filter.</strong> A Gaussian filter splits
          the primary profile by wavelength at the cutoff.
        </li>
        <li>
          <strong>Waviness</strong> = the <em>low-pass</em> result (wavelengths
          longer than λc are kept). <strong>Roughness</strong> = the{" "}
          <em>high-pass</em> result (wavelengths shorter than λc are kept).
        </li>
      </ol>

      <Callout label="Key point">
        When someone asks for “surface finish,” it's the <strong>roughness
        profile</strong> — the high-pass result at the specified cutoff — that
        gets evaluated for Ra, Rz, and the rest.
      </Callout>

      <p className="lesson-source">
        Governed by ISO 3274 (instrument &amp; primary profile) and ISO 4287
        (roughness/waviness profiles and parameters).
      </p>
    </Lesson>
  );
}
