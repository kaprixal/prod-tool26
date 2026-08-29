"""
Full 8-player TFT lobby history for the last N games of a given player.

Uses MetaTFT's public (undocumented) API: the queried player's recent match
list comes from their "full_profile" endpoint, and each individual match's
complete lobby (all 8 participants — placement, level, gold left, damage,
traits, units) comes from MetaTFT's static per-match CDN file, which mirrors
Riot's own official TFT match-v1 schema. There is no reroll/shop data here —
Riot's match API doesn't track that at all, on any source checked.
"""

import json
import time
import urllib.parse
import urllib.request

from tft_stats import _HEADERS, _load_trait_table, _load_unit_table, _load_item_table, TFT_SET_TAG

_PROFILE_CACHE_TTL = 600  # a player's recent-match list can change any minute
_MATCH_CACHE_TTL = 24 * 3600  # a finished match's data never changes

_profile_cache = {}
_match_cache = {}


def _http_get_json(url, headers=None, timeout=10):
    req = urllib.request.Request(url, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _fetch_profile_matches(game_name, tag_line, region):
    cache_key = (region.upper(), game_name.lower(), tag_line.lower())
    now = time.time()
    cached = _profile_cache.get(cache_key)
    if cached and now - cached[0] < _PROFILE_CACHE_TTL:
        return cached[1]

    set_param = f"TFTSet{TFT_SET_TAG.lstrip('s')}"
    url = (
        f"https://api.metatft.com/public/profile/lookup_by_riotid/"
        f"{region.upper()}/{urllib.parse.quote(game_name)}/{urllib.parse.quote(tag_line)}"
        f"?source=full_profile&tft_set={set_param}&include_revival_matches=true"
    )
    data = _http_get_json(url, _HEADERS, timeout=15)
    matches = data.get("matches", [])
    _profile_cache[cache_key] = (now, matches)
    return matches


def _fetch_full_match(match_data_url, match_id):
    now = time.time()
    cached = _match_cache.get(match_id)
    if cached and now - cached[0] < _MATCH_CACHE_TTL:
        return cached[1]
    data = _http_get_json(match_data_url, _HEADERS, timeout=15)
    _match_cache[match_id] = (now, data)
    return data


def _summarize_participant(p, trait_table, unit_table, item_table):
    active_traits = []
    for t in p.get("traits", []):
        tier = t.get("tier_current", 0)
        if tier <= 0:
            continue
        base_id = t.get("name")
        info = trait_table.get(base_id, {})
        active_traits.append({
            "id": base_id,
            "tier": tier,
            "name": info.get("name", base_id),
            "icon": info.get("icon"),
        })
    active_traits.sort(key=lambda t: (t["tier"] or 0), reverse=True)

    units = []
    for u in p.get("units", []):
        unit_id = u.get("character_id")
        info = unit_table.get(unit_id, {})
        item_ids = u.get("itemNames", [])
        units.append({
            "id": unit_id,
            "name": info.get("name", unit_id),
            "icon": info.get("icon"),
            "starLevel": u.get("tier"),  # 1/2/3-star
            "items": [
                {
                    "id": item_id,
                    "name": item_table.get(item_id, {}).get("name", item_id),
                    "icon": item_table.get(item_id, {}).get("icon"),
                }
                for item_id in item_ids
            ],
        })
    units.sort(key=lambda u: (u["starLevel"] or 0), reverse=True)

    return {
        "riotId": f"{p.get('riotIdGameName', '')}#{p.get('riotIdTagline', '')}",
        "placement": p.get("placement"),
        "level": p.get("level"),
        "goldLeft": p.get("gold_left"),
        "totalDamageToPlayers": p.get("total_damage_to_players"),
        "playersEliminated": p.get("players_eliminated"),
        "lastRound": p.get("last_round"),
        "win": p.get("win"),
        "traits": active_traits,
        "units": units,
    }


def fetch_recent_lobbies(riot_id, region="na1", count=1):
    """riot_id must be 'gameName#tagLine'. Returns up to `count` (clamped
    1-2 — the lobby history page's rows are sized large enough that more
    than 2 games won't fit on one screen) most recent games, each with the
    full 8-player lobby breakdown, newest first. Raises ValueError on bad
    input."""
    if "#" not in riot_id:
        raise ValueError(f"'{riot_id}' isn't a Riot ID (expected format: Name#Tag)")
    game_name, tag_line = (part.strip() for part in riot_id.split("#", 1))
    if not game_name or not tag_line:
        raise ValueError(f"'{riot_id}' isn't a valid Riot ID (expected format: Name#Tag)")
    count = max(1, min(2, count))

    # Normal (1090) only — excludes Ranked, Hyper Roll/Choncc's Treasure, etc.
    NORMAL_QUEUES = {1090}
    all_matches = _fetch_profile_matches(game_name, tag_line, region)
    matches_meta = [m for m in all_matches if m.get("queue_id") in NORMAL_QUEUES][:count]
    trait_table = _load_trait_table()
    unit_table = _load_unit_table()
    item_table = _load_item_table()

    results = []
    for m in matches_meta:
        match_id = m.get("riot_match_id")
        match_data_url = m.get("match_data_url")
        if not match_id or not match_data_url:
            continue
        try:
            full = _fetch_full_match(match_data_url, match_id)
        except Exception:
            continue
        participants = (full.get("info") or {}).get("participants", [])
        results.append({
            "matchId": match_id,
            "timestamp": m.get("match_timestamp"),
            "queueId": m.get("queue_id"),
            "gameDuration": m.get("game_duration"),
            "patch": m.get("patch"),
            "participants": sorted(
                (_summarize_participant(p, trait_table, unit_table, item_table) for p in participants),
                key=lambda p: p["placement"] or 99,
            ),
        })
    return results
