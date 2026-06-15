import { Lesson, Callout } from "./Lesson";

export function RealWorld() {
  return (
    <Lesson
      title="Meeting Spec in the Real World"
      intro="Most of this reference is about doing surface finish correctly. This page is about the messier reality on the shop floor — where the drawing hands you a number and almost nothing else, and you just need to know whether the part passes."
    >
      <h2>The callout you'll actually see</h2>
      <p>
        A surface-finish callout usually isn't a full ISO specification. It's the
        check/tick symbol — the one that looks like a square-root sign but isn't —
        with a single number, say <strong>0.5</strong>, in microns. No parameter.
        No filter. No evaluation length. (See <em>Callouts &amp; Standards</em> for
        the symbol itself.)
      </p>
      <Callout label="The first assumption: it means Ra">
        With nothing else to go on, a bare number is taken to mean{" "}
        <strong>Ra ≤ that value</strong>. So &ldquo;0.5&rdquo; means Ra must come
        out at or below 0.5&nbsp;µm. That's almost always the right reading — but
        it is still an assumption you're making, not something the drawing told
        you.
      </Callout>

      <h2>The short-feature trap</h2>
      <p>
        Now suppose that callout is tagged to an <strong>O-ring groove</strong> —
        maybe a quarter of a millimetre to a millimetre wide. You work the diamond
        stylus in (and hope you don't snap it), and you're left with a trace a
        fraction of a millimetre long. Several things have already gone sideways
        before you've read a single number:
      </p>
      <ul>
        <li>
          The trace is so short you've <strong>mechanically filtered</strong> it
          without touching a setting — there's no room for long wavelengths, so
          you cannot see waviness even if you wanted to.
        </li>
        <li>
          The standard cutoffs (0.25&nbsp;mm for grinding, 0.8&nbsp;mm for turning
          and milling) are <em>longer than your whole trace</em>. Forcing a
          0.8&nbsp;mm filter onto a 0.5&nbsp;mm groove is meaningless.
        </li>
      </ul>
      <Callout label="A filter longer than the trace can't do its job">
        One sampling length at λc&nbsp;=&nbsp;0.8&nbsp;mm is 0.8&nbsp;mm; the full
        evaluation length is five of them — 4&nbsp;mm. A sub-millimetre groove
        simply can't host that. (See <em>Stylus Tip Geometry</em> for the physical
        side and <em>Cutoffs &amp; sampling length</em> for the math.)
      </Callout>

      <h2>Primary, waviness, roughness — and when &ldquo;no filter&rdquo; is fine</h2>
      <p>
        There are three profiles you can report: the{" "}
        <strong>Primary (P)</strong> profile — the trace with only the short λs
        noise cleanup, no roughness/waviness split; <strong>Waviness (W)</strong>;
        and <strong>Roughness (R)</strong>. On a feature that's already
        mechanically filtered down to a tiny length, there's effectively no
        waviness left to remove — so reporting the <strong>primary profile
        (Pa)</strong> is often perfectly defensible.
      </p>
      <p>
        It also helps that many instruments can't cleanly apply an arbitrary
        cutoff to a very short trace without special software. If yours can't, P is
        the honest answer rather than forcing a filter the trace can't support. You
        <em> can</em> always push a 0.8&nbsp;mm filter on and watch Ra tick down a
        little — but on a short trace that's cosmetic, not physics.
      </p>

      <h2>When the drawing gives you no filter</h2>
      <p>
        Which is the usual case — <strong>roughly ninety-nine times out of a
        hundred</strong> the cutoff isn't on the drawing. That leaves the choice to
        whoever runs the gauge, and the choice changes the number. Use the
        iterate-to-converge tool on the <em>Choosing a cutoff</em> page: measure,
        see which band you land in, step to the recommended cutoff, and repeat
        until the result sits inside its own band. That gives you a filter you can
        defend in a review — one tied to the surface, not to the answer you were
        hoping for.
      </p>
      <Callout label="The honest warning">
        A <em>smaller</em> cutoff removes more of the profile as waviness and makes
        Ra read smaller. Operators figure this out fast: dial the filter down and
        borderline parts start passing. It works right up until an audit asks how
        you measured — which is exactly why the converge method exists.
      </Callout>

      <h2>&ldquo;Am I meeting spec?&rdquo; — the short version</h2>
      <p>When all you have is a number, this is the pragmatic path:</p>
      <ol className="lesson-steps">
        <li>
          <strong>Assume Ra.</strong> Read the number as Ra ≤ value unless the
          drawing says otherwise.
        </li>
        <li>
          <strong>Check the feature size.</strong> If it's tiny (O-ring groove,
          narrow land), your trace is short and already mechanically filtered —
          reporting the <strong>primary (P)</strong> profile is usually fine.
        </li>
        <li>
          <strong>Otherwise pick the cutoff.</strong> Use the iterate method, or
          the common defaults: 0.25&nbsp;mm for grinding, 0.8&nbsp;mm for turning
          and milling.
        </li>
        <li>
          <strong>Check the trace length.</strong> It must support the cutoff —
          ideally five sampling lengths, at minimum one.
        </li>
        <li>
          <strong>Report the number and the filter you used.</strong> If the
          drawing didn't specify it, write down what you did.
        </li>
      </ol>
      <Callout label="You don't have to become a surface-finish scientist">
        The goal isn't a PhD in metrology — it's a repeatable, defensible procedure
        that answers one question: <strong>does this part pass?</strong> Assume Ra,
        match the filter to the surface (or report P when the feature is too small
        to filter), confirm the trace is long enough, and document it. That's the
        whole job.
      </Callout>

      <p className="lesson-source">
        Built on ISO 4287 / 4288 / 3274; the judgement calls reflect shop-floor
        experience, not a clause in the standard.
      </p>
    </Lesson>
  );
}
