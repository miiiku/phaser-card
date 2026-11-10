# Cosmic Octopus Card Layer Split Plan

- Source: `/Users/guanquanhong/Antler/mywork/my-card/draft/cosmic-octopus-card.png`
- Normalized source: `source.png`
- Canvas: 1024×1536 pixels with a shared top-left origin and registration.
- Set master: `/Users/guanquanhong/Antler/mywork/my-card/draft/cthulhu-card-layers/`

## Frame reuse decision

- Pixel comparison over the previous frame's Alpha region found zero-offset alignment to be the best match: approximately 8/255 mean channel difference, versus roughly 15/255 after a one-pixel shift.
- `frame.png` and `mask.png` are byte-identical copies of the previous Cthulhu card assets. They are intentionally reused instead of regenerated so both cards share one exact runtime frame and mask.

## Visual layers (back to front)

1. `background.png` — opaque abyssal star-cloud plate with the same neutral exterior margin, reconstructed beneath all removed content.
2. `rear-decoration.png` — transparent eclipse disk, broken sea-green rune circle, and two distant wing-like current shadows behind the octopus.
3. `subject.png` — transparent ancient octopus: mantle, luminous eyes, eight tentacles, suckers, attached bronze bands, pearl ornaments, and intrinsic glow. Hidden portions are extended only enough for modest parallax.
4. `foreground-decoration.png` — transparent three black-pearl bubbles, detached green motes, and two violet void-wisp arcs below the tentacle coils.
5. `frame.png` — reused exact set-master frame; no image generation.

## Auxiliary mask

- `mask.png` — reused exact set-master full-card white mask; central window filled and exterior transparent.

## Reconstruction notes

- Reconstruct a continuous star-cloud background beneath the octopus, rear decorations, foreground effects, and frame without a subject-shaped ghost or frame residue.
- Complete eclipse/rune segments hidden by the mantle only enough for parallax.
- Preserve exactly eight readable tentacles and extend only supported tips beneath foreground effects or inner-frame occlusion; do not invent a humanoid body or extra tentacles.
- Keep all detached bubbles, motes, and violet wisps out of the subject layer.

## QA note

- One targeted subject correction was tested to reduce the soft gray-violet aura, but it expanded the semi-transparent matte and was rejected. The original extraction was retained because its alpha footprint is tighter and its composite is closer to the source.
