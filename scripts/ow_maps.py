#!/usr/bin/env python3
"""Keep the Overwatch map list and map tiles in step with the live game.

  check  Compare backend/game_data.py with OverFast and report what is missing.
         Exits non-zero if OverFast can't be read, so a failed check is visible.
  tile   Build a map's ft2 and ft3 tiles from a landscape image (needs Pillow).
"""

import argparse
import json
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))
sys.dont_write_bytecode = True  # backend/__pycache__ is tracked in git

from game_data import OW_MAPS  # noqa: E402

API_URL = "https://overfast-api.tekrop.fr/maps"
TILES_DIR = ROOT / "frontend/src/components/overlays/assets/maps/ow2"
TILE_SIZES = {"ft2": (416, 701), "ft3": (295, 701)}
CORNER_RADIUS = 30

COMPETITIVE_MODES = {"control", "escort", "flashpoint", "hybrid", "push", "clash"}
# OverFast lists these under competitive modes, but they are only played in Stadium.
STADIUM_ONLY = {
    "arena-victoriae", "gogadoro", "place-lacroix", "redwood-dam", "wuxing-university",
}

HOW_TO_ADD = """## How to add a map

1. Add the name to the right `OW_MAPS_*` list in `backend/game_data.py`.
2. Find a landscape image at least 701px tall, such as the map's loading screen.
3. Run `pip install pillow`, then
   `python scripts/ow_maps.py tile "Map Name" image.png --focus 0.5`.
   `--focus` is how far across the image (0 to 1) the tiles should be centred.
4. Check the new tiles in `maps/ow2/ft2` and `maps/ow2/ft3`, then commit.

If a map is Stadium-only, add its key to `STADIUM_ONLY` in `scripts/ow_maps.py`.
"""


def tile_name(name):
    """Return a map's image name, using the same rule as MapsOverlay.jsx."""
    decomposed = unicodedata.normalize("NFD", name)
    return "".join(c for c in decomposed if c.isalnum() and c.isascii()).upper()


def fetch_live_maps():
    """Return OverFast's competitive maps, excluding Stadium-only ones."""
    request = urllib.request.Request(API_URL, headers={"User-Agent": "prod-tool26-map-check"})
    with urllib.request.urlopen(request, timeout=30) as response:
        maps = json.load(response)
    live = [
        m for m in maps
        if COMPETITIVE_MODES.intersection(m["gamemodes"]) and m["key"] not in STADIUM_ONLY
    ]
    if not live:
        raise SystemExit("OverFast returned no competitive maps")
    return live


def build_report(live_maps):
    """Return a Markdown report of what needs attention, or None if nothing does."""
    listed = {tile_name(name): name for name in OW_MAPS if name != "+"}
    live_names = {tile_name(m["name"]) for m in live_maps}
    sections = []

    new_maps = [m for m in live_maps if tile_name(m["name"]) not in listed]
    if new_maps:
        lines = [f"- **{m['name']}** ({', '.join(m['gamemodes'])}): {m['screenshot']}" for m in new_maps]
        sections.append("## New maps\n\n" + "\n".join(lines))

    no_tiles = [
        f"- **{name}**: `{fmt}/{key}.png`"
        for key, name in listed.items()
        for fmt in TILE_SIZES
        if not (TILES_DIR / fmt / f"{key}.png").exists()
    ]
    if no_tiles:
        sections.append("## Listed maps with no image\n\n" + "\n".join(no_tiles))

    unknown = [f"- **{name}**" for key, name in listed.items() if key not in live_names]
    if unknown:
        sections.append(
            "## Listed maps OverFast doesn't have\n\nThese may be misspelled or removed.\n\n"
            + "\n".join(unknown)
        )

    return "\n\n".join(sections + [HOW_TO_ADD]) if sections else None


def make_tiles(name, source, focus):
    from PIL import Image, ImageDraw

    image = Image.open(source).convert("RGB")
    for fmt, (width, height) in TILE_SIZES.items():
        scaled = image.resize((round(image.width * height / image.height), height), Image.LANCZOS)
        left = max(0, min(round(scaled.width * focus - width / 2), scaled.width - width))
        tile = scaled.crop((left, 0, left + width, height)).convert("RGBA")

        # Draw the corners at 4x and scale down so their edges are smooth.
        mask = Image.new("L", (width * 4, height * 4), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, width * 4 - 1, height * 4 - 1), CORNER_RADIUS * 4, fill=255
        )
        tile.putalpha(mask.resize((width, height), Image.LANCZOS))

        path = TILES_DIR / fmt / f"{tile_name(name)}.png"
        tile.save(path)
        print(f"Wrote {path.relative_to(ROOT)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    commands = parser.add_subparsers(dest="command", required=True)

    check = commands.add_parser("check")
    check.add_argument("--report", type=Path, help="write the report here if there is one")

    tile = commands.add_parser("tile")
    tile.add_argument("name")
    tile.add_argument("source", type=Path)
    tile.add_argument("--focus", type=float, default=0.5)

    args = parser.parse_args()
    if args.command == "tile":
        make_tiles(args.name, args.source, args.focus)
        return

    report = build_report(fetch_live_maps())
    if report is None:
        print("Overwatch maps are up to date.")
        return
    print(report)
    if args.report:
        args.report.write_text(report, encoding="utf-8")


if __name__ == "__main__":
    main()
