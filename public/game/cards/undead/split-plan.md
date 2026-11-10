# Undead Card Layer Split Plan

- Source: `/Users/guanquanhong/Antler/mywork/my-card/draft/undead-card.png`
- Normalized source: `source.png`
- Canvas: 1024×1536 pixels, shared top-left origin and registration across all layers.

## Layer ownership (back to front)

1. `background.png` — fully opaque charcoal, midnight-blue, and teal grave-mist plate. Remove and reconstruct beneath every other layer, including the frame and the neutral exterior margin.
2. `rear-decoration.png` — transparent full-canvas layer containing the cyan necromantic rune circle and the broken antique-gold funerary halo behind the character.
3. `subject.png` — transparent full-canvas layer containing the hooded undead warrior, skull, glowing eyes, armor, hands, runeblade, and effects intrinsic to the warrior. Continue hidden armor, cloth, and blade geometry modestly beneath occluders without inventing legs or a new pose.
4. `foreground-decoration.png` — transparent full-canvas layer containing the detached lower teal soul-wisp arcs, tiny ash motes, and floating bone fragments in front of the lower torso.
5. `frame.png` — transparent full-canvas layer containing the complete blackened-silver and dark-gold outer frame, bone corner ornaments, teal gems, engraved rails, inner-edge shadow, and bottom skull-and-crescent crest.

## Ambiguous ownership

- The teal glow attached directly to the eyes and the cyan runes etched into the sword remain with `subject.png` because they move with the character.
- The circular rune marks and broken gold halo behind the hood belong to `rear-decoration.png`.
- Detached wisps and loose bones below the hands belong to `foreground-decoration.png`; surrounding atmospheric fog belongs to `background.png`.
- All corner bones embedded in the border and the bottom skull crest remain inseparable parts of `frame.png`.

## Reconstruction notes

- Reconstruct a continuous dark grave-mist background beneath the warrior, halo, wisps, and frame, with no subject-shaped ghost, frame residue, or empty holes.
- Complete halo and rune-circle segments hidden by the hood and shoulders only enough for modest parallax movement.
- Extend the warrior's cloth, armor, arms, and sword 48–96 pixels beneath overlapping wisps and inner-frame boundaries where supported by visible geometry; do not create a full lower body.
- Complete short wisp curves behind the arms only when needed to avoid exposed cut ends during parallax.
