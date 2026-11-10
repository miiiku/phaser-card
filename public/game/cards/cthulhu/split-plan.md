# Cosmic-Horror Card Layer Split Plan

- Source: `/Users/guanquanhong/Antler/mywork/my-card/draft/cthulhu-card.png`
- Normalized source: `source.png`
- Canvas: 1024×1536 pixels with one shared top-left origin and registration.

## Visual layers (back to front)

1. `background.png` — opaque abyssal star-cloud plate, reconstructed beneath every removed object while preserving the small neutral exterior margin outside the card silhouette.
2. `rear-decoration.png` — transparent eclipse disk, thin sea-green rune circle, and the two faint distant wing-shadow arcs behind the entity.
3. `subject.png` — transparent elder entity with head crown, facial tentacles, glowing eyes, folded physical wings, hands, robes, armor, and intrinsic gemstones/bioluminescence. Hidden continuations remain upper-body only.
4. `foreground-decoration.png` — transparent three floating black-green stone shards, detached green motes, and two violet void-wisp arcs in front of the lower torso.
5. `frame.png` — transparent complete obsidian/bronze/mother-of-pearl frame, corner shells, tentacle ornaments, green gems, side runes, inner-edge shadow, and bottom closed-eye crest.

## Auxiliary mask

- `mask.png` — deterministically derived from `frame.png`; solid opaque white across the entire card silhouette including the formerly open central window, transparent outside, antialiased only at the outer contour. It is excluded from the visual composite.

## Reconstruction notes

- Rebuild a seamless abyssal background beneath the entity, eclipse, rune circle, foreground effects, and frame with no subject-shaped ghost or frame residue.
- Complete eclipse and rune-circle segments hidden by the entity only enough for modest parallax.
- Extend supported robe, armor, wing, hand, and tentacle geometry 48–96 pixels beneath foreground wisps and inner-frame occlusion without inventing legs or a new pose.
- Complete short foreground wisp paths only where separation would reveal an abrupt cut.
