"""ISO 1302 roughness grade numbers and unit conversion helpers."""

from __future__ import annotations

import math
from dataclasses import dataclass

MICROINCH_PER_MICRON = 39.3701


@dataclass
class RoughnessGrade:
    grade: str   # "N6"
    ra: float    # nominal Ra in µm


ISO_GRADES: list[RoughnessGrade] = [
    RoughnessGrade("N1",  0.025),
    RoughnessGrade("N2",  0.05),
    RoughnessGrade("N3",  0.1),
    RoughnessGrade("N4",  0.2),
    RoughnessGrade("N5",  0.4),
    RoughnessGrade("N6",  0.8),
    RoughnessGrade("N7",  1.6),
    RoughnessGrade("N8",  3.2),
    RoughnessGrade("N9",  6.3),
    RoughnessGrade("N10", 12.5),
    RoughnessGrade("N11", 25.0),
    RoughnessGrade("N12", 50.0),
]


def nearest_grade(ra_microns: float) -> RoughnessGrade:
    """Return the ISO N-grade whose Ra is closest to ra_microns (log distance)."""
    if ra_microns <= 0:
        return ISO_GRADES[0]
    best = ISO_GRADES[0]
    best_dist = math.inf
    for g in ISO_GRADES:
        dist = abs(math.log(ra_microns / g.ra))
        if dist < best_dist:
            best_dist = dist
            best = g
    return best
