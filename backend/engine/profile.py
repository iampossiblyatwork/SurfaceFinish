"""Process-aware synthetic surface profile generation.

Algorithm:
  1. Periodic feed-mark sinusoid (fundamental + 2nd harmonic) — weight and
     spatial frequency are process-specific.
  2. Band-limited Gaussian noise (moving-average smoothing).
  3. Optional sparse spikes (EDM craters, cast pits).
  4. Remove mean line.
  5. Scale entire profile so measured Ra == target Ra.
"""

from __future__ import annotations

import numpy as np

from .noise import get_rng
from .roughness import center_profile

DEFAULT_SAMPLES = 800
DEFAULT_EVAL_LENGTH_UM = 4000.0  # 4 mm


def _smooth(values: np.ndarray, window: int) -> np.ndarray:
    """Centred moving-average (uniform kernel) low-pass filter."""
    if window <= 1:
        return values.copy()
    kernel = np.ones(window) / window
    return np.convolve(values, kernel, mode="same")


def generate_profile(
    gen_params: dict,
    target_ra_microns: float,
    seed: int,
    samples: int = DEFAULT_SAMPLES,
    eval_length_um: float = DEFAULT_EVAL_LENGTH_UM,
) -> tuple[np.ndarray, float]:
    """Generate a synthetic profile scaled to target_ra_microns.

    Returns (z, dx) where z is a float64 array of heights in µm and dx is the
    lateral sample spacing in µm.
    """
    n = samples
    dx = eval_length_um / n
    rng = get_rng(seed)

    periodic_weight: float = gen_params["periodicWeight"]
    periodic_cycles: float = gen_params["periodicCycles"]
    noise_weight: float = gen_params["noiseWeight"]
    noise_smoothing: int = int(gen_params["noiseSmoothing"])
    spike_density: float = gen_params.get("spikeDensity") or 0.0
    spike_polarity: int = int(gen_params.get("spikePolarity") or 0)
    # Plateau-valley component: a flat plateau cut by periodic deep valleys, as
    # produced by honing. This is what gives honed/ground surfaces their
    # strongly negative skewness (Rsk) — the defining feature of a plateau-honed
    # cylinder bore (flat bearing area + deep oil-retention grooves).
    valley_weight: float = gen_params.get("valleyWeight") or 0.0
    valley_cycles: float = gen_params.get("valleyCycles") or 0.0
    valley_width: float = gen_params.get("valleyWidth") or 0.15

    # 1. Periodic feed-mark component
    phase = rng.random() * 2 * np.pi
    t = np.arange(n) / n * 2 * np.pi * periodic_cycles
    harmonic = 0.25
    periodic = periodic_weight * (
        np.sin(t + phase) + harmonic * np.sin(2 * t + phase)
    )

    # 2. Band-limited Gaussian noise
    raw_noise = rng.standard_normal(n)
    noise = _smooth(raw_noise, noise_smoothing)

    # 3. Combine
    z = periodic + noise_weight * noise

    # 3b. Plateau-valley (honing) component — a flat plateau cut by periodic
    # narrow valleys. Modelled as the negative of a sharp periodic notch so the
    # surface sits near its peak (plateau) most of the time and plunges into a
    # groove at each crossing, producing strong negative skew.
    if valley_weight > 0 and valley_cycles > 0:
        valley_phase = rng.random()
        tv = np.arange(n) / n * valley_cycles + valley_phase
        frac = tv - np.floor(tv)  # 0..1 within each groove period
        d = (frac - 0.5) / max(valley_width, 1e-3)
        groove = np.exp(-d * d)  # ~1 at the groove centre, ~0 on the plateau
        z = z - valley_weight * groove

    # 4. Sparse spikes (EDM craters / casting pits)
    if spike_density > 0:
        spike_mask = rng.random(n) < spike_density
        magnitudes = (1 + rng.random(n) * 2) * noise_weight * 3
        if spike_polarity == 0:
            directions = np.where(rng.random(n) < 0.5, 1.0, -1.0)
        else:
            directions = np.full(n, float(spike_polarity))
        z += spike_mask * magnitudes * directions

    # 5. Remove mean line
    z = center_profile(z)

    # 6. Scale to target Ra
    current_ra = float(np.mean(np.abs(z)))
    if current_ra > 0:
        z = z * (target_ra_microns / current_ra)

    return z, dx
