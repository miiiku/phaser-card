# Layer contract

## Canvas and coordinates

- Canvas: 1024x1536 pixels, portrait.
- Origin: top-left `(0, 0)` for every file.
- Registration: a pixel at `(x, y)` must refer to the same card location in every layer.
- Scaling: normalize the source once, then keep all generated layer artwork in that coordinate system.
- Transparent padding: transparent layers retain the full canvas; never export tight sprites.

## Layer ownership

| Order | File | Required | Alpha | Owns |
|---:|---|:---:|---|---|
| 0 | `background.png` | yes | fully opaque | Complete repaired environment or abstract plate |
| 1 | `rear-decoration.png` | no | genuine RGBA | Halos, rings, runes, clouds, gears, or motifs behind subject |
| 2 | `subject.png` | yes | genuine RGBA | Character, creature, vehicle, main prop, and intrinsic effects |
| 3 | `foreground-decoration.png` | no | genuine RGBA | Sparks, petals, shards, ribbons, wisps, or ornaments in front |
| 4 | `frame.png` | yes | genuine RGBA | Top card frame, plaque, crest, and inseparable card furniture |

If an element is ambiguous, assign it to the layer that should move with it at runtime. Do not duplicate it in two layers.

## Hidden-region reconstruction

The flattened source cannot reveal the true pixels hidden by another layer. Reconstructed areas are plausible continuations:

- background: reconstruct a complete clean plate beneath all foreground content;
- subject: extend only enough hidden anatomy, clothing, armor, hair, props, and effects to avoid gaps during modest movement;
- decorations: finish interrupted curves or particles only when separation would reveal the missing section;
- frame: isolate visible frame pixels; do not invent background content in this layer.

Keep reconstructed regions stylistically consistent with neighboring visible pixels. Record substantial inference in `split-plan.md`.

## Acceptance checks

- Exactly 3-5 depth-layer PNGs exist.
- Every layer is 1024x1536 and registered to the same origin.
- Background alpha is 255 everywhere.
- Subject and frame contain both visible and transparent pixels.
- Optional layers are omitted rather than empty.
- Compositing in the specified order resembles the source composition.
- No checkerboard matte, white fringe, duplicate subject, subject-shaped background ghost, or hole behind an occluder.
- Small objects remain in place on a full transparent canvas.

## Output layout

```text
draft/<source-stem>-layers/
|-- source.png
|-- split-plan.md
|-- background.png
|-- rear-decoration.png          optional
|-- subject.png
|-- foreground-decoration.png   optional
|-- frame.png
|-- layer-manifest.json
`-- composite-preview.png
```
