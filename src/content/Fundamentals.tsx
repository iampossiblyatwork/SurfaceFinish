import { Lesson, Callout, Details } from "./Lesson";

// Native dark-mode recreation of the ISO road map: total profile → form removal
// → primary → λc split into waviness / roughness → parameters.
function ProcessingChainFlow() {
  return (
    <div className="flow" aria-hidden="true">
      <div className="flow-box">
        Total profile<small>raw trace, λs noise removed</small>
      </div>
      <div className="flow-arrow">
        ↓<span>form removal (level / de-arc)</span>
      </div>
      <div className="flow-box">
        Primary profile<small>roughness + waviness together</small>
      </div>
      <div className="flow-arrow">
        ↓<span>λc Gaussian filter</span>
      </div>
      <div className="flow-branch">
        <div className="flow-box flow-no">
          Waviness<small>low-pass · λ &gt; λc</small>
        </div>
        <div className="flow-box flow-yes">
          Roughness<small>high-pass · λ &lt; λc</small>
        </div>
      </div>
      <div className="flow-arrow">↓</div>
      <div className="flow-box flow-final">
        Ra · Rz · Rsk · …
        <small>evaluated on the roughness profile = &ldquo;surface finish&rdquo;</small>
      </div>
    </div>
  );
}

// A small hero: a roughness trace with its deviation area shaded — the picture
// behind the page's first sentence ("Ra is one number from a trace").
function HeroTrace() {
  const mean = 58;
  const v = (t: number) =>
    Math.sin(2 * Math.PI * 4 * t) +
    0.5 * Math.sin(2 * Math.PI * 9 * t + 1) +
    0.25 * Math.sin(2 * Math.PI * 15 * t + 2);
  const pts = Array.from({ length: 161 }, (_, i) => {
    const x = 10 + (340 * i) / 160;
    const y = mean - 19 * v(i / 160);
    return [x, y] as const;
  });
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `10,${mean} ${line} 350,${mean}`;
  return (
    <svg viewBox="0 0 360 108" className="hero-trace" role="img" aria-label="A surface roughness trace about its mean line">
      <polygon points={area} fill="var(--good)" opacity={0.22} />
      <line x1={10} y1={mean} x2={350} y2={mean} stroke="var(--muted)" strokeWidth={1} strokeDasharray="4 3" />
      <polyline points={line} fill="none" stroke="var(--accent)" strokeWidth={2.2} strokeLinejoin="round" />
    </svg>
  );
}

export function Overview({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const go = (id: string) => () => onNavigate?.(id);
  return (
    <Lesson
      title="What is surface finish?"
      intro="Ask for “the surface finish” and you're almost always being asked for Ra — one number pulled from a measured trace. This reference shows where that number comes from and what the others mean."
    >
      <HeroTrace />

      <h2>Ra in one line</h2>
      <p>
        Ra is the average roughness height — easy to compare and universally
        specified. But two very different surfaces can share the same Ra, so on
        its own it rarely tells you <em>why</em> a part performs the way it does.
      </p>

      <Callout label="Start here">
        <ul className="start-here">
          <li>
            <button type="button" className="nav-link" onClick={go("realworld")}>
              Meeting Spec in the Real World
            </button>{" "}
            — a bare callout with no filter or parameter? Start here.
          </li>
          <li>
            <button type="button" className="nav-link" onClick={go("callouts")}>
              Callouts &amp; Standards
            </button>{" "}
            — how to read the surface-finish symbol on a drawing.
          </li>
          <li>
            <button type="button" className="nav-link" onClick={go("filt-choosing")}>
              Choosing a cutoff
            </button>{" "}
            — pick the right filter when the drawing doesn't give you one.
          </li>
          <li>
            <button type="button" className="nav-link" onClick={go("prof-amplitude")}>
              Surface Finish Profilers
            </button>{" "}
            — what each parameter means, with a live value you can drive.
          </li>
          <li>
            <button type="button" className="nav-link" onClick={go("tool-generator")}>
              Trace generator
            </button>{" "}
            — change a surface and watch the numbers move.
          </li>
        </ul>
      </Callout>

      <p className="lesson-source">
        New to the theory?{" "}
        <button type="button" className="nav-link" onClick={go("fund-chain")}>
          The ISO processing chain
        </button>{" "}
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
        <ProcessingChainFlow />
        <figcaption>
          The ISO road map — from the total profile through form removal and the
          λc filter into the waviness and roughness profiles and their parameters.
        </figcaption>
      </figure>

      <Details summary="The stages in detail">
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
      </Details>

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
