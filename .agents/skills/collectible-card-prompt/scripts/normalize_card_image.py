#!/usr/bin/env python3
"""Normalize a generated card image to an exact 1024x1536 PNG without cropping."""

from __future__ import annotations

import argparse
from pathlib import Path
from statistics import median

from PIL import Image


TARGET_WIDTH = 1024
TARGET_HEIGHT = 1536


def sample_corner_color(image: Image.Image) -> tuple[int, int, int]:
    """Estimate the neutral outer background from small patches at all corners."""
    rgb = image.convert("RGB")
    patch = max(1, min(32, rgb.width // 20, rgb.height // 20))
    samples: list[tuple[int, int, int]] = []
    boxes = (
        (0, 0, patch, patch),
        (rgb.width - patch, 0, rgb.width, patch),
        (0, rgb.height - patch, patch, rgb.height),
        (rgb.width - patch, rgb.height - patch, rgb.width, rgb.height),
    )
    for box in boxes:
        samples.extend(rgb.crop(box).getdata())
    return tuple(int(median(channel)) for channel in zip(*samples))


def normalize(source: Path, destination: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(f"Source image does not exist: {source}")
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite existing output: {destination}")
    destination.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        image = opened.convert("RGBA")
        background = sample_corner_color(image)
        scale = min(TARGET_WIDTH / image.width, TARGET_HEIGHT / image.height)
        width = max(1, round(image.width * scale))
        height = max(1, round(image.height * scale))
        resized = image.resize((width, height), Image.Resampling.LANCZOS)

        canvas = Image.new("RGBA", (TARGET_WIDTH, TARGET_HEIGHT), (*background, 255))
        offset = ((TARGET_WIDTH - width) // 2, (TARGET_HEIGHT - height) // 2)
        canvas.alpha_composite(resized, offset)
        canvas.convert("RGB").save(destination, format="PNG", optimize=True)

    with Image.open(destination) as result:
        if result.size != (TARGET_WIDTH, TARGET_HEIGHT):
            destination.unlink(missing_ok=True)
            raise RuntimeError(f"Unexpected output size: {result.size}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fit a card image onto an exact 1024x1536 neutral canvas without cropping."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    normalize(args.source, args.destination)
    print(f"Saved exact {TARGET_WIDTH}x{TARGET_HEIGHT} PNG: {args.destination}")


if __name__ == "__main__":
    main()
