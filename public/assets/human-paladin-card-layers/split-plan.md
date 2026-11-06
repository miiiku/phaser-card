# Human Paladin Card — Split Plan

- Source: `draft/human-paladin-card.png`
- Normalized canvas: 1024×1536 RGBA
- Output: five aligned depth layers

## Ownership, back to front

1. `background.png`: complete opaque blue, ivory, and muted-gold atmospheric plate. Remove and reconstruct beneath the halo, paladin, hammer, shield, light ribbons, particles, and card frame.
2. `rear-decoration.png`: the golden circular sun halo, long radial rays, and small geometric star rays behind the paladin. Exclude foreground motes and lower light ribbons.
3. `subject.png`: the human paladin, hair, face, beard, armor, blue mantle, hammer, shield, and intrinsic armor-gem glow. Exclude the halo, detached lower ribbons and shards, and card frame.
4. `foreground-decoration.png`: the two lower sweeping golden light ribbons plus detached golden motes and diamond shards in front of the paladin.
5. `frame.png`: the silver-gold top card frame, blue enamel corner inserts, bottom integrated plaque, and centered amber diamond crest. Exclude all central art.

## Reconstruction

- Rebuild a clean background under every removed layer without subject or frame ghosts.
- Complete the halo circle and rays behind the head and shoulders.
- Extend armor, mantle, shield, and hammer only where hidden by the lower ribbons or frame, with modest parallax overscan; do not invent legs or a full body.
- Complete interrupted foreground ribbon curves behind the shield and lower torso.
- Preserve exact source registration and visible geometry for the frame.
