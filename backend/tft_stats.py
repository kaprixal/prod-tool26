"""
TFT player stats lookup for the team screen overlay.

Pulls rank, average placement, and most-used traits for a player from
tactics.tools' internal data API (ap.tft.tools) — there's no official public
TFT stats API, so this is undocumented and can break if they change it.
Trait display names/icons come from Riot's Community Dragon data dump
(a stable, widely-used public asset source), not from tactics.tools itself.

Everything is cached in-memory: player stats for 10 minutes (avoid hammering
tactics.tools), the trait name/icon table for 6 hours (it only changes when
a new TFT set ships).
"""

import json
import re
import time
import urllib.parse
import urllib.request

# TFT Set 17.0 — bump this (and TFT_SET_TAG below) when tactics.tools moves to
# a new set. Find the current numeric id by watching the network tab on a
# tactics.tools player page for a call to /player/stats2/<region>/.../<setId>/...
TFT_SET_ID = 170
TFT_SET_TAG = "s17"
# tactics.tools numbers sets as (set * 10), e.g. 170 = Set 17.0 — so the prior
# set is just -10. Holds even across .5 revisions (170 -> 160, not 165).
PREVIOUS_TFT_SET_ID = TFT_SET_ID - 10

APEX_TIERS = {"MASTER", "GRANDMASTER", "CHALLENGER"}

_HEADERS = {"User-Agent": "Mozilla/5.0", "Referer": "https://tactics.tools/"}

_trait_cache = {"data": None, "ts": 0}
_TRAIT_CACHE_TTL = 6 * 3600

_stats_cache = {}
_STATS_CACHE_TTL = 600

RANK_ICON_BASE = "https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests"
TRAIT_ICON_BASE = "https://raw.communitydragon.org/latest/game/assets/ux/traiticons"


def _http_get_json(url, headers=None, timeout=10):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_get_text(url, headers=None):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return resp.read().decode("utf-8")


def _load_trait_table():
    """trait apiName -> {name, icon}, cached for TFT_SET_TAG."""
    now = time.time()
    if _trait_cache["data"] and now - _trait_cache["ts"] < _TRAIT_CACHE_TTL:
        return _trait_cache["data"]

    text = _http_get_text(f"https://ap.tft.tools/static/{TFT_SET_TAG}/en.js", _HEADERS)
    m = re.search(r"window\.%sTraitsi18n\s*=\s*(\{.*?\});" % TFT_SET_TAG, text)
    names = json.loads(m.group(1)) if m else {}

    icons = {}
    try:
        cdragon = _http_get_json("https://raw.communitydragon.org/latest/cdragon/tft/en_us.json", _HEADERS, timeout=30)
        set_num = int(TFT_SET_TAG.lstrip("s"))
        set_entry = next(
            (s for s in cdragon.get("setData", []) if s.get("number") == set_num and s.get("mutator") == f"TFTSet{set_num}"),
            None,
        )
        if set_entry:
            for t in set_entry.get("traits", []):
                icon_path = t.get("icon", "")
                if icon_path:
                    slug = icon_path.rsplit("/", 1)[-1].replace(".tex", "").lower()
                    icons[t["apiName"]] = f"{TRAIT_ICON_BASE}/{slug}.png"
    except Exception:
        pass  # icons are a nice-to-have; names alone are still useful

    table = {trait_id: {"name": name, "icon": icons.get(trait_id)} for trait_id, name in names.items() if trait_id.startswith("TFT")}
    _trait_cache["data"] = table
    _trait_cache["ts"] = now
    return table


def _rank_icon(tier_word):
    return f"{RANK_ICON_BASE}/{tier_word.lower()}.svg" if tier_word else None


TIER_ORDER = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"]
DIVISIONS = ["IV", "III", "II", "I"]


def _tier_lp_sort_key(tier_text, lp):
    """Comparable (tierIdx, subValue) key — higher sorts as a better rank.
    Used to find the true peak across a rankHistory list, not just the last
    entry (a player can be way above their end-of-set rank mid-season)."""
    if not tier_text:
        return (-1, 0)
    parts = tier_text.strip().upper().split(" ")
    tier_idx = TIER_ORDER.index(parts[0]) if parts[0] in TIER_ORDER else -1
    if tier_idx == -1:
        return (-1, 0)
    if tier_idx >= 7:  # Master/Grandmaster/Challenger — no divisions, LP is continuous
        return (tier_idx, lp or 0)
    division = parts[1] if len(parts) > 1 else None
    div_idx = DIVISIONS.index(division) if division in DIVISIONS else 0
    return (tier_idx, div_idx * 100 + min(lp or 0, 99))


def _format_rank(tier_full_raw, lp):
    """'CHALLENGER I' -> word='CHALLENGER', display='Challenger' (apex tiers
    have no divisions; tactics.tools appends a stray 'I' anyway)."""
    if not tier_full_raw:
        return {"tier": None, "lp": lp, "icon": None}
    tier_word = tier_full_raw.split(" ")[0]
    display = tier_word.title() if tier_word.upper() in APEX_TIERS else tier_full_raw
    return {"tier": display, "lp": lp, "icon": _rank_icon(tier_word)}


def _fetch_previous_set_summary(game_name, tag_line, region):
    """Best-effort lookup of the player's TRUE peak rank within the previous
    set (scanning rankHistory, not just their end-of-set rank — a player can
    hit Challenger mid-set then decay back down by the time the set ends) and
    their average placement for that set. Returns None if they didn't play
    that set or the lookup fails — this is a nice-to-have, not core.

    Querying stats2 with a specific setId scopes BOTH seasonStats and
    rankHistory to that set (verified against the live API), so no manual
    set-boundary detection is needed here — just take the max of what comes
    back for that request."""
    try:
        url = (
            f"https://ap.tft.tools/player/stats2/{region}/"
            f"{urllib.parse.quote(game_name.lower())}/{urllib.parse.quote(tag_line.lower())}/"
            f"{PREVIOUS_TFT_SET_ID}/1"
        )
        raw = _http_get_json(url, _HEADERS)
    except Exception:
        return None

    sets_ranks = (raw.get("playerInfo") or {}).get("setsRanks") or []
    set_entry = next((s for s in sets_ranks if s.get("set") == PREVIOUS_TFT_SET_ID and s.get("played")), None)
    if not set_entry:
        return None

    rank_history = raw.get("rankHistory") or []
    final_ranked = set_entry.get("ranked") or [None, None, None, None]
    # Peak = best of every history snapshot plus the final recorded rank
    candidates = [(entry[1], entry[2]) for entry in rank_history] + [(final_ranked[1], final_ranked[2])]
    peak_tier, peak_lp = max(candidates, key=lambda c: _tier_lp_sort_key(*c), default=(None, None))

    avg_place = (raw.get("seasonStats") or {}).get("avgPlace")

    return {
        "setNumber": PREVIOUS_TFT_SET_ID // 10,
        "rank": _format_rank(peak_tier, peak_lp),
        "avgPlace": round(avg_place, 2) if avg_place is not None else None,
    }


def fetch_player_tft_stats(riot_id, region="na1", match_count=50):
    """riot_id must be 'gameName#tagLine'. Raises ValueError on bad input."""
    if "#" not in riot_id:
        raise ValueError(f"'{riot_id}' isn't a Riot ID (expected format: Name#Tag)")
    game_name, tag_line = (part.strip() for part in riot_id.split("#", 1))
    if not game_name or not tag_line:
        raise ValueError(f"'{riot_id}' isn't a valid Riot ID (expected format: Name#Tag)")

    cache_key = (region, game_name.lower(), tag_line.lower())
    now = time.time()
    cached = _stats_cache.get(cache_key)
    if cached and now - cached[0] < _STATS_CACHE_TTL:
        return cached[1]

    url = (
        f"https://ap.tft.tools/player/stats2/{region}/"
        f"{urllib.parse.quote(game_name.lower())}/{urllib.parse.quote(tag_line.lower())}/"
        f"{TFT_SET_ID}/{match_count}"
    )
    raw = _http_get_json(url, _HEADERS)

    player_info = raw.get("playerInfo") or {}
    season = raw.get("seasonStats") or {}
    ranked_league = player_info.get("rankedLeague") or [None, None]

    trait_table = _load_trait_table()
    trait_counts = {}
    for match in raw.get("matches", []):
        for t in match.get("info", {}).get("traits", []):
            if t.get("currentTier", 0) > 0:
                trait_counts[t["name"]] = trait_counts.get(t["name"], 0) + 1
    top_traits = sorted(trait_counts.items(), key=lambda kv: kv[1], reverse=True)[:3]

    previous_set = _fetch_previous_set_summary(game_name, tag_line, region)

    result = {
        "riotId": f"{game_name}#{tag_line}",
        "region": region,
        "rank": _format_rank(ranked_league[0], ranked_league[1]),
        "avgPlace": round(season["avgPlace"], 2) if season.get("avgPlace") is not None else None,
        "games": season.get("games"),
        "previousSet": previous_set,
        "topTraits": [
            {
                "id": trait_id,
                "count": count,
                "name": trait_table.get(trait_id, {}).get("name", trait_id),
                "icon": trait_table.get(trait_id, {}).get("icon"),
            }
            for trait_id, count in top_traits
        ],
    }
    _stats_cache[cache_key] = (now, result)
    return result
