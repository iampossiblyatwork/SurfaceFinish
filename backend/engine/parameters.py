"""Educational catalog of standard 2D surface-texture parameters (ISO 4287)."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class ParameterDef:
    symbol: str
    name: str
    category: str        # "amplitude" | "spacing" | "hybrid" | "material-ratio"
    dimension: str       # "2D" | "3D"
    unitType: str        # "height" | "lateral" | "unitless" | "angle"
    key: Optional[str]   # maps to RoughnessParameters field, or None if curve-based
    summary: str
    meaning: str
    formula: str


PARAMETERS: list[ParameterDef] = [
    ParameterDef(
        symbol="Ra", name="Arithmetic mean deviation",
        category="amplitude", dimension="2D", unitType="height", key="Ra",
        summary="Average distance of the profile from its mean line.",
        meaning="The most widely used roughness number. It is the average absolute height of the profile relative to the mean line. Robust and easy to measure, but it cannot tell peaks apart from valleys — two very different surfaces can share the same Ra.",
        formula="Ra = (1/L) ∫ |z(x)| dx",
    ),
    ParameterDef(
        symbol="Rq", name="Root-mean-square deviation",
        category="amplitude", dimension="2D", unitType="height", key="Rq",
        summary="RMS average of profile heights.",
        meaning="Like Ra but using a root-mean-square average, so larger excursions count more. It is the standard deviation of the surface heights and ties directly into skewness and kurtosis. For a sine wave Rq = A/√2 while Ra = 2A/π.",
        formula="Rq = √[ (1/L) ∫ z(x)² dx ]",
    ),
    ParameterDef(
        symbol="Rz", name="Mean roughness depth",
        category="amplitude", dimension="2D", unitType="height", key="Rz",
        summary="Average peak-to-valley height over sampling lengths.",
        meaning="The evaluation length is split into (usually five) sampling lengths; in each the largest peak-to-valley height is taken and the results averaged. More sensitive to occasional tall peaks or deep scratches than Ra.",
        formula="Rz = (1/n) Σ (Rp_i + Rv_i)  over n sampling lengths",
    ),
    ParameterDef(
        symbol="Rt", name="Total height of the profile",
        category="amplitude", dimension="2D", unitType="height", key="Rt",
        summary="Highest peak to deepest valley over the whole length.",
        meaning="The single largest peak-to-valley span across the entire evaluation length. Useful when even one defect matters (sealing faces, fatigue-critical parts), but very sensitive to outliers.",
        formula="Rt = Rp + Rv  (over the evaluation length)",
    ),
    ParameterDef(
        symbol="Rp", name="Maximum peak height",
        category="amplitude", dimension="2D", unitType="height", key="Rp",
        summary="Height of the highest peak above the mean line.",
        meaning="The tallest peak measured from the mean line. Matters for surfaces that slide or seal, where high peaks are worn off first.",
        formula="Rp = max z(x)",
    ),
    ParameterDef(
        symbol="Rv", name="Maximum valley depth",
        category="amplitude", dimension="2D", unitType="height", key="Rv",
        summary="Depth of the deepest valley below the mean line.",
        meaning="The deepest valley measured from the mean line (reported positive). Valleys retain lubricant but can also concentrate stress.",
        formula="Rv = |min z(x)|",
    ),
    ParameterDef(
        symbol="Rc", name="Mean height of profile elements",
        category="amplitude", dimension="2D", unitType="height", key="Rc",
        summary="Average peak-to-valley height of individual profile elements.",
        meaning="Averages the height of each profile element (a peak/valley pair between mean-line crossings) using discrimination thresholds, giving a measure that is less swayed by single extreme features than Rt.",
        formula="Rc = (1/m) Σ Zt_i  over m profile elements",
    ),
    ParameterDef(
        symbol="Rsk", name="Skewness",
        category="amplitude", dimension="2D", unitType="unitless", key="Rsk",
        summary="Asymmetry of the height distribution.",
        meaning="Tells whether the surface is dominated by peaks (positive skew) or valleys (negative skew). Negative skew — a flat plateau with oil-retaining valleys — is often desirable for bearing and sealing surfaces.",
        formula="Rsk = (1/Rq³)(1/L) ∫ z(x)³ dx",
    ),
    ParameterDef(
        symbol="Rku", name="Kurtosis",
        category="amplitude", dimension="2D", unitType="unitless", key="Rku",
        summary="Sharpness / spikiness of the height distribution.",
        meaning="Describes how peaked the height distribution is. Rku = 3 is Gaussian; below 3 the surface is bumpy and rounded, above 3 it has sharp spikes or deep scratches. (A pure sine wave gives 1.5.)",
        formula="Rku = (1/Rq⁴)(1/L) ∫ z(x)⁴ dx",
    ),
    ParameterDef(
        symbol="RSm", name="Mean width of profile elements",
        category="spacing", dimension="2D", unitType="lateral", key="RSm",
        summary="Average spacing of profile elements along the surface.",
        meaning="The mean lateral distance between repeating features — for a turned part this tracks the feed per revolution. Two surfaces can share an Ra yet feel completely different because their RSm (texture spacing) differs.",
        formula="RSm = (1/m) Σ Xs_i  over m profile elements",
    ),
    ParameterDef(
        symbol="RΔq", name="Root-mean-square slope",
        category="hybrid", dimension="2D", unitType="angle", key="RDq",
        summary="RMS of the local profile slope.",
        meaning="A hybrid parameter combining height and spacing: the RMS slope of the surface. It correlates with optical scatter (gloss), adhesion, and how a coating or paint will key to the surface.",
        formula="RΔq = √[ (1/L) ∫ (dz/dx)² dx ]",
    ),
    ParameterDef(
        symbol="Rmr(c)", name="Material ratio (Abbott–Firestone)",
        category="material-ratio", dimension="2D", unitType="unitless", key=None,
        summary="Fraction of material at a given depth below the highest peak.",
        meaning="The bearing-area curve: at each depth c below the highest peak it gives the percentage of solid material. Its S-shape reveals running-in behavior — a curve that rises quickly means broad load-bearing plateaus near the top.",
        formula="Rmr(c) = (length of material at depth c) / L × 100%",
    ),
    ParameterDef(
        symbol="Rk", name="Core roughness depth",
        category="material-ratio", dimension="2D", unitType="height", key="Rk",
        summary="Height of the load-bearing core, with isolated peaks and valleys excluded.",
        meaning="Found by sliding a secant spanning 40% of the material ratio across the bearing-area curve to locate its flattest span (the core), then extending that line to 0% and 100% material ratio. Rk is the vertical distance between those two extensions — the roughness depth of the surface once outlying peaks and valleys are stripped out. Used with Rpk and Rvk on plateau-honed and running surfaces (ISO 13565-2).",
        formula="Rk = c(Mr1) − c(Mr2), the depth spanned by the core line",
    ),
    ParameterDef(
        symbol="Rpk", name="Reduced peak height",
        category="material-ratio", dimension="2D", unitType="height", key="Rpk",
        summary="Height of peaks protruding above the core that wear off quickly.",
        meaning="Models the material above the core line (up to material ratio Mr1) as a right triangle of equivalent area. These peaks carry little load and are typically worn flat almost immediately in service — a high Rpk on a new part often predicts a fast initial running-in.",
        formula="Rpk = 2·A1 / Mr1 (A1 = area above the core line, 0–Mr1)",
    ),
    ParameterDef(
        symbol="Rvk", name="Reduced valley depth",
        category="material-ratio", dimension="2D", unitType="height", key="Rvk",
        summary="Depth of valleys below the core that retain lubricant.",
        meaning="Models the material below the core line (past material ratio Mr2) as a right triangle of equivalent area. A high Rvk means deep oil-retaining valleys persist below the load-bearing core — desirable on cylinder bores and seal faces, undesirable where it traps debris.",
        formula="Rvk = 2·A2 / (100% − Mr2) (A2 = area below the core line, Mr2–100%)",
    ),
]
