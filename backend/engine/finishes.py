"""Manufacturing process dictionary.

Ra ranges and ISO grade mappings follow standard machining references.
genParams drives the trace generator: shape only; amplitude comes from target Ra.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class GenParams:
    periodicWeight: float
    periodicCycles: float
    noiseWeight: float
    noiseSmoothing: int
    spikeDensity: Optional[float] = None
    spikePolarity: Optional[int] = None
    # Plateau-valley (honing) component → negative skew. valleyWeight is the
    # groove depth relative to the plateau roughness; valleyCycles is the number
    # of groove crossings over the evaluation length; valleyWidth is the groove
    # sharpness (smaller = narrower, more negative skew).
    valleyWeight: Optional[float] = None
    valleyCycles: Optional[float] = None
    valleyWidth: Optional[float] = None


@dataclass
class Finish:
    id: str
    process: str
    family: str
    description: str
    applications: str
    raMin: float
    raMax: float
    defaultRa: float
    genParams: GenParams


FINISHES_LIST: list[Finish] = [
    Finish(
        id="lapping", process="Lapping", family="Abrasive / fine",
        description="A loose abrasive slurry rubs the part against a lap plate, removing tiny amounts of material to produce an extremely flat, near-isotropic finish with no directional marks.",
        applications="Gauge blocks, optical seats, valve faces, sealing surfaces.",
        raMin=0.012, raMax=0.1, defaultRa=0.05,
        genParams=GenParams(periodicWeight=0, periodicCycles=0, noiseWeight=1, noiseSmoothing=2),
    ),
    Finish(
        id="polishing", process="Polishing", family="Abrasive / fine",
        description="Successively finer abrasives produce a smooth, often mirror-like surface. Random fine texture with very low amplitude.",
        applications="Molds, medical implants, decorative and optical parts.",
        raMin=0.025, raMax=0.2, defaultRa=0.1,
        genParams=GenParams(periodicWeight=0.1, periodicCycles=60, noiseWeight=1, noiseSmoothing=2),
    ),
    Finish(
        id="honing", process="Honing", family="Abrasive / fine",
        description="Bonded abrasive stones move in a crosshatch pattern, leaving fine intersecting marks that retain oil — classic for bores.",
        applications="Engine cylinder bores, hydraulic bores, bearing races.",
        raMin=0.05, raMax=0.4, defaultRa=0.2,
        # Plateau honing: a flat bearing plateau cut by deep cross-hatch grooves
        # the trace crosses periodically → strongly negative skew (Rsk).
        genParams=GenParams(
            periodicWeight=0.0, periodicCycles=0, noiseWeight=0.15, noiseSmoothing=2,
            valleyWeight=2.2, valleyCycles=24, valleyWidth=0.07,
        ),
    ),
    Finish(
        id="grinding", process="Grinding", family="Abrasive / fine",
        description="A rotating abrasive wheel produces a fine, directional finish with closely spaced marks. The workhorse precision finishing process.",
        applications="Shafts, bearing journals, dies, precision flats.",
        raMin=0.1, raMax=1.6, defaultRa=0.4,
        # Ground surfaces carry a mild negative skew (sharp peaks abraded off,
        # finer scratches remain as shallow valleys).
        genParams=GenParams(
            periodicWeight=0.6, periodicCycles=80, noiseWeight=0.8, noiseSmoothing=2,
            valleyWeight=0.4, valleyCycles=120, valleyWidth=0.22,
        ),
    ),
    Finish(
        id="reaming", process="Reaming", family="Hole making",
        description="A multi-flute reamer lightly finishes a drilled hole, leaving a moderately fine, directional finish.",
        applications="Dowel-pin holes, bearing and bushing bores to tolerance.",
        raMin=0.4, raMax=3.2, defaultRa=1.6,
        genParams=GenParams(periodicWeight=0.7, periodicCycles=45, noiseWeight=0.5, noiseSmoothing=3),
    ),
    Finish(
        id="turning", process="Turning", family="Turning / boring",
        description="A single-point tool cuts a rotating workpiece, producing regular helical feed marks. Spacing tracks feed-per-revolution.",
        applications="Shafts, pins, bushings, threaded and cylindrical features.",
        raMin=0.4, raMax=6.3, defaultRa=1.6,
        genParams=GenParams(periodicWeight=1, periodicCycles=40, noiseWeight=0.35, noiseSmoothing=3),
    ),
    Finish(
        id="boring", process="Boring", family="Turning / boring",
        description="A single-point tool enlarges and finishes an existing hole, leaving turning-like feed marks on the bore.",
        applications="Engine bores, large bearing housings, cylinder liners.",
        raMin=0.4, raMax=6.3, defaultRa=1.6,
        genParams=GenParams(periodicWeight=0.95, periodicCycles=35, noiseWeight=0.4, noiseSmoothing=3),
    ),
    Finish(
        id="milling", process="Milling", family="Milling",
        description="A rotating multi-tooth cutter leaves periodic tool marks plus more random texture than turning, depending on engagement.",
        applications="Flats, slots, pockets, prismatic machined parts.",
        raMin=0.8, raMax=6.3, defaultRa=3.2,
        genParams=GenParams(periodicWeight=0.8, periodicCycles=25, noiseWeight=0.6, noiseSmoothing=3),
    ),
    Finish(
        id="drilling", process="Drilling", family="Hole making",
        description="A twist drill produces a relatively rough hole wall with helical marks and torn texture.",
        applications="Clearance and tapped-hole pilots, general hole making.",
        raMin=1.6, raMax=6.3, defaultRa=3.2,
        genParams=GenParams(periodicWeight=0.6, periodicCycles=30, noiseWeight=0.8, noiseSmoothing=2),
    ),
    Finish(
        id="shaping", process="Shaping / Planing", family="Milling",
        description="A single-point tool strokes across the work, leaving coarse, widely spaced feed marks.",
        applications="Keyways, flat surfaces on older or large machinery.",
        raMin=1.6, raMax=12.5, defaultRa=6.3,
        genParams=GenParams(periodicWeight=1, periodicCycles=15, noiseWeight=0.5, noiseSmoothing=3),
    ),
    Finish(
        id="edm", process="EDM (spark erosion)", family="Electrical / thermal",
        description="Electrical sparks erode the surface, producing a random, non-directional texture of overlapping craters with no feed marks.",
        applications="Hardened dies and molds, intricate cavities, fine details.",
        raMin=0.4, raMax=6.3, defaultRa=2.0,
        genParams=GenParams(periodicWeight=0, periodicCycles=0, noiseWeight=1, noiseSmoothing=2, spikeDensity=0.02, spikePolarity=-1),
    ),
    Finish(
        id="sawing", process="Sawing", family="Electrical / thermal",
        description="Band or circular saws leave an irregular, coarse finish with intermittent tooth marks and torn material.",
        applications="Stock cut-off, rough billet preparation.",
        raMin=3.2, raMax=25, defaultRa=12.5,
        genParams=GenParams(periodicWeight=0.4, periodicCycles=18, noiseWeight=1, noiseSmoothing=1, spikeDensity=0.015, spikePolarity=0),
    ),
    Finish(
        id="sand-casting", process="Sand casting", family="Casting",
        description="Metal solidifies against a sand mold, reproducing the grainy mold texture — a rough, random surface with pits and bumps.",
        applications="Engine blocks, housings, large structural castings.",
        raMin=6.3, raMax=50, defaultRa=12.5,
        genParams=GenParams(periodicWeight=0, periodicCycles=0, noiseWeight=1, noiseSmoothing=1, spikeDensity=0.03, spikePolarity=0),
    ),
    Finish(
        id="flame-cutting", process="Flame / plasma cutting", family="Casting",
        description="A thermal jet severs thick plate, leaving coarse vertical striations (drag lines) plus rough, heat-affected texture.",
        applications="Structural steel plate, heavy fabrication blanks.",
        raMin=12.5, raMax=50, defaultRa=25.0,
        genParams=GenParams(periodicWeight=0.7, periodicCycles=10, noiseWeight=1, noiseSmoothing=1, spikeDensity=0.02, spikePolarity=0),
    ),
]

FINISHES: dict[str, Finish] = {f.id: f for f in FINISHES_LIST}
FINISH_FAMILIES: list[str] = list(dict.fromkeys(f.family for f in FINISHES_LIST))


def get_finish(finish_id: str) -> Finish:
    if finish_id not in FINISHES:
        raise KeyError(f"Unknown finish id: {finish_id!r}")
    return FINISHES[finish_id]
