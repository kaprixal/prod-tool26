"""
FastAPI backend for the Production Tool.
Replaces localStorage with a server-side state store + REST API.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import copy
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

# Serve assets folder from frontend overlays
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "components", "overlays", "assets")
if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


# ---------------------------------------------------------------------------
# In-memory state (replaces localStorage)
# ---------------------------------------------------------------------------

def make_default_player():
    return {"name": "", "character": "+", "role": "+"}


def make_default_map():
    return {"type": "+", "name": "+", "t1": "", "t2": "", "done": False, "state": "unplayed"}


def make_default_match():
    return {
        "team1": {"name": "", "logo": ""},
        "team2": {"name": "", "logo": ""},
        "players": {f"p{i}": make_default_player() for i in range(1, 13)},
        "maps": {f"map{i}": make_default_map() for i in range(1, 6)},
        "t1TotalScore": 0,
        "t2TotalScore": 0,
        "winner": "none",
    }


def make_default_state():
    return {
        "game": "",
        "currMatch": "1",
        "streamTitle": "",
        "subtitle": "",
        "caster1": {"name": "", "info": ""},
        "caster2": {"name": "", "info": ""},
        "guest1": {"name": "", "info": ""},
        "guest2": {"name": "", "info": ""},
        "matchCount": "1",
        "matches": {
            "1": {**make_default_match(), "format": "ft2", "details": ""},
            "2": {**make_default_match(), "format": "ft2", "details": ""},
            "3": {**make_default_match(), "format": "ft2", "details": ""},
        },
        "owBans": {},  # hero_name -> "t1" | "t2" | None
    }


STATE = make_default_state()


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class ModeUpdate(BaseModel):
    game: str
    currMatch: str


class GeneralInfoUpdate(BaseModel):
    streamTitle: str
    subtitle: str
    caster1Name: str
    caster1Info: str
    caster2Name: str
    caster2Info: str
    guest1Name: str
    guest1Info: str
    guest2Name: str
    guest2Info: str


class ScheduleUpdate(BaseModel):
    matchCount: str
    match1Format: str
    match1Details: str
    match2Format: str
    match2Details: str
    match3Format: str
    match3Details: str


class PlayerData(BaseModel):
    name: str = ""
    character: str = "+"
    role: str = "+"


class MapData(BaseModel):
    type: str = "+"
    name: str = "+"
    t1: str = ""
    t2: str = ""
    done: bool = False


class MatchUpdate(BaseModel):
    team1Name: str = ""
    team1Logo: str = ""
    team2Name: str = ""
    team2Logo: str = ""
    players: dict[str, PlayerData] = {}
    maps: dict[str, MapData] = {}


class OwBanUpdate(BaseModel):
    hero: str
    team: Optional[str] = None  # "t1", "t2", or None to clear


class SwapTeamsRequest(BaseModel):
    matchNumber: str


# ---------------------------------------------------------------------------
# Helper: compute match scores & states
# ---------------------------------------------------------------------------

def compute_match_scores(match_data: dict):
    """Compute total scores, map states, and winner for a match."""
    fmt = match_data["format"]
    total_maps = 5
    winners = []
    mapdone = []

    for i in range(1, total_maps + 1):
        m = match_data["maps"][f"map{i}"]
        t1 = int(m["t1"]) if m["t1"] else 0
        t2 = int(m["t2"]) if m["t2"] else 0
        if t1 > t2:
            winners.append(1)
        elif t2 > t1:
            winners.append(2)
        else:
            winners.append(0)
        mapdone.append(1 if m["done"] else 0)

    # Determine map states based on format
    if fmt == "ft1":
        if mapdone[0] == 0:
            match_data["maps"]["map1"]["state"] = "up next"
        else:
            match_data["maps"]["map1"]["state"] = "done"
    elif fmt == "ft2":
        for i in range(3):
            if mapdone[i] == 0:
                match_data["maps"][f"map{i+1}"]["state"] = "up next"
                for j in range(i + 1, 3):
                    match_data["maps"][f"map{j+1}"]["state"] = "unplayed"
                for j in range(3, total_maps):
                    match_data["maps"][f"map{j+1}"]["state"] = "unplayed"
                break
            else:
                match_data["maps"][f"map{i+1}"]["state"] = "done"
    elif fmt == "ft3":
        for i in range(total_maps):
            if mapdone[i] == 0:
                match_data["maps"][f"map{i+1}"]["state"] = "up next"
                for j in range(i + 1, total_maps):
                    match_data["maps"][f"map{j+1}"]["state"] = "unplayed"
                break
            else:
                match_data["maps"][f"map{i+1}"]["state"] = "done"

    # Count wins
    num_maps = {"ft1": 1, "ft2": 3, "ft3": 5}.get(fmt, 3)
    count1 = sum(1 for i in range(num_maps) if winners[i] == 1 and mapdone[i] == 1)
    count2 = sum(1 for i in range(num_maps) if winners[i] == 2 and mapdone[i] == 1)

    match_data["t1TotalScore"] = count1
    match_data["t2TotalScore"] = count2

    # Determine winner
    map_done_key = {"ft1": 0, "ft2": 2, "ft3": 4}.get(fmt, 2)
    if mapdone[map_done_key] == 1:
        if count1 > count2:
            match_data["winner"] = "t1"
        elif count2 > count1:
            match_data["winner"] = "t2"
        else:
            match_data["winner"] = "none"
    else:
        match_data["winner"] = "none"


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------

@app.get("/api/state")
def get_state():
    """Get the full application state."""
    return STATE


@app.get("/api/game-data")
def get_game_data_endpoint():
    """Get all game constants (heroes, maps, roles, etc.)."""
    return get_game_data()


@app.post("/api/mode")
def update_mode(data: ModeUpdate):
    """Update game selection and current match."""
    STATE["game"] = data.game
    STATE["currMatch"] = data.currMatch
    return {"status": "ok"}


@app.post("/api/general/info")
def update_general_info(data: GeneralInfoUpdate):
    """Update stream title, casters, and guests."""
    STATE["streamTitle"] = data.streamTitle
    STATE["subtitle"] = data.subtitle
    STATE["caster1"] = {"name": data.caster1Name, "info": data.caster1Info}
    STATE["caster2"] = {"name": data.caster2Name, "info": data.caster2Info}
    STATE["guest1"] = {"name": data.guest1Name, "info": data.guest1Info}
    STATE["guest2"] = {"name": data.guest2Name, "info": data.guest2Info}
    return {"status": "ok"}


@app.post("/api/general/schedule")
def update_schedule(data: ScheduleUpdate):
    """Update schedule (match count, formats, details)."""
    STATE["matchCount"] = data.matchCount
    STATE["matches"]["1"]["format"] = data.match1Format
    STATE["matches"]["1"]["details"] = data.match1Details
    STATE["matches"]["2"]["format"] = data.match2Format
    STATE["matches"]["2"]["details"] = data.match2Details
    STATE["matches"]["3"]["format"] = data.match3Format
    STATE["matches"]["3"]["details"] = data.match3Details
    return {"status": "ok"}


@app.post("/api/match/{match_number}")
def update_match(match_number: str, data: MatchUpdate):
    """Update a specific match's team/player/map data."""
    if match_number not in STATE["matches"]:
        return {"error": "Invalid match number"}

    match = STATE["matches"][match_number]
    match["team1"]["name"] = data.team1Name
    match["team1"]["logo"] = data.team1Logo
    match["team2"]["name"] = data.team2Name
    match["team2"]["logo"] = data.team2Logo

    for key, player in data.players.items():
        match["players"][key] = player.model_dump()

    for key, map_data in data.maps.items():
        match["maps"][key] = {**map_data.model_dump(), "state": match["maps"].get(key, {}).get("state", "unplayed")}

    # Recompute scores
    compute_match_scores(match)
    return {"status": "ok", "match": match}


@app.post("/api/match/{match_number}/swap")
def swap_teams(match_number: str):
    """Swap team 1 and team 2 for a match."""
    if match_number not in STATE["matches"]:
        return {"error": "Invalid match number"}

    match = STATE["matches"][match_number]
    # Swap team names and logos
    match["team1"], match["team2"] = match["team2"], match["team1"]

    # Swap players: p1-p5 <-> p6-p10, p11 <-> p12
    players = match["players"]
    for i in range(1, 6):
        p1_key = f"p{i}"
        p2_key = f"p{i + 5}"
        players[p1_key], players[p2_key] = players[p2_key], players[p1_key]

    # Swap player 6 (p11 <-> p12)
    if "p11" in players and "p12" in players:
        players["p11"], players["p12"] = players["p12"], players["p11"]

    # Swap map scores
    for i in range(1, 6):
        m = match["maps"][f"map{i}"]
        m["t1"], m["t2"] = m["t2"], m["t1"]

    # Recompute
    compute_match_scores(match)
    return {"status": "ok", "match": match}


@app.post("/api/match/{match_number}/clear")
def clear_match(match_number: str):
    """Clear all data for a specific match, preserving format."""
    if match_number not in STATE["matches"]:
        return {"error": "Invalid match number"}

    fmt = STATE["matches"][match_number]["format"]
    details = STATE["matches"][match_number]["details"]
    STATE["matches"][match_number] = make_default_match()
    STATE["matches"][match_number]["format"] = fmt
    STATE["matches"][match_number]["details"] = details
    return {"status": "ok"}


@app.post("/api/owban")
def update_ow_ban(data: OwBanUpdate):
    """Toggle OW hero ban state."""
    if data.team is None:
        STATE["owBans"].pop(data.hero, None)
    else:
        STATE["owBans"][data.hero] = data.team
    return {"status": "ok", "bans": STATE["owBans"]}


@app.post("/api/reset")
def reset_state():
    """Reset all state to defaults."""
    global STATE
    STATE = make_default_state()
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
