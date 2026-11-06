#!/usr/bin/env python3
"""Validate aligned card layers and assemble a composite preview and manifest."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


WIDTH = 1024
HEIGHT = 1536
ORDER = (
    "background.png",
    "rear-decoration.png",
    "subject.png",
    "foreground-decoration.png",
    "frame.png",
)
REQUIRED = {"background.png", "subject.png", "frame.png"}


def alpha_stats(image: Image.Image) -> dict[str, object]:
    alpha = image.getchannel("A")
    extrema = alpha.getextrema()
    histogram = alpha.histogram()
    visible = sum(histogram[1:])
    total = image.width * image.height
    return {
        "alpha_min": extrema[0],
        "alpha_max": extrema[1],
        "visible_fraction": round(visible / total, 6),
        "alpha_bbox": alpha.getbbox(),
    }


def validate(job: Path) -> None:
    missing = sorted(name for name in REQUIRED if not (job / name).is_file())
    if missing:
        raise RuntimeError(f"Missing required layers: {', '.join(missing)}")

    present = [name for name in ORDER if (job / name).is_file()]
    if not 3 <= len(present) <= 5:
        raise RuntimeError(f"Expected 3-5 layers, found {len(present)}")

    manifest: dict[str, object] = {
        "canvas": {"width": WIDTH, "height": HEIGHT},
        "order_back_to_front": present,
        "layers": {},
        "warnings": [],
    }
    composite = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))

    for name in present:
        path = job / name
        with Image.open(path) as opened:
            if opened.format != "PNG":
                raise RuntimeError(f"Layer is not PNG: {name}")
            image = opened.convert("RGBA")
            if image.size != (WIDTH, HEIGHT):
                raise RuntimeError(f"Wrong canvas for {name}: {image.size}")
            stats = alpha_stats(image)

            if name == "background.png":
                if stats["alpha_min"] != 255 or stats["alpha_max"] != 255:
                    raise RuntimeError("background.png must be fully opaque")
            else:
                if stats["alpha_min"] != 0:
                    raise RuntimeError(f"{name} has no fully transparent pixels")
                if stats["alpha_max"] == 0:
                    raise RuntimeError(f"{name} is empty")
                fraction = float(stats["visible_fraction"])
                if fraction < 0.001:
                    raise RuntimeError(f"{name} is effectively empty")
                if fraction > 0.9:
                    manifest["warnings"].append(
                        f"{name} covers more than 90% of the canvas; inspect for a baked matte"
                    )

            manifest["layers"][name] = stats
            composite.alpha_composite(image)

    composite.convert("RGB").save(job / "composite-preview.png", format="PNG", optimize=True)
    (job / "layer-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Validated {len(present)} aligned layers in {job}")
    for name in present:
        stats = manifest["layers"][name]
        print(f"- {name}: visible={stats['visible_fraction']} bbox={stats['alpha_bbox']}")
    for warning in manifest["warnings"]:
        print(f"WARNING: {warning}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("job", type=Path)
    args = parser.parse_args()
    validate(args.job)


if __name__ == "__main__":
    main()
