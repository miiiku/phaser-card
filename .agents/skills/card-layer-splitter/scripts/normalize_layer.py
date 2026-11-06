#!/usr/bin/env python3
"""Normalize a generated layer to an aligned 1024x1536 PNG canvas."""

from __future__ import annotations

import argparse
from pathlib import Path
from statistics import median

from PIL import Image


WIDTH = 1024
HEIGHT = 1536


def corner_color(image: Image.Image) -> tuple[int, int, int]:
    rgb = image.convert("RGB")
    patch = max(1, min(32, rgb.width // 20, rgb.height // 20))
    boxes = (
        (0, 0, patch, patch),
        (rgb.width - patch, 0, rgb.width, patch),
        (0, rgb.height - patch, patch, rgb.height),
        (rgb.width - patch, rgb.height - patch, rgb.width, rgb.height),
    )
    pixels: list[tuple[int, int, int]] = []
    for box in boxes:
        pixels.extend(rgb.crop(box).getdata())
    return tuple(int(median(values)) for values in zip(*pixels))


def normalize(source: Path, destination: Path, mode: str) -> None:
    if not source.is_file():
        raise FileNotFoundError(f"Source does not exist: {source}")
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite: {destination}")
    destination.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        rgba = opened.convert("RGBA")
        scale = min(WIDTH / rgba.width, HEIGHT / rgba.height)
        size = (max(1, round(rgba.width * scale)), max(1, round(rgba.height * scale)))
        resized = rgba.resize(size, Image.Resampling.LANCZOS)
        offset = ((WIDTH - size[0]) // 2, (HEIGHT - size[1]) // 2)

        if mode == "opaque":
            color = corner_color(rgba)
            canvas = Image.new("RGBA", (WIDTH, HEIGHT), (*color, 255))
            canvas.alpha_composite(resized, offset)
            alpha = Image.new("L", (WIDTH, HEIGHT), 255)
            canvas.putalpha(alpha)
        else:
            canvas = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, 0))
            canvas.alpha_composite(resized, offset)

        canvas.save(destination, format="PNG", optimize=True)

    with Image.open(destination) as result:
        if result.size != (WIDTH, HEIGHT) or result.mode != "RGBA":
            destination.unlink(missing_ok=True)
            raise RuntimeError(f"Unexpected output properties: {result.mode} {result.size}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--mode", choices=("opaque", "rgba"), required=True)
    args = parser.parse_args()
    normalize(args.source, args.destination, args.mode)
    print(f"Saved {args.mode} RGBA layer: {args.destination} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
