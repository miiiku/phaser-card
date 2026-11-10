# Split plan

- Front source: `draft/cosmic-octopus-2-card.png`
- Card-back source: `draft/cosmic-octopus-2-card-back.png`
- Normalized canvas: 1024x1536, shared origin and registration.
- Front depth order: `background.png` → `rear-decoration.png` → `subject.png` → `foreground-decoration.png` → `frame.png`.
- `background.png` owns the complete repaired midnight abyss with no creature, eclipse, runes, crystals, wisps, or frame.
- `rear-decoration.png` owns the broken eclipse and incomplete sea-green rune arc behind the creature.
- `subject.png` owns the three-quarter-view shell-armored octopus and all intrinsic armor/glow; hidden continuations beneath the frame and foreground accents are reconstructed only far enough for modest parallax.
- `foreground-decoration.png` owns the three lower dark crystals and detached violet current wisps.
- `frame.png` and `mask.png` reuse the established Cthulhu-series master assets from `draft/cthulhu-card-layers/` because this card deliberately uses the same normalized frame geometry, margins, corner furniture, crest, and registration.
- The generated reverse is an independent coordinated card-back design, not a mirrored front. `card-back.png` will receive the exact alpha channel from `mask.png`.
- Hidden pixels in the background, subject, and ornaments are plausible generative reconstructions rather than recoverable source pixels.
