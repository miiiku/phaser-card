# Image-generation prompt recipes

Use the normalized `source.png` as Image 1 and label it `edit target and alignment reference` in every call. Preserve canvas registration, camera, perspective, scale, lighting, palette, brushwork, and visible geometry.

## Background

```text
Edit Image 1 into the complete background plate for a layered card asset. Remove the subject, rear and foreground decorations, card frame, plaque, crest, text, symbols, and all shadows cast by removed layers. Reconstruct every hidden region as a plausible seamless continuation of the visible background. Keep the exact 1024x1536 full-canvas composition and original background perspective. Output an opaque image with no transparency, no holes, no ghost silhouette, no duplicated character, and no remaining frame pixels. Change only what is necessary to reveal a continuous background.
```

## Rear decoration

```text
Extract only the decoration that sits behind the main subject in Image 1. Preserve its exact position, scale, color, lighting, and shape. Complete small sections hidden by the subject when needed for modest parallax movement. Remove the subject, foreground decoration, frame, plaque, and background. Output a genuine transparent RGBA PNG on the full 1024x1536 canvas; keep all unused pixels transparent. Do not crop or center the decoration, do not add scenery, and do not paint a checkerboard.
```

## Subject

```text
Extract only the main subject and the props or effects that intrinsically move with it from Image 1. Preserve identity, pose, facial features, proportions, exact position, scale, palette, lighting, and visible silhouette. Remove the background, detached decorations, and card frame. Plausibly reconstruct only the subject portions hidden by the frame or foreground ornament, continuing visible anatomy, armor, clothing, hair, weapon, and effects for 48-96 pixels beneath the former occluder so modest parallax reveals no holes. Do not invent a full body from a portrait or change the pose. Output a genuine transparent RGBA PNG on the full 1024x1536 canvas with all unused pixels transparent, no checkerboard, no matte fringe, and no scenery.
```

## Foreground decoration

```text
Extract only the detached decorative effects that sit in front of the subject in Image 1. Preserve exact position, scale, palette, lighting, particle count, and curve direction. Complete short hidden continuations only when needed for parallax. Remove the subject, rear decoration, background, and frame. Output a genuine transparent RGBA PNG on the full 1024x1536 canvas; keep unused pixels transparent. Do not crop, center, multiply, or redesign the decoration, and do not paint a checkerboard.
```

## Frame

```text
Extract only the topmost card frame, bottom plaque, crest, and inseparable embedded card furniture from Image 1. Preserve their exact geometry, position, scale, material, color, highlights, and inner-edge shadow. Remove all central artwork, subject, background, and detached effects. Output a genuine transparent RGBA PNG on the full 1024x1536 canvas with the entire central window and outer unused regions transparent. Do not crop, recenter, thicken, redesign, or regenerate the frame, and do not paint a checkerboard.
```

## Targeted correction suffix

Append this when correcting one failed layer:

```text
Change only this confirmed defect: <defect>. Preserve every already-correct pixel, the exact full-canvas registration, layer ownership, transparency behavior, and all visible source geometry. Do not redesign or move the layer.
```
