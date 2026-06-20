import { Lesson, Callout } from "./Lesson";
import { WaveSum } from "../components/WaveSum";
import { SamplingLengthDemo } from "../components/SamplingLengthDemo";
import { GaussianFilterDemo } from "../components/GaussianFilterDemo";
import { CutoffChooserDemo } from "../components/CutoffChooserDemo";
import { useUnits } from "../context/UnitsContext";
import { formatLength, formatLateral, unitLabel } from "../lib/grades";

// Labelled sine wave: amplitude (A, height to a peak) and wavelength (λ,
// peak-to-peak) — the two numbers that define each component of a surface.
function SineAnatomy() {
  const acc = "var(--accent)";
  const good = "var(--good)";
  const mu = "var(--muted)";
  const mean = 80;
  const amp = 42;
  const per = 130;
  const sine = Array.from({ length: 121 }, (_, i) => {
    const x = 10 + (340 * i) / 120;
    const y = mean - amp * Math.sin((2 * Math.PI * (x - 10)) / per);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const p1 = 42.5;
  const p2 = 172.5;
  const ytop = 18;
  return (
    <svg viewBox="0 0 360 150" className="stylus-fig wide" role="img" aria-label="A sine wave labelled with amplitude A and wavelength λ">
      <line x1={10} y1={mean} x2={350} y2={mean} stroke={mu} strokeWidth={1.5} />
      <polyline points={sine} fill="none" stroke={acc} strokeWidth={2.4} strokeLinejoin="round" />
      <line x1={p1} y1={mean} x2={p1} y2={mean - amp} stroke={good} strokeWidth={1.8} />
      <text x={p1 + 7} y={mean - amp / 2 + 4} fill={good} fontSize={14} fontWeight="bold" fontFamily="system-ui, sans-serif">A</text>
      <line x1={p1} y1={mean - amp} x2={p1} y2={ytop} stroke={mu} strokeWidth={1} strokeDasharray="3 3" />
      <line x1={p2} y1={mean - amp} x2={p2} y2={ytop} stroke={mu} strokeWidth={1} strokeDasharray="3 3" />
      <line x1={p1} y1={ytop} x2={p2} y2={ytop} stroke={good} strokeWidth={1.8} />
      <text x={(p1 + p2) / 2} y={ytop - 4} fill={good} fontSize={14} fontWeight="bold" textAnchor="middle" fontFamily="system-ui, sans-serif">λ</text>
    </svg>
  );
}

export function FilteringCutoffs({ onNavigate }: { onNavigate?: (id: string) => void }) {
  const { unit } = useUnits();
  return (
    <Lesson
      title="Cutoffs & sampling length"
      intro="The cutoff is the single most consequential choice in a surface finish measurement — it decides what counts as roughness and what counts as waviness."
    >
      <Callout label="In a hurry?">
        Just need to pass a part? Skip the theory and go straight to{" "}
        <button type="button" className="nav-link" onClick={() => onNavigate?.("filt-choosing")}>
          Choosing a cutoff
        </button>{" "}
        for the filter-picker, or{" "}
        <button type="button" className="nav-link" onClick={() => onNavigate?.("realworld")}>
          Meeting Spec in the Real World
        </button>
        . This section explains the <em>why</em> behind filtering.
      </Callout>

      <Callout label="The terms are synonyms">
        <strong>Cutoff</strong>, <strong>sampling length</strong>, and{" "}
        <strong>filter length</strong> all refer to the same wavelength, λc.
      </Callout>

      <h2>What the cutoff does</h2>
      <p>
        The cutoff λc is the wavelength of the Gaussian profile filter. Anything{" "}
        <em>longer</em> than the cutoff is treated as waviness; anything{" "}
        <em>shorter</em> is treated as roughness. The same physical{" "}
        {formatLateral(0.5, unit)} undulation is &ldquo;waviness&rdquo; under a{" "}
        {formatLateral(0.25, unit)} cutoff but &ldquo;roughness&rdquo; under
        a {formatLateral(0.8, unit)} cutoff. Nothing about the surface changed — only the
        cutoff did.
      </p>

      <h2>Two cutoffs, not one</h2>
      <p>A roughness measurement is band-limited by two filters:</p>
      <ul>
        <li>
          <strong>λs (short cutoff)</strong> removes noise and features finer
          than the stylus can faithfully report — this produces the{" "}
          <em>primary profile</em>.
        </li>
        <li>
          <strong>λc (long cutoff)</strong> removes waviness — this produces the{" "}
          <em>roughness profile</em>.
        </li>
      </ul>

      <h2>Sampling vs. evaluation length</h2>
      <p>
        One <strong>sampling length</strong> equals one cutoff (λc). The{" "}
        <strong>evaluation length</strong> is normally five sampling lengths
        (the “N&nbsp;=&nbsp;5” you see in callouts). Averaging parameters over
        five sampling lengths is what gives Ra its famous stability. Drag the
        cutoff below to see the bands resize:
      </p>
      <SamplingLengthDemo />
      <p className="lesson-source">It is the design engineer's call which cutoff applies — look for it on the callout or in the notes.</p>
    </Lesson>
  );
}

export function FilteringFFT() {
  return (
    <Lesson
      title="Sine waves & the FFT"
      intro="Filtering only makes sense once you see a surface as a stack of sine waves. The Fourier transform is the tool that pulls them apart."
    >
      <h2>Anatomy of a sine wave</h2>
      <figure className="lesson-figure">
        <SineAnatomy />
        <figcaption>
          Two numbers define each wave: <strong>amplitude A</strong> (height to a
          peak) and <strong>wavelength λ</strong> (peak to peak). Phase shifts it
          sideways; a vertical shift moves the whole wave up or down.
        </figcaption>
      </figure>

      <h2>Adding waves</h2>
      <p>
        Real surfaces are sums of many sine waves of different amplitudes and
        wavelengths. Drag the controls below to build a combined signal from two
        components and watch the sum change.
      </p>
      <WaveSum />

      <h2>The Fourier transform</h2>
      <Callout label="Fourier analysis">
        Converts a signal from its original domain (here, space) into the{" "}
        <strong>frequency domain</strong> — and back again.
      </Callout>
      <p>
        For surface finish, the FFT lets us break a trace into its component
        wavelengths with their amplitudes and phases. Amplitudes are what we
        care about (how big each wave is); phase (where it starts) matters far
        less. Once a trace is decomposed this way, a filter is simply a rule for
        which wavelengths to keep — which is the next page.
      </p>
    </Lesson>
  );
}

export function FilteringTransmission() {
  return (
    <Lesson
      title="Gaussian transmission"
      intro="A filter doesn't chop wavelengths off at a hard wall. The Gaussian filter passes them gradually, and the cutoff is defined where exactly half the amplitude gets through."
    >
      <h2>The 50% point</h2>
      <p>
        At the cutoff wavelength λc, the Gaussian filter transmits{" "}
        <strong>50%</strong> of a wave's amplitude. Wavelengths well below λc pass
        almost fully through the high-pass (roughness) filter; wavelengths well
        above λc pass almost fully through the low-pass (waviness) filter. Near
        the cutoff the two overlap — there is no sharp boundary.
      </p>

      <Callout label="Complementary filters">
        The roughness (high-pass) and waviness (low-pass) transmission curves are
        mirror images that sum to 100% at every wavelength. A wave's amplitude is
        split between roughness and waviness, not duplicated.
      </Callout>

      <h2>See it happen</h2>
      <p>
        Drag the cutoff and watch the same primary profile split into a waviness
        mean line and the roughness that passes through:
      </p>
      <GaussianFilterDemo />

      <h2>Why it matters</h2>
      <p>
        Because transmission is gradual, a feature whose wavelength sits close to
        the cutoff is partly counted as roughness and partly as waviness. This is
        exactly why a measurement taken near the wrong cutoff can drift — and why
        choosing the cutoff deliberately (next page) matters.
      </p>
    </Lesson>
  );
}

const NON_PERIODIC = [
  { raLo: 0.006, raHi: 0.02, raLoParens: true, lc: 0.08, ev: 0.4 },
  { raLo: 0.02, raHi: 0.1, lc: 0.25, ev: 1.25 },
  { raLo: 0.1, raHi: 2, lc: 0.8, ev: 4 },
  { raLo: 2, raHi: 10, lc: 2.5, ev: 12.5 },
  { raLo: 10, raHi: 80, lc: 8, ev: 40 },
];

const PERIODIC = [
  { smLo: 0.013, smHi: 0.04, lc: 0.08 },
  { smLo: 0.04, smHi: 0.13, lc: 0.25 },
  { smLo: 0.13, smHi: 0.4, lc: 0.8 },
  { smLo: 0.4, smHi: 1.3, lc: 2.5 },
  { smLo: 1.3, smHi: 4, lc: 8 },
];

export function FilteringChoosing() {
  const { unit } = useUnits();
  const lateralLabel = unit === "uin" ? "in" : "mm";
  return (
    <Lesson
      title="Choosing a cutoff"
      intro="The two most common questions in surface finish are “what filter should I use?” and “is the one on the drawing right?” The honest answer is usually “it depends” — but ISO 4288 gives a solid starting point."
    >
      <h2>First: periodic or non-periodic?</h2>
      <ul>
        <li><strong>Periodic</strong> (“sinusoidal”) profiles — e.g. turning. Selected by spacing, RSm.</li>
        <li><strong>Non-periodic</strong> (“random”) profiles — e.g. grinding. Selected by amplitude, Ra.</li>
      </ul>

      <h2>Non-periodic surfaces — select by Ra</h2>
      <table className="lesson-table">
        <thead>
          <tr><th>Ra ({unitLabel(unit)})</th><th>Cutoff λc ({lateralLabel})</th><th>Eval. length ({lateralLabel})</th></tr>
        </thead>
        <tbody>
          {NON_PERIODIC.map((r) => (
            <tr key={r.lc}>
              <td>
                {"raLoParens" in r ? `(${formatLength(r.raLo, unit)})` : formatLength(r.raLo, unit)}
                {" – "}
                {formatLength(r.raHi, unit)}
              </td>
              <td>{formatLateral(r.lc, unit)}</td>
              <td>{formatLateral(r.ev, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Periodic surfaces — select by RSm</h2>
      <table className="lesson-table">
        <thead>
          <tr><th>RSm ({lateralLabel})</th><th>Cutoff λc ({lateralLabel})</th></tr>
        </thead>
        <tbody>
          {PERIODIC.map((r) => (
            <tr key={r.lc}>
              <td>{formatLateral(r.smLo, unit)} – {formatLateral(r.smHi, unit)}</td>
              <td>{formatLateral(r.lc, unit)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>The iterate-down rule</h2>
      <p>
        These charts are a starting point, not a verdict. The standard procedure
        is to measure, check which band your result lands in, and re-measure at
        the indicated cutoff if you were in the wrong band. The tool below starts
        deliberately too coarse — pick periodic or non-periodic, then{" "}
        <strong>step the filter up or down until the result lands in its own
        band</strong>. When it does, you've found a defensible filter for this
        trace:
      </p>
      <CutoffChooserDemo />
      <Callout label="Why this matters — the filter is rarely on the drawing">
        Drawings almost never specify the cutoff — it's left to whoever runs the
        gauge. That's a real problem, because a <em>shorter</em> cutoff removes
        more of the profile as waviness and makes Ra read <strong>smaller</strong>.
        An operator under pressure quickly learns that dialing down the filter
        makes borderline parts &ldquo;pass.&rdquo; The iterate-to-converge method
        is the defensible answer: it ties the filter to the surface itself, not to
        the number you were hoping to see.
      </Callout>
      <Callout label="Worked example">
        A polished surface measures Ra&nbsp;{formatLength(0.08, unit)} at
        a {formatLateral(0.8, unit)} cutoff.
        Per the table, Ra&nbsp;{formatLength(0.08, unit)} falls in the{" "}
        {formatLength(0.02, unit)}–{formatLength(0.1, unit)} band, whose
        cutoff is <strong>{formatLateral(0.25, unit)}</strong>. So you re-evaluate at{" "}
        {formatLateral(0.25, unit)} rather than accepting the {formatLateral(0.8, unit)} result.
      </Callout>

      <p className="lesson-source">Cutoff selection per ISO 4288. RSm is also handy here — see the Spacing parameters page.</p>
    </Lesson>
  );
}
