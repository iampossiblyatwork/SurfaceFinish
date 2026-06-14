"""Tests for the Python roughness engine.

Validates the ISO 4287 parameter calculations against known analytical results
and checks that all 14 finishes generate finite traces at their default Ra.
"""

import math

import numpy as np
import pytest
from fastapi.testclient import TestClient

from backend.engine.finishes import FINISHES_LIST
from backend.engine.grades import nearest_grade
from backend.engine.profile import generate_profile
from backend.engine.roughness import compute_parameters, center_profile, material_ratio_curve
from backend.main import app


client = TestClient(app)


def sine_profile(amplitude: float, cycles: int, n: int = 4000):
    """Pure sine wave profile."""
    z = amplitude * np.sin(np.arange(n) / n * 2 * np.pi * cycles)
    return z, 1.0  # dx = 1 µm


# ---------------------------------------------------------------------------
# Analytical results for a pure sine wave
# ---------------------------------------------------------------------------

class TestSineWave:
    A = 3.0

    @pytest.fixture(autouse=True)
    def params(self):
        z, dx = sine_profile(self.A, 10)
        self.p = compute_parameters(z, dx)

    def test_ra(self):
        expected = 2 * self.A / math.pi
        assert abs(self.p.Ra - expected) < 1e-2

    def test_rq(self):
        expected = self.A / math.sqrt(2)
        assert abs(self.p.Rq - expected) < 1e-2

    def test_rp_rv(self):
        assert abs(self.p.Rp - self.A) < 1e-2
        assert abs(self.p.Rv - self.A) < 1e-2

    def test_rt(self):
        assert abs(self.p.Rt - 2 * self.A) < 1e-2

    def test_skewness_near_zero(self):
        assert abs(self.p.Rsk) < 0.05

    def test_kurtosis_near_1_5(self):
        assert abs(self.p.Rku - 1.5) < 0.1


# ---------------------------------------------------------------------------
# center_profile
# ---------------------------------------------------------------------------

def test_center_profile_removes_mean():
    z = np.array([1.0, 2.0, 3.0, 4.0])
    c = center_profile(z)
    assert abs(c.mean()) < 1e-10


# ---------------------------------------------------------------------------
# Profile generation
# ---------------------------------------------------------------------------

def test_generate_profile_ra_matches_target():
    target = 1.6
    finish_params = {
        "periodicWeight": 1.0, "periodicCycles": 40,
        "noiseWeight": 0.35, "noiseSmoothing": 3,
    }
    z, dx = generate_profile(finish_params, target, seed=42)
    p = compute_parameters(z, dx)
    assert abs(p.Ra - target) < 1e-6


def test_generate_profile_deterministic():
    params = {
        "periodicWeight": 1.0, "periodicCycles": 40,
        "noiseWeight": 0.35, "noiseSmoothing": 3,
    }
    z1, _ = generate_profile(params, 1.6, seed=7)
    z2, _ = generate_profile(params, 1.6, seed=7)
    np.testing.assert_array_equal(z1, z2)


# ---------------------------------------------------------------------------
# All 14 finishes
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("finish", FINISHES_LIST, ids=lambda f: f.id)
def test_all_finishes_finite_params(finish):
    import dataclasses
    gen_params = dataclasses.asdict(finish.genParams)
    z, dx = generate_profile(gen_params, finish.defaultRa, seed=1)
    p = compute_parameters(z, dx)
    assert abs(p.Ra - finish.defaultRa) < 1e-6
    for val in vars(p).values():
        assert math.isfinite(val), f"{finish.id}: non-finite param value {val}"
    assert finish.raMin <= finish.defaultRa <= finish.raMax


# ---------------------------------------------------------------------------
# Grades
# ---------------------------------------------------------------------------

def test_nearest_grade():
    assert nearest_grade(0.8).grade == "N6"
    assert nearest_grade(1.6).grade == "N7"
    assert nearest_grade(0.05).grade == "N2"


# ---------------------------------------------------------------------------
# Material ratio curve
# ---------------------------------------------------------------------------

def test_material_ratio_curve_bounds():
    z, dx = sine_profile(2.0, 10)
    curve = material_ratio_curve(z)
    assert curve[0].mr < 5
    assert abs(curve[-1].mr - 100.0) < 1.0


# ---------------------------------------------------------------------------
# API smoke tests
# ---------------------------------------------------------------------------

def test_api_finishes():
    r = client.get("/api/finishes")
    assert r.status_code == 200
    data = r.json()
    assert len(data["finishes"]) == 14


def test_api_parameters():
    r = client.get("/api/parameters")
    assert r.status_code == 200
    data = r.json()
    assert len(data["parameters"]) == 12


def test_api_generate():
    r = client.post("/api/trace/generate", json={"finishId": "turning", "targetRa": 1.6, "seed": 1})
    assert r.status_code == 200
    data = r.json()
    assert abs(data["params"]["Ra"] - 1.6) < 1e-4
    assert len(data["profile"]["z"]) == 800
    assert data["grade"] == "N7"


def test_api_generate_unknown_finish():
    r = client.post("/api/trace/generate", json={"finishId": "nonexistent", "targetRa": 1.0, "seed": 1})
    assert r.status_code == 404


def test_api_batch():
    r = client.post("/api/trace/batch", json={
        "traces": [
            {"finishId": "turning", "targetRa": 1.6, "seed": 1},
            {"finishId": "grinding", "targetRa": 0.4, "seed": 1},
        ]
    })
    assert r.status_code == 200
    assert len(r.json()["traces"]) == 2
