#!/usr/bin/env python3
"""Create a filled full-card mask from an aligned transparent frame layer."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw


WIDTH = 1024
HEIGHT = 1536


def create_mask(frame_path: Path, destination: Path, threshold: int) -> None:
    if not frame_path.is_file():
        raise FileNotFoundError(f"Frame does not exist: {frame_path}")
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite: {destination}")

    with Image.open(frame_path) as opened:
        frame = opened.convert("RGBA")
    if frame.size != (WIDTH, HEIGHT):
        raise RuntimeError(f"Wrong frame canvas: {frame.size}")

    frame_alpha = frame.getchannel("A")
    barrier = frame_alpha.point(lambda value: 255 if value >= threshold else 0)
    exterior = barrier.copy()

    # Mark every transparent region connected to a canvas corner as exterior. A valid
    # card frame is a closed ring, so its central window remains unmarked and is filled.
    for seed in ((0, 0), (WIDTH - 1, 0), (0, HEIGHT - 1), (WIDTH - 1, HEIGHT - 1)):
        if exterior.getpixel(seed) == 0:
            ImageDraw.floodfill(exterior, seed, 128, thresh=0)

    center = (WIDTH // 2, HEIGHT // 2)
    if exterior.getpixel(center) == 128:
        raise RuntimeError(
            "Frame is not a closed contour at the selected threshold; central window connects to exterior"
        )

    # Interior pixels become fully opaque. Original frame alpha is retained on the
    # outer antialiased edge so the mask follows the frame silhouette precisely.
    filled_interior = exterior.point(lambda value: 255 if value == 0 else 0)
    mask_alpha = ImageChops.lighter(filled_interior, frame_alpha)

    mask = Image.new("RGBA", (WIDTH, HEIGHT), (255, 255, 255, 0))
    mask.putalpha(mask_alpha)
    destination.parent.mkdir(parents=True, exist_ok=True)
    mask.save(destination, format="PNG", optimize=True)

    with Image.open(destination) as result:
        alpha = result.convert("RGBA").getchannel("A")
        if result.size != (WIDTH, HEIGHT) or alpha.getpixel(center) != 255:
            destination.unlink(missing_ok=True)
            raise RuntimeError("Generated mask failed size or central-fill validation")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("frame", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--threshold", type=int, default=8)
    args = parser.parse_args()
    if not 1 <= args.threshold <= 254:
        parser.error("--threshold must be between 1 and 254")
    create_mask(args.frame, args.destination, args.threshold)
    print(f"Saved filled card mask: {args.destination} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
