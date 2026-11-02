#!/usr/bin/env python3
"""Keep the game map lists and map tiles in step with the live games.

  check  Compare backend/game_data.py with each game's live data and report what
         is missing. Exits non-zero if any source can't be read, so a failed
         check is visible.
  tile   Build a map's missing tiles from a landscape image (needs Pillow).
"""

import argparse
import json
import re
import sys
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.dont_write_bytecode = True  # backend/__pycache__ is tracked in git

from game_data import MR_MAPS, OW_MAPS, VAL_MAPS  # noqa: E402

MAPS_DIR = ROOT / "frontend/src/components/overlays/assets/maps"
CORNER_RADIUS = 30

OW_MODES = {"control", "escort", "flashpoint", "hybrid", "push", "clash"}
# OverFast lists these under competitive modes, but they are only played in Stadium.
OW_STADIUM_ONLY = {
    "arena-victoriae", "gogadoro", "place-lacroix", "redwood-dam", "wuxing-university",
}
MR_MODES = {"Convergence", "Convoy", "Domination"}
MR_WIKI = "https://marvelrivals.fandom.com"

HOW_TO_ADD = """## How to add a map

1. Add the name to the game's map list in `backend/game_data.py`.
2. Find a landscape image at least 701px tall, such as the map's loading screen or key art.
3. Run `pip install pillow`, then
   `python scripts/game_maps.py tile GAME "Map Name" image.png --focus 0.5`,
   where GAME is `ow2`, `val` or `mr`.
   `--focus` is how far across the image (0 to 1) the tiles should be centred.
4. Check the new tiles in `frontend/src/components/overlays/assets/maps`, then commit.

If an Overwatch map is Stadium-only, add its key to `OW_STADIUM_ONLY` in `scripts/game_maps.py`.
"""


def fetch_json(url):
    request = urllib.request.Request(url, headers={"User-Agent": "prod-tool26-map-check"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def fetch_overwatch_maps():
    """Return competitive maps from OverFast, excluding Stadium-only ones."""
    return [
        {"name": m["name"], "mode": ", ".join(m["gamemodes"]), "image": m["screenshot"]}
        for m in fetch_json("https://overfast-api.tekrop.fr/maps")
        if OW_MODES.intersection(m["gamemodes"]) and m["key"] not in OW_STADIUM_ONLY
    ]


def fetch_valorant_maps():
    """Return competitive maps from valorant-api.com.

    Only maps with bomb sites have a tactical description, which leaves out
    Team Deathmatch, Skirmish and The Range.
    """
    return [
        {"name": m["displayName"], "mode": m["tacticalDescription"], "image": m["splash"]}
        for m in fetch_json("https://valorant-api.com/v1/maps")["data"]
        if m["tacticalDescription"]
    ]


def fetch_rivals_maps():
    """Return competitive maps from the Marvel Rivals wiki, which has no public API."""
    page = fetch_json(f"{MR_WIKI}/api.php?action=parse&page=Maps&prop=wikitext&format=json")
    sections = re.findall(
        r"^=== \[\[(\w+)\]\] ===\s*$(.*?)(?=^==|\Z)", page["parse"]["wikitext"]["*"], re.M | re.S
    )
    return [
        {
            # Maps are written as line1 "Hellfire Gala" and line2 "Arakko", or line1 alone.
            "name": line2 or line1,
            "mode": mode,
            "image": f"{MR_WIKI}/wiki/Special:FilePath/{urllib.parse.quote(image)}",
        }
        for mode, body in sections if mode in MR_MODES
        for image, line1, line2 in re.findall(
            r"\|img\s*=\s*(.*?)\s*\n\|line1\s*=\s*(.*?)\s*\n\|line2\s*=[ \t]*(.*?)[ \t]*$", body, re.M
        )
    ]


# Tile paths use {upper}, {lower} or {name}, matching resolveMapImg in MapsOverlay.jsx.
GAMES = {
    "ow2": {
        "label": "Overwatch",
        "maps": OW_MAPS,
        "fetch": fetch_overwatch_maps,
        "tiles": {
            "ow2/ft2/{upper}.png": (416, 701),
            "ow2/ft3/{upper}.png": (295, 701),
        },
    },
    "val": {
        "label": "Valorant",
        "maps": VAL_MAPS,
        "fetch": fetch_valorant_maps,
        "tiles": {
            "val/map_tile_valo_bo1_{lower}.png": (1262, 701),
            "val/map_tile_valo_bo3_{lower}.png": (416, 701),
            "val/map_tile_valo_bo5_{lower}.png": (295, 701),
        },
    },
    "mr": {
        "label": "Marvel Rivals",
        "maps": MR_MAPS,
        "fetch": fetch_rivals_maps,
        "tiles": {
            "rivals/Rivals_Map_{name}5-1.png": (1262, 701),
            "rivals/Rivals_Map_{name}3.png": (416, 701),
            "rivals/Rivals_Map_{name}5.png": (295, 701),
        },
    },
}


def clean_name(name):
    """Strip accents, spaces and punctuation, as MapsOverlay.jsx does."""
    decomposed = unicodedata.normalize("NFD", name)
    return "".join(c for c in decomposed if c.isalnum() and c.isascii())


def tile_path(template, name):
    clean = clean_name(name)
    return MAPS_DIR / template.format(name=clean, upper=clean.upper(), lower=clean.lower())


def build_game_report(game, live_maps):
    """Return Markdown sections for what needs attention in one game."""
    if not live_maps:
        raise ValueError("no maps found in the live data")

    label = game["label"]
    listed = {clean_name(name).upper(): name for name in game["maps"] if name != "+"}
    live_names = {clean_name(m["name"]).upper() for m in live_maps}
    sections = []

    new_maps = [
        f"- **{m['name']}** ({m['mode']}): {m['image']}"
        for m in live_maps
        if clean_name(m["name"]).upper() not in listed
    ]
    if new_maps:
        sections.append(f"## {label}: new maps\n\n" + "\n".join(new_maps))

    no_tiles = [
        f"- **{name}**: `{tile_path(template, name).relative_to(MAPS_DIR).as_posix()}`"
        for name in listed.values()
        for template in game["tiles"]
        if not tile_path(template, name).exists()
    ]
    if no_tiles:
        sections.append(f"## {label}: listed maps with no image\n\n" + "\n".join(no_tiles))

    unknown = [f"- **{name}**" for key, name in listed.items() if key not in live_names]
    if unknown:
        sections.append(
            f"## {label}: listed maps not in the live data\n\nThese may be misspelled or removed.\n\n"
            + "\n".join(unknown)
        )

    return sections


def make_tiles(game, name, source, focus, overwrite):
    from PIL import Image, ImageDraw

    image = Image.open(source).convert("RGB")
    for template, (width, height) in game["tiles"].items():
        path = tile_path(template, name)
        if path.exists() and not overwrite:
            print(f"Skipped {path.relative_to(ROOT)}, it already exists")
            continue

        scale = max(width / image.width, height / image.height)
        if scale > 1:
            print(f"Note: enlarging the image {scale:.2f}x for {path.name}")
        scaled = image.resize((round(image.width * scale), round(image.height * scale)), Image.LANCZOS)
        left = max(0, min(round(scaled.width * focus - width / 2), scaled.width - width))
        top = (scaled.height - height) // 2
        tile = scaled.crop((left, top, left + width, top + height)).convert("RGBA")

        # Draw the corners at 4x and scale down so their edges are smooth.
        mask = Image.new("L", (width * 4, height * 4), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, width * 4 - 1, height * 4 - 1), CORNER_RADIUS * 4, fill=255
        )
        tile.putalpha(mask.resize((width, height), Image.LANCZOS))

        tile.save(path)
        print(f"Wrote {path.relative_to(ROOT)}")


def check(report_path):
    sections = []
    failed = False
    # One unreachable source shouldn't hide what the others found.
    for game in GAMES.values():
        try:
            sections += build_game_report(game, game["fetch"]())
        except Exception as error:
            print(f"Could not check {game['label']}: {error}", file=sys.stderr)
            failed = True

    if sections:
        report = "\n\n".join(sections + [HOW_TO_ADD])
        print(report)
        if report_path:
            report_path.write_text(report, encoding="utf-8")
    elif not failed:
        print("All game maps are up to date.")
    return 1 if failed else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)

    check_parser = commands.add_parser("check")
    check_parser.add_argument("--report", type=Path, help="write the report here if there is one")

    tile_parser = commands.add_parser("tile")
    tile_parser.add_argument("game", choices=GAMES)
    tile_parser.add_argument("name")
    tile_parser.add_argument("source", type=Path)
    tile_parser.add_argument("--focus", type=float, default=0.5)
    tile_parser.add_argument("--overwrite", action="store_true", help="replace existing tiles")

    args = parser.parse_args()
    if args.command == "tile":
        make_tiles(GAMES[args.game], args.name, args.source, args.focus, args.overwrite)
        return 0
    return check(args.report)


if __name__ == "__main__":
    sys.exit(main())
