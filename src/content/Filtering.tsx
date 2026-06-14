import { Lesson, Callout } from "./Lesson";
import { WaveSum } from "../components/WaveSum";

export function FilteringCutoffs() {
  return (
    <Lesson
      title="Cutoffs & sampling length"
      intro="The cutoff is the single most consequential choice in a surface finish measurement — it decides what counts as roughness and what counts as waviness."
    >
      <Callout label="The terms are synonyms">
        <strong>Cutoff</strong>, <strong>sampling length</strong>, and{" "}
        <strong>filter length</strong> all refer to the same wavelength, λc.
      </Callout>

      <h2>What the cutoff does</h2>
      <p>
        The cutoff λc is the wavelength of the Gaussian profile filter. Anything{" "}
        <em>longer</em> than the cutoff is treated as waviness; anything{" "}
        <em>shorter</em> is treated as roughness. The same physical 0.5&nbsp;mm
        undulation is “waviness” under a 0.25&nbsp;mm cutoff but “roughness” under
        a 0.8&nbsp;mm cutoff. Nothing about the surface changed — only the
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
        five sampling lengths is what gives Ra its famous stability.
      </p>
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
      <ul>
        <li><strong>A — amplitude:</strong> distance from the reference line to a peak or valley.</li>
        <li><strong>λ — wavelength</strong> (λ = 2π/B): higher frequency means shorter wavelength.</li>
        <li><strong>C — phase shift:</strong> where the wave crosses the axis.</li>
        <li><strong>D — vertical shift:</strong> offset from the origin.</li>
      </ul>

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
  { ra: "(0.006) – 0.02", lc: "0.08", ev: "0.4" },
  { ra: "0.02 – 0.1", lc: "0.25", ev: "1.25" },
  { ra: "0.1 – 2", lc: "0.8", ev: "4" },
  { ra: "2 – 10", lc: "2.5", ev: "12.5" },
  { ra: "10 – 80", lc: "8", ev: "40" },
];

const PERIODIC = [
  { sm: "0.013 – 0.04", lc: "0.08" },
  { sm: "0.04 – 0.13", lc: "0.25" },
  { sm: "0.13 – 0.4", lc: "0.8" },
  { sm: "0.4 – 1.3", lc: "2.5" },
  { sm: "1.3 – 4", lc: "8" },
];

export function FilteringChoosing() {
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
          <tr><th>Ra (µm)</th><th>Cutoff λc (mm)</th><th>Eval. length (mm)</th></tr>
        </thead>
        <tbody>
          {NON_PERIODIC.map((r) => (
            <tr key={r.lc}><td>{r.ra}</td><td>{r.lc}</td><td>{r.ev}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Periodic surfaces — select by RSm</h2>
      <table className="lesson-table">
        <thead>
          <tr><th>RSm (mm)</th><th>Cutoff λc (mm)</th></tr>
        </thead>
        <tbody>
          {PERIODIC.map((r) => (
            <tr key={r.lc}><td>{r.sm}</td><td>{r.lc}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>The iterate-down rule</h2>
      <p>
        These charts are a starting point, not a verdict. The standard procedure
        is to measure, check which band your result lands in, and re-measure at
        the indicated cutoff if you were in the wrong band.
      </p>
      <Callout label="Worked example">
        A polished surface measures Ra&nbsp;0.08&nbsp;µm at a 0.8&nbsp;mm cutoff.
        Per the table, Ra&nbsp;0.08 falls in the 0.02–0.1&nbsp;µm band, whose
        cutoff is <strong>0.25&nbsp;mm</strong>. So you re-evaluate at
        0.25&nbsp;mm rather than accepting the 0.8&nbsp;mm result.
      </Callout>

      <p className="lesson-source">Cutoff selection per ISO 4288. RSm is also handy here — see the Spacing parameters page.</p>
    </Lesson>
  );
}
