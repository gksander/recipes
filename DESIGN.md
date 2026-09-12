---
version: alpha
name: Sunny Pantry
description: A cheerful, editorial recipe product that makes healthy cooking feel easy, personal, and a little playful.
colors:
  primary: "#7557E8"
  primary-strong: "#6042D4"
  primary-soft: "#EEEAFF"
  ink: "#20212A"
  muted-ink: "#696B76"
  canvas: "#F8F8FC"
  surface: "#FFFFFF"
  surface-muted: "#F1F1F5"
  line: "#E6E6ED"
  lemon: "#FFD84D"
  mint: "#DDF8E8"
  mint-ink: "#168456"
  coral: "#FFE2DE"
  coral-ink: "#D84A3B"
typography:
  display:
    fontFamily: 'ui-rounded, "Nunito Sans", "Avenir Next", system-ui, sans-serif'
    fontSize: 2.5rem
    fontWeight: "800"
    lineHeight: "1.05"
    letterSpacing: "-0.035em"
  heading:
    fontFamily: 'ui-rounded, "Nunito Sans", "Avenir Next", system-ui, sans-serif'
    fontSize: 1.5rem
    fontWeight: "800"
    lineHeight: "1.2"
    letterSpacing: "-0.02em"
  body:
    fontFamily: 'ui-rounded, "Nunito Sans", "Avenir Next", system-ui, sans-serif'
    fontSize: 1rem
    fontWeight: "500"
    lineHeight: "1.5"
  label:
    fontFamily: 'ui-rounded, "Nunito Sans", "Avenir Next", system-ui, sans-serif'
    fontSize: 0.875rem
    fontWeight: "700"
    lineHeight: "1.2"
rounded:
  xs: 8px
  sm: 12px
  md: 18px
  lg: 24px
  xl: 32px
  pill: 9999px
spacing:
  1: 4px
  2: 8px
  3: 12px
  4: 16px
  5: 20px
  6: 24px
  8: 32px
  10: 40px
  12: 48px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 12px
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
  filter-chip:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: 10px
  filter-chip-selected:
    backgroundColor: "{colors.lemon}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: 10px
---

## Overview

Sunny Pantry is a warm, capable recipe companion: a lively desktop workspace that makes browsing and planning meals feel optimistic rather than clinical. It borrows the **mood** of the supplied reference—soft lavender emphasis, bright yellow highlights, friendly rounded forms, generous white surfaces, and food photography—but never reproduces its branding, copy, or interface verbatim.

The visual hierarchy should be unmistakable at a glance: a concise global header, a clear browsing/filter area, a celebratory featured moment, and recipe cards led by large, appetizing imagery. Dense recipe data is organized into quiet chips and metadata rather than competing with titles or photos.

## Colors

- **Purple is the brand action color.** Use `primary` for the current navigation state, primary calls to action, links on white, and selected controls. Use `primary-soft` only for large, low-emphasis washes.
- **Lemon is a joyful highlight, not a second primary.** Reserve it for the active dietary/filter chip, small status accents, or occasional featured callouts.
- **Ink and muted ink carry nearly all typography.** Do not use purple for ordinary paragraphs.
- **Canvas is the app background; surface is for raised panels.** Keep cards and sidebars white, separated mainly through spacing, a fine `line`, and a soft shadow.
- **Mint and coral are semantic.** Mint communicates easy/success/positive nutrition; coral communicates warnings, difficulty, or small count badges. Never rely on color alone—pair each with a label or icon.

## Typography

Use the rounded sans stack throughout. It should feel friendly and modern, but remain compact enough for ingredient names and recipe metadata.

- Use `display` only for a hero or campaign banner; keep it short and punchy.
- Use `heading` for page titles and section headers. Recipe titles may use it at a smaller responsive size and should clamp to two lines.
- Use `body` for descriptions and helper text. Keep descriptions muted and limited to two or three lines in cards.
- Use `label` for buttons, nav tabs, filter chips, counts, and compact metadata. Labels are sentence case, never all caps.

## Layout

The desktop canvas is an airy application shell, not a marketing landing page. Center the content in a wide maximum container (about 1440px) with 24–32px outer gutters.

- On large screens, use a persistent 280–320px filter rail and a fluid results column. The filter rail should read as one white, rounded panel.
- Keep header controls in a single horizontal row, with pill-shaped navigation items. Put utility actions at the far right.
- Use a 12-column grid for editorial content. Recipe grids should use 3–5 responsive columns; card widths should not become too narrow for useful metadata.
- Separate major regions with 32–48px of space. Inside cards, use the 12–20px range. Avoid hairline gaps and crowded chrome.
- On small screens, collapse the filter rail into a sheet/drawer and allow the recipe grid to become one or two columns. Never merely scale down the desktop rail.

## Elevation & Depth

Depth is soft and friendly: broad, low-opacity shadows and clean white surfaces. Use a subtle shadow for regular cards and a slightly stronger shadow plus a small upward translation for a hovered card. Avoid heavy borders, dark drop shadows, glassmorphism, gradients behind every component, or more than two overlapping elevations in one view.

## Shapes

The radius scale is deliberately generous. Cards use `lg`; primary panels and banners use `xl`; controls and navigation use `pill`. Images inside cards use the same radius as the parent, slightly inset, or a compatible inner radius. Avoid sharp rectangular controls.

Food imagery is large, bright, and naturally cropped. Use a 4:3 or 16:10 image frame in cards with `object-fit: cover`; favor overhead or close, ingredient-rich photographs. Do not use generic abstract illustrations in place of recipe photography.

## Components

- **App header:** white, compact, and horizontally organized. The active tab is a dark-ink pill with white text or a clearly selected purple state; inactive tabs sit on `surface-muted`.
- **Feature banner:** a single lavender/lilac block with one playful food illustration or cutout, a short headline, optional supporting benefits, and a pill CTA. One banner per major view.
- **Recipe card:** white, rounded, image-first, and calm. Order content as image → title → two-line description → compact metadata chips → difficulty/status + light engagement counts. Do not put every datum in a badge.
- **Filter rail:** group controls beneath clear headings; selected filters use lemon with ink text. Expand/collapse indicators are quiet and consistent.
- **Tags and metadata:** soft gray chips for neutral metadata; semantic mint/coral only for meaning. Keep icons small and aligned with the text baseline.
- **Buttons:** primary actions are purple pill buttons. Secondary actions are white or soft-gray pill buttons with ink text and a visible border. Icon-only buttons must have an accessible name and a minimum 44px hit target.

## Do's and Don'ts

Do use real food photography, warm editorial spacing, rounded surfaces, readable labels, and one clear primary action per area.

Do let a few playful accents—an illustration, a lemon filter, a tiny badge—add delight while the rest of the interface stays calm.

Don't copy the reference product’s logo, mascot, wording, navigation labels, or exact layouts. Treat the image as stylistic direction only.

Don't turn every element purple or yellow, stack pills inside pills, use excessive outlines, or give each card a different treatment. Consistency is what makes the playful direction feel polished.
