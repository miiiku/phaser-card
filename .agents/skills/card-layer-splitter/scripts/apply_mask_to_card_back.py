#!/usr/bin/env python3
"""Apply the exact full-card mask alpha to a normalized card-back design."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


WIDTH = 1024
HEIGHT = 1536


def apply_mask(card_back_path: Path, mask_path: Path, destination: Path) -> None:
    for label, path in (("Card back", card_back_path), ("Mask", mask_path)):
        if not path.is_file():
            raise FileNotFoundError(f"{label} does not exist: {path}")
    if destination.exists():
        raise FileExistsError(f"Refusing to overwrite: {destination}")

    with Image.open(card_back_path) as opened:
        card_back = opened.convert("RGBA")
    with Image.open(mask_path) as opened:
        mask = opened.convert("RGBA")

    expected = (WIDTH, HEIGHT)
    if card_back.size != expected:
        raise RuntimeError(f"Wrong card-back canvas: {card_back.size}")
    if mask.size != expected:
        raise RuntimeError(f"Wrong mask canvas: {mask.size}")

    mask_alpha = mask.getchannel("A")
    if mask_alpha.getextrema() != (0, 255):
        raise RuntimeError("Mask must contain transparent exterior and opaque card pixels")

    card_back.putalpha(mask_alpha)
    destination.parent.mkdir(parents=True, exist_ok=True)
    card_back.save(destination, format="PNG", optimize=True)

    with Image.open(destination) as result:
        if result.size != expected or result.convert("RGBA").getchannel("A").tobytes() != mask_alpha.tobytes():
            destination.unlink(missing_ok=True)
            raise RuntimeError("Generated card back failed size or alpha validation")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("card_back", type=Path)
    parser.add_argument("mask", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    apply_mask(args.card_back, args.mask, args.destination)
    print(f"Saved masked card back: {args.destination} ({WIDTH}x{HEIGHT})")


if __name__ == "__main__":
    main()
