---
name: collectible-card-prompt
description: Generate a straight-on fantasy collectible card from a user-supplied subject, composed so its depth layers (background, rear decoration, subject, foreground decoration, frame) stay visually separable and easy to cut out for direct in-game asset extraction, then normalize the final image to exactly 1024x1536 pixels at a 2:3 ratio and save both the image and reproducible prompt under the project's draft directory. Use when the user wants this card format created as an actual image; do not use for general character art or unrelated card layouts.
---

# Collectible Card Generator

Turn a short subject input into a finished collectible-card image plus its reproducible prompt record. Preserve the subject and any explicit user details. Infer missing visual details without asking unless the user requests choices.

## Extraction-friendly layered composition

The final image is a single flattened PNG, not a layered file. "Extraction-friendly"
therefore means the composition is drawn so that a human or a script can later cut each
depth plane out with clean, predictable boundaries. Enforce all of the following:

- Each of the five depth planes reads as a distinct visual band with enough contrast in
  value, hue, or edge sharpness that its boundary can be traced without guesswork.
- The subject's silhouette is closed, crisp, and fully inside the central window; no
  background, decoration, or frame element intrudes into it, and no part of the subject
  bleeds into another layer.
- Layers do not share ambiguous semi-transparent gradients across their boundaries.
  Soft glow, mist, or atmospheric fade may exist *within* a layer, but must not be the
  only thing separating two layers.
- Rear and foreground decorations stay spatially detached from the subject: they overlap
  the subject's silhouette only where clearly in front, never fused into its outline.
- The frame is a clean closed shape with hard, uniform edges against the neutral margin,
  so it can be masked out reliably.
- No cross-layer texture, noise, or painterly strokes that visually weld two planes
  together.

## Fixed composition

Keep these invariants in every generated prompt. They are also what makes the layers extraction-friendly per the section above. 

- One complete card on a strict 2:3 portrait canvas, front view, perfectly straight-on, with no tilt or perspective rotation. The required final file is exactly 1024 pixels wide by 1536 pixels high.
- The card fills the image with a small, even margin on a plain neutral background. Nothing except the card appears in the scene.
- Five visually separable depth planes, ordered from back to front:
  1. `background layer`: a simple abstract, atmospheric, or softly painted backdrop with no floor plane, terrain, pedestal, horizon line, or architecture touching the subject;
  2. `rear decoration layer (optional)`: a restrained halo, gear ring, elemental arc, rune, cloud, or thematic motif clearly behind the subject and not fused into its silhouette;
  3. `subject layer`: an isolated hero portrait, normally bust-length, waist-up, upper-body, or floating, with a clean readable silhouette and no visible ground contact;
  4. `foreground decoration layer (optional)`: a few restrained sparks, shards, ribbons, wisps, leaves, gears, or thematic accents in front of the subject without obscuring its defining features;
  5. `topmost card-frame layer`: the slim frame and bottom plaque sit above every internal layer, visibly mask the central window, and cast a tight shadow inward.
- The card frame is always the topmost visible layer. The background, both optional decoration layers, the subject, props, and all effects are clipped beneath it and remain visible only inside the central window. Nothing appears over the frame.
- The recessed stack reads as separate planes beneath the frame, with ambient occlusion at the inner edge. The frame and bottom plaque remain delicate overlays, never a bulky box.
- No text, numbers, icons, watermark, logo, UI, stat panel, or extra decoration unless explicitly requested.

Use spatially explicit wording. Repeat both the no-ground-contact rule and the topmost-frame containment rule near the subject description and near the end of the Main Prompt because these are the most failure-prone requirements.

## Adapt the subject

Expand the supplied subject into a concise art direction:

- Identify its category and silhouette: humanoid, creature, dragon, construct, spirit, vehicle, or other.
- Default humanoids and humanoid constructs to a centered chest-up or waist-up hero portrait. The lower torso may end cleanly below the visible composition or be softly concealed by foreground decoration; do not show feet or a standing pose.
- Default dragons, large creatures, quadrupeds, vehicles, and non-humanoid machines to an upper-body portrait, compact floating presentation, or isolated emblematic silhouette. Keep wings, tails, limbs, weapons, and appendages compact and inside the window.
- Use a full-body composition only when the user explicitly requests one. Even then, prefer suspension, levitation, mist, or a neutral vignette instead of feet touching a floor.
- Keep the subject visually independent from the background: no ground plane, no platform, no pedestal, no footprint, no contact shadow, no cast shadow connecting it to terrain, and no scenery crossing or merging with its silhouette.
- Infer one signature prop or effect only when appropriate. It must remain inside the window.
- Use rear and foreground decorations only when they improve depth. Keep them sparse, separately readable, and easy to distinguish from both the subject and background.
- Derive a coherent palette, frame material, inlay motif, crest, and restrained filigree from the subject. Examples: frost suggests blue, silver, ice crystals; fire suggests crimson, ember orange, dark iron, flame motifs; machinery suggests gunmetal, brass, rivets, restrained cyan energy.
- Keep the overall mood mysterious and premium, with painterly fantasy collectible-card concept art, soft studio lighting, subtle rim light on frame edges, high detail, and clean composition.
- If the user supplies colors, era, mood, pose, material, or style, those details override inferred choices unless they conflict with the fixed composition.

Do not introduce a named character, story, faction, rarity, card title, or gameplay mechanics that the user did not request.

## Keep a card set consistent

When the user requests multiple cards in one style or set, keep the card frame identical across all cards. Repeat one exact master-frame description in every prompt, generate the first card as the visual master, then use that saved first card as the frame-and-style reference for every later card. Preserve the same frame geometry, materials, colors, corner pieces, bottom plaque, crest, window shape, margins, and shadows; change only the layers inside the central window unless the user requests otherwise.

## Compose the generation prompt

Write the document labels in the user's language, but write the image prompts in natural English unless the user asks for another language. The saved document must contain exactly:

1. `Subject Understanding` — one short sentence summarizing the inferred visual direction.
2. `Main Prompt` — one copy-ready paragraph in a fenced text block.
3. `Negative Prompt` — one copy-ready comma-separated paragraph in a fenced text block.

The Main Prompt should describe the card as one coherent image while explicitly naming `background layer`, `rear decoration layer (optional)`, `subject layer`, `foreground decoration layer (optional)`, and `topmost card-frame layer` so the stacking order is unambiguous.

Always state `strict 2:3 portrait aspect ratio, final delivery 1024x1536 pixels` near the beginning of the Main Prompt. Treat this as composition guidance for generation; exact pixels are enforced after generation.

## Save the prompt record

After composing the output, save the complete result as a Markdown file under `draft/` at the current project root. Create `draft/` when it does not exist.

- Use a short lowercase English slug derived from the subject, followed by `-card-prompt.md`, for example `draft/lava-fire-dragon-card-prompt.md`.
- The file must contain the subject understanding, main prompt, and negative prompt in the same format returned to the user.
- Do not overwrite an existing draft. If the target filename exists, append `-2`, `-3`, and so on before `.md`.
- Save this record before image generation so the prompt remains available if generation fails.

Start the negative prompt with the fixed failure exclusions below, then add subject-specific failure modes such as cropped wings, tail crossing the frame, excessive fire, or detached mechanical parts:

`heavy frame, thick border, bulky frame, chunky design, massive banner, heavy ribbon, oversized crest, elements outside the outer edge of the card, anything visible over the card frame, frame behind subject, subject breaking through frame, cropped head, cropped hands, accidental anatomy crop, protruding body parts, effects crossing the frame, standing full-body pose, feet touching ground, visible floor plane, ground contact, platform, pedestal, terrain, horizon line, contact shadow, cast shadow on ground, subject fused with background, scenery crossing subject silhouette, busy environmental scene, merged layers, excessive foreground occlusion, floating props outside the window, background decorations outside the window, extra objects around the card, tilted card, 3D rotation, perspective distortion, flat 2D, text, numbers, watermark, logo, UI, blurry, low resolution, distorted anatomy, extra limbs, extra fingers, cluttered background, photorealistic, anime style, flat shading, excessive, muddy, or misplaced shadow between layers`

When the user requests multiple subjects or variants, generate a separately labeled prompt pair for each while keeping all fixed composition rules identical.

## Generate the image

Image generation is mandatory unless the user explicitly asks for prompt-only output.

1. Read and follow the available `imagegen` skill before calling any image-generation tool.
2. Use the built-in `image_gen` tool in generation mode. Do not use the CLI/API fallback unless the user explicitly requests it after a built-in-tool failure.
3. Classify this asset as `stylized-concept` for a game asset. Send the complete Main Prompt and append the Negative Prompt as an `Avoid:` constraint. Use an opaque background; the neutral margin is part of the image.
4. Generate one image per requested subject or variant. Do not treat multiple distinct subjects as variants of one tool call.
5. Inspect the generated result for the critical invariants below. If one or more clearly fail, perform at most one targeted correction and inspect again:
   - one complete 2:3 portrait card, straight-on and untilted;
   - nothing outside the card except the plain neutral margin;
   - the visible stack reads as background, optional rear decoration, isolated subject, optional foreground decoration, then the topmost frame;
   - the subject is normally half-length, upper-body, or floating, with no feet on a floor, no platform, and no ground or terrain connection;
   - the subject has a clean separable silhouette, and every internal layer is clipped beneath the frame inside the central window;
   - each depth plane has a traceable boundary with enough contrast to be cut out; no two layers are visually welded by cross-layer texture, gradient, or glow;
   - no text, watermark, logo, UI, or unrelated objects.
6. Use the file path returned by the built-in tool as the source for deterministic normalization. Do not assume the built-in tool honored exact pixel dimensions, and do not stretch or crop the image to force the ratio.
7. Run `python3 <skill-directory>/scripts/normalize_card_image.py <generated-source> <draft-destination.png>`. This scales the image proportionally, samples a neutral padding color from its corners, centers it on a 2:3 canvas, and saves an exact 1024x1536 PNG without cropping card content.
8. Verify the delivered file is exactly 1024x1536 pixels. A different size is a failed deliverable even if the generated composition looks correct.

Never leave a project deliverable only under the tool's default generated-images location.

Name the normalized image with the same subject slug as the prompt record, using `draft/<slug>-card.png`. Never overwrite an existing image; append `-2`, `-3`, and so on before `.png`. Keep the prompt-record and image basenames aligned when both are created in the same run. The normalized PNG is the final deliverable; the unnormalized tool output does not need to be copied into the project.

If the built-in tool fails or returns no usable local artifact, keep the saved prompt record, explain the failure, and mention that the CLI fallback requires explicit user approval and a configured `OPENAI_API_KEY`. Do not claim the image was saved.

## Final response

Keep the response concise and include:

- whether the built-in image-generation path succeeded;
- clickable links to the saved prompt record and final image;
- an inline preview of the final image using its absolute project path;
- confirmation that the delivered PNG is exactly 1024x1536 pixels at 2:3;
- whether an automatic correction was needed.

Do not repeat the full prompts in chat unless the user asks to see them inline.
