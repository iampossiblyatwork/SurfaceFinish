import { Lesson, Callout } from "./Lesson";
import processingChain from "../assets/processing-chain.png";

export function Overview() {
  return (
    <Lesson
      title="What is surface finish?"
      intro="Ask for “the surface finish” and you're almost always being asked for Ra — one number pulled from a measured trace. This reference shows where that number comes from and what the others mean."
    >
      <h2>Ra in one line</h2>
      <p>
        Ra is the average roughness height — easy to compare and universally
        specified. But two very different surfaces can share the same Ra, so on
        its own it rarely tells you <em>why</em> a part performs the way it does.
      </p>

      <Callout label="Start here">
        <ul className="start-here">
          <li>
            <strong>Meeting Spec in the Real World</strong> — a bare callout with
            no filter or parameter? Start here.
          </li>
          <li>
            <strong>Filtering → Choosing a cutoff</strong> — pick the right filter
            when the drawing doesn't give you one.
          </li>
          <li>
            <strong>Surface Finish Profilers</strong> — what each parameter means,
            with a live value you can drive.
          </li>
          <li>
            <strong>Tools → Trace generator</strong> — change a surface and watch
            the numbers move.
          </li>
        </ul>
      </Callout>

      <p className="lesson-source">
        New to the theory? <strong>The ISO processing chain</strong> (next page)
        shows how a raw stylus trace becomes a roughness number.
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
