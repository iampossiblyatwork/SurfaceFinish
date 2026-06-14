"""Surface Finish Dictionary — FastAPI backend.

Serves three API endpoints for the React frontend plus the compiled React
static files. In production the single Docker container runs everything on
port 8000; in development the Vite dev server proxies /api/* here.
"""

from __future__ import annotations

import dataclasses
from pathlib import Path
from typing import Any, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .engine.finishes import FINISHES_LIST, FINISH_FAMILIES, get_finish
from .engine.grades import nearest_grade
from .engine.parameters import PARAMETERS
from .engine.profile import generate_profile
from .engine.roughness import compute_parameters, material_ratio_curve

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="Surface Finish Dictionary API", version="2.0.0")

DIST_DIR = Path(__file__).parent.parent / "dist"

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class GenerateRequest(BaseModel):
    finishId: str
    targetRa: float
    seed: int = 1


class BatchRequest(BaseModel):
    traces: list[GenerateRequest]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _finish_to_dict(f) -> dict:
    return {
        "id": f.id,
        "process": f.process,
        "family": f.family,
        "description": f.description,
        "applications": f.applications,
        "raMin": f.raMin,
        "raMax": f.raMax,
        "defaultRa": f.defaultRa,
    }


def _param_to_dict(p) -> dict:
    return {
        "symbol": p.symbol,
        "name": p.name,
        "category": p.category,
        "dimension": p.dimension,
        "unitType": p.unitType,
        "key": p.key,
        "summary": p.summary,
        "meaning": p.meaning,
        "formula": p.formula,
    }


def _generate_trace(req: GenerateRequest) -> dict:
    try:
        finish = get_finish(req.finishId)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Unknown finish: {req.finishId!r}")

    gen_params = dataclasses.asdict(finish.genParams)
    z, dx = generate_profile(gen_params, req.targetRa, req.seed)
    params = compute_parameters(z, dx)

    grade = nearest_grade(params.Ra)

    return {
        "profile": {
            "z": z.tolist(),
            "dx": dx,
        },
        "params": {
            "Ra": params.Ra,
            "Rq": params.Rq,
            "Rp": params.Rp,
            "Rv": params.Rv,
            "Rz": params.Rz,
            "Rt": params.Rt,
            "Rsk": params.Rsk,
            "Rku": params.Rku,
            "Rc": params.Rc,
            "RSm": params.RSm,
            "RDq": params.RDq,
        },
        "grade": grade.grade,
    }


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------


@app.get("/api/finishes")
def api_finishes():
    return {
        "finishes": [_finish_to_dict(f) for f in FINISHES_LIST],
        "families": FINISH_FAMILIES,
    }


@app.get("/api/parameters")
def api_parameters():
    return {"parameters": [_param_to_dict(p) for p in PARAMETERS]}


@app.post("/api/trace/generate")
def api_generate(req: GenerateRequest):
    return _generate_trace(req)


@app.post("/api/trace/batch")
def api_batch(req: BatchRequest):
    return {"traces": [_generate_trace(r) for r in req.traces]}


# ---------------------------------------------------------------------------
# Serve React static build — must be last so API routes take priority
# ---------------------------------------------------------------------------

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(full_path: str):
        # Serve exact file if it exists, otherwise fall back to index.html
        requested = DIST_DIR / full_path
        if requested.is_file():
            return FileResponse(str(requested))
        return FileResponse(str(DIST_DIR / "index.html"))

    @app.get("/", include_in_schema=False)
    async def root():
        return FileResponse(str(DIST_DIR / "index.html"))
