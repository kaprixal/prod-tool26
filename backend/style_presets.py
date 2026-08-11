"""
Style preset definitions for overlay theming.

Each preset defines the font families and the asset subfolder used for
per-preset overlay assets (e.g. casters_and_interviews). `positions` is an
empty placeholder today, reserved for future per-preset coordinate overrides
(title/subtitle placement, etc.) without changing this shape.
"""

DEFAULT_STYLE_PRESET = "CIE2026"

STYLE_PRESETS = {
    "CIE2026": {
        "id": "CIE2026",
        "label": "CIE 2026",
        "fonts": {
            "built": "BuiltTilting",
            "integral": "IntegralCF",
        },
        "assetFolder": "CIE2026",
        "positions": {},
    },
    "UTES2026": {
        "id": "UTES2026",
        "label": "UTES 2026",
        "fonts": {
            "built": "BuiltTilting",
            "integral": "IntegralCF",
        },
        "assetFolder": "UTES2026",
        "positions": {},
    },
}


def get_style_presets():
    return {"presets": STYLE_PRESETS, "default": DEFAULT_STYLE_PRESET}
