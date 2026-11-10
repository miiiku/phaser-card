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
MASK = "mask.png"
CARD_BACK = "card-back.png"


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
    missing = sorted(name for name in REQUIRED | {MASK, CARD_BACK} if not (job / name).is_file())
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

    mask_path = job / MASK
    with Image.open(mask_path) as opened:
        if opened.format != "PNG":
            raise RuntimeError("mask.png is not PNG")
        mask = opened.convert("RGBA")
        if mask.size != (WIDTH, HEIGHT):
            raise RuntimeError(f"Wrong canvas for mask.png: {mask.size}")
        mask_stats = alpha_stats(mask)
        if mask_stats["alpha_min"] != 0 or mask_stats["alpha_max"] != 255:
            raise RuntimeError("mask.png must contain transparent exterior and opaque card pixels")
        center_alpha = mask.getchannel("A").getpixel((WIDTH // 2, HEIGHT // 2))
        if center_alpha != 255:
            raise RuntimeError("mask.png central window must be filled and fully opaque")
        alpha = mask.getchannel("A")
        if alpha.getbbox() is None:
            raise RuntimeError("mask.png is empty")
        frame_bbox = manifest["layers"]["frame.png"]["alpha_bbox"]
        if mask_stats["alpha_bbox"] != frame_bbox:
            raise RuntimeError(
                f"mask.png outer registration differs from frame.png: "
                f"{mask_stats['alpha_bbox']} != {frame_bbox}"
            )
        rgb = mask.convert("RGB")
        for color, opacity in zip(rgb.getdata(), alpha.getdata()):
            if opacity and color != (255, 255, 255):
                raise RuntimeError("mask.png visible pixels must be pure white")
        manifest["mask"] = {
            **mask_stats,
            "role": "auxiliary full-card effect mask; excluded from composite",
        }

    card_back_path = job / CARD_BACK
    with Image.open(card_back_path) as opened:
        if opened.format != "PNG":
            raise RuntimeError("card-back.png is not PNG")
        card_back = opened.convert("RGBA")
        if card_back.size != (WIDTH, HEIGHT):
            raise RuntimeError(f"Wrong canvas for card-back.png: {card_back.size}")
        card_back_stats = alpha_stats(card_back)
        if card_back.getchannel("A").tobytes() != mask.getchannel("A").tobytes():
            raise RuntimeError("card-back.png alpha must match mask.png exactly")
        manifest["card_back"] = {
            **card_back_stats,
            "role": "complete reverse-side asset; excluded from front composite",
        }

    composite.convert("RGB").save(job / "composite-preview.png", format="PNG", optimize=True)
    (job / "layer-manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"Validated {len(present)} aligned layers in {job}")
    for name in present:
        stats = manifest["layers"][name]
        print(f"- {name}: visible={stats['visible_fraction']} bbox={stats['alpha_bbox']}")
    print(f"- mask.png: visible={mask_stats['visible_fraction']} bbox={mask_stats['alpha_bbox']}")
    print(
        f"- card-back.png: visible={card_back_stats['visible_fraction']} "
        f"bbox={card_back_stats['alpha_bbox']}"
    )
    for warning in manifest["warnings"]:
        print(f"WARNING: {warning}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("job", type=Path)
    args = parser.parse_args()
    validate(args.job)


if __name__ == "__main__":
    main()
