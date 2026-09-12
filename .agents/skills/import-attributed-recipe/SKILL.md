---
name: import-attributed-recipe
description: Import a recipe from a supplied web page into this site's EmDash recipe collection, with source attribution and an original AI-generated feature image managed only in EmDash media.
---

# Import an Attributed Recipe

Use this skill when the user supplies a recipe URL and asks to add it to this EmDash site.

## Workflow

1. Read the source page and extract the recipe card: title, yield, prep/cook/rest times, ingredients, instructions, and relevant dietary and meal-type classifications. Preserve ingredient groups and ordered steps in Markdown so EmDash converts them to Portable Text.
2. Use the EmDash MCP tools to inspect the live `recipes` schema before writing. Do not assume the seed file is the live schema.
3. Store the source URL and publisher in `source_url` and `source_name`. Set `review_status` to `experimental` unless the user says the recipe has been tested or vetted.
4. Generate a new, original feature image with the image-generation tool. Do not use or reproduce a source site's photos, logos, packaging, or watermark.
5. Upload the generated image directly to EmDash with `media_upload` (base64 data and descriptive alt text). Do not copy, commit, or reference generated images in `public/`, `src/`, or any other repo directory. Pass the resulting media reference to `featured_image` as `{ id: mediaItem.id, alt }` when creating the recipe.
6. Create the entry with EmDash MCP `content_create`, assign applicable taxonomies, and publish only when the user asks for a published recipe. Verify it afterward with `content_get`: the returned `featured_image.id` must match the uploaded media ID.

## Recipe Fields

For this site, use `servings` for the numeric yield and `yield_unit` for its unit (for example, `18` and `cookies`). Record `prep_minutes`, `cook_minutes`, and `rest_minutes` separately. Total time is derived when needed.

## Guardrails

- Keep source attribution even if the ingredients and method are imported verbatim or closely adapted.
- Never mark an untested imported recipe as `vetted`.
- The media library is the only image store for recipe assets; a local generated-image copy is an error and should be removed once its upload is confirmed.
