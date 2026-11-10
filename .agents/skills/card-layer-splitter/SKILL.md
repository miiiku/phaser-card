---
name: card-layer-splitter
description: "Split a collectible-card front and its matching back design into 3-5 aligned front visual layers plus a solid mask and transparent card-back asset, all at 1024x1536. Use when a card—especially a front/back pair produced by collectible-card-prompt—must become editable, effect-mask-ready, flip-ready, or parallax-ready assets; do not use for ordinary image cropping or when a native layered source already exists."
---

# Card Layer Splitter

Convert a flattened card front and matching card-back design into a small aligned asset set for runtime compositing and card flipping. Preserve the visible designs while reconstructing only front artwork hidden by higher layers. Hidden pixels are an inpainted approximation, never an exact recovery.

## Deliverable contract

Create a new non-overwriting job directory at `draft/<source-stem>-layers/`. Read [references/layer-contract.md](references/layer-contract.md) before planning the split.

Every layer file must:

- be a PNG exactly 1024x1536 pixels;
- use the same canvas origin, scale, and registration as the normalized source;
- keep the full canvas even when the visible object is small;
- leave unused pixels transparent rather than cropping to the object's bounding box;
- preserve soft edge alpha without a painted checkerboard, white halo, or matte fringe.

Produce 3-5 visual layer assets in this back-to-front order:

1. `background.png` — required, fully opaque, and reconstructed behind every removed subject, decoration, and frame region;
2. `rear-decoration.png` — optional transparent RGBA for motifs behind the subject;
3. `subject.png` — required transparent RGBA, preserving the visible subject and plausibly extending portions hidden by the frame or foreground decoration;
4. `foreground-decoration.png` — optional transparent RGBA for effects or ornaments in front of the subject;
5. `frame.png` — required transparent RGBA containing only the top card frame, plaque, crest, and inseparable card furniture.

Also produce two required full-canvas assets outside the front depth stack:

- `mask.png` uses the same full canvas and outer silhouette as `frame.png`, but the
  frame's central window is filled: the complete card silhouette is solid opaque white
  and everything outside the card is transparent. Preserve antialiasing only on the
  outer contour. The mask is not part of the visual back-to-front composite and must not
  contain artwork, frame colors, holes, gradients, or semi-transparent pixels away from
  the outer edge.
- `card-back.png` contains the complete visible reverse-side design. Its alpha channel
  must be byte-for-byte identical to `mask.png`: the whole card is visible and the area
  outside the card is transparent. It is a flip-side asset, not part of the front
  back-to-front composite.

Do not create an empty optional layer. The three required front layers, mask, and card back are always present. The validator also produces `layer-manifest.json` and `composite-preview.png`; these are QA artifacts, not additional depth layers.

## Workflow

1. Resolve the front and card-back source images. Prefer project-local files supplied by the user or a matching `*-card.png` and `*-card-back.png` pair from `collectible-card-prompt`. If the front is known but no matching back can be resolved, ask for one concise back-image path or attachment; do not silently invent a different card back.
2. Inspect both sources with `view_image` before editing. For the front, identify the visible boundaries, occlusion order, and whether rear or foreground decorations genuinely exist. For the back, verify that it is a straight-on single-card reverse design rather than a second front.
3. Create a fresh job directory. If the intended directory exists, append `-2`, `-3`, and so on. Normalize the source without cropping:

   `python3 <skill-directory>/scripts/normalize_layer.py <source> <job>/source.png --mode opaque`

4. Normalize the back source without cropping to a temporary aligned plate:

   `python3 <skill-directory>/scripts/normalize_layer.py <back-source> <job>/card-back-source.png --mode opaque`

5. Write a short split plan in `<job>/split-plan.md`: both source paths, chosen 3-5 front layers, visible ownership of ambiguous elements, which hidden front regions require reconstruction, and confirmation that the back is an independent reverse-side design.
6. Read [references/prompt-recipes.md](references/prompt-recipes.md), then read and follow the available `imagegen` skill before calling an image-generation tool.
7. Use the built-in `image_gen` tool. Treat `source.png` as the edit target and common reference for every front layer. Generate each requested front layer in a separate call; do not derive later layers from earlier generated layers because drift compounds.
8. For `background.png`, request an opaque, complete plate with subject, decorations, frame, plaque, text, and their shadows removed. Inpaint all revealed regions so no silhouette-shaped hole or ghost remains.
9. For transparent front layers, request genuine transparency. Preserve the object's visible geometry and exact position. Reconstruct only portions hidden by higher layers, extending them enough to remain continuous during modest parallax; do not invent an unrelated pose or a full body when the source is a portrait.
10. Normalize each returned file into the job directory:

   - background: `python3 <skill-directory>/scripts/normalize_layer.py <generated> <job>/background.png --mode opaque`
   - all other layers: `python3 <skill-directory>/scripts/normalize_layer.py <generated> <job>/<layer>.png --mode rgba`

   Then derive the mask deterministically from the normalized frame without an image-generation call:

   `python3 <skill-directory>/scripts/create_mask_from_frame.py <job>/frame.png <job>/mask.png`

   Apply that exact mask alpha to the normalized back design:

   `python3 <skill-directory>/scripts/apply_mask_to_card_back.py <job>/card-back-source.png <job>/mask.png <job>/card-back.png`

11. Inspect every normalized front layer and `card-back.png` with `view_image`. Perform at most one targeted image-generation correction per failed front layer. If the card-back artwork itself is incorrect, report the supplied back design as the blocker rather than redesigning it without permission.
12. Validate and assemble:

   `python3 <skill-directory>/scripts/validate_layers.py <job>`

13. Inspect `composite-preview.png` against `source.png`, and inspect `card-back.png` against `card-back-source.png`. Reject scale drift, moved edges, double subjects, background ghosts, holes revealed beneath occluders, missing frame pieces, clipped back artwork, or matte contamination. Passing numeric validation alone is not proof of visual fidelity.

## Reconstruction rules

- Preserve the visible source pixels and identity as closely as the image tool permits.
- Reconstruct hidden background across the entire plate, including beneath the subject and frame. The background must not contain a faint duplicate subject, frame, text, or contact shadow from removed layers.
- Extend the subject underneath the frame and foreground decoration by a plausible 48-96 pixels where useful for parallax. Continue armor, hair, clothing, limbs, props, and effects consistently with visible geometry.
- Reconstruct only contextually supported hidden subject regions. Do not hallucinate a complete lower body from a bust portrait.
- Complete rear and foreground ornaments behind their occluders when movement could expose a cut edge. Keep each ornament in its original coordinates.
- The frame layer owns the visible top frame, bottom plaque, crest, and inseparable embedded ornaments. It must not include the background or subject.
- The mask owns no visible artwork. It is a white-alpha silhouette for runtime effects: same outer contour as the frame/card, filled across the central window, transparent outside, and excluded from the composite preview.
- The card back owns the entire reverse-side design and no front artwork. It uses exactly the mask alpha, remains excluded from the front composite preview, and must never be cropped to its visible bounds.
- Keep shadows with the layer that casts them only when they are intrinsic and useful. Remove baked cross-layer shadows that would remain behind after the casting layer moves.
- Never trim a layer to content bounds, shift it to center, or independently rescale it.

## Failure handling

- A painted checkerboard is not transparency. Regenerate or repair the confirmed matte; never erase all white or gray pixels globally because they may be real artwork.
- If a transparent layer has no alpha variation, is empty, or contains unrelated scenery, reject it. Reject `card-back.png` if its alpha differs from `mask.png` at even one pixel.
- If the built-in image tool fails, keep `source.png` and `split-plan.md`, report the failed layer, and mention that CLI/API fallback requires explicit user approval and a configured key. Do not silently change providers.
- If geometry cannot be aligned after one targeted correction, report the affected layer instead of claiming an exact extraction.

## Final response

Report the job directory, the 3-5 front visual layer links in depth order, the required mask and card-back links, the manifest, and the front composite preview. State which front layers required generative reconstruction and whether validation passed. Preview both the front composite and card back inline; preview the mask only when it helps explain a defect.
