#!/usr/bin/env python3
"""Build the Overwatch ban screen's hero tiles from the wiki's 2D hero portraits.

  python scripts/ow_ban_tiles.py            Build every hero
  python scripts/ow_ban_tiles.py doctrine   Build the named tiles only

Needs Pillow. To add a hero, add them to HEROES and to OwBanOverlay.jsx.
scripts/game_maps.py uses build_hero_report here to check the screen is up to date.
"""

import argparse
import io
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TILES_DIR = ROOT / "frontend/src/components/overlays/assets/ow_ban_assets"
OVERLAY = ROOT / "frontend/src/components/overlays/OwBanOverlay.jsx"
FONT = ROOT / "frontend/public/fonts/Druk/DrukWide-Bold-Trial.otf"
WIKI_API = "https://overwatch.fandom.com/api.php"
HEROES_API = "https://overfast-api.tekrop.fr/heroes"
OVERLAY_ROLES = {"TANKS": "tank", "DPS": "damage", "SUPPORTS": "support"}

HOW_TO_UPDATE_HEROES = """## How to update the ban screen

1. Add new heroes to `HEROES` in `scripts/ow_ban_tiles.py`, using the wiki's
   `Name Hero.png` file if it has one, and to the role lists in `OwBanOverlay.jsx`.
2. Move any hero whose role changed to the right list in `OwBanOverlay.jsx`.
3. Run `pip install pillow`, then `python scripts/ow_ban_tiles.py NAME` for each new
   or changed portrait.
4. Check the new tiles in `ow_ban_assets`, then commit.
"""

TILE_SIZE = (129, 164)
CARD_COLOR = (14, 14, 14, 255)
WINDOW = (8, 9, 114)  # left, top, side length
LABEL_CENTER = 142
LABEL_CAP_HEIGHTS = {1: 11, 2: 9}  # by number of lines
LABEL_LINE_GAP = 4
LABEL_MAX_WIDTH = 115

# Measured from the original tiles: (position down the window, colour).
GRADIENT = [
    (0.00, (102, 122, 152)),
    (0.25, (152, 155, 172)),
    (0.50, (182, 176, 187)),
    (0.75, (211, 200, 204)),
    (1.00, (235, 220, 217)),
]

# Tile name: wiki file name and label. D.Mon and Doctrine have no 2D art on the wiki yet.
HEROES = {
    "ana": ("Ana Hero.png", "Ana"),
    "anran": ("Anran Hero.png", "Anran"),
    "ashe": ("Ashe Hero.png", "Ashe"),
    "baptiste": ("Baptiste Hero.png", "Baptiste"),
    "bastion": ("Bastion Hero.png", "Bastion"),
    "brigitte": ("Brigitte Hero.png", "Brigitte"),
    "cassidy": ("Cassidy Hero.png", "Cassidy"),
    "dmon": ("Icon-D.Mon.png", "D.Mon"),
    "doctrine": ("Icon-Doctrine.png", "Doctrine"),
    "domina": ("Domina Hero.png", "Domina"),
    "doomfist": ("Doomfist Hero.png", "Doomfist"),
    "dva": ("D.Va Hero.png", "D.Va"),
    "echo": ("Echo Hero.png", "Echo"),
    "emre": ("Emre Hero.png", "Emre"),
    "freja": ("Freja Hero.png", "Freja"),
    "genji": ("Genji Hero.png", "Genji"),
    "hanzo": ("Hanzo Hero.png", "Hanzo"),
    "hazard": ("Hazard Hero.png", "Hazard"),
    "illari": ("Illari Hero.png", "Illari"),
    "jetpack_cat": ("Jetpack Cat Hero.png", "Jetpack\nCat"),
    "junkerqueen": ("Junker Queen Hero.png", "Junker\nQueen"),
    "junkrat": ("Junkrat Hero.png", "Junkrat"),
    "juno": ("Juno Hero.png", "Juno"),
    "kiriko": ("Kiriko Hero.png", "Kiriko"),
    "lifeweaver": ("Lifeweaver Hero.png", "Lifeweaver"),
    "lucio": ("Lúcio Hero.png", "Lucio"),
    "mauga": ("Mauga Hero.png", "Mauga"),
    "mei": ("Mei Hero.png", "Mei"),
    "mercy": ("Mercy Hero.png", "Mercy"),
    "mizuki": ("Mizuki Hero.png", "Mizuki"),
    "moira": ("Moira Hero.png", "Moira"),
    "orisa": ("Orisa Hero.png", "Orisa"),
    "pharah": ("Pharah Hero.png", "Pharah"),
    "ramattra": ("Ramattra Hero.png", "Ramattra"),
    "reaper": ("Reaper Hero.png", "Reaper"),
    "reinhardt": ("Reinhardt Hero.png", "Reinhardt"),
    "roadhog": ("Roadhog Hero.png", "Roadhog"),
    "shion": ("Shion Hero.png", "Shion"),
    "sierra": ("Sierra Hero.png", "Sierra"),
    "sigma": ("Sigma Hero.png", "Sigma"),
    "sojourn": ("Sojourn Hero.png", "Sojourn"),
    "soldier76": ("Soldier 76 Hero.png", "Soldier 76"),  # the label font has no colon
    "sombra": ("Sombra Hero.webp", "Sombra"),
    "symmetra": ("Symmetra Hero.png", "Symmetra"),
    "torbjorn": ("Torbjörn Hero.png", "Torbjorn"),
    "tracer": ("Tracer Hero.png", "Tracer"),
    "vendetta": ("Vendetta Hero.png", "Vendetta"),
    "venture": ("Venture Hero.png", "Venture"),
    "widowmaker": ("Widowmaker Hero.png", "Widowmaker"),
    "winston": ("Winston Hero.png", "Winston"),
    "wreckingball": ("Wrecking Ball Hero.png", "Wrecking\nBall"),
    "wuyang": ("Wuyang Hero.png", "Wuyang"),
    "zarya": ("Zarya Hero.png", "Zarya"),
    "zenyatta": ("Zenyatta Hero.png", "Zenyatta"),
}


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "prod-tool26-ban-tiles"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def wiki_file_url(file_name):
    """Return a wiki file's URL, or None if the wiki doesn't have it."""
    query = urllib.parse.urlencode({
        "action": "query", "format": "json", "prop": "imageinfo",
        "iiprop": "url", "titles": f"File:{file_name}",
    })
    pages = json.loads(fetch(f"{WIKI_API}?{query}"))["query"]["pages"]
    page = next(iter(pages.values()))
    return page["imageinfo"][0]["url"] if "imageinfo" in page else None


def fetch_portrait(file_name):
    from PIL import Image

    url = wiki_file_url(file_name)
    if url is None:
        raise ValueError(f"the wiki has no file named {file_name}")
    return Image.open(io.BytesIO(fetch(url))).convert("RGBA")


def gradient_color(position):
    for (start, start_color), (end, end_color) in zip(GRADIENT, GRADIENT[1:]):
        if position <= end:
            t = (position - start) / (end - start)
            return tuple(round(a + (b - a) * t) for a, b in zip(start_color, end_color)) + (255,)
    return GRADIENT[-1][1] + (255,)


def draw_label(tile, text):
    """Draw the centred label, shrinking it if a line would overflow the card."""
    from PIL import Image, ImageDraw, ImageFont

    scale = 4  # draw large and scale down for smooth edges
    lines = text.upper().split("\n")
    cap_height = LABEL_CAP_HEIGHTS[len(lines)] * scale

    size = cap_height
    while -ImageFont.truetype(str(FONT), size).getbbox("H", anchor="ls")[1] < cap_height:
        size += 1
    font = ImageFont.truetype(str(FONT), size)
    while max(font.getlength(line) for line in lines) > LABEL_MAX_WIDTH * scale:
        size -= 1
        font = ImageFont.truetype(str(FONT), size)

    shown_cap = -font.getbbox("H", anchor="ls")[1]
    gap = LABEL_LINE_GAP * scale
    block = shown_cap * len(lines) + gap * (len(lines) - 1)
    baseline = LABEL_CENTER * scale + scale / 2 - block / 2 + shown_cap

    mask = Image.new("L", (TILE_SIZE[0] * scale, TILE_SIZE[1] * scale), 0)
    draw = ImageDraw.Draw(mask)
    for line in lines:
        draw.text((mask.width / 2, baseline), line, font=font, fill=255, anchor="ms")
        baseline += shown_cap + gap
    tile.paste((255, 255, 255, 255), (0, 0), mask.resize(TILE_SIZE, Image.LANCZOS))


def build_tile(portrait, label):
    from PIL import Image

    left, top, side = WINDOW
    tile = Image.new("RGBA", TILE_SIZE, CARD_COLOR)
    window = Image.new("RGBA", (side, side))
    for y in range(side):
        window.paste(gradient_color(y / (side - 1)), (0, y, side, y + 1))
    window.alpha_composite(portrait.resize((side, side), Image.LANCZOS))
    tile.paste(window, (left, top))
    draw_label(tile, label)
    return tile


def overlay_roster():
    """Return {tile name: role} from the hero lists in OwBanOverlay.jsx."""
    source = OVERLAY.read_text(encoding="utf-8")
    roster = {}
    for list_name, role in OVERLAY_ROLES.items():
        heroes = re.search(rf"const {list_name} = \[(.*?)\];", source, re.S).group(1)
        roster.update({name: role for name in re.findall(r"'(\w+)'", heroes)})
    return roster


def hero_id(key):
    """Reduce a tile name or OverFast key to letters and digits, so they compare equal."""
    return re.sub(r"[^a-z0-9]", "", key.lower())


def build_hero_report():
    """Return Markdown sections for what needs attention on the ban screen."""
    live = json.loads(fetch(HEROES_API))
    if not live:
        raise ValueError("no heroes found in the live data")

    roster = overlay_roster()
    if not roster:
        raise ValueError("no heroes found in OwBanOverlay.jsx")
    live_by_id = {hero_id(h["key"]): h for h in live}
    roster_ids = {hero_id(name): name for name in roster}
    sections = []

    new_heroes = [
        f"- **{h['name']}** ({h['role']})" for h in live if hero_id(h["key"]) not in roster_ids
    ]
    if new_heroes:
        sections.append("## Overwatch: new heroes\n\n" + "\n".join(new_heroes))

    role_changes = [
        f"- **{live_by_id[hero_id(name)]['name']}**: listed as {role}, "
        f"now {live_by_id[hero_id(name)]['role']}"
        for name, role in roster.items()
        if hero_id(name) in live_by_id and live_by_id[hero_id(name)]["role"] != role
    ]
    if role_changes:
        sections.append("## Overwatch: hero role changes\n\n" + "\n".join(role_changes))

    unknown = [f"- **{name}**" for name in roster if hero_id(name) not in live_by_id]
    if unknown:
        sections.append(
            "## Overwatch: ban screen heroes not in the live data\n\n"
            "These may be misspelled or removed.\n\n" + "\n".join(unknown)
        )

    no_tiles = [
        f"- **{name}**: `{name}.png`" for name in roster
        if name not in HEROES or not (TILES_DIR / f"{name}.png").exists()
    ]
    if no_tiles:
        sections.append("## Overwatch: ban screen heroes with no tile\n\n" + "\n".join(no_tiles))

    # Heroes without 2D art use an Icon- file until the wiki adds a Hero file.
    new_art = [
        f"- **{label}**: `{file_name}`"
        for file_name, label in (
            (f"{label} Hero.{extension}", label)
            for wiki_file, label in HEROES.values() if wiki_file.startswith("Icon-")
            for extension in ("png", "webp")
        )
        if wiki_file_url(file_name)
    ]
    if new_art:
        sections.append("## Overwatch: new 2D portraits on the wiki\n\n" + "\n".join(new_art))

    return sections + [HOW_TO_UPDATE_HEROES] if sections else []


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("names", nargs="*", metavar="NAME")
    args = parser.parse_args()
    unknown = set(args.names) - set(HEROES)
    if unknown:
        parser.error(f"unknown heroes: {', '.join(sorted(unknown))}")

    skipped = []
    for name in args.names or HEROES:
        file_name, label = HEROES[name]
        portrait = fetch_portrait(file_name)
        # With no transparency the gradient can't show, so keep the existing tile.
        if portrait.getchannel("A").getextrema()[0] == 255:
            skipped.append(name)
            continue
        build_tile(portrait, label).save(TILES_DIR / f"{name}.png")
        print(f"Wrote {name}.png")

    if skipped:
        print(f"Skipped, portrait has no transparent background: {', '.join(skipped)}")


if __name__ == "__main__":
    main()
