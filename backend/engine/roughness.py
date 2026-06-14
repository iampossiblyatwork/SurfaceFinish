"""ISO 4287 / ISO 21920 / ASME B46.1 surface roughness parameter calculations.

All inputs are height arrays in µm sampled at uniform lateral spacing dx (µm).
The engine is intentionally pure — no FastAPI or HTTP dependencies — so the same
code can later be called from an analyzer endpoint that ingests real measurement data.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np


@dataclass
class RoughnessParameters:
    Ra: float   # Arithmetic mean deviation
    Rq: float   # RMS deviation
    Rp: float   # Maximum peak height
    Rv: float   # Maximum valley depth (positive value)
    Rz: float   # Mean roughness depth (5-segment average)
    Rt: float   # Total height
    Rsk: float  # Skewness (dimensionless)
    Rku: float  # Kurtosis (dimensionless)
    Rc: float   # Mean height of profile elements
    RSm: float  # Mean width of profile elements (µm)
    RDq: float  # RMS profile slope (degrees)


@dataclass
class MaterialRatioPoint:
    c: float    # Depth below highest peak (µm)
    mr: float   # Material ratio (0–100 %)


def center_profile(z: np.ndarray) -> np.ndarray:
    """Subtract the mean (centre) line from a profile array."""
    return z - z.mean()


def _compute_rz(z: np.ndarray, segments: int = 5) -> float:
    """Mean roughness depth: average peak-to-valley over `segments` sampling lengths."""
    n = len(z)
    if n == 0:
        return 0.0
    seg_len = n // segments
    if seg_len < 2:
        return float(z.max() - z.min())
    total = 0.0
    for s in range(segments):
        start = s * seg_len
        end = start + seg_len if s < segments - 1 else n
        seg = z[start:end]
        total += float(seg.max() - seg.min())
    return total / segments


def _compute_element_stats(z: np.ndarray, dx: float, rq: float) -> tuple[float, float]:
    """Compute RSm (mean element spacing) and Rc (mean element height).

    Profile elements are the segments between consecutive upward mean-line
    crossings. A height discrimination of 0.1·Rq suppresses spurious crossings
    from fine noise (spirit of ISO 4287 §4).
    """
    n = len(z)
    threshold = rq * 0.1
    crossings: list[int] = []
    for i in range(1, n):
        if z[i - 1] <= 0 and z[i] > threshold:
            crossings.append(i)

    if len(crossings) < 2:
        height = float(z.max() - z.min())
        return float(n * dx), height

    width_sum = 0.0
    height_sum = 0.0
    count = len(crossings) - 1
    for k in range(1, len(crossings)):
        start = crossings[k - 1]
        end = crossings[k]
        width_sum += (end - start) * dx
        seg = z[start:end]
        height_sum += float(seg.max() - seg.min())

    return width_sum / count, height_sum / count


def _compute_rdq(z: np.ndarray, dx: float) -> float:
    """RMS profile slope in degrees."""
    if len(z) < 2 or dx == 0:
        return 0.0
    slopes = np.diff(z) / dx  # dimensionless (µm/µm)
    rms_slope = float(np.sqrt(np.mean(slopes ** 2)))
    return math.degrees(math.atan(rms_slope))


def compute_parameters(z: np.ndarray, dx: float) -> RoughnessParameters:
    """Compute the full ISO 4287 2D parameter suite from a centred profile."""
    z = center_profile(z)
    n = len(z)
    if n == 0:
        return RoughnessParameters(
            Ra=0, Rq=0, Rp=0, Rv=0, Rz=0, Rt=0,
            Rsk=0, Rku=0, Rc=0, RSm=0, RDq=0,
        )

    Ra = float(np.mean(np.abs(z)))
    Rq = float(np.sqrt(np.mean(z ** 2)))
    Rp = float(z.max())
    Rv = float(-z.min())
    Rt = Rp + Rv
    Rz = _compute_rz(z)
    Rsk = float(np.mean(z ** 3) / Rq ** 3) if Rq > 0 else 0.0
    Rku = float(np.mean(z ** 4) / Rq ** 4) if Rq > 0 else 0.0
    RSm, Rc = _compute_element_stats(z, dx, Rq)
    RDq = _compute_rdq(z, dx)

    return RoughnessParameters(
        Ra=Ra, Rq=Rq, Rp=Rp, Rv=Rv, Rz=Rz, Rt=Rt,
        Rsk=Rsk, Rku=Rku, Rc=Rc, RSm=RSm, RDq=RDq,
    )


def material_ratio_curve(z: np.ndarray, steps: int = 100) -> list[MaterialRatioPoint]:
    """Abbott–Firestone bearing area (material ratio) curve."""
    z = center_profile(z)
    n = len(z)
    hi = float(z.max())
    lo = float(z.min())
    span = hi - lo
    if span == 0:
        return [MaterialRatioPoint(c=0.0, mr=100.0)]

    sorted_z = np.sort(z)[::-1]  # descending
    points: list[MaterialRatioPoint] = []
    idx = 0
    for s in range(steps + 1):
        level = hi - (span * s / steps)
        while idx < n and sorted_z[idx] >= level:
            idx += 1
        points.append(MaterialRatioPoint(c=hi - level, mr=(idx / n) * 100.0))
    return points
