"""
FastAPI backend for the Production Tool.
Now only serves static assets and read-only game data.
All mutable state lives in the browser's localStorage.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os


from game_data import get_game_data
import sys
sys.path.append(os.path.dirname(__file__))
from deadlock import get_hero_counters_stats, filter_counter_stats
from fastapi.responses import JSONResponse
from fastapi import Query
from fastapi import Request


app = FastAPI(title="Prod Tool API")

# CORS - allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve assets folder – try multiple candidate paths so it works both locally
# and on Railway (where root dir may be 'backend/' or the full repo root).
_ASSET_CANDIDATES = [
    os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "components", "overlays", "assets"),
    os.path.join(os.path.dirname(__file__), "frontend", "src", "components", "overlays", "assets"),
    os.path.join("/app", "frontend", "src", "components", "overlays", "assets"),
]
ASSETS_DIR = None
for _p in _ASSET_CANDIDATES:
    _p = os.path.abspath(_p)
    if os.path.isdir(_p):
        ASSETS_DIR = _p
        break

if ASSETS_DIR:
    print(f"[assets] Serving from {ASSETS_DIR}")
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")
else:
    print(f"[assets] WARNING: No assets directory found. Checked: {_ASSET_CANDIDATES}")


# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.get("/api/game-data")
def get_game_data_endpoint():
    """Get all game constants (heroes, maps, roles, etc.)."""
    return get_game_data()


# New API endpoint for hero counter stats
@app.get("/api/hero-counter-stats")
async def get_hero_counter_stats_endpoint(request: Request):
    """Get hero counter stats from Deadlock API, with all params adjustable by the user."""
    # Extract all query params as a dict
    query_params = dict(request.query_params)
    # Convert types as needed
    for k in ["hero_id", "enemy_hero_id", "min_matches", "max_matches", "min_unix_timestamp", "max_unix_timestamp", "min_duration_s", "max_duration_s", "min_networth", "max_networth", "min_enemy_networth", "max_enemy_networth", "min_average_badge", "max_average_badge", "min_match_id", "max_match_id", "comb_size", "account_id"]:
        if k in query_params:
            try:
                query_params[k] = int(query_params[k])
            except Exception:
                pass
    for k in ["same_lane_filter"]:
        if k in query_params:
            v = query_params[k].lower()
            query_params[k] = v in ("1", "true", "yes", "on")
    # List params
    for k in ["account_ids", "include_hero_ids", "exclude_hero_ids"]:
        if k in query_params:
            query_params[k] = [int(x) for x in query_params[k].split(",") if x.strip()]

    # Separate filter-only params
    filter_args = {}
    for k in ["hero_id", "enemy_hero_id"]:
        if k in query_params:
            filter_args[k] = query_params[k]
            del query_params[k]

    # Build params for get_hero_counters_stats (without hero_id/enemy_hero_id)
    stats = get_hero_counters_stats(params=query_params)
    if stats is None:
        return JSONResponse(status_code=500, content={"error": "Failed to fetch hero counter stats"})

    # Optionally filter further using filter_counter_stats
    for k in ["min_matches", "same_lane_filter", "min_average_badge"]:
        if k in query_params:
            filter_args[k] = query_params[k]
    filtered = filter_counter_stats(stats, **filter_args)
    return [r.dict() if hasattr(r, 'dict') else r for r in filtered]


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
