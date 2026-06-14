"""Seeded random number generation.

We use NumPy's PCG64 generator (numpy.random.default_rng) for high-quality,
deterministic pseudo-randomness. Same seed → same profile, always.
"""

import numpy as np


def get_rng(seed: int) -> np.random.Generator:
    """Return a seeded NumPy Generator. Same seed produces the same sequence."""
    return np.random.default_rng(seed)
