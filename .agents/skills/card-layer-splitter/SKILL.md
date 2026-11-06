---
name: card-layer-splitter
description: "Split a flattened collectible-card concept image into 3-5 program-ready, registration-aligned 1024x1536 PNG layers: reconstructed opaque background, optional rear decoration, repaired transparent subject, optional foreground decoration, and transparent top frame. Use when a card—especially one produced by collectible-card-prompt—must become editable or parallax-ready art assets; do not use for ordinary image cropping or when a native layered source already exists."
---

# Card Layer Splitter

Convert one flattened card image into a small aligned layer stack for runtime compositing. Preserve the visible card design while reconstructing only artwork hidden by higher layers. Hidden pixels are an inpainted approximation, never an exact recovery.

## Deliverable contract

Create a new non-overwriting job directory at `draft/<source-stem>-layers/`. Read [references/layer-contract.md](references/layer-contract.md) before planning the split.

Every layer file must:

- be a PNG exactly 1024x1536 pixels;
- use the same canvas origin, scale, and registration as the normalized source;
- keep the full canvas even when the visible object is small;
- leave unused pixels transparent rather than cropping to the object's bounding box;
- preserve soft edge alpha without a painted checkerboard, white halo, or matte fringe.

Produce 3-5 layer assets in this back-to-front order:

1. `background.png` — required, fully opaque, and reconstructed behind every removed subject, decoration, and frame region;
2. `rear-decoration.png` — optional transparent RGBA for motifs behind the subject;
3. `subject.png` — required transparent RGBA, preserving the visible subject and plausibly extending portions hidden by the frame or foreground decoration;
4. `foreground-decoration.png` — optional transparent RGBA for effects or ornaments in front of the subject;
5. `frame.png` — required transparent RGBA containing only the top card frame, plaque, crest, and inseparable card furniture.

Do not create an empty optional layer. The three required layers are always present. The validator also produces `layer-manifest.json` and `composite-preview.png`; these are QA artifacts, not additional depth layers.

## Workflow

1. Resolve the source image. Prefer a project-local file supplied by the user or the matching final PNG from `collectible-card-prompt`. If no specific image can be resolved, ask for one concise path or attachment.
2. Inspect the source with `view_image` before editing. Identify the visible boundaries, occlusion order, and whether rear or foreground decorations genuinely exist.
3. Create a fresh job directory. If the intended directory exists, append `-2`, `-3`, and so on. Normalize the source without cropping:

   `python3 <skill-directory>/scripts/normalize_layer.py <source> <job>/source.png --mode opaque`

4. Write a short split plan in `<job>/split-plan.md`: source path, chosen 3-5 layers, visible ownership of ambiguous elements, and which hidden regions require reconstruction.
5. Read [references/prompt-recipes.md](references/prompt-recipes.md), then read and follow the available `imagegen` skill before calling an image-generation tool.
6. Use the built-in `image_gen` tool. Treat `source.png` as the edit target and common reference for every layer. Generate each requested layer in a separate call; do not derive later layers from earlier generated layers because drift compounds.
7. For `background.png`, request an opaque, complete plate with subject, decorations, frame, plaque, text, and their shadows removed. Inpaint all revealed regions so no silhouette-shaped hole or ghost remains.
8. For transparent layers, request genuine transparency. Preserve the object's visible geometry and exact position. Reconstruct only portions hidden by higher layers, extending them enough to remain continuous during modest parallax; do not invent an unrelated pose or a full body when the source is a portrait.
9. Normalize each returned file into the job directory:

   - background: `python3 <skill-directory>/scripts/normalize_layer.py <generated> <job>/background.png --mode opaque`
   - all other layers: `python3 <skill-directory>/scripts/normalize_layer.py <generated> <job>/<layer>.png --mode rgba`

10. Inspect every normalized layer with `view_image`. Perform at most one targeted image-generation correction per failed layer. Correct only the observed defect and restate all invariants.
11. Validate and assemble:

   `python3 <skill-directory>/scripts/validate_layers.py <job>`

12. Inspect `composite-preview.png` against `source.png`. Reject scale drift, moved edges, double subjects, background ghosts, holes revealed beneath occluders, missing frame pieces, or matte contamination. Passing numeric validation alone is not proof of visual fidelity.

## Reconstruction rules

- Preserve the visible source pixels and identity as closely as the image tool permits.
- Reconstruct hidden background across the entire plate, including beneath the subject and frame. The background must not contain a faint duplicate subject, frame, text, or contact shadow from removed layers.
- Extend the subject underneath the frame and foreground decoration by a plausible 48-96 pixels where useful for parallax. Continue armor, hair, clothing, limbs, props, and effects consistently with visible geometry.
- Reconstruct only contextually supported hidden subject regions. Do not hallucinate a complete lower body from a bust portrait.
- Complete rear and foreground ornaments behind their occluders when movement could expose a cut edge. Keep each ornament in its original coordinates.
- The frame layer owns the visible top frame, bottom plaque, crest, and inseparable embedded ornaments. It must not include the background or subject.
- Keep shadows with the layer that casts them only when they are intrinsic and useful. Remove baked cross-layer shadows that would remain behind after the casting layer moves.
- Never trim a layer to content bounds, shift it to center, or independently rescale it.

## Failure handling

- A painted checkerboard is not transparency. Regenerate or repair the confirmed matte; never erase all white or gray pixels globally because they may be real artwork.
- If a transparent layer has no alpha variation, is empty, or contains unrelated scenery, reject it.
- If the built-in image tool fails, keep `source.png` and `split-plan.md`, report the failed layer, and mention that CLI/API fallback requires explicit user approval and a configured key. Do not silently change providers.
- If geometry cannot be aligned after one targeted correction, report the affected layer instead of claiming an exact extraction.

## Final response

Report the job directory, the 3-5 layer links in depth order, the manifest, and the composite preview. State which layers required generative reconstruction and whether validation passed. Preview the composite inline; preview individual layers only when it helps explain a defect.
