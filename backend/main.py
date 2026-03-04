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
# API Routes
# ---------------------------------------------------------------------------

@app.get("/api/game-data")
def get_game_data_endpoint():
    """Get all game constants (heroes, maps, roles, etc.)."""
    return get_game_data()


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
